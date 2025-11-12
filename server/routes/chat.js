const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const multer = require('multer');
const NotificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

// ==================== CHANNELS ====================

// Get all channels user has access to
router.get('/channels', auth, authorize('chat', 'read'), (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT DISTINCT c.*, 
      u.name as creator_name,
      (SELECT COUNT(*) FROM channel_members cm WHERE cm.channel_id = c.id) as member_count,
      (SELECT COUNT(*) FROM messages m WHERE m.channel_id = c.id AND m.is_deleted = FALSE) as message_count,
      cm.role as user_role,
      cm.last_read_at
    FROM channels c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN channel_members cm ON cm.channel_id = c.id AND cm.user_id = ?
    WHERE (c.is_private = FALSE OR cm.user_id = ?) AND c.is_archived = FALSE
    ORDER BY c.created_at DESC
  `;
  
  db.query(sql, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Get single channel details
router.get('/channels/:id', auth, authorize('chat', 'read'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  
  // Check if user is member of channel
  const checkSql = `
    SELECT 1 FROM channel_members 
    WHERE channel_id = ? AND user_id = ?
  `;
  
  db.query(checkSql, [channelId, userId], (err, checkRows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    // Check if channel is public
    const channelSql = `SELECT is_private FROM channels WHERE id = ?`;
    db.query(channelSql, [channelId], (err, channelRows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!channelRows.length) return res.status(404).json({ success: false, message: 'Channel not found' });
      
      if (channelRows[0].is_private && !checkRows.length) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      const sql = `
        SELECT c.*, 
          u.name as creator_name,
          (SELECT COUNT(*) FROM channel_members cm WHERE cm.channel_id = c.id) as member_count,
          cm.role as user_role
        FROM channels c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN channel_members cm ON cm.channel_id = c.id AND cm.user_id = ?
        WHERE c.id = ?
      `;
      
      db.query(sql, [userId, channelId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!rows.length) return res.status(404).json({ success: false, message: 'Channel not found' });
        
        // Get channel members
        const membersSql = `
          SELECT cm.*, u.name, u.email
          FROM channel_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.channel_id = ?
          ORDER BY cm.joined_at ASC
        `;
        
        db.query(membersSql, [channelId], (err, members) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          rows[0].members = members;
          res.json({ success: true, data: rows[0] });
        });
      });
    });
  });
});

// Create new channel
router.post('/channels', auth, authorize('chat', 'create'), (req, res) => {
  const { name, description, is_private } = req.body;
  const userId = req.user.id;
  
  if (!name) return res.status(400).json({ success: false, message: 'Channel name is required' });
  
  const sql = `
    INSERT INTO channels (name, description, is_private, created_by)
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(sql, [name, description || null, is_private || false, userId], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Channel name already exists' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
    
    const channelId = result.insertId;
    
    // Add creator as owner
    const memberSql = `
      INSERT INTO channel_members (channel_id, user_id, role)
      VALUES (?, ?, 'owner')
    `;
    
    db.query(memberSql, [channelId, userId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      // Return created channel
      const getSql = `
        SELECT c.*, u.name as creator_name
        FROM channels c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `;
      
      db.query(getSql, [channelId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, data: rows[0] });
      });
    });
  });
});

// Update channel
router.put('/channels/:id', auth, authorize('chat', 'update'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  const { name, description } = req.body;
  
  // Check if user is owner or admin of channel
  const checkSql = `
    SELECT role FROM channel_members 
    WHERE channel_id = ? AND user_id = ? AND role IN ('owner', 'admin')
  `;
  
  db.query(checkSql, [channelId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows.length) return res.status(403).json({ success: false, message: 'Only channel owners/admins can update' });
    
    const fields = [];
    const params = [];
    
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });
    
    params.push(channelId);
    const sql = `UPDATE channels SET ${fields.join(', ')} WHERE id = ?`;
    
    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Channel updated' });
    });
  });
});

// Archive channel
router.patch('/channels/:id/archive', auth, authorize('chat', 'update'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  
  // Check if user is owner or admin
  const checkSql = `
    SELECT role FROM channel_members 
    WHERE channel_id = ? AND user_id = ? AND role IN ('owner', 'admin')
  `;
  
  db.query(checkSql, [channelId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows.length) return res.status(403).json({ success: false, message: 'Only channel owners/admins can archive' });
    
    const sql = `UPDATE channels SET is_archived = TRUE WHERE id = ?`;
    db.query(sql, [channelId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Channel archived' });
    });
  });
});

// Add member to channel
router.post('/channels/:id/members', auth, authorize('chat', 'create'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  const { user_id: targetUserId } = req.body;
  
  if (!targetUserId) return res.status(400).json({ success: false, message: 'user_id is required' });
  
  // Check if user is owner or admin
  const checkSql = `
    SELECT role FROM channel_members 
    WHERE channel_id = ? AND user_id = ? AND role IN ('owner', 'admin')
  `;
  
  db.query(checkSql, [channelId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows.length) return res.status(403).json({ success: false, message: 'Only channel owners/admins can add members' });
    
    const sql = `
      INSERT INTO channel_members (channel_id, user_id, role)
      VALUES (?, ?, 'member')
      ON DUPLICATE KEY UPDATE role = role
    `;
    
    db.query(sql, [channelId, targetUserId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Member added' });
    });
  });
});

// Remove member from channel
router.delete('/channels/:id/members/:memberId', auth, authorize('chat', 'update'), (req, res) => {
  const channelId = req.params.id;
  const memberId = req.params.memberId;
  const userId = req.user.id;
  
  // Check if user is owner or admin, or removing themselves
  const checkSql = `
    SELECT role FROM channel_members 
    WHERE channel_id = ? AND user_id = ? AND role IN ('owner', 'admin')
  `;
  
  db.query(checkSql, [channelId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    const canRemove = rows.length > 0 || parseInt(memberId) === userId;
    if (!canRemove) return res.status(403).json({ success: false, message: 'Permission denied' });
    
    const sql = `DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?`;
    db.query(sql, [channelId, memberId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Member removed' });
    });
  });
});

// ==================== MESSAGES ====================

// Get messages in channel
router.get('/channels/:id/messages', auth, authorize('chat', 'read'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  const { limit = 50, offset = 0, before_id } = req.query;
  
  // Check if user is member
  const checkSql = `SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?`;
  const channelSql = `SELECT is_private FROM channels WHERE id = ?`;
  
  db.query(channelSql, [channelId], (err, channelRows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!channelRows.length) return res.status(404).json({ success: false, message: 'Channel not found' });
    
    if (channelRows[0].is_private) {
      db.query(checkSql, [channelId, userId], (err, checkRows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!checkRows.length) return res.status(403).json({ success: false, message: 'Access denied' });
        fetchMessages();
      });
    } else {
      fetchMessages();
    }
  });
  
  function fetchMessages() {
    let sql = `
      SELECT m.*, 
        u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM message_threads mt WHERE mt.message_id = m.id AND mt.is_deleted = FALSE) as thread_count,
        (SELECT COUNT(*) FROM message_reactions mr WHERE mr.message_id = m.id) as reaction_count,
        CASE WHEN (SELECT COUNT(*) FROM pinned_messages pm WHERE pm.message_id = m.id AND pm.channel_id = ?) > 0 THEN 1 ELSE 0 END as is_pinned,
        (SELECT status FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as message_status,
        (SELECT delivered_at FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as delivered_at,
        (SELECT read_at FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as read_at
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.is_deleted = FALSE
    `;
    const params = [channelId, userId, userId, userId, channelId];
    
    if (before_id) {
      sql += ` AND m.id < ?`;
      params.push(before_id);
    }
    
    sql += ` ORDER BY is_pinned DESC, m.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      // Get reactions for each message
      const messageIds = rows.map(r => r.id);
      if (messageIds.length > 0) {
        const reactionsSql = `
          SELECT mr.*, u.name as user_name
          FROM message_reactions mr
          JOIN users u ON mr.user_id = u.id
          WHERE mr.message_id IN (${messageIds.join(',')})
        `;
        
        db.query(reactionsSql, (err, reactions) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          
          // Group reactions by message
          const reactionsByMessage = {};
          reactions.forEach(r => {
            if (r && r.message_id && r.emoji) {
              if (!reactionsByMessage[r.message_id]) reactionsByMessage[r.message_id] = [];
              reactionsByMessage[r.message_id].push(r);
            }
          });
          
          // Process messages and get recipient statuses for sender's messages
          const processMessages = async () => {
            for (const msg of rows) {
              msg.reactions = reactionsByMessage[msg.id] || [];
              // Remove reaction_count and thread_count from display (they're just for sorting/filtering)
              delete msg.reaction_count;
              delete msg.thread_count;
              
              // For sender's own messages, get recipient statuses
              if (msg.user_id === userId) {
                await new Promise((resolve) => {
                  // Get all recipient statuses for this message
                  const getRecipientStatusesSql = `
                    SELECT user_id, status, delivered_at, read_at FROM message_status 
                    WHERE message_id = ? AND user_id != ?
                  `;
                  db.query(getRecipientStatusesSql, [msg.id, userId], (err, statusRows) => {
                    if (!err && statusRows.length > 0) {
                      // For channel messages, we show the "best" status (read > delivered > sent)
                      const hasRead = statusRows.some(s => s.status === 'read');
                      const hasDelivered = statusRows.some(s => s.status === 'delivered');
                      
                      if (hasRead) {
                        msg.recipient_status = 'read';
                        const readStatus = statusRows.find(s => s.status === 'read');
                        msg.recipient_read_at = readStatus?.read_at;
                      } else if (hasDelivered) {
                        msg.recipient_status = 'delivered';
                        const deliveredStatus = statusRows.find(s => s.status === 'delivered');
                        msg.recipient_delivered_at = deliveredStatus?.delivered_at;
                      } else {
                        msg.recipient_status = 'sent';
                      }
                    } else {
                      msg.recipient_status = 'sent';
                    }
                    resolve();
                  });
                });
              } else {
                // Mark as delivered when message is fetched (if not already delivered/read)
                if (msg.message_status === 'sent' || !msg.message_status) {
                  const updateDeliveredSql = `
                    INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at)
                    VALUES (?, NULL, ?, 'delivered', NOW())
                    ON DUPLICATE KEY UPDATE status = 'delivered', delivered_at = COALESCE(delivered_at, NOW())
                  `;
                  db.query(updateDeliveredSql, [msg.id, userId], (err) => {
                    if (err) console.error('Error updating message status to delivered:', err);
                  });
                  msg.message_status = 'delivered';
                }
              }
            }
            
            res.json({ success: true, data: rows.reverse() }); // Reverse to show oldest first
          };
          
          processMessages();
        });
      } else {
        res.json({ success: true, data: [] });
      }
    });
  }
});

// Send message to channel
router.post('/channels/:id/messages', auth, authorize('chat', 'create'), upload.single('file'), (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.id;
  const { content, parent_message_id } = req.body;
  const file = req.file;
  
  // Check if user is member
  const checkSql = `SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?`;
  const channelSql = `SELECT is_private FROM channels WHERE id = ?`;
  
  db.query(channelSql, [channelId], (err, channelRows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!channelRows.length) return res.status(404).json({ success: false, message: 'Channel not found' });
    
    if (channelRows[0].is_private) {
      db.query(checkSql, [channelId, userId], (err, checkRows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!checkRows.length) return res.status(403).json({ success: false, message: 'Access denied' });
        createMessage();
      });
    } else {
      // Auto-add to public channel if not member
      const addMemberSql = `
        INSERT IGNORE INTO channel_members (channel_id, user_id, role)
        VALUES (?, ?, 'member')
      `;
      db.query(addMemberSql, [channelId, userId], () => {
        createMessage();
      });
    }
  });
  
  function createMessage() {
    if (!content && !file) {
      return res.status(400).json({ success: false, message: 'Content or file is required' });
    }
    
    const messageType = file ? 'file' : 'text';
    const sql = `
      INSERT INTO messages (channel_id, user_id, content, message_type, parent_message_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
      db.query(sql, [channelId, userId, content || '', messageType, parent_message_id || null], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      const messageId = result.insertId;
      
      // Create message status entries for all channel members (except sender) - status: sent
      const notifyMembersSql = `
        SELECT user_id FROM channel_members 
        WHERE channel_id = ? AND user_id != ?
      `;
      db.query(notifyMembersSql, [channelId, userId], async (err, members) => {
        if (!err && members.length > 0) {
          // Insert status entries for all members
          const statusValues = members.map(m => `(${messageId}, NULL, ${m.user_id}, 'sent', NULL, NULL)`).join(',');
          const statusSql = `
            INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at, read_at)
            VALUES ${statusValues}
          `;
          db.query(statusSql, (err) => {
            if (err) console.error('Error creating message status:', err);
          });
        }
      });
      
      // Create notifications for channel members (except sender)
      db.query(notifyMembersSql, [channelId, userId], async (err, members) => {
        if (!err && members && members.length > 0) {
          const channelNameSql = `SELECT name FROM channels WHERE id = ?`;
          db.query(channelNameSql, [channelId], async (err, channelRows) => {
            if (!err && channelRows.length > 0) {
              const channelName = channelRows[0].name;
              const senderNameSql = `SELECT name FROM users WHERE id = ?`;
              db.query(senderNameSql, [userId], async (err, senderRows) => {
                if (!err && senderRows.length > 0) {
                  const senderName = senderRows[0].name;
                  const messagePreview = content ? (content.length > 50 ? content.substring(0, 50) + '...' : content) : '📎 File attachment';
                  
                  // Create notification for each member
                  for (const member of members) {
                    try {
                      await NotificationService.createNotification({
                        user_id: member.user_id,
                        type: 'chat_message',
                        title: `New message in #${channelName}`,
                        message: `${senderName}: ${messagePreview}`,
                        entity_type: 'channels',
                        entity_id: channelId,
                        related_user_id: userId,
                        priority: 'medium'
                      });
                    } catch (notifErr) {
                      console.error('Error creating chat notification:', notifErr);
                    }
                  }
                }
              });
            }
          });
        }
      });
      
      // If file uploaded, create attachment
      if (file) {
        const attachmentSql = `
          INSERT INTO message_attachments (message_id, file_name, file_path, file_type, file_size, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const filePath = `/uploads/chat/${file.filename}`;
        db.query(attachmentSql, [messageId, file.originalname, filePath, file.mimetype, file.size, userId], (err) => {
          if (err) console.error('Error creating attachment:', err);
        });
      }
      
      // Get created message with user info and status
      const getSql = `
        SELECT m.*, u.name as user_name, u.email as user_email,
          (SELECT status FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as message_status,
          (SELECT delivered_at FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as delivered_at,
          (SELECT read_at FROM message_status WHERE message_id = m.id AND user_id = ? LIMIT 1) as read_at
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `;
      
      db.query(getSql, [userId, userId, userId, messageId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        // Mark as delivered for sender (since they sent it)
        const senderStatusSql = `
          INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at)
          VALUES (?, NULL, ?, 'delivered', NOW())
          ON DUPLICATE KEY UPDATE status = 'delivered', delivered_at = NOW()
        `;
        db.query(senderStatusSql, [messageId, userId]);
        
        // Update last_read_at
        const updateReadSql = `
          UPDATE channel_members 
          SET last_read_at = NOW() 
          WHERE channel_id = ? AND user_id = ?
        `;
        db.query(updateReadSql, [channelId, userId]);
        
        const message = rows[0];
        message.message_status = 'sent'; // For sender, it's always sent
        res.status(201).json({ success: true, data: message });
      });
    });
  }
});

// Update message (channel or DM)
router.put('/messages/:id', auth, authorize('chat', 'update'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { content, is_dm } = req.body;
  
  if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
  
  // Check if message is DM or channel message
  if (is_dm) {
    // Direct message
    const checkSql = `SELECT user_id FROM direct_message_messages WHERE id = ?`;
    db.query(checkSql, [messageId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Message not found' });
      if (rows[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Permission denied' });
      
      const sql = `UPDATE direct_message_messages SET content = ?, is_edited = TRUE WHERE id = ?`;
      db.query(sql, [content, messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Message updated' });
      });
    });
  } else {
    // Channel message
    const checkSql = `SELECT user_id FROM messages WHERE id = ?`;
    db.query(checkSql, [messageId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Message not found' });
      if (rows[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Permission denied' });
      
      const sql = `UPDATE messages SET content = ?, is_edited = TRUE WHERE id = ?`;
      db.query(sql, [content, messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Message updated' });
      });
    });
  }
});

// Delete message (soft delete) - channel or DM
router.delete('/messages/:id', auth, authorize('chat', 'delete'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { is_dm } = req.query;
  
  if (is_dm === 'true') {
    // Direct message
    const checkSql = `SELECT user_id FROM direct_message_messages WHERE id = ?`;
    db.query(checkSql, [messageId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Message not found' });
      
      const isOwner = rows[0].user_id === userId;
      const isAdmin = req.user.role_id === 1;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
      }
      
      const sql = `UPDATE direct_message_messages SET is_deleted = TRUE, content = '[Message deleted]' WHERE id = ?`;
      db.query(sql, [messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Message deleted' });
      });
    });
  } else {
    // Channel message
    const checkSql = `SELECT user_id FROM messages WHERE id = ?`;
    db.query(checkSql, [messageId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Message not found' });
      
      const isOwner = rows[0].user_id === userId;
      const isAdmin = req.user.role_id === 1;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
      }
      
      const sql = `UPDATE messages SET is_deleted = TRUE, content = '[Message deleted]' WHERE id = ?`;
      db.query(sql, [messageId], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Message deleted' });
      });
    });
  }
});

// ==================== MESSAGE REACTIONS ====================

// Add reaction to message
router.post('/messages/:id/reactions', auth, authorize('chat', 'create'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { emoji } = req.body;
  
  if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });
  
  const sql = `
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE emoji = emoji
  `;
  
  db.query(sql, [messageId, userId, emoji], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Reaction added' });
  });
});

// Remove reaction from message
router.delete('/messages/:id/reactions/:reactionId', auth, authorize('chat', 'update'), (req, res) => {
  const reactionId = req.params.reactionId;
  const userId = req.user.id;
  
  const sql = `DELETE FROM message_reactions WHERE id = ? AND user_id = ?`;
  db.query(sql, [reactionId, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Reaction removed' });
  });
});

// Toggle reaction (add if not exists, remove if exists)
router.post('/messages/:id/reactions/toggle', auth, authorize('chat', 'create'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { emoji, is_dm } = req.body;
  
  if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });
  
  if (is_dm) {
    // Direct message reaction
    const checkSql = `SELECT id FROM message_reactions WHERE direct_message_id = ? AND user_id = ? AND emoji = ?`;
    db.query(checkSql, [messageId, userId, emoji], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      if (rows.length > 0) {
        const deleteSql = `DELETE FROM message_reactions WHERE id = ?`;
        db.query(deleteSql, [rows[0].id], (err) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Reaction removed', removed: true });
        });
      } else {
        const insertSql = `INSERT INTO message_reactions (direct_message_id, user_id, emoji) VALUES (?, ?, ?)`;
        db.query(insertSql, [messageId, userId, emoji], (err) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Reaction added', removed: false });
        });
      }
    });
  } else {
    // Channel message reaction
    const checkSql = `SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`;
    db.query(checkSql, [messageId, userId, emoji], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      if (rows.length > 0) {
        const deleteSql = `DELETE FROM message_reactions WHERE id = ?`;
        db.query(deleteSql, [rows[0].id], (err) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Reaction removed', removed: true });
        });
      } else {
        const insertSql = `INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`;
        db.query(insertSql, [messageId, userId, emoji], (err) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Reaction added', removed: false });
        });
      }
    });
  }
});

// ==================== PINNED MESSAGES ====================

// Pin a message
router.post('/messages/:id/pin', auth, authorize('chat', 'create'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { channel_id, direct_message_id } = req.body;
  
  if (!channel_id && !direct_message_id) {
    return res.status(400).json({ success: false, message: 'channel_id or direct_message_id is required' });
  }
  
  // Check if already pinned
  const checkSql = channel_id 
    ? `SELECT id FROM pinned_messages WHERE channel_id = ? AND message_id = ?`
    : `SELECT id FROM pinned_messages WHERE direct_message_id = ? AND direct_message_id_ref = ?`;
  
  db.query(checkSql, channel_id ? [channel_id, messageId] : [direct_message_id, messageId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Message already pinned' });
    }
    
    const sql = channel_id
      ? `INSERT INTO pinned_messages (channel_id, message_id, pinned_by) VALUES (?, ?, ?)`
      : `INSERT INTO pinned_messages (direct_message_id, direct_message_id_ref, pinned_by) VALUES (?, ?, ?)`;
    
    db.query(sql, channel_id ? [channel_id, messageId, userId] : [direct_message_id, messageId, userId], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Message pinned', data: { id: result.insertId } });
    });
  });
});

// Unpin a message
router.delete('/messages/:id/pin', auth, authorize('chat', 'update'), (req, res) => {
  const messageId = req.params.id;
  const { channel_id, direct_message_id } = req.query;
  
  if (!channel_id && !direct_message_id) {
    return res.status(400).json({ success: false, message: 'channel_id or direct_message_id is required' });
  }
  
  const sql = channel_id
    ? `DELETE FROM pinned_messages WHERE channel_id = ? AND message_id = ?`
    : `DELETE FROM pinned_messages WHERE direct_message_id = ? AND direct_message_id_ref = ?`;
  
  db.query(sql, channel_id ? [channel_id, messageId] : [direct_message_id, messageId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Message unpinned' });
  });
});

// Get pinned messages for channel or DM
router.get('/pinned-messages', auth, authorize('chat', 'read'), (req, res) => {
  const { channel_id, direct_message_id } = req.query;
  
  if (!channel_id && !direct_message_id) {
    return res.status(400).json({ success: false, message: 'channel_id or direct_message_id is required' });
  }
  
  const sql = channel_id
    ? `
      SELECT pm.*, m.*, u.name as user_name, u.email as user_email,
        pinner.name as pinned_by_name
      FROM pinned_messages pm
      JOIN messages m ON pm.message_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN users pinner ON pm.pinned_by = pinner.id
      WHERE pm.channel_id = ? AND m.is_deleted = FALSE
      ORDER BY pm.created_at DESC
    `
    : `
      SELECT pm.*, dmm.*, u.name as user_name, u.email as user_email,
        pinner.name as pinned_by_name
      FROM pinned_messages pm
      JOIN direct_message_messages dmm ON pm.direct_message_id_ref = dmm.id
      JOIN users u ON dmm.user_id = u.id
      JOIN users pinner ON pm.pinned_by = pinner.id
      WHERE pm.direct_message_id = ? AND dmm.is_deleted = FALSE
      ORDER BY pm.created_at DESC
    `;
  
  db.query(sql, [channel_id || direct_message_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// ==================== MESSAGE THREADS ====================

// Get thread replies for a message
router.get('/messages/:id/threads', auth, authorize('chat', 'read'), (req, res) => {
  const messageId = req.params.id;
  
  const sql = `
    SELECT mt.*, u.name as user_name, u.email as user_email
    FROM message_threads mt
    JOIN users u ON mt.user_id = u.id
    WHERE mt.message_id = ? AND mt.is_deleted = FALSE
    ORDER BY mt.created_at ASC
  `;
  
  db.query(sql, [messageId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Add thread reply
router.post('/messages/:id/threads', auth, authorize('chat', 'create'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;
  
  if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
  
  const sql = `
    INSERT INTO message_threads (message_id, user_id, content)
    VALUES (?, ?, ?)
  `;
  
  db.query(sql, [messageId, userId, content], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    const getSql = `
      SELECT mt.*, u.name as user_name, u.email as user_email
      FROM message_threads mt
      JOIN users u ON mt.user_id = u.id
      WHERE mt.id = ?
    `;
    
    db.query(getSql, [result.insertId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.status(201).json({ success: true, data: rows[0] });
    });
  });
});

// ==================== DIRECT MESSAGES ====================

// Get all direct message conversations for user
router.get('/direct-messages', auth, authorize('chat', 'read'), (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT dm.*,
      CASE 
        WHEN dm.user1_id = ? THEN u2.id
        ELSE u1.id
      END as other_user_id,
      CASE 
        WHEN dm.user1_id = ? THEN u2.name
        ELSE u1.name
      END as other_user_name,
      CASE 
        WHEN dm.user1_id = ? THEN u2.email
        ELSE u1.email
      END as other_user_email,
      (SELECT COUNT(*) FROM direct_message_messages dmm 
       WHERE dmm.direct_message_id = dm.id 
       AND dmm.user_id != ? 
       AND dmm.is_read = FALSE) as unread_count,
      (SELECT dmm.content FROM direct_message_messages dmm 
       WHERE dmm.direct_message_id = dm.id 
       ORDER BY dmm.created_at DESC LIMIT 1) as last_message,
      (SELECT dmm.created_at FROM direct_message_messages dmm 
       WHERE dmm.direct_message_id = dm.id 
       ORDER BY dmm.created_at DESC LIMIT 1) as last_message_at
    FROM direct_messages dm
    JOIN users u1 ON dm.user1_id = u1.id
    JOIN users u2 ON dm.user2_id = u2.id
    WHERE dm.user1_id = ? OR dm.user2_id = ?
    ORDER BY dm.updated_at DESC
  `;
  
  db.query(sql, [userId, userId, userId, userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Get or create direct message conversation
router.post('/direct-messages', auth, authorize('chat', 'create'), (req, res) => {
  const userId = req.user.id;
  const { user_id: otherUserId } = req.body;
  
  if (!otherUserId) return res.status(400).json({ success: false, message: 'user_id is required' });
  if (otherUserId == userId) return res.status(400).json({ success: false, message: 'Cannot message yourself' });
  
  // Check if conversation exists
  const checkSql = `
    SELECT * FROM direct_messages 
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
  `;
  
  db.query(checkSql, [userId, otherUserId, otherUserId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    if (rows.length > 0) {
      // Return existing conversation
      const dm = rows[0];
      const getSql = `
        SELECT dm.*,
          CASE 
            WHEN dm.user1_id = ? THEN u2.id
            ELSE u1.id
          END as other_user_id,
          CASE 
            WHEN dm.user1_id = ? THEN u2.name
            ELSE u1.name
          END as other_user_name,
          CASE 
            WHEN dm.user1_id = ? THEN u2.email
            ELSE u1.email
          END as other_user_email
        FROM direct_messages dm
        JOIN users u1 ON dm.user1_id = u1.id
        JOIN users u2 ON dm.user2_id = u2.id
        WHERE dm.id = ?
      `;
      
      db.query(getSql, [userId, userId, userId, dm.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: result[0] });
      });
    } else {
      // Create new conversation
      const user1Id = userId < otherUserId ? userId : otherUserId;
      const user2Id = userId < otherUserId ? otherUserId : userId;
      
      const sql = `
        INSERT INTO direct_messages (user1_id, user2_id)
        VALUES (?, ?)
      `;
      
      db.query(sql, [user1Id, user2Id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        const getSql = `
          SELECT dm.*,
            CASE 
              WHEN dm.user1_id = ? THEN u2.id
              ELSE u1.id
            END as other_user_id,
            CASE 
              WHEN dm.user1_id = ? THEN u2.name
              ELSE u1.name
            END as other_user_name,
            CASE 
              WHEN dm.user1_id = ? THEN u2.email
              ELSE u1.email
            END as other_user_email
          FROM direct_messages dm
          JOIN users u1 ON dm.user1_id = u1.id
          JOIN users u2 ON dm.user2_id = u2.id
          WHERE dm.id = ?
        `;
        
        db.query(getSql, [userId, userId, userId, result.insertId], (err, rows) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, data: rows[0] });
        });
      });
    }
  });
});

// Get messages in direct message conversation
router.get('/direct-messages/:id/messages', auth, authorize('chat', 'read'), (req, res) => {
  const dmId = req.params.id;
  const userId = req.user.id;
  const { limit = 50, offset = 0 } = req.query;
  
  // Check if user is part of conversation
  const checkSql = `SELECT * FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)`;
  
  db.query(checkSql, [dmId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows.length) return res.status(403).json({ success: false, message: 'Access denied' });
    
    const sql = `
      SELECT dmm.*, u.name as user_name, u.email as user_email,
        CASE WHEN (SELECT COUNT(*) FROM pinned_messages pm WHERE pm.direct_message_id_ref = dmm.id AND pm.direct_message_id = ?) > 0 THEN 1 ELSE 0 END as is_pinned,
        (SELECT status FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as message_status,
        (SELECT delivered_at FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as delivered_at,
        (SELECT read_at FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as read_at
      FROM direct_message_messages dmm
      JOIN users u ON dmm.user_id = u.id
      WHERE dmm.direct_message_id = ? AND dmm.is_deleted = FALSE
      ORDER BY is_pinned DESC, dmm.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    db.query(sql, [dmId, userId, userId, userId, dmId, parseInt(limit), parseInt(offset)], (err, messages) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      // Get reactions for DM messages
      const messageIds = messages.map(m => m.id);
      if (messageIds.length > 0) {
        const reactionsSql = `
          SELECT mr.*, u.name as user_name
          FROM message_reactions mr
          JOIN users u ON mr.user_id = u.id
          WHERE mr.direct_message_id IN (${messageIds.join(',')})
        `;
        
        db.query(reactionsSql, (err, reactions) => {
          if (err) return res.status(500).json({ success: false, message: err.message });
          
          // Group reactions by message
          const reactionsByMessage = {};
          reactions.forEach(r => {
            if (r && r.direct_message_id && r.emoji) {
              const msgId = r.direct_message_id;
              if (!reactionsByMessage[msgId]) reactionsByMessage[msgId] = [];
              reactionsByMessage[msgId].push(r);
            }
          });
          
          // Process messages and get recipient statuses for sender's messages
          const processMessages = async () => {
            // First, process all messages to set reactions
            messages.forEach(msg => {
              msg.reactions = reactionsByMessage[msg.id] || [];
            });
            
            // Batch update: Mark all messages from other users as delivered and read
            const otherUserMessages = messages.filter(msg => msg.user_id !== userId);
            if (otherUserMessages.length > 0) {
              const messageIds = otherUserMessages.map(m => m.id);
              
              // Batch update to delivered first (using INSERT ... ON DUPLICATE KEY UPDATE)
              const deliveredValues = messageIds.map(id => `(NULL, ${id}, ${userId}, 'delivered', NOW(), NULL)`).join(',');
              const batchDeliveredSql = `
                INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at, read_at)
                VALUES ${deliveredValues}
                ON DUPLICATE KEY UPDATE 
                  status = IF(status = 'read', 'read', 'delivered'),
                  delivered_at = COALESCE(delivered_at, NOW())
              `;
              
              db.query(batchDeliveredSql, (err) => {
                if (err && err.code !== 'ER_LOCK_DEADLOCK') {
                  console.error('Error batch updating message status to delivered:', err);
                }
              });
              
              // Batch update to read (only if not already read)
              const batchReadSql = `
                UPDATE message_status 
                SET status = 'read', read_at = NOW() 
                WHERE direct_message_id IN (${messageIds.join(',')}) 
                  AND user_id = ? 
                  AND status != 'read'
              `;
              
              // Retry logic for deadlocks
              const updateWithRetry = (retries = 3) => {
                db.query(batchReadSql, [userId], (err) => {
                  if (err) {
                    if (err.code === 'ER_LOCK_DEADLOCK' && retries > 0) {
                      // Retry after a small random delay
                      setTimeout(() => updateWithRetry(retries - 1), Math.random() * 100);
                    } else if (err.code !== 'ER_LOCK_DEADLOCK') {
                      console.error('Error batch updating message status to read:', err);
                    }
                  }
                });
              };
              
              updateWithRetry();
              
              // Update message objects
              otherUserMessages.forEach(msg => {
                msg.message_status = 'read';
                msg.read_at = new Date().toISOString();
              });
            }
            
            // Get recipient statuses for sender's own messages
            const senderMessages = messages.filter(msg => msg.user_id === userId);
            if (senderMessages.length > 0) {
              const senderMessageIds = senderMessages.map(m => m.id);
              const getRecipientStatusesSql = `
                SELECT direct_message_id, status, delivered_at, read_at 
                FROM message_status 
                WHERE direct_message_id IN (${senderMessageIds.join(',')}) 
                  AND user_id != ?
              `;
              
              db.query(getRecipientStatusesSql, [userId], (err, statusRows) => {
                if (!err && statusRows.length > 0) {
                  const statusByMessage = {};
                  statusRows.forEach(s => {
                    statusByMessage[s.direct_message_id] = s;
                  });
                  
                  senderMessages.forEach(msg => {
                    const status = statusByMessage[msg.id];
                    if (status) {
                      msg.recipient_status = status.status;
                      msg.recipient_delivered_at = status.delivered_at;
                      msg.recipient_read_at = status.read_at;
                    } else {
                      msg.recipient_status = 'sent';
                    }
                  });
                } else {
                  senderMessages.forEach(msg => {
                    msg.recipient_status = 'sent';
                  });
                }
                
                // Also update the old is_read field for backward compatibility
                const updateReadSql = `
                  UPDATE direct_message_messages 
                  SET is_read = TRUE, read_at = NOW() 
                  WHERE direct_message_id = ? AND user_id != ? AND is_read = FALSE
                `;
                db.query(updateReadSql, [dmId, userId]);
                
                res.json({ success: true, data: messages.reverse() });
              });
            } else {
              // Also update the old is_read field for backward compatibility
              const updateReadSql = `
                UPDATE direct_message_messages 
                SET is_read = TRUE, read_at = NOW() 
                WHERE direct_message_id = ? AND user_id != ? AND is_read = FALSE
              `;
              db.query(updateReadSql, [dmId, userId]);
              
              res.json({ success: true, data: messages.reverse() });
            }
          };
          
          processMessages();
        });
      } else {
        // Mark messages as read
        const updateReadSql = `
          UPDATE direct_message_messages 
          SET is_read = TRUE, read_at = NOW() 
          WHERE direct_message_id = ? AND user_id != ? AND is_read = FALSE
        `;
        db.query(updateReadSql, [dmId, userId]);
        
        res.json({ success: true, data: [] });
      }
    });
  });
});

// Send message to direct message conversation
router.post('/direct-messages/:id/messages', auth, authorize('chat', 'create'), upload.single('file'), (req, res) => {
  const dmId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;
  const file = req.file;
  
  // Check if user is part of conversation
  const checkSql = `SELECT * FROM direct_messages WHERE id = ? AND (user1_id = ? OR user2_id = ?)`;
  
  db.query(checkSql, [dmId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!rows.length) return res.status(403).json({ success: false, message: 'Access denied' });
    
    if (!content && !file) {
      return res.status(400).json({ success: false, message: 'Content or file is required' });
    }
    
    const messageType = file ? 'file' : 'text';
    const sql = `
      INSERT INTO direct_message_messages (direct_message_id, user_id, content, message_type)
      VALUES (?, ?, ?, ?)
    `;
    
      db.query(sql, [dmId, userId, content || '', messageType], async (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      
      const messageId = result.insertId;
      
      // Create message status entry for recipient - status: sent
      const getDMSql = `SELECT user1_id, user2_id FROM direct_messages WHERE id = ?`;
      db.query(getDMSql, [dmId], async (err, dmRows) => {
        if (!err && dmRows.length > 0) {
          const dm = dmRows[0];
          const otherUserId = dm.user1_id === userId ? dm.user2_id : dm.user1_id;
          
          // Create status entry for recipient
          const statusSql = `
            INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at, read_at)
            VALUES (NULL, ?, ?, 'sent', NULL, NULL)
          `;
          db.query(statusSql, [messageId, otherUserId], (err) => {
            if (err) console.error('Error creating message status:', err);
          });
          
          // Create status entry for sender (delivered immediately)
          const senderStatusSql = `
            INSERT INTO message_status (message_id, direct_message_id, user_id, status, delivered_at, read_at)
            VALUES (NULL, ?, ?, 'delivered', NOW(), NULL)
          `;
          db.query(senderStatusSql, [messageId, userId], (err) => {
            if (err) console.error('Error creating sender message status:', err);
          });
          
          // Get sender name
          const senderNameSql = `SELECT name FROM users WHERE id = ?`;
          db.query(senderNameSql, [userId], async (err, senderRows) => {
            if (!err && senderRows.length > 0) {
              const senderName = senderRows[0].name;
              const messagePreview = content ? (content.length > 50 ? content.substring(0, 50) + '...' : content) : '📎 File attachment';
              
              try {
                await NotificationService.createNotification({
                  user_id: otherUserId,
                  type: 'chat_message',
                  title: `New message from ${senderName}`,
                  message: messagePreview,
                  entity_type: 'direct_messages',
                  entity_id: dmId,
                  related_user_id: userId,
                  priority: 'medium'
                });
              } catch (notifErr) {
                console.error('Error creating DM notification:', notifErr);
              }
            }
          });
        }
      });
      
      // If file uploaded, create attachment
      if (file) {
        const attachmentSql = `
          INSERT INTO message_attachments (direct_message_id, file_name, file_path, file_type, file_size, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const filePath = `/uploads/chat/${file.filename}`;
        db.query(attachmentSql, [messageId, file.originalname, filePath, file.mimetype, file.size, userId], (err) => {
          if (err) console.error('Error creating attachment:', err);
        });
      }
      
      // Update conversation updated_at
      const updateSql = `UPDATE direct_messages SET updated_at = NOW() WHERE id = ?`;
      db.query(updateSql, [dmId]);
      
      // Get created message with status
      const getSql = `
        SELECT dmm.*, u.name as user_name, u.email as user_email,
          (SELECT status FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as message_status,
          (SELECT delivered_at FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as delivered_at,
          (SELECT read_at FROM message_status WHERE direct_message_id = dmm.id AND user_id = ? LIMIT 1) as read_at
        FROM direct_message_messages dmm
        JOIN users u ON dmm.user_id = u.id
        WHERE dmm.id = ?
      `;
      
      db.query(getSql, [userId, userId, userId, messageId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        const message = rows[0];
        message.message_status = 'delivered'; // For sender, it's delivered
        res.status(201).json({ success: true, data: message });
      });
    });
  });
});

// Mark message as read (for channel messages)
router.post('/messages/:id/mark-read', auth, authorize('chat', 'update'), (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  const { is_dm } = req.body;
  
  if (is_dm) {
    // For DM messages
    const updateReadSql = `
      UPDATE message_status 
      SET status = 'read', read_at = NOW() 
      WHERE direct_message_id = ? AND user_id = ?
    `;
    db.query(updateReadSql, [messageId, userId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Message marked as read' });
    });
  } else {
    // For channel messages
    const updateReadSql = `
      UPDATE message_status 
      SET status = 'read', read_at = NOW() 
      WHERE message_id = ? AND user_id = ?
    `;
    db.query(updateReadSql, [messageId, userId], (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Message marked as read' });
    });
  }
});

// ==================== USERS ====================

// Get all users for chat (with presence)
router.get('/users', auth, authorize('chat', 'read'), (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email,
      CASE 
        WHEN up.status IS NULL THEN 'offline'
        WHEN up.status = 'away' THEN 'standby'
        ELSE up.status
      END as status,
      up.last_seen_at
    FROM users u
    LEFT JOIN user_presence up ON u.id = up.user_id
    ORDER BY u.name ASC
  `;
  
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// Update user presence
router.patch('/users/presence', auth, authorize('chat', 'update'), (req, res) => {
  const userId = req.user.id;
  let { status } = req.body;
  
  // Map 'standby' to 'away' for database compatibility
  if (status === 'standby') {
    status = 'away';
  }
  
  if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be: online, offline, or standby' });
  }
  
  const sql = `
    INSERT INTO user_presence (user_id, status, last_seen_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE status = ?, last_seen_at = NOW()
  `;
  
  db.query(sql, [userId, status, status], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Presence updated' });
  });
});

module.exports = router;

