import { useEffect, useState } from 'react';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function TeamMemberDashboard() {
  const [dashboardData, setDashboardData] = useState({
    department: null,
    tasks: [],
    stats: {
      tasks_completed: 0,
      tasks_pending: 0,
      total_tasks: 0,
      efficiency_score: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed

  useEffect(() => {
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
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/production/member/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading team member dashboard:', error);
      // Don't show alert on refresh, only on initial load
      if (!loading) {
        alert('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
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

  const getStatusBadgeColor = (status) => {
    if (!status) return { bg: '#f3f4f6', color: '#374151', icon: '📋' };
    
    const statusLower = status.toLowerCase();
    const colors = {
      'pending': { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      'new task': { bg: '#fef3c7', color: '#92400e', icon: '⏳' },
      'in_progress': { bg: '#dbeafe', color: '#1e40af', icon: '🔄' },
      'in progress': { bg: '#dbeafe', color: '#1e40af', icon: '🔄' },
      'review': { bg: '#e9d5ff', color: '#6b21a8', icon: '👀' },
      'revisions': { bg: '#e9d5ff', color: '#6b21a8', icon: '👀' },
      'completed': { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      'complete': { bg: '#d1fae5', color: '#065f46', icon: '✅' },
      'blocked': { bg: '#fee2e2', color: '#991b1b', icon: '🚫' },
      'on hold': { bg: '#fee2e2', color: '#991b1b', icon: '🚫' }
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
    
    return { bg: '#f3f4f6', color: '#374151', icon: '📋' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const normalizeStatus = (status) => {
    if (!status) return '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending') || statusLower === 'new task' || statusLower.includes('new task')) {
      return 'pending';
    }
    if (statusLower.includes('progress') || statusLower.includes('revision')) {
      return 'in_progress';
    }
    if (statusLower.includes('review')) {
      return 'review';
    }
    if (statusLower.includes('complet')) {
      return 'completed';
    }
    return statusLower;
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return dashboardData.tasks;
    return dashboardData.tasks.filter(task => {
      const normalizedStatus = normalizeStatus(task.status);
      return normalizedStatus === filter || task.status === filter;
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
          Loading Your Dashboard...
        </div>
      </PageLayout>
    );
  }

  const efficiency = parseFloat(dashboardData.stats.efficiency_score) || 0;
  const progressPercentage = dashboardData.stats.total_tasks > 0
    ? Math.round((dashboardData.stats.tasks_completed / dashboardData.stats.total_tasks) * 100)
    : 0;

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
          My Production Dashboard
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
          Welcome back, {getUserName()}! Here's your task overview from {dashboardData.department?.name || 'your department'}.
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
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Completed</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.tasks_completed}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Pending</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{dashboardData.stats.tasks_pending}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          padding: '24px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Efficiency</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{efficiency}%</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Task Progress
        </h2>
        
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', color: '#6b7280' }}>Overall Completion</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>{progressPercentage}%</span>
        </div>
        
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e5e7eb',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>
              {dashboardData.stats.tasks_completed} / {dashboardData.stats.total_tasks}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {['all', 'pending', 'in_progress', 'completed'].map(status => {
          const normalizeStatus = (taskStatus) => {
            if (!taskStatus) return '';
            const statusLower = taskStatus.toLowerCase();
            if (statusLower.includes('pending') || statusLower.includes('new task')) return 'pending';
            if (statusLower.includes('progress') || statusLower.includes('revision')) return 'in_progress';
            if (statusLower.includes('complet')) return 'completed';
            return statusLower;
          };
          
          const count = dashboardData.tasks.filter(t => {
            const normalized = normalizeStatus(t.status);
            return normalized === status || t.status === status;
          }).length;
          
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: filter === status 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'white',
                color: filter === status ? 'white' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `2px solid ${filter === status ? 'transparent' : '#e2e8f0'}`,
                textTransform: 'capitalize'
              }}
            >
              {status.replace('_', ' ')}
              {status !== 'all' && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: filter === status ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                  color: filter === status ? 'white' : '#6b7280'
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {getFilteredTasks().length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <i className="fas fa-clipboard-list" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
            <p style={{ fontSize: '18px', margin: 0 }}>
              No {filter === 'all' ? '' : filter.replace('_', ' ')} tasks found.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getFilteredTasks().map((task, index) => {
              const statusStyle = getStatusBadgeColor(task.status);
              return (
                <div key={task.id || index} style={{
                  border: `2px solid ${(task.status || '').toLowerCase().includes('complet') ? '#10b981' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: (task.status || '').toLowerCase().includes('complet') ? '#f0fdf4' : 'white',
                  opacity: (task.status || '').toLowerCase().includes('complet') ? 0.9 : 1
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '18px',
                        color: '#1f2937',
                        marginBottom: '8px',
                        textDecoration: (task.status || '').toLowerCase().includes('complet') ? 'line-through' : 'none'
                      }}>
                        {task.task_name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        Project: {task.project_name}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontWeight: '700',
                      fontSize: '14px',
                      borderLeft: `4px solid ${statusStyle.color}`,
                      textTransform: 'capitalize'
                    }}>
                      {statusStyle.icon} {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: getPriorityColor(task.priority) + '20',
                        color: getPriorityColor(task.priority),
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform: 'capitalize'
                      }}>
                        {task.priority} Priority
                      </span>
                      {task.due_date && (
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          <i className="fas fa-calendar-alt"></i> Due: {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
