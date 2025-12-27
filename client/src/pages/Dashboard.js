import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import UpcomingPayments from '../components/UpcomingPayments';
import { getUserName } from '../utils/userUtils';
import { usePermissions } from '../hooks/usePermissions';
import { isAdmin } from '../utils/roleUtils';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingPayments: 0
  });
  const [allScrapersPerformance, setAllScrapersPerformance] = useState([]);
  const [loadingScrapersPerformance, setLoadingScrapersPerformance] = useState(false);
  const [loading, setLoading] = useState(true);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (hasPermission('sales', 'read')) {
      loadDashboardStats();
    }
    
    // Load all scrapers performance if admin
    if (isAdmin()) {
      loadAllScrapersPerformance();
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

  const loadAllScrapersPerformance = async () => {
    try {
      setLoadingScrapersPerformance(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await api.get('/dashboard/all-scrapers-performance', { headers });
      
      if (response.data.success) {
        setAllScrapersPerformance(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading all scrapers performance:', error);
    } finally {
      setLoadingScrapersPerformance(false);
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

        {/* All Scrapers Performance Section - Admin Only */}
        {isAdmin() && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginTop: '30px'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Lead Scraper Performance
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Overview of all lead scrapers' performance metrics
              </p>
            </div>

            {loadingScrapersPerformance ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Loading scrapers performance...
              </div>
            ) : allScrapersPerformance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No scrapers found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Scraper</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Current Month</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Leads Added</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Leads Converted</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Conversion Rate</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>All Time Total</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>All Time Converted</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Overall Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allScrapersPerformance.map((scraper, index) => (
                      <tr key={scraper.id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}>
                        <td style={{
                          padding: '16px',
                          fontWeight: '500',
                          color: '#1f2937'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {scraper.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {scraper.email}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.currentMonthLeadsAdded > 0 ? '#dbeafe' : '#f3f4f6',
                            color: scraper.currentMonthLeadsAdded > 0 ? '#1e40af' : '#6b7280',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.currentMonthLeadsAdded}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#3b82f6',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {scraper.totalLeadsAdded.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#16a34a',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {scraper.totalLeadsConverted.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.currentMonthConversionRate >= 10 ? '#d1fae5' : scraper.currentMonthConversionRate >= 5 ? '#fef3c7' : '#fee2e2',
                            color: scraper.currentMonthConversionRate >= 10 ? '#065f46' : scraper.currentMonthConversionRate >= 5 ? '#92400e' : '#991b1b',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.currentMonthConversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {scraper.totalLeadsAdded.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {scraper.totalLeadsConverted.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.overallConversionRate >= 10 ? '#d1fae5' : scraper.overallConversionRate >= 5 ? '#fef3c7' : '#fee2e2',
                            color: scraper.overallConversionRate >= 10 ? '#065f46' : scraper.overallConversionRate >= 5 ? '#92400e' : '#991b1b',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.overallConversionRate.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </PageLayout>
  );
}
