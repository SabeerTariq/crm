const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const StatsService = require('../services/statsService');
const PaymentService = require('../services/paymentService');
const InvoiceService = require('../services/invoiceService');
const CustomerSalesService = require('../services/customerSalesService');
const salesUpload = require('../middleware/salesUpload');

// Get Sales
router.get('/', auth, authorize('sales','read'), (req, res) => {
  // Check if user is admin, front-sales-manager, or upseller-manager
  const isAdmin = req.user.role_id === 1;
  const isFrontSalesManager = req.user.role_id === 4;
  const isUpsellerManager = req.user.role_id === 6;
  
  if (isAdmin || isFrontSalesManager || isUpsellerManager) {
    // Admin, front-sales-manager, and upseller-manager can see all sales
    const sql = `
      SELECT s.*, 
             u.name as created_by_name,
             c.name as customer_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For RBAC users, check their role
  const userId = req.user.id;
  const userRoleId = req.user.role_id;
  
  if (userRoleId === 3) {
    // Sales role: show only sales from leads (customer_id is null or from converted leads)
    const sql = `
      SELECT s.*, 
             u.name as created_by_name,
             c.name as customer_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.created_by = ? AND (s.customer_id IS NULL OR c.converted_at IS NOT NULL)
      ORDER BY s.created_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  if (userRoleId === 5) {
    // Upseller: show sales for assigned customers only
    const sql = `
      SELECT DISTINCT s.*, 
             u.name as created_by_name,
             c.name as customer_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      INNER JOIN customer_assignments ca ON s.customer_id = ca.customer_id
      WHERE ca.upseller_id = ? AND ca.status = 'active'
      ORDER BY s.created_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For other roles, show only their own sales
  const sql = `
    SELECT s.*, 
           u.name as created_by_name,
           c.name as customer_name
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.created_by = ?
    ORDER BY s.created_at DESC
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Add Sale
router.post('/', auth, authorize('sales','create'), salesUpload.single('agreement'), (req, res) => {
  const { 
    customer_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    unit_price, 
    cash_in = 0, 
    notes,
    services,
    service_details,
    payment_type,
    payment_source,
    payment_company,
    brand,
    lead_id,
    convert_lead = false,
    // Payment type specific fields
    installment_count,
    installment_frequency,
    installment_type = 'automatic', // Default to automatic for backward compatibility
    recurring_frequency,
    recurring_type = 'automatic', // Default to automatic for backward compatibility
    payment_start_date
  } = req.body;
  
  // Handle agreement file
  let agreementData = {};
  if (req.file) {
    agreementData = {
      agreement_file_name: req.file.originalname,
      agreement_file_path: req.file.path,
      agreement_file_size: req.file.size,
      agreement_file_type: req.file.mimetype,
      agreement_uploaded_at: new Date()
    };
  }
  
  // Calculate values
  const gross_value = unit_price;
  const net_value = gross_value;
  const remaining = net_value - cash_in;
  const payment_status = remaining <= 0 ? 'completed' : (cash_in > 0 ? 'partial' : 'pending');
  
  // Calculate next payment date based on payment type
  let next_payment_date = null;
  if (payment_type === 'installments' && installment_count && installment_frequency) {
    const startDate = payment_start_date ? new Date(payment_start_date) : new Date();
    next_payment_date = startDate.toISOString().split('T')[0];
  } else if (payment_type === 'recurring' && recurring_frequency) {
    const startDate = payment_start_date ? new Date(payment_start_date) : new Date();
    next_payment_date = startDate.toISOString().split('T')[0];
  }
  
  const sql = `
    INSERT INTO sales (
      customer_id, customer_name, customer_email, customer_phone, 
      unit_price, gross_value, net_value, cash_in, remaining, 
      notes, services, service_details, payment_type, 
      payment_source, payment_company, brand, created_by, payment_status, next_payment_date,
      agreement_file_name, agreement_file_path, agreement_file_size, agreement_file_type, agreement_uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    customer_id || null, customer_name, customer_email, customer_phone,
    unit_price, gross_value, net_value, cash_in, remaining, 
    notes, services, service_details, payment_type,
    payment_source, payment_company, brand, req.user.id, payment_status, next_payment_date,
    agreementData.agreement_file_name || null,
    agreementData.agreement_file_path || null,
    agreementData.agreement_file_size || null,
    agreementData.agreement_file_type || null,
    agreementData.agreement_uploaded_at || null
  ];
  
  db.query(sql, params, async (err, result) => {
    if (err) return res.status(500).json(err);
    
    const saleId = result.insertId;
    let customerId = customer_id;
    
    // Record initial payment transaction if cash_in > 0
    if (cash_in > 0 && payment_source) {
      try {
        console.log(`💰 Recording initial payment transaction - Sale ID: ${saleId}, Amount: ${cash_in}, Source: ${payment_source}`);
        await PaymentService.recordPayment({
          saleId: saleId,
          amount: cash_in,
          paymentSource: payment_source,
          transactionReference: `Initial payment for sale ${saleId}`,
          notes: 'Initial payment received at sale creation',
          createdBy: req.user.id,
          receivedBy: req.user.id
        });
        console.log(`✅ Initial payment transaction recorded successfully`);
        
        // Update upseller performance for target tracking
        try {
          // Get the upseller assigned to this customer
          const upsellerQuery = `
            SELECT ca.upseller_id 
            FROM customer_assignments ca 
            WHERE ca.customer_id = ? AND ca.status = 'active'
            LIMIT 1
          `;
          
          db.query(upsellerQuery, [customerId], (err, upsellerResults) => {
            if (err) {
              console.error('Error getting upseller for customer:', err);
              return;
            }
            
            if (upsellerResults.length > 0) {
              const upsellerId = upsellerResults[0].upseller_id;
              console.log(`📊 Updating upseller performance for upseller ${upsellerId} with amount ${cash_in}`);
              
              PaymentService.updateUpsellerPerformance(upsellerId, cash_in).catch(err => {
                console.error('Error updating upseller performance:', err);
              });
              console.log(`✅ Upseller performance update initiated`);
            } else {
              console.log(`⚠️ No active upseller found for customer ${customerId}`);
            }
          });
        } catch (performanceError) {
          console.error('Error updating upseller performance:', performanceError);
          // Continue with sale creation even if performance update fails
        }
      } catch (paymentError) {
        console.error('Error recording initial payment transaction:', paymentError);
        // Continue with sale creation even if payment recording fails
      }
    }
    
    // Handle payment type specific logic
    try {
      if (payment_type === 'installments' && installment_count && installment_frequency && installment_type === 'automatic') {
        const startDate = payment_start_date ? new Date(payment_start_date) : new Date();
        const remainingAmount = unit_price - cash_in;
        await PaymentService.createInstallments(
          saleId, 
          remainingAmount, 
          installment_count, 
          installment_frequency, 
          startDate
        );
      } else if (payment_type === 'recurring' && recurring_frequency && cash_in > 0 && recurring_type === 'automatic') {
        const startDate = payment_start_date ? new Date(payment_start_date) : new Date();
        
        // Use cash_in amount as the subscription amount
        const subscriptionAmount = cash_in;
        
        await PaymentService.createRecurringPayment(
          saleId,
          customerId,
          subscriptionAmount,
          recurring_frequency,
          startDate,
          null // Always indefinite subscriptions
        );
      }
    } catch (paymentError) {
      console.error('Error creating payment schedule:', paymentError);
      // Continue with sale creation even if payment schedule fails
    }
    
    // Update customer totals
    if (customerId) {
      try {
        console.log(`📊 Updating customer totals for new sale - Customer ID: ${customerId}, Sale ID: ${saleId}`);
        await CustomerSalesService.updateCustomerTotals(customerId);
        console.log(`✅ Customer totals updated successfully for customer ${customerId}`);
      } catch (customerError) {
        console.error('❌ ERROR updating customer totals:', customerError);
        console.error('Customer ID:', customerId, 'Sale ID:', saleId);
        // Continue with sale creation even if customer totals update fails
      }
    } else {
      console.warn('⚠️ No customer ID provided, skipping customer totals update');
    }
    
    // If converting a lead, create customer and delete lead
    // Note: Invoice creation will happen after lead conversion if needed
    console.log('Lead conversion check:', { convert_lead, lead_id, customer_id });
    if (convert_lead && lead_id) {
      console.log('Starting lead conversion process for lead_id:', lead_id);
      try {
        // Get the lead details
        const leadSql = 'SELECT * FROM leads WHERE id = ?';
        db.query(leadSql, [lead_id], async (err, leadResults) => {
          if (err) return res.status(500).json({ message: 'Error fetching lead details' });
          if (leadResults.length === 0) return res.status(404).json({ message: 'Lead not found' });
          
          const lead = leadResults[0];
          const originalLeadCreator = lead.created_by; // The user who originally created the lead
          const converterUserId = req.user.id; // The user who is converting the lead
          
          // Create customer from lead
          const customerSql = `
            INSERT INTO customers (name, company_name, email, phone, city, state, source, service_required, notes, assigned_to, created_by, converted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;
          const customerParams = [
            lead.name, 
            lead.company_name, 
            lead.email, 
            lead.phone, 
            lead.city, 
            lead.state, 
            lead.source, 
            lead.service_required, 
            lead.notes, 
            req.user.id, 
            req.user.id
          ];
          
          db.query(customerSql, customerParams, (err, customerResult) => {
            if (err) {
              console.error('Error creating customer:', err);
              return res.status(500).json({ message: 'Error creating customer' });
            }
            
            // Update sale with the new customer ID
            const updateSaleSql = 'UPDATE sales SET customer_id = ? WHERE id = ?';
            db.query(updateSaleSql, [customerResult.insertId, result.insertId], (err) => {
              if (err) {
                console.error('Error updating sale with customer ID:', err);
                return res.status(500).json({ message: 'Error updating sale with customer ID' });
              }
              
              // Update customer totals after sale is linked to customer
              CustomerSalesService.updateCustomerTotals(customerResult.insertId).catch(err => {
                console.error('Error updating customer totals:', err);
              });
              
              // Create invoice now that customer exists
              InvoiceService.createInvoiceFromSale(saleId, req.user.id).then(invoiceResult => {
                console.log('✅ Invoice created after lead conversion:', invoiceResult);
              }).catch(invoiceError => {
                console.error('❌ Error creating invoice after lead conversion:', invoiceError);
                // Continue even if invoice creation fails
              });
              
              // Track lead conversion for the converter (sales person)
              StatsService.trackLeadConverted(converterUserId, lead_id).catch(err => {
                console.error('Error tracking lead conversion for converter:', err);
              });
              
              // Track conversion for the original lead creator (lead-scraper)
              if (originalLeadCreator && originalLeadCreator !== converterUserId) {
                StatsService.trackLeadConverted(originalLeadCreator, lead_id).catch(err => {
                  console.error('Error tracking lead conversion for original creator:', err);
                });
              }
              
              // Delete the lead
              console.log('Attempting to delete lead with id:', lead_id);
              db.query('DELETE FROM leads WHERE id = ?', [lead_id], (err, deleteResult) => {
                if (err) {
                  console.error('Error deleting lead:', err);
                  return res.status(500).json({ message: 'Error deleting lead' });
                }
                
                console.log('Lead deletion result:', deleteResult);
                console.log('Lead successfully deleted');
                
                res.json({ 
                  message: 'Sale added and lead converted successfully', 
                  saleId: result.insertId,
                  customerId: customerResult.insertId,
                  leadConverted: true
                });
              });
            });
          });
        });
      } catch (error) {
        console.error('Error converting lead:', error);
        res.status(500).json({ message: 'Error converting lead' });
      }
    } else {
      // Not a lead conversion - create invoice if customer_id exists
      if (customerId) {
        try {
          console.log(`📄 Creating invoice for sale ID: ${saleId}`);
          const invoiceResult = await InvoiceService.createInvoiceFromSale(saleId, req.user.id);
          console.log('✅ Invoice created:', invoiceResult);
        } catch (invoiceError) {
          console.error('❌ Error creating invoice:', invoiceError);
          // Continue with sale creation even if invoice creation fails
        }
      } else {
        console.log('⚠️ No customer ID, skipping invoice creation');
      }
      
      res.json({ message: 'Sale added successfully', saleId: result.insertId });
    }
  });
});

// Update Sale
router.put('/:id', auth, authorize('sales','update'), salesUpload.single('agreement'), (req, res) => {
  const saleId = req.params.id;
  
  // Handle both JSON and FormData requests
  let bodyData = req.body;
  if (req.file) {
    // If file is uploaded, req.body fields come as strings from FormData
    bodyData = {
      customer_id: req.body.customer_id ? parseInt(req.body.customer_id) : null,
      customer_name: req.body.customer_name || '',
      customer_email: req.body.customer_email || '',
      customer_phone: req.body.customer_phone || '',
      unit_price: req.body.unit_price ? parseFloat(req.body.unit_price) : 0,
      cash_in: req.body.cash_in ? parseFloat(req.body.cash_in) : 0,
      notes: req.body.notes || '',
      services: req.body.services || '',
      service_details: req.body.service_details || '',
      payment_type: req.body.payment_type || 'fully_paid',
      payment_source: req.body.payment_source || 'wire',
      payment_company: req.body.payment_company || 'american_digital_agency',
      brand: req.body.brand || 'liberty_web_studio'
    };
  }
  
  const { 
    customer_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    unit_price, 
    cash_in = 0, 
    notes,
    services,
    service_details,
    payment_type,
    payment_source,
    payment_company,
    brand
  } = bodyData;
  
  // Calculate values
  const gross_value = unit_price;
  const net_value = gross_value;
  const remaining = net_value - cash_in;
  
  // Check if user owns this sale (unless admin, front-sales-manager, or upseller-manager)
  const isAdmin = req.user.role_id === 1;
  const isFrontSalesManager = req.user.role_id === 4;
  const isUpsellerManager = req.user.role_id === 6;
  if (!isAdmin && !isFrontSalesManager && !isUpsellerManager) {
    const checkSql = 'SELECT created_by FROM sales WHERE id = ?';
    db.query(checkSql, [saleId], (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) return res.status(404).json({ message: 'Sale not found' });
      if (results[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      updateSale();
    });
  } else {
    updateSale();
  }
  
  function updateSale() {
    // Handle agreement file if uploaded
    let agreementData = {};
    if (req.file) {
      agreementData = {
        agreement_file_name: req.file.originalname,
        agreement_file_path: req.file.path,
        agreement_file_size: req.file.size,
        agreement_file_type: req.file.mimetype,
        agreement_uploaded_at: new Date()
      };
    }
    
    // Build SQL query - include agreement fields if file is uploaded
    let sql;
    let params;
    
    if (req.file) {
      // Update with agreement file
      sql = `
        UPDATE sales SET 
          customer_id = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
          unit_price = ?, gross_value = ?, net_value = ?, cash_in = ?, remaining = ?, 
          notes = ?, services = ?, service_details = ?, 
          payment_type = ?, payment_source = ?, payment_company = ?, brand = ?,
          agreement_file_name = ?, agreement_file_path = ?, agreement_file_size = ?, 
          agreement_file_type = ?, agreement_uploaded_at = ?
        WHERE id = ?
      `;
      
      params = [
        customer_id || null, 
        customer_name || null, 
        customer_email || null, 
        customer_phone || null,
        unit_price || 0, 
        gross_value || 0, 
        net_value || 0, 
        cash_in || 0, 
        remaining || 0, 
        notes || null, 
        services || null, 
        service_details || null, 
        payment_type || null,
        payment_source || null, 
        payment_company || null, 
        brand || null,
        agreementData.agreement_file_name || null,
        agreementData.agreement_file_path || null,
        agreementData.agreement_file_size || null,
        agreementData.agreement_file_type || null,
        agreementData.agreement_uploaded_at || null,
        saleId
      ];
    } else {
      // Update without agreement file (don't change existing file)
      sql = `
        UPDATE sales SET 
          customer_id = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
          unit_price = ?, gross_value = ?, net_value = ?, cash_in = ?, remaining = ?, 
          notes = ?, services = ?, service_details = ?, 
          payment_type = ?, payment_source = ?, payment_company = ?, brand = ?
        WHERE id = ?
      `;
      
      params = [
        customer_id || null, 
        customer_name || null, 
        customer_email || null, 
        customer_phone || null,
        unit_price || 0, 
        gross_value || 0, 
        net_value || 0, 
        cash_in || 0, 
        remaining || 0, 
        notes || null, 
        services || null, 
        service_details || null, 
        payment_type || null,
        payment_source || null, 
        payment_company || null, 
        brand || null, 
        saleId
      ];
    }
    
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error updating sale:', err);
        console.error('SQL:', sql);
        console.error('Params:', params);
        return res.status(500).json({ 
          message: 'Error updating sale', 
          error: err.message,
          sqlError: err.sqlMessage 
        });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Sale not found' });
      res.json({ message: 'Sale updated successfully' });
    });
  }
});

// Delete Sale
router.delete('/:id', auth, authorize('sales','delete'), (req, res) => {
  const saleId = req.params.id;
  
  // Check if user owns this sale (unless admin, front-sales-manager, or upseller-manager)
  const isAdmin = req.user.role_id === 1;
  const isFrontSalesManager = req.user.role_id === 4;
  const isUpsellerManager = req.user.role_id === 6;
  if (!isAdmin && !isFrontSalesManager && !isUpsellerManager) {
    const checkSql = 'SELECT created_by FROM sales WHERE id = ?';
    db.query(checkSql, [saleId], (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) return res.status(404).json({ message: 'Sale not found' });
      if (results[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      deleteSale();
    });
  } else {
    deleteSale();
  }
  
  function deleteSale() {
    const sql = 'DELETE FROM sales WHERE id = ?';
    db.query(sql, [saleId], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Sale not found' });
      res.json({ message: 'Sale deleted successfully' });
    });
  }
});

// Get Customers for dropdown with search
router.get('/customers', auth, authorize('sales','create'), (req, res) => {
  const userId = req.user.id;
  const userRoleId = req.user.role_id;
  const { search = '', limit = 50 } = req.query;
  
  // Check if user is sales role (role_id = 3) - they should NOT see customers
  if (userRoleId === 3) {
    return res.status(403).json({ message: 'Sales role can only work with leads, not customers' });
  }
  
  // Check if user is upseller (role_id = 5) - they should only see assigned customers
  if (userRoleId === 5) {
    const sql = `
      SELECT DISTINCT c.id, c.name, c.email, c.phone
      FROM customers c
      INNER JOIN customer_assignments ca ON c.id = ca.customer_id
      WHERE ca.upseller_id = ? AND ca.status = 'active'
      ${search ? 'AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)' : ''}
      ORDER BY c.name
      LIMIT ?
    `;
    
    const params = search 
      ? [userId, `%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit)]
      : [userId, parseInt(limit)];
    
    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
    return;
  }
  
  // For other roles (admin, front-sales-manager, upseller-manager), show all customers
  const sql = `
    SELECT id, name, email, phone 
    FROM customers 
    ${search ? 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?' : ''}
    ORDER BY name 
    LIMIT ?
  `;
  
  const params = search 
    ? [`%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit)]
    : [parseInt(limit)];
  
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get Leads for dropdown with search
router.get('/leads', auth, authorize('sales','create'), (req, res) => {
  const userRoleId = req.user.role_id;
  const { search = '', limit = 50 } = req.query;
  
  // Check if user is upseller role (role_id = 5) - they should NOT see leads
  if (userRoleId === 5) {
    return res.status(403).json({ message: 'Upseller role can only work with customers, not leads' });
  }
  
  // For other roles (admin, sales, front-sales-manager, upseller-manager), show all leads
  const sql = `
    SELECT id, name, email, phone 
    FROM leads 
    ${search ? 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?' : ''}
    ORDER BY name 
    LIMIT ?
  `;
  
  const params = search 
    ? [`%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit)]
    : [parseInt(limit)];
  
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Download agreement file
router.get('/:id/agreement', auth, authorize('sales', 'read'), (req, res) => {
  const saleId = req.params.id;
  
  const sql = 'SELECT agreement_file_name, agreement_file_path FROM sales WHERE id = ?';
  
  db.query(sql, [saleId], (err, results) => {
    if (err) return res.status(500).json(err);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    const sale = results[0];
    
    if (!sale.agreement_file_path) {
      return res.status(404).json({ message: 'No agreement file found for this sale' });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Convert relative path to absolute path
    const filePath = path.isAbsolute(sale.agreement_file_path) 
      ? sale.agreement_file_path 
      : path.join(__dirname, '..', sale.agreement_file_path);
    
    const normalizedPath = path.normalize(filePath);
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ message: 'Agreement file not found on server' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${sale.agreement_file_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(normalizedPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error downloading file' });
    });
  });
});

module.exports = router;
