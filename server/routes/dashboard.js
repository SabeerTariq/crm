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
    
    // Execute all queries in parallel
    const [totalCustomers, previousMonthCustomers, currentMonthCustomers, currentTarget, previousTarget] = await Promise.all([
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
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching front seller dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch front seller dashboard statistics' });
  }
});

module.exports = router;
