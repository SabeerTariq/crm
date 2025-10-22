import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import api from '../services/api';
import './ChargebackRefunds.css';

const ChargebackRefunds = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chargeback');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    sale_id: '',
    type: 'chargeback',
    amount: '',
    refund_type: 'full',
    reason: ''
  });
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    console.log('ChargebackRefunds component mounted, fetching data...');
    fetchRecords();
    fetchCustomers();
    fetchSales();
    fetchStats();
  }, [activeTab, pagination.page]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chargeback-refunds?type=${activeTab}&page=${pagination.page}&limit=${pagination.limit}`);
      if (response.data.success) {
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      console.log('Customers API response:', response.data);
      // Customers API returns data directly as array, not wrapped in success/data
      if (Array.isArray(response.data)) {
        console.log('Setting customers from direct array:', response.data.length, 'customers');
        setCustomers(response.data);
      } else if (response.data.success && response.data.data) {
        console.log('Setting customers from success.data:', response.data.data.length, 'customers');
        setCustomers(response.data.data);
      } else {
        console.log('No customers found in response');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      // Sales API returns data directly as array, not wrapped in success/data
      if (Array.isArray(response.data)) {
        setSales(response.data);
      } else if (response.data.success && response.data.data) {
        setSales(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/chargeback-refunds/stats/summary');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If type is changed to retained, set amount to 0
      if (name === 'type' && value === 'retained') {
        newData.amount = 0;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await api.put(`/chargeback-refunds/${editingRecord.id}`, formData);
      } else {
        await api.post('/chargeback-refunds', formData);
      }
      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        customer_id: '',
        sale_id: '',
        type: activeTab,
        amount: '',
        refund_type: 'full',
        reason: ''
      });
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Error saving record:', error);
      const errorMessage = error.response?.data?.message || 'Error saving record';
      alert(errorMessage);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      customer_id: record.customer_id,
      sale_id: record.sale_id,
      type: record.type,
      amount: record.amount,
      refund_type: record.refund_type,
      reason: record.reason
    });
    setShowModal(true);
  };

  const handleRetainCustomer = async (recordId) => {
    if (window.confirm('Are you sure you want to retain this customer? This will resolve the dispute and set the amount to 0.')) {
      try {
        // First get the record details
        const response = await api.get(`/chargeback-refunds/${recordId}`);
        const record = response.data.data;
        
        // Update the record to retained with amount 0
        await api.put(`/chargeback-refunds/${recordId}`, {
          amount: 0,
          reason: record.reason + ' - Customer retained after dispute resolution',
          refund_type: record.refund_type
        });
        
        // Update status to processed
        await api.patch(`/chargeback-refunds/${recordId}/status`, { status: 'processed' });
        
        fetchRecords();
        fetchStats();
        alert('Customer retained successfully! Dispute resolved.');
      } catch (error) {
        console.error('Error retaining customer:', error);
        alert('Error retaining customer');
      }
    }
  };

  const handleConvertToRetained = async (recordId) => {
    if (window.confirm('Are you sure you want to convert this chargeback/refund to retained customer? This will resolve the dispute and restore the original amount.')) {
      try {
        // First get the record details
        const response = await api.get(`/chargeback-refunds/${recordId}`);
        const record = response.data.data;
        
        // Convert to retained by updating the record
        await api.put(`/chargeback-refunds/${recordId}`, {
          type: 'retained',
          amount: record.amount, // Keep the original amount
          reason: record.reason + ' - Converted to retained customer',
          refund_type: record.refund_type
        });
        
        // Update status to processed
        await api.patch(`/chargeback-refunds/${recordId}/status`, { status: 'processed' });
        
        fetchRecords();
        fetchStats();
        alert('Customer converted to retained successfully! Dispute resolved.');
      } catch (error) {
        console.error('Error converting to retained:', error);
        alert('Error converting to retained customer');
      }
    }
  };

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      await api.patch(`/chargeback-refunds/${recordId}/status`, { status: newStatus });
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/chargeback-refunds/${recordId}`);
        fetchRecords();
        fetchStats();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      processed: 'badge-info'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  const getTypeBadge = (type) => {
    const typeClasses = {
      chargeback: 'badge-danger',
      refund: 'badge-warning',
      retained: 'badge-success'
    };
    return `badge ${typeClasses[type] || 'badge-secondary'}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PageLayout title="Chargeback & Refunds Management">
      <div className="chargeback-refunds-container">
        {/* Debug Info */}
        <div style={{background: '#f0f0f0', padding: '10px', marginBottom: '20px', borderRadius: '5px'}}>
          <strong>Debug Info:</strong> Customers: {customers.length}, Sales: {sales.length}
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon chargeback">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.byType?.chargeback?.count || 0}</h3>
              <p>Chargebacks</p>
              <span className="stat-amount">{formatCurrency(stats.byType?.chargeback?.amount || 0)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon refund">
              <i className="fas fa-undo"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.byType?.refund?.count || 0}</h3>
              <p>Refunds</p>
              <span className="stat-amount">{formatCurrency(stats.byType?.refund?.amount || 0)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon retained">
              <i className="fas fa-handshake"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.byType?.retained?.count || 0}</h3>
              <p>Retained (Resolved)</p>
              <span className="stat-amount">{formatCurrency(stats.byType?.retained?.amount || 0)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-chart-pie"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.byType?.total?.count || 0}</h3>
              <p>Total Records</p>
              <span className="stat-amount">{formatCurrency(stats.byType?.total?.amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'chargeback' ? 'active' : ''}`}
              onClick={() => handleTabChange('chargeback')}
            >
              <i className="fas fa-exclamation-triangle"></i>
              Chargebacks
            </button>
            <button
              className={`tab ${activeTab === 'refund' ? 'active' : ''}`}
              onClick={() => handleTabChange('refund')}
            >
              <i className="fas fa-undo"></i>
              Refunds
            </button>
            <button
              className={`tab ${activeTab === 'retained' ? 'active' : ''}`}
              onClick={() => handleTabChange('retained')}
            >
              <i className="fas fa-check-circle"></i>
              Retained (Resolved)
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                customer_id: '',
                sale_id: '',
                type: activeTab,
                amount: '',
                refund_type: 'full',
                reason: ''
              });
              setShowModal(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </button>
        </div>

        {/* Records Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              Loading...
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Original Amount</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{record.customer_name}</div>
                        <div className="customer-email">{record.customer_email}</div>
                      </div>
                    </td>
                    <td>{formatCurrency(record.original_amount)}</td>
                    <td>
                      {record.type === 'retained' ? (
                        <span style={{color: '#28a745', fontWeight: 'bold'}}>
                          {formatCurrency(record.amount)} (Retained)
                        </span>
                      ) : (
                        formatCurrency(record.amount)
                      )}
                    </td>
                    <td>
                      <span className={getTypeBadge(record.type)}>
                        {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(record.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(record)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {record.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleStatusChange(record.id, 'approved')}
                            title="Approve"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        {record.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleStatusChange(record.id, 'rejected')}
                            title="Reject"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                        {record.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleRetainCustomer(record.id)}
                            title="Retain Customer (Resolve Dispute)"
                          >
                            <i className="fas fa-handshake"></i>
                          </button>
                        )}
                        {(record.type === 'chargeback' || record.type === 'refund') && record.status !== 'retained' && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleConvertToRetained(record.id)}
                            title="Convert to Retained Customer"
                          >
                            <i className="fas fa-user-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(record.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-outline-primary"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="btn btn-outline-primary"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingRecord ? 'Edit Record' : 'Add New Record'}</h3>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Customer</label>
                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.length > 0 ? customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </option>
                      )) : (
                        <option disabled>No customers available</option>
                      )}
                    </select>
                    {customers.length === 0 && (
                      <small style={{color: 'red'}}>No customers found. Check console for details.</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Sale</label>
                    <select
                      name="sale_id"
                      value={formData.sale_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Sale</option>
                      {sales
                        .filter(sale => sale.customer_id == formData.customer_id)
                        .map(sale => (
                          <option key={sale.id} value={sale.id}>
                            {formatCurrency(sale.gross_value)} - {sale.payment_type}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="chargeback">Chargeback</option>
                      <option value="refund">Refund</option>
                      <option value="retained">Retained (Dispute Resolution)</option>
                    </select>
                    {formData.type === 'retained' && (
                      <small style={{color: '#666'}}>
                        Retained: Customer dispute resolved, amount will be set to 0
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      disabled={formData.type === 'retained'}
                    />
                    {formData.type === 'retained' && (
                      <small style={{color: '#666'}}>
                        Amount automatically set to 0 for retained customers
                      </small>
                    )}
                  </div>
                  {formData.type === 'refund' && (
                    <div className="form-group">
                      <label>Refund Type</label>
                      <select
                        name="refund_type"
                        value={formData.refund_type}
                        onChange={handleInputChange}
                      >
                        <option value="full">Full Refund</option>
                        <option value="partial">Partial Refund</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Reason</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Enter reason for chargeback/refund..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRecord ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ChargebackRefunds;
