const db = require('../db');

class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(notificationData) {
    return new Promise((resolve, reject) => {
      const {
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        related_user_id,
        priority = 'medium',
        expires_at
      } = notificationData;

      const sql = `
        INSERT INTO notifications 
        (user_id, type, title, message, entity_type, entity_id, related_user_id, priority, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [user_id, type, title, message || null, entity_type || null, entity_id || null, related_user_id || null, priority, expires_at || null],
        (err, result) => {
          if (err) {
            console.error('Error creating notification:', err);
            return reject(err);
          }
          resolve(result.insertId);
        }
      );
    });
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(userId, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        unread_only = false,
        type = null,
        limit = null,
        offset = 0
      } = options;

      let sql = `
        SELECT n.*, 
               u.name as related_user_name,
               u.email as related_user_email
        FROM notifications n
        LEFT JOIN users u ON n.related_user_id = u.id
        WHERE n.user_id = ?
      `;
      const params = [userId];

      if (unread_only) {
        sql += ' AND n.is_read = FALSE';
      }

      if (type) {
        sql += ' AND n.type = ?';
        params.push(type);
      }

      // Exclude expired notifications
      sql += ' AND (n.expires_at IS NULL OR n.expires_at > NOW())';

      sql += ' ORDER BY n.created_at DESC';

      if (limit) {
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
      }

      db.query(sql, params, (err, results) => {
        if (err) {
          console.error('Error fetching notifications:', err);
          return reject(err);
        }
        resolve(results);
      });
    });
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? 
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
      `;

      db.query(sql, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching unread count:', err);
          return reject(err);
        }
        resolve(results[0].count);
      });
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE id = ? AND user_id = ?
      `;

      db.query(sql, [notificationId, userId], (err, result) => {
        if (err) {
          console.error('Error marking notification as read:', err);
          return reject(err);
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE notifications 
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = ? AND is_read = FALSE
      `;

      db.query(sql, [userId], (err, result) => {
        if (err) {
          console.error('Error marking all notifications as read:', err);
          return reject(err);
        }
        resolve(result.affectedRows);
      });
    });
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM notifications 
        WHERE id = ? AND user_id = ?
      `;

      db.query(sql, [notificationId, userId], (err, result) => {
        if (err) {
          console.error('Error deleting notification:', err);
          return reject(err);
        }
        resolve(result.affectedRows > 0);
      });
    });
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteReadNotifications(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM notifications 
        WHERE user_id = ? AND is_read = TRUE
      `;

      db.query(sql, [userId], (err, result) => {
        if (err) {
          console.error('Error deleting read notifications:', err);
          return reject(err);
        }
        resolve(result.affectedRows);
      });
    });
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM notifications 
        WHERE user_id = ?
      `;

      db.query(sql, [userId], (err, result) => {
        if (err) {
          console.error('Error deleting all notifications:', err);
          return reject(err);
        }
        resolve(result.affectedRows);
      });
    });
  }

  /**
   * Aggregate all notification sources for a user
   */
  static async getAggregatedNotifications(userId, userRole) {
    return new Promise((resolve, reject) => {
      const notifications = [];
      const promises = [];

      // 1. Get reminders (calendar reminders)
      promises.push(
        new Promise((resolve) => {
          db.query(`
            SELECT 
              id,
              'reminder' as type,
              title,
              CONCAT('Reminder: ', title) as message,
              'reminders' as entity_type,
              id as entity_id,
              NULL as related_user_id,
              priority,
              reminder_date as due_date,
              created_at
            FROM reminders
            WHERE user_id = ? 
            AND status = 'pending'
            AND reminder_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY reminder_date ASC
            LIMIT 10
          `, [userId], (err, results) => {
            if (!err && results) {
              results.forEach(r => {
                notifications.push({
                  id: `reminder_${r.id}`,
                  type: 'reminder',
                  title: r.title,
                  message: `Reminder: ${r.title}`,
                  entity_type: 'reminders',
                  entity_id: r.id,
                  priority: r.priority || 'medium',
                  due_date: r.due_date,
                  created_at: r.created_at,
                  is_read: false
                });
              });
            }
            resolve();
          });
        })
      );

      // 2. Get scheduled leads (schedule notifications)
      promises.push(
        new Promise((resolve) => {
          db.query(`
            SELECT 
              ls.id,
              'schedule' as type,
              CONCAT('Scheduled call with ', l.name) as title,
              CONCAT('Scheduled call with ', l.name, ' on ', ls.schedule_date) as message,
              'leads' as entity_type,
              l.id as entity_id,
              ls.scheduled_by as related_user_id,
              'medium' as priority,
              ls.schedule_date as due_date,
              ls.scheduled_at as created_at
            FROM lead_schedules ls
            JOIN leads l ON ls.lead_id = l.id
            WHERE ls.scheduled_by = ?
            AND ls.schedule_date >= CURDATE()
            AND ls.schedule_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY ls.schedule_date ASC
            LIMIT 10
          `, [userId], (err, results) => {
            if (!err && results) {
              results.forEach(r => {
                notifications.push({
                  id: `schedule_${r.id}`,
                  type: 'schedule',
                  title: r.title,
                  message: r.message,
                  entity_type: r.entity_type,
                  entity_id: r.entity_id,
                  related_user_id: r.related_user_id,
                  priority: 'medium',
                  due_date: r.due_date,
                  created_at: r.created_at,
                  is_read: false
                });
              });
            }
            resolve();
          });
        })
      );

      // 3. Get assigned tasks (task assignments) - check both assigned_to and task_members
      promises.push(
        new Promise((resolve) => {
          db.query(`
            SELECT DISTINCT
              pt.id,
              'task_assigned' as type,
              CONCAT('New task assigned: ', pt.task_name) as title,
              CONCAT('Task "', pt.task_name, '" has been assigned to you') as message,
              'tasks' as entity_type,
              pt.id as entity_id,
              pt.created_by as related_user_id,
              pt.priority,
              pt.due_date,
              pt.created_at
            FROM project_tasks pt
            LEFT JOIN task_members tm ON pt.id = tm.task_id AND tm.user_id = ? AND tm.is_active = 1
            WHERE (pt.assigned_to = ? OR tm.user_id = ?)
            AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY pt.created_at DESC
            LIMIT 10
          `, [userId, userId, userId], (err, results) => {
            if (!err && results) {
              results.forEach(r => {
                notifications.push({
                  id: `task_${r.id}`,
                  type: 'task_assigned',
                  title: r.title,
                  message: r.message,
                  entity_type: r.entity_type,
                  entity_id: r.entity_id,
                  related_user_id: r.related_user_id,
                  priority: r.priority || 'medium',
                  due_date: r.due_date,
                  created_at: r.created_at,
                  is_read: false
                });
              });
            }
            resolve();
          });
        })
      );

      // 4. Get assigned projects (project assignments) - for upsellers and project managers
      if (userRole === 5 || userRole === 1 || userRole === 4) { // Upseller, Admin, Front Sales Manager
        promises.push(
          new Promise((resolve) => {
            db.query(`
              SELECT 
                p.id,
                'project_assigned' as type,
                CONCAT('New project assigned: ', p.project_name) as title,
                CONCAT('Project "', p.project_name, '" has been assigned to you') as message,
                'projects' as entity_type,
                p.id as entity_id,
                p.created_by as related_user_id,
                p.priority,
                p.end_date as due_date,
                p.created_at
              FROM projects p
              WHERE (p.assigned_upseller_id = ? OR p.project_manager_id = ?)
              AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ORDER BY p.created_at DESC
              LIMIT 10
            `, [userId, userId], (err, results) => {
              if (!err && results) {
                results.forEach(r => {
                  notifications.push({
                    id: `project_${r.id}`,
                    type: 'project_assigned',
                    title: r.title,
                    message: r.message,
                    entity_type: r.entity_type,
                    entity_id: r.entity_id,
                    related_user_id: r.related_user_id,
                    priority: r.priority || 'medium',
                    due_date: r.due_date,
                    created_at: r.created_at,
                    is_read: false
                  });
                });
              }
              resolve();
            });
          })
        );
      }

      // 5. Get customer assignments (for upsellers)
      if (userRole === 5 || userRole === 1) { // Upseller, Admin
        promises.push(
          new Promise((resolve) => {
            db.query(`
              SELECT 
                ca.id,
                'customer_assigned' as type,
                CONCAT('New customer assigned: ', c.name) as title,
                CONCAT('Customer "', c.name, '" has been assigned to you') as message,
                'customers' as entity_type,
                c.id as entity_id,
                ca.created_by as related_user_id,
                'medium' as priority,
                NULL as due_date,
                ca.created_at
              FROM customer_assignments ca
              JOIN customers c ON ca.customer_id = c.id
              WHERE ca.upseller_id = ?
              AND ca.status = 'active'
              AND ca.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ORDER BY ca.created_at DESC
              LIMIT 10
            `, [userId], (err, results) => {
              if (!err && results) {
                results.forEach(r => {
                  notifications.push({
                    id: `customer_${r.id}`,
                    type: 'customer_assigned',
                    title: r.title,
                    message: r.message,
                    entity_type: r.entity_type,
                    entity_id: r.entity_id,
                    related_user_id: r.related_user_id,
                    priority: 'medium',
                    due_date: r.due_date,
                    created_at: r.created_at,
                    is_read: false
                  });
                });
              }
              resolve();
            });
          })
        );
      }

      // 6. Get upcoming payments (payment notifications) - for upsellers
      if (userRole === 5 || userRole === 1 || userRole === 4) { // Upseller, Admin, Front Sales Manager
        promises.push(
          new Promise((resolve) => {
            db.query(`
              SELECT 
                pi.id,
                'payment_due' as type,
                CONCAT('Payment due: $', pi.amount) as title,
                CONCAT('Payment of $', pi.amount, ' is due on ', pi.due_date) as message,
                'payments' as entity_type,
                pi.sale_id as entity_id,
                NULL as related_user_id,
                CASE 
                  WHEN pi.due_date < CURDATE() THEN 'urgent'
                  WHEN pi.due_date = CURDATE() THEN 'high'
                  ELSE 'medium'
                END as priority,
                pi.due_date,
                pi.created_at
              FROM payment_installments pi
              JOIN sales s ON pi.sale_id = s.id
              JOIN customers c ON s.customer_id = c.id
              JOIN customer_assignments ca ON c.id = ca.customer_id
              WHERE ca.upseller_id = ?
              AND ca.status = 'active'
              AND pi.status = 'pending'
              AND pi.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              ORDER BY pi.due_date ASC
              LIMIT 10
              
              UNION ALL
              
              SELECT 
                pr.id,
                'payment_due' as type,
                CONCAT('Recurring payment: $', pr.amount) as title,
                CONCAT('Recurring payment of $', pr.amount, ' is due on ', pr.next_payment_date) as message,
                'payments' as entity_type,
                pr.sale_id as entity_id,
                NULL as related_user_id,
                CASE 
                  WHEN pr.next_payment_date < CURDATE() THEN 'urgent'
                  WHEN pr.next_payment_date = CURDATE() THEN 'high'
                  ELSE 'medium'
                END as priority,
                pr.next_payment_date as due_date,
                pr.created_at
              FROM payment_recurring pr
              JOIN sales s ON pr.sale_id = s.id
              JOIN customers c ON s.customer_id = c.id
              JOIN customer_assignments ca ON c.id = ca.customer_id
              WHERE ca.upseller_id = ?
              AND ca.status = 'active'
              AND pr.status = 'active'
              AND pr.next_payment_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              ORDER BY pr.next_payment_date ASC
              LIMIT 10
            `, [userId, userId], (err, results) => {
              if (!err && results) {
                results.forEach(r => {
                  notifications.push({
                    id: `payment_${r.id}`,
                    type: 'payment_due',
                    title: r.title,
                    message: r.message,
                    entity_type: r.entity_type,
                    entity_id: r.entity_id,
                    related_user_id: r.related_user_id,
                    priority: r.priority || 'medium',
                    due_date: r.due_date,
                    created_at: r.created_at,
                    is_read: false
                  });
                });
              }
              resolve();
            });
          })
        );
      }

      // 7. Get chat messages (unread messages in channels and DMs)
      promises.push(
        new Promise((resolve) => {
          db.query(`
            SELECT 
              m.id,
              'chat_message' as type,
              CONCAT('New message in #', c.name) as title,
              CONCAT(u.name, ': ', LEFT(m.content, 100)) as message,
              'channels' as entity_type,
              c.id as entity_id,
              m.user_id as related_user_id,
              'medium' as priority,
              NULL as due_date,
              m.created_at
            FROM messages m
            JOIN channels c ON m.channel_id = c.id
            JOIN users u ON m.user_id = u.id
            JOIN channel_members cm ON c.id = cm.channel_id
            WHERE cm.user_id = ?
            AND m.user_id != ?
            AND m.is_deleted = FALSE
            AND m.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            AND NOT EXISTS (
              SELECT 1 FROM notifications n 
              WHERE n.user_id = ? 
              AND n.entity_type = 'channels' 
              AND n.entity_id = c.id 
              AND n.related_user_id = m.user_id
              AND n.created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            )
            ORDER BY m.created_at DESC
            LIMIT 10
            
            UNION ALL
            
            SELECT 
              dmm.id,
              'chat_message' as type,
              CONCAT('New message from ', u.name) as title,
              LEFT(dmm.content, 100) as message,
              'direct_messages' as entity_type,
              dmm.direct_message_id as entity_id,
              dmm.user_id as related_user_id,
              'medium' as priority,
              NULL as due_date,
              dmm.created_at
            FROM direct_message_messages dmm
            JOIN direct_messages dm ON dmm.direct_message_id = dm.id
            JOIN users u ON dmm.user_id = u.id
            WHERE (dm.user1_id = ? OR dm.user2_id = ?)
            AND dmm.user_id != ?
            AND dmm.is_deleted = FALSE
            AND dmm.is_read = FALSE
            AND dmm.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            AND NOT EXISTS (
              SELECT 1 FROM notifications n 
              WHERE n.user_id = ? 
              AND n.entity_type = 'direct_messages' 
              AND n.entity_id = dm.id 
              AND n.related_user_id = dmm.user_id
              AND n.created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            )
            ORDER BY dmm.created_at DESC
            LIMIT 10
          `, [userId, userId, userId, userId, userId, userId, userId], (err, results) => {
            if (!err && results) {
              results.forEach(r => {
                notifications.push({
                  id: `chat_${r.entity_type}_${r.id}`,
                  type: 'chat_message',
                  title: r.title,
                  message: r.message,
                  entity_type: r.entity_type,
                  entity_id: r.entity_id,
                  related_user_id: r.related_user_id,
                  priority: 'medium',
                  due_date: r.due_date,
                  created_at: r.created_at,
                  is_read: false
                });
              });
            }
            resolve();
          });
        })
      );

      // 8. Get tasks due soon (task due date notifications) - for production roles
      if (userRole >= 7 && userRole <= 18) { // Production roles
        promises.push(
          new Promise((resolve) => {
            db.query(`
              SELECT DISTINCT
                pt.id,
                'task_due' as type,
                CONCAT('Task due soon: ', pt.task_name) as title,
                CONCAT('Task "', pt.task_name, '" is due on ', pt.due_date) as message,
                'tasks' as entity_type,
                pt.id as entity_id,
                pt.created_by as related_user_id,
                pt.priority,
                pt.due_date,
                pt.created_at
              FROM project_tasks pt
              LEFT JOIN task_members tm ON pt.id = tm.task_id AND tm.user_id = ? AND tm.is_active = 1
              WHERE (pt.assigned_to = ? OR tm.user_id = ?)
              AND pt.due_date IS NOT NULL
              AND pt.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
              AND pt.status NOT IN ('completed', 'cancelled')
              ORDER BY pt.due_date ASC
              LIMIT 10
            `, [userId, userId, userId], (err, results) => {
              if (!err && results) {
                results.forEach(r => {
                  notifications.push({
                    id: `task_due_${r.id}`,
                    type: 'task_due',
                    title: r.title,
                    message: r.message,
                    entity_type: r.entity_type,
                    entity_id: r.entity_id,
                    related_user_id: r.related_user_id,
                    priority: r.priority || 'medium',
                    due_date: r.due_date,
                    created_at: r.created_at,
                    is_read: false
                  });
                });
              }
              resolve();
            });
          })
        );
      }

      // Wait for all queries to complete
      Promise.all(promises)
        .then(() => {
          // Sort by created_at descending
          notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          resolve(notifications);
        })
        .catch(reject);
    });
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM notifications 
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
      `;

      db.query(sql, (err, result) => {
        if (err) {
          console.error('Error cleaning up expired notifications:', err);
          return reject(err);
        }
        resolve(result.affectedRows);
      });
    });
  }
}

module.exports = NotificationService;

