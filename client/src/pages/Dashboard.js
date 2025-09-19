import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import UpcomingPayments from '../components/UpcomingPayments';
import { getUserName } from '../utils/userUtils';
import { usePermissions } from '../hooks/usePermissions';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (hasPermission('sales', 'read')) {
      loadDashboardStats();
    }
  }, [hasPermission]);

  const loadDashboardStats = async () => {
    try {
      // This would typically come from a dashboard API endpoint
      // For now, we'll set some placeholder values
      setStats({
        totalSales: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        pendingPayments: 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div>Loading dashboard...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '30px' }}>
          <h2>Welcome to CRM Dashboard</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
            Hello, <strong>{getUserName()}</strong>
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.totalSales}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Sales</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0fdf4', 
            borderRadius: '8px', 
            border: '1px solid #bbf7d0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px', 
            border: '1px solid #bae6fd',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0ea5e9' }}>
              {stats.totalCustomers}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Customers</div>
          </div>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px', 
            border: '1px solid #fde68a',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.pendingPayments}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Pending Payments</div>
          </div>
        </div>

        {/* Upcoming Payments Widget */}
        {hasPermission('customers', 'read') && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Payment Overview</h3>
            <UpcomingPayments days={7} />
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {hasPermission('sales', 'create') && (
              <a 
                href="/sales" 
                style={{
                  padding: '15px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                Add New Sale
              </a>
            )}
            {hasPermission('leads', 'create') && (
              <a 
                href="/leads" 
                style={{
                  padding: '15px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                Add New Lead
              </a>
            )}
            {hasPermission('customers', 'read') && (
              <a 
                href="/customers" 
                style={{
                  padding: '15px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                View Customers
              </a>
            )}
          </div>
        </div>
    </PageLayout>
  );
}
