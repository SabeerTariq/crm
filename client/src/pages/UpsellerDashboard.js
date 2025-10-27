import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { hasUpsellerRole } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function UpsellerDashboard() {
  const [dashboardData, setDashboardData] = useState({
    assignedCustomersCount: 0,
    assignedCustomersThisMonth: 0,
    assignedCustomers: [],
    financialData: {
      totalCashIn: 0,
      receivables: 0
    },
    commissionData: {
      currentMonth: {
        wireTransfer: {
          amount: 0,
          count: 0
        },
        zelle: {
          amount: 0,
          count: 0
        },
        total: {
          amount: 0,
          count: 0
        }
      },
      allTime: {
        wireTransfer: {
          amount: 0,
          count: 0
        },
        zelle: {
          amount: 0,
          count: 0
        },
        total: {
          amount: 0,
          count: 0
        }
      }
    },
    chargebackData: {
      currentMonth: {
        chargeback: { count: 0, amount: 0, amount_received: 0 },
        refund: { count: 0, amount: 0, refund_amount: 0 },
        retained: { count: 0, amount: 0 },
        total: { count: 0, amount: 0 }
      },
      pastMonths: {
        chargeback: { count: 0, amount: 0, amount_received: 0 },
        refund: { count: 0, amount: 0, refund_amount: 0 },
        retained: { count: 0, amount: 0 },
        total: { count: 0, amount: 0 }
      },
      total: {
        chargeback: { count: 0, amount: 0, amount_received: 0 },
        refund: { count: 0, amount: 0, refund_amount: 0 },
        retained: { count: 0, amount: 0 },
        total: { count: 0, amount: 0 }
      },
      monthlyBreakdown: {}
    },
    targetData: {
      target: 0,
      achieved: 0,
      remaining: 0,
      progressPercentage: 0
    },
    currentPeriod: {
      year: 2025,
      month: 10,
      monthName: 'October'
    },
    pastMonths: [],
    teamPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Check if user has upseller role
    if (!hasUpsellerRole()) {
      return;
    }
    
    loadDashboardData();
    
    // Listen for storage events (when sales are created in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'salesUpdated' || e.key === 'dashboardRefresh') {
        loadDashboardData(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      
      // Fetch main dashboard data
      const response = await api.get('/upseller/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const dashboardData = response.data.data;
        console.log('=== DASHBOARD DATA DEBUG ===');
        console.log('Full dashboard response:', response.data);
        console.log('Dashboard data:', dashboardData);
        console.log('User ID from dashboard:', dashboardData.userId);
        console.log('User ID type:', typeof dashboardData.userId);
        console.log('=== DASHBOARD DATA DEBUG END ===');
        
        // Ensure we have a valid user ID
        const userId = dashboardData.userId;
        console.log('Using user ID:', userId);
        
        if (!userId) {
          console.error('No user ID available for chargeback API calls');
          return;
        }
        
        // Combine all data
        const combinedData = {
          ...dashboardData,
          currentPeriod: dashboardData.currentPeriod || {
            year: 2025,
            month: 10,
            monthName: 'October'
          },
          chargebackData: {
            currentMonth: {
              chargeback: { count: 0, amount: 0, amount_received: 0 },
              refund: { count: 0, amount: 0, refund_amount: 0 },
              retained: { count: 0, amount: 0 },
              total: { count: 0, amount: 0 }
            },
            pastMonths: {
              chargeback: { count: 0, amount: 0, amount_received: 0 },
              refund: { count: 0, amount: 0, refund_amount: 0 },
              retained: { count: 0, amount: 0 },
              total: { count: 0, amount: 0 }
            },
            total: {
              chargeback: { count: 0, amount: 0, amount_received: 0 },
              refund: { count: 0, amount: 0, refund_amount: 0 },
              retained: { count: 0, amount: 0 },
              total: { count: 0, amount: 0 }
            },
            monthlyBreakdown: {}
          }
        };
        
        // Try to fetch and combine chargeback data
        try {
          console.log('=== CHARGEBACK DEBUG START ===');
          console.log('Fetching chargeback data for user:', userId);
          console.log('API Base URL:', api.defaults.baseURL);
          
          const [currentMonthResponse, totalResponse] = await Promise.all([
            api.get(`/chargeback-refunds/upseller/${userId}?period=current`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            api.get(`/chargeback-refunds/upseller/${userId}?period=total`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          console.log('=== CHARGEBACK API RESPONSES ===');
          console.log('Current Month Response:', currentMonthResponse.data);
          console.log('Total Response:', totalResponse.data);
          
          if (currentMonthResponse.data.success) {
            console.log('Setting current month data:', currentMonthResponse.data.data.stats);
            combinedData.chargebackData.currentMonth = currentMonthResponse.data.data.stats;
          } else {
            console.log('Current month API failed:', currentMonthResponse.data);
          }
          
          if (totalResponse.data.success) {
            console.log('Setting total data:', totalResponse.data.data.stats);
            combinedData.chargebackData.total = totalResponse.data.data.stats;
          } else {
            console.log('Total API failed:', totalResponse.data);
          }
          
          console.log('Final combined chargeback data:', combinedData.chargebackData);
          console.log('=== CHARGEBACK DEBUG END ===');
        } catch (error) {
          console.warn('Chargeback data not available:', error.message);
          console.error('Full error:', error);
          console.error('Error response:', error.response?.data);
        }
        
        setDashboardData(combinedData);
      }
    } catch (error) {
      console.error('Error loading upseller dashboard:', error);
      // Don't show alert for chargeback data errors, just log them
      if (error.response?.config?.url?.includes('chargeback-refunds')) {
        console.warn('Chargeback data not available:', error.message);
      } else {
        alert('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProgressColor = (percentage) => {
    const numPercentage = parseFloat(percentage) || 0;
    if (numPercentage >= 100) return '#10b981';
    if (numPercentage >= 75) return '#f59e0b';
    if (numPercentage >= 50) return '#f97316';
    return '#ef4444';
  };

  const formatPercentage = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue.toFixed(1);
  };

  const formatNumber = (value) => {
    return parseFloat(value) || 0;
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px',
          color: '#64748b'
        }}>
          Loading upseller dashboard...
        </div>
      </PageLayout>
    );
  }

  if (!hasUpsellerRole()) {
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
            <p>You do not have the upseller role required to view this dashboard.</p>
          </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            color: '#1f2937',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Upseller Dashboard
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: '0',
            fontSize: '18px'
          }}>
            Welcome, <strong>{getUserName()}</strong>
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: refreshing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '15px auto 0'
            }}
          >
            <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Main Target Card */}
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              {dashboardData.currentPeriod.monthName} Target
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Track your monthly revenue performance
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            marginBottom: '30px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(formatNumber(dashboardData.targetData.progressPercentage), 100)}%`,
              height: '100%',
              backgroundColor: getProgressColor(dashboardData.targetData.progressPercentage),
              transition: 'width 0.5s ease',
              borderRadius: '6px'
            }} />
          </div>

          {/* Target Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '30px'
          }}>
            {/* Total Target */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {formatCurrency(dashboardData.targetData.target)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Target
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                revenue target
              </div>
            </div>

            {/* Target Achieved */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#16a34a',
                marginBottom: '8px'
              }}>
                {formatCurrency(dashboardData.targetData.achieved)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Target Achieved
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                revenue generated
              </div>
            </div>

            {/* Target Remaining */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: dashboardData.targetData.remaining > 0 ? '#fef3c7' : '#f0fdf4',
              borderRadius: '12px',
              border: `1px solid ${dashboardData.targetData.remaining > 0 ? '#fde68a' : '#bbf7d0'}`
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: dashboardData.targetData.remaining > 0 ? '#d97706' : '#16a34a',
                marginBottom: '8px'
              }}>
                {formatCurrency(dashboardData.targetData.remaining)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Target Remaining
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                {dashboardData.targetData.remaining > 0 ? 'revenue to go' : 'target completed!'}
              </div>
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            padding: '20px', 
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: getProgressColor(dashboardData.targetData.progressPercentage),
              marginBottom: '8px'
            }}>
              {formatPercentage(dashboardData.targetData.progressPercentage)}%
            </div>
            <div style={{ 
              fontSize: '18px', 
              color: '#64748b',
              fontWeight: '600'
            }}>
              Progress Complete
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Financial Overview
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Your current financial performance
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '30px'
          }}>
            {/* Total Receivables */}
            <div style={{
              textAlign: 'center',
            padding: '20px', 
            backgroundColor: '#fef2f2', 
              borderRadius: '12px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#dc2626',
                marginBottom: '8px'
              }}>
              {formatCurrency(dashboardData.financialData.receivables)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Receivables
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                outstanding payments
              </div>
            </div>

            {/* Assigned Customers */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#0ea5e9',
                marginBottom: '8px'
              }}>
                {dashboardData.assignedCustomersCount}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Assigned Customers
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                customers under your care
              </div>
            </div>

            {/* This Month's Assignments */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#16a34a',
                marginBottom: '8px'
              }}>
                {dashboardData.assignedCustomersThisMonth}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                This Month's Assignments
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                new customers this month
              </div>
            </div>
          </div>
        </div>

        {/* Commissions Section */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Commission Payments
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Wire transfer and Zelle payments from your assigned customers
            </p>
          </div>
          
          {/* Current Month Commissions */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              This Month ({dashboardData.currentPeriod.monthName} {dashboardData.currentPeriod.year})
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '30px'
            }}>
              {/* Wire Transfer Payments - Current Month */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#0ea5e9',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.currentMonth.wireTransfer.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Wire Transfer
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.currentMonth.wireTransfer.count} payments
                </div>
              </div>

              {/* Zelle Payments - Current Month */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#16a34a',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.currentMonth.zelle.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Zelle Payments
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.currentMonth.zelle.count} payments
                </div>
              </div>

              {/* Total Commission Payments - Current Month */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#d97706',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.currentMonth.total.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.currentMonth.total.count} total payments
                </div>
              </div>
            </div>
          </div>

          {/* All Time Commissions */}
          <div>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              All Time Performance
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '30px'
            }}>
              {/* Wire Transfer Payments - All Time */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#0ea5e9',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.allTime.wireTransfer.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Wire Transfer
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.allTime.wireTransfer.count} payments
                </div>
              </div>

              {/* Zelle Payments - All Time */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#16a34a',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.allTime.zelle.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Zelle Payments
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.allTime.zelle.count} payments
                </div>
              </div>

              {/* Total Commission Payments - All Time */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: '#d97706',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(dashboardData.commissionData.allTime.total.amount)}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {dashboardData.commissionData.allTime.total.count} total payments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chargeback & Refund Statistics */}
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px'
        }}>
          <h2 style={{ 
            margin: '0 0 30px 0',
            color: '#1f2937',
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            Chargeback & Refund Statistics
          </h2>

          {/* Current Month Chargeback Data */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              margin: '0 0 20px 0',
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Current Month ({dashboardData.currentPeriod.monthName} {dashboardData.currentPeriod.year})
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {/* Chargebacks - Current Month */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#dc2626',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.currentMonth.chargeback.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Chargebacks
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.currentMonth.chargeback.amount)}
                </div>
              </div>

              {/* Refunds - Current Month */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '2px solid #fed7aa',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#d97706',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.currentMonth.refund.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Refunds
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.currentMonth.refund.amount)}
                </div>
              </div>

              {/* Retained - Current Month */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #bbf7d0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#16a34a',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.currentMonth.retained.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Retained
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.currentMonth.retained.amount)}
                </div>
              </div>

              {/* Total - Current Month */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #cbd5e1',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#475569',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.currentMonth.total.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Total Issues
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.currentMonth.total.amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Total All Time Chargeback Data */}
          <div>
            <h3 style={{ 
              margin: '0 0 20px 0',
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Total All Time
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {/* Chargebacks - Total */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#dc2626',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.total.chargeback.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Chargebacks
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.total.chargeback.amount)}
                </div>
              </div>

              {/* Refunds - Total */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '2px solid #fed7aa',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#d97706',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.total.refund.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Refunds
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.total.refund.amount)}
                </div>
              </div>

              {/* Retained - Total */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #bbf7d0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#16a34a',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.total.retained.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Retained
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.total.retained.amount)}
                </div>
              </div>

              {/* Total - All Time */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #cbd5e1',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  color: '#475569',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {dashboardData.chargebackData.total.total.count}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  color: '#64748b',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Total Issues
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af'
                }}>
                  {formatCurrency(dashboardData.chargebackData.total.total.amount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Customers List */}
        {dashboardData.assignedCustomers.length > 0 && (
        <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Your Assigned Customers
              </h2>
              <p style={{ 
              color: '#6b7280',
                margin: '0',
                fontSize: '16px'
            }}>
                {dashboardData.assignedCustomersCount} customers under your management
              </p>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              {dashboardData.assignedCustomers.map((customer) => (
                <div key={customer.customer_id} style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '5px', color: '#1f2937', fontSize: '16px' }}>
                      {customer.customer_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {customer.customer_email} • {customer.customer_phone}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                      Assigned: {new Date(customer.assigned_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a' }}>
                      {formatCurrency(customer.total_sales || 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Total Sales
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

        {/* Empty State for No Customers */}
        {dashboardData.assignedCustomers.length === 0 && (
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '60px 40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              color: '#9ca3af'
            }}>
              👥
            </div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#1f2937',
              fontSize: '20px'
            }}>
              No Customers Assigned
            </h3>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Contact your administrator to get customers assigned to you.
            </p>
          </div>
        )}

        {/* Past Months Performance Section */}
        {dashboardData.pastMonths && dashboardData.pastMonths.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1000px',
            margin: '40px auto 0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Past Months Performance
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Your historical revenue performance overview
              </p>
            </div>

            {/* Past Months Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px'
            }}>
              {dashboardData.pastMonths.map((month, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  {/* Month Header */}
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '12px'
                  }}>
                    {month.monthName} {month.year}
                  </div>

                  {/* Performance Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#3b82f6'
                      }}>
                        {formatCurrency(month.target)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Target
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#16a34a'
                      }}>
                        {formatCurrency(month.achieved)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Achieved
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(formatNumber(month.progressPercentage), 100)}%`,
                      height: '100%',
                      backgroundColor: getProgressColor(month.progressPercentage),
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }} />
                  </div>

                  {/* Progress Percentage */}
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: getProgressColor(month.progressPercentage)
                  }}>
                    {formatPercentage(month.progressPercentage)}%
                  </div>

                  {/* Performance Status */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    marginTop: '4px'
                  }}>
                    {month.achieved >= month.target ? 'Target Met' : 
                     month.achieved >= month.target * 0.8 ? 'Good Progress' : 
                     month.achieved >= month.target * 0.5 ? 'Needs Improvement' : 'Below Target'}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            {dashboardData.pastMonths.length > 0 && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#3b82f6'
                    }}>
                      {dashboardData.pastMonths.length}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Months Tracked
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#16a34a'
                    }}>
                      {formatCurrency(dashboardData.pastMonths.reduce((sum, month) => sum + month.achieved, 0))}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Achieved
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#7c3aed'
                    }}>
                      {formatPercentage(
                        dashboardData.pastMonths.reduce((sum, month) => sum + month.progressPercentage, 0) / dashboardData.pastMonths.length
                      )}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Avg Performance
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#f59e0b'
                    }}>
                      {dashboardData.pastMonths.filter(month => month.achieved >= month.target).length}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Targets Met
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Member Performance and Team Rank Section */}
        {dashboardData.teamPerformance && dashboardData.teamPerformance.length > 0 && (
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1200px',
            margin: '40px auto 0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Team Member Performance & Ranking
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Current month team performance and rankings
              </p>
            </div>

            {/* Team Members Performance Table */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 120px 120px 100px',
                gap: '20px',
                padding: '16px 20px',
                backgroundColor: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
                fontWeight: '600',
                fontSize: '14px',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Rank</div>
                <div>Team Member</div>
                <div>Target</div>
                <div>Achieved</div>
                <div>Progress</div>
                <div>Status</div>
              </div>

              {/* Team Members Rows */}
              {dashboardData.teamPerformance.map((member, index) => (
                <div key={member.userId} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 120px 120px 100px',
                  gap: '20px',
                  padding: '16px 20px',
                  borderBottom: index < dashboardData.teamPerformance.length - 1 ? '1px solid #e2e8f0' : 'none',
                  backgroundColor: '#ffffff',
                  transition: 'background-color 0.2s ease'
                }}>
                  {/* Rank */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: member.teamRank === 1 ? '#fbbf24' : 
                                     member.teamRank === 2 ? '#9ca3af' : 
                                     member.teamRank === 3 ? '#cd7c2f' : '#e5e7eb',
                      color: member.teamRank <= 3 ? '#ffffff' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {member.teamRank}
                    </div>
                  </div>

                  {/* Team Member Info */}
                    <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {member.userName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      textTransform: 'capitalize'
                    }}>
                      {member.teamRole} • {member.email}
                    </div>
                  </div>

                  {/* Target */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {formatCurrency(member.target)}
                      </div>

                  {/* Achieved */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {formatCurrency(member.achieved)}
                      </div>

                  {/* Progress */}
                  <div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      marginBottom: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(formatNumber(member.progressPercentage), 100)}%`,
                        height: '100%',
                        backgroundColor: getProgressColor(member.progressPercentage),
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: getProgressColor(member.progressPercentage),
                      textAlign: 'center'
                    }}>
                      {formatPercentage(member.progressPercentage)}%
                      </div>
                      </div>

                  {/* Status */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: member.achieved >= member.target ? '#dcfce7' : 
                                     member.achieved >= member.target * 0.8 ? '#fef3c7' : 
                                     member.achieved >= member.target * 0.5 ? '#fed7aa' : '#fecaca',
                      color: member.achieved >= member.target ? '#166534' : 
                             member.achieved >= member.target * 0.8 ? '#92400e' : 
                             member.achieved >= member.target * 0.5 ? '#c2410c' : '#dc2626'
                    }}>
                      {member.achieved >= member.target ? 'Target Met' : 
                       member.achieved >= member.target * 0.8 ? 'Good Progress' : 
                       member.achieved >= member.target * 0.5 ? 'Needs Improvement' : 'Below Target'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Summary Stats */}
            {dashboardData.teamPerformance.length > 0 && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#3b82f6'
                    }}>
                      {dashboardData.teamPerformance.length}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Team Members
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#16a34a'
                    }}>
                      {formatCurrency(dashboardData.teamPerformance.reduce((sum, member) => sum + member.achieved, 0))}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Achieved
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#7c3aed'
                    }}>
                      {formatPercentage(
                        dashboardData.teamPerformance.reduce((sum, member) => sum + member.progressPercentage, 0) / dashboardData.teamPerformance.length
                      )}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Avg Performance
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#f59e0b'
                    }}>
                      {dashboardData.teamPerformance.filter(member => member.achieved >= member.target).length}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Targets Met
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Motivational Message */}
        {dashboardData.targetData.remaining > 0 && (
        <div style={{ 
            textAlign: 'center',
            marginTop: '30px',
          padding: '20px',
            backgroundColor: '#fef7ff',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            maxWidth: '600px',
            margin: '30px auto 0'
          }}>
            <div style={{ 
              fontSize: '18px', 
              color: '#7c3aed',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🎯 Keep Going!
            </div>
            <div style={{ 
              fontSize: '16px', 
              color: '#6b7280'
            }}>
              You're {formatPercentage(dashboardData.targetData.progressPercentage)}% of the way to your target. 
              Only {formatCurrency(dashboardData.targetData.remaining)} more to go!
            </div>
          </div>
        )}

        {dashboardData.targetData.remaining <= 0 && dashboardData.targetData.target > 0 && (
          <div style={{
                  textAlign: 'center',
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            maxWidth: '600px',
            margin: '30px auto 0'
          }}>
            <div style={{ 
              fontSize: '18px', 
              color: '#16a34a',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🎉 Congratulations!
          </div>
            <div style={{ 
              fontSize: '16px', 
              color: '#6b7280'
            }}>
              You've exceeded your target! Outstanding performance this month.
        </div>
      </div>
        )}
    </PageLayout>
  );
}