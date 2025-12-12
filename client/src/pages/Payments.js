import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentType: '',
    startDate: '',
    endDate: ''
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentSource: 'wire',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('all'); // all, installments, recurring, transactions
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const loadPayments = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await api.get(`/payments/all?${params}`, { headers });
      setPayments(response.data.payments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId, type) => {
    try {
      // For installments, ensure we're using the exact remaining amount
      if (type === 'installment' && showPaymentForm) {
        const remainingAmount = parseFloat(showPaymentForm.payment.amount) - parseFloat(showPaymentForm.payment.paid_amount);
        if (parseFloat(paymentForm.amount) !== remainingAmount) {
          alert('For installment payments, you must pay the exact remaining amount');
          return;
        }
      }
      
      // Validate form data
      if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }
      
      if (!paymentForm.paymentSource) {
        alert('Please select a payment source');
        return;
      }
      
      const token = localStorage.getItem('token');
      const endpoint = type === 'installment' 
        ? `/payments/installment/${paymentId}/pay`
        : `/payments/recurring/${paymentId}/pay`;
      
      await api.post(endpoint, paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Payment processed successfully!');
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', paymentSource: 'wire', notes: '' });
      loadPayments(pagination.page);
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process payment. Please try again.';
      alert(errorMessage);
    }
  };

  const openPaymentForm = (payment, type) => {
    let amount = '';
    if (type === 'installment') {
      // For installments, set the remaining amount
      const remainingAmount = parseFloat(payment.amount) - parseFloat(payment.paid_amount);
      amount = remainingAmount > 0 ? remainingAmount.toString() : '';
    } else {
      // For recurring payments, use the full amount
      amount = payment.recurring_amount || '';
    }
    
    setPaymentForm({
      amount: amount,
      paymentSource: 'wire',
      notes: ''
    });
    setShowPaymentForm({ payment, type });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadPayments(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentType: '',
      startDate: '',
      endDate: ''
    });
    loadPayments(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#16a34a';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#dc2626';
      case 'active': return '#3b82f6';
      case 'paused': return '#6b7280';
      case 'cancelled': return '#dc2626';
      case 'completed': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'fully_paid': return '#3b82f6';
      case 'installments': return '#f59e0b';
      case 'recurring': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const renderServices = (servicesJson) => {
    if (!servicesJson) return <span style={{ color: '#6b7280', fontSize: '12px' }}>No services</span>;
    
    try {
      const services = JSON.parse(servicesJson);
      if (!Array.isArray(services) || services.length === 0) {
        return <span style={{ color: '#6b7280', fontSize: '12px' }}>No services</span>;
      }
      
      return services.map((service, index) => (
        <div key={index} style={{ 
          display: 'inline-block',
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          margin: '2px 4px 2px 0',
          border: '1px solid #bae6fd',
          cursor: 'pointer',
          position: 'relative'
        }} title={service.details || service.name}>
          {service.name}
        </div>
      ));
    } catch (e) {
      return <span style={{ color: '#6b7280', fontSize: '12px' }}>Invalid services data</span>;
  }
  };

  const renderPaymentDetails = (payment) => {
    return (
          <div style={{ 
            padding: '20px', 
        border: '1px solid #e5e7eb',
            borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{payment.customer_name}</h3>
            <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '14px' }}>{payment.customer_email}</p>
            
            {/* Services Display */}
            <div style={{ margin: '10px 0' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px', fontWeight: '500' }}>Services:</div>
              {renderServices(payment.services)}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginLeft: '20px' }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              backgroundColor: getPaymentTypeColor(payment.payment_type),
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '10px'
            }}>
              {payment.payment_type.toUpperCase()}
            </div>
            
            {/* Sale Details */}
            <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>
              <div>Sale #{payment.id}</div>
              <div>Created: {formatDateTime(payment.created_at)}</div>
              <div>By: {payment.created_by_name || 'Unknown'}</div>
          </div>
        </div>
      </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Total Amount</div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>{formatCurrency(payment.unit_price)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Paid Amount</div>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#16a34a' }}>{formatCurrency(payment.cash_in)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Remaining</div>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#dc2626' }}>{formatCurrency(payment.remaining)}</div>
          </div>
        </div>

        {/* Additional Details */}
            <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 16px',
              backgroundColor: '#f8fafc',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <strong>Created:</strong> {formatDateTime(payment.created_at)} by {payment.created_by_name || 'Unknown'}
            </div>
            {payment.assigned_upseller_name && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <strong>Upseller:</strong> {payment.assigned_upseller_name}
              </div>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            Sale ID: #{payment.id}
          </div>
        </div>

        {/* Installments */}
        {payment.installments && payment.installments.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Installments ({payment.installments.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {payment.installments.map((installment) => (
                    <div key={installment.id} style={{
                  padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                        <div>
                    <div style={{ fontWeight: '500' }}>Installment #{installment.installment_number}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Due: {formatDate(installment.due_date)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500' }}>{formatCurrency(installment.amount)}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Paid: {formatCurrency(installment.paid_amount)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                      Remaining: {formatCurrency(parseFloat(installment.amount) - parseFloat(installment.paid_amount))}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: getStatusColor(installment.status),
                            fontWeight: '500'
                          }}>
                            {installment.status.toUpperCase()}
                          </div>
                        </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => openPaymentForm(installment, 'installment')}
                          disabled={installment.status === 'paid'}
                          style={{
                            backgroundColor: installment.status === 'paid' ? '#6b7280' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                        padding: '4px 8px',
                            borderRadius: '4px',
                        fontSize: '11px',
                            cursor: installment.status === 'paid' ? 'not-allowed' : 'pointer'
                          }}
                        >
                      {installment.status === 'paid' ? 'Paid' : 
                       parseFloat(installment.amount) - parseFloat(installment.paid_amount) > 0 ? 
                       `Pay $${(parseFloat(installment.amount) - parseFloat(installment.paid_amount)).toFixed(2)}` : 'Pay'}
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
                </div>
              )}

        {/* Recurring Payments */}
        {payment.recurring && payment.recurring.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Recurring Payments ({payment.recurring.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {payment.recurring.map((recurring) => (
                    <div key={recurring.id} style={{
                  padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                        <div>
                    <div style={{ fontWeight: '500' }}>{recurring.frequency} Subscription</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Next: {formatDate(recurring.next_payment_date)}
                    </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Progress: {recurring.payments_made}/{recurring.total_payments || '∞'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500' }}>{formatCurrency(recurring.amount)}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: getStatusColor(recurring.status),
                            fontWeight: '500'
                          }}>
                            {recurring.status.toUpperCase()}
                          </div>
                        </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => openPaymentForm(recurring, 'recurring')}
                          disabled={recurring.status !== 'active'}
                          style={{
                            backgroundColor: recurring.status !== 'active' ? '#6b7280' : '#22c55e',
                            color: 'white',
                            border: 'none',
                        padding: '4px 8px',
                            borderRadius: '4px',
                        fontSize: '11px',
                            cursor: recurring.status !== 'active' ? 'not-allowed' : 'pointer'
                          }}
                        >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        {payment.transactions && payment.transactions.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Transaction History ({payment.transactions.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {payment.transactions.map((transaction) => (
                <div key={transaction.id} style={{
                  padding: '10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        {transaction.installment_number ? `Installment #${transaction.installment_number}` : 
                         transaction.recurring_frequency ? `${transaction.recurring_frequency} Payment` : 
                         'Direct Payment'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        via {transaction.payment_source}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Processed by: {transaction.created_by_name}
                        {transaction.received_by_name && ` | Received by: ${transaction.received_by_name}`}
                      </div>
                      {transaction.notes && (
                        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                          Note: {transaction.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '500', color: '#16a34a' }}>{formatCurrency(transaction.amount)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!hasPermission('payments', 'read')) {
      return;
    }
    
    loadPayments();
  }, [hasPermission]);

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return (
      <PageLayout>
        <div>Loading permissions...</div>
      </PageLayout>
    );
  }

  // Check if user has permission to view payments
  if (!hasPermission('payments', 'read')) {
    return (
      <PageLayout>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          <h3>Access Denied</h3>
          <p>You do not have permission to view payments.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '20px' }}>
          <h2>All Payments & Transactions</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
            Comprehensive view of all payment details, transactions, and payment types made by anyone
          </p>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Search</label>
              <input
                type="text"
                placeholder="Customer name, email, or services"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Payment Type</label>
              <select
                value={filters.paymentType}
                onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Types</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="installments">Installments</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={applyFilters}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Apply Filters
                        </button>
                        <button
              onClick={clearFilters}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: '500' }}>Showing {payments.length} of {pagination.total} payments</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Page {pagination.page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => loadPayments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  backgroundColor: pagination.page <= 1 ? '#f3f4f6' : '#3b82f6',
                  color: pagination.page <= 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => loadPayments(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                style={{
                  backgroundColor: pagination.page >= pagination.pages ? '#f3f4f6' : '#3b82f6',
                  color: pagination.page >= pagination.pages ? '#9ca3af' : 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                  cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                          }}
                        >
                Next
                        </button>
                      </div>
                    </div>
                </div>

        {/* Payments List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#6b7280', margin: '0 0 10px 0' }}>No payments found</h3>
            <p style={{ color: '#9ca3af', margin: 0 }}>Try adjusting your filters or check back later.</p>
            </div>
        ) : (
          <div>
            {payments.map((payment) => renderPaymentDetails(payment))}
          </div>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h3 style={{ margin: '0 0 20px 0' }}>Process Payment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Amount {showPaymentForm.type === 'installment' && '(Fixed - Remaining Balance)'}
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={showPaymentForm.type === 'installment' ? undefined : (e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    step="0.01"
                    min="0"
                    readOnly={showPaymentForm.type === 'installment'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: showPaymentForm.type === 'installment' ? '#f9fafb' : 'white',
                      cursor: showPaymentForm.type === 'installment' ? 'not-allowed' : 'text'
                    }}
                  />
                  {showPaymentForm.type === 'installment' && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      This amount is fixed and cannot be changed for installment payments
                </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Payment Source</label>
                  <select
                    value={paymentForm.paymentSource}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentSource: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="wire">Wire</option>
                    <option value="cashapp">CashApp</option>
                    <option value="stripe">Stripe</option>
                    <option value="zelle">Zelle</option>
                    <option value="paypal">PayPal</option>
                    <option value="authorize">Authorize</option>
                    <option value="square">Square</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => processPayment(showPaymentForm.payment.id, showPaymentForm.type)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  );
}