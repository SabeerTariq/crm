import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getUserRole } from '../utils/userUtils';
import PageLayout from '../components/PageLayout';
import './Assignments.css';

export default function Assignments() {
  const [customers, setCustomers] = useState([]);
  const [upsellers, setUpsellers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' or 'assigned'
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const { hasPermission } = usePermissions();
  const userRole = getUserRole();
  const isUpseller = userRole === 'upseller';

  // Form states
  const [assignForm, setAssignForm] = useState({
    customer_id: '',
    upseller_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (isUpseller) {
        // For upsellers, fetch their assigned customers and stats
        const [assignmentsRes, statsRes] = await Promise.all([
          fetch('/api/assignments/my-assignments', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/assignments/my-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!assignmentsRes.ok) {
          const errorText = await assignmentsRes.text();
          console.error('Assignments API error:', assignmentsRes.status, errorText);
          throw new Error(`Assignments API failed: ${assignmentsRes.status}`);
        }
        
        if (!statsRes.ok) {
          const errorText = await statsRes.text();
          console.error('Stats API error:', statsRes.status, errorText);
          throw new Error(`Stats API failed: ${statsRes.status}`);
        }
        
        const assignmentsData = await assignmentsRes.json();
        const statsData = await statsRes.json();
        
        // Convert assignments to customers format
        const customersData = assignmentsData.map(assignment => ({
          id: assignment.customer_id,
          name: assignment.customer_name,
          email: assignment.customer_email,
          phone: assignment.customer_phone,
          total_sales: assignment.total_sales,
          total_paid: assignment.total_paid,
          total_remaining: assignment.total_remaining,
          last_payment_date: assignment.last_payment_date,
          assigned_to: assignment.upseller_name,
          assignment_id: assignment.id,
          status: assignment.status,
          assigned_date: assignment.assigned_date
        }));
        
        setCustomers(customersData);
        setStats(statsData);
      } else {
        // For admins, fetch all customers with assignments and upsellers
        const [customersRes, upsellersRes] = await Promise.all([
          fetch('/api/assignments/customers', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/assignments/upsellers', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!customersRes.ok) {
          const errorText = await customersRes.text();
          console.error('Customers API error:', customersRes.status, errorText);
          throw new Error(`Customers API failed: ${customersRes.status}`);
        }
        
        if (!upsellersRes.ok) {
          const errorText = await upsellersRes.text();
          console.error('Upsellers API error:', upsellersRes.status, errorText);
          throw new Error(`Upsellers API failed: ${upsellersRes.status}`);
        }
        
        const customersData = await customersRes.json();
        const upsellersData = await upsellersRes.json();
        
        // Convert to the format expected by the component
        const allCustomers = customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          total_sales: customer.total_sales,
          total_paid: customer.total_paid,
          total_remaining: customer.total_remaining,
          last_payment_date: customer.last_payment_date,
          assigned_to: customer.upseller_name,
          assignment_id: customer.assignment_id,
          status: customer.assignment_status || 'unassigned',
          assigned_date: customer.assigned_date
        }));
        
        setCustomers(allCustomers);
        setUpsellers(upsellersData);
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCustomer = async (customerId, upsellerId, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assignments/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customerId,
          upseller_id: upsellerId,
          notes: notes
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedCustomer(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to assign customer');
      }
    } catch (err) {
      alert('Error assigning customer');
      console.error('Error:', err);
    }
  };

  const handleTransferCustomer = async (customerId, newUpsellerId, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assignments/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: customerId,
          new_upseller_id: newUpsellerId,
          notes: notes
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedCustomer(null);
        fetchData();
        alert('Customer reassigned successfully!');
      } else {
        const errorData = await response.json();
        console.error('Transfer API Error:', errorData);
        alert(`Failed to reassign customer: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Transfer Error:', err);
      alert(`Error reassigning customer: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assignments/${assignmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
      console.error('Error:', err);
    }
  };

  const handleReassignCustomer = (customer) => {
    setSelectedCustomer(customer);
    setAssignForm({
      customer_id: customer.id,
      upseller_id: '', // Let them choose a new upseller
      notes: ''
    });
    setShowAssignModal(true);
  };

  // Filter customers based on active tab
  const filteredCustomers = customers.filter(customer => {
    if (activeTab === 'unassigned') {
      return !customer.assigned_to;
    } else {
      return customer.assigned_to;
    }
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="assignments-container">
          <div className="loading">Loading assignments...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="assignments-container">
          <div className="error">{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div className="assignments-container">
      <div className="assignments-header">
        <h1>Customer Assignments</h1>
      </div>

      {/* Statistics Cards for Upsellers */}
      {isUpseller && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Customers</h3>
            <p className="stat-number">{stats.total_customers || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p className="stat-number">{stats.active_customers || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p className="stat-number">${stats.total_sales || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Paid</h3>
            <p className="stat-number">${stats.total_paid || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Remaining</h3>
            <p className="stat-number">${stats.total_remaining || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isUpseller && (
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'unassigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('unassigned')}
          >
            Unassigned Customers ({customers.filter(c => !c.assigned_to).length})
          </button>
          <button 
            className={`tab ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned Customers ({customers.filter(c => c.assigned_to).length})
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="customers-table-container">
        <h2>
          {isUpseller 
            ? 'My Assigned Customers' 
            : activeTab === 'unassigned' 
              ? 'Unassigned Customers' 
              : 'Assigned Customers'
          }
        </h2>
        
        {filteredCustomers.length === 0 ? (
          <div className="no-data">
            <p>No {activeTab === 'unassigned' ? 'unassigned' : 'assigned'} customers found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="customers-table-wrapper">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Sales</th>
                    <th>Total Paid</th>
                    <th>Remaining</th>
                    <th>Last Payment</th>
                    {!isUpseller && <th>Assigned To</th>}
                    {!isUpseller && <th>Status</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-info">
                          <strong>{customer.name}</strong>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>${customer.total_sales || 0}</td>
                      <td>${customer.total_paid || 0}</td>
                      <td>${customer.total_remaining || 0}</td>
                      <td>
                        {customer.last_payment_date 
                          ? new Date(customer.last_payment_date).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      {!isUpseller && (
                        <td>
                          {customer.assigned_to ? (
                            <span className="assigned-to">{customer.assigned_to}</span>
                          ) : (
                            <span className="unassigned">Unassigned</span>
                          )}
                        </td>
                      )}
                      {!isUpseller && (
                        <td>
                          {customer.status && (
                            <span className={`status ${customer.status}`}>
                              {customer.status}
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <div className="action-buttons">
                          {!isUpseller && (
                            <>
                              {!customer.assigned_to ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setAssignForm({
                                      customer_id: customer.id,
                                      upseller_id: '',
                                      notes: ''
                                    });
                                    setShowAssignModal(true);
                                  }}
                                >
                                  Assign
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => handleReassignCustomer(customer)}
                                >
                                  Reassign
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="customers-cards">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="customer-card">
                  <div className="customer-card-header">
                    <div>
                      <div className="customer-card-name">{customer.name}</div>
                      <div className="customer-card-email">{customer.email}</div>
                    </div>
                    {!isUpseller && customer.status && (
                      <span className={`status ${customer.status}`}>
                        {customer.status}
                      </span>
                    )}
                  </div>
                  <div className="customer-card-body">
                    <div className="customer-card-field">
                      <span className="customer-card-label">Phone</span>
                      <span className="customer-card-value">{customer.phone || 'N/A'}</span>
                    </div>
                    <div className="customer-card-field">
                      <span className="customer-card-label">Total Sales</span>
                      <span className="customer-card-value">${customer.total_sales || 0}</span>
                    </div>
                    <div className="customer-card-field">
                      <span className="customer-card-label">Total Paid</span>
                      <span className="customer-card-value">${customer.total_paid || 0}</span>
                    </div>
                    <div className="customer-card-field">
                      <span className="customer-card-label">Remaining</span>
                      <span className="customer-card-value">${customer.total_remaining || 0}</span>
                    </div>
                    <div className="customer-card-field">
                      <span className="customer-card-label">Last Payment</span>
                      <span className="customer-card-value">
                        {customer.last_payment_date 
                          ? new Date(customer.last_payment_date).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    {!isUpseller && (
                      <div className="customer-card-field">
                        <span className="customer-card-label">Assigned To</span>
                        <span className="customer-card-value">
                          {customer.assigned_to ? (
                            <span className="assigned-to">{customer.assigned_to}</span>
                          ) : (
                            <span className="unassigned">Unassigned</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="customer-card-actions">
                    <div className="action-buttons">
                      {!isUpseller && (
                        <>
                          {!customer.assigned_to ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setAssignForm({
                                  customer_id: customer.id,
                                  upseller_id: '',
                                  notes: ''
                                });
                                setShowAssignModal(true);
                              }}
                            >
                              Assign
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleReassignCustomer(customer)}
                            >
                              Reassign
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assign/Transfer Modal */}
      {showAssignModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {selectedCustomer.assigned_to ? 'Reassign Customer' : 'Assign Customer'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedCustomer.assigned_to) {
                handleTransferCustomer(assignForm.customer_id, assignForm.upseller_id, assignForm.notes);
              } else {
                handleAssignCustomer(assignForm.customer_id, assignForm.upseller_id, assignForm.notes);
              }
            }}>
              <div className="form-group">
                <label>Customer:</label>
                <input
                  type="text"
                  value={selectedCustomer.name}
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label>
                  {selectedCustomer.assigned_to ? 'New Upseller:' : 'Upseller:'}
                </label>
                <select
                  value={assignForm.upseller_id}
                  onChange={(e) => setAssignForm({...assignForm, upseller_id: e.target.value})}
                  required
                >
                  <option value="">Select Upseller</option>
                  {upsellers.map(upseller => (
                    <option key={upseller.id} value={upseller.id}>
                      {upseller.name} ({upseller.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({...assignForm, notes: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCustomer(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedCustomer.assigned_to ? 'Reassign Customer' : 'Assign Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
    </PageLayout>
  );
}