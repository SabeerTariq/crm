import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function DepartmentLeaderDashboard() {
  const { departmentId } = useParams();
  const [dashboardData, setDashboardData] = useState({
    department: null,
    teamMembers: [],
    tasks: [],
    stats: {
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      team_size: 0,
      avg_efficiency: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (departmentId) {
      loadDashboardData();
      
      // Listen for storage events (when tasks are updated in other tabs)
      const handleStorageChange = (e) => {
        if (e.key === 'tasksUpdated' || e.key === 'dashboardRefresh') {
          loadDashboardData();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(refreshInterval);
      };
    }
  }, [departmentId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/production/leader/dashboard?department_id=${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading department leader dashboard:', error);
      // Don't show alert on refresh, only on initial load
      if (!loading) {
        alert('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
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

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#3b82f6',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const normalizeStatus = (taskStatus) => {
    if (!taskStatus) return '';
    const statusLower = taskStatus.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('new task')) return 'pending';
    if (statusLower.includes('progress') || statusLower.includes('revision')) return 'in_progress';
    if (statusLower.includes('review')) return 'review';
    if (statusLower.includes('complet')) return 'completed';
    return statusLower;
  };

  const filterTasksByStatus = (status) => {
    return dashboardData.tasks.filter(task => {
      const normalized = normalizeStatus(task.status);
      // Map normalized to expected status
      if (status === 'pending') {
        return normalized === 'pending' || task.status === status;
      }
      if (status === 'in_progress') {
        return normalized === 'in_progress' || task.status === status;
      }
      if (status === 'review') {
        return normalized === 'review' || task.status === status;
      }
      if (status === 'completed') {
        return normalized === 'completed' || task.status === status;
      }
      return task.status === status;
    });
  };

  if (loading) {
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
          Loading Department Dashboard...
        </div>
      </PageLayout>
    );
  }

  const completionRate = dashboardData.stats.total_tasks > 0
    ? Math.round((dashboardData.stats.completed_tasks / dashboardData.stats.total_tasks) * 100)
    : 0;

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
          {dashboardData.department?.department_name || 'Department'} Dashboard
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
          Welcome back, {getUserName()}! Manage your team and track progress.
        </p>
      </div>

      {/* Statistics Cards */}
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
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Tasks</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.total_tasks}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Team Size</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.team_size}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Completed</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.completed_tasks}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Completion Rate</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{completionRate}%</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Avg Efficiency</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.avg_efficiency}%</div>
        </div>
      </div>

      {/* Team Members */}
      {dashboardData.teamMembers && dashboardData.teamMembers.length > 0 && (
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
            Team Members Performance
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {dashboardData.teamMembers.map((member, index) => (
              <div key={member.id || index} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    marginRight: '12px'
                  }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1f2937' }}>{member.name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>
                      {member.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Tasks Completed</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                    {member.tasks_completed || 0}
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Tasks Pending</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                    {member.tasks_pending || 0}
                  </div>
                </div>

                {/* Show assigned tasks */}
                {member.assigned_tasks && member.assigned_tasks.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                      Assigned Tasks ({member.assigned_tasks.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                      {member.assigned_tasks.slice(0, 5).map((task, taskIndex) => (
                        <div key={task.id || taskIndex} style={{
                          padding: '6px 8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          fontSize: '12px',
                          borderLeft: `3px solid ${getStatusBadgeColor(task.status)}`
                        }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                            {task.task_name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: '#6b7280' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: getStatusBadgeColor(task.status) + '20',
                              color: getStatusBadgeColor(task.status),
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.priority && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: getPriorityColor(task.priority) + '20',
                                color: getPriorityColor(task.priority),
                                fontWeight: '600',
                                textTransform: 'capitalize'
                              }}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {member.assigned_tasks.length > 5 && (
                        <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                          +{member.assigned_tasks.length - 5} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Efficiency</div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${parseFloat(member.efficiency_score) || 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>
                    {member.efficiency_score || 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          margin: '0 0 30px 0',
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Department Tasks Kanban Board
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Pending Column */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#fbbf24',
                marginRight: '8px'
              }} />
              <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '700' }}>
                Pending ({filterTasksByStatus('pending').length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filterTasksByStatus('pending').map((task, index) => (
                <div key={task.id || index} style={{
                  backgroundColor: 'white',
                  border: '2px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                    {task.task_name}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {task.description.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: getPriorityColor(task.priority) + '20',
                      color: getPriorityColor(task.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <i className="fas fa-calendar"></i> {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  {task.assigned_to_name && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <i className="fas fa-user"></i> {task.assigned_to_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                marginRight: '8px'
              }} />
              <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '700' }}>
                In Progress ({filterTasksByStatus('in_progress').length + filterTasksByStatus('review').filter(t => {
                  const status = (t.status || '').toLowerCase();
                  return status.includes('revision');
                }).length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...filterTasksByStatus('in_progress'), ...filterTasksByStatus('review').filter(t => {
                const status = (t.status || '').toLowerCase();
                return status.includes('revision');
              })].map((task, index) => (
                <div key={task.id || index} style={{
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                    {task.task_name}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {task.description.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: getPriorityColor(task.priority) + '20',
                      color: getPriorityColor(task.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <i className="fas fa-calendar"></i> {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  {task.assigned_to_name && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <i className="fas fa-user"></i> {task.assigned_to_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Review Column */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                marginRight: '8px'
              }} />
              <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '700' }}>
                Review ({filterTasksByStatus('review').filter(t => {
                  const status = (t.status || '').toLowerCase();
                  return !status.includes('revision');
                }).length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filterTasksByStatus('review').filter(t => {
                const status = (t.status || '').toLowerCase();
                return !status.includes('revision');
              }).map((task, index) => (
                <div key={task.id || index} style={{
                  backgroundColor: 'white',
                  border: '2px solid #8b5cf6',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                    {task.task_name}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {task.description.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: getPriorityColor(task.priority) + '20',
                      color: getPriorityColor(task.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <i className="fas fa-calendar"></i> {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  {task.assigned_to_name && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <i className="fas fa-user"></i> {task.assigned_to_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                marginRight: '8px'
              }} />
              <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '700' }}>
                Completed ({filterTasksByStatus('completed').length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filterTasksByStatus('completed').map((task, index) => (
                <div key={task.id || index} style={{
                  backgroundColor: 'white',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: 0.8
                }}>
                  <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '8px', textDecoration: 'line-through' }}>
                    {task.task_name}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {task.description.substring(0, 100)}...
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: getPriorityColor(task.priority) + '20',
                      color: getPriorityColor(task.priority),
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <i className="fas fa-calendar"></i> {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                  {task.assigned_to_name && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <i className="fas fa-user"></i> {task.assigned_to_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
