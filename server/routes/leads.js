const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const StatsService = require('../services/statsService');
const CustomerSalesService = require('../services/customerSalesService');


// Get Leads
router.get('/', auth, authorize('leads','read'), (req, res) => {
  // Check if user is admin
  const isAdmin = req.user.role_id === 1;
  
  if (isAdmin) {
    // Admin can see all leads
    const sql = `
      SELECT l.*, 
             u1.name as created_by_name
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      ORDER BY l.created_at DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For RBAC users, check if they have lead-scraper role
  const userId = req.user.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Check if user has lead-scraper role
  const checkRoleSql = `
    SELECT r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.name = 'lead-scraper'
  `;
  
  db.query(checkRoleSql, [userId], (err, roleRows) => {
    if (err) {
      console.error('Error checking lead-scraper role:', err);
      return res.status(500).json({ message: 'Error checking permissions' });
    }
    
    if (roleRows.length > 0) {
      // Lead-scraper users can only see their own leads
      const sql = `
        SELECT l.*, 
               u1.name as created_by_name
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        WHERE l.created_by = ? 
        ORDER BY l.created_at DESC
      `;
      db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      });
    } else {
      // Other RBAC users with leads.read permission can see all leads
      const sql = `
        SELECT l.*, 
               u1.name as created_by_name
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        ORDER BY l.created_at DESC
      `;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      });
    }
  });
});

// Add Lead
router.post('/', auth, authorize('leads','create'), async (req, res) => {
  const { name, email, phone, source, notes } = req.body;
  
  db.query(
    'INSERT INTO leads (name, email, phone, source, notes, assigned_to, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [name, email, phone, source, notes, req.user.id, req.user.id],
    async (err, result) => {
      if (err) return res.status(500).json(err);
      
      try {
        // Track lead creation for statistics
        await StatsService.trackLeadCreated(req.user.id, result.insertId);
        res.json({ message: 'Lead Added' });
      } catch (statsErr) {
        console.error('Error tracking lead creation:', statsErr);
        res.json({ message: 'Lead Added (stats tracking failed)' });
      }
    }
  );
});

module.exports = router;

// Convert Lead to Customer
router.post('/convert/:id', auth, authorize('customers','create'), async (req, res) => {
  const leadId = req.params.id;
  
  // Get the lead
  db.query('SELECT * FROM leads WHERE id = ?', [leadId], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Lead not found' });

    const lead = results[0];
    const originalLeadCreator = lead.created_by; // The user who originally created the lead
    const converterUserId = req.user.id; // The user who is converting the lead

    // Insert into customers - assign to the user who is converting the lead
    const insertCustomer = `
      INSERT INTO customers (name, email, phone, source, notes, assigned_to, created_by, converted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [lead.name, lead.email, lead.phone, lead.source, lead.notes, converterUserId, converterUserId];

    db.query(insertCustomer, params, async (err2, customerResult) => {
      if (err2) return res.status(500).json({ message: 'Failed to create customer' });

      try {
        // Update customer totals (will be 0 initially since no sales yet)
        await CustomerSalesService.updateCustomerTotals(customerResult.insertId);
        
        // Track lead conversion for the converter (sales person)
        await StatsService.trackLeadConverted(converterUserId, leadId);
        
        // Track conversion for the original lead creator (lead-scraper)
        if (originalLeadCreator && originalLeadCreator !== converterUserId) {
          await StatsService.trackLeadConverted(originalLeadCreator, leadId);
        }
        
        // Now delete the lead after successful conversion and tracking
        db.query('DELETE FROM leads WHERE id = ?', [leadId], async (err3) => {
          if (err3) return res.status(500).json({ message: 'Failed to delete lead' });
          res.json({ message: 'Lead converted to customer' });
        });
      } catch (statsErr) {
        console.error('Error tracking lead conversion:', statsErr);
        // Still delete the lead even if tracking fails
        db.query('DELETE FROM leads WHERE id = ?', [leadId], async (err3) => {
          if (err3) return res.status(500).json({ message: 'Failed to delete lead' });
          res.json({ message: 'Lead converted to customer (stats tracking failed)' });
        });
      }
    });
  });
});
  