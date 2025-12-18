const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all upseller targets
router.get('/', auth, authorize('upseller_targets', 'read'), (req, res) => {
  const sql = `
    SELECT ut.*, 
           u.name as user_name,
           u.email as user_email,
           creator.name as created_by_name
    FROM upseller_targets ut
    JOIN users u ON ut.user_id = u.id
    LEFT JOIN users creator ON ut.created_by = creator.id
    ORDER BY ut.target_year DESC, ut.target_month DESC, u.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get upseller targets for current month
router.get('/current', auth, authorize('upseller_targets', 'read'), (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  
  const sql = `
    SELECT ut.*, 
           u.name as user_name,
           u.email as user_email,
           creator.name as created_by_name
    FROM upseller_targets ut
    JOIN users u ON ut.user_id = u.id
    LEFT JOIN users creator ON ut.created_by = creator.id
    WHERE ut.target_year = ? AND ut.target_month = ?
    ORDER BY u.name
  `;
  
  db.query(sql, [currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get my upseller targets progress
router.get('/progress/my', auth, authorize('upseller_targets', 'read'), (req, res) => {
  const userId = req.user.id;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Get current month target
  const targetSql = `
    SELECT ut.*, 
           COALESCE(up.metric_value, 0) as actual_cash_in,
           CASE 
             WHEN ut.target_value > 0 THEN ROUND((COALESCE(up.metric_value, 0) / ut.target_value) * 100, 2)
             ELSE 0 
           END as progress_percentage
    FROM upseller_targets ut
    LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
      AND up.metric_type = 'revenue_generated'
      AND up.period_year = ut.target_year 
      AND up.period_month = ut.target_month
    WHERE ut.user_id = ? 
      AND ut.target_year = ? 
      AND ut.target_month = ?
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

// Get all upsellers' targets for current month (for management view)
// Returns all upseller role users with default target of 1 if no target is set
router.get('/current/all', auth, authorize('upseller_targets', 'read'), (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const sql = `
    SELECT 
      ut.id,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      COALESCE(ut.target_value, 1) as target_value,
      COALESCE(up.metric_value, 0) as actual_cash_in,
      CASE 
        WHEN COALESCE(ut.target_value, 1) > 0 THEN ROUND((COALESCE(up.metric_value, 0) / COALESCE(ut.target_value, 1)) * 100, 2)
        ELSE 0 
      END as progress_percentage,
      CASE WHEN ut.id IS NULL THEN 0 ELSE 1 END as has_target
    FROM users u
    LEFT JOIN upseller_targets ut ON ut.user_id = u.id 
      AND ut.target_year = ? 
      AND ut.target_month = ?
    LEFT JOIN upseller_performance up ON up.user_id = u.id 
      AND up.metric_type = 'revenue_generated'
      AND up.period_year = ? 
      AND up.period_month = ?
    WHERE u.role_id = 5
    ORDER BY u.name
  `;
  
  db.query(sql, [currentYear, currentMonth, currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Create or update upseller target for current month
router.post('/', auth, authorize('upseller_targets', 'create'), (req, res) => {
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
  const checkSql = 'SELECT id FROM upseller_targets WHERE user_id = ? AND target_year = ? AND target_month = ?';
  
  db.query(checkSql, [user_id, currentYear, currentMonth], (err, results) => {
    if (err) return res.status(500).json(err);
    
    if (results.length > 0) {
      // Update existing target
      const updateSql = 'UPDATE upseller_targets SET target_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.query(updateSql, [targetValue, results[0].id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Upseller target updated successfully', targetId: results[0].id });
      });
    } else {
      // Create new target
      const insertSql = 'INSERT INTO upseller_targets (user_id, target_value, target_year, target_month, created_by) VALUES (?, ?, ?, ?, ?)';
      db.query(insertSql, [user_id, targetValue, currentYear, currentMonth, req.user.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Upseller target created successfully', targetId: result.insertId });
      });
    }
  });
});

// Update upseller target
router.put('/:id', auth, authorize('upseller_targets', 'update'), (req, res) => {
  const targetId = req.params.id;
  const { target_value } = req.body;
  
  // Validate target value must be greater than 0
  const targetValue = parseFloat(target_value);
  if (isNaN(targetValue) || targetValue <= 0) {
    return res.status(400).json({ message: 'Target value must be a number greater than 0' });
  }
  
  const sql = 'UPDATE upseller_targets SET target_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  
  db.query(sql, [targetValue, targetId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Upseller target not found' });
    res.json({ message: 'Upseller target updated successfully' });
  });
});

// Delete upseller target
router.delete('/:id', auth, authorize('upseller_targets', 'delete'), (req, res) => {
  const targetId = req.params.id;
  
  const sql = 'DELETE FROM upseller_targets WHERE id = ?';
  db.query(sql, [targetId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Upseller target not found' });
    res.json({ message: 'Upseller target deleted successfully' });
  });
});

// Auto-create upseller targets for next month (can be called by admin)
router.post('/auto-create-next-month', auth, authorize('upseller_targets', 'create'), (req, res) => {
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = nextDate.getMonth() + 1;
  
  // Get all current month targets
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const getCurrentTargetsSql = 'SELECT user_id, target_value FROM upseller_targets WHERE target_year = ? AND target_month = ?';
  
  db.query(getCurrentTargetsSql, [currentYear, currentMonth], (err, currentTargets) => {
    if (err) return res.status(500).json(err);
    
    if (currentTargets.length === 0) {
      return res.json({ message: 'No current upseller targets to copy' });
    }
    
    // Create targets for next month with same values
    const insertValues = currentTargets.map(target => [target.user_id, target.target_value, nextYear, nextMonth, req.user.id]);
    const insertSql = 'INSERT INTO upseller_targets (user_id, target_value, target_year, target_month, created_by) VALUES ?';
    
    db.query(insertSql, [insertValues], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ 
        message: `Created ${result.affectedRows} upseller targets for ${nextDate.toLocaleString('default', { month: 'long' })} ${nextYear}`,
        created: result.affectedRows
      });
    });
  });
});

module.exports = router;
