const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get upseller performance data
router.get('/', auth, authorize('upseller_performance', 'read'), (req, res) => {
  const { team_id, user_id, period_month, period_year } = req.query;
  
  let sql = `
    SELECT up.*, 
           u.name as user_name,
           u.email as user_email,
           ut.name as team_name
    FROM upseller_performance up
    JOIN users u ON up.user_id = u.id
    LEFT JOIN upseller_teams ut ON up.team_id = ut.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (team_id) {
    sql += ' AND up.team_id = ?';
    params.push(team_id);
  }
  
  if (user_id) {
    sql += ' AND up.user_id = ?';
    params.push(user_id);
  }
  
  if (period_month) {
    sql += ' AND up.period_month = ?';
    params.push(period_month);
  }
  
  if (period_year) {
    sql += ' AND up.period_year = ?';
    params.push(period_year);
  }
  
  sql += ' ORDER BY up.period_year DESC, up.period_month DESC, u.name';
  
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get upseller team performance summary
router.get('/team/:teamId', auth, authorize('upseller_performance', 'read'), (req, res) => {
  const teamId = req.params.teamId;
  const { period_month, period_year } = req.query;
  
  const currentDate = new Date();
  const targetMonth = period_month || currentDate.getMonth() + 1;
  const targetYear = period_year || currentDate.getFullYear();
  
  // Get team members
  const membersSql = `
    SELECT utm.user_id, u.name as user_name, u.email
    FROM upseller_team_members utm
    JOIN users u ON utm.user_id = u.id
    WHERE utm.team_id = ?
  `;
  
  db.query(membersSql, [teamId], (err, members) => {
    if (err) return res.status(500).json(err);
    
    if (members.length === 0) {
      return res.json({ 
        team_id: teamId,
        period_month: targetMonth,
        period_year: targetYear,
        members: [],
        performance: []
      });
    }
    
    const memberIds = members.map(m => m.user_id);
    
    // Get performance data for team members
    const performanceSql = `
      SELECT up.*, u.name as user_name, u.email
      FROM upseller_performance up
      JOIN users u ON up.user_id = u.id
      WHERE up.team_id = ? AND up.period_month = ? AND up.period_year = ?
      ORDER BY u.name, up.metric_type
    `;
    
    db.query(performanceSql, [teamId, targetMonth, targetYear], (err, performance) => {
      if (err) return res.status(500).json(err);
      
      // Get targets for team members
      const targetsSql = `
        SELECT ut.*, u.name as user_name
        FROM upseller_targets ut
        JOIN users u ON ut.user_id = u.id
        WHERE ut.user_id IN (${memberIds.map(() => '?').join(',')}) 
        AND ut.target_month = ? AND ut.target_year = ?
      `;
      
      db.query(targetsSql, [...memberIds, targetMonth, targetYear], (err, targets) => {
        if (err) return res.status(500).json(err);
        
        // Get actual customer assignments for team members
        const assignmentsSql = `
          SELECT ca.upseller_id, COUNT(DISTINCT ca.customer_id) as customers_assigned
          FROM customer_assignments ca
          WHERE ca.upseller_id IN (${memberIds.map(() => '?').join(',')})
          AND YEAR(ca.assigned_date) = ? AND MONTH(ca.assigned_date) = ?
          AND ca.status = 'active'
          GROUP BY ca.upseller_id
        `;
        
        db.query(assignmentsSql, [...memberIds, targetYear, targetMonth], (err, assignments) => {
          if (err) return res.status(500).json(err);
          
          // Get sales data for assigned customers
          const salesSql = `
            SELECT ca.upseller_id, 
                   COUNT(DISTINCT s.id) as sales_count,
                   COALESCE(SUM(s.unit_price), 0) as total_revenue
            FROM customer_assignments ca
            LEFT JOIN sales s ON s.customer_id = ca.customer_id
            WHERE ca.upseller_id IN (${memberIds.map(() => '?').join(',')})
            AND YEAR(ca.assigned_date) = ? AND MONTH(ca.assigned_date) = ?
            AND ca.status = 'active'
            GROUP BY ca.upseller_id
          `;
          
          db.query(salesSql, [...memberIds, targetYear, targetMonth], (err, sales) => {
            if (err) return res.status(500).json(err);
            
            // Combine all data
            const teamPerformance = members.map(member => {
              const target = targets.find(t => t.user_id === member.user_id);
              const assignment = assignments.find(a => a.upseller_id === member.user_id);
              const sale = sales.find(s => s.upseller_id === member.user_id);
              
              return {
                user_id: member.user_id,
                user_name: member.user_name,
                email: member.email,
                target: target ? target.target_value : 0,
                customers_assigned: assignment ? assignment.customers_assigned : 0,
                sales_count: sale ? sale.sales_count : 0,
                total_revenue: sale ? sale.total_revenue : 0,
                progress_percentage: target && target.target_value > 0 ? 
                  Math.round((assignment ? assignment.customers_assigned : 0) / target.target_value * 100) : 0
              };
            });
            
            res.json({
              team_id: teamId,
              period_month: targetMonth,
              period_year: targetYear,
              members: members,
              performance: teamPerformance
            });
          });
        });
      });
    });
  });
});

// Get individual upseller performance
router.get('/user/:userId', auth, authorize('upseller_performance', 'read'), (req, res) => {
  const userId = req.params.userId;
  const { period_month, period_year } = req.query;
  
  const currentDate = new Date();
  const targetMonth = period_month || currentDate.getMonth() + 1;
  const targetYear = period_year || currentDate.getFullYear();
  
  // Get user details
  const userSql = 'SELECT id, name, email FROM users WHERE id = ?';
  
  db.query(userSql, [userId], (err, users) => {
    if (err) return res.status(500).json(err);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = users[0];
    
    // Get target
    const targetSql = `
      SELECT * FROM upseller_targets 
      WHERE user_id = ? AND target_month = ? AND target_year = ?
    `;
    
    db.query(targetSql, [userId, targetMonth, targetYear], (err, targets) => {
      if (err) return res.status(500).json(err);
      
      const target = targets.length > 0 ? targets[0] : null;
      
      // Get customer assignments
      const assignmentsSql = `
        SELECT COUNT(DISTINCT customer_id) as customers_assigned
        FROM customer_assignments
        WHERE upseller_id = ? 
        AND YEAR(assigned_date) = ? AND MONTH(assigned_date) = ?
        AND status = 'active'
      `;
      
      db.query(assignmentsSql, [userId, targetYear, targetMonth], (err, assignments) => {
        if (err) return res.status(500).json(err);
        
        const customersAssigned = assignments[0] ? assignments[0].customers_assigned : 0;
        
        // Get sales data
        const salesSql = `
          SELECT COUNT(DISTINCT s.id) as sales_count,
                 COALESCE(SUM(s.unit_price), 0) as total_revenue
          FROM customer_assignments ca
          LEFT JOIN sales s ON s.customer_id = ca.customer_id
          WHERE ca.upseller_id = ?
          AND YEAR(ca.assigned_date) = ? AND MONTH(ca.assigned_date) = ?
          AND ca.status = 'active'
        `;
        
        db.query(salesSql, [userId, targetYear, targetMonth], (err, sales) => {
          if (err) return res.status(500).json(err);
          
          const salesData = sales[0] || { sales_count: 0, total_revenue: 0 };
          
          const performance = {
            user_id: user.id,
            user_name: user.name,
            email: user.email,
            period_month: targetMonth,
            period_year: targetYear,
            target: target ? target.target_value : 0,
            customers_assigned: customersAssigned,
            sales_count: salesData.sales_count,
            total_revenue: salesData.total_revenue,
            progress_percentage: target && target.target_value > 0 ? 
              Math.round(customersAssigned / target.target_value * 100) : 0
          };
          
          res.json(performance);
        });
      });
    });
  });
});

// Update upseller performance metrics
router.post('/update', auth, authorize('upseller_performance', 'create'), (req, res) => {
  const { user_id, team_id, metric_type, metric_value, period_month, period_year } = req.body;
  
  if (!user_id || !metric_type || metric_value === undefined || !period_month || !period_year) {
    return res.status(400).json({ 
      message: 'user_id, metric_type, metric_value, period_month, and period_year are required' 
    });
  }
  
  const sql = `
    INSERT INTO upseller_performance (user_id, team_id, metric_type, metric_value, period_month, period_year)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    metric_value = VALUES(metric_value),
    updated_at = CURRENT_TIMESTAMP
  `;
  
  const params = [user_id, team_id, metric_type, metric_value, period_month, period_year];
  
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Upseller performance updated successfully' });
  });
});

module.exports = router;
