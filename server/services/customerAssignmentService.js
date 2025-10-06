
const db = require('../db');

class CustomerAssignmentService {
  
  /**
   * Assign a customer to an upseller
   * @param {number} customerId - Customer ID
   * @param {number} upsellerId - Upseller user ID
   * @param {string} notes - Assignment notes
   * @param {number} createdBy - User ID who created the assignment
   */
  static async assignCustomer(customerId, upsellerId, notes = null, createdBy) {
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
          
          // First, deactivate any existing active assignments for this customer
          const deactivateSql = `
            UPDATE customer_assignments 
            SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
            WHERE customer_id = ? AND status = 'active'
          `;
          
          connection.query(deactivateSql, [customerId], (err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }
            
            // Create new assignment
            const insertSql = `
              INSERT INTO customer_assignments 
              (customer_id, upseller_id, notes, created_by)
              VALUES (?, ?, ?, ?)
            `;
            
            connection.query(insertSql, [customerId, upsellerId, notes, createdBy], (err, result) => {
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
                  resolve(result);
                }
              });
            });
          });
        });
      });
    });
  }
  
  /**
   * Get all customers assigned to a specific upseller
   * @param {number} upsellerId - Upseller user ID
   * @param {string} status - Assignment status filter (optional)
   */
  static async getAssignedCustomers(upsellerId, status = 'active') {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ca.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.total_sales,
          c.total_paid,
          c.total_remaining,
          c.last_payment_date,
          u.name as upseller_name,
          creator.name as created_by_name
        FROM customer_assignments ca
        JOIN customers c ON ca.customer_id = c.id
        JOIN users u ON ca.upseller_id = u.id
        JOIN users creator ON ca.created_by = creator.id
        WHERE ca.upseller_id = ? AND ca.status = ?
        ORDER BY ca.assigned_date DESC
      `;
      
      db.query(sql, [upsellerId, status], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get all upsellers assigned to a specific customer
   * @param {number} customerId - Customer ID
   * @param {string} status - Assignment status filter (optional)
   */
  static async getCustomerAssignments(customerId, status = 'active') {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ca.*,
          u.name as upseller_name,
          u.email as upseller_email,
          creator.name as created_by_name
        FROM customer_assignments ca
        JOIN users u ON ca.upseller_id = u.id
        JOIN users creator ON ca.created_by = creator.id
        WHERE ca.customer_id = ? AND ca.status = ?
        ORDER BY ca.assigned_date DESC
      `;
      
      db.query(sql, [customerId, status], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get all assignments with customer and upseller details
   * @param {Object} filters - Filter options
   */
  static async getAllAssignments(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          ca.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.total_sales,
          c.total_paid,
          c.total_remaining,
          u.name as upseller_name,
          u.email as upseller_email,
          creator.name as created_by_name
        FROM customer_assignments ca
        JOIN customers c ON ca.customer_id = c.id
        JOIN users u ON ca.upseller_id = u.id
        JOIN users creator ON ca.created_by = creator.id
        WHERE 1=1
      `;
      
      const params = [];
      
      // Default to active assignments if no status filter is provided
      if (filters.status) {
        sql += ' AND ca.status = ?';
        params.push(filters.status);
      } else {
        sql += ' AND ca.status = "active"';
      }
      
      
      if (filters.upseller_id) {
        sql += ' AND ca.upseller_id = ?';
        params.push(filters.upseller_id);
      }
      
      if (filters.customer_id) {
        sql += ' AND ca.customer_id = ?';
        params.push(filters.customer_id);
      }
      
      sql += ' ORDER BY ca.assigned_date DESC';
      
      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Update assignment status
   * @param {number} assignmentId - Assignment ID
   * @param {string} status - New status
   * @param {string} notes - Update notes
   */
  static async updateAssignmentStatus(assignmentId, status, notes = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE customer_assignments 
        SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.query(sql, [status, notes, assignmentId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  /**
   * Transfer customer to different upseller
   * @param {number} customerId - Customer ID
   * @param {number} newUpsellerId - New upseller ID
   * @param {string} notes - Transfer notes
   * @param {number} createdBy - User ID who initiated transfer
   */
  static async transferCustomer(customerId, newUpsellerId, notes = null, createdBy) {
    return new Promise((resolve, reject) => {
      console.log('Starting transfer:', { customerId, newUpsellerId, notes, createdBy });
      
      // Get a connection from the pool
      db.getConnection((err, connection) => {
        if (err) {
          console.error('Connection error:', err);
          return reject(err);
        }
        
        // Start transaction
        connection.beginTransaction((err) => {
          if (err) {
            console.error('Transaction begin error:', err);
            connection.release();
            return reject(err);
          }
          
          // First, delete any existing 'transferred' records for this customer
          // to avoid unique constraint violation
          const deleteTransferredSql = `
            DELETE FROM customer_assignments 
            WHERE customer_id = ? AND status = 'transferred'
          `;
          
          console.log('Deleting existing transferred records for customer:', customerId);
          connection.query(deleteTransferredSql, [customerId], (err, result) => {
            if (err) {
              console.error('Delete transferred query error:', err);
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }
            
            console.log('Delete transferred result:', result);
            
            // Now update current active assignment to transferred
            const deactivateSql = `
              UPDATE customer_assignments 
              SET status = 'transferred', notes = CONCAT(IFNULL(notes, ''), ' | Transferred to new upseller'), updated_at = CURRENT_TIMESTAMP
              WHERE customer_id = ? AND status = 'active'
            `;
            
            console.log('Deactivating current assignment for customer:', customerId);
            connection.query(deactivateSql, [customerId], (err, result) => {
              if (err) {
                console.error('Deactivate query error:', err);
                connection.rollback(() => {
                  connection.release();
                  reject(err);
                });
                return;
              }
              
              console.log('Deactivate result:', result);
              
              // Create new assignment
              const insertSql = `
                INSERT INTO customer_assignments 
                (customer_id, upseller_id, notes, created_by)
                VALUES (?, ?, ?, ?)
              `;
              
              console.log('Creating new assignment:', { customerId, newUpsellerId, notes, createdBy });
              connection.query(insertSql, [customerId, newUpsellerId, notes, createdBy], (err, result) => {
                if (err) {
                  console.error('Insert query error:', err);
                  connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                  return;
                }
                
                console.log('Insert result:', result);
                
                connection.commit((err) => {
                  connection.release(); // Always release the connection
                  if (err) {
                    console.error('Commit error:', err);
                    reject(err);
                  } else {
                    console.log('Transfer completed successfully');
                    resolve(result);
                  }
                });
              });
            });
          });
        });
      });
    });
  }
  
  /**
   * Get upseller statistics
   * @param {number} upsellerId - Upseller user ID
   */
  static async getUpsellerStats(upsellerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(DISTINCT ca.customer_id) as total_customers,
          COUNT(CASE WHEN ca.status = 'active' THEN 1 END) as active_customers,
          COUNT(CASE WHEN ca.status = 'inactive' THEN 1 END) as inactive_customers,
          COUNT(CASE WHEN ca.status = 'transferred' THEN 1 END) as transferred_customers,
          SUM(c.total_sales) as total_sales,
          SUM(c.total_paid) as total_paid,
          SUM(c.total_remaining) as total_remaining,
          AVG(c.total_sales) as avg_sale_value
        FROM customer_assignments ca
        JOIN customers c ON ca.customer_id = c.id
        WHERE ca.upseller_id = ?
      `;
      
      db.query(sql, [upsellerId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }
  
  /**
   * Get all upsellers with their assignment counts
   */
  static async getUpsellerList() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(ca.id) as total_assignments,
          COUNT(CASE WHEN ca.status = 'active' THEN 1 END) as active_assignments
        FROM users u
        LEFT JOIN customer_assignments ca ON u.id = ca.upseller_id
        WHERE u.role_id = 5
        GROUP BY u.id, u.name, u.email
        ORDER BY active_assignments DESC, u.name ASC
      `;
      
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Check if customer is assigned to upseller
   * @param {number} customerId - Customer ID
   * @param {number} upsellerId - Upseller user ID
   */
  static async isCustomerAssigned(customerId, upsellerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, status 
        FROM customer_assignments 
        WHERE customer_id = ? AND upseller_id = ? AND status = 'active'
      `;
      
      db.query(sql, [customerId, upsellerId], (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0);
      });
    });
  }
  
  /**
   * Get unassigned customers
   */
  static async getUnassignedCustomers() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*
        FROM customers c
        LEFT JOIN customer_assignments ca ON c.id = ca.customer_id AND ca.status = 'active'
        WHERE ca.id IS NULL
        ORDER BY c.name ASC
      `;
      
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
  
  /**
   * Get recent assignments for a specific upseller
   * @param {number} upsellerId - Upseller user ID
   * @param {number} limit - Number of recent assignments to return (default 5)
   */
  static async getRecentAssignments(upsellerId, limit = 5) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ca.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          creator.name as created_by_name
        FROM customer_assignments ca
        JOIN customers c ON ca.customer_id = c.id
        JOIN users creator ON ca.created_by = creator.id
        WHERE ca.upseller_id = ?
        ORDER BY ca.assigned_date DESC
        LIMIT ?
      `;
      
      db.query(sql, [upsellerId, limit], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get all customers with their current assignment status (unique customers only)
   */
  static async getAllCustomersWithAssignments() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.total_sales,
          c.total_paid,
          c.total_remaining,
          c.last_payment_date,
          ca.id as assignment_id,
          ca.upseller_id,
          ca.status as assignment_status,
          ca.assigned_date,
          ca.notes as assignment_notes,
          u.name as upseller_name,
          u.email as upseller_email,
          creator.name as created_by_name
        FROM customers c
        LEFT JOIN customer_assignments ca ON c.id = ca.customer_id AND ca.status = 'active'
        LEFT JOIN users u ON ca.upseller_id = u.id
        LEFT JOIN users creator ON ca.created_by = creator.id
        ORDER BY c.name ASC
      `;
      
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = CustomerAssignmentService;
