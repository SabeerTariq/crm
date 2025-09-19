const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all upseller teams
router.get('/', auth, authorize('upseller_teams', 'read'), (req, res) => {
  const sql = `
    SELECT ut.*, u.name as created_by_name,
           COUNT(utm.user_id) as member_count
    FROM upseller_teams ut
    LEFT JOIN users u ON ut.created_by = u.id
    LEFT JOIN upseller_team_members utm ON ut.id = utm.team_id
    GROUP BY ut.id
    ORDER BY ut.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get available upseller users for team (upseller role users not in any team)
router.get('/available-users', auth, authorize('upseller_teams', 'read'), (req, res) => {
  console.log('Fetching available upseller users...');
  const sql = `
    SELECT u.id, u.name, u.email, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'upseller' 
    AND u.id NOT IN (
      SELECT DISTINCT user_id 
      FROM upseller_team_members 
      WHERE user_id IS NOT NULL
    )
    ORDER BY u.name
  `;
  
  console.log('SQL Query:', sql);
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    console.log('Query results:', results);
    console.log('Number of users found:', results.length);
    res.json(results);
  });
});

// Get users for upseller team assignment (includes users already in this team)
router.get('/:id/users', auth, authorize('upseller_teams', 'read'), (req, res) => {
  const teamId = req.params.id;
  
  const sql = `
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      r.name as role_name,
      CASE 
        WHEN utm.user_id IS NOT NULL THEN 1 
        ELSE 0 
      END as is_member,
      utm.role as team_role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN upseller_team_members utm ON u.id = utm.user_id AND utm.team_id = ?
    WHERE r.name = 'upseller'
    ORDER BY is_member DESC, u.name
  `;
  
  db.query(sql, [teamId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get all upseller users for target setting (regardless of team membership)
router.get('/all-upsellers', auth, authorize('upseller_targets', 'read'), (req, res) => {
  console.log('Fetching all upseller users for target setting...');
  const sql = `
    SELECT u.id, u.name, u.email, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'upseller'
    ORDER BY u.name
  `;
  
  console.log('SQL Query:', sql);
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    console.log('Query results:', results);
    console.log('Number of upseller users found:', results.length);
    res.json(results);
  });
});

// Get upseller team by ID with members
router.get('/:id', auth, authorize('upseller_teams', 'read'), (req, res) => {
  const teamId = req.params.id;
  
  // Get team details
  const teamSql = `
    SELECT ut.*, u.name as created_by_name
    FROM upseller_teams ut
    LEFT JOIN users u ON ut.created_by = u.id
    WHERE ut.id = ?
  `;
  
  // Get team members
  const membersSql = `
    SELECT utm.*, u.name as user_name, u.email, r.name as role_name
    FROM upseller_team_members utm
    JOIN users u ON utm.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE utm.team_id = ?
    ORDER BY utm.role DESC, u.name
  `;
  
  db.query(teamSql, [teamId], (err, teamResults) => {
    if (err) return res.status(500).json(err);
    if (teamResults.length === 0) return res.status(404).json({ message: 'Upseller team not found' });
    
    db.query(membersSql, [teamId], (err, memberResults) => {
      if (err) return res.status(500).json(err);
      
      res.json({
        ...teamResults[0],
        members: memberResults
      });
    });
  });
});

// Create upseller team
router.post('/', auth, authorize('upseller_teams', 'create'), (req, res) => {
  const { name, description, member_ids = [] } = req.body;
  
  // Check if any users are already in other upseller teams
  if (member_ids.length > 0) {
    const checkSql = `
      SELECT u.name, ut.name as team_name
      FROM users u
      JOIN upseller_team_members utm ON u.id = utm.user_id
      JOIN upseller_teams ut ON utm.team_id = ut.id
      WHERE u.id IN (${member_ids.map(() => '?').join(',')})
    `;
    
    db.query(checkSql, member_ids, (err, results) => {
      if (err) return res.status(500).json(err);
      
      if (results.length > 0) {
        const conflicts = results.map(r => `${r.name} (already in ${r.team_name})`).join(', ');
        return res.status(400).json({ 
          message: `Cannot add users who are already in other upseller teams: ${conflicts}` 
        });
      }
      
      // Proceed with team creation
      createUpsellerTeam();
    });
  } else {
    createUpsellerTeam();
  }
  
  function createUpsellerTeam() {
    const sql = 'INSERT INTO upseller_teams (name, description, created_by) VALUES (?, ?, ?)';
    const params = [name, description, req.user.id];
    
    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json(err);
      
      const teamId = result.insertId;
      
      // Add members to team
      if (member_ids.length > 0) {
        const memberValues = member_ids.map(userId => [teamId, userId]);
        const memberSql = 'INSERT INTO upseller_team_members (team_id, user_id) VALUES ?';
        
        db.query(memberSql, [memberValues], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: 'Upseller team created successfully', teamId });
        });
      } else {
        res.json({ message: 'Upseller team created successfully', teamId });
      }
    });
  }
});

// Update upseller team
router.put('/:id', auth, authorize('upseller_teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const { name, description, member_ids = [] } = req.body;
  
  // Check if any users are already in other upseller teams (excluding current team)
  if (member_ids.length > 0) {
    const checkSql = `
      SELECT u.name, ut.name as team_name
      FROM users u
      JOIN upseller_team_members utm ON u.id = utm.user_id
      JOIN upseller_teams ut ON utm.team_id = ut.id
      WHERE u.id IN (${member_ids.map(() => '?').join(',')})
      AND utm.team_id != ?
    `;
    
    db.query(checkSql, [...member_ids, teamId], (err, results) => {
      if (err) return res.status(500).json(err);
      
      if (results.length > 0) {
        const conflicts = results.map(r => `${r.name} (already in ${r.team_name})`).join(', ');
        return res.status(400).json({ 
          message: `Cannot add users who are already in other upseller teams: ${conflicts}` 
        });
      }
      
      // Proceed with team update
      updateUpsellerTeam();
    });
  } else {
    updateUpsellerTeam();
  }
  
  function updateUpsellerTeam() {
    const sql = 'UPDATE upseller_teams SET name = ?, description = ? WHERE id = ?';
    const params = [name, description, teamId];
    
    db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);
      
      // Update team members
      // First, remove all existing members
      db.query('DELETE FROM upseller_team_members WHERE team_id = ?', [teamId], (err) => {
        if (err) return res.status(500).json(err);
        
        // Add new members
        if (member_ids.length > 0) {
          const memberValues = member_ids.map(userId => [teamId, userId]);
          const memberSql = 'INSERT INTO upseller_team_members (team_id, user_id) VALUES ?';
          
          db.query(memberSql, [memberValues], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Upseller team updated successfully' });
          });
        } else {
          res.json({ message: 'Upseller team updated successfully' });
        }
      });
    });
  }
});

// Delete upseller team
router.delete('/:id', auth, authorize('upseller_teams', 'delete'), (req, res) => {
  const teamId = req.params.id;
  
  const sql = 'DELETE FROM upseller_teams WHERE id = ?';
  db.query(sql, [teamId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Upseller team not found' });
    res.json({ message: 'Upseller team deleted successfully' });
  });
});

// Add member to upseller team
router.post('/:id/members', auth, authorize('upseller_teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const { user_id, role = 'member' } = req.body;
  
  const sql = 'INSERT INTO upseller_team_members (team_id, user_id, role) VALUES (?, ?, ?)';
  const params = [teamId, user_id, role];
  
  db.query(sql, params, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'User is already a member of this upseller team' });
      }
      return res.status(500).json(err);
    }
    res.json({ message: 'Member added to upseller team successfully' });
  });
});

// Remove member from upseller team
router.delete('/:id/members/:userId', auth, authorize('upseller_teams', 'update'), (req, res) => {
  const teamId = req.params.id;
  const userId = req.params.userId;
  
  const sql = 'DELETE FROM upseller_team_members WHERE team_id = ? AND user_id = ?';
  const params = [teamId, userId];
  
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found in upseller team' });
    res.json({ message: 'Member removed from upseller team successfully' });
  });
});

module.exports = router;
