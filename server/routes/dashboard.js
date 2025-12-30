const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const StatsService = require('../services/statsService');

// Middleware to check if user has lead-scraper role
const checkLeadScraperRole = (req, res, next) => {
  // Check admin role first (role_id = 1)
  if (req.user.role_id === 1) {
    return next();
  }
  
  // Check lead-scraper role (role_id = 2)
  if (req.user.role_id === 2) {
    return next();
  }
  
  res.status(403).json({ message: 'Access denied. Lead scraper role required.' });
};

// Middleware to check if user has sales role
const checkSalesRole = (req, res, next) => {
  // Check admin role first (role_id = 1)
  if (req.user.role_id === 1) {
    return next();
  }
  
  // Check sales role (role_id = 3)
  if (req.user.role_id === 3) {
    return next();
  }
  
  res.status(403).json({ message: 'Access denied. Sales role required.' });
};

// Middleware to check if user has front sales manager role
const checkFrontSalesManagerRole = (req, res, next) => {
  // Check admin role first (role_id = 1)
  if (req.user.role_id === 1) {
    return next();
  }
  
  // Check front-sales-manager role (role_id = 4)
  if (req.user.role_id === 4) {
    return next();
  }
  
  res.status(403).json({ message: 'Access denied. Front Sales Manager role required.' });
};

// Get dashboard statistics
router.get('/stats', auth, checkLeadScraperRole, async (req, res) => {
  try {
    const stats = await StatsService.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get monthly history for charts
router.get('/monthly-history', auth, checkLeadScraperRole, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const history = await StatsService.getMonthlyHistory(req.user.id, months);
    res.json(history);
  } catch (error) {
    console.error('Error fetching monthly history:', error);
    res.status(500).json({ message: 'Failed to fetch monthly history' });
  }
});

// Get converted leads for a specific lead scraper
router.get('/scraper-converted-leads', auth, checkLeadScraperRole, async (req, res) => {
  try {
    const scraperId = req.user.id;
    
    // Find customers that were converted from leads created by this scraper
    // Strategy: Find all 'converted' tracking records where this scraper is the original creator
    // Match customers by conversion timestamp (within 1 hour window) to account for processing time
    // Note: This uses conversion tracking where the original creator gets credit for the conversion
    const sql = `
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
        COALESCE(SUM(s.unit_price), 0) as total_sale_amount,
        COALESCE(SUM(s.cash_in), 0) as total_received,
        COALESCE(SUM(s.remaining), 0) as total_remaining,
        COUNT(DISTINCT s.id) as sales_count
      FROM lead_tracking lt_created
      INNER JOIN lead_tracking lt_converted ON lt_created.lead_id = lt_converted.lead_id 
        AND lt_converted.action = 'converted'
        AND lt_converted.user_id = ?
      INNER JOIN customers c ON (
        c.converted_at >= DATE_SUB(lt_converted.created_at, INTERVAL 1 HOUR)
        AND c.converted_at <= DATE_ADD(lt_converted.created_at, INTERVAL 1 HOUR)
      )
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.assigned_to = u2.id
      LEFT JOIN sales s ON s.customer_id = c.id
      WHERE lt_created.action = 'created'
        AND lt_created.user_id = ?
        AND c.converted_at IS NOT NULL
      GROUP BY c.id, c.name, c.company_name, c.email, c.phone, c.city, c.state, 
               c.source, c.service_required, c.notes, c.converted_at, 
               u1.name, u2.name
      ORDER BY c.converted_at DESC
      LIMIT 200
    `;
    
    db.query(sql, [scraperId, scraperId], (err, results) => {
      if (err) {
        console.error('Error fetching scraper converted leads:', err);
        return res.status(500).json({ message: 'Failed to fetch converted leads' });
      }
      
      res.json({
        success: true,
        data: results.map(customer => ({
          id: customer.id,
          name: customer.name,
          companyName: customer.company_name,
          email: customer.email,
          phone: customer.phone,
          city: customer.city,
          state: customer.state,
          source: customer.source,
          serviceRequired: customer.service_required,
          notes: customer.notes,
          convertedAt: customer.converted_at,
          createdByName: customer.created_by_name,
          assignedToName: customer.assigned_to_name,
          totalSaleAmount: parseFloat(customer.total_sale_amount || 0),
          totalReceived: parseFloat(customer.total_received || 0),
          totalRemaining: parseFloat(customer.total_remaining || 0),
          salesCount: parseInt(customer.sales_count || 0)
        }))
      });
    });
  } catch (error) {
    console.error('Error fetching scraper converted leads:', error);
    res.status(500).json({ message: 'Failed to fetch converted leads' });
  }
});

// Get all scrapers performance (Admin only)
router.get('/all-scrapers-performance', auth, async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (req.user.role_id !== 1) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get all lead scrapers (role_id = 2) with their performance
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        COALESCE(SUM(mls.leads_added), 0) as total_leads_added,
        COALESCE(SUM(mls.leads_converted), 0) as total_leads_converted,
        COALESCE(SUM(CASE WHEN mls.year = ? AND mls.month = ? THEN mls.leads_added ELSE 0 END), 0) as current_month_leads_added,
        COALESCE(SUM(CASE WHEN mls.year = ? AND mls.month = ? THEN mls.leads_converted ELSE 0 END), 0) as current_month_leads_converted,
        CASE 
          WHEN COALESCE(SUM(mls.leads_added), 0) > 0 
          THEN ROUND((COALESCE(SUM(mls.leads_converted), 0) / COALESCE(SUM(mls.leads_added), 0)) * 100, 2)
          ELSE 0 
        END as overall_conversion_rate,
        CASE 
          WHEN COALESCE(SUM(CASE WHEN mls.year = ? AND mls.month = ? THEN mls.leads_added ELSE 0 END), 0) > 0 
          THEN ROUND((COALESCE(SUM(CASE WHEN mls.year = ? AND mls.month = ? THEN mls.leads_converted ELSE 0 END), 0) / COALESCE(SUM(CASE WHEN mls.year = ? AND mls.month = ? THEN mls.leads_added ELSE 0 END), 0)) * 100, 2)
          ELSE 0 
        END as current_month_conversion_rate
      FROM users u
      LEFT JOIN monthly_lead_stats mls ON u.id = mls.user_id
      WHERE u.role_id = 2
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY current_month_leads_added DESC, total_leads_added DESC
    `;

    db.query(sql, [currentYear, currentMonth, currentYear, currentMonth, currentYear, currentMonth, currentYear, currentMonth, currentYear, currentMonth], (err, results) => {
      if (err) {
        console.error('Error fetching all scrapers performance:', err);
        return res.status(500).json({ message: 'Failed to fetch scrapers performance' });
      }

      res.json({
        success: true,
        data: results.map(scraper => ({
          id: scraper.id,
          name: scraper.name,
          email: scraper.email,
          createdAt: scraper.created_at,
          totalLeadsAdded: parseInt(scraper.total_leads_added) || 0,
          totalLeadsConverted: parseInt(scraper.total_leads_converted) || 0,
          currentMonthLeadsAdded: parseInt(scraper.current_month_leads_added) || 0,
          currentMonthLeadsConverted: parseInt(scraper.current_month_leads_converted) || 0,
          overallConversionRate: parseFloat(scraper.overall_conversion_rate) || 0,
          currentMonthConversionRate: parseFloat(scraper.current_month_conversion_rate) || 0
        }))
      });
    });
  } catch (error) {
    console.error('Error fetching all scrapers performance:', error);
    res.status(500).json({ message: 'Failed to fetch scrapers performance' });
  }
});

// FRONT SELLER DASHBOARD ENDPOINTS

// Get front seller dashboard statistics
router.get('/front-seller/stats', auth, checkSalesRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    // Get total customers converted by this user
    const totalCustomersSql = `
      SELECT COUNT(*) as total_customers 
      FROM customers 
      WHERE assigned_to = ?
    `;
    
    // Get customers converted in the previous month
    const previousMonthCustomersSql = `
      SELECT COUNT(*) as previous_month_customers 
      FROM customers 
      WHERE assigned_to = ? 
      AND YEAR(converted_at) = ? AND MONTH(converted_at) = ?
    `;
    
    // Get customers converted this month
    const currentMonthCustomersSql = `
      SELECT COUNT(*) as current_month_customers 
      FROM customers 
      WHERE assigned_to = ? 
      AND YEAR(converted_at) = ? AND MONTH(converted_at) = ?
    `;
    
    // Get current month target
    const currentTargetSql = `
      SELECT target_value, 
             COALESCE(COUNT(DISTINCT c.id), 0) as actual_conversions,
             CASE 
               WHEN target_value > 0 THEN CAST(ROUND((COALESCE(COUNT(DISTINCT c.id), 0) / target_value) * 100, 2) AS DECIMAL(5,2))
               ELSE 0 
             END as progress_percentage
      FROM targets t
      LEFT JOIN customers c ON c.assigned_to = t.user_id 
        AND YEAR(c.converted_at) = t.target_year 
        AND MONTH(c.converted_at) = t.target_month
      WHERE t.user_id = ? 
        AND t.target_year = ? 
        AND t.target_month = ?
      GROUP BY t.id, t.target_value
    `;
    
    // Get previous month target and performance
    const previousTargetSql = `
      SELECT target_value, 
             COALESCE(COUNT(DISTINCT c.id), 0) as actual_conversions,
             CASE 
               WHEN target_value > 0 THEN CAST(ROUND((COALESCE(COUNT(DISTINCT c.id), 0) / target_value) * 100, 2) AS DECIMAL(5,2))
               ELSE 0 
             END as progress_percentage
      FROM targets t
      LEFT JOIN customers c ON c.assigned_to = t.user_id 
        AND YEAR(c.converted_at) = t.target_year 
        AND MONTH(c.converted_at) = t.target_month
      WHERE t.user_id = ? 
        AND t.target_year = ? 
        AND t.target_month = ?
      GROUP BY t.id, t.target_value
    `;
    
    // Get past months performance (last 12 months)
    const pastMonthsSql = `
      SELECT 
        t.target_year as year,
        t.target_month as month,
        CASE t.target_month
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
        t.target_value as target,
        COALESCE(COUNT(DISTINCT c.id), 0) as achieved,
        CASE 
          WHEN t.target_value > 0 THEN CAST(ROUND((COALESCE(COUNT(DISTINCT c.id), 0) / t.target_value) * 100, 2) AS DECIMAL(5,2))
          ELSE 0 
        END as progress_percentage
      FROM targets t
      LEFT JOIN customers c ON c.assigned_to = t.user_id 
        AND YEAR(c.converted_at) = t.target_year 
        AND MONTH(c.converted_at) = t.target_month
      WHERE t.user_id = ? 
        AND (
          (t.target_year = ? AND t.target_month < ?) OR
          (t.target_year < ?)
        )
      GROUP BY t.id, t.target_value, t.target_year, t.target_month
      ORDER BY t.target_year DESC, t.target_month DESC
      LIMIT 12
    `;
    
    // Get team performance data
    const teamPerformanceSql = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        tm.role as team_role,
        t.target_value as target,
        COALESCE(COUNT(DISTINCT c.id), 0) as achieved,
        CASE 
          WHEN t.target_value > 0 THEN CAST(ROUND((COALESCE(COUNT(DISTINCT c.id), 0) / t.target_value) * 100, 2) AS DECIMAL(5,2))
          ELSE 0 
        END as progress_percentage,
        ROW_NUMBER() OVER (ORDER BY 
          CASE 
            WHEN t.target_value > 0 THEN (COALESCE(COUNT(DISTINCT c.id), 0) / t.target_value) * 100
            ELSE 0 
          END DESC
        ) as team_rank
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN teams t_team ON tm.team_id = t_team.id
      LEFT JOIN targets t ON t.user_id = u.id 
        AND t.target_year = ? 
        AND t.target_month = ?
      LEFT JOIN customers c ON c.assigned_to = u.id 
        AND YEAR(c.converted_at) = ? 
        AND MONTH(c.converted_at) = ?
      WHERE tm.team_id = (
        SELECT tm2.team_id 
        FROM team_members tm2 
        WHERE tm2.user_id = ?
      )
      GROUP BY u.id, u.name, u.email, tm.role, t.target_value
      ORDER BY progress_percentage DESC, u.name
    `;
    
    // Get commission data for front seller's converted customers
    const commissionData = await getCommissionDataForFrontSeller(userId);
    
    // Execute all queries in parallel
    const [totalCustomers, previousMonthCustomers, currentMonthCustomers, currentTarget, previousTarget, pastMonths, teamPerformance] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query(totalCustomersSql, [userId], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(previousMonthCustomersSql, [userId, previousYear, previousMonth], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(currentMonthCustomersSql, [userId, currentYear, currentMonth], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(currentTargetSql, [userId, currentYear, currentMonth], (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || { target_value: 0, actual_conversions: 0, progress_percentage: 0 });
        });
      }),
      new Promise((resolve, reject) => {
        db.query(previousTargetSql, [userId, previousYear, previousMonth], (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || { target_value: 0, actual_conversions: 0, progress_percentage: 0 });
        });
      }),
      new Promise((resolve, reject) => {
        db.query(pastMonthsSql, [userId, currentYear, currentMonth, currentYear], (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(teamPerformanceSql, [currentYear, currentMonth, currentYear, currentMonth, userId], (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        });
      })
    ]);
    
    // Calculate target remaining
    const targetRemaining = Math.max(0, (currentTarget.target_value || 0) - (currentTarget.actual_conversions || 0));
    
    // Calculate month-over-month performance change
    const currentPerformance = currentTarget.progress_percentage || 0;
    const previousPerformance = previousTarget.progress_percentage || 0;
    const performanceChange = currentPerformance - previousPerformance;
    
    const stats = {
      totalCustomers: totalCustomers.total_customers || 0,
      previousMonthCustomers: previousMonthCustomers.previous_month_customers || 0,
      currentMonthCustomers: currentMonthCustomers.current_month_customers || 0,
      commissionData: commissionData,
      currentTarget: {
        target: currentTarget.target_value || 0,
        achieved: currentTarget.actual_conversions || 0,
        remaining: targetRemaining,
        progressPercentage: currentPerformance
      },
      previousMonthTarget: {
        target: previousTarget.target_value || 0,
        achieved: previousTarget.actual_conversions || 0,
        progressPercentage: previousPerformance
      },
      performanceChange: performanceChange,
      currentPeriod: {
        year: currentYear,
        month: currentMonth,
        monthName: currentDate.toLocaleString('default', { month: 'long' })
      },
      previousPeriod: {
        year: previousYear,
        month: previousMonth,
        monthName: new Date(previousYear, previousMonth - 1).toLocaleString('default', { month: 'long' })
      },
      pastMonths: pastMonths.map(month => ({
        year: month.year,
        month: month.month,
        monthName: month.month_name,
        target: month.target,
        achieved: month.achieved,
        progressPercentage: month.progress_percentage
      })),
      teamPerformance: teamPerformance.map(member => ({
        userId: member.user_id,
        userName: member.user_name,
        email: member.email,
        teamRole: member.team_role,
        target: member.target || 0,
        achieved: member.achieved || 0,
        progressPercentage: member.progress_percentage || 0,
        teamRank: member.team_rank || 0
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching front seller dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch front seller dashboard statistics' });
  }
});

// Get commission data for front seller's converted customers (wire transfer and Zelle payments)
async function getCommissionDataForFrontSeller(userId) {
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
      WHERE c.assigned_to = ? 
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
      WHERE c.assigned_to = ? 
        AND pt.payment_source IN ('wire', 'zelle')
      GROUP BY pt.payment_source
    `;
    
    db.query(sql, [userId, currentYear, currentMonth, userId], (err, results) => {
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

// FRONT SALES MANAGER DASHBOARD ENDPOINTS

// Get front sales manager dashboard data (similar to upsell manager dashboard)
router.get('/front-sales-manager/dashboard', auth, checkFrontSalesManagerRole, async (req, res) => {
  try {
    const { period = 'this_month', year, month, date_from, date_to } = req.query;
    
    // Determine date range based on period
    let startDate, endDate, periodLabel;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    switch (period) {
      case 'this_year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        periodLabel = `${currentYear}`;
        break;
      case 'this_month':
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth - 1, new Date(currentYear, currentMonth, 0).getDate(), 23, 59, 59, 999);
        periodLabel = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`;
        break;
      case 'all_time':
        startDate = new Date('2020-01-01');
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
      case 'date_range':
        if (!date_from || !date_to) {
          return res.status(400).json({ 
            success: false, 
            message: 'date_from and date_to are required for date range period' 
          });
        }
        startDate = new Date(date_from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = `${date_from} to ${date_to}`;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid period. Use: this_year, this_month, all_time, custom, or date_range' 
        });
    }
    
    // Get all front sellers (role_id = 3)
    const frontSellersSql = `
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      WHERE u.role_id = 3
      ORDER BY u.name
    `;
    
    const frontSellersResults = await new Promise((resolve, reject) => {
      db.query(frontSellersSql, (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    
    // Get comprehensive analytics for each front seller
    const analyticsPromises = frontSellersResults.map(async (frontSeller) => {
      const sellerId = frontSeller.id;
      
      // Get total converted customers count
      const totalCustomersSql = `
        SELECT COUNT(*) as total_customers
        FROM customers c
        WHERE c.assigned_to = ?
      `;
      
      // Get customers converted in period
      const periodCustomersSql = `
        SELECT COUNT(*) as period_customers
        FROM customers c
        WHERE c.assigned_to = ?
          AND c.converted_at >= ?
          AND c.converted_at <= ?
      `;
      
      // Get total leads assigned to this seller
      const totalLeadsSql = `
        SELECT COUNT(*) as total_leads
        FROM leads l
        WHERE l.assigned_to = ?
      `;
      
      // Get leads converted to customers in period
      const leadsConvertedSql = `
        SELECT COUNT(*) as leads_converted
        FROM customers c
        WHERE c.assigned_to = ?
          AND c.converted_at >= ?
          AND c.converted_at <= ?
      `;
      
      // Get commission data (wire transfer and Zelle payments)
      const commissionSql = `
        SELECT 
          pt.payment_source,
          COALESCE(SUM(pt.amount), 0) as total_amount,
          COUNT(pt.id) as payment_count
        FROM payment_transactions pt
        JOIN sales s ON pt.sale_id = s.id
        JOIN customers c ON s.customer_id = c.id
        WHERE c.assigned_to = ? 
          AND pt.payment_source IN ('wire', 'zelle')
          AND pt.created_at >= ?
          AND pt.created_at <= ?
        GROUP BY pt.payment_source
      `;
      
      // Get total commission data (all time)
      const totalCommissionSql = `
        SELECT 
          pt.payment_source,
          COALESCE(SUM(pt.amount), 0) as total_amount,
          COUNT(pt.id) as payment_count
        FROM payment_transactions pt
        JOIN sales s ON pt.sale_id = s.id
        JOIN customers c ON s.customer_id = c.id
        WHERE c.assigned_to = ? 
          AND pt.payment_source IN ('wire', 'zelle')
        GROUP BY pt.payment_source
      `;
      
      // Get target data based on period
      let targetSql, targetParams;
      
      if (period === 'this_month') {
        targetSql = `
          SELECT 
            COALESCE(t.target_value, 0) as total_target,
            COALESCE(COUNT(DISTINCT c.id), 0) as achieved
          FROM targets t
          LEFT JOIN customers c ON c.assigned_to = t.user_id 
            AND YEAR(c.converted_at) = t.target_year 
            AND MONTH(c.converted_at) = t.target_month
          WHERE t.user_id = ? 
            AND t.target_year = ? 
            AND t.target_month = ?
          GROUP BY t.id, t.target_value
        `;
        targetParams = [sellerId, currentYear, currentMonth];
      } else if (period === 'this_year') {
        targetSql = `
          SELECT 
            COALESCE(SUM(t.target_value), 0) as total_target,
            COALESCE(COUNT(DISTINCT c.id), 0) as achieved
          FROM targets t
          LEFT JOIN customers c ON c.assigned_to = t.user_id 
            AND YEAR(c.converted_at) = t.target_year 
            AND MONTH(c.converted_at) = t.target_month
          WHERE t.user_id = ? 
            AND t.target_year = ?
        `;
        targetParams = [sellerId, currentYear];
      } else if (period === 'custom') {
        targetSql = `
          SELECT 
            COALESCE(t.target_value, 0) as total_target,
            COALESCE(COUNT(DISTINCT c.id), 0) as achieved
          FROM targets t
          LEFT JOIN customers c ON c.assigned_to = t.user_id 
            AND YEAR(c.converted_at) = t.target_year 
            AND MONTH(c.converted_at) = t.target_month
          WHERE t.user_id = ? 
            AND t.target_year = ? 
            AND t.target_month = ?
          GROUP BY t.id, t.target_value
        `;
        targetParams = [sellerId, parseInt(year), parseInt(month)];
      } else if (period === 'date_range') {
        // For date range, sum targets for months within the range and count achieved customers in the range
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        targetSql = `
          SELECT 
            COALESCE(SUM(t.target_value), 0) as total_target,
            COALESCE(COUNT(DISTINCT c.id), 0) as achieved
          FROM targets t
          LEFT JOIN customers c ON c.assigned_to = t.user_id 
            AND c.converted_at >= ?
            AND c.converted_at <= ?
            AND YEAR(c.converted_at) = t.target_year 
            AND MONTH(c.converted_at) = t.target_month
          WHERE t.user_id = ?
            AND CONCAT(t.target_year, '-', LPAD(t.target_month, 2, '0'), '-01') >= ?
            AND CONCAT(t.target_year, '-', LPAD(t.target_month, 2, '0'), '-01') <= LAST_DAY(?)
        `;
        targetParams = [startDate, endDate, sellerId, startDateStr, endDateStr];
      } else { // all_time
        targetSql = `
          SELECT 
            COALESCE(SUM(t.target_value), 0) as total_target,
            COALESCE(COUNT(DISTINCT c.id), 0) as achieved
          FROM targets t
          LEFT JOIN customers c ON c.assigned_to = t.user_id 
            AND YEAR(c.converted_at) = t.target_year 
            AND MONTH(c.converted_at) = t.target_month
          WHERE t.user_id = ?
        `;
        targetParams = [sellerId];
      }
      
      const [totalCustomers, periodCustomers, totalLeads, leadsConverted, commission, totalCommission, targets] = await Promise.all([
        new Promise((resolve, reject) => {
          db.query(totalCustomersSql, [sellerId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.total_customers || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(periodCustomersSql, [sellerId, startDate, endDate], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.period_customers || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(totalLeadsSql, [sellerId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.total_leads || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(leadsConvertedSql, [sellerId, startDate, endDate], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.leads_converted || 0);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(commissionSql, [sellerId, startDate, endDate], (err, results) => {
            if (err) reject(err);
            else resolve(results || []);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(totalCommissionSql, [sellerId], (err, results) => {
            if (err) reject(err);
            else resolve(results || []);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(targetSql, targetParams, (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || { total_target: 0, achieved: 0 });
          });
        })
      ]);
      
      // Process commission data
      let wireTransfer = 0, zelle = 0, wireCount = 0, zelleCount = 0;
      let totalWireTransfer = 0, totalZelle = 0, totalWireCount = 0, totalZelleCount = 0;
      
      commission.forEach(row => {
        if (row.payment_source === 'wire') {
          wireTransfer = parseFloat(row.total_amount);
          wireCount = parseInt(row.payment_count);
        } else if (row.payment_source === 'zelle') {
          zelle = parseFloat(row.total_amount);
          zelleCount = parseInt(row.payment_count);
        }
      });
      
      totalCommission.forEach(row => {
        if (row.payment_source === 'wire') {
          totalWireTransfer = parseFloat(row.total_amount);
          totalWireCount = parseInt(row.payment_count);
        } else if (row.payment_source === 'zelle') {
          totalZelle = parseFloat(row.total_amount);
          totalZelleCount = parseInt(row.payment_count);
        }
      });
      
      const targetValue = parseFloat(targets.total_target) || 0;
      const achievedValue = parseInt(targets.achieved) || 0;
      
      return {
        sellerId: frontSeller.id,
        sellerName: frontSeller.name,
        sellerEmail: frontSeller.email,
        sellerCreatedAt: frontSeller.created_at,
        metrics: {
          totalCustomers: parseInt(totalCustomers),
          periodCustomers: parseInt(periodCustomers),
          totalLeads: parseInt(totalLeads),
          leadsConverted: parseInt(leadsConverted),
          conversionRate: totalLeads > 0 ? Math.round((periodCustomers / totalLeads) * 100) : 0,
          periodCommission: {
            wireTransfer: wireTransfer,
            wireCount: wireCount,
            zelle: zelle,
            zelleCount: zelleCount,
            total: wireTransfer + zelle,
            totalCount: wireCount + zelleCount
          },
          allTimeCommission: {
            wireTransfer: totalWireTransfer,
            wireCount: totalWireCount,
            zelle: totalZelle,
            zelleCount: totalZelleCount,
            total: totalWireTransfer + totalZelle,
            totalCount: totalWireCount + totalZelleCount
          },
          target: targetValue,
          achieved: achievedValue,
          progressPercentage: targetValue > 0 ? 
            Math.round((achievedValue / targetValue) * 100) : 0
        }
      };
    });
    
    const frontSellerAnalytics = await Promise.all(analyticsPromises);
    
    // Calculate team totals
    const teamTotals = frontSellerAnalytics.reduce((totals, seller) => {
      totals.totalCustomers += seller.metrics.totalCustomers;
      totals.periodCustomers += seller.metrics.periodCustomers;
      totals.totalLeads += seller.metrics.totalLeads;
      totals.leadsConverted += seller.metrics.leadsConverted;
      totals.periodCommission += seller.metrics.periodCommission.total;
      totals.allTimeCommission += seller.metrics.allTimeCommission.total;
      totals.target += seller.metrics.target;
      totals.achieved += seller.metrics.achieved;
      return totals;
    }, {
      totalCustomers: 0,
      periodCustomers: 0,
      totalLeads: 0,
      leadsConverted: 0,
      periodCommission: 0,
      allTimeCommission: 0,
      target: 0,
      achieved: 0,
      progressPercentage: 0,
      conversionRate: 0
    });
    
    teamTotals.progressPercentage = teamTotals.target > 0 ? 
      Math.round((teamTotals.achieved / teamTotals.target) * 100) : 0;
    teamTotals.conversionRate = teamTotals.totalLeads > 0 ? 
      Math.round((teamTotals.periodCustomers / teamTotals.totalLeads) * 100) : 0;
    
    // Sort front sellers by performance (achieved)
    const sortedFrontSellers = frontSellerAnalytics.sort((a, b) => 
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
        frontSellers: sortedFrontSellers,
        summary: {
          totalFrontSellers: frontSellerAnalytics.length,
          topPerformer: sortedFrontSellers[0] || null,
          averagePerformance: frontSellerAnalytics.length > 0 ? 
            Math.round(frontSellerAnalytics.reduce((sum, s) => sum + s.metrics.progressPercentage, 0) / frontSellerAnalytics.length) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching front sales manager dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data' 
    });
  }
});

module.exports = router;
