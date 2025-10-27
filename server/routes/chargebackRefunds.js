const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all chargebacks, refunds, and retained customers
router.get('/', auth, authorize('chargeback_refunds', 'view'), (req, res) => {
  const { type, status, page = 1, limit = 10 } = req.query;
  
  let whereClause = '1=1';
  let params = [];
  
  if (type) {
    whereClause += ' AND cr.type = ?';
    params.push(type);
  }
  
  if (status) {
    whereClause += ' AND cr.status = ?';
    params.push(status);
  }
  
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT 
      cr.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      s.gross_value,
      s.cash_in,
      s.payment_type,
      s.payment_source,
      u1.name as created_by_name,
      u2.name as processed_by_name
    FROM chargeback_refunds cr
    JOIN customers c ON cr.customer_id = c.id
    JOIN sales s ON cr.sale_id = s.id
    JOIN users u1 ON cr.created_by = u1.id
    LEFT JOIN users u2 ON cr.processed_by = u2.id
    WHERE ${whereClause}
    ORDER BY cr.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), offset);
  
  db.query(query, params, (err, records) => {
    if (err) {
      console.error('Error fetching chargeback/refunds:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch records' });
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chargeback_refunds cr
      WHERE ${whereClause}
    `;
    
    db.query(countQuery, params.slice(0, -2), (err, countResult) => {
      if (err) {
        console.error('Error fetching count:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch count' });
      }
      
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    });
  });
});

// Get chargeback/refund by ID
router.get('/:id', auth, authorize('chargeback_refunds', 'view'), (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      cr.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      c.customer_status,
      s.gross_value,
      s.cash_in,
      s.payment_type,
      s.payment_source,
      s.created_by as sale_created_by,
      u1.name as created_by_name,
      u2.name as processed_by_name
    FROM chargeback_refunds cr
    JOIN customers c ON cr.customer_id = c.id
    JOIN sales s ON cr.sale_id = s.id
    JOIN users u1 ON cr.created_by = u1.id
    LEFT JOIN users u2 ON cr.processed_by = u2.id
    WHERE cr.id = ?
  `;
  
  db.query(query, [id], (err, records) => {
    if (err) {
      console.error('Error fetching chargeback/refund:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch record' });
    }
    
    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    
    res.json({ success: true, data: records[0] });
  });
});

// Create new chargeback/refund
router.post('/', auth, authorize('chargeback_refunds', 'create'), (req, res) => {
  const {
    customer_id,
    sale_id,
    type,
    amount,
    amount_received,
    refund_amount,
    refund_type = 'full',
    reason
  } = req.body;
  
  // Validate required fields
  if (!customer_id || !sale_id || !type) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Validate amount based on type
  if (type === 'chargeback' && !amount_received) {
    return res.status(400).json({
      success: false,
      message: 'Amount received is required for chargebacks'
    });
  }
  
  if (type === 'refund' && !refund_amount) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount is required for refunds'
    });
  }
  
  if (type === 'refund' && parseFloat(refund_amount) > parseFloat(amount_received || 0)) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount cannot exceed amount received'
    });
  }
  
  // Auto-set amount_received from sale's cash_in if not provided
  if (!amount_received) {
    // This will be handled in the sale lookup below
  }
  
  // Get original sale amount
  db.query('SELECT gross_value, cash_in FROM sales WHERE id = ?', [sale_id], (err, saleResult) => {
    if (err) {
      console.error('Error fetching sale:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch sale' });
    }
    
    if (saleResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    const originalAmount = saleResult[0].cash_in;
    const actualAmountReceived = amount_received || saleResult[0].cash_in;
    
    // Validate refund amount against actual amount received
    if (type === 'refund' && parseFloat(refund_amount) > parseFloat(actualAmountReceived)) {
      return res.status(400).json({
        success: false,
        message: `Refund amount cannot exceed amount received (${actualAmountReceived})`
      });
    }
    
    // Check for duplicate records
    const duplicateCheckQuery = `
      SELECT id, type, status FROM chargeback_refunds 
      WHERE sale_id = ? OR (customer_id = ? AND type = ?)
    `;
    
    db.query(duplicateCheckQuery, [sale_id, customer_id, type], (err, duplicateResult) => {
      if (err) {
        console.error('Error checking for duplicates:', err);
        return res.status(500).json({ success: false, message: 'Failed to check for duplicates' });
      }
      
      if (duplicateResult.length > 0) {
        const duplicate = duplicateResult[0];
        return res.status(409).json({
          success: false,
          message: `Duplicate record found. There is already a ${duplicate.type} record (${duplicate.status}) for this ${duplicate.sale_id === parseInt(sale_id) ? 'sale' : 'customer'}.`
        });
      }
      
    // Create chargeback/refund record
    const insertQuery = `
      INSERT INTO chargeback_refunds 
      (customer_id, sale_id, type, amount, amount_received, refund_amount, original_amount, refund_type, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [
      customer_id,
      sale_id,
      type,
      amount,
      actualAmountReceived,
      refund_amount,
      originalAmount,
      refund_type,
      reason,
      req.user.id
    ], (err, result) => {
        if (err) {
          console.error('Error creating record:', err);
          return res.status(500).json({ success: false, message: 'Failed to create record' });
        }
        
        const chargebackRefundId = result.insertId;
      
      // Update customer status
      let customerStatus = 'active';
      if (type === 'chargeback') {
        customerStatus = 'chargeback';
      } else if (type === 'refund') {
        customerStatus = 'refunded';
      } else if (type === 'retained') {
        customerStatus = 'retained';
      }
      
      db.query(
        'UPDATE customers SET customer_status = ? WHERE id = ?',
        [customerStatus, customer_id],
        (err, customerResult) => {
          if (err) {
            console.error('Error updating customer status:', err);
          }
          
          // Update sales cash_in amount
          let newCashIn;
          if (type === 'retained') {
            // For retained customers, restore original amount (no financial impact)
            newCashIn = originalAmount;
          } else {
            // For chargebacks/refunds, reduce by the amount
            newCashIn = originalAmount - amount;
          }
          
          db.query(
            'UPDATE sales SET cash_in = ? WHERE id = ?',
            [newCashIn, sale_id],
            (err, salesResult) => {
              if (err) {
                console.error('Error updating sales:', err);
              }
              
              // Update upseller performance if applicable
              db.query(
                'SELECT created_by FROM sales WHERE id = ?',
                [sale_id],
                (err, saleInfo) => {
                  if (err || saleInfo.length === 0) {
                    console.error('Error fetching sale info:', err);
                    return res.status(201).json({
                      success: true,
                      message: 'Record created successfully',
                      data: { id: chargebackRefundId }
                    });
                  }
                  
                  const upsellerId = saleInfo[0].created_by;
                  
                  if (type === 'retained') {
                    // For retained customers, no impact on upseller performance
                    res.status(201).json({
                      success: true,
                      message: 'Record created successfully',
                      data: { id: chargebackRefundId }
                    });
                  } else {
                    // Update upseller performance for revenue_generated
                    db.query(`
                      UPDATE upseller_performance 
                      SET metric_value = metric_value - ?
                      WHERE user_id = ? AND metric_type = 'revenue_generated'
                      AND period_month = MONTH(CURRENT_DATE()) 
                      AND period_year = YEAR(CURRENT_DATE())
                    `, [amount, upsellerId], (err, perfResult) => {
                      if (err) {
                        console.error('Error updating upseller performance:', err);
                      }
                      
                      res.status(201).json({
                        success: true,
                        message: 'Record created successfully',
                        data: { id: chargebackRefundId }
                      });
                    });
                  }
                }
              );
            }
          );
        }
      );
      });
    });
  });
});

// Update chargeback/refund status
router.patch('/:id/status', auth, authorize('chargeback_refunds', 'update'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }
  
  // Get current record first
  db.query('SELECT * FROM chargeback_refunds WHERE id = ?', [id], (err, currentRecord) => {
    if (err) {
      console.error('Error fetching current record:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch record' });
    }
    
    if (currentRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    const record = currentRecord[0];
    
    // Update status
    db.query(
      'UPDATE chargeback_refunds SET status = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
      [status, req.user.id, id],
      (err, result) => {
        if (err) {
          console.error('Error updating status:', err);
          return res.status(500).json({ success: false, message: 'Failed to update status' });
        }
        
        // Update customer status based on chargeback/refund status
        let customerStatus = 'active'; // Default to clear/active
        
        if (status === 'approved') {
          // If approved, set customer status based on record type
          if (record.type === 'chargeback') {
            customerStatus = 'chargeback';
          } else if (record.type === 'refund') {
            customerStatus = 'refunded';
          } else if (record.type === 'retained') {
            customerStatus = 'retained';
          }
        } else if (status === 'rejected') {
          // If rejected, keep customer as active (dispute denied)
          customerStatus = 'active';
        } else if (status === 'processed') {
          // If processed, set based on final type
          if (record.type === 'retained') {
            customerStatus = 'retained';
          } else {
            customerStatus = 'active';
          }
        }
        
        // Update customer status
        db.query(
          'UPDATE customers SET customer_status = ? WHERE id = ?',
          [customerStatus, record.customer_id],
          (err, customerResult) => {
            if (err) {
              console.error('Error updating customer status:', err);
            }
            
            // Create audit log
            db.query(`
              INSERT INTO chargeback_refund_audit 
              (chargeback_refund_id, action, old_values, new_values, performed_by)
              VALUES (?, 'status_changed', ?, ?, ?)
            `, [
              id,
              JSON.stringify({ status: record.status }),
              JSON.stringify({ status, customer_status: customerStatus }),
              req.user.id
            ], (err, auditResult) => {
              if (err) {
                console.error('Error creating audit log:', err);
                // Don't fail the request for audit log errors
              }
              
              res.json({
                success: true,
                message: 'Status updated successfully',
                customer_status: customerStatus
              });
            });
          }
        );
      }
    );
  });
});

// Update chargeback/refund
router.put('/:id', auth, authorize('chargeback_refunds', 'update'), (req, res) => {
  const { id } = req.params;
  const { amount, reason, refund_type, type } = req.body;
  
  // Get current record first
  db.query('SELECT * FROM chargeback_refunds WHERE id = ?', [id], (err, currentRecord) => {
    if (err) {
      console.error('Error fetching current record:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch record' });
    }
    
    if (currentRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    const record = currentRecord[0];
    const oldAmount = record.amount;
    const oldType = record.type;
    const newType = type || record.type;
    
    // Update record
    const updateQuery = `
      UPDATE chargeback_refunds 
      SET amount = ?, reason = ?, refund_type = ?, type = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    db.query(updateQuery, [
      amount || record.amount,
      reason || record.reason,
      refund_type || record.refund_type,
      newType,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating record:', err);
        return res.status(500).json({ success: false, message: 'Failed to update record' });
      }
      
      // Handle type conversion logic
      if (newType === 'retained') {
        // Converting to retained - restore original sales amount (no financial impact)
        // But keep the amount field to show the retained value
        db.query(
          'UPDATE sales SET cash_in = gross_value WHERE id = ?',
          [record.sale_id],
          (err, salesResult) => {
            if (err) {
              console.error('Error restoring sales amount:', err);
            }
            
            // Update customer status to retained
            db.query(
              'UPDATE customers SET customer_status = "retained" WHERE id = ?',
              [record.customer_id],
              (err, customerResult) => {
                if (err) {
                  console.error('Error updating customer status:', err);
                }
                
                res.json({
                  success: true,
                  message: 'Record converted to retained successfully'
                });
              }
            );
          }
        );
      } else if (oldType !== newType || amount !== oldAmount) {
        // Handle amount changes for non-retained records
        const amountDifference = oldAmount - (amount || record.amount);
        
        // Update sales cash_in
        db.query(
          'UPDATE sales SET cash_in = cash_in + ? WHERE id = ?',
          [amountDifference, record.sale_id],
          (err, salesResult) => {
            if (err) {
              console.error('Error updating sales:', err);
            }
            
            // Update upseller performance
            db.query(
              'SELECT created_by FROM sales WHERE id = ?',
              [record.sale_id],
              (err, saleInfo) => {
                if (err || saleInfo.length === 0) {
                  console.error('Error fetching sale info:', err);
                  return res.json({
                    success: true,
                    message: 'Record updated successfully'
                  });
                }
                
                const upsellerId = saleInfo[0].created_by;
                
                db.query(`
                  UPDATE upseller_performance 
                  SET metric_value = metric_value + ?
                  WHERE user_id = ? AND metric_type = 'revenue_generated'
                  AND period_month = MONTH(CURRENT_DATE()) 
                  AND period_year = YEAR(CURRENT_DATE())
                `, [amountDifference, upsellerId], (err, perfResult) => {
                  if (err) {
                    console.error('Error updating upseller performance:', err);
                  }
                  
                  res.json({
                    success: true,
                    message: 'Record updated successfully'
                  });
                });
              }
            );
          }
        );
      } else {
        res.json({
          success: true,
          message: 'Record updated successfully'
        });
      }
    });
  });
});

// Delete chargeback/refund
router.delete('/:id', auth, authorize('chargeback_refunds', 'delete'), (req, res) => {
  const { id } = req.params;
  
  // Get record details before deletion
  db.query('SELECT * FROM chargeback_refunds WHERE id = ?', [id], (err, record) => {
    if (err) {
      console.error('Error fetching record:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch record' });
    }
    
    if (record.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    const recordData = record[0];
    
    // Restore original values
    db.query(
      'UPDATE sales SET cash_in = cash_in + ? WHERE id = ?',
      [recordData.amount, recordData.sale_id],
      (err, salesResult) => {
        if (err) {
          console.error('Error restoring sales:', err);
        }
        
        // Restore upseller performance
        db.query(
          'SELECT created_by FROM sales WHERE id = ?',
          [recordData.sale_id],
          (err, saleInfo) => {
            if (err || saleInfo.length === 0) {
              console.error('Error fetching sale info:', err);
            } else {
              const upsellerId = saleInfo[0].created_by;
              
              db.query(`
                UPDATE upseller_performance 
                SET metric_value = metric_value + ?
                WHERE user_id = ? AND metric_type = 'revenue_generated'
                AND period_month = MONTH(CURRENT_DATE()) 
                AND period_year = YEAR(CURRENT_DATE())
              `, [recordData.amount, upsellerId], (err, perfResult) => {
                if (err) {
                  console.error('Error restoring upseller performance:', err);
                }
              });
            }
            
            // Reset customer status to active
            db.query(
              'UPDATE customers SET customer_status = "active" WHERE id = ?',
              [recordData.customer_id],
              (err, customerResult) => {
                if (err) {
                  console.error('Error resetting customer status:', err);
                }
                
                // Delete the record
                db.query(
                  'DELETE FROM chargeback_refunds WHERE id = ?',
                  [id],
                  (err, deleteResult) => {
                    if (err) {
                      console.error('Error deleting record:', err);
                      return res.status(500).json({ success: false, message: 'Failed to delete record' });
                    }
                    
                    res.json({
                      success: true,
                      message: 'Record deleted successfully'
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Get audit log for a chargeback/refund
router.get('/:id/audit', auth, authorize('chargeback_refunds', 'view'), (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      cra.*,
      u.name as performed_by_name
    FROM chargeback_refund_audit cra
    JOIN users u ON cra.performed_by = u.id
    WHERE cra.chargeback_refund_id = ?
    ORDER BY cra.performed_at DESC
  `;
  
  db.query(query, [id], (err, records) => {
    if (err) {
      console.error('Error fetching audit log:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
    }
    
    res.json({ success: true, data: records });
  });
});

// Get statistics
router.get('/stats/summary', auth, authorize('chargeback_refunds', 'view'), (req, res) => {
  const query = `
    SELECT 
      type,
      status,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM chargeback_refunds
    GROUP BY type, status
  `;
  
  db.query(query, (err, records) => {
    if (err) {
      console.error('Error fetching statistics:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
    
    // Calculate totals
    const totals = {
      chargeback: { count: 0, amount: 0 },
      refund: { count: 0, amount: 0 },
      retained: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 }
    };
    
    records.forEach(record => {
      totals[record.type].count += record.count;
      totals[record.type].amount += parseFloat(record.total_amount);
      totals.total.count += record.count;
      totals.total.amount += parseFloat(record.total_amount);
    });
    
    res.json({
      success: true,
      data: {
        byType: totals,
        details: records
      }
    });
  });
});

// Get chargeback/refund statistics for a specific upseller
router.get('/upseller/:upsellerId', auth, authorize('chargeback_refunds', 'read'), (req, res) => {
  const { upsellerId } = req.params;
  const { period = 'current' } = req.query; // current, past, total
  
  console.log('=== CHARGEBACK API DEBUG START ===');
  console.log('Upseller ID:', upsellerId);
  console.log('Period:', period);
  
  let dateFilter = '';
  let params = [upsellerId];
  
  if (period === 'current') {
    dateFilter = 'AND MONTH(cr.created_at) = MONTH(CURRENT_DATE()) AND YEAR(cr.created_at) = YEAR(CURRENT_DATE())';
  } else if (period === 'past') {
    dateFilter = 'AND cr.created_at < DATE_FORMAT(CURRENT_DATE(), "%Y-%m-01")';
  }
  // For 'total', no date filter is applied
  
  const query = `
    SELECT 
      cr.type,
      COUNT(*) as count,
      SUM(cr.amount) as total_amount,
      SUM(cr.amount_received) as total_amount_received,
      SUM(cr.refund_amount) as total_refund_amount
    FROM chargeback_refunds cr
    INNER JOIN customer_assignments ca ON cr.customer_id = ca.customer_id
    WHERE ca.upseller_id = ? AND ca.status = 'active'
    ${dateFilter}
    GROUP BY cr.type
  `;
  
  console.log('Query:', query);
  console.log('Params:', params);
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching upseller chargeback stats:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch chargeback statistics'
      });
    }
    
    console.log('Raw results:', results);
    
    // Format results
    const stats = {
      chargeback: { count: 0, amount: 0, amount_received: 0 },
      refund: { count: 0, amount: 0, refund_amount: 0 },
      retained: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 }
    };
    
    results.forEach(row => {
      console.log('Processing row:', row);
      if (row.type === 'chargeback') {
        stats.chargeback.count = row.count;
        stats.chargeback.amount = parseFloat(row.total_amount) || 0;
        stats.chargeback.amount_received = parseFloat(row.total_amount_received) || 0;
      } else if (row.type === 'refund') {
        stats.refund.count = row.count;
        stats.refund.amount = parseFloat(row.total_amount) || 0;
        stats.refund.refund_amount = parseFloat(row.total_refund_amount) || 0;
      } else if (row.type === 'retained') {
        stats.retained.count = row.count;
        stats.retained.amount = parseFloat(row.total_amount) || 0;
      }
      
      stats.total.count += row.count;
      stats.total.amount += parseFloat(row.total_amount) || 0;
    });
    
    console.log('Formatted stats:', stats);
    
    const response = {
      success: true,
      data: {
        upseller_id: upsellerId,
        period: period,
        stats: stats
      }
    };
    
    console.log('Final response:', response);
    console.log('=== CHARGEBACK API DEBUG END ===');
    
    res.json(response);
  });
});

// Get monthly chargeback/refund breakdown for upseller
router.get('/upseller/:upsellerId/monthly', auth, authorize('chargeback_refunds', 'read'), (req, res) => {
  const { upsellerId } = req.params;
  const { months = 12 } = req.query;
  
  const query = `
    SELECT 
      DATE_FORMAT(cr.created_at, '%Y-%m') as month,
      cr.type,
      COUNT(*) as count,
      SUM(cr.amount) as total_amount
    FROM chargeback_refunds cr
    INNER JOIN customer_assignments ca ON cr.customer_id = ca.customer_id
    WHERE ca.upseller_id = ? AND ca.status = 'active'
    AND cr.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(cr.created_at, '%Y-%m'), cr.type
    ORDER BY month DESC, cr.type
  `;
  
  db.query(query, [upsellerId, months], (err, results) => {
    if (err) {
      console.error('Error fetching monthly chargeback stats:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch monthly chargeback statistics' 
      });
    }
    
    // Format monthly data
    const monthlyStats = {};
    results.forEach(row => {
      if (!monthlyStats[row.month]) {
        monthlyStats[row.month] = {
          chargeback: { count: 0, amount: 0 },
          refund: { count: 0, amount: 0 },
          retained: { count: 0, amount: 0 },
          total: { count: 0, amount: 0 }
        };
      }
      
      monthlyStats[row.month][row.type].count = row.count;
      monthlyStats[row.month][row.type].amount = parseFloat(row.total_amount) || 0;
      monthlyStats[row.month].total.count += row.count;
      monthlyStats[row.month].total.amount += parseFloat(row.total_amount) || 0;
    });
    
    res.json({
      success: true,
      data: {
        upseller_id: upsellerId,
        monthly_stats: monthlyStats
      }
    });
  });
});

module.exports = router;
