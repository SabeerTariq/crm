const db = require('../db');

class ReminderService {
  
  /**
   * Create a new reminder
   * @param {object} reminderData - Reminder data object
   */
  static async createReminder(reminderData) {
    return new Promise((resolve, reject) => {
      const { user_id, title, description, reminder_date, reminder_time, is_all_day, priority, status } = reminderData;
      
      const sql = `
        INSERT INTO reminders 
        (user_id, title, description, reminder_date, reminder_time, is_all_day, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [user_id, title, description, reminder_date, reminder_time, is_all_day, priority, status];
      
      db.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Get reminders for a specific user
   * @param {number} userId - User ID
   * @param {string} startDate - Start date filter (YYYY-MM-DD) - optional
   * @param {string} endDate - End date filter (YYYY-MM-DD) - optional
   * @param {string} status - Status filter - optional
   */
  static async getUserReminders(userId, startDate = null, endDate = null, status = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id, user_id, title, description, 
               DATE_FORMAT(reminder_date, '%Y-%m-%d') as reminder_date,
               reminder_time, is_all_day, priority, status, created_at, updated_at
        FROM reminders 
        WHERE user_id = ?
      `;
      
      const params = [userId];
      
      if (startDate) {
        sql += ' AND reminder_date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ' AND reminder_date <= ?';
        params.push(endDate);
      }
      
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      
      sql += ' ORDER BY reminder_date ASC, reminder_time ASC';
      
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get reminders for a specific date
   * @param {number} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   */
  static async getRemindersForDate(userId, date) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, user_id, title, description, 
               DATE_FORMAT(reminder_date, '%Y-%m-%d') as reminder_date,
               reminder_time, is_all_day, priority, status, created_at, updated_at
        FROM reminders 
        WHERE user_id = ? AND reminder_date = ?
        ORDER BY reminder_time ASC, created_at ASC
      `;
      
      db.query(sql, [userId, date], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Update a reminder
   * @param {number} reminderId - Reminder ID
   * @param {object} updateData - Data to update
   */
  static async updateReminder(reminderId, updateData) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['title', 'description', 'reminder_date', 'reminder_time', 'is_all_day', 'priority', 'status'];
      const updates = [];
      const params = [];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });
      
      if (updates.length === 0) {
        return reject(new Error('No valid fields to update'));
      }
      
      params.push(reminderId);
      
      const sql = `
        UPDATE reminders 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Delete a reminder
   * @param {number} reminderId - Reminder ID
   * @param {number} userId - User ID (for security)
   */
  static async deleteReminder(reminderId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM reminders 
        WHERE id = ? AND user_id = ?
      `;
      
      db.query(sql, [reminderId, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Get upcoming reminders for a user
   * @param {number} userId - User ID
   * @param {number} days - Number of days ahead to look
   */
  static async getUpcomingReminders(userId, days = 7) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, user_id, title, description, 
               DATE_FORMAT(reminder_date, '%Y-%m-%d') as reminder_date,
               reminder_time, is_all_day, priority, status, created_at, updated_at
        FROM reminders 
        WHERE user_id = ? 
        AND reminder_date >= CURDATE() 
        AND reminder_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND status = 'pending'
        ORDER BY reminder_date ASC, reminder_time ASC
      `;
      
      db.query(sql, [userId, days], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Mark reminder as completed
   * @param {number} reminderId - Reminder ID
   * @param {number} userId - User ID (for security)
   */
  static async markAsCompleted(reminderId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE reminders 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      db.query(sql, [reminderId, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}

module.exports = ReminderService;
