const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const CustomerSalesService = require('../services/customerSalesService');

// Get customer sales profile
router.get('/:id/sales-profile', auth, authorize('customers','read'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const profile = await CustomerSalesService.getCustomerSalesProfile(customerId);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching customer sales profile:', error);
    res.status(500).json({ message: error.message || 'Error fetching customer sales profile' });
  }
});

// Get upcoming payments for a customer
router.get('/:id/upcoming-payments', auth, authorize('customers','read'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days) || 30;
    const payments = await CustomerSalesService.getUpcomingPaymentsForCustomer(customerId, days);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    res.status(500).json({ message: error.message || 'Error fetching upcoming payments' });
  }
});

// Get payment history for a customer
router.get('/:id/payment-history', auth, authorize('customers','read'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const history = await CustomerSalesService.getPaymentHistoryForCustomer(customerId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: error.message || 'Error fetching payment history' });
  }
});

// Process payment for a sale
router.post('/sales/:saleId/process-payment', auth, authorize('sales','update'), async (req, res) => {
  try {
    const { saleId } = req.params;
    const { amount, paymentSource, notes } = req.body;
    const createdBy = req.user.id;
    
    if (!amount || !paymentSource) {
      return res.status(400).json({ message: 'Amount and payment source are required' });
    }
    
    // Auto-set receivedBy to the user processing the payment
    const receivedBy = req.user.id;
    
    const result = await CustomerSalesService.processPayment(
      saleId, 
      amount, 
      paymentSource, 
      createdBy, 
      notes,
      receivedBy
    );
    
    res.json({ 
      message: 'Payment processed successfully', 
      ...result 
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: error.message || 'Error processing payment' });
  }
});

// Get all upcoming payments (dashboard)
router.get('/dashboard/upcoming-payments', auth, authorize('sales','read'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const payments = await CustomerSalesService.getAllUpcomingPayments(days);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    res.status(500).json({ message: error.message || 'Error fetching upcoming payments' });
  }
});

// Get overdue payments (dashboard)
router.get('/dashboard/overdue-payments', auth, authorize('sales','read'), async (req, res) => {
  try {
    const payments = await CustomerSalesService.getOverduePayments();
    res.json(payments);
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({ message: error.message || 'Error fetching overdue payments' });
  }
});

module.exports = router;
