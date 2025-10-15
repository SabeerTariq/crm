const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const StatsService = require('../services/statsService');
const CustomerSalesService = require('../services/customerSalesService');
const ReminderService = require('../services/reminderService');


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
               u1.name as created_by_name,
               GROUP_CONCAT(DISTINCT u2.name ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as scheduled_by_names,
               GROUP_CONCAT(DISTINCT ls.schedule_date ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as schedule_dates,
               GROUP_CONCAT(DISTINCT ls.schedule_time ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as schedule_times
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        LEFT JOIN lead_schedules ls ON l.id = ls.lead_id AND ls.scheduled_by = ?
        LEFT JOIN users u2 ON ls.scheduled_by = u2.id
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const countSql = `
        SELECT COUNT(DISTINCT l.id) as total
        FROM leads l
        LEFT JOIN users u1 ON l.created_by = u1.id
        LEFT JOIN lead_schedules ls ON l.id = ls.lead_id AND ls.scheduled_by = ?
        LEFT JOIN users u2 ON ls.scheduled_by = u2.id
        ${whereClause}
      `;
      
      // Add userId parameter for schedule filtering and pagination parameters
      queryParams.push(userId, parseInt(limit), offset);
      
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
             u1.name as created_by_name,
             GROUP_CONCAT(DISTINCT u2.name ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as scheduled_by_names,
             GROUP_CONCAT(DISTINCT ls.schedule_date ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as schedule_dates,
             GROUP_CONCAT(DISTINCT ls.schedule_time ORDER BY ls.scheduled_at DESC SEPARATOR ', ') as schedule_times
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      LEFT JOIN lead_schedules ls ON l.id = ls.lead_id AND ls.scheduled_by = ?
      LEFT JOIN users u2 ON ls.scheduled_by = u2.id
      ${whereClause}
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countSql = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      LEFT JOIN lead_schedules ls ON l.id = ls.lead_id AND ls.scheduled_by = ?
      LEFT JOIN users u2 ON ls.scheduled_by = u2.id
      ${whereClause}
    `;
    
    // Add userId parameter for schedule filtering and pagination parameters
    queryParams.push(req.user.id, parseInt(limit), offset);
    
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
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Get scheduled leads for the current user
    const scheduledLeads = await new Promise((resolve, reject) => {
      db.query(`
        SELECT l.*, 
               u1.name as created_by_name,
               ls.schedule_date,
               ls.schedule_time,
               ls.scheduled_at,
               ls.id as schedule_id
        FROM leads l
        JOIN lead_schedules ls ON l.id = ls.lead_id
        LEFT JOIN users u1 ON l.created_by = u1.id
        WHERE ls.scheduled_by = ?
        ORDER BY ls.schedule_date ASC, ls.schedule_time ASC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), offset], (err, results) => {
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
        WHERE ls.scheduled_by = ?
      `, [userId], (err, results) => {
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

module.exports = router;
  