import { useEffect, useState } from 'react';
import api from '../services/api';

export default function UpcomingPayments({ days = 7 }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overduePayments, setOverduePayments] = useState([]);

  useEffect(() => {
    loadUpcomingPayments();
    loadOverduePayments();
  }, [days]);

  const loadUpcomingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/customers/dashboard/upcoming-payments?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading upcoming payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverduePayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customers/dashboard/overdue-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverduePayments(response.data);
    } catch (error) {
      console.error('Error loading overdue payments:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'installment': return '#3b82f6';
      case 'recurring': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading payments...
      </div>
    );
  }

  return (
    <div>
      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>
            ⚠️ Overdue Payments ({overduePayments.length})
          </h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {overduePayments.slice(0, 3).map((payment, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#dc2626' }}>
                    {payment.customer_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {payment.payment_type_category} - Due: {formatDate(payment.due_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#dc2626' }}>
                    {formatCurrency(payment.amount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>
                    {Math.abs(getDaysUntilDue(payment.due_date))} days overdue
                  </div>
                </div>
              </div>
            ))}
            {overduePayments.length > 3 && (
              <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                +{overduePayments.length - 3} more overdue payments
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      <div>
        <h4 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>
          Upcoming Payments ({payments.length})
        </h4>
        {payments.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#6b7280',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            No upcoming payments in the next {days} days
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {payments.map((payment, index) => {
              const daysUntilDue = getDaysUntilDue(payment.due_date);
              const isUrgent = daysUntilDue <= 2;
              
              return (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: isUrgent ? '#fef3c7' : '#f8fafc',
                  border: `1px solid ${isUrgent ? '#fde68a' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ 
                      fontWeight: '500', 
                      color: isUrgent ? '#92400e' : '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {payment.customer_name}
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: getPaymentTypeColor(payment.payment_type_category),
                        color: 'white',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {payment.payment_type_category}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {payment.payment_type_category === 'installment' ? 
                        `Installment #${payment.installment_number}` : 
                        'Recurring Payment'
                      } - Due: {formatDate(payment.due_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: isUrgent ? '#92400e' : '#1f2937'
                    }}>
                      {formatCurrency(payment.amount)}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isUrgent ? '#92400e' : '#6b7280'
                    }}>
                      {daysUntilDue === 0 ? 'Due today' : 
                       daysUntilDue === 1 ? 'Due tomorrow' :
                       daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                       `${daysUntilDue} days`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
