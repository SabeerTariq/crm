const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all todos for the current user
router.get('/', auth, authorize('todos', 'read'), (req, res) => {
  const { status, priority } = req.query;
  
  let query = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [req.user.id];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching todos:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch todos'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});

// Get a single todo
router.get('/:id', auth, authorize('todos', 'read'), (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching todo:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch todo'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    res.json({
      success: true,
      data: results[0]
    });
  });
});

// Create a new todo
router.post('/', auth, authorize('todos', 'create'), (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const query = `
    INSERT INTO todos (user_id, title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    req.user.id,
    title,
    description || null,
    status || 'pending',
    priority || 'medium',
    due_date || null
  ];
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error creating todo:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create todo'
      });
    }
    
    res.json({
      success: true,
      message: 'Todo created successfully',
      data: {
        id: result.insertId
      }
    });
  });
});

// Update a todo
router.put('/:id', auth, authorize('todos', 'update'), (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  
  // Build update query dynamically
  const updates = [];
  const values = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
    
    // Set completed_at if status is 'completed'
    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    } else if (status !== 'completed') {
      updates.push('completed_at = NULL');
    }
  }
  
  if (priority !== undefined) {
    updates.push('priority = ?');
    values.push(priority);
  }
  
  if (due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(due_date || null);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update'
    });
  }
  
  values.push(id, req.user.id);
  
  const query = `UPDATE todos SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`;
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating todo:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Todo updated successfully'
    });
  });
});

// Delete a todo
router.delete('/:id', auth, authorize('todos', 'delete'), (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id], (err, result) => {
    if (err) {
      console.error('Error deleting todo:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  });
});

// Get todo statistics
router.get('/stats/summary', auth, authorize('todos', 'read'), (req, res) => {
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM todos
    WHERE user_id = ?
    GROUP BY status
  `;
  
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching todo stats:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch todo statistics'
      });
    }
    
    const stats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };
    
    results.forEach(row => {
      stats[row.status] = row.count;
      stats.total += row.count;
    });
    
    res.json({
      success: true,
      data: stats
    });
  });
});

module.exports = router;
