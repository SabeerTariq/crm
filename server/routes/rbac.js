// server/routes/rbac.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize'); // use roles module perms

// List modules & actions available (from permissions table)
router.get('/modules', auth, authorize('roles','read'), (req, res) => {
  const sql = 'SELECT module, action FROM permissions ORDER BY module, action';
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/** ROLES CRUD **/
// List roles
router.get('/roles', auth, authorize('roles','read'), (req, res) => {
  db.query('SELECT * FROM roles ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Create role
router.post('/roles', auth, authorize('roles','create'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  db.query('INSERT INTO roles (name, description) VALUES (?,?)', [name, description || null], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, message: 'Role created' });
  });
});

// Update role
router.put('/roles/:id', auth, authorize('roles','update'), (req, res) => {
  const { name, description } = req.body;
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (!fields.length) return res.status(400).json({ message: 'No fields' });
  params.push(req.params.id);
  db.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Role updated' });
  });
});

// Delete role
router.delete('/roles/:id', auth, authorize('roles','delete'), (req, res) => {
  db.query('DELETE FROM roles WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Role deleted' });
  });
});

// Get role's permissions
router.get('/roles/:id/permissions', auth, authorize('roles','read'), (req, res) => {
  const sql = `
    SELECT p.id, p.module, p.action
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.module, p.action
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// Set role's permissions (replace all)
router.post('/roles/:id/permissions', auth, authorize('roles','update'), (req, res) => {
  const roleId = req.params.id;
  const { permissions } = req.body; // array of {module, action}

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'permissions must be array' });
  }

  // Resolve permission ids
  const modulesActions = permissions.map(p => [p.module, p.action]);
  if (!modulesActions.length) {
    // Clear all
    db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId], (err) => {
      if (err) return res.status(500).json(err);
      return res.json({ message: 'Permissions cleared' });
    });
    return;
  }

  const selectSql = `
    SELECT id, module, action
    FROM permissions
    WHERE (module, action) IN (${modulesActions.map(()=>'(?, ?)').join(',')})
  `;
  db.query(selectSql, modulesActions.flat(), (err, permRows) => {
    if (err) return res.status(500).json(err);
    if (!permRows.length) return res.status(400).json({ message: 'No matching permissions' });

    // Replace: delete old, insert new
    db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId], (err2) => {
      if (err2) return res.status(500).json(err2);
      const values = permRows.map(p => [roleId, p.id]);
      db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values], (err3) => {
        if (err3) return res.status(500).json(err3);
        res.json({ message: 'Permissions updated' });
      });
    });
  });
});

/** ASSIGN ROLE TO USER **/
router.post('/users/:id/role', auth, authorize('users','update'), (req, res) => {
  const { role_id } = req.body;
  if (!role_id) return res.status(400).json({ message: 'role_id required' });
  db.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'User role updated' });
  });
});

/** GET CURRENT USER'S PERMISSIONS **/
router.get('/user/permissions', auth, (req, res) => {
  const userId = req.user.id;
  // Removed verbose permission logging to clean up console output
  
  // If user is admin (role_id = 1), return all permissions
  if (req.user.role_id === 1) {
    const sql = 'SELECT module, action FROM permissions ORDER BY module, action';
    db.query(sql, (err, rows) => {
      if (err) {
        console.error('Error fetching admin permissions:', err);
        return res.status(500).json(err);
      }
      res.json(rows);
    });
    return;
  }

  // Get user's role permissions
  const sql = `
    SELECT p.module, p.action
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ?
    ORDER BY p.module, p.action
  `;
  
  db.query(sql, [req.user.role_id], (err, rows) => {
    if (err) {
      console.error('Error fetching user permissions:', err);
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

module.exports = router;
