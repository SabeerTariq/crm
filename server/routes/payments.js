const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const checkCustomerAssignment = require('../middleware/checkCustomerAssignment');
const PaymentService = require('../services/paymentService');

// Get payment details for a sale
router.get('/sale/:saleId', auth, authorize('payments', 'read'), checkCustomerAssignment, (req, res) => {
  const saleId = req.params.saleId;
  
  PaymentService.getSalePaymentDetails(saleId)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching payment details:', err);
      res.status(500).json({ message: 'Error fetching payment details' });
    });
});

// Create installment payments for a sale
router.post('/installments', auth, authorize('payments', 'create'), (req, res) => {
  const { saleId, totalAmount, numberOfInstallments, frequency, startDate } = req.body;
  
  if (!saleId || !totalAmount || !numberOfInstallments || !frequency || !startDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  PaymentService.createInstallments(saleId, totalAmount, numberOfInstallments, frequency, new Date(startDate))
    .then(result => {
      res.json({ message: 'Installments created successfully', installments: result });
    })
    .catch(err => {
      console.error('Error creating installments:', err);
      res.status(500).json({ message: 'Error creating installments' });
    });
});

// Create recurring payment for a sale
router.post('/recurring', auth, authorize('payments', 'create'), (req, res) => {
  const { saleId, customerId, amount, frequency, startDate, totalPayments } = req.body;
  
  if (!saleId || !customerId || !amount || !frequency || !startDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  PaymentService.createRecurringPayment(saleId, customerId, amount, frequency, new Date(startDate), totalPayments)
    .then(result => {
      res.json({ message: 'Recurring payment created successfully', recurring: result });
    })
    .catch(err => {
      console.error('Error creating recurring payment:', err);
      res.status(500).json({ message: 'Error creating recurring payment' });
    });
});

// Process installment payment
router.post('/installment/:installmentId/pay', auth, authorize('payments', 'update'), checkCustomerAssignment, (req, res) => {
  const installmentId = req.params.installmentId;
  const { amount, paymentMethod, paymentSource, notes, receivedBy } = req.body;
  
  if (!amount || !paymentMethod || !paymentSource) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  PaymentService.processInstallmentPayment(installmentId, amount, paymentMethod, paymentSource, req.user.id, receivedBy)
    .then(result => {
      res.json({ 
        message: 'Payment processed successfully', 
        fullyPaid: result.fullyPaid 
      });
    })
    .catch(err => {
      console.error('Error processing installment payment:', err);
      res.status(500).json({ message: 'Error processing payment' });
    });
});

// Process recurring payment
router.post('/recurring/:recurringId/pay', auth, authorize('payments', 'update'), checkCustomerAssignment, (req, res) => {
  const recurringId = req.params.recurringId;
  const { amount, paymentMethod, paymentSource, notes, receivedBy } = req.body;
  
  if (!amount || !paymentMethod || !paymentSource) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  PaymentService.processRecurringPayment(recurringId, amount, paymentMethod, paymentSource, req.user.id, receivedBy)
    .then(result => {
      res.json({ 
        message: 'Payment processed successfully', 
        completed: result.completed 
      });
    })
    .catch(err => {
      console.error('Error processing recurring payment:', err);
      res.status(500).json({ message: 'Error processing payment' });
    });
});

// Get upcoming payments (installments)
router.get('/upcoming/installments', auth, authorize('payments', 'read'), (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  PaymentService.getUpcomingPayments(days)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching upcoming payments:', err);
      res.status(500).json({ message: 'Error fetching upcoming payments' });
    });
});

// Get upcoming recurring payments
router.get('/upcoming/recurring', auth, authorize('payments', 'read'), (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  PaymentService.getUpcomingRecurringPayments(days)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching upcoming recurring payments:', err);
      res.status(500).json({ message: 'Error fetching upcoming recurring payments' });
    });
});

// Get all payment transactions for a sale
router.get('/transactions/:saleId', auth, authorize('payments', 'read'), checkCustomerAssignment, (req, res) => {
  const saleId = req.params.saleId;
  
  const sql = `
    SELECT 
      pt.*,
      u.name as created_by_name,
      u2.name as received_by_name,
      pi.installment_number,
      pr.frequency as recurring_frequency
    FROM payment_transactions pt
    LEFT JOIN users u ON pt.created_by = u.id
    LEFT JOIN users u2 ON pt.received_by = u2.id
    LEFT JOIN payment_installments pi ON pt.installment_id = pi.id
    LEFT JOIN payment_recurring pr ON pt.recurring_id = pr.id
    WHERE pt.sale_id = ?
    ORDER BY pt.created_at DESC
  `;
  
  db.query(sql, [saleId], (err, results) => {
    if (err) {
      console.error('Error fetching payment transactions:', err);
      return res.status(500).json({ message: 'Error fetching payment transactions' });
    }
    res.json(results);
  });
});

// Update installment due date
router.put('/installment/:installmentId', auth, authorize('payments', 'update'), (req, res) => {
  const installmentId = req.params.installmentId;
  const { dueDate, notes } = req.body;
  
  const sql = `
    UPDATE payment_installments 
    SET due_date = ?, notes = ?
    WHERE id = ?
  `;
  
  db.query(sql, [dueDate, notes, installmentId], (err, result) => {
    if (err) {
      console.error('Error updating installment:', err);
      return res.status(500).json({ message: 'Error updating installment' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    res.json({ message: 'Installment updated successfully' });
  });
});

// Pause/Resume recurring payment
router.put('/recurring/:recurringId/status', auth, authorize('payments', 'update'), (req, res) => {
  const recurringId = req.params.recurringId;
  const { status } = req.body;
  
  if (!['active', 'paused', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  const sql = `
    UPDATE payment_recurring 
    SET status = ?
    WHERE id = ?
  `;
  
  db.query(sql, [status, recurringId], (err, result) => {
    if (err) {
      console.error('Error updating recurring payment status:', err);
      return res.status(500).json({ message: 'Error updating recurring payment status' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recurring payment not found' });
    }
    res.json({ message: 'Recurring payment status updated successfully' });
  });
});

// Delete installment
router.delete('/installment/:installmentId', auth, authorize('payments', 'delete'), (req, res) => {
  const installmentId = req.params.installmentId;
  
  const sql = 'DELETE FROM payment_installments WHERE id = ?';
  
  db.query(sql, [installmentId], (err, result) => {
    if (err) {
      console.error('Error deleting installment:', err);
      return res.status(500).json({ message: 'Error deleting installment' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    res.json({ message: 'Installment deleted successfully' });
  });
});

// Delete recurring payment
router.delete('/recurring/:recurringId', auth, authorize('payments', 'delete'), (req, res) => {
  const recurringId = req.params.recurringId;
  
  const sql = 'DELETE FROM payment_recurring WHERE id = ?';
  
  db.query(sql, [recurringId], (err, result) => {
    if (err) {
      console.error('Error deleting recurring payment:', err);
      return res.status(500).json({ message: 'Error deleting recurring payment' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recurring payment not found' });
    }
    res.json({ message: 'Recurring payment deleted successfully' });
  });
});

// Get all payments data - comprehensive view
router.get('/all', auth, authorize('payments', 'read'), (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status, 
    paymentType, 
    customerId, 
    startDate, 
    endDate,
    search 
  } = req.query;
  
  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  
  // Build where conditions based on filters
  if (status) {
    whereConditions.push('(pi.status = ? OR pr.status = ? OR s.payment_status = ?)');
    queryParams.push(status, status, status);
  }
  
  if (paymentType) {
    whereConditions.push('s.payment_type = ?');
    queryParams.push(paymentType);
  }
  
  if (customerId) {
    whereConditions.push('s.customer_id = ?');
    queryParams.push(customerId);
  }
  
  if (startDate) {
    whereConditions.push('s.created_at >= ?');
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereConditions.push('s.created_at <= ?');
    queryParams.push(endDate);
  }
  
  if (search) {
    whereConditions.push('(s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.services LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count for pagination
  const countSql = `
    SELECT COUNT(DISTINCT s.id) as total
    FROM sales s
    LEFT JOIN payment_installments pi ON s.id = pi.sale_id
    LEFT JOIN payment_recurring pr ON s.id = pr.sale_id
    ${whereClause}
  `;
  
  db.query(countSql, queryParams, (err, countResult) => {
    if (err) {
      console.error('Error counting payments:', err);
      return res.status(500).json({ message: 'Error counting payments' });
    }
    
    const total = countResult[0].total;
    
    // Get all sales with their payment details
    const salesSql = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        u.name as created_by_name,
        u2.name as assigned_upseller_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN customer_assignments ca ON s.customer_id = ca.customer_id AND ca.status = 'active'
      LEFT JOIN users u2 ON ca.upseller_id = u2.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    db.query(salesSql, [...queryParams, parseInt(limit), offset], (err, salesResults) => {
      if (err) {
        console.error('Error fetching sales:', err);
        return res.status(500).json({ message: 'Error fetching sales data' });
      }
      
      if (salesResults.length === 0) {
        return res.json({
          payments: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
      
      const saleIds = salesResults.map(sale => sale.id);
      
      // Get installments for these sales
      const installmentsSql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.services,
          s.payment_type
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE pi.sale_id IN (${saleIds.map(() => '?').join(',')})
        ORDER BY pi.sale_id, pi.installment_number
      `;
      
      // Get recurring payments for these sales
      const recurringSql = `
        SELECT 
          pr.*,
          s.customer_name,
          s.customer_email,
          s.services,
          s.payment_type
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE pr.sale_id IN (${saleIds.map(() => '?').join(',')})
        ORDER BY pr.sale_id, pr.id
      `;
      
      // Get payment transactions for these sales
      const transactionsSql = `
        SELECT 
          pt.*,
          s.customer_name,
          s.customer_email,
          s.services,
          u.name as created_by_name,
          u2.name as received_by_name,
          pi.installment_number,
          pr.frequency as recurring_frequency
        FROM payment_transactions pt
        JOIN sales s ON pt.sale_id = s.id
        LEFT JOIN users u ON pt.created_by = u.id
        LEFT JOIN users u2 ON pt.received_by = u2.id
        LEFT JOIN payment_installments pi ON pt.installment_id = pi.id
        LEFT JOIN payment_recurring pr ON pt.recurring_id = pr.id
        WHERE pt.sale_id IN (${saleIds.map(() => '?').join(',')})
        ORDER BY pt.created_at DESC
      `;
      
      Promise.all([
        new Promise((resolve, reject) => {
          db.query(installmentsSql, saleIds, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(recurringSql, saleIds, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(transactionsSql, saleIds, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      ]).then(([installments, recurring, transactions]) => {
        // Group data by sale
        const paymentsData = salesResults.map(sale => {
          const saleInstallments = installments.filter(inst => inst.sale_id === sale.id);
          const saleRecurring = recurring.filter(rec => rec.sale_id === sale.id);
          const saleTransactions = transactions.filter(trans => trans.sale_id === sale.id);
          
          return {
            ...sale,
            installments: saleInstallments,
            recurring: saleRecurring,
            transactions: saleTransactions,
            totalInstallments: saleInstallments.length,
            totalRecurring: saleRecurring.length,
            totalTransactions: saleTransactions.length
          };
        });
        
        res.json({
          payments: paymentsData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / limit)
          }
        });
      }).catch(err => {
        console.error('Error fetching payment details:', err);
        res.status(500).json({ message: 'Error fetching payment details' });
      });
    });
  });
});

module.exports = router;
