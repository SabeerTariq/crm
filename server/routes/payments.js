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

module.exports = router;
