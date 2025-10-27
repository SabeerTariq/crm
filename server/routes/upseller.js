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
    
    // Get count of customers assigned in current month
    const currentMonthAssignmentsSql = `
      SELECT COUNT(*) as assigned_this_month
      FROM customer_assignments 
      WHERE upseller_id = ? 
        AND status = 'active'
        AND YEAR(assigned_date) = ?
        AND MONTH(assigned_date) = ?
    `;
    
    const currentMonthAssignmentsResults = await new Promise((resolve, reject) => {
      db.query(currentMonthAssignmentsSql, [upsellerId, currentYear, currentMonth], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    const assignedCustomersThisMonth = currentMonthAssignmentsResults.length > 0 ? 
      parseInt(currentMonthAssignmentsResults[0].assigned_this_month || 0) : 0;
    
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
      // Get receivables - use customer's total_remaining field which is more accurate
      // and subtract chargebacks and refunds from the remaining amount
      const receivablesSql = `
        SELECT 
          COALESCE(SUM(c.total_remaining), 0) as base_receivables,
          COALESCE(SUM(CASE 
            WHEN cr.type = 'chargeback' AND cr.status IN ('approved', 'processed') THEN cr.amount
            WHEN cr.type = 'refund' AND cr.status IN ('approved', 'processed') THEN cr.amount
            ELSE 0 
          END), 0) as chargeback_refund_amount
        FROM customers c
        LEFT JOIN chargeback_refunds cr ON c.id = cr.customer_id 
          AND cr.status IN ('approved', 'processed')
        WHERE c.id IN (${customerIds.map(() => '?').join(',')})
      `;
      
      const receivablesResults = await new Promise((resolve, reject) => {
        db.query(receivablesSql, customerIds, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      if (receivablesResults.length > 0) {
        const baseReceivables = parseFloat(receivablesResults[0].base_receivables || 0);
        const chargebackRefundAmount = parseFloat(receivablesResults[0].chargeback_refund_amount || 0);
        financialData.receivables = Math.max(0, baseReceivables - chargebackRefundAmount);
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
    
    // Get commission data (wire transfer and Zelle payments)
    const commissionData = await getCommissionDataForUpseller(upsellerId);
    
    res.json({
      success: true,
      data: {
        userId: upsellerId,
        assignedCustomersCount: assignedCustomers.length,
        assignedCustomersThisMonth: assignedCustomersThisMonth,
        assignedCustomers: assignedCustomers,
        financialData: financialData,
        commissionData: commissionData,
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

// Get commission data for upseller's assigned customers (wire transfer and Zelle payments)
async function getCommissionDataForUpseller(upsellerId) {
  return new Promise((resolve, reject) => {
    // Get current month data
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const sql = `
      SELECT 
        pt.payment_source,
        COALESCE(SUM(pt.amount), 0) as total_amount,
        COUNT(pt.id) as payment_count,
        'current_month' as period_type
      FROM payment_transactions pt
      JOIN sales s ON pt.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN customer_assignments ca ON c.id = ca.customer_id
      WHERE ca.upseller_id = ? 
        AND ca.status = 'active'
        AND pt.payment_source IN ('wire', 'zelle')
        AND YEAR(pt.created_at) = ?
        AND MONTH(pt.created_at) = ?
      GROUP BY pt.payment_source
      
      UNION ALL
      
      SELECT 
        pt.payment_source,
        COALESCE(SUM(pt.amount), 0) as total_amount,
        COUNT(pt.id) as payment_count,
        'all_time' as period_type
      FROM payment_transactions pt
      JOIN sales s ON pt.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN customer_assignments ca ON c.id = ca.customer_id
      WHERE ca.upseller_id = ? 
        AND ca.status = 'active'
        AND pt.payment_source IN ('wire', 'zelle')
      GROUP BY pt.payment_source
    `;
    
    db.query(sql, [upsellerId, currentYear, currentMonth, upsellerId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        // Initialize commission data
        const commissionData = {
          currentMonth: {
            wireTransfer: {
              amount: 0,
              count: 0
            },
            zelle: {
              amount: 0,
              count: 0
            },
            total: {
              amount: 0,
              count: 0
            }
          },
          allTime: {
            wireTransfer: {
              amount: 0,
              count: 0
            },
            zelle: {
              amount: 0,
              count: 0
            },
            total: {
              amount: 0,
              count: 0
            }
          }
        };
        
        // Process results
        results.forEach(row => {
          const amount = parseFloat(row.total_amount || 0);
          const count = parseInt(row.payment_count || 0);
          const periodType = row.period_type;
          const paymentSource = row.payment_source;
          
          if (periodType === 'current_month') {
            if (paymentSource === 'wire') {
              commissionData.currentMonth.wireTransfer.amount = amount;
              commissionData.currentMonth.wireTransfer.count = count;
            } else if (paymentSource === 'zelle') {
              commissionData.currentMonth.zelle.amount = amount;
              commissionData.currentMonth.zelle.count = count;
            }
            
            commissionData.currentMonth.total.amount += amount;
            commissionData.currentMonth.total.count += count;
          } else if (periodType === 'all_time') {
            if (paymentSource === 'wire') {
              commissionData.allTime.wireTransfer.amount = amount;
              commissionData.allTime.wireTransfer.count = count;
            } else if (paymentSource === 'zelle') {
              commissionData.allTime.zelle.amount = amount;
              commissionData.allTime.zelle.count = count;
            }
            
            commissionData.allTime.total.amount += amount;
            commissionData.allTime.total.count += count;
          }
        });
        
        resolve(commissionData);
      }
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

// Get upsell manager dashboard data
router.get('/manager/dashboard', auth, authorize('assignments', 'read'), async (req, res) => {
  try {
    const { period = 'this_month', year, month } = req.query;
    
    // Validate user has upseller-manager role
    const userRoleId = req.user.role_id;
    if (userRoleId !== 6 && userRoleId !== 1) { // 6 = upseller-manager, 1 = admin
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Upseller manager role required.' 
      });
    }
    
    // Determine date range based on period
    let startDate, endDate, periodLabel;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    switch (period) {
      case 'this_year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        periodLabel = `${currentYear}`;
        break;
      case 'this_month':
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth - 1, new Date(currentYear, currentMonth, 0).getDate(), 23, 59, 59, 999);
        periodLabel = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`;
        break;
      case 'all_time':
        startDate = new Date('2020-01-01'); // Start from a reasonable date
        endDate = new Date();
        periodLabel = 'All Time';
        break;
      case 'custom':
        if (!year || !month) {
          return res.status(400).json({ 
            success: false, 
            message: 'Year and month are required for custom period' 
          });
        }
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month) - 1, new Date(parseInt(year), parseInt(month), 0).getDate(), 23, 59, 59, 999);
        periodLabel = `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid period. Use: this_year, this_month, all_time, or custom' 
        });
    }
    
    // Get all upsellers
    const upsellersSql = `
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      WHERE u.role_id = 5
      ORDER BY u.name
    `;
    
    const upsellersResults = await new Promise((resolve, reject) => {
      db.query(upsellersSql, (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    
    // Get comprehensive analytics for each upseller
    const analyticsPromises = upsellersResults.map(async (upseller) => {
      const upsellerId = upseller.id;
      
      // Get assigned customers count
      const assignedCustomersSql = `
        SELECT COUNT(*) as total_customers
        FROM customer_assignments ca
        WHERE ca.upseller_id = ? AND ca.status = 'active'
      `;
      
      // Get customers assigned in period
      const periodCustomersSql = `
        SELECT COUNT(*) as period_customers
        FROM customer_assignments ca
        WHERE ca.upseller_id = ? 
          AND ca.status = 'active'
          AND ca.assigned_date >= ? 
          AND ca.assigned_date <= ?
      `;
      
      // Get sales data for assigned customers
      const salesSql = `
        SELECT 
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.unit_price), 0) as total_revenue,
          COALESCE(SUM(s.cash_in), 0) as cash_received,
          COALESCE(SUM(s.remaining), 0) as receivables
        FROM sales s
        JOIN customer_assignments ca ON s.customer_id = ca.customer_id
        WHERE ca.upseller_id = ? 
          AND ca.status = 'active'
          AND s.created_at >= ?
          AND s.created_at <= ?
      `;
      
      // Get target data based on period
      let targetSql, targetParams;
      
      if (period === 'this_month') {
        targetSql = `
          SELECT 
            COALESCE(SUM(ut.target_value), 0) as total_target,
            COALESCE(SUM(up.metric_value), 0) as achieved_revenue
          FROM upseller_targets ut
          LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
            AND up.metric_type = 'revenue_generated'
            AND up.period_year = ut.target_year 
            AND up.period_month = ut.target_month
          WHERE ut.user_id = ? 
            AND ut.target_year = ? 
            AND ut.target_month = ?
        `;
        targetParams = [upsellerId, currentYear, currentMonth];
      } else if (period === 'this_year') {
        targetSql = `
          SELECT 
            COALESCE(SUM(ut.target_value), 0) as total_target,
            COALESCE(SUM(up.metric_value), 0) as achieved_revenue
          FROM upseller_targets ut
          LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
            AND up.metric_type = 'revenue_generated'
            AND up.period_year = ut.target_year 
            AND up.period_month = ut.target_month
          WHERE ut.user_id = ? 
            AND ut.target_year = ?
        `;
        targetParams = [upsellerId, currentYear];
      } else if (period === 'custom') {
        targetSql = `
          SELECT 
            COALESCE(SUM(ut.target_value), 0) as total_target,
            COALESCE(SUM(up.metric_value), 0) as achieved_revenue
          FROM upseller_targets ut
          LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
            AND up.metric_type = 'revenue_generated'
            AND up.period_year = ut.target_year 
            AND up.period_month = ut.target_month
          WHERE ut.user_id = ? 
            AND ut.target_year = ? 
            AND ut.target_month = ?
        `;
        targetParams = [upsellerId, parseInt(year), parseInt(month)];
      } else { // all_time
        targetSql = `
          SELECT 
            COALESCE(SUM(ut.target_value), 0) as total_target,
            COALESCE(SUM(up.metric_value), 0) as achieved_revenue
          FROM upseller_targets ut
          LEFT JOIN upseller_performance up ON up.user_id = ut.user_id 
            AND up.metric_type = 'revenue_generated'
            AND up.period_year = ut.target_year 
            AND up.period_month = ut.target_month
          WHERE ut.user_id = ?
        `;
        targetParams = [upsellerId];
      }
      
      const [assignedCustomers, periodCustomers, sales, targets] = await Promise.all([
        new Promise((resolve, reject) => {
          db.query(assignedCustomersSql, [upsellerId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.total_customers || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(periodCustomersSql, [upsellerId, startDate, endDate], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.period_customers || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(salesSql, [upsellerId, startDate, endDate], (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || { total_sales: 0, total_revenue: 0, cash_received: 0, receivables: 0 });
          });
        }),
        new Promise((resolve, reject) => {
          db.query(targetSql, targetParams, (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || { total_target: 0, achieved_revenue: 0 });
          });
        })
      ]);
      
      return {
        upsellerId: upseller.id,
        upsellerName: upseller.name,
        upsellerEmail: upseller.email,
        upsellerCreatedAt: upseller.created_at,
        metrics: {
          totalCustomers: parseInt(assignedCustomers),
          periodCustomers: parseInt(periodCustomers),
          totalSales: parseInt(sales.total_sales),
          totalRevenue: parseFloat(sales.total_revenue),
          cashReceived: parseFloat(sales.cash_received),
          receivables: parseFloat(sales.receivables),
          target: parseFloat(targets.total_target),
          achieved: parseFloat(targets.achieved_revenue),
          progressPercentage: targets.total_target > 0 ? 
            Math.round((targets.achieved_revenue / targets.total_target) * 100) : 0
        }
      };
    });
    
    const upsellerAnalytics = await Promise.all(analyticsPromises);
    
    // Calculate team totals
    const teamTotals = upsellerAnalytics.reduce((totals, upseller) => {
      totals.totalCustomers += upseller.metrics.totalCustomers;
      totals.periodCustomers += upseller.metrics.periodCustomers;
      totals.totalSales += upseller.metrics.totalSales;
      totals.totalRevenue += upseller.metrics.totalRevenue;
      totals.cashReceived += upseller.metrics.cashReceived;
      totals.receivables += upseller.metrics.receivables;
      totals.target += upseller.metrics.target;
      totals.achieved += upseller.metrics.achieved;
      return totals;
    }, {
      totalCustomers: 0,
      periodCustomers: 0,
      totalSales: 0,
      totalRevenue: 0,
      cashReceived: 0,
      receivables: 0,
      target: 0,
      achieved: 0,
      progressPercentage: 0
    });
    
    teamTotals.progressPercentage = teamTotals.target > 0 ? 
      Math.round((teamTotals.achieved / teamTotals.target) * 100) : 0;
    
    // Sort upsellers by performance
    const sortedUpsellers = upsellerAnalytics.sort((a, b) => 
      b.metrics.achieved - a.metrics.achieved
    );
    
    res.json({
      success: true,
      data: {
        period: {
          type: period,
          label: periodLabel,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        teamTotals,
        upsellers: sortedUpsellers,
        summary: {
          totalUpsellers: upsellerAnalytics.length,
          topPerformer: sortedUpsellers[0] || null,
          averagePerformance: upsellerAnalytics.length > 0 ? 
            Math.round(upsellerAnalytics.reduce((sum, u) => sum + u.metrics.progressPercentage, 0) / upsellerAnalytics.length) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching upsell manager dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data' 
    });
  }
});

module.exports = router;
