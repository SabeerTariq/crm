const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all teams
router.get('/', auth, authorize('teams', 'read'), (req, res) => {
  const sql = `
    SELECT t.*, u.name as created_by_name,
           COUNT(tm.user_id) as member_count
    FROM teams t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN team_members tm ON t.id = tm.team_id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get team by ID with members
router.get('/:id', auth, authorize('teams', 'read'), (req, res) => {
  const teamId = req.params.id;
  
  // Get team details
  const teamSql = `
    SELECT t.*, u.name as created_by_name
    FROM teams t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `;
  
  // Get team members
  const membersSql = `
    SELECT tm.*, u.name as user_name, u.email, r.name as role_name
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE tm.team_id = ?
    ORDER BY tm.role DESC, u.name
  `;
  
  db.query(teamSql, [teamId], (err, teamResults) => {
    if (err) return res.status(500).json(err);
    if (teamResults.length === 0) return res.status(404).json({ message: 'Team not found' });
    
    db.query(membersSql, [teamId], (err, memberResults) => {
      if (err) return res.status(500).json(err);
      
      res.json({
        ...teamResults[0],
        members: memberResults
      });
    });
  });
});

// Create team
router.post('/', auth, authorize('teams', 'create'), (req, res) => {
  const { name, description, member_ids = [] } = req.body;
  
  const sql = 'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)';
  const params = [name, description, req.user.id];
  
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    
    const teamId = result.insertId;
    
    // Add members to team
    if (member_ids.length > 0) {
      const memberValues = member_ids.map(userId => [teamId, userId]);
      const memberSql = 'INSERT INTO team_members (team_id, user_id) VALUES ?';
      
      db.query(memberSql, [memberValues], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Team created successfully', teamId });
      });
    } else {
      res.json({ message: 'Team created successfully', teamId });
    }
  });
});

// Update team
router.put('/:id', auth, authorize('teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const { name, description, member_ids = [] } = req.body;
  
  const sql = 'UPDATE teams SET name = ?, description = ? WHERE id = ?';
  const params = [name, description, teamId];
  
  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    
    // Update team members
    // First, remove all existing members
    db.query('DELETE FROM team_members WHERE team_id = ?', [teamId], (err) => {
      if (err) return res.status(500).json(err);
      
      // Add new members
      if (member_ids.length > 0) {
        const memberValues = member_ids.map(userId => [teamId, userId]);
        const memberSql = 'INSERT INTO team_members (team_id, user_id) VALUES ?';
        
        db.query(memberSql, [memberValues], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: 'Team updated successfully' });
        });
      } else {
        res.json({ message: 'Team updated successfully' });
      }
    });
  });
});

// Delete team
router.delete('/:id', auth, authorize('teams', 'delete'), (req, res) => {
  const teamId = req.params.id;
  
  const sql = 'DELETE FROM teams WHERE id = ?';
  db.query(sql, [teamId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted successfully' });
  });
});

// Add member to team
router.post('/:id/members', auth, authorize('teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const { user_id, role = 'member' } = req.body;
  
  const sql = 'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)';
  const params = [teamId, user_id, role];
  
  db.query(sql, params, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'User is already a member of this team' });
      }
      return res.status(500).json(err);
    }
    res.json({ message: 'Member added to team successfully' });
  });
});

// Remove member from team
router.delete('/:id/members/:userId', auth, authorize('teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const userId = req.params.userId;
  
  const sql = 'DELETE FROM team_members WHERE team_id = ? AND user_id = ?';
  const params = [teamId, userId];
  
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found in team' });
    res.json({ message: 'Member removed from team successfully' });
  });
});

// Get available users for team (sales role users not in any team)
router.get('/available-users', auth, authorize('teams', 'read'), (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'sales' 
    AND u.id NOT IN (
      SELECT DISTINCT user_id 
      FROM team_members 
      WHERE user_id IS NOT NULL
    )
    ORDER BY u.name
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
