
const db = require('../db');

class PaymentService {
  
  /**
   * Create installment payments for a sale
   * @param {number} saleId - The sale ID
   * @param {number} totalAmount - Total amount to be split
   * @param {number} numberOfInstallments - Number of installments
   * @param {string} frequency - 'weekly', 'monthly', 'quarterly'
   * @param {Date} startDate - When installments should start
   */
  static async createInstallments(saleId, totalAmount, numberOfInstallments, frequency, startDate) {
    return new Promise((resolve, reject) => {
      const installmentAmount = totalAmount / numberOfInstallments;
      const installments = [];
      
      for (let i = 0; i < numberOfInstallments; i++) {
        const dueDate = new Date(startDate);
        
        // Calculate due date based on frequency
        switch (frequency) {
          case 'weekly':
            dueDate.setDate(dueDate.getDate() + (i * 7));
            break;
          case 'monthly':
            dueDate.setMonth(dueDate.getMonth() + i);
            break;
          case 'quarterly':
            dueDate.setMonth(dueDate.getMonth() + (i * 3));
            break;
          default:
            dueDate.setMonth(dueDate.getMonth() + i);
        }
        
        installments.push([
          saleId,
          i + 1,
          installmentAmount,
          dueDate.toISOString().split('T')[0],
          0.00,
          'pending',
          null,
          null
        ]);
      }
      
      const sql = `
        INSERT INTO payment_installments 
        (sale_id, installment_number, amount, due_date, paid_amount, status, paid_at, notes)
        VALUES ?
      `;
      
      db.query(sql, [installments], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Create recurring payment for a sale
   * @param {number} saleId - The sale ID
   * @param {number} customerId - The customer ID
   * @param {number} amount - Amount per payment
   * @param {string} frequency - 'weekly', 'monthly', 'quarterly', 'yearly'
   * @param {Date} startDate - When recurring payments should start
   * @param {number} totalPayments - Total number of payments (null for indefinite)
   */
  static async createRecurringPayment(saleId, customerId, amount, frequency, startDate, totalPayments = null) {
    return new Promise((resolve, reject) => {
      const nextPaymentDate = new Date(startDate);
      
      const sql = `
        INSERT INTO payment_recurring 
        (sale_id, customer_id, amount, frequency, next_payment_date, total_payments, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `;
      
      db.query(sql, [saleId, customerId, amount, frequency, nextPaymentDate.toISOString().split('T')[0], totalPayments], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Record a payment transaction
   * @param {Object} transactionData - Transaction details
   * @param {Object} connection - Optional database connection to use within transaction
   */
  static async recordPayment(transactionData, connection = null) {
    return new Promise((resolve, reject) => {
      const {
        saleId,
        installmentId = null,
        recurringId = null,
        amount,
        paymentSource,
        transactionReference = null,
        notes = null,
        createdBy,
        receivedBy = null
      } = transactionData;
      
      // Validate transaction data
      if (!saleId || !amount || amount <= 0) {
        console.error('Invalid payment transaction data:', transactionData);
        return reject(new Error('Invalid payment transaction data: saleId and amount are required, amount must be > 0'));
      }
      
      console.log(`Recording payment transaction for sale ${saleId}, amount ${amount}, paymentSource ${paymentSource}`);
      
      const sql = `
        INSERT INTO payment_transactions 
        (sale_id, installment_id, recurring_id, amount, payment_source, 
         transaction_reference, notes, created_by, received_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      if (connection) {
        connection.query(sql, [
          saleId, installmentId, recurringId, amount, paymentSource,
          transactionReference, notes, createdBy, receivedBy
        ], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      } else {
        db.query(sql, [
          saleId, installmentId, recurringId, amount, paymentSource,
          transactionReference, notes, createdBy, receivedBy
        ], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }
    });
  }
  
  /**
   * Process installment payment
   * @param {number} installmentId - Installment ID
   * @param {number} amount - Amount being paid
   * @param {string} paymentSource - Payment source
   * @param {number} createdBy - User ID who processed the payment
   * @param {number} receivedBy - User ID who received the payment (optional)
   */
  static async processInstallmentPayment(installmentId, amount, paymentSource, createdBy, receivedBy = null) {
    return new Promise((resolve, reject) => {
      // Get a connection from the pool
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        
        // Start transaction
        connection.beginTransaction((err) => {
          if (err) {
            connection.release();
            return reject(err);
          }
        
        // Get installment details
        const getInstallmentSql = 'SELECT * FROM payment_installments WHERE id = ?';
        connection.query(getInstallmentSql, [installmentId], (err, installmentResults) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              reject(err);
            });
            return;
          }
          
          if (installmentResults.length === 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Installment not found'));
            });
            return;
          }
          
          const installment = installmentResults[0];
          const installmentAmount = parseFloat(installment.amount);
          const currentPaidAmount = parseFloat(installment.paid_amount);
          const paymentAmount = parseFloat(amount);
          const newPaidAmount = currentPaidAmount + paymentAmount;
          
          // Validate payment amount
          if (paymentAmount <= 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Payment amount must be greater than 0'));
            });
            return;
          }
          
          // Check if installment is already fully paid
          if (installment.status === 'paid') {
            connection.rollback(() => {
              connection.release();
              reject(new Error('This installment is already fully paid'));
            });
            return;
          }
          
          // Check for overpayment
          if (newPaidAmount > installmentAmount) {
            connection.rollback(() => {
              connection.release();
              reject(new Error(`Payment amount exceeds remaining balance. Remaining: $${(installmentAmount - currentPaidAmount).toFixed(2)}`));
            });
            return;
          }
          
          // For installments, ensure the payment amount exactly matches the remaining balance
          const remainingBalance = installmentAmount - currentPaidAmount;
          if (Math.abs(paymentAmount - remainingBalance) > 0.01) { // Allow for small floating point differences
            connection.rollback(() => {
              connection.release();
              reject(new Error(`For installment payments, you must pay the exact remaining balance of $${remainingBalance.toFixed(2)}`));
            });
            return;
          }
          
          const isFullyPaid = newPaidAmount >= installmentAmount;
          
          // Update installment
          const updateInstallmentSql = `
            UPDATE payment_installments 
            SET paid_amount = ?, status = ?, paid_at = ?
            WHERE id = ?
          `;
          
          const newStatus = isFullyPaid ? 'paid' : 'pending';
          const paidAt = isFullyPaid ? new Date() : null;
          
          connection.query(updateInstallmentSql, [newPaidAmount, newStatus, paidAt, installmentId], (err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }
            
            // Record transaction
            PaymentService.recordPayment({
              saleId: installment.sale_id,
              installmentId: installmentId,
              amount: amount,
              paymentSource: paymentSource,
              createdBy: createdBy,
              receivedBy: receivedBy
            }, connection).then(() => {
              // Update sale remaining amount
              const updateSaleSql = `
                UPDATE sales 
                SET cash_in = cash_in + ?, remaining = remaining - ?
                WHERE id = ?
              `;
              
              connection.query(updateSaleSql, [amount, amount, installment.sale_id], (err) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                  return;
                }
                
                // Get customer ID from sale to find upseller
                const getSaleSql = 'SELECT customer_id FROM sales WHERE id = ?';
                connection.query(getSaleSql, [installment.sale_id], (err, saleResults) => {
                  if (err) {
                    connection.rollback(() => {
                      connection.release();
                      reject(err);
                    });
                    return;
                  }
                  
                  if (saleResults.length > 0) {
                    const customerId = saleResults[0].customer_id;
                    
                    // Update customer totals first
                    const CustomerSalesService = require('./customerSalesService');
                    CustomerSalesService.updateCustomerTotals(customerId, connection)
                      .then(() => {
                        // Get upseller for this customer and update performance
                        return PaymentService.getUpsellerForCustomer(customerId);
                      })
                      .then(upsellerId => {
                        if (upsellerId) {
                          const currentDate = new Date();
                          const currentYear = currentDate.getFullYear();
                          const currentMonth = currentDate.getMonth() + 1;
                          return PaymentService.recalculateUpsellerPerformance(upsellerId, currentYear, currentMonth);
                        }
                        return Promise.resolve({ success: true, message: 'No upseller found' });
                      })
                      .then(() => {
                        connection.commit((err) => {
                          connection.release(); // Always release the connection
                          if (err) {
                            reject(err);
                          } else {
                            resolve({ success: true, fullyPaid: isFullyPaid });
                          }
                        });
                      })
                      .catch(err => {
                        connection.rollback(() => {
                          connection.release();
                          reject(err);
                        });
                      });
                  } else {
                    connection.commit((err) => {
                      connection.release(); // Always release the connection
                      if (err) {
                        reject(err);
                      } else {
                        resolve({ success: true, fullyPaid: isFullyPaid });
                      }
                    });
                  }
                });
              });
            }).catch(err => {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
            });
          });
        });
      });
    });
    });
  }
  
  /**
   * Process recurring payment
   * @param {number} recurringId - Recurring payment ID
   * @param {number} amount - Amount being paid
   * @param {string} paymentSource - Payment source
   * @param {number} createdBy - User ID who processed the payment
   * @param {number} receivedBy - User ID who received the payment (optional)
   */
  static async processRecurringPayment(recurringId, amount, paymentSource, createdBy, receivedBy = null) {
    return new Promise((resolve, reject) => {
      // Get a connection from the pool
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        
        // Start transaction
        connection.beginTransaction((err) => {
          if (err) {
            connection.release();
            return reject(err);
          }
        
        // Get recurring payment details
        const getRecurringSql = 'SELECT * FROM payment_recurring WHERE id = ?';
        connection.query(getRecurringSql, [recurringId], (err, recurringResults) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              reject(err);
            });
            return;
          }
          
          if (recurringResults.length === 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Recurring payment not found'));
            });
            return;
          }
          
          const recurring = recurringResults[0];
          const newPaymentsMade = recurring.payments_made + 1;
          const isCompleted = recurring.total_payments && newPaymentsMade >= recurring.total_payments;
          
          // Calculate next payment date
          const nextPaymentDate = new Date();
          switch (recurring.frequency) {
            case 'weekly':
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
              break;
            case 'monthly':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
              break;
            case 'yearly':
              nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
              break;
          }
          
          // Update recurring payment
          const updateRecurringSql = `
            UPDATE payment_recurring 
            SET payments_made = ?, last_payment_date = ?, next_payment_date = ?, status = ?
            WHERE id = ?
          `;
          
          const newStatus = isCompleted ? 'completed' : 'active';
          
          connection.query(updateRecurringSql, [
            newPaymentsMade, new Date().toISOString().split('T')[0], 
            nextPaymentDate.toISOString().split('T')[0], newStatus, recurringId
          ], (err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }
            
            // Record transaction
            PaymentService.recordPayment({
              saleId: recurring.sale_id,
              recurringId: recurringId,
              amount: amount,
              paymentSource: paymentSource,
              createdBy: createdBy,
              receivedBy: receivedBy
            }, connection).then(() => {
              // For recurring payments, update both unit_price (total sales) and cash_in (amount received)
              // remaining should stay at the original sale amount - recurring payments are additional revenue
              const updateSaleSql = `
                UPDATE sales 
                SET unit_price = unit_price + ?, cash_in = cash_in + ?, last_payment_date = ?, payment_status = ?
                WHERE id = ?
              `;
              
              // Get current sale details
              const getSaleSql = 'SELECT unit_price, cash_in, remaining FROM sales WHERE id = ?';
              connection.query(getSaleSql, [recurring.sale_id], (err, saleResults) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                  return;
                }
                
                const sale = saleResults[0];
                const newUnitPrice = parseFloat(sale.unit_price) + parseFloat(amount);
                const newCashIn = parseFloat(sale.cash_in) + parseFloat(amount);
                // For recurring payments, remaining stays at original amount (not the new total)
                // The remaining field represents the original sale amount, not total sales
                const paymentStatus = (newCashIn > 0 ? 'partial' : 'pending');
                
                connection.query(updateSaleSql, [amount, amount, new Date().toISOString().split('T')[0], paymentStatus, recurring.sale_id], (err) => {
                  if (err) {
                    connection.rollback(() => {
                      connection.release();
                      reject(err);
                    });
                    return;
                  }
                  
                  // Update customer totals using the standard function
                  const CustomerSalesService = require('./customerSalesService');
                  CustomerSalesService.updateCustomerTotals(recurring.customer_id)
                    .then(() => {
                      // Update upseller performance for recurring payments
                      return PaymentService.getUpsellerForCustomer(recurring.customer_id);
                    })
                    .then(upsellerId => {
                      if (upsellerId) {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth() + 1;
                        return PaymentService.recalculateUpsellerPerformance(upsellerId, currentYear, currentMonth);
                      }
                      return Promise.resolve({ success: true, message: 'No upseller found' });
                    })
                    .then(() => {
                      connection.commit((err) => {
                        connection.release(); // Always release the connection
                        if (err) {
                          reject(err);
                        } else {
                          resolve({ success: true, completed: isCompleted });
                        }
                      });
                    })
                    .catch(err => {
                      connection.rollback(() => {
                        connection.release();
                        reject(err);
                    });
                  });
                });
              });
            }).catch(err => {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
            });
          });
        });
      });
    });
    });
  }
  
  /**
   * Get payment details for a sale
   * @param {number} saleId - Sale ID
   */
  static async getSalePaymentDetails(saleId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          s.*,
          pi.id as installment_id,
          pi.installment_number,
          pi.amount as installment_amount,
          pi.due_date,
          pi.paid_amount as installment_paid,
          pi.status as installment_status,
          pr.id as recurring_id,
          pr.amount as recurring_amount,
          pr.frequency,
          pr.next_payment_date,
          pr.status as recurring_status,
          pr.payments_made,
          pr.total_payments
        FROM sales s
        LEFT JOIN payment_installments pi ON s.id = pi.sale_id
        LEFT JOIN payment_recurring pr ON s.id = pr.sale_id
        WHERE s.id = ?
        ORDER BY pi.installment_number, pr.id
      `;
      
      db.query(sql, [saleId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get upcoming payments (due soon)
   * @param {number} days - Number of days ahead to check
   */
  static async getUpcomingPayments(days = 7) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pi.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type
        FROM payment_installments pi
        JOIN sales s ON pi.sale_id = s.id
        WHERE pi.status = 'pending' 
        AND pi.due_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY pi.due_date ASC
      `;
      
      db.query(sql, [days], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get recurring payments due
   * @param {number} days - Number of days ahead to check
   */
  static async getUpcomingRecurringPayments(days = 7) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          pr.*,
          s.customer_name,
          s.customer_email,
          s.customer_phone,
          s.services,
          s.payment_type
        FROM payment_recurring pr
        JOIN sales s ON pr.sale_id = s.id
        WHERE pr.status = 'active' 
        AND pr.next_payment_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY pr.next_payment_date ASC
      `;
      
      db.query(sql, [days], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Update upseller performance with cash received
   * @param {number} upsellerId - The upseller user ID
   * @param {number} amount - Amount received
   * @param {number} saleId - Sale ID for context
   */
  static async updateUpsellerPerformance(upsellerId, amount, saleId) {
    return new Promise((resolve, reject) => {
      if (!upsellerId || !amount) {
        return resolve({ success: true, message: 'No upseller or amount to update' });
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      const currentYear = currentDate.getFullYear();

      // Check if upseller performance record exists for this month/year
      const checkSql = `
        SELECT id, metric_value FROM upseller_performance 
        WHERE user_id = ? AND metric_type = 'revenue_generated' 
        AND period_month = ? AND period_year = ?
      `;

      db.query(checkSql, [upsellerId, currentMonth, currentYear], (err, results) => {
        if (err) return reject(err);

        if (results.length > 0) {
          // Update existing record
          const existingValue = parseFloat(results[0].metric_value) || 0;
          const newValue = existingValue + parseFloat(amount);
          
          const updateSql = `
            UPDATE upseller_performance 
            SET metric_value = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          
          db.query(updateSql, [newValue, results[0].id], (err, result) => {
            if (err) return reject(err);
            resolve({ success: true, message: 'Upseller performance updated', newValue });
          });
        } else {
          // Create new record
          const insertSql = `
            INSERT INTO upseller_performance 
            (user_id, metric_type, metric_value, period_month, period_year)
            VALUES (?, 'revenue_generated', ?, ?, ?)
          `;
          
          db.query(insertSql, [upsellerId, amount, currentMonth, currentYear], (err, result) => {
            if (err) return reject(err);
            resolve({ success: true, message: 'New upseller performance record created', newValue: amount });
          });
        }
      });
    });
  }

  /**
   * Recalculate and update upseller performance for a specific month
   * This includes all cash in sources: sales created by upseller, payments received, installments, recurring
   * @param {number} upsellerId - The upseller user ID
   * @param {number} year - Year to calculate for
   * @param {number} month - Month to calculate for
   */
  static async recalculateUpsellerPerformance(upsellerId, year, month) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Recalculating upseller performance for upseller ${upsellerId}, year ${year}, month ${month}`);
        
        // Get assigned customers for the upseller
        const assignedCustomersSql = `
          SELECT DISTINCT customer_id 
          FROM customer_assignments 
          WHERE upseller_id = ? AND status = 'active'
        `;
        
        const assignedCustomers = await new Promise((resolve, reject) => {
          db.query(assignedCustomersSql, [upsellerId], (err, results) => {
            if (err) {
              console.error(`Error getting assigned customers for upseller ${upsellerId}:`, err);
              reject(err);
            } else {
              console.log(`Assigned customers for upseller ${upsellerId}:`, results);
              resolve(results.map(row => row.customer_id));
            }
          });
        });

        if (assignedCustomers.length === 0) {
          console.log(`No assigned customers found for upseller ${upsellerId}`);
          return resolve({ success: true, message: 'No assigned customers', totalCashIn: 0 });
        }
        
        console.log(`Found ${assignedCustomers.length} assigned customers for upseller ${upsellerId}:`, assignedCustomers);

        let totalCashIn = 0;

        // FIXED: Use payment_transactions as the single source of truth to avoid double-counting
        // This counts all payments received for assigned customers in the specified month/year
        const paymentsSql = `
          SELECT COALESCE(SUM(pt.amount), 0) as total_received_payments
          FROM payment_transactions pt
          JOIN sales s ON pt.sale_id = s.id
          WHERE s.customer_id IN (${assignedCustomers.map(() => '?').join(',')})
          AND pt.received_by = ?
          AND YEAR(pt.created_at) = ? AND MONTH(pt.created_at) = ?
        `;
        
        console.log(`Counting payments for upseller ${upsellerId} from customers: [${assignedCustomers.join(',')}] for ${year}-${month}`);
        
        const paymentsResults = await new Promise((resolve, reject) => {
          db.query(paymentsSql, [...assignedCustomers, upsellerId, year, month], (err, results) => {
            if (err) {
              console.error(`Error calculating upseller payments for ${upsellerId}:`, err);
              reject(err);
            } else {
              console.log(`Payment results for upseller ${upsellerId}:`, results);
              resolve(results);
            }
          });
        });
        
        if (paymentsResults.length > 0) {
          totalCashIn = parseFloat(paymentsResults[0].total_received_payments || 0);
          console.log(`Total cash-in calculated for upseller ${upsellerId}: ${totalCashIn}`);
        }

        console.log(`Final calculated total cash in for upseller ${upsellerId}: ${totalCashIn}`);

        // Update or create upseller performance record
        const checkSql = `
          SELECT id FROM upseller_performance 
          WHERE user_id = ? AND metric_type = 'revenue_generated' 
          AND period_month = ? AND period_year = ?
        `;

        db.query(checkSql, [upsellerId, month, year], (err, results) => {
          if (err) return reject(err);

          if (results.length > 0) {
            // Update existing record
            const updateSql = `
              UPDATE upseller_performance 
              SET metric_value = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            db.query(updateSql, [totalCashIn, results[0].id], (err, result) => {
              if (err) return reject(err);
              resolve({ success: true, message: 'Upseller performance recalculated and updated', totalCashIn });
            });
          } else {
            // Create new record
            const insertSql = `
              INSERT INTO upseller_performance 
              (user_id, metric_type, metric_value, period_month, period_year)
              VALUES (?, 'revenue_generated', ?, ?, ?)
            `;
            
            db.query(insertSql, [upsellerId, totalCashIn, month, year], (err, result) => {
              if (err) return reject(err);
              resolve({ success: true, message: 'Upseller performance record created', totalCashIn });
            });
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get upseller ID for a customer based on customer assignments
   * @param {number} customerId - Customer ID
   */
  static async getUpsellerForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT upseller_id FROM customer_assignments 
        WHERE customer_id = ? AND status = 'active'
        ORDER BY assigned_date DESC
        LIMIT 1
      `;
      
      console.log(`Getting upseller for customer ${customerId} with query:`, sql);
      
      db.query(sql, [customerId], (err, results) => {
        if (err) {
          console.error(`Error querying upseller for customer ${customerId}:`, err);
          return reject(err);
        }
        
        console.log(`Customer assignments result for customer ${customerId}:`, results);
        resolve(results.length > 0 ? results[0].upseller_id : null);
      });
    });
  }
}

module.exports = PaymentService;
