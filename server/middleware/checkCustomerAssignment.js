const CustomerAssignmentService = require('../services/customerAssignmentService');

/**
 * Middleware to check if upseller has access to customer
 * Only applies to users with upseller role (role_id = 5)
 */
const checkCustomerAssignment = async (req, res, next) => {
  try {
    // Only check for upsellers
    if (req.user.role_id !== 5) {
      return next();
    }
    
    // Get customer ID from various possible sources
    let customerId = null;
    
    // From URL params
    if (req.params.customerId) {
      customerId = req.params.customerId;
    }
    // From request body
    else if (req.body.customer_id) {
      customerId = req.body.customer_id;
    }
    // From query params
    else if (req.query.customer_id) {
      customerId = req.query.customer_id;
    }
    // For sales, get customer_id from sale
    else if (req.params.saleId || req.body.sale_id) {
      const saleId = req.params.saleId || req.body.sale_id;
      const db = require('../db');
      
      const saleSql = 'SELECT customer_id FROM sales WHERE id = ?';
      const saleResult = await new Promise((resolve, reject) => {
        db.query(saleSql, [saleId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      if (saleResult.length === 0) {
        return res.status(404).json({ message: 'Sale not found' });
      }
      
      customerId = saleResult[0].customer_id;
    }
    
    // If no customer ID found, allow access (let other middleware handle validation)
    if (!customerId) {
      return next();
    }
    
    // Check if customer is assigned to this upseller
    const isAssigned = await CustomerAssignmentService.isCustomerAssigned(customerId, req.user.id);
    
    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'Access denied. Customer not assigned to you.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking customer assignment:', error);
    res.status(500).json({ message: 'Error checking customer assignment' });
  }
};

module.exports = checkCustomerAssignment;
