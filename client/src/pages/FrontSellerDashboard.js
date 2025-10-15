import { useEffect, useState } from 'react';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function FrontSellerDashboard() {
  const [stats, setStats] = useState({
    currentTarget: {
      target: 0,
      achieved: 0,
      remaining: 0,
      progressPercentage: 0
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
    currentPeriod: {
      year: 2025,
      month: 1,
      monthName: 'January'
    },
    pastMonths: [],
    teamPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFrontSellerStats = async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await api.get('/dashboard/front-seller/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract all dashboard data including commission data
        setStats({
          currentTarget: response.data.currentTarget || {
            target: 0,
            achieved: 0,
            remaining: 0,
            progressPercentage: 0
          },
          commissionData: response.data.commissionData || {
            currentMonth: {
              wireTransfer: { amount: 0, count: 0 },
              zelle: { amount: 0, count: 0 },
              total: { amount: 0, count: 0 }
            },
            allTime: {
              wireTransfer: { amount: 0, count: 0 },
              zelle: { amount: 0, count: 0 },
              total: { amount: 0, count: 0 }
            }
          },
          currentPeriod: response.data.currentPeriod || {
            year: 2025,
            month: 1,
            monthName: 'January'
          },
          pastMonths: response.data.pastMonths || [],
          teamPerformance: response.data.teamPerformance || []
        });
      } catch (err) {
        console.error('Error fetching front seller stats:', err);
        setError(err.response?.data?.message || 'Failed to load target information');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchFrontSellerStats();
    
    // Listen for storage events (when sales are created in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'salesUpdated' || e.key === 'dashboardRefresh') {
        fetchFrontSellerStats(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchFrontSellerStats(true);
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
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
          Loading target information...
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
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
            Front Seller Dashboard
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: '0',
            fontSize: '18px'
          }}>
            Welcome, <strong>{getUserName()}</strong>
          </p>
          
          {/* Refresh Button */}
          <button
            onClick={() => {
              const fetchFrontSellerStats = async (isRefresh = false) => {
                try {
                  if (isRefresh) {
                    setRefreshing(true);
                  } else {
                    setLoading(true);
                  }
                  setError(null);
                  
                  const token = localStorage.getItem('token');
                  const response = await api.get('/dashboard/front-seller/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  setStats({
                    currentTarget: response.data.currentTarget || {
                      target: 0,
                      achieved: 0,
                      remaining: 0,
                      progressPercentage: 0
                    },
                    commissionData: response.data.commissionData || {
                      currentMonth: {
                        wireTransfer: { amount: 0, count: 0 },
                        zelle: { amount: 0, count: 0 },
                        total: { amount: 0, count: 0 }
                      },
                      allTime: {
                        wireTransfer: { amount: 0, count: 0 },
                        zelle: { amount: 0, count: 0 },
                        total: { amount: 0, count: 0 }
                      }
                    },
                    currentPeriod: response.data.currentPeriod || {
                      year: 2025,
                      month: 1,
                      monthName: 'January'
                    },
                    pastMonths: response.data.pastMonths || [],
                    teamPerformance: response.data.teamPerformance || []
                  });
                } catch (err) {
                  console.error('Error fetching front seller stats:', err);
                  setError(err.response?.data?.message || 'Failed to load target information');
                } finally {
                  setLoading(false);
                  setRefreshing(false);
                }
              };
              fetchFrontSellerStats(true);
            }}
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
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              {stats.currentPeriod.monthName} Target
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Track your monthly performance
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
              width: `${Math.min(formatNumber(stats.currentTarget.progressPercentage), 100)}%`,
              height: '100%',
              backgroundColor: getProgressColor(stats.currentTarget.progressPercentage),
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
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {stats.currentTarget.target}
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
                customers to convert
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
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#16a34a',
                marginBottom: '8px'
              }}>
                {stats.currentTarget.achieved}
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
                customers converted
              </div>
            </div>

            {/* Target Remaining */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: stats.currentTarget.remaining > 0 ? '#fef3c7' : '#f0fdf4',
              borderRadius: '12px',
              border: `1px solid ${stats.currentTarget.remaining > 0 ? '#fde68a' : '#bbf7d0'}`
            }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: stats.currentTarget.remaining > 0 ? '#d97706' : '#16a34a',
                marginBottom: '8px'
              }}>
                {stats.currentTarget.remaining}
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
                {stats.currentTarget.remaining > 0 ? 'customers to go' : 'target completed!'}
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
              color: getProgressColor(stats.currentTarget.progressPercentage),
              marginBottom: '8px'
            }}>
              {formatPercentage(stats.currentTarget.progressPercentage)}%
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

        {/* Commissions Section */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '40px auto'
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
              Wire transfer and Zelle payments from your converted customers
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
              This Month ({stats.currentPeriod.monthName} {stats.currentPeriod.year})
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
                  {formatCurrency(stats.commissionData?.currentMonth?.wireTransfer?.amount || 0)}
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
                  {stats.commissionData?.currentMonth?.wireTransfer?.count || 0} payments
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
                  {formatCurrency(stats.commissionData?.currentMonth?.zelle?.amount || 0)}
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
                  {stats.commissionData?.currentMonth?.zelle?.count || 0} payments
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
                  {formatCurrency(stats.commissionData?.currentMonth?.total?.amount || 0)}
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
                  {stats.commissionData?.currentMonth?.total?.count || 0} total payments
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
                  {formatCurrency(stats.commissionData?.allTime?.wireTransfer?.amount || 0)}
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
                  {stats.commissionData?.allTime?.wireTransfer?.count || 0} payments
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
                  {formatCurrency(stats.commissionData?.allTime?.zelle?.amount || 0)}
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
                  {stats.commissionData?.allTime?.zelle?.count || 0} payments
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
                  {formatCurrency(stats.commissionData?.allTime?.total?.amount || 0)}
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
                  {stats.commissionData?.allTime?.total?.count || 0} total payments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {stats.currentTarget.remaining > 0 && (
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
              You're {formatPercentage(stats.currentTarget.progressPercentage)}% of the way to your target. 
              Only {stats.currentTarget.remaining} more customers to go!
            </div>
          </div>
        )}

        {stats.currentTarget.remaining <= 0 && stats.currentTarget.target > 0 && (
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

        {/* Past Months Performance Section */}
        {stats.pastMonths && stats.pastMonths.length > 0 && (
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
                Your historical performance overview
              </p>
            </div>

            {/* Past Months Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px'
            }}>
              {stats.pastMonths.map((month, index) => (
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
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: '#3b82f6'
                      }}>
                        {month.target}
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
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: '#16a34a'
                      }}>
                        {month.achieved}
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
            {stats.pastMonths.length > 0 && (
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
                      {stats.pastMonths.length}
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
                      {stats.pastMonths.reduce((sum, month) => sum + month.achieved, 0)}
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
                        stats.pastMonths.reduce((sum, month) => sum + month.progressPercentage, 0) / stats.pastMonths.length
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
                      {stats.pastMonths.filter(month => month.achieved >= month.target).length}
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

        {/* Team Performance and Ranking Section */}
        {stats.teamPerformance && stats.teamPerformance.length > 0 && (
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
                Team Performance & Ranking
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
                gridTemplateColumns: '60px 1fr 100px 100px 120px 100px',
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
              {stats.teamPerformance.map((member, index) => (
                <div key={member.userId} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 100px 120px 100px',
                  gap: '20px',
                  padding: '16px 20px',
                  borderBottom: index < stats.teamPerformance.length - 1 ? '1px solid #e2e8f0' : 'none',
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
                    {member.target}
                  </div>

                  {/* Achieved */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {member.achieved}
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
            {stats.teamPerformance.length > 0 && (
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
                      {stats.teamPerformance.length}
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
                      {stats.teamPerformance.reduce((sum, member) => sum + member.achieved, 0)}
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
                        stats.teamPerformance.reduce((sum, member) => sum + member.progressPercentage, 0) / stats.teamPerformance.length
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
                      {stats.teamPerformance.filter(member => member.achieved >= member.target).length}
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
    </PageLayout>
  );
}