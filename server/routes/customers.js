const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, authorize('customers','read'), (req, res) => {
  // Check if user is admin
  const isAdmin = req.user.role_id === 1;
  
  if (isAdmin) {
    // Admin can see all customers
    db.query('SELECT * FROM customers ORDER BY id DESC', (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For RBAC users, check if they have admin-like permissions
  const userId = req.user.id;
  const userRoleId = req.user.role_id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Check if user is upseller (role_id = 5) - they should only see assigned customers
  if (userRoleId === 5) {
    const sql = `
      SELECT DISTINCT c.*
      FROM customers c
      INNER JOIN customer_assignments ca ON c.id = ca.customer_id
      WHERE ca.upseller_id = ? AND ca.status = 'active'
      ORDER BY c.id DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For other roles (front-sales-manager, sales, etc.), show all customers
  db.query('SELECT * FROM customers ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
