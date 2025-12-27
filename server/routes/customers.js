const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, authorize('customers','read'), (req, res) => {
  // Check if user is admin
  const isAdmin = req.user.role_id === 1;
  
  if (isAdmin) {
    // Admin can see all customers with agreement counts
    const sql = `
      SELECT c.*,
             COUNT(DISTINCT s.id) as agreement_count
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.agreement_file_name IS NOT NULL
      GROUP BY c.id
      ORDER BY c.converted_at DESC
    `;
    db.query(sql, (err, results) => {
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
      SELECT DISTINCT c.*,
             COUNT(DISTINCT s.id) as agreement_count
      FROM customers c
      INNER JOIN customer_assignments ca ON c.id = ca.customer_id
      LEFT JOIN sales s ON c.id = s.customer_id AND s.agreement_file_name IS NOT NULL
      WHERE ca.upseller_id = ? AND ca.status = 'active'
      GROUP BY c.id
      ORDER BY c.converted_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For other roles (front-sales-manager, sales, production-head, etc.), show all customers with agreement counts
  const sql = `
    SELECT c.*,
           COUNT(DISTINCT s.id) as agreement_count
    FROM customers c
    LEFT JOIN sales s ON c.id = s.customer_id AND s.agreement_file_name IS NOT NULL
    GROUP BY c.id
    ORDER BY c.converted_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get all agreements for all customers
router.get('/agreements', auth, authorize('customers','read'), (req, res) => {
  const isAdmin = req.user.role_id === 1;
  const isFrontSalesManager = req.user.role_id === 4;
  const userId = req.user.id;
  const userRoleId = req.user.role_id;
  
  let sql;
  let params = [];
  
  if (isAdmin || isFrontSalesManager) {
    // Admin and Front Sales Manager can see all agreements
    sql = `
      SELECT 
        s.id as sale_id,
        s.agreement_file_name,
        s.agreement_file_path,
        s.agreement_file_size,
        s.agreement_file_type,
        s.agreement_uploaded_at,
        s.created_at as sale_created_at,
        s.services,
        s.service_details,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        u.name as created_by_name
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.agreement_file_name IS NOT NULL
      ORDER BY s.created_at DESC
    `;
  } else if (userRoleId === 5) {
    // Upseller: show agreements for assigned customers only
    sql = `
      SELECT DISTINCT
        s.id as sale_id,
        s.agreement_file_name,
        s.agreement_file_path,
        s.agreement_file_size,
        s.agreement_file_type,
        s.agreement_uploaded_at,
        s.created_at as sale_created_at,
        s.services,
        s.service_details,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        u.name as created_by_name
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN customer_assignments ca ON s.customer_id = ca.customer_id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.agreement_file_name IS NOT NULL
        AND ca.upseller_id = ? 
        AND ca.status = 'active'
      ORDER BY s.created_at DESC
    `;
    params = [userId];
  } else {
    // Other roles: show only agreements for sales they created
    sql = `
      SELECT 
        s.id as sale_id,
        s.agreement_file_name,
        s.agreement_file_path,
        s.agreement_file_size,
        s.agreement_file_type,
        s.agreement_uploaded_at,
        s.created_at as sale_created_at,
        s.services,
        s.service_details,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        u.name as created_by_name
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.agreement_file_name IS NOT NULL
        AND s.created_by = ?
      ORDER BY s.created_at DESC
    `;
    params = [userId];
  }
  
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
