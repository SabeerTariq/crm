import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function CustomerSalesProfile() {
  const { customerId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentSource: 'wire',
    notes: ''
  });

  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (customerId && hasPermission('customers', 'read')) {
      loadCustomerProfile();
    }
  }, [customerId, hasPermission]);

  const loadCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/customers/${customerId}/sales-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading customer profile:', error);
      alert('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let paymentId = '';

      // Determine the correct endpoint based on payment type
      if (selectedPayment.type === 'remaining') {
        endpoint = `/customers/sales/${selectedPayment.id}/process-payment`;
      } else if (selectedPayment.type === 'installment') {
        endpoint = `/payments/installment/${selectedPayment.id}/pay`;
      } else if (selectedPayment.type === 'recurring') {
        endpoint = `/payments/recurring/${selectedPayment.id}/pay`;
      }

      await api.post(endpoint, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentData({ amount: '', paymentSource: 'wire', notes: '' });
      loadCustomerProfile(); // Reload profile
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    }
  };

  const openPaymentModal = (payment, type) => {
    let amount = '';
    if (type === 'remaining') {
      amount = payment.remaining.toString();
    } else if (type === 'installment') {
      amount = (payment.amount - payment.paid_amount).toString();
    } else if (type === 'recurring') {
      amount = payment.amount.toString();
    }

    setSelectedPayment({ ...payment, type });
    setPaymentData({
      amount: amount,
      paymentSource: 'wire',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const downloadAgreement = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/sales/${saleId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Get the original filename from the response headers or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `agreement-${saleId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading agreement:', error);
      alert('Error downloading agreement file');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div>Loading...</div>
      </PageLayout>
    );
  }

  if (!hasPermission('customers', 'read')) {
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
          <p>You do not have permission to view customer profiles.</p>
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div>Customer not found</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Customer Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
            {profile.customer.name}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Sales</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(profile.customer.total_sales)}
              </div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Paid</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                {formatCurrency(profile.customer.total_paid)}
              </div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Remaining</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {formatCurrency(profile.customer.total_remaining)}
              </div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Last Payment</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                {profile.customer.last_payment_date ? formatDate(profile.customer.last_payment_date) : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Customer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Email:</strong> {profile.customer.email}
            </div>
            <div>
              <strong>Phone:</strong> {profile.customer.phone}
            </div>
            <div>
              <strong>Source:</strong> {profile.customer.source}
            </div>
            <div>
              <strong>Converted:</strong> {formatDate(profile.customer.converted_at)}
            </div>
          </div>
          {profile.customer.notes && (
            <div style={{ marginTop: '15px' }}>
              <strong>Notes:</strong> {profile.customer.notes}
            </div>
          )}
          {profile.assignment && (
            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1e40af' }}>Assigned to Upseller:</strong> {profile.assignment.upseller_name}
                {profile.assignment.upseller_email && (
                  <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '8px' }}>
                    ({profile.assignment.upseller_email})
                  </span>
                )}
              </div>
              {profile.assignment.assigned_date && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Assigned on: {formatDate(profile.assignment.assigned_date)}
                  {profile.assignment.created_by_name && (
                    <span> by {profile.assignment.created_by_name}</span>
                  )}
                </div>
              )}
              {profile.assignment.notes && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                  <strong style={{ color: '#1e40af', fontSize: '13px' }}>Upsell Manager Note:</strong>
                  <div style={{ marginTop: '4px', color: '#374151', fontSize: '14px' }}>
                    {profile.assignment.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Payment History</h3>
          {profile.payment_history && profile.payment_history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No payment history found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {profile.payment_history && profile.payment_history.map((payment, index) => (
                <div key={index} style={{ 
                  padding: '15px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                        {payment.installment_number ? `Installment #${payment.installment_number}` : 
                         payment.recurring_frequency ? 'Recurring Payment' : 'Payment'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Sale #{payment.sale_id} - {payment.services ? JSON.parse(payment.services).map(s => s.name).join(', ') : 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Processed by: {payment.processed_by_name || 'System'} | {formatDate(payment.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                        {formatCurrency(payment.amount)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        via {payment.payment_source}
                      </div>
                    </div>
                  </div>
                  {payment.notes && (
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
                      <strong>Notes:</strong> {payment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remaining Payments */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Remaining Payments</h3>
          {profile.remaining_payments && profile.remaining_payments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No remaining payments
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {profile.remaining_payments && profile.remaining_payments.map((sale) => (
                <div key={sale.id} style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>
                        Sale #{sale.id} - {sale.services ? JSON.parse(sale.services).map(s => s.name).join(', ') : 'N/A'}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Created: {formatDate(sale.created_at)} | Type: {sale.payment_type}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                        {formatCurrency(sale.remaining)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Remaining Balance
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Amount</div>
                      <div style={{ fontWeight: '500' }}>{formatCurrency(sale.unit_price)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Paid</div>
                      <div style={{ fontWeight: '500', color: '#16a34a' }}>{formatCurrency(sale.cash_in)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Remaining</div>
                      <div style={{ fontWeight: '500', color: '#dc2626' }}>{formatCurrency(sale.remaining)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Last Payment</div>
                      <div style={{ fontWeight: '500' }}>
                        {sale.last_payment_date ? formatDate(sale.last_payment_date) : 'Never'}
                      </div>
                    </div>
                  </div>

                  {/* Agreement Section */}
                  {sale.agreement_file_name && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
                        Agreement Document
                      </div>
                      <button
                        onClick={() => downloadAgreement(sale.id)}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title={`Download: ${sale.agreement_file_name}`}
                      >
                        📄 Download Agreement
                      </button>
                    </div>
                  )}

                  {hasPermission('sales', 'update') && (
                    <button
                      onClick={() => openPaymentModal(sale, 'remaining')}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Receive Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Installments */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Installments</h3>
          {profile.installments && profile.installments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No installments found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {profile.installments && profile.installments.map((installment) => (
                <div key={installment.id} style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>
                        Installment #{installment.installment_number} - Sale #{installment.sale_id}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {installment.services ? JSON.parse(installment.services).map(s => s.name).join(', ') : 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                        {formatCurrency(installment.amount)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: getStatusColor(installment.status),
                        fontWeight: '500'
                      }}>
                        {getStatusText(installment.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Due Date</div>
                      <div style={{ fontWeight: '500' }}>{formatDate(installment.due_date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Amount</div>
                      <div style={{ fontWeight: '500' }}>{formatCurrency(installment.amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Paid</div>
                      <div style={{ fontWeight: '500', color: '#16a34a' }}>{formatCurrency(installment.paid_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Remaining</div>
                      <div style={{ fontWeight: '500', color: '#dc2626' }}>
                        {formatCurrency(installment.amount - installment.paid_amount)}
                      </div>
                    </div>
                  </div>

                  {hasPermission('payments', 'update') && installment.status !== 'paid' && (
                    <button
                      onClick={() => openPaymentModal(installment, 'installment')}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Receive Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Agreements */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>All Agreements</h3>
          {profile.sales && profile.sales.filter(sale => sale.agreement_file_name).length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No agreements found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {profile.sales && profile.sales
                .filter(sale => sale.agreement_file_name)
                .map((sale) => (
                  <div key={sale.id} style={{ 
                    padding: '20px', 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>
                          Sale #{sale.id} - {sale.services ? JSON.parse(sale.services).map(s => s.name).join(', ') : 'N/A'}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Agreement: {sale.agreement_file_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Created: {formatDate(sale.created_at)} {sale.created_by_name ? `by ${sale.created_by_name}` : ''}
                          {sale.agreement_uploaded_at && ` | Uploaded: ${formatDate(sale.agreement_uploaded_at)}`}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAgreement(sale.id)}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '500'
                        }}
                        title={`Download: ${sale.agreement_file_name}`}
                      >
                        📄 Download Agreement
                      </button>
                    </div>
                    {sale.service_details && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Service Details</div>
                        <div style={{ fontSize: '14px', color: '#374151' }}>{sale.service_details}</div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recurring Payments */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Recurring Payments</h3>
          {profile.recurring_payments && profile.recurring_payments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No recurring payments found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {profile.recurring_payments && profile.recurring_payments.map((recurring) => (
                <div key={recurring.id} style={{ 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>
                        {recurring.frequency} Recurring - Sale #{recurring.sale_id}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {recurring.services ? JSON.parse(recurring.services).map(s => s.name).join(', ') : 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                        {formatCurrency(recurring.amount)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: getStatusColor(recurring.status),
                        fontWeight: '500'
                      }}>
                        {getStatusText(recurring.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Next Payment</div>
                      <div style={{ fontWeight: '500' }}>{formatDate(recurring.next_payment_date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Amount</div>
                      <div style={{ fontWeight: '500' }}>{formatCurrency(recurring.amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Payments Made</div>
                      <div style={{ fontWeight: '500' }}>{recurring.payments_made}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Payments</div>
                      <div style={{ fontWeight: '500' }}>
                        {recurring.total_payments ? recurring.total_payments : 'Unlimited'}
                      </div>
                    </div>
                  </div>

                  {hasPermission('payments', 'update') && recurring.status === 'active' && (
                    <button
                      onClick={() => openPaymentModal(recurring, 'recurring')}
                      style={{
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Receive Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedPayment && (
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
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 20px 0' }}>
                Process Payment - {selectedPayment.type === 'remaining' ? 'Remaining Balance' : 
                                 selectedPayment.type === 'installment' ? `Installment #${selectedPayment.installment_number}` : 
                                 'Recurring Payment'}
              </h3>
              <form onSubmit={handlePaymentSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    {selectedPayment.type === 'remaining' ? `Sale #${selectedPayment.id} - Remaining: ${formatCurrency(selectedPayment.remaining)}` :
                     selectedPayment.type === 'installment' ? `Installment #${selectedPayment.installment_number} - Amount: ${formatCurrency(selectedPayment.amount)}` :
                     `Recurring Payment - Amount: ${formatCurrency(selectedPayment.amount)}`}
                  </label>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedPayment.type === 'remaining' ? selectedPayment.remaining : 
                         selectedPayment.type === 'installment' ? (selectedPayment.amount - selectedPayment.paid_amount) :
                         selectedPayment.amount}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>


                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Payment Source
                  </label>
                  <select
                    value={paymentData.paymentSource}
                    onChange={(e) => setPaymentData({...paymentData, paymentSource: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
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


                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Notes
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      minHeight: '80px'
                    }}
                    placeholder="Optional payment notes..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Process Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </PageLayout>
  );
}