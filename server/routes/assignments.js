const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const CustomerAssignmentService = require('../services/customerAssignmentService');

// Get all assignments (admin only)
router.get('/', auth, authorize('assignments', 'read'), (req, res) => {
  const filters = {
    status: req.query.status,
    assignment_type: req.query.assignment_type,
    upseller_id: req.query.upseller_id,
    customer_id: req.query.customer_id,
    limit: req.query.limit ? parseInt(req.query.limit) : null
  };
  
  CustomerAssignmentService.getAllAssignments(filters)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching assignments:', err);
      res.status(500).json({ message: 'Error fetching assignments' });
    });
});

// Get all customers with their assignment status (unique customers only)
router.get('/customers', auth, authorize('assignments', 'read'), (req, res) => {
  CustomerAssignmentService.getAllCustomersWithAssignments()
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching customers with assignments:', err);
      res.status(500).json({ message: 'Error fetching customers with assignments' });
    });
});

// Get assignments for current upseller
router.get('/my-assignments', auth, authorize('assignments', 'read'), (req, res) => {
  // Check if user is upseller
  if (req.user.role_id !== 5) {
    return res.status(403).json({ message: 'Access denied. Upseller role required.' });
  }
  
  const status = req.query.status || 'active';
  
  CustomerAssignmentService.getAssignedCustomers(req.user.id, status)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching my assignments:', err);
      res.status(500).json({ message: 'Error fetching assignments' });
    });
});

// Get customers assigned to specific upseller
router.get('/upseller/:upsellerId', auth, authorize('assignments', 'read'), (req, res) => {
  const upsellerId = req.params.upsellerId;
  const status = req.query.status || 'active';
  
  CustomerAssignmentService.getAssignedCustomers(upsellerId, status)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching upseller assignments:', err);
      res.status(500).json({ message: 'Error fetching upseller assignments' });
    });
});

// Get assignments for specific customer
router.get('/customer/:customerId', auth, authorize('assignments', 'read'), (req, res) => {
  const customerId = req.params.customerId;
  const status = req.query.status || 'active';
  
  CustomerAssignmentService.getCustomerAssignments(customerId, status)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching customer assignments:', err);
      res.status(500).json({ message: 'Error fetching customer assignments' });
    });
});

// Assign customer to upseller
router.post('/assign', auth, authorize('assignments', 'create'), (req, res) => {
  const { customer_id, upseller_id, assignment_type = 'manual', notes } = req.body;
  
  if (!customer_id || !upseller_id) {
    return res.status(400).json({ message: 'Customer ID and Upseller ID are required' });
  }
  
  CustomerAssignmentService.assignCustomer(
    customer_id, 
    upseller_id, 
    assignment_type, 
    notes, 
    req.user.id
  )
    .then(result => {
      res.json({ 
        message: 'Customer assigned successfully', 
        assignment_id: result.insertId 
      });
    })
    .catch(err => {
      console.error('Error assigning customer:', err);
      res.status(500).json({ message: 'Error assigning customer' });
    });
});

// Transfer customer to different upseller
router.post('/transfer', auth, authorize('assignments', 'update'), (req, res) => {
  const { customer_id, new_upseller_id, notes } = req.body;
  
  console.log('Transfer request:', { customer_id, new_upseller_id, notes, user_id: req.user.id });
  
  if (!customer_id || !new_upseller_id) {
    return res.status(400).json({ message: 'Customer ID and New Upseller ID are required' });
  }
  
  CustomerAssignmentService.transferCustomer(
    customer_id, 
    new_upseller_id, 
    notes, 
    req.user.id
  )
    .then(result => {
      console.log('Transfer successful:', result);
      res.json({ 
        message: 'Customer transferred successfully', 
        assignment_id: result.insertId 
      });
    })
    .catch(err => {
      console.error('Error transferring customer:', err);
      res.status(500).json({ 
        message: 'Error transferring customer',
        error: err.message 
      });
    });
});

// Update assignment status
router.put('/:assignmentId/status', auth, authorize('assignments', 'update'), (req, res) => {
  const assignmentId = req.params.assignmentId;
  const { status, notes } = req.body;
  
  if (!status || !['active', 'inactive', 'transferred'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required' });
  }
  
  CustomerAssignmentService.updateAssignmentStatus(assignmentId, status, notes)
    .then(result => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      res.json({ message: 'Assignment status updated successfully' });
    })
    .catch(err => {
      console.error('Error updating assignment status:', err);
      res.status(500).json({ message: 'Error updating assignment status' });
    });
});

// Get upseller statistics
router.get('/upseller/:upsellerId/stats', auth, authorize('assignments', 'read'), (req, res) => {
  const upsellerId = req.params.upsellerId;
  
  CustomerAssignmentService.getUpsellerStats(upsellerId)
    .then(stats => {
      res.json(stats);
    })
    .catch(err => {
      console.error('Error fetching upseller stats:', err);
      res.status(500).json({ message: 'Error fetching upseller statistics' });
    });
});

// Get my statistics (for current upseller)
router.get('/my-stats', auth, authorize('assignments', 'read'), (req, res) => {
  // Check if user is upseller
  if (req.user.role_id !== 5) {
    return res.status(403).json({ message: 'Access denied. Upseller role required.' });
  }
  
  CustomerAssignmentService.getUpsellerStats(req.user.id)
    .then(stats => {
      res.json(stats);
    })
    .catch(err => {
      console.error('Error fetching my stats:', err);
      res.status(500).json({ message: 'Error fetching statistics' });
    });
});

// Get list of all upsellers
router.get('/upsellers', auth, authorize('assignments', 'read'), (req, res) => {
  CustomerAssignmentService.getUpsellerList()
    .then(upsellers => {
      res.json(upsellers);
    })
    .catch(err => {
      console.error('Error fetching upsellers:', err);
      res.status(500).json({ message: 'Error fetching upsellers' });
    });
});

// Get unassigned customers
router.get('/unassigned-customers', auth, authorize('assignments', 'read'), (req, res) => {
  CustomerAssignmentService.getUnassignedCustomers()
    .then(customers => {
      res.json(customers);
    })
    .catch(err => {
      console.error('Error fetching unassigned customers:', err);
      res.status(500).json({ message: 'Error fetching unassigned customers' });
    });
});

// Check if customer is assigned to current upseller
router.get('/check/:customerId', auth, authorize('assignments', 'read'), (req, res) => {
  // Check if user is upseller
  if (req.user.role_id !== 5) {
    return res.status(403).json({ message: 'Access denied. Upseller role required.' });
  }
  
  const customerId = req.params.customerId;
  
  CustomerAssignmentService.isCustomerAssigned(customerId, req.user.id)
    .then(isAssigned => {
      res.json({ assigned: isAssigned });
    })
    .catch(err => {
      console.error('Error checking assignment:', err);
      res.status(500).json({ message: 'Error checking assignment' });
    });
});

// Delete assignment (admin only)
router.delete('/:assignmentId', auth, authorize('assignments', 'delete'), (req, res) => {
  const assignmentId = req.params.assignmentId;
  
  const sql = 'DELETE FROM customer_assignments WHERE id = ?';
  
  db.query(sql, [assignmentId], (err, result) => {
    if (err) {
      console.error('Error deleting assignment:', err);
      return res.status(500).json({ message: 'Error deleting assignment' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment deleted successfully' });
  });
});

module.exports = router;
