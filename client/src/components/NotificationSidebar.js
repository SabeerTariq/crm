import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './NotificationSidebar.css';

const NotificationSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'notificationsUpdated') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Extract actual ID if it has a prefix (e.g., "stored_123" -> "123")
      const actualId = notificationId.toString().startsWith('stored_') 
        ? notificationId.toString().replace('stored_', '') 
        : notificationId;
      await api.patch(`/notifications/${actualId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      loadNotifications();
      // Trigger storage event
      window.localStorage.setItem('notificationsUpdated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'notificationsUpdated' }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      // Extract actual ID if it has a prefix (e.g., "stored_123" -> "123")
      const actualId = notificationId.toString().startsWith('stored_') 
        ? notificationId.toString().replace('stored_', '') 
        : notificationId;
      await api.delete(`/notifications/${actualId}`);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete('/notifications/delete-all');
      loadNotifications();
      // Trigger storage event
      window.localStorage.setItem('notificationsUpdated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'notificationsUpdated' }));
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      alert('Failed to clear all notifications. Please try again.');
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      // Only mark stored notifications as read (they have IDs in the database)
      if (notification.id && notification.id.toString().startsWith('stored_')) {
        handleMarkAsRead(notification.id);
      }
    }

    // Navigate to related entity
    if (notification.entity_type && notification.entity_id) {
      switch (notification.entity_type) {
        case 'task':
        case 'tasks':
          // Navigate to task management - could be enhanced to open specific task modal
          window.location.href = `/task-management`;
          break;
        case 'project':
        case 'projects':
          window.location.href = `/projects/${notification.entity_id}`;
          break;
        case 'customer':
        case 'customers':
          window.location.href = `/customers`;
          break;
        case 'reminder':
        case 'reminders':
          window.location.href = `/calendar`;
          break;
        case 'lead':
        case 'leads':
          window.location.href = `/schedule-list`;
          break;
        case 'payment':
        case 'payments':
          window.location.href = `/payments`;
          break;
        case 'channels':
          window.location.href = `/chat`;
          break;
        case 'direct_messages':
          window.location.href = `/chat`;
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      reminder: 'fa-bell',
      schedule: 'fa-calendar-alt',
      task_assigned: 'fa-tasks',
      task_due: 'fa-clock',
      project_assigned: 'fa-project-diagram',
      customer_assigned: 'fa-user-plus',
      payment_due: 'fa-dollar-sign',
      task_created: 'fa-plus-circle',
      task_completed: 'fa-check-circle',
      task_status_change: 'fa-exchange-alt',
      task_comment: 'fa-comment',
      checklist_added: 'fa-list-check',
      checklist_complete: 'fa-check-double'
    };
    return icons[type] || 'fa-info-circle';
  };

  const getNotificationColor = (type) => {
    const colors = {
      reminder: '#f59e0b',
      schedule: '#3b82f6',
      task_assigned: '#8b5cf6',
      task_due: '#ef4444',
      project_assigned: '#10b981',
      customer_assigned: '#06b6d4',
      payment_due: '#f97316',
      task_created: '#3b82f6',
      task_completed: '#10b981',
      task_status_change: '#8b5cf6',
      task_comment: '#06b6d4',
      checklist_added: '#f59e0b',
      checklist_complete: '#10b981'
    };
    return colors[type] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredNotifications = () => {
    // Ensure all notifications are user-specific (this is handled by backend, but filter client-side too)
    let filtered = notifications;
    
    if (activeFilter === 'all') {
      filtered = notifications;
    } else if (activeFilter === 'unread') {
      filtered = notifications.filter(n => !n.is_read);
    } else {
      filtered = notifications.filter(n => n.type === activeFilter);
    }
    
    return filtered;
  };

  const getTypeCount = (type) => {
    if (type === 'unread') {
      return notifications.filter(n => !n.is_read).length;
    }
    return notifications.filter(n => n.type === type).length;
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="notification-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="count">{unreadCount}</span>}
      </button>

      {/* Sidebar */}
      <div className={`notification-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="notification-sidebar-header">
          <h2>
            <i className="fas fa-bell"></i> Notifications
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {notifications.length > 0 && (
              <button 
                className="notification-action-btn" 
                onClick={handleClearAll}
                title="Clear all notifications"
                style={{ color: '#ef4444' }}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
            {unreadCount > 0 && (
              <button 
                className="notification-action-btn" 
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <i className="fas fa-check-double"></i>
              </button>
            )}
            <button 
              className="notification-close-btn" 
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="notification-content">
          {/* Filter Tabs */}
          <div className="notification-tabs">
            <button 
              className={`notification-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
              {activeFilter === 'all' && (
                <span className="notification-tab-badge">{notifications.length}</span>
              )}
            </button>
            <button 
              className={`notification-tab ${activeFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
              {activeFilter === 'unread' && (
                <span className="notification-tab-badge">{getTypeCount('unread')}</span>
              )}
            </button>
            <button 
              className={`notification-tab ${activeFilter === 'task_assigned' ? 'active' : ''}`}
              onClick={() => setActiveFilter('task_assigned')}
            >
              Tasks
              {activeFilter === 'task_assigned' && (
                <span className="notification-tab-badge">{getTypeCount('task_assigned')}</span>
              )}
            </button>
            <button 
              className={`notification-tab ${activeFilter === 'payment_due' ? 'active' : ''}`}
              onClick={() => setActiveFilter('payment_due')}
            >
              Payments
              {activeFilter === 'payment_due' && (
                <span className="notification-tab-badge">{getTypeCount('payment_due')}</span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="notification-empty">Loading...</div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="notification-empty">
              <i className="fas fa-bell-slash" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
              <p>
                {activeFilter === 'unread' 
                  ? 'No unread notifications' 
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {getFilteredNotifications().map((notification, index) => {
                const iconColor = getNotificationColor(notification.type);
                const priorityColor = getPriorityColor(notification.priority);
                const isUnread = !notification.is_read;

                return (
                  <div 
                    key={notification.id || index} 
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="notification-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div 
                          className="notification-icon"
                          style={{ backgroundColor: iconColor + '20', color: iconColor }}
                        >
                          <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-meta">
                            <span 
                              className="notification-priority"
                              style={{ 
                                backgroundColor: priorityColor + '20', 
                                color: priorityColor 
                              }}
                            >
                              {notification.priority}
                            </span>
                            {notification.due_date && (
                              <span className="notification-date">
                                <i className="fas fa-calendar"></i> {formatDate(notification.due_date)}
                              </span>
                            )}
                            <span className="notification-time">
                              {new Date(notification.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="notification-item-actions">
                        {isUnread && (
                          <button
                            className="notification-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.id && notification.id.toString().startsWith('stored_')) {
                                handleMarkAsRead(notification.id);
                              }
                            }}
                            title="Mark as read"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button
                          className="notification-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.id && notification.id.toString().startsWith('stored_')) {
                              handleDelete(notification.id);
                            }
                          }}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    {isUnread && <div className="notification-unread-indicator"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationSidebar;

