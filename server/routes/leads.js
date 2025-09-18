const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const StatsService = require('../services/statsService');
const CustomerSalesService = require('../services/customerSalesService');


// Get Leads with search and filtering
router.get('/', auth, authorize('leads','read'), (req, res) => {
  const { search, source, createdBy, startDate, endDate, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  // Check if user is admin
  const isAdmin = req.user.role_id === 1;
  
  // Build base query conditions
  let whereConditions = [];
  let queryParams = [];
  
  // Search functionality
  if (search) {
    whereConditions.push('(l.name LIKE ? OR l.company_name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.city LIKE ? OR l.state LIKE ? OR l.service_required LIKE ? OR l.notes LIKE ?)');
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  // Filter by source
  if (source) {
    whereConditions.push('l.source = ?');
    queryParams.push(source);
  }
  
  // Filter by created by
  if (createdBy) {
    whereConditions.push('l.created_by = ?');
    queryParams.push(createdBy);
  }
  
  // Filter by date range
  if (startDate) {
    whereConditions.push('DATE(l.created_at) >= ?');
    queryParams.push(startDate);
  }
  if (endDate) {
    whereConditions.push('DATE(l.created_at) <= ?');
    queryParams.push(endDate);
  }
  
  // Role-based filtering
  if (!isAdmin) {
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
        whereConditions.push('l.created_by = ?');
        queryParams.push(userId);
      }
      
      // Build final query
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      const sql = `
        SELECT l.*, 
               u1.name as created_by_name
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const countSql = `
        SELECT COUNT(*) as total
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        ${whereClause}
      `;
      
      // Add pagination parameters
      queryParams.push(parseInt(limit), offset);
      
      // Execute both queries
      Promise.all([
        new Promise((resolve, reject) => {
          db.query(sql, queryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(countSql, queryParams.slice(0, -2), (err, results) => {
            if (err) reject(err);
            else resolve(results[0].total);
          });
        })
      ])
      .then(([leads, total]) => {
        res.json({
          leads,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      })
      .catch(err => {
        console.error('Error fetching leads:', err);
        res.status(500).json({ message: 'Error fetching leads' });
      });
    });
  } else {
    // Admin can see all leads
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const sql = `
      SELECT l.*, 
             u1.name as created_by_name
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      ${whereClause}
    `;
    
    // Add pagination parameters
    queryParams.push(parseInt(limit), offset);
    
    // Execute both queries
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(sql, queryParams, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(countSql, queryParams.slice(0, -2), (err, results) => {
          if (err) reject(err);
          else resolve(results[0].total);
        });
      })
    ])
    .then(([leads, total]) => {
      res.json({
        leads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    })
    .catch(err => {
      console.error('Error fetching leads:', err);
      res.status(500).json({ message: 'Error fetching leads' });
    });
  }
});

// Get filter options for leads
router.get('/filter-options', auth, authorize('leads','read'), (req, res) => {
  const isAdmin = req.user.role_id === 1;
  
  // Get unique sources
  const sourcesSql = `
    SELECT DISTINCT source 
    FROM leads 
    WHERE source IS NOT NULL AND source != ''
    ORDER BY source
  `;
  
  // Get users who have created leads
  const usersSql = isAdmin ? `
    SELECT DISTINCT u.id, u.name
    FROM users u
    INNER JOIN leads l ON u.id = l.created_by
    ORDER BY u.name
  ` : `
    SELECT u.id, u.name
    FROM users u
    WHERE u.id = ?
  `;
  
  const queryParams = isAdmin ? [] : [req.user.id];
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(sourcesSql, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => row.source));
      });
    }),
    new Promise((resolve, reject) => {
      db.query(usersSql, queryParams, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
  .then(([sources, users]) => {
    res.json({
      sources,
      users
    });
  })
  .catch(err => {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ message: 'Error fetching filter options' });
  });
});

// Add Lead
router.post('/', auth, authorize('leads','create'), async (req, res) => {
  const { name, company_name, email, phone, city, state, source, service_required, notes } = req.body;
  
  db.query(
    'INSERT INTO leads (name, company_name, email, phone, city, state, source, service_required, notes, assigned_to, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [name, company_name, email, phone, city, state, source, service_required, notes, req.user.id, req.user.id],
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

// Update Lead
router.put('/:id', auth, authorize('leads','update'), async (req, res) => {
  const { name, company_name, email, phone, city, state, source, service_required, notes } = req.body;
  const leadId = req.params.id;
  
  // Check if lead exists and user has permission to edit
  db.query('SELECT * FROM leads WHERE id = ?', [leadId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: 'Lead not found' });
    
    const lead = results[0];
    
    // Check if user can edit this lead (admin or lead creator)
    if (req.user.role_id !== 1 && lead.created_by !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit leads you created' });
    }
    
    // Update the lead
    db.query(
      'UPDATE leads SET name = ?, company_name = ?, email = ?, phone = ?, city = ?, state = ?, source = ?, service_required = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [name, company_name, email, phone, city, state, source, service_required, notes, leadId],
      (err2, result) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: 'Lead updated successfully' });
      }
    );
  });
});

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
      INSERT INTO customers (name, company_name, email, phone, city, state, source, service_required, notes, assigned_to, created_by, converted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [lead.name, lead.company_name, lead.email, lead.phone, lead.city, lead.state, lead.source, lead.service_required, lead.notes, converterUserId, converterUserId];

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

module.exports = router;
  