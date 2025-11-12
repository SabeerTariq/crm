import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { hasProductionLeadRole } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';
import { Link } from 'react-router-dom';

export default function ProductionHeadDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    departments: [],
    overallStats: {
      total_projects: 0,
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      avg_completion_time: 0
    },
    departmentStats: [],
    recentTasks: [],
    memberPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deptSelectedMonth, setDeptSelectedMonth] = useState(new Date().getMonth() + 1);
  const [deptSelectedYear, setDeptSelectedYear] = useState(new Date().getFullYear());
  const { loading: permissionsLoading } = usePermissions();

  // Check if user is a department leader and redirect
  useEffect(() => {
    if (hasProductionLeadRole()) {
      const fetchAndRedirect = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await api.get('/production/user/department', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success && response.data.data) {
            navigate(`/department-leader-dashboard/${response.data.data.department_id}`);
          }
        } catch (error) {
          console.error('Error fetching department:', error);
        }
      };

      fetchAndRedirect();
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, deptSelectedMonth, deptSelectedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Don't load if user is a department leader (they will be redirected)
      if (hasProductionLeadRole()) {
        return;
      }
      
      const response = await api.get('/production/production-head/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          month: selectedMonth,
          year: selectedYear,
          deptMonth: deptSelectedMonth,
          deptYear: deptSelectedYear
        }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading production head dashboard:', error);
      // Don't show alert if it's a 403 (not production head)
      if (error.response?.status !== 403) {
        alert('Failed to load dashboard data');
      }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadgeColor = (status) => {
    if (!status) return '#6b7280';
    
    const statusLower = status.toLowerCase();
    const colors = {
      'pending': '#fbbf24',
      'new task': '#fbbf24',
      'in_progress': '#3b82f6',
      'in progress': '#3b82f6',
      'review': '#8b5cf6',
      'revisions': '#8b5cf6',
      'completed': '#10b981',
      'complete': '#10b981',
      'blocked': '#ef4444',
      'on hold': '#ef4444'
    };
    
    // Check exact match first
    if (colors[statusLower]) {
      return colors[statusLower];
    }
    
    // Check partial matches
    if (statusLower.includes('pending') || statusLower.includes('new task')) {
      return colors['pending'];
    }
    if (statusLower.includes('progress') || statusLower.includes('revision')) {
      return colors['in_progress'];
    }
    if (statusLower.includes('review')) {
      return colors['review'];
    }
    if (statusLower.includes('complet')) {
      return colors['completed'];
    }
    if (statusLower.includes('hold') || statusLower.includes('blocked')) {
      return colors['blocked'];
    }
    
    return '#6b7280';
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      'low': '#dbeafe',
      'medium': '#fef3c7',
      'high': '#fee2e2',
      'urgent': '#fecaca'
    };
    return colors[priority] || '#f3f4f6';
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Loading Production Dashboard...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
              Production Head Dashboard
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
              Welcome back, {getUserName()}! Here's your production overview.
            </p>
          </div>
          <Link
            to="/projects"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <i className="fas fa-plus"></i>
            Add New Project
          </Link>
        </div>
      </div>

      {/* Project Statistics */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#1f2937',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Project Statistics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Total Projects
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.total_projects || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              In Progress
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.projects_in_progress || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Pending
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.projects_pending || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Completed
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.projects_completed || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#1f2937',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Task Statistics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Total Tasks
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.total_tasks || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              In Progress
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.tasks_in_progress || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Pending
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.tasks_pending || 0}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Completed
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dashboardData.overallStats.tasks_completed || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Departments Overview */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{
          margin: '0 0 30px 0',
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Departments Overview
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {dashboardData.departments.map(dept => (
            <div key={dept.id} style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                {dept.department_name}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Team Size: </span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{dept.team_size || 0}</span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Active Projects: </span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{dept.active_projects_count || 0}</span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Tasks: </span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>
                  {dept.completed_tasks || 0} completed
                </span>
                {' / '}
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                  {dept.pending_tasks || 0} pending
                </span>
              </div>

              {dept.completed_tasks + dept.pending_tasks > 0 && (
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '8px'
                }}>
                  <div style={{
                    width: `${((dept.completed_tasks || 0) / ((dept.completed_tasks || 0) + (dept.pending_tasks || 0))) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Production Members Performance */}
      {dashboardData.memberPerformance && dashboardData.memberPerformance.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{
              margin: 0,
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Production Members Performance
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const date = new Date(2000, month - 1, 1);
                  return (
                    <option key={month} value={month}>
                      {date.toLocaleString('default', { month: 'long' })}
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {(() => {
              // Group members by department
              const groupedByDept = dashboardData.memberPerformance.reduce((acc, member) => {
                const deptName = member.department_name || 'Unassigned';
                if (!acc[deptName]) {
                  acc[deptName] = [];
                }
                acc[deptName].push(member);
                return acc;
              }, {});

              return (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Member
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Role
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                        Total Tasks
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                        Completed
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(groupedByDept).sort().map((deptName, deptIndex) => (
                      <React.Fragment key={deptName}>
                        <tr style={{
                          backgroundColor: '#f9fafb',
                          borderBottom: '2px solid #e5e7eb'
                        }}>
                          <td colSpan="5" style={{ 
                            padding: '16px 12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            color: '#1f2937'
                          }}>
                            {deptName}
                          </td>
                        </tr>
                        {groupedByDept[deptName].map((member, memberIndex) => (
                          <tr key={member.id || `${deptIndex}-${memberIndex}`} style={{
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <td style={{ padding: '12px' }}>
                              <div>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                  {member.name}
                                </span>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                  {member.email}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#4b5563', textTransform: 'capitalize' }}>
                              {member.role?.replace('_', ' ') || 'N/A'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#1f2937', fontWeight: '600' }}>
                              {member.total_tasks || 0}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                              {member.completed_tasks || 0}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backgroundColor: member.completion_rate >= 75 ? '#d1fae5' : 
                                                member.completion_rate >= 50 ? '#fef3c7' : '#fee2e2',
                                color: member.completion_rate >= 75 ? '#065f46' : 
                                       member.completion_rate >= 50 ? '#92400e' : '#991b1b',
                                fontWeight: '600',
                                fontSize: '12px'
                              }}>
                                {member.completion_rate || 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Department Performance */}
      {dashboardData.departmentStats && dashboardData.departmentStats.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{
              margin: 0,
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Department Performance Metrics
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={deptSelectedMonth}
                onChange={(e) => setDeptSelectedMonth(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const date = new Date(2000, month - 1, 1);
                  return (
                    <option key={month} value={month}>
                      {date.toLocaleString('default', { month: 'long' })}
                    </option>
                  );
                })}
              </select>
              <select
                value={deptSelectedYear}
                onChange={(e) => setDeptSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                    Department
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                    Team Size
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                    Total Tasks
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                    Completed
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                    Completion Rate
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                    Avg Efficiency
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.departmentStats.map((dept, index) => (
                  <tr key={dept.department_id || index} style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {dept.department_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563' }}>
                      {dept.team_size || 0}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563' }}>
                      {dept.total_tasks || 0}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                      {dept.completed_tasks || 0}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: dept.completion_rate >= 75 ? '#d1fae5' : 
                                        dept.completion_rate >= 50 ? '#fef3c7' : '#fee2e2',
                        color: dept.completion_rate >= 75 ? '#065f46' : 
                               dept.completion_rate >= 50 ? '#92400e' : '#991b1b',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {dept.completion_rate || 0}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
                      {dept.avg_efficiency || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Tasks */}
      {dashboardData.allTasks && dashboardData.allTasks.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            margin: '0 0 30px 0',
            color: '#1f2937',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            All Tasks ({dashboardData.allTasks.length})
          </h2>

          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dashboardData.allTasks.map((task, index) => (
              <div key={task.id || index} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                backgroundColor: task.status === 'completed' ? '#f0fdf4' : 'white'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '4px',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                  }}>
                    {task.task_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600' }}>{task.department_name}</span> • {task.project_name}
                    {task.assigned_to_name && ` • Assigned to: ${task.assigned_to_name}`}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {task.due_date && `Due: ${formatDate(task.due_date)}`}
                    {task.created_at && ` • Created: ${formatDate(task.created_at)}`}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: getPriorityBadgeColor(task.priority),
                    color: task.priority === 'urgent' ? '#7f1d1d' :
                           task.priority === 'high' ? '#991b1b' :
                           task.priority === 'medium' ? '#92400e' : '#1e40af',
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {task.priority}
                  </span>
                  
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: getStatusBadgeColor(task.status) + '20',
                    color: getStatusBadgeColor(task.status),
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    borderLeft: `3px solid ${getStatusBadgeColor(task.status)}`
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Members with Tasks and Statistics */}
      {dashboardData.departmentMembersDetails && dashboardData.departmentMembersDetails.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            margin: '0 0 30px 0',
            color: '#1f2937',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Department Members & Tasks Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {dashboardData.departmentMembersDetails.map((member, index) => (
              <div key={member.id || index} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '18px',
                    marginRight: '12px'
                  }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email}</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginTop: '4px' }}>
                      {member.department_name} • {member.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Completed</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {member.tasks_completed || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Pending</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                      {member.tasks_pending || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Tasks</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      {member.total_tasks || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Efficiency</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                      {member.efficiency_score || 0}%
                    </div>
                  </div>
                </div>

                {/* Assigned Tasks */}
                {member.assigned_tasks && member.assigned_tasks.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                      Assigned Tasks ({member.assigned_tasks.length})
                    </div>
                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {member.assigned_tasks.map((task, taskIndex) => (
                        <div key={task.id || taskIndex} style={{
                          padding: '10px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          borderLeft: `3px solid ${getStatusBadgeColor(task.status)}`
                        }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '6px', fontSize: '14px' }}>
                            {task.task_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                            {task.project_name} • {task.department_name}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: getStatusBadgeColor(task.status) + '20',
                              color: getStatusBadgeColor(task.status),
                              fontWeight: '600',
                              fontSize: '11px',
                              textTransform: 'capitalize'
                            }}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.priority && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: getPriorityBadgeColor(task.priority),
                                color: task.priority === 'urgent' ? '#7f1d1d' :
                                       task.priority === 'high' ? '#991b1b' :
                                       task.priority === 'medium' ? '#92400e' : '#1e40af',
                                fontWeight: '600',
                                fontSize: '11px',
                                textTransform: 'capitalize'
                              }}>
                                {task.priority}
                              </span>
                            )}
                            {task.due_date && (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                Due: {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    No tasks assigned
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

