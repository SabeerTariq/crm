const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all targets
router.get('/', auth, authorize('targets', 'read'), (req, res) => {
  const sql = `
    SELECT t.*, 
           u.name as user_name,
           u.email as user_email,
           creator.name as created_by_name
    FROM targets t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    ORDER BY t.target_year DESC, t.target_month DESC, u.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get targets for current month
router.get('/current', auth, authorize('targets', 'read'), (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  
  const sql = `
    SELECT t.*, 
           u.name as user_name,
           u.email as user_email,
           creator.name as created_by_name
    FROM targets t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.target_year = ? AND t.target_month = ?
    ORDER BY u.name
  `;
  
  db.query(sql, [currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get my targets progress
router.get('/progress/my', auth, authorize('targets', 'read'), (req, res) => {
  const userId = req.user.id;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Get current month target
  const targetSql = `
    SELECT t.*, 
           COALESCE(COUNT(DISTINCT c.id), 0) as actual_conversions,
           CASE 
             WHEN t.target_value > 0 THEN ROUND((COALESCE(COUNT(DISTINCT c.id), 0) / t.target_value) * 100, 2)
             ELSE 0 
           END as progress_percentage
    FROM targets t
    LEFT JOIN customers c ON c.assigned_to = t.user_id 
      AND YEAR(c.converted_at) = t.target_year 
      AND MONTH(c.converted_at) = t.target_month
    WHERE t.user_id = ? 
      AND t.target_year = ? 
      AND t.target_month = ?
    GROUP BY t.id
  `;
  
  db.query(targetSql, [userId, currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    
    res.json({
      individual: results,
      current_period: {
        year: currentYear,
        month: currentMonth,
        month_name: currentDate.toLocaleString('default', { month: 'long' })
      }
    });
  });
});

// Get all users' targets for current month (for management view)
// Returns all sales role users with default target of 1 if no target is set
router.get('/current/all', auth, authorize('targets', 'read'), (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const sql = `
    SELECT 
      t.id,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      COALESCE(t.target_value, 1) as target_value,
      COALESCE(conversion_counts.actual_conversions, 0) as actual_conversions,
      CASE 
        WHEN COALESCE(t.target_value, 1) > 0 THEN ROUND((COALESCE(conversion_counts.actual_conversions, 0) / COALESCE(t.target_value, 1)) * 100, 2)
        ELSE 0 
      END as progress_percentage,
      CASE WHEN t.id IS NULL THEN 0 ELSE 1 END as has_target
    FROM users u
    LEFT JOIN targets t ON t.user_id = u.id 
      AND t.target_year = ? 
      AND t.target_month = ?
    LEFT JOIN (
      SELECT 
        assigned_to,
        COUNT(DISTINCT id) as actual_conversions
      FROM customers
      WHERE YEAR(converted_at) = ? 
        AND MONTH(converted_at) = ?
      GROUP BY assigned_to
    ) conversion_counts ON conversion_counts.assigned_to = u.id
    WHERE u.role_id = 3
    ORDER BY u.name
  `;
  
  db.query(sql, [currentYear, currentMonth, currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Create or update target for current month
router.post('/', auth, authorize('targets', 'create'), (req, res) => {
  const { user_id, target_value } = req.body;
  
  if (!user_id || target_value === undefined || target_value === null || target_value === '') {
    return res.status(400).json({ message: 'User ID and target value are required' });
  }
  
  // Validate target value must be greater than 0
  const targetValue = parseFloat(target_value);
  if (isNaN(targetValue) || targetValue <= 0) {
    return res.status(400).json({ message: 'Target value must be a number greater than 0' });
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Check if target already exists for this user and month
  const checkSql = 'SELECT id FROM targets WHERE user_id = ? AND target_year = ? AND target_month = ?';
  
  db.query(checkSql, [user_id, currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    
    if (results.length > 0) {
      // Update existing target
      const updateSql = 'UPDATE targets SET target_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.query(updateSql, [targetValue, results[0].id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Target updated successfully', targetId: results[0].id });
      });
    } else {
      // Create new target
      const insertSql = 'INSERT INTO targets (user_id, target_value, target_year, target_month, created_by) VALUES (?, ?, ?, ?, ?)';
      db.query(insertSql, [user_id, targetValue, currentYear, currentMonth, req.user.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Target created successfully', targetId: result.insertId });
      });
    }
  });
});

// Update target
router.put('/:id', auth, authorize('targets', 'update'), (req, res) => {
  const targetId = req.params.id;
  const { target_value } = req.body;
  
  // Validate target value must be greater than 0
  const targetValue = parseFloat(target_value);
  if (isNaN(targetValue) || targetValue <= 0) {
    return res.status(400).json({ message: 'Target value must be a number greater than 0' });
  }
  
  const sql = 'UPDATE targets SET target_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  
  db.query(sql, [targetValue, targetId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Target not found' });
    res.json({ message: 'Target updated successfully' });
  });
});

// Delete target
router.delete('/:id', auth, authorize('targets', 'delete'), (req, res) => {
  const targetId = req.params.id;
  
  const sql = 'DELETE FROM targets WHERE id = ?';
  db.query(sql, [targetId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Target not found' });
    res.json({ message: 'Target deleted successfully' });
  });
});

// Auto-create targets for next month (can be called by admin)
router.post('/auto-create-next-month', auth, authorize('targets', 'create'), (req, res) => {
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;
  
  // Get all current month targets
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const getCurrentTargetsSql = 'SELECT user_id, target_value FROM targets WHERE target_year = ? AND target_month = ?';
  
  db.query(getCurrentTargetsSql, [currentYear, currentMonth], (err, currentTargets) => {
    if (err) return res.status(500).json(err);
    
    if (currentTargets.length === 0) {
      return res.json({ message: 'No current targets to copy' });
    }
    
    // Create targets for next month with same values
    const insertValues = currentTargets.map(target => [target.user_id, target.target_value, nextYear, nextMonth, req.user.id]);
    const insertSql = 'INSERT INTO targets (user_id, target_value, target_year, target_month, created_by) VALUES ?';
    
    db.query(insertSql, [insertValues], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ 
        message: `Created ${result.affectedRows} targets for ${nextDate.toLocaleString('default', { month: 'long' })} ${nextYear}`,
        created: result.affectedRows
      });
    });
  });
});

module.exports = router;