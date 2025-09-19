import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { hasUpsellerRole } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function UpsellerDashboard() {
  const [dashboardData, setDashboardData] = useState({
    assignedCustomersCount: 0,
    assignedCustomers: [],
    financialData: {
      totalCashIn: 0,
      receivables: 0
    },
    targetData: {
      target: 0,
      achieved: 0,
      remaining: 0,
      progressPercentage: 0
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
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Check if user has upseller role
    if (!hasUpsellerRole()) {
      return;
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/upseller/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading upseller dashboard:', error);
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
            gridTemplateColumns: 'repeat(2, 1fr)', 
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
                      Assigned: {new Date(customer.assigned_date).toLocaleDateString()} • Type: {customer.assignment_type}
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