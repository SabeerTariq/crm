const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all brands
router.get('/', auth, authorize('sales', 'read'), (req, res) => {
  const sql = 'SELECT id, name FROM brands ORDER BY name ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching brands:', err);
      return res.status(500).json({ message: 'Error fetching brands' });
    }
    res.json({ brands: results });
  });
});

// Create a new brand
router.post('/', auth, authorize('sales', 'create'), (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Brand name is required' });
  }
  
  // Normalize the brand name (convert to lowercase, replace spaces with underscores)
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '_');
  
  const sql = 'INSERT INTO brands (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name';
  db.query(sql, [normalizedName], (err, result) => {
    if (err) {
      console.error('Error creating brand:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Brand already exists' });
      }
      return res.status(500).json({ message: 'Error creating brand' });
    }
    
    // Return the brand (either newly created or existing)
    const selectSql = 'SELECT id, name FROM brands WHERE name = ?';
    db.query(selectSql, [normalizedName], (selectErr, selectResults) => {
      if (selectErr) {
        console.error('Error fetching created brand:', selectErr);
        return res.status(500).json({ message: 'Brand created but error fetching it' });
      }
      res.status(201).json({ 
        message: 'Brand created successfully',
        brand: selectResults[0]
      });
    });
  });
});

module.exports = router;

