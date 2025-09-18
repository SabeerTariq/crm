const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const CustomerAssignmentService = require('../services/customerAssignmentService');

// Get upseller dashboard data
router.get('/dashboard', auth, authorize('assignments', 'read'), async (req, res) => {
  try {
    const upsellerId = req.user.id;
    
    // Get assigned customers count and details
    const assignedCustomers = await CustomerAssignmentService.getAssignedCustomers(upsellerId, 'active');
    
    // Get financial data for assigned customers
    const customerIds = assignedCustomers.map(customer => customer.customer_id);
    let financialData = { 
      totalCashIn: 0, 
      receivables: 0
    };
    
    if (customerIds.length > 0) {
      // Get total cash in from upseller performance table (current month)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const performanceSql = `
        SELECT COALESCE(metric_value, 0) as total_cash_in
        FROM upseller_performance 
        WHERE user_id = ? AND metric_type = 'revenue_generated' 
        AND period_year = ? AND period_month = ?
      `;
      
      const performanceResults = await new Promise((resolve, reject) => {
        db.query(performanceSql, [upsellerId, currentYear, currentMonth], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      if (performanceResults.length > 0) {
        financialData.totalCashIn = parseFloat(performanceResults[0].total_cash_in || 0);
      }
      
      // Get receivables - remaining amount of ALL assigned customers (regardless of who created the sales)
      const receivablesSql = `
        SELECT COALESCE(SUM(remaining), 0) as receivables
        FROM sales 
        WHERE customer_id IN (${customerIds.map(() => '?').join(',')})
      `;
      
      const receivablesResults = await new Promise((resolve, reject) => {
        db.query(receivablesSql, customerIds, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      if (receivablesResults.length > 0) {
        financialData.receivables = parseFloat(receivablesResults[0].receivables || 0);
      }
    }
    
    // Get recent assignments
    const recentAssignments = await CustomerAssignmentService.getRecentAssignments(upsellerId, 5);
    
    // Get upcoming payments for assigned customers
    const upcomingPayments = await getUpcomingPaymentsForUpseller(upsellerId);
    
    res.json({
      success: true,
      data: {
        assignedCustomersCount: assignedCustomers.length,
        assignedCustomers: assignedCustomers,
        financialData: financialData,
        recentAssignments: recentAssignments,
        upcomingPayments: upcomingPayments
      }
    });
  } catch (error) {
    console.error('Error fetching upseller dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data' 
    });
  }
});

// Get upcoming payments for upseller's assigned customers
async function getUpcomingPaymentsForUpseller(upsellerId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        pt.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        s.services,
        s.payment_type,
        u.name as created_by_name,
        u2.name as received_by_name,
        pi.installment_number,
        pr.frequency as recurring_frequency
      FROM payment_transactions pt
      JOIN sales s ON pt.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN customer_assignments ca ON c.id = ca.customer_id
      LEFT JOIN users u ON pt.created_by = u.id
      LEFT JOIN users u2 ON pt.received_by = u2.id
      LEFT JOIN payment_installments pi ON pt.installment_id = pi.id
      LEFT JOIN payment_recurring pr ON pt.recurring_id = pr.id
      WHERE ca.upseller_id = ? 
      AND ca.status = 'active'
      AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY pt.created_at DESC
      LIMIT 10
    `;
    
    db.query(sql, [upsellerId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Get upseller performance metrics
router.get('/performance', auth, authorize('assignments', 'read'), async (req, res) => {
  try {
    const upsellerId = req.user.id;
    
    // Get assigned customers
    const assignedCustomers = await CustomerAssignmentService.getAssignedCustomers(upsellerId, 'active');
    const customerIds = assignedCustomers.map(customer => customer.customer_id);
    
    if (customerIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCustomers: 0,
          totalSales: 0,
          totalRevenue: 0,
          averageSaleValue: 0,
          conversionRate: 0,
          monthlySales: []
        }
      });
    }
    
    // Get sales performance data
    const performanceSql = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(unit_price), 0) as total_revenue,
        COALESCE(AVG(unit_price), 0) as average_sale_value,
        COALESCE(SUM(cash_in), 0) as total_collected
      FROM sales 
      WHERE customer_id IN (${customerIds.map(() => '?').join(',')})
    `;
    
    const performanceResults = await new Promise((resolve, reject) => {
      db.query(performanceSql, customerIds, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Get monthly sales data for the last 6 months
    const monthlySalesSql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as sales_count,
        COALESCE(SUM(unit_price), 0) as revenue
      FROM sales 
      WHERE customer_id IN (${customerIds.map(() => '?').join(',')})
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const monthlySales = await new Promise((resolve, reject) => {
      db.query(monthlySalesSql, customerIds, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    const performance = performanceResults[0];
    const conversionRate = assignedCustomers.length > 0 ? 
      (performance.total_sales / assignedCustomers.length) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        totalCustomers: assignedCustomers.length,
        totalSales: performance.total_sales || 0,
        totalRevenue: parseFloat(performance.total_revenue || 0),
        averageSaleValue: parseFloat(performance.average_sale_value || 0),
        totalCollected: parseFloat(performance.total_collected || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        monthlySales: monthlySales
      }
    });
  } catch (error) {
    console.error('Error fetching upseller performance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching performance data' 
    });
  }
});

module.exports = router;
