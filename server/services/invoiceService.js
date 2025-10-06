const db = require('../db');

class InvoiceService {
  
  /**
   * Create an invoice from a sale
   * @param {number} saleId - The sale ID
   * @param {number} createdBy - User ID who created the invoice
   * @returns {Promise<Object>} Created invoice details
   */
  static async createInvoiceFromSale(saleId, createdBy) {
    return new Promise((resolve, reject) => {
      // First, get the sale details
      const getSaleSql = `
        SELECT 
          s.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `;
      
      db.query(getSaleSql, [saleId], (err, saleResults) => {
        if (err) return reject(err);
        
        if (saleResults.length === 0) {
          return reject(new Error('Sale not found'));
        }
        
        const sale = saleResults[0];
        
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${saleId}`;
        
        // Set invoice date to today
        const invoiceDate = new Date().toISOString().split('T')[0];
        
        // Set due date to 30 days from today
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        // Create invoice
        const createInvoiceSql = `
          INSERT INTO invoices 
          (customer_id, sale_id, invoice_number, invoice_date, due_date, 
           total_amount, remaining_amount, services, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const invoiceData = [
          sale.customer_id,
          saleId,
          invoiceNumber,
          invoiceDate,
          dueDateStr,
          sale.unit_price,
          sale.unit_price, // remaining_amount starts as total_amount
          sale.services || 'Services provided',
          `Invoice for sale #${saleId}`,
          createdBy
        ];
        
        db.query(createInvoiceSql, invoiceData, (err, result) => {
          if (err) return reject(err);
          
          const invoiceId = result.insertId;
          
          // Create upcoming payment record for the invoice
          const upcomingPaymentSql = `
            INSERT INTO upcoming_payments 
            (customer_id, payment_type, source_id, amount, due_date, description)
            VALUES (?, 'invoice', ?, ?, ?, ?)
          `;
          
          const paymentData = [
            sale.customer_id,
            invoiceId,
            sale.unit_price,
            dueDateStr,
            `Invoice #${invoiceNumber} - ${sale.services || 'Services'}`
          ];
          
          db.query(upcomingPaymentSql, paymentData, (err) => {
            if (err) {
              console.error('Error creating upcoming payment for invoice:', err);
              // Don't reject the main promise, just log the error
            }
            
            resolve({
              id: invoiceId,
              invoice_number: invoiceNumber,
              total_amount: sale.unit_price,
              customer_name: sale.customer_name,
              due_date: dueDateStr
            });
          });
        });
      });
    });
  }
  
  /**
   * Get invoice details by ID
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  static async getInvoiceById(invoiceId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          s.services as sale_services
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN sales s ON i.sale_id = s.id
        WHERE i.id = ?
      `;
      
      db.query(sql, [invoiceId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      });
    });
  }
  
  /**
   * Update invoice payment
   * @param {number} invoiceId - Invoice ID
   * @param {number} paidAmount - Amount being paid
   * @param {number} updatedBy - User ID who updated the invoice
   * @returns {Promise<Object>} Updated invoice details
   */
  static async updateInvoicePayment(invoiceId, paidAmount, updatedBy) {
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
        
        // Get current invoice details
        const getInvoiceSql = 'SELECT * FROM invoices WHERE id = ?';
        connection.query(getInvoiceSql, [invoiceId], (err, invoiceResults) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              reject(err);
            });
            return;
          }
          
          if (invoiceResults.length === 0) {
            connection.rollback(() => {
              connection.release();
              reject(new Error('Invoice not found'));
            });
            return;
          }
          
          const invoice = invoiceResults[0];
          const newPaidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(paidAmount);
          const newRemainingAmount = parseFloat(invoice.total_amount) - newPaidAmount;
          const isFullyPaid = newRemainingAmount <= 0;
          
          // Update invoice
          const updateInvoiceSql = `
            UPDATE invoices 
            SET paid_amount = ?, remaining_amount = ?, status = ?
            WHERE id = ?
          `;
          
          const status = isFullyPaid ? 'paid' : 'sent';
          
          connection.query(updateInvoiceSql, [newPaidAmount, newRemainingAmount, status, invoiceId], (err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }
            
            // Update upcoming payment status if fully paid
            if (isFullyPaid) {
              const updateUpcomingSql = `
                UPDATE upcoming_payments 
                SET status = 'paid'
                WHERE source_id = ? AND payment_type = 'invoice'
              `;
              
              connection.query(updateUpcomingSql, [invoiceId], (err) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                  return;
                }
                
                connection.commit((err) => {
                  connection.release(); // Always release the connection
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ 
                      success: true, 
                      fullyPaid: true,
                      remainingAmount: 0
                    });
                  }
                });
              });
            } else {
              connection.commit((err) => {
                connection.release(); // Always release the connection
                if (err) {
                  reject(err);
                } else {
                  resolve({ 
                    success: true, 
                    fullyPaid: false,
                    remainingAmount: newRemainingAmount
                  });
                }
              });
            }
          });
        });
      });
    });
    });
  }
  
  /**
   * Get all invoices for a customer
   * @param {number} customerId - Customer ID
   * @returns {Promise<Array>} Array of invoices
   */
  static async getCustomerInvoices(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.*,
          s.services as sale_services
        FROM invoices i
        LEFT JOIN sales s ON i.sale_id = s.id
        WHERE i.customer_id = ?
        ORDER BY i.created_at DESC
      `;
      
      db.query(sql, [customerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = InvoiceService;
