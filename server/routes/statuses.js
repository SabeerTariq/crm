const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const db = require('../db');

// Get all task statuses
router.get('/', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const sql = `
      SELECT * FROM task_statuses 
      ORDER BY status_order ASC, status_name ASC
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error fetching statuses' });
      }
      res.json({ statuses: results });
    });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ message: 'Error fetching statuses' });
  }
});

// Create a new task status
router.post('/', auth, authorize('tasks', 'write'), async (req, res) => {
  try {
    const { status_name, status_color, status_order } = req.body;

    if (!status_name || !status_color) {
      return res.status(400).json({ message: 'Status name and color are required' });
    }

    // Check if status name already exists
    const checkSql = 'SELECT id FROM task_statuses WHERE status_name = ?';
    db.query(checkSql, [status_name], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error checking status' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Status name already exists' });
      }

      // Insert new status
      const insertSql = `
        INSERT INTO task_statuses (status_name, status_color, status_order, is_default)
        VALUES (?, ?, ?, FALSE)
      `;
      
      const values = [
        status_name,
        status_color,
        status_order || 0
      ];

      db.query(insertSql, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error creating status' });
        }

        res.status(201).json({ 
          message: 'Status created successfully',
          status: {
            id: result.insertId,
            status_name,
            status_color,
            status_order: status_order || 0,
            is_default: false
          }
        });
      });
    });
  } catch (error) {
    console.error('Error creating status:', error);
    res.status(500).json({ message: 'Error creating status' });
  }
});

// Update a task status
router.put('/:id', auth, authorize('tasks', 'write'), async (req, res) => {
  try {
    const statusId = req.params.id;
    const { status_name, status_color, status_order } = req.body;

    if (!status_name || !status_color) {
      return res.status(400).json({ message: 'Status name and color are required' });
    }

    // Check if status exists and is not default
    const checkSql = 'SELECT id, is_default FROM task_statuses WHERE id = ?';
    db.query(checkSql, [statusId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error checking status' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Status not found' });
      }

      if (results[0].is_default) {
        return res.status(400).json({ message: 'Cannot modify default statuses' });
      }

      // Check if new status name conflicts with existing ones
      const nameCheckSql = 'SELECT id FROM task_statuses WHERE status_name = ? AND id != ?';
      db.query(nameCheckSql, [status_name, statusId], (err, nameResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error checking status name' });
        }

        if (nameResults.length > 0) {
          return res.status(400).json({ message: 'Status name already exists' });
        }

        // Update status
        const updateSql = `
          UPDATE task_statuses 
          SET status_name = ?, status_color = ?, status_order = ?
          WHERE id = ?
        `;
        
        const values = [status_name, status_color, status_order || 0, statusId];

        db.query(updateSql, values, (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error updating status' });
          }

          res.json({ 
            message: 'Status updated successfully',
            status: {
              id: statusId,
              status_name,
              status_color,
              status_order: status_order || 0,
              is_default: false
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Delete a task status
router.delete('/:id', auth, authorize('tasks', 'write'), async (req, res) => {
  try {
    const statusId = req.params.id;

    // Check if status exists and is not default
    const checkSql = 'SELECT id, is_default, status_name FROM task_statuses WHERE id = ?';
    db.query(checkSql, [statusId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error checking status' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Status not found' });
      }

      if (results[0].is_default) {
        return res.status(400).json({ message: 'Cannot delete default statuses' });
      }

      // Check if any tasks are using this status
      const taskCheckSql = 'SELECT COUNT(*) as count FROM project_tasks WHERE status = ?';
      db.query(taskCheckSql, [results[0].status_name], (err, taskResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error checking task usage' });
        }

        if (taskResults[0].count > 0) {
          return res.status(400).json({ 
            message: `Cannot delete status. ${taskResults[0].count} task(s) are using this status. Please reassign them first.` 
          });
        }

        // Delete status
        const deleteSql = 'DELETE FROM task_statuses WHERE id = ?';
        db.query(deleteSql, [statusId], (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error deleting status' });
          }

          res.json({ message: 'Status deleted successfully' });
        });
      });
    });
  } catch (error) {
    console.error('Error deleting status:', error);
    res.status(500).json({ message: 'Error deleting status' });
  }
});

// Reorder statuses
router.put('/reorder', auth, authorize('tasks', 'write'), async (req, res) => {
  try {
    const { statuses } = req.body; // Array of {id, status_order}

    if (!Array.isArray(statuses)) {
      return res.status(400).json({ message: 'Statuses array is required' });
    }

    // Update each status order
    const updatePromises = statuses.map(status => {
      return new Promise((resolve, reject) => {
        const sql = 'UPDATE task_statuses SET status_order = ? WHERE id = ?';
        db.query(sql, [status.status_order, status.id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });

    await Promise.all(updatePromises);
    res.json({ message: 'Status order updated successfully' });
  } catch (error) {
    console.error('Error reordering statuses:', error);
    res.status(500).json({ message: 'Error reordering statuses' });
  }
});

module.exports = router;



