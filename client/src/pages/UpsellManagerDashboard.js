import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { hasUpsellerManagerRole } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function UpsellManagerDashboard() {
  const [dashboardData, setDashboardData] = useState({
    period: { type: 'this_month', label: 'This Month', startDate: '', endDate: '' },
    teamTotals: {
      totalCustomers: 0,
      periodCustomers: 0,
      totalSales: 0,
      totalRevenue: 0,
      cashReceived: 0,
      receivables: 0,
      target: 0,
      achieved: 0,
      progressPercentage: 0
    },
    upsellers: [],
    summary: {
      totalUpsellers: 0,
      topPerformer: null,
      averagePerformance: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Check if user has upseller manager role
    if (!hasUpsellerManagerRole()) {
      return;
    }
    
    loadDashboardData();
  }, [selectedPeriod, customYear, customMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `/upseller/manager/dashboard?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom') {
        url += `&year=${customYear}&month=${customMonth}`;
      }
      
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading upsell manager dashboard:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
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
          Loading upsell manager dashboard...
        </div>
      </PageLayout>
    );
  }

  if (!hasUpsellerManagerRole()) {
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
            <p>You do not have the upseller manager role required to view this dashboard.</p>
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
            Upsell Manager Dashboard
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: '0',
            fontSize: '18px'
          }}>
            Welcome, <strong>{getUserName()}</strong>
          </p>
        </div>

        {/* Period Filter */}
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Analytics Period
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Select the time period for analytics
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {[
              { value: 'this_month', label: 'This Month' },
              { value: 'this_year', label: 'This Year' },
              { value: 'all_time', label: 'All Time' },
              { value: 'custom', label: 'Custom Month' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: selectedPeriod === period.value ? '#3b82f6' : '#f8fafc',
                  color: selectedPeriod === period.value ? '#ffffff' : '#374151',
                  border: `2px solid ${selectedPeriod === period.value ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Custom Date Selector */}
          {selectedPeriod === 'custom' && (
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Year
                </label>
                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Month
                </label>
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const monthName = new Date(2024, i).toLocaleString('default', { month: 'long' });
                    return (
                      <option key={month} value={month}>{monthName}</option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
              📊 {dashboardData.period.label}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              {dashboardData.period.startDate} to {dashboardData.period.endDate}
            </div>
          </div>
        </div>

        {/* Team Overview */}
        <div style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '1200px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Overview
            </h2>
          </div>

          {/* Team Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Total Customers */}
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
                {dashboardData.teamTotals.totalCustomers}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Assigned Customers
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                across all upsellers
              </div>
            </div>

            {/* Period Customers */}
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
                {dashboardData.teamTotals.periodCustomers}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Period Assigned Customers
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                assigned in {dashboardData.period.label.toLowerCase()}
              </div>
            </div>

            {/* Total Revenue */}
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
                {formatCurrency(dashboardData.teamTotals.totalRevenue)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Revenue
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                generated in period
              </div>
            </div>

            {/* Cash Received */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#dcfce7',
              borderRadius: '12px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#16a34a',
                marginBottom: '8px'
              }}>
                {formatCurrency(dashboardData.teamTotals.cashReceived)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Cash Received
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                payments collected
              </div>
            </div>

            {/* Receivables */}
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
                {formatCurrency(dashboardData.teamTotals.receivables)}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Receivables
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                outstanding payments
              </div>
            </div>

            {/* Team Progress */}
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
                color: getProgressColor(dashboardData.teamTotals.progressPercentage),
                marginBottom: '8px'
              }}>
                {formatPercentage(dashboardData.teamTotals.progressPercentage)}%
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#64748b',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Team Progress
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                target achievement
              </div>
            </div>
          </div>

          {/* Team Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(formatNumber(dashboardData.teamTotals.progressPercentage), 100)}%`,
              height: '100%',
              backgroundColor: getProgressColor(dashboardData.teamTotals.progressPercentage),
              transition: 'width 0.5s ease',
              borderRadius: '6px'
            }} />
          </div>

          {/* Team Summary */}
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
                {dashboardData.summary.totalUpsellers}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Upsellers
              </div>
            </div>
            <div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#16a34a'
              }}>
                {dashboardData.summary.topPerformer ? dashboardData.summary.topPerformer.upsellerName : 'N/A'}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Top Performer
              </div>
            </div>
            <div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#7c3aed'
              }}>
                {formatPercentage(dashboardData.summary.averagePerformance)}%
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
          </div>
        </div>

        {/* Individual Upseller Performance */}
        {dashboardData.upsellers.length > 0 && (
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Individual Upseller Performance
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Detailed analytics for each upseller
              </p>
            </div>

            {/* Upsellers Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '20px'
            }}>
              {dashboardData.upsellers.map((upseller, index) => (
                <div key={upseller.upsellerId} style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  {/* Upseller Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        #{index + 1} {upseller.upsellerName}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280'
                      }}>
                        {upseller.upsellerEmail}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: getProgressColor(upseller.metrics.progressPercentage) === '#10b981' ? '#dcfce7' :
                                      getProgressColor(upseller.metrics.progressPercentage) === '#f59e0b' ? '#fef3c7' :
                                      getProgressColor(upseller.metrics.progressPercentage) === '#f97316' ? '#fed7aa' : '#fecaca',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: getProgressColor(upseller.metrics.progressPercentage) === '#10b981' ? '#166534' :
                             getProgressColor(upseller.metrics.progressPercentage) === '#f59e0b' ? '#92400e' :
                             getProgressColor(upseller.metrics.progressPercentage) === '#f97316' ? '#c2410c' : '#dc2626'
                    }}>
                      {formatPercentage(upseller.metrics.progressPercentage)}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(formatNumber(upseller.metrics.progressPercentage), 100)}%`,
                      height: '100%',
                      backgroundColor: getProgressColor(upseller.metrics.progressPercentage),
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }} />
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '15px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#3b82f6'
                      }}>
                        {upseller.metrics.totalCustomers}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total Assigned Customers
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#16a34a'
                      }}>
                        {upseller.metrics.periodCustomers}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Period Assigned Customers
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#dc2626'
                      }}>
                        {formatCurrency(upseller.metrics.receivables)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Receivables
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#7c3aed'
                      }}>
                        {upseller.metrics.totalSales}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total Sales
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#3b82f6'
                      }}>
                        {formatCurrency(upseller.metrics.target)}
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
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#16a34a'
                      }}>
                        {formatCurrency(upseller.metrics.achieved)}
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {dashboardData.upsellers.length === 0 && (
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
              📊
            </div>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#1f2937',
              fontSize: '20px'
            }}>
              No Upsellers Found
            </h3>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              No upsellers are currently assigned to the system.
            </p>
          </div>
        )}
    </PageLayout>
  );
}
