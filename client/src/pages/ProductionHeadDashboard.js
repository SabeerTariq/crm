import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { hasProductionLeadRole } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

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
    recentTasks: []
  });
  const [loading, setLoading] = useState(true);
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
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Don't load if user is a department leader (they will be redirected)
      if (hasProductionLeadRole()) {
        return;
      }
      
      const response = await api.get('/production/production-head/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
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

  const completionRate = dashboardData.overallStats.total_tasks > 0 
    ? Math.round((dashboardData.overallStats.completed_tasks / dashboardData.overallStats.total_tasks) * 100)
    : 0;

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
          Production Head Dashboard
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
          Welcome back, {getUserName()}! Here's your production overview.
        </p>
      </div>

      {/* Overall Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
            {dashboardData.overallStats.total_projects}
          </div>
        </div>

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
            {dashboardData.overallStats.total_tasks}
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
            Completion Rate
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>
            {completionRate}%
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
            Pending Tasks
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>
            {dashboardData.overallStats.pending_tasks}
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
          <h2 style={{
            margin: '0 0 30px 0',
            color: '#1f2937',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Department Performance Metrics
          </h2>

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

