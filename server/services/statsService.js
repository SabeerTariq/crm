const db = require('../db');

class StatsService {
  // Get or create monthly stats for a user
  static async getOrCreateMonthlyStats(userId, year, month) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM monthly_lead_stats 
        WHERE user_id = ? AND year = ? AND month = ?
      `;
      
      db.query(sql, [userId, year, month], (err, results) => {
        if (err) return reject(err);
        
        if (results.length > 0) {
          resolve(results[0]);
        } else {
          // Create new monthly stats record
          const insertSql = `
            INSERT INTO monthly_lead_stats (user_id, year, month, leads_added, leads_converted)
            VALUES (?, ?, ?, 0, 0)
          `;
          
          db.query(insertSql, [userId, year, month], (err, result) => {
            if (err) return reject(err);
            resolve({ id: result.insertId, user_id: userId, year, month, leads_added: 0, leads_converted: 0 });
          });
        }
      });
    });
  }

  // Track lead creation
  static async trackLeadCreated(userId, leadId) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-based
      
      // Insert tracking record
      const trackingSql = `
        INSERT INTO lead_tracking (user_id, lead_id, action)
        VALUES (?, ?, 'created')
      `;
      
      db.query(trackingSql, [userId, leadId], (err, result) => {
        if (err) return reject(err);
        
        // Update monthly stats
        this.getOrCreateMonthlyStats(userId, year, month)
          .then(stats => {
            const updateSql = `
              UPDATE monthly_lead_stats 
              SET leads_added = leads_added + 1 
              WHERE id = ?
            `;
            
            db.query(updateSql, [stats.id], (err) => {
              if (err) return reject(err);
              resolve(result);
            });
          })
          .catch(reject);
      });
    });
  }

  // Track lead conversion
  static async trackLeadConverted(userId, leadId) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // Insert tracking record
      const trackingSql = `
        INSERT INTO lead_tracking (user_id, lead_id, action)
        VALUES (?, ?, 'converted')
      `;
      
      db.query(trackingSql, [userId, leadId], (err, result) => {
        if (err) return reject(err);
        
        // Update monthly stats
        this.getOrCreateMonthlyStats(userId, year, month)
          .then(stats => {
            const updateSql = `
              UPDATE monthly_lead_stats 
              SET leads_converted = leads_converted + 1 
              WHERE id = ?
            `;
            
            db.query(updateSql, [stats.id], (err) => {
              if (err) return reject(err);
              resolve(result);
            });
          })
          .catch(reject);
      });
    });
  }

  // Get dashboard statistics for a user
  static async getDashboardStats(userId) {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Get previous month stats
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      // Get current month stats
      const currentMonthSql = `
        SELECT leads_added, leads_converted 
        FROM monthly_lead_stats 
        WHERE user_id = ? AND year = ? AND month = ?
      `;
      
      const prevMonthSql = `
        SELECT leads_added, leads_converted 
        FROM monthly_lead_stats 
        WHERE user_id = ? AND year = ? AND month = ?
      `;
      
      // Get all-time stats
      const allTimeSql = `
        SELECT 
          SUM(leads_added) as total_leads_added,
          SUM(leads_converted) as total_leads_converted
        FROM monthly_lead_stats 
        WHERE user_id = ?
      `;
      
      // Get recent activity (last 7 days)
      const recentActivitySql = `
        SELECT 
          DATE(created_at) as date,
          action,
          COUNT(*) as count
        FROM lead_tracking 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at), action
        ORDER BY date DESC
      `;
      
      Promise.all([
        new Promise((res, rej) => db.query(currentMonthSql, [userId, currentYear, currentMonth], (err, results) => err ? rej(err) : res(results[0] || { leads_added: 0, leads_converted: 0 }))),
        new Promise((res, rej) => db.query(prevMonthSql, [userId, prevYear, prevMonth], (err, results) => err ? rej(err) : res(results[0] || { leads_added: 0, leads_converted: 0 }))),
        new Promise((res, rej) => db.query(allTimeSql, [userId], (err, results) => err ? rej(err) : res(results[0] || { total_leads_added: 0, total_leads_converted: 0 }))),
        new Promise((res, rej) => db.query(recentActivitySql, [userId], (err, results) => err ? rej(err) : res(results)))
      ])
      .then(([currentMonth, prevMonth, allTime, recentActivity]) => {
        resolve({
          currentMonth: {
            leadsAdded: currentMonth.leads_added || 0,
            leadsConverted: currentMonth.leads_converted || 0,
            conversionRate: currentMonth.leads_added > 0 ? 
              ((currentMonth.leads_converted || 0) / currentMonth.leads_added * 100).toFixed(1) : 0
          },
          previousMonth: {
            leadsAdded: prevMonth.leads_added || 0,
            leadsConverted: prevMonth.leads_converted || 0,
            conversionRate: prevMonth.leads_added > 0 ? 
              ((prevMonth.leads_converted || 0) / prevMonth.leads_added * 100).toFixed(1) : 0
          },
          allTime: {
            totalLeadsAdded: allTime.total_leads_added || 0,
            totalLeadsConverted: allTime.total_leads_converted || 0,
            conversionRate: allTime.total_leads_added > 0 ? 
              ((allTime.total_leads_converted || 0) / allTime.total_leads_added * 100).toFixed(1) : 0
          },
          recentActivity: recentActivity
        });
      })
      .catch(reject);
    });
  }

  // Get monthly history for charts
  static async getMonthlyHistory(userId, months = 12) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          year, 
          month, 
          leads_added, 
          leads_converted,
          ROUND((leads_converted / NULLIF(leads_added, 0)) * 100, 1) as conversion_rate
        FROM monthly_lead_stats 
        WHERE user_id = ? 
        ORDER BY year DESC, month DESC 
        LIMIT ?
      `;
      
      db.query(sql, [userId, months], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = StatsService;
