const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const InvoiceService = require('../services/invoiceService');

const router = express.Router();

// Get customer financial overview
router.get('/customer/:customerId', auth, authorize('finance', 'read'), (req, res) => {
  const { customerId } = req.params;
  
  const queries = {
    invoices: `
      SELECT 
        i.*,
        s.services,
        s.unit_price as sale_amount
      FROM invoices i
      LEFT JOIN sales s ON i.sale_id = s.id
      WHERE i.customer_id = ?
      ORDER BY i.created_at DESC
    `,
    subscriptions: `
      SELECT 
        cs.*,
        s.services,
        s.unit_price as sale_amount
      FROM customer_subscriptions cs
      LEFT JOIN sales s ON cs.sale_id = s.id
      WHERE cs.customer_id = ?
      ORDER BY cs.created_at DESC
    `,
    upcomingPayments: `
      SELECT 
        up.*,
        CASE 
          WHEN up.payment_type = 'installment' THEN 'Installment Payment'
          WHEN up.payment_type = 'subscription' THEN 'Subscription Payment'
          WHEN up.payment_type = 'invoice' THEN 'Invoice Payment'
        END as payment_description
      FROM upcoming_payments up
      WHERE up.customer_id = ?
      ORDER BY up.due_date ASC
    `,
    sales: `
      SELECT 
        s.*,
        s.unit_price - s.cash_in as remaining_amount
      FROM sales s
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.query(queries[key], [customerId], (err, rows) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        results[key] = [];
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === total) {
        // Calculate summary
        const totalInvoices = results.invoices.length;
        const totalInvoiceAmount = results.invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
        const paidInvoiceAmount = results.invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0);
        const remainingInvoiceAmount = totalInvoiceAmount - paidInvoiceAmount;
        
        const activeSubscriptions = results.subscriptions.filter(sub => sub.status === 'active');
        const totalSubscriptionAmount = activeSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount), 0);
        
        const pendingPayments = results.upcomingPayments.filter(pay => pay.status === 'pending');
        const overduePayments = results.upcomingPayments.filter(pay => pay.status === 'overdue');
        
        const totalSalesAmount = results.sales.reduce((sum, sale) => sum + parseFloat(sale.unit_price || 0), 0);
        const totalSalesPaid = results.sales.reduce((sum, sale) => sum + parseFloat(sale.cash_in || 0), 0);
        const totalSalesRemaining = results.sales.reduce((sum, sale) => sum + parseFloat(sale.remaining || 0), 0);

        res.json({
          ...results,
          summary: {
            totalInvoices,
            totalInvoiceAmount,
            paidInvoiceAmount,
            remainingInvoiceAmount,
            activeSubscriptions: activeSubscriptions.length,
            totalSubscriptionAmount,
            pendingPayments: pendingPayments.length,
            overduePayments: overduePayments.length,
            totalSalesAmount,
            totalSalesPaid,
            totalSalesRemaining
          }
        });
      }
    });
  });
});

// Get all customers financial summary
router.get('/customers', auth, authorize('finance', 'read'), (req, res) => {
  const query = `
    SELECT 
      c.id,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      COUNT(DISTINCT i.id) as total_invoices,
      COALESCE(SUM(i.total_amount), 0) as total_invoice_amount,
      COALESCE(SUM(i.paid_amount), 0) as paid_invoice_amount,
      COALESCE(SUM(i.remaining_amount), 0) as remaining_invoice_amount,
      COUNT(DISTINCT cs.id) as active_subscriptions,
      COALESCE(SUM(CASE WHEN cs.status = 'active' THEN cs.amount ELSE 0 END), 0) as total_subscription_amount,
      COUNT(DISTINCT up.id) as pending_payments,
      COUNT(DISTINCT CASE WHEN up.status = 'overdue' THEN up.id END) as overdue_payments,
      COUNT(DISTINCT s.id) as total_sales,
      COALESCE(SUM(s.unit_price), 0) as total_sales_amount,
      COALESCE(SUM(s.cash_in), 0) as total_sales_paid,
      COALESCE(SUM(s.remaining), 0) as total_sales_remaining
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    LEFT JOIN customer_subscriptions cs ON c.id = cs.customer_id
    LEFT JOIN upcoming_payments up ON c.id = up.customer_id
    LEFT JOIN sales s ON c.id = s.customer_id
    GROUP BY c.id, c.name, c.email, c.phone
    ORDER BY c.name
  `;
  
  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create invoice
router.post('/invoices', auth, authorize('finance', 'create'), (req, res) => {
  const {
    customer_id,
    sale_id,
    invoice_number,
    invoice_date,
    due_date,
    total_amount,
    services,
    notes
  } = req.body;

  const remaining_amount = total_amount;
  
  const sql = `
    INSERT INTO invoices 
    (customer_id, sale_id, invoice_number, invoice_date, due_date, total_amount, remaining_amount, services, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [
    customer_id, sale_id, invoice_number, invoice_date, due_date, 
    total_amount, remaining_amount, services, notes, req.user.id
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Create upcoming payment record
    const upcomingPaymentSql = `
      INSERT INTO upcoming_payments 
      (customer_id, payment_type, source_id, amount, due_date, description)
      VALUES (?, 'invoice', ?, ?, ?, ?)
    `;
    
    db.query(upcomingPaymentSql, [
      customer_id, result.insertId, total_amount, due_date, 
      `Invoice #${invoice_number} - ${services || 'Services'}`
    ], (err) => {
      if (err) console.error('Error creating upcoming payment:', err);
    });
    
    res.json({ id: result.insertId, message: 'Invoice created successfully' });
  });
});

// Update invoice payment
router.put('/invoices/:id/payment', auth, authorize('finance', 'update'), (req, res) => {
  const { id } = req.params;
  const { paid_amount } = req.body;
  
  const sql = `
    UPDATE invoices 
    SET paid_amount = paid_amount + ?, 
        remaining_amount = total_amount - (paid_amount + ?),
        status = CASE 
          WHEN (paid_amount + ?) >= total_amount THEN 'paid'
          WHEN due_date < CURDATE() AND remaining_amount > 0 THEN 'overdue'
          ELSE 'sent'
        END
    WHERE id = ?
  `;
  
  db.query(sql, [paid_amount, paid_amount, paid_amount, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Update upcoming payment status
    const updateUpcomingSql = `
      UPDATE upcoming_payments 
      SET status = 'paid'
      WHERE source_id = ? AND payment_type = 'invoice'
    `;
    
    db.query(updateUpcomingSql, [id], (err) => {
      if (err) console.error('Error updating upcoming payment:', err);
    });
    
    res.json({ message: 'Payment recorded successfully' });
  });
});

// Get upcoming payments
router.get('/upcoming-payments', auth, authorize('finance', 'read'), (req, res) => {
  const { days = 30 } = req.query;
  
  const sql = `
    SELECT 
      up.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone
    FROM upcoming_payments up
    JOIN customers c ON up.customer_id = c.id
    WHERE up.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
    AND up.status = 'pending'
    ORDER BY up.due_date ASC
  `;
  
  db.query(sql, [days], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Mark payment as paid
router.put('/upcoming-payments/:id/paid', auth, authorize('finance', 'update'), (req, res) => {
  const { id } = req.params;
  
  const sql = `
    UPDATE upcoming_payments 
    SET status = 'paid'
    WHERE id = ?
  `;
  
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Payment marked as paid' });
  });
});

// Migration endpoint to create invoices for existing sales
router.post('/migrate-sales-to-invoices', auth, authorize('finance', 'create'), async (req, res) => {
  try {
    const result = await InvoiceService.createInvoicesForExistingSales();
    res.json(result);
  } catch (error) {
    console.error('Error migrating sales to invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
