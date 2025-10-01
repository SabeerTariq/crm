const db = require('../db');
const PaymentService = require('./paymentService');

class CustomerSalesService {
  
  /**
   * Get complete customer sales profile
   * @param {number} customerId - Customer ID
   */
  static async getCustomerSalesProfile(customerId) {
    return new Promise((resolve, reject) => {
      // Get customer basic info
      const customerSql = 'SELECT * FROM customers WHERE id = ?';
      db.query(customerSql, [customerId], (err, customerResults) => {
        if (err) return reject(err);
        if (customerResults.length === 0) {
          return reject(new Error('Customer not found'));
        }
        
        const customer = customerResults[0];
        
        // Get all sales for this customer
        const salesSql = `
          SELECT s.*, 
                 u.name as created_by_name
          FROM sales s
          LEFT JOIN users u ON s.created_by = u.id
          WHERE s.customer_id = ?
          ORDER BY s.created_at DESC
        `;
        
        db.query(salesSql, [customerId], async (err, salesResults) => {
          if (err) return reject(err);
          
          try {
            // Get upcoming payments
            const upcomingPayments = await this.getUpcomingPaymentsForCustomer(customerId);
            
            // Get payment history
            const paymentHistory = await this.getPaymentHistoryForCustomer(customerId);
            
            // Get remaining payments (sales with remaining balance)
            const remainingPayments = await this.getRemainingPaymentsForCustomer(customerId);
            
            // Get all installments for this customer
            const installments = await this.getAllInstallmentsForCustomer(customerId);
            
            // Get all recurring payments for this customer
            const recurringPayments = await this.getAllRecurringPaymentsForCustomer(customerId);
            
            // Calculate totals
            const totals = this.calculateCustomerTotals(salesResults);
            
            resolve({
              customer: {
                ...customer,
                ...totals
              },
              sales: salesResults,
              upcoming_payments: upcomingPayments,
              payment_history: paymentHistory,
              remaining_payments: remainingPayments,
              installments: installments,
              recurring_payments: recurringPayments
            });
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }
  
  /**
   * Get upcoming payments for a specific customer
   * @param {number} customerId - Customer ID
   * @param {number} days - Number of days ahead to check (default 30)
   */
  static async getUpcomingPaymentsForCustomer(customerId, days = 30) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'installment' as payment_type_category
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE s.customer_id = ? 
        AND pi.status = 'pending' 
        AND pi.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          pr.id as installment_id,
          pr.sale_id,
          pr.payments_made as installment_number,
          pr.amount,
          pr.next_payment_date as due_date,
          0 as paid_amount,
          pr.status,
          pr.last_payment_date as paid_at,
          pr.notes,
          pr.created_at,
          pr.updated_at,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'recurring' as payment_type_category
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE s.customer_id = ? 
        AND pr.status = 'active' 
        AND pr.next_payment_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        
        ORDER BY due_date ASC
      `;
      
      db.query(sql, [customerId, days, customerId, days], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get payment history for a specific customer
   * @param {number} customerId - Customer ID
   */
  static async getPaymentHistoryForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pt.*,
          s.customer_name,
          s.customer_email,
          s.services,
          u.name as processed_by_name,
          pi.installment_number,
          pr.frequency as recurring_frequency
        FROM payment_transactions pt
        JOIN sales s ON pt.sale_id = s.id
        LEFT JOIN users u ON pt.created_by = u.id
        LEFT JOIN payment_installments pi ON pt.installment_id = pi.id
        LEFT JOIN payment_recurring pr ON pt.recurring_id = pr.id
        WHERE s.customer_id = ?
        ORDER BY pt.created_at DESC
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get remaining payments for a specific customer (sales with remaining balance)
   * @param {number} customerId - Customer ID
   */
  static async getRemainingPaymentsForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          s.*,
          u.name as created_by_name
        FROM sales s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.customer_id = ? 
        AND s.remaining > 0
        ORDER BY s.created_at DESC
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get all installments for a specific customer
   * @param {number} customerId - Customer ID
   */
  static async getAllInstallmentsForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          s.unit_price as sale_amount,
          s.cash_in as sale_paid,
          s.remaining as sale_remaining
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE s.customer_id = ?
        ORDER BY pi.due_date ASC, pi.installment_number ASC
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get all recurring payments for a specific customer
   * @param {number} customerId - Customer ID
   */
  static async getAllRecurringPaymentsForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pr.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          s.unit_price as sale_amount,
          s.cash_in as sale_paid,
          s.remaining as sale_remaining
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE s.customer_id = ?
        ORDER BY pr.next_payment_date ASC
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Calculate customer totals from sales
   * @param {Array} sales - Array of sales
   */
  static calculateCustomerTotals(sales) {
    const totals = {
      total_sales: 0,
      total_paid: 0,
      total_remaining: 0,
      last_payment_date: null
    };
    
    sales.forEach(sale => {
      totals.total_sales += parseFloat(sale.unit_price || 0);
      totals.total_paid += parseFloat(sale.cash_in || 0);
      totals.total_remaining += parseFloat(sale.remaining || 0);
      
      if (sale.last_payment_date && (!totals.last_payment_date || new Date(sale.last_payment_date) > new Date(totals.last_payment_date))) {
        totals.last_payment_date = sale.last_payment_date;
      }
    });
    
    return totals;
  }
  
  /**
   * Update customer totals after payment
   * @param {number} customerId - Customer ID
   */
  static async updateCustomerTotals(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          SUM(unit_price) as total_sales,
          SUM(cash_in) as total_paid,
          SUM(remaining) as total_remaining,
          MAX(last_payment_date) as last_payment_date
        FROM sales 
        WHERE customer_id = ?
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        
        const totals = results[0];
        const updateSql = `
          UPDATE customers 
          SET total_sales = ?, total_paid = ?, total_remaining = ?, last_payment_date = ?
          WHERE id = ?
        `;
        
        db.query(updateSql, [
          totals.total_sales || 0,
          totals.total_paid || 0,
          totals.total_remaining || 0,
          totals.last_payment_date,
          customerId
        ], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    });
  }
  
  /**
   * Process payment for a sale
   * @param {number} saleId - Sale ID
   * @param {number} amount - Payment amount
   * @param {string} paymentSource - Payment source
   * @param {number} createdBy - User ID
   * @param {string} notes - Payment notes
   * @param {number} receivedBy - User ID who received the payment (optional)
   */
  static async processPayment(saleId, amount, paymentSource, createdBy, notes = null, receivedBy = null) {
    return new Promise((resolve, reject) => {
      // Start transaction
      db.beginTransaction((err) => {
        if (err) return reject(err);
        
        // Get sale details
        const getSaleSql = 'SELECT * FROM sales WHERE id = ?';
        db.query(getSaleSql, [saleId], (err, saleResults) => {
          if (err) return db.rollback(() => reject(err));
          
          if (saleResults.length === 0) {
            return db.rollback(() => reject(new Error('Sale not found')));
          }
          
          const sale = saleResults[0];
          const newCashIn = parseFloat(sale.cash_in) + parseFloat(amount);
          const newRemaining = parseFloat(sale.unit_price) - newCashIn;
          const isFullyPaid = newRemaining <= 0;
          
          // Update sale
          const updateSaleSql = `
            UPDATE sales 
            SET cash_in = ?, remaining = ?, last_payment_date = ?, payment_status = ?
            WHERE id = ?
          `;
          
          const paymentStatus = isFullyPaid ? 'completed' : (newCashIn > 0 ? 'partial' : 'pending');
          
          db.query(updateSaleSql, [
            newCashIn, 
            newRemaining, 
            new Date().toISOString().split('T')[0], 
            paymentStatus, 
            saleId
          ], (err) => {
            if (err) return db.rollback(() => reject(err));
            
            // Record transaction
            PaymentService.recordPayment({
              saleId: saleId,
              amount: amount,
              paymentSource: paymentSource,
              notes: notes,
              createdBy: createdBy,
              receivedBy: receivedBy
            }).then(() => {
              // Update customer totals
              CustomerSalesService.updateCustomerTotals(sale.customer_id).then(() => {
                // Update upseller performance - get upseller for customer if receivedBy not provided
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth() + 1;
                
                if (receivedBy) {
                  return PaymentService.recalculateUpsellerPerformance(receivedBy, currentYear, currentMonth);
                } else {
                  // Get upseller for this customer and update performance
                  return PaymentService.getUpsellerForCustomer(sale.customer_id)
                    .then(upsellerId => {
                      if (upsellerId) {
                        return PaymentService.recalculateUpsellerPerformance(upsellerId, currentYear, currentMonth);
                      }
                      return Promise.resolve({ success: true, message: 'No upseller found for customer' });
                    });
                }
              }).then(() => {
                db.commit((err) => {
                  if (err) return db.rollback(() => reject(err));
                  resolve({ 
                    success: true, 
                    fullyPaid: isFullyPaid,
                    newRemaining: newRemaining
                  });
                });
              }).catch(err => db.rollback(() => reject(err)));
            }).catch(err => db.rollback(() => reject(err)));
          });
        });
      });
    });
  }
  
  /**
   * Get all upcoming payments across all customers
   * @param {number} days - Number of days ahead to check
   */
  static async getAllUpcomingPayments(days = 7) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'installment' as payment_type_category
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE pi.status = 'pending' 
        AND pi.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          pr.id as installment_id,
          pr.sale_id,
          pr.payments_made as installment_number,
          pr.amount,
          pr.next_payment_date as due_date,
          0 as paid_amount,
          pr.status,
          pr.last_payment_date as paid_at,
          pr.notes,
          pr.created_at,
          pr.updated_at,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'recurring' as payment_type_category
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE pr.status = 'active' 
        AND pr.next_payment_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        
        ORDER BY due_date ASC
      `;
      
      db.query(sql, [days, days], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get overdue payments
   */
  static async getOverduePayments() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'installment' as payment_type_category
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE pi.status = 'pending' 
        AND pi.due_date < CURDATE()
        
        UNION ALL
        
        SELECT 
          pr.id as installment_id,
          pr.sale_id,
          pr.payments_made as installment_number,
          pr.amount,
          pr.next_payment_date as due_date,
          0 as paid_amount,
          pr.status,
          pr.last_payment_date as paid_at,
          pr.notes,
          pr.created_at,
          pr.updated_at,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type,
          'recurring' as payment_type_category
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE pr.status = 'active' 
        AND pr.next_payment_date < CURDATE()
        
        ORDER BY due_date ASC
      `;
      
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = CustomerSalesService;
