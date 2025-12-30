// server/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');      // you already have this
const isAdmin = require('../middleware/isAdmin'); // created above
const authorize = require('../middleware/authorize');


// READ: list users (no passwords) with role information - Admin only
router.get('/', auth, isAdmin, authorize('users','read'), (req, res) => {
  const sql = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.created_at, 
      u.role_id, 
      r.name as role_name, 
      r.description as role_description,
      CASE 
        WHEN u.role_id = 1 THEN 'Admin'
        WHEN u.role_id IS NOT NULL THEN 'User'
        ELSE 'No Role'
      END as user_type
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// READ: list users for team management (sales role users only) - No admin required
router.get('/for-teams', auth, authorize('teams','read'), (req, res) => {
  const sql = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role_id, 
      r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'Front Seller' OR r.id = 3
    ORDER BY u.name
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching users for teams:', err);
      return res.status(500).json(err);
    }
    console.log('Users for teams query result:', rows.length, 'users found');
    res.json(rows);
  });
});

// CREATE: add user (hash password) - RBAC roles only
router.post('/', auth, isAdmin, authorize('users','create'), async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    if (!role_id) {
      return res.status(400).json({ message: 'role_id is required' });
    }
    
    // Verify the role exists
    db.query('SELECT id FROM roles WHERE id = ?', [role_id], async (err, roleRows) => {
      if (err) return res.status(500).json(err);
      if (roleRows.length === 0) {
        return res.status(400).json({ message: 'Invalid role_id' });
      }
      
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)';
        db.query(sql, [name, email, hashedPassword, role_id], (err, result) => {
          if (err) return res.status(500).json(err);
          res.json({ id: result.insertId, message: 'User created' });
        });
      } catch (hashErr) {
        res.status(500).json({ message: 'Password hashing failed' });
      }
    });
  } catch (e) {
    res.status(500).json(e);
  }
});

// UPDATE: edit user (hash new password if provided) - RBAC roles only
router.put('/:id', auth, isAdmin, authorize('users','update'), async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;
    
    // If role_id is provided, verify it exists
    if (role_id) {
      db.query('SELECT id FROM roles WHERE id = ?', [role_id], async (err, roleRows) => {
        if (err) return res.status(500).json(err);
        if (roleRows.length === 0) {
          return res.status(400).json({ message: 'Invalid role_id' });
        }
        
        // Proceed with update
        await performUpdate();
      });
    } else {
      // No role change, proceed with update
      await performUpdate();
    }
    
    async function performUpdate() {
      try {
        // build dynamic update
        const fields = [];
        const params = [];

        if (name !== undefined) { fields.push('name = ?'); params.push(name); }
        if (email !== undefined) { fields.push('email = ?'); params.push(email); }
        if (role_id !== undefined) { fields.push('role_id = ?'); params.push(role_id); }
        if (password) {
          const hashed = await bcrypt.hash(password, 10);
          fields.push('password = ?');
          params.push(hashed);
        }

        if (fields.length === 0) {
          return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(req.params.id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        db.query(sql, params, (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: 'User updated' });
        });
      } catch (e) {
        res.status(500).json(e);
      }
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

// DELETE: remove user (prevent self-delete if you want)
router.delete('/:id', auth, isAdmin, authorize('users','delete'), (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }
  db.query('DELETE FROM users WHERE id = ?', [targetId], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'User deleted' });
  });
});

// GET: available roles for user assignment
router.get('/roles', auth, isAdmin, authorize('users','read'), (req, res) => {
  const sql = 'SELECT id, name, description FROM roles ORDER BY name';
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
