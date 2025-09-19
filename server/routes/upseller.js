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
    
    // Get current month target and performance data
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Get current month target
    const targetSql = `
      SELECT ut.target_value,
             COALESCE(up.metric_value, 0) as actual_cash_in,
             CASE 
               WHEN ut.target_value > 0 THEN ROUND((COALESCE(up.metric_value, 0) / ut.target_value) * 100, 2)
               ELSE 0 
             END as progress_percentage
      FROM upseller_targets ut
      LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
        AND up.metric_type = 'revenue_generated'
        AND up.period_year = ut.target_year 
        AND up.period_month = ut.target_month
      WHERE ut.user_id = ? 
        AND ut.target_year = ? 
        AND ut.target_month = ?
    `;
    
    const targetResults = await new Promise((resolve, reject) => {
      db.query(targetSql, [upsellerId, currentYear, currentMonth], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    const targetData = targetResults.length > 0 ? targetResults[0] : {
      target_value: 0,
      actual_cash_in: 0,
      progress_percentage: 0
    };
    
    // Get financial data for assigned customers
    const customerIds = assignedCustomers.map(customer => customer.customer_id);
    let financialData = { 
      totalCashIn: parseFloat(targetData.actual_cash_in || 0), 
      receivables: 0
    };
    
    if (customerIds.length > 0) {
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
    
    // Get past months performance (last 12 months)
    const pastMonthsSql = `
      SELECT 
        ut.target_year as year,
        ut.target_month as month,
        CASE ut.target_month
          WHEN 1 THEN 'January'
          WHEN 2 THEN 'February'
          WHEN 3 THEN 'March'
          WHEN 4 THEN 'April'
          WHEN 5 THEN 'May'
          WHEN 6 THEN 'June'
          WHEN 7 THEN 'July'
          WHEN 8 THEN 'August'
          WHEN 9 THEN 'September'
          WHEN 10 THEN 'October'
          WHEN 11 THEN 'November'
          WHEN 12 THEN 'December'
        END as month_name,
        ut.target_value as target,
        COALESCE(up.metric_value, 0) as achieved,
        CASE 
          WHEN ut.target_value > 0 THEN ROUND((COALESCE(up.metric_value, 0) / ut.target_value) * 100, 2)
          ELSE 0 
        END as progress_percentage
      FROM upseller_targets ut
      LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
        AND up.metric_type = 'revenue_generated'
        AND up.period_year = ut.target_year 
        AND up.period_month = ut.target_month
      WHERE ut.user_id = ? 
        AND (
          (ut.target_year = ? AND ut.target_month < ?) OR
          (ut.target_year < ?)
        )
      ORDER BY ut.target_year DESC, ut.target_month DESC
      LIMIT 12
    `;
    
    const pastMonthsResults = await new Promise((resolve, reject) => {
      db.query(pastMonthsSql, [upsellerId, currentYear, currentMonth, currentYear], (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    
    // Get team performance data
    const teamPerformanceSql = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        utm.role as team_role,
        ut.target_value as target,
        COALESCE(up.metric_value, 0) as achieved,
        CASE 
          WHEN ut.target_value > 0 THEN ROUND((COALESCE(up.metric_value, 0) / ut.target_value) * 100, 2)
          ELSE 0 
        END as progress_percentage,
        ROW_NUMBER() OVER (ORDER BY 
          CASE 
            WHEN ut.target_value > 0 THEN (COALESCE(up.metric_value, 0) / ut.target_value) * 100
            ELSE 0 
          END DESC
        ) as team_rank
      FROM upseller_team_members utm
      JOIN users u ON utm.user_id = u.id
      JOIN upseller_teams ut_team ON utm.team_id = ut_team.id
      LEFT JOIN upseller_targets ut ON ut.user_id = u.id 
        AND ut.target_year = ? 
        AND ut.target_month = ?
      LEFT JOIN upseller_performance up ON up.user_id = u.id 
        AND up.metric_type = 'revenue_generated'
        AND up.period_year = ? 
        AND up.period_month = ?
      WHERE utm.team_id IN (
        SELECT utm2.team_id 
        FROM upseller_team_members utm2 
        WHERE utm2.user_id = ?
      )
      GROUP BY u.id, u.name, u.email, utm.role, ut.target_value
      ORDER BY progress_percentage DESC, u.name
    `;
    
    const teamPerformanceResults = await new Promise((resolve, reject) => {
      db.query(teamPerformanceSql, [currentYear, currentMonth, currentYear, currentMonth, upsellerId], (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    
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
        targetData: {
          target: parseFloat(targetData.target_value || 0),
          achieved: parseFloat(targetData.actual_cash_in || 0),
          remaining: Math.max(0, parseFloat(targetData.target_value || 0) - parseFloat(targetData.actual_cash_in || 0)),
          progressPercentage: parseFloat(targetData.progress_percentage || 0)
        },
        currentPeriod: {
          year: currentYear,
          month: currentMonth,
          monthName: currentDate.toLocaleString('default', { month: 'long' })
        },
        pastMonths: pastMonthsResults.map(month => ({
          year: month.year,
          month: month.month,
          monthName: month.month_name,
          target: parseFloat(month.target || 0),
          achieved: parseFloat(month.achieved || 0),
          progressPercentage: parseFloat(month.progress_percentage || 0)
        })),
        teamPerformance: teamPerformanceResults.map(member => ({
          userId: member.user_id,
          userName: member.user_name,
          email: member.email,
          teamRole: member.team_role,
          target: parseFloat(member.target || 0),
          achieved: parseFloat(member.achieved || 0),
          progressPercentage: parseFloat(member.progress_percentage || 0),
          teamRank: member.team_rank || 0
        })),
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
