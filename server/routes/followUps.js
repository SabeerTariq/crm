const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all follow-ups
// Admin and managers (role_id 1, 4, 6) can see all follow-ups
// Regular users can only see their own follow-ups
router.get('/', auth, authorize('follow_ups', 'read'), (req, res) => {
  const userId = req.user.id;
  const roleId = req.user.role_id;
  const isAdmin = roleId === 1;
  const isManager = roleId === 4 || roleId === 6; // front-sales-manager or upseller-manager

  let query = `
    SELECT 
      fu.id,
      fu.lead_id,
      fu.user_id,
      fu.user_name,
      fu.note,
      fu.follow_up_date,
      fu.status,
      fu.created_at,
      fu.updated_at,
      l.name as lead_name,
      l.company_name,
      l.email,
      l.phone,
      l.source,
      u.name as user_full_name,
      u.email as user_email
    FROM follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    JOIN users u ON fu.user_id = u.id
  `;

  const queryParams = [];

  // If not admin or manager, only show user's own follow-ups
  if (!isAdmin && !isManager) {
    query += ' WHERE fu.user_id = ?';
    queryParams.push(userId);
  }

  query += ' ORDER BY fu.follow_up_date ASC, fu.created_at DESC';

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching follow-ups:', err);
      return res.status(500).json({ message: 'Error fetching follow-ups', error: err.message });
    }
    res.json(results);
  });
});

// Get follow-ups for a specific lead
router.get('/lead/:leadId', auth, authorize('follow_ups', 'read'), (req, res) => {
  const leadId = req.params.leadId;
  const userId = req.user.id;
  const roleId = req.user.role_id;
  const isAdmin = roleId === 1;
  const isManager = roleId === 4 || roleId === 6;

  let query = `
    SELECT 
      fu.id,
      fu.lead_id,
      fu.user_id,
      fu.user_name,
      fu.note,
      fu.follow_up_date,
      fu.status,
      fu.created_at,
      fu.updated_at,
      u.name as user_full_name,
      u.email as user_email
    FROM follow_ups fu
    JOIN users u ON fu.user_id = u.id
    WHERE fu.lead_id = ?
  `;

  const queryParams = [leadId];

  // If not admin or manager, only show user's own follow-up for this lead
  if (!isAdmin && !isManager) {
    query += ' AND fu.user_id = ?';
    queryParams.push(userId);
  }

  query += ' ORDER BY fu.created_at DESC';

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching follow-ups for lead:', err);
      return res.status(500).json({ message: 'Error fetching follow-ups for lead', error: err.message });
    }
    res.json(results);
  });
});

// Get user's own follow-ups
router.get('/my-follow-ups', auth, authorize('follow_ups', 'read'), (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      fu.id,
      fu.lead_id,
      fu.user_id,
      fu.user_name,
      fu.note,
      fu.follow_up_date,
      fu.status,
      fu.created_at,
      fu.updated_at,
      l.name as lead_name,
      l.company_name,
      l.email,
      l.phone,
      l.source
    FROM follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    WHERE fu.user_id = ?
    ORDER BY fu.follow_up_date ASC, fu.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user follow-ups:', err);
      return res.status(500).json({ message: 'Error fetching user follow-ups', error: err.message });
    }
    res.json(results);
  });
});

// Add a lead to follow-up menu
router.post('/', auth, authorize('follow_ups', 'create'), (req, res) => {
  const { lead_id, note, follow_up_date } = req.body;
  const userId = req.user.id;
  const userName = req.user.name || req.user.email || 'Unknown User';

  if (!lead_id) {
    return res.status(400).json({ message: 'Lead ID is required' });
  }

  // Check if lead exists
  db.query('SELECT id FROM leads WHERE id = ?', [lead_id], (err, leadResults) => {
    if (err) {
      console.error('Error checking lead:', err);
      return res.status(500).json({ message: 'Error checking lead', error: err.message });
    }

    if (leadResults.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if follow-up already exists for this user and lead
    db.query(
      'SELECT id FROM follow_ups WHERE lead_id = ? AND user_id = ?',
      [lead_id, userId],
      (err, existingResults) => {
        if (err) {
          console.error('Error checking existing follow-up:', err);
          return res.status(500).json({ message: 'Error checking existing follow-up', error: err.message });
        }

        if (existingResults.length > 0) {
          // Update existing follow-up
          const updateQuery = `
            UPDATE follow_ups 
            SET note = ?, follow_up_date = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
            WHERE lead_id = ? AND user_id = ?
          `;
          db.query(updateQuery, [note || null, follow_up_date || null, lead_id, userId], (err, updateResult) => {
            if (err) {
              console.error('Error updating follow-up:', err);
              return res.status(500).json({ message: 'Error updating follow-up', error: err.message });
            }
            res.json({ message: 'Follow-up updated successfully', id: existingResults[0].id });
          });
        } else {
          // Create new follow-up
          const insertQuery = `
            INSERT INTO follow_ups (lead_id, user_id, user_name, note, follow_up_date, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `;
          db.query(insertQuery, [lead_id, userId, userName, note || null, follow_up_date || null], (err, insertResult) => {
            if (err) {
              console.error('Error creating follow-up:', err);
              return res.status(500).json({ message: 'Error creating follow-up', error: err.message });
            }
            res.json({ message: 'Lead added to follow-up menu successfully', id: insertResult.insertId });
          });
        }
      }
    );
  });
});

// Update a follow-up
router.put('/:id', auth, authorize('follow_ups', 'update'), (req, res) => {
  const followUpId = req.params.id;
  const { note, follow_up_date, status } = req.body;
  const userId = req.user.id;
  const roleId = req.user.role_id;
  const isAdmin = roleId === 1;
  const isManager = roleId === 4 || roleId === 6;

  // Check if follow-up exists and user has permission
  let checkQuery = 'SELECT user_id FROM follow_ups WHERE id = ?';
  const checkParams = [followUpId];

  db.query(checkQuery, checkParams, (err, results) => {
    if (err) {
      console.error('Error checking follow-up:', err);
      return res.status(500).json({ message: 'Error checking follow-up', error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // If not admin or manager, only allow updating own follow-ups
    if (!isAdmin && !isManager && results[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own follow-ups' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    if (note !== undefined) {
      updateFields.push('note = ?');
      updateParams.push(note);
    }
    if (follow_up_date !== undefined) {
      updateFields.push('follow_up_date = ?');
      updateParams.push(follow_up_date);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(followUpId);

    const updateQuery = `UPDATE follow_ups SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(updateQuery, updateParams, (err, updateResult) => {
      if (err) {
        console.error('Error updating follow-up:', err);
        return res.status(500).json({ message: 'Error updating follow-up', error: err.message });
      }
      res.json({ message: 'Follow-up updated successfully' });
    });
  });
});

// Delete a follow-up
router.delete('/:id', auth, authorize('follow_ups', 'delete'), (req, res) => {
  const followUpId = req.params.id;
  const userId = req.user.id;
  const roleId = req.user.role_id;
  const isAdmin = roleId === 1;
  const isManager = roleId === 4 || roleId === 6;

  // Check if follow-up exists and user has permission
  db.query('SELECT user_id FROM follow_ups WHERE id = ?', [followUpId], (err, results) => {
    if (err) {
      console.error('Error checking follow-up:', err);
      return res.status(500).json({ message: 'Error checking follow-up', error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // If not admin or manager, only allow deleting own follow-ups
    if (!isAdmin && !isManager && results[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own follow-ups' });
    }

    db.query('DELETE FROM follow_ups WHERE id = ?', [followUpId], (err, deleteResult) => {
      if (err) {
        console.error('Error deleting follow-up:', err);
        return res.status(500).json({ message: 'Error deleting follow-up', error: err.message });
      }
      res.json({ message: 'Follow-up deleted successfully' });
    });
  });
});

// Remove lead from user's follow-up menu
router.delete('/lead/:leadId', auth, authorize('follow_ups', 'delete'), (req, res) => {
  const leadId = req.params.leadId;
  const userId = req.user.id;

  db.query('DELETE FROM follow_ups WHERE lead_id = ? AND user_id = ?', [leadId, userId], (err, deleteResult) => {
    if (err) {
      console.error('Error removing follow-up:', err);
      return res.status(500).json({ message: 'Error removing follow-up', error: err.message });
    }

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    res.json({ message: 'Lead removed from follow-up menu successfully' });
  });
});

module.exports = router;

