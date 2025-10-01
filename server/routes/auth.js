const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role_id } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
    [name, email, hashed, role_id || 2], // Default to lead-scraper role (id: 2)
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'User Registered' });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Get user with role information
  const sql = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.password, 
      u.role_id, 
      r.name as role_name, 
      r.description as role_description
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = ?
  `;
  
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ message: 'Invalid Credentials' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    
    // Create user object with role info
    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id, // Role ID
      role_name: user.role_name, // Role name
      role_description: user.role_description // Role description
    };
    
    const token = jwt.sign(
      { id: user.id, role_id: user.role_id }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );
    res.json({ token, user: userObj });
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
