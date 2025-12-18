const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const StatsService = require('../services/statsService');
const CustomerSalesService = require('../services/customerSalesService');
const ReminderService = require('../services/reminderService');
const { uploadMultiple, handleUploadError } = require('../middleware/leadUpload');
const path = require('path');
const fs = require('fs');


// Get Leads with search and filtering
router.get('/', auth, authorize('leads','read'), (req, res) => {
  const { search, source, createdBy, startDate, endDate, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  // Debug: Log the raw query object
  console.log('=== LEADS API REQUEST ===');
  console.log('Full query object:', JSON.stringify(req.query, null, 2));
  console.log('Source parameter type:', typeof source);
  console.log('Source parameter value:', source);
  console.log('Is source an array?', Array.isArray(source));
  
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
  
  // Filter by source (supports multiple sources)
  // Express by default doesn't parse multiple query params as array
  // We need to manually extract all source values from the query string
  let sources = [];
  
  // Method 1: Check if Express parsed it as an array
  if (req.query.source) {
    if (Array.isArray(req.query.source)) {
      sources = req.query.source.filter(s => s && typeof s === 'string' && s.trim() !== '').map(s => s.trim());
    } else if (typeof req.query.source === 'string' && req.query.source.trim() !== '') {
      sources = [req.query.source.trim()];
    }
  }
  
  // Method 2: Manually parse from URL if not already an array (Express default behavior)
  if (sources.length === 0 || (sources.length === 1 && req.url.includes('source='))) {
    // Extract all source parameters from the URL
    const url = req.originalUrl || req.url;
    const queryString = url.split('?')[1] || '';
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const allSources = params.getAll('source'); // getAll returns array of all values
      if (allSources.length > 0) {
        sources = allSources.filter(s => s && s.trim() !== '').map(s => s.trim());
      }
    }
  }
  
  console.log('Processing source filter - Raw req.query.source:', req.query.source);
  console.log('Processing source filter - URL:', req.originalUrl || req.url);
  console.log('Processing source filter - Parsed sources:', sources);
  
  // Debug: Check what source values actually exist in database
  if (sources.length > 0) {
    db.query('SELECT DISTINCT source, COUNT(*) as count FROM leads WHERE source IS NOT NULL AND source != "" GROUP BY source ORDER BY count DESC LIMIT 10', (err, sourceResults) => {
      if (!err && sourceResults) {
        console.log('Available sources in database:', sourceResults.map(r => ({ source: r.source, count: r.count })));
      }
    });
  }
  
  if (sources.length > 0) {
    // Use case-insensitive matching with TRIM to handle whitespace
    // Apply LOWER and TRIM to the column, and compare with trimmed lowercase values
    const trimmedLowerSources = sources.map(s => s.trim().toLowerCase());
    const placeholders = trimmedLowerSources.map(() => '?').join(',');
    whereConditions.push(`LOWER(TRIM(COALESCE(l.source, ''))) IN (${placeholders})`);
    queryParams.push(...trimmedLowerSources);
    console.log('✓ Source filter applied:', sources);
    console.log('✓ Source filter (normalized to lowercase):', trimmedLowerSources);
    console.log('✓ Source filter SQL:', `LOWER(TRIM(COALESCE(l.source, ''))) IN (${placeholders})`);
    console.log('✓ Source filter params to bind:', trimmedLowerSources);
  } else {
    console.log('No source filter provided or empty');
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
      
      console.log('Final WHERE clause:', whereClause);
      console.log('Query params:', queryParams);
      
      const sql = `
        SELECT l.*, 
               u1.name as created_by_name,
               (SELECT GROUP_CONCAT(DISTINCT u2.name ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
                FROM lead_schedules ls
                LEFT JOIN users u2 ON ls.scheduled_by = u2.id
                WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as scheduled_by_names,
               (SELECT GROUP_CONCAT(DISTINCT ls.schedule_date ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
                FROM lead_schedules ls
                WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as schedule_dates,
               (SELECT GROUP_CONCAT(DISTINCT ls.schedule_time ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
                FROM lead_schedules ls
                WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as schedule_times,
               (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'email') as email_clicks,
               (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'phone') as phone_clicks,
               (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'business_email') as business_email_clicks,
               (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'business_phone') as business_phone_clicks
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const countSql = `
        SELECT COUNT(DISTINCT l.id) as total
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        ${whereClause}
      `;
      
      // Add userId parameters for schedule subqueries (3 times), click counts (4 times), and pagination
      queryParams.push(userId, userId, userId, userId, userId, userId, userId, parseInt(limit), offset);
      
      // For count query, we only need filter params (no subqueries or pagination)
      const countQueryParams = [...queryParams]; // Just the filter params
      
      // Execute both queries
      Promise.all([
        new Promise((resolve, reject) => {
          db.query(sql, finalQueryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(countSql, countQueryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results[0].total);
          });
        })
      ])
      .then(([leads, total]) => {
        console.log(`Returning ${leads.length} leads out of ${total} total`);
        if (sources.length > 0) {
          console.log('Sample lead sources from results:', leads.slice(0, 5).map(l => ({ id: l.id, name: l.name, source: l.source })));
          console.log('All unique sources in results:', [...new Set(leads.map(l => l.source))]);
        }
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
    
    console.log('Admin query - Final WHERE clause:', whereClause);
    console.log('Admin query - Query params:', queryParams);
    
    const sql = `
      SELECT l.*, 
             u1.name as created_by_name,
             (SELECT GROUP_CONCAT(DISTINCT u2.name ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
              FROM lead_schedules ls
              LEFT JOIN users u2 ON ls.scheduled_by = u2.id
              WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as scheduled_by_names,
             (SELECT GROUP_CONCAT(DISTINCT ls.schedule_date ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
              FROM lead_schedules ls
              WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as schedule_dates,
             (SELECT GROUP_CONCAT(DISTINCT ls.schedule_time ORDER BY ls.scheduled_at DESC SEPARATOR ', ')
              FROM lead_schedules ls
              WHERE ls.lead_id = l.id AND ls.scheduled_by = ?) as schedule_times,
             (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'email') as email_clicks,
             (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'phone') as phone_clicks,
             (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'business_email') as business_email_clicks,
             (SELECT COUNT(*) FROM lead_clicks WHERE lead_id = l.id AND user_id = ? AND click_type = 'business_phone') as business_phone_clicks
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      ${whereClause}
    `;
    
    // Build final query params
    // IMPORTANT: Parameters are bound in SQL order, not array order!
    // SQL order: scheduled_by_names (1st), schedule_dates (2nd), schedule_times (3rd),
    //            email_clicks (4th), phone_clicks (5th), business_email_clicks (6th),
    //            business_phone_clicks (7th), WHERE clause (8th), LIMIT (9th), OFFSET (10th)
    // So params must be: [userId x7, ...filterParams, limit, offset]
    const finalQueryParams = [
      req.user.id,     // For scheduled_by_names subquery (appears 1st in SQL)
      req.user.id,     // For schedule_dates subquery (appears 2nd in SQL)
      req.user.id,     // For schedule_times subquery (appears 3rd in SQL)
      req.user.id,     // For email_clicks (appears 4th in SQL)
      req.user.id,     // For phone_clicks (appears 5th in SQL)
      req.user.id,     // For business_email_clicks (appears 6th in SQL)
      req.user.id,     // For business_phone_clicks (appears 7th in SQL)
      ...queryParams,  // Filter params (search, source, createdBy, dates, etc.) - appears 8th in SQL
      parseInt(limit), // LIMIT - appears 9th in SQL
      offset           // OFFSET - appears 10th in SQL
    ];
    
    // For count query, we only need filter params (no subqueries)
    const countQueryParams = [...queryParams];
    
    console.log('Admin - Main query params count:', finalQueryParams.length);
    console.log('Admin - Main query params:', finalQueryParams);
    console.log('Admin - Count query params count:', countQueryParams.length);
    console.log('Admin - Count query params:', countQueryParams);
    
    // Execute both queries
    Promise.all([
      new Promise((resolve, reject) => {
        db.query(sql, finalQueryParams, (err, results) => {
          if (err) {
            console.error('Admin - Main query error:', err);
            reject(err);
          } else {
            console.log('Admin - Main query returned', results.length, 'rows');
            resolve(results);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.query(countSql, countQueryParams, (err, results) => {
          if (err) {
            console.error('Admin - Count query error:', err);
            reject(err);
          } else {
            console.log('Admin - Count query returned total:', results[0].total);
            resolve(results[0].total);
          }
        });
      })
    ])
    .then(([leads, total]) => {
      console.log(`Admin - Returning ${leads.length} leads out of ${total} total`);
      if (sources.length > 0) {
        console.log('Admin - Sample lead sources from results:', leads.slice(0, 5).map(l => ({ id: l.id, name: l.name, source: l.source })));
        console.log('Admin - All unique sources in results:', [...new Set(leads.map(l => l.source))]);
      }
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

// Get converted leads (customers that were converted from leads)
router.get('/converted', auth, authorize('leads','read'), (req, res) => {
  const isAdmin = req.user.role_id === 1;
  const isFrontManager = req.user.role_id === 4; // Front Manager role
  const userId = req.user.id;
  
  // Get converted customers (customers with converted_at timestamp)
  // Include information about who converted them and when
  // Admin and Front Manager can see all converted leads
  // Regular users see converted leads from leads they created (using lead_tracking)
  const sql = (isAdmin || isFrontManager) ? `
    SELECT 
      c.id,
      c.name,
      c.company_name,
      c.email,
      c.phone,
      c.city,
      c.state,
      c.source,
      c.service_required,
      c.notes,
      c.converted_at,
      u1.name as created_by_name,
      u2.name as assigned_to_name,
      (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as sales_count,
      (SELECT COALESCE(SUM(cash_in), 0) FROM sales WHERE customer_id = c.id) as total_revenue
    FROM customers c
    LEFT JOIN users u1 ON c.created_by = u1.id
    LEFT JOIN users u2 ON c.assigned_to = u2.id
    WHERE c.converted_at IS NOT NULL
    ORDER BY c.converted_at DESC
    LIMIT 100
  ` : `
    SELECT DISTINCT
      c.id,
      c.name,
      c.company_name,
      c.email,
      c.phone,
      c.city,
      c.state,
      c.source,
      c.service_required,
      c.notes,
      c.converted_at,
      u1.name as created_by_name,
      u2.name as assigned_to_name,
      (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as sales_count,
      (SELECT COALESCE(SUM(cash_in), 0) FROM sales WHERE customer_id = c.id) as total_revenue
    FROM customers c
    LEFT JOIN users u1 ON c.created_by = u1.id
    LEFT JOIN users u2 ON c.assigned_to = u2.id
    WHERE c.converted_at IS NOT NULL
      AND (
        -- Customers from leads created by this user (matched via lead_tracking)
        c.id IN (
          SELECT DISTINCT c2.id
          FROM lead_tracking lt_created
          INNER JOIN lead_tracking lt_converted ON lt_created.lead_id = lt_converted.lead_id 
            AND lt_converted.action = 'converted'
            AND lt_converted.user_id = ?
          INNER JOIN customers c2 ON (
            c2.converted_at >= DATE_SUB(lt_converted.created_at, INTERVAL 1 HOUR)
            AND c2.converted_at <= DATE_ADD(lt_converted.created_at, INTERVAL 1 HOUR)
          )
          WHERE lt_created.action = 'created'
            AND lt_created.user_id = ?
        )
        OR
        -- Customers directly converted/assigned to this user (fallback)
        (c.created_by = ? OR c.assigned_to = ?)
      )
    ORDER BY c.converted_at DESC
    LIMIT 100
  `;
  
  const queryParams = (isAdmin || isFrontManager) ? [] : [userId, userId, userId, userId];
  
  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching converted leads:', err);
      return res.status(500).json({ message: 'Error fetching converted leads' });
    }
    res.json(results);
  });
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
  const { name, company_name, nature_of_business, email, business_email, phone, business_number, business_description, city, state, country, zip_code, source, service_required, notes, budget, hours_type, day_type, created_at } = req.body;
  
  // Use provided created_at or current timestamp
  let createdAtValue;
  let createdAtPlaceholder;
  const queryParams = [name, company_name, nature_of_business || null, email, business_email || null, phone, business_number || null, business_description || null, city, state, country || null, zip_code || null, source, service_required, notes, budget || null, hours_type || null, day_type || null, req.user.id, req.user.id];
  
  if (created_at) {
    createdAtValue = new Date(created_at).toISOString().slice(0, 19).replace('T', ' ');
    createdAtPlaceholder = '?';
    queryParams.push(createdAtValue);
  } else {
    createdAtPlaceholder = 'NOW()';
  }
  
  db.query(
    `INSERT INTO leads (name, company_name, nature_of_business, email, business_email, phone, business_number, business_description, city, state, country, zip_code, source, service_required, notes, budget, hours_type, day_type, assigned_to, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${createdAtPlaceholder})`,
    queryParams,
    async (err, result) => {
      if (err) {
        console.error('Error inserting lead:', err);
        return res.status(500).json({ message: 'Error creating lead', error: err.message, sql: err.sql });
      }
      
      try {
        // Track lead creation for statistics
        await StatsService.trackLeadCreated(req.user.id, result.insertId);
        res.json({ message: 'Lead Added', lead_id: result.insertId, id: result.insertId });
      } catch (statsErr) {
        console.error('Error tracking lead creation:', statsErr);
        res.json({ message: 'Lead Added (stats tracking failed)', lead_id: result.insertId, id: result.insertId });
      }
    }
  );
});

// Update Lead
router.put('/:id', auth, authorize('leads','update'), async (req, res) => {
  const { name, company_name, nature_of_business, email, business_email, phone, business_number, business_description, city, state, country, zip_code, source, service_required, notes, budget, hours_type, day_type, created_at } = req.body;
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
    
    // Format created_at if provided
    let createdAtClause = '';
    let queryParams = [name, company_name, nature_of_business || null, email, business_email || null, phone, business_number || null, business_description || null, city, state, country || null, zip_code || null, source, service_required, notes, budget || null, hours_type || null, day_type || null];
    
    if (created_at) {
      const createdAt = new Date(created_at).toISOString().slice(0, 19).replace('T', ' ');
      createdAtClause = ', created_at = ?';
      queryParams.push(createdAt);
    }
    
    queryParams.push(leadId);
    
    // Update the lead
    db.query(
      `UPDATE leads SET name = ?, company_name = ?, nature_of_business = ?, email = ?, business_email = ?, phone = ?, business_number = ?, business_description = ?, city = ?, state = ?, country = ?, zip_code = ?, source = ?, service_required = ?, notes = ?, budget = ?, hours_type = ?, day_type = ?, updated_at = NOW()${createdAtClause} WHERE id = ?`,
      queryParams,
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

// Schedule Lead
router.post('/:id/schedule', auth, authorize('leads','update'), async (req, res) => {
  const leadId = req.params.id;
  const { schedule_date, schedule_time } = req.body;
  const userId = req.user.id;
  
  if (!schedule_date) {
    return res.status(400).json({ message: 'Schedule date is required' });
  }
  
  try {
    // Get the lead details
    const leadResult = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM leads WHERE id = ?', [leadId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    if (leadResult.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    const lead = leadResult[0];
    
    // Check if user already has a schedule for this lead
    const existingSchedule = await new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM lead_schedules WHERE lead_id = ? AND scheduled_by = ?',
        [leadId, userId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
    
    if (existingSchedule.length > 0) {
      return res.status(400).json({ message: 'You have already scheduled this lead' });
    }
    
    // Insert new schedule
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO lead_schedules (lead_id, scheduled_by, schedule_date, schedule_time) VALUES (?, ?, ?, ?)',
        [leadId, userId, schedule_date, schedule_time],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
    
    // Create a reminder in the calendar
    const reminderTitle = `Call with ${lead.name}${lead.company_name ? ` (${lead.company_name})` : ''}`;
    const reminderDescription = `Scheduled call with lead: ${lead.name}\nCompany: ${lead.company_name || 'N/A'}\nPhone: ${lead.phone || 'N/A'}\nEmail: ${lead.email || 'N/A'}`;
    
    await ReminderService.createReminder({
      user_id: userId,
      title: reminderTitle,
      description: reminderDescription,
      reminder_date: schedule_date,
      reminder_time: schedule_time,
      is_all_day: !schedule_time,
      priority: 'medium',
      status: 'pending'
    });
    
    res.json({ message: 'Lead scheduled successfully' });
    
  } catch (error) {
    console.error('Error scheduling lead:', error);
    res.status(500).json({ message: 'Error scheduling lead' });
  }
});

// Cancel Lead Schedule
router.delete('/:id/schedule', auth, authorize('leads','update'), async (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  try {
    // Get the user's schedule for this lead
    const scheduleResult = await new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM lead_schedules WHERE lead_id = ? AND scheduled_by = ?',
        [leadId, userId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
    
    if (scheduleResult.length === 0) {
      return res.status(404).json({ message: 'No schedule found for this lead' });
    }
    
    const schedule = scheduleResult[0];
    
    // Delete the schedule
    await new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM lead_schedules WHERE lead_id = ? AND scheduled_by = ?',
        [leadId, userId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
    
    // Find and delete the associated reminder
    const reminders = await ReminderService.getUserReminders(userId, schedule.schedule_date, schedule.schedule_date);
    const leadReminder = reminders.find(r => 
      r.title.includes(schedule.schedule_date) && 
      r.description.includes('Scheduled call with lead')
    );
    
    if (leadReminder) {
      await ReminderService.deleteReminder(leadReminder.id, userId);
    }
    
    res.json({ message: 'Schedule cancelled successfully' });
    
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({ message: 'Error cancelling schedule' });
  }
});

// Import Leads from CSV
router.post('/import-csv', auth, authorize('leads', 'create'), async (req, res) => {
  const userId = req.user.id;
  const { leads } = req.body; // Array of lead objects from CSV
  
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ message: 'No leads data provided' });
  }
  
  try {
    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      created: 0,
      errors: []
    };
    
    // Process each lead
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        // Validate required fields
        if (!lead.name) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }
        
        // Clean and validate data
        const leadData = {
          name: lead.name.trim(),
          company_name: lead.company_name ? lead.company_name.trim() : null,
          email: lead.email ? lead.email.trim().toLowerCase() : null,
          phone: lead.phone ? lead.phone.trim() : null,
          city: lead.city ? lead.city.trim() : null,
          state: lead.state ? lead.state.trim() : null,
          source: lead.source ? lead.source.trim() : 'CSV Import',
          service_required: lead.service_required ? lead.service_required.trim() : null,
          notes: lead.notes ? lead.notes.trim() : null,
          created_by: userId,
          assigned_to: userId
        };
        
        // Validate email format if provided
        if (leadData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }
        
        // Check for existing lead by email or phone
        const existingLead = await new Promise((resolve, reject) => {
          let checkSql = 'SELECT id FROM leads WHERE ';
          let checkParams = [];
          
          if (leadData.email && leadData.phone) {
            checkSql += '(email = ? OR phone = ?)';
            checkParams = [leadData.email, leadData.phone];
          } else if (leadData.email) {
            checkSql += 'email = ?';
            checkParams = [leadData.email];
          } else if (leadData.phone) {
            checkSql += 'phone = ?';
            checkParams = [leadData.phone];
          } else {
            // No email or phone to check, proceed with insert
            resolve(null);
            return;
          }
          
          db.query(checkSql, checkParams, (err, results) => {
            if (err) {
              console.error('Error checking existing lead:', err);
              reject(err);
            } else {
              resolve(results.length > 0 ? results[0] : null);
            }
          });
        });
        
        if (existingLead) {
          // Update existing lead
          await new Promise((resolve, reject) => {
            const updateSql = `
              UPDATE leads 
              SET name = ?, company_name = ?, email = ?, phone = ?, city = ?, state = ?, 
                  source = ?, service_required = ?, notes = ?, assigned_to = ?, updated_at = NOW()
              WHERE id = ?
            `;
            
            db.query(updateSql, [
              leadData.name,
              leadData.company_name,
              leadData.email,
              leadData.phone,
              leadData.city,
              leadData.state,
              leadData.source,
              leadData.service_required,
              leadData.notes,
              leadData.assigned_to,
              existingLead.id
            ], (err, result) => {
              if (err) {
                console.error('Error updating lead:', err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
          
          results.updated++;
          results.success++;
        } else {
          // Create new lead
          await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO leads (name, company_name, email, phone, city, state, source, service_required, notes, created_by, assigned_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
              [
                leadData.name,
                leadData.company_name,
                leadData.email,
                leadData.phone,
                leadData.city,
                leadData.state,
                leadData.source,
                leadData.service_required,
                leadData.notes,
                leadData.created_by,
                leadData.assigned_to
              ],
              (err, result) => {
                if (err) {
                  console.error('Error inserting lead:', err);
                  reject(err);
                } else {
                  resolve(result);
                }
              }
            );
          });
          
          results.created++;
          results.success++;
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    // Track lead creation for statistics (only count newly created leads, not updated ones)
    if (results.created > 0) {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Get or create monthly stats
        const statsResult = await new Promise((resolve, reject) => {
          const sql = `
            SELECT * FROM monthly_lead_stats 
            WHERE user_id = ? AND year = ? AND month = ?
          `;
          
          db.query(sql, [userId, year, month], (err, results) => {
            if (err) return reject(err);
            
            if (results.length > 0) {
              resolve(results[0]);
            } else {
              // Create new monthly stats record
              const insertSql = `
                INSERT INTO monthly_lead_stats (user_id, year, month, leads_added, leads_converted)
                VALUES (?, ?, ?, 0, 0)
              `;
              
              db.query(insertSql, [userId, year, month], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId, user_id: userId, year, month, leads_added: 0, leads_converted: 0 });
              });
            }
          });
        });
        
        // Update monthly stats with the count of newly created leads only
        await new Promise((resolve, reject) => {
          const updateSql = `
            UPDATE monthly_lead_stats 
            SET leads_added = leads_added + ?
            WHERE id = ?
          `;
          
          db.query(updateSql, [results.created, statsResult.id], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      } catch (statsErr) {
        console.error('Error tracking lead creation:', statsErr);
      }
    }
    
    res.json({
      message: `Import completed: ${results.success} leads processed successfully (${results.created} created, ${results.updated} updated), ${results.failed} failed`,
      results
    });
    
  } catch (error) {
    console.error('Error importing leads:', error);
    res.status(500).json({ message: 'Error importing leads' });
  }
});

// Get Scheduled Leads for Current User
router.get('/scheduled', auth, authorize('leads', 'read'), async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role_id === 1;
  const isFrontManager = req.user.role_id === 4; // Front Manager role
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Admin and Front Manager can see all scheduled leads, others see only their own
    const whereClause = (isAdmin || isFrontManager) ? '' : 'WHERE ls.scheduled_by = ?';
    const queryParams = (isAdmin || isFrontManager) ? [parseInt(limit), offset] : [userId, parseInt(limit), offset];
    const countParams = (isAdmin || isFrontManager) ? [] : [userId];
    
    // Get scheduled leads
    const scheduledLeads = await new Promise((resolve, reject) => {
      db.query(`
        SELECT l.*, 
               u1.name as created_by_name,
               u2.name as scheduled_by_name,
               ls.schedule_date,
               ls.schedule_time,
               ls.scheduled_at,
               ls.id as schedule_id,
               ls.scheduled_by
        FROM leads l
        JOIN lead_schedules ls ON l.id = ls.lead_id
        LEFT JOIN users u1 ON l.created_by = u1.id
        LEFT JOIN users u2 ON ls.scheduled_by = u2.id
        ${whereClause}
        ORDER BY ls.schedule_date ASC, ls.schedule_time ASC
        LIMIT ? OFFSET ?
      `, queryParams, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      db.query(`
        SELECT COUNT(*) as total
        FROM leads l
        JOIN lead_schedules ls ON l.id = ls.lead_id
        ${whereClause}
      `, countParams, (err, results) => {
        if (err) return reject(err);
        resolve(results[0].total);
      });
    });
    
    res.json({
      scheduledLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled leads:', error);
    res.status(500).json({ message: 'Error fetching scheduled leads' });
  }
});

// Get Lead Notes
router.get('/:id/notes', auth, authorize('lead_notes', 'read'), async (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  try {
    const notes = await new Promise((resolve, reject) => {
      db.query(`
        SELECT ln.*, u.name as user_name, u.email as user_email
        FROM lead_notes ln
        JOIN users u ON ln.user_id = u.id
        WHERE ln.lead_id = ? AND ln.user_id = ?
        ORDER BY ln.created_at DESC
      `, [leadId, userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching lead notes:', error);
    res.status(500).json({ message: 'Error fetching lead notes' });
  }
});

// Add Lead Note
router.post('/:id/notes', auth, authorize('lead_notes', 'create'), async (req, res) => {
  const leadId = req.params.id;
  const { note } = req.body;
  const userId = req.user.id;
  
  if (!note || note.trim() === '') {
    return res.status(400).json({ message: 'Note is required' });
  }
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO lead_notes (lead_id, user_id, note) VALUES (?, ?, ?)',
        [leadId, userId, note.trim()],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
    
    // Get the created note with user info
    const newNote = await new Promise((resolve, reject) => {
      db.query(`
        SELECT ln.*, u.name as user_name, u.email as user_email
        FROM lead_notes ln
        JOIN users u ON ln.user_id = u.id
        WHERE ln.id = ?
      `, [result.insertId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
    
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error adding lead note:', error);
    res.status(500).json({ message: 'Error adding lead note' });
  }
});

// Update Lead Note
router.put('/notes/:noteId', auth, authorize('lead_notes', 'update'), async (req, res) => {
  const noteId = req.params.noteId;
  const { note } = req.body;
  const userId = req.user.id;
  
  if (!note || note.trim() === '') {
    return res.status(400).json({ message: 'Note is required' });
  }
  
  try {
    // Check if user owns the note or is admin
    const noteResult = await new Promise((resolve, reject) => {
      db.query('SELECT user_id FROM lead_notes WHERE id = ?', [noteId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    if (noteResult.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (noteResult[0].user_id !== userId && req.user.role_id !== 1) {
      return res.status(403).json({ message: 'You can only edit your own notes' });
    }
    
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE lead_notes SET note = ?, updated_at = NOW() WHERE id = ?',
        [note.trim(), noteId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
    
    res.json({ message: 'Note updated successfully' });
  } catch (error) {
    console.error('Error updating lead note:', error);
    res.status(500).json({ message: 'Error updating lead note' });
  }
});

// Delete Lead Note
router.delete('/notes/:noteId', auth, authorize('lead_notes', 'delete'), async (req, res) => {
  const noteId = req.params.noteId;
  const userId = req.user.id;
  
  try {
    // Check if user owns the note or is admin
    const noteResult = await new Promise((resolve, reject) => {
      db.query('SELECT user_id FROM lead_notes WHERE id = ?', [noteId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    if (noteResult.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (noteResult[0].user_id !== userId && req.user.role_id !== 1) {
      return res.status(403).json({ message: 'You can only delete your own notes' });
    }
    
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM lead_notes WHERE id = ?', [noteId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead note:', error);
    res.status(500).json({ message: 'Error deleting lead note' });
  }
});

// Download lead document (MUST come before /:id/documents route)
router.get('/:id/documents/:documentId/download', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  const documentId = req.params.documentId;
  
  db.query(
    'SELECT * FROM lead_documents WHERE id = ? AND lead_id = ?',
    [documentId, leadId],
    (err, results) => {
      if (err) {
        console.error('Error fetching document:', err);
        return res.status(500).json({ message: 'Error fetching document' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const document = results[0];
      // Handle both relative and absolute paths (for backward compatibility)
      let filePath;
      if (path.isAbsolute(document.file_path)) {
        // If it's an absolute path, use it directly (for existing records)
        filePath = document.file_path;
      } else {
        // If it's a relative path, join with server root
        filePath = path.join(__dirname, '..', document.file_path);
      }
      
      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        console.error('Document file_path from DB:', document.file_path);
        return res.status(404).json({ message: 'File not found on server' });
      }
      
      res.download(filePath, document.file_name, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error downloading file' });
          }
        }
      });
    }
  );
});

// Get lead documents
router.get('/:id/documents', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  
  db.query(
    'SELECT ld.*, u.name as uploaded_by_name FROM lead_documents ld LEFT JOIN users u ON ld.uploaded_by = u.id WHERE ld.lead_id = ? ORDER BY ld.created_at DESC',
    [leadId],
    (err, results) => {
      if (err) {
        console.error('Error fetching lead documents:', err);
        return res.status(500).json({ message: 'Error fetching documents' });
      }
      res.json({ documents: results });
    }
  );
});

// Upload lead documents
router.post('/:id/documents', auth, authorize('leads', 'update'), uploadMultiple, handleUploadError, (req, res) => {
  const leadId = req.params.id;
  const files = req.files;
  
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  
  // Check if lead exists
  db.query('SELECT * FROM leads WHERE id = ?', [leadId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking lead' });
    if (results.length === 0) return res.status(404).json({ message: 'Lead not found' });
    
    const lead = results[0];
    
    // Check if user can edit this lead (admin or lead creator)
    if (req.user.role_id !== 1 && lead.created_by !== req.user.id) {
      // Delete uploaded files if user doesn't have permission
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(403).json({ message: 'You can only upload documents to leads you created' });
    }
    
    // Move files to lead-specific directory if not already there
    const leadUploadPath = path.join(__dirname, '..', 'uploads', 'leads', leadId.toString());
    if (!fs.existsSync(leadUploadPath)) {
      fs.mkdirSync(leadUploadPath, { recursive: true });
    }
    
    const documentIds = [];
    let processedCount = 0;
    const totalFiles = files.length;
    
    files.forEach((file) => {
      // Move file to lead-specific directory if needed
      const targetPath = path.join(leadUploadPath, path.basename(file.filename));
      if (file.path !== targetPath && fs.existsSync(file.path)) {
        fs.renameSync(file.path, targetPath);
        file.path = targetPath;
      }
      
      // Store relative path instead of absolute path
      const relativePath = path.relative(path.join(__dirname, '..'), file.path);
      // Normalize path separators for cross-platform compatibility
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      const documentData = {
        lead_id: leadId,
        file_name: file.originalname,
        file_path: normalizedPath,
        file_size: file.size,
        file_type: file.mimetype,
        uploaded_by: req.user.id
      };
      
      db.query(
        'INSERT INTO lead_documents (lead_id, file_name, file_path, file_size, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
        [documentData.lead_id, documentData.file_name, documentData.file_path, documentData.file_size, documentData.file_type, documentData.uploaded_by],
        (err, result) => {
          if (err) {
            console.error('Error saving document:', err);
            // Delete file if database insert fails
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } else {
            documentIds.push(result.insertId);
          }
          
          processedCount++;
          if (processedCount === totalFiles) {
            if (documentIds.length === 0) {
              return res.status(500).json({ message: 'Error uploading documents' });
            }
            res.json({
              message: `${documentIds.length} document(s) uploaded successfully`,
              document_ids: documentIds
            });
          }
        }
      );
    });
  });
});

// Delete lead document
router.delete('/:id/documents/:documentId', auth, authorize('leads', 'update'), (req, res) => {
  const leadId = req.params.id;
  const documentId = req.params.documentId;
  
  // Check if lead exists and user has permission
  db.query('SELECT * FROM leads WHERE id = ?', [leadId], (err, leadResults) => {
    if (err) return res.status(500).json({ message: 'Error checking lead' });
    if (leadResults.length === 0) return res.status(404).json({ message: 'Lead not found' });
    
    const lead = leadResults[0];
    
    // Check if user can edit this lead (admin or lead creator)
    if (req.user.role_id !== 1 && lead.created_by !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete documents from leads you created' });
    }
    
    // Get document info
    db.query(
      'SELECT * FROM lead_documents WHERE id = ? AND lead_id = ?',
      [documentId, leadId],
      (err, docResults) => {
        if (err) return res.status(500).json({ message: 'Error fetching document' });
        if (docResults.length === 0) return res.status(404).json({ message: 'Document not found' });
        
        const document = docResults[0];
        // Handle both relative and absolute paths (for backward compatibility)
        let filePath;
        if (path.isAbsolute(document.file_path)) {
          filePath = document.file_path;
        } else {
          filePath = path.join(__dirname, '..', document.file_path);
        }
        
        // Delete file from filesystem
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Delete from database
        db.query(
          'DELETE FROM lead_documents WHERE id = ?',
          [documentId],
          (err) => {
            if (err) {
              console.error('Error deleting document:', err);
              return res.status(500).json({ message: 'Error deleting document' });
            }
            res.json({ message: 'Document deleted successfully' });
          }
        );
      }
    );
  });
});

// Track phone click
router.post('/:id/track-phone-click', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  // Record click in lead_clicks table
  db.query(
    'INSERT INTO lead_clicks (lead_id, user_id, click_type) VALUES (?, ?, ?)',
    [leadId, userId, 'phone'],
    (err, result) => {
      if (err) {
        console.error('Error tracking phone click:', err);
        return res.status(500).json({ message: 'Error tracking phone click' });
      }
      res.json({ message: 'Phone click tracked' });
    }
  );
});

// Track email click
router.post('/:id/track-email-click', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  // Record click in lead_clicks table
  db.query(
    'INSERT INTO lead_clicks (lead_id, user_id, click_type) VALUES (?, ?, ?)',
    [leadId, userId, 'email'],
    (err, result) => {
      if (err) {
        console.error('Error tracking email click:', err);
        return res.status(500).json({ message: 'Error tracking email click' });
      }
      res.json({ message: 'Email click tracked' });
    }
  );
});

// Track business email click
router.post('/:id/track-business-email-click', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  // Record click in lead_clicks table
  db.query(
    'INSERT INTO lead_clicks (lead_id, user_id, click_type) VALUES (?, ?, ?)',
    [leadId, userId, 'business_email'],
    (err, result) => {
      if (err) {
        console.error('Error tracking business email click:', err);
        return res.status(500).json({ message: 'Error tracking business email click' });
      }
      res.json({ message: 'Business email click tracked' });
    }
  );
});

// Track business phone click
router.post('/:id/track-business-phone-click', auth, authorize('leads', 'read'), (req, res) => {
  const leadId = req.params.id;
  const userId = req.user.id;
  
  // Record click in lead_clicks table
  db.query(
    'INSERT INTO lead_clicks (lead_id, user_id, click_type) VALUES (?, ?, ?)',
    [leadId, userId, 'business_phone'],
    (err, result) => {
      if (err) {
        console.error('Error tracking business phone click:', err);
        return res.status(500).json({ message: 'Error tracking business phone click' });
      }
      res.json({ message: 'Business phone click tracked' });
    }
  );
});

module.exports = router;
  