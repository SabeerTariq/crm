import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';
import './Calendar.css';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    is_all_day: false,
    priority: 'medium'
  });

  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (hasPermission('reminders', 'read')) {
      loadReminders();
    }
  }, [hasPermission, currentDate]);

  const loadReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const response = await api.get(`/reminders?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReminders(response.data);
    } catch (error) {
      console.error('Error loading reminders:', error);
      alert('Failed to load reminders');
    }
  };

  const loadRemindersForDate = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = formatDateForAPI(date);
      const response = await api.get(`/reminders?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error loading reminders for date:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.reminder_date) {
      alert('Title and date are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingReminder ? `/reminders/${editingReminder.id}` : '/reminders';
      const method = editingReminder ? 'put' : 'post';

      const submitData = {
        ...formData,
        reminder_time: formData.is_all_day ? null : formData.reminder_time
      };

      await api[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(editingReminder ? 'Reminder updated successfully!' : 'Reminder created successfully!');
      resetForm();
      loadReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      alert('Error saving reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/reminders/${reminderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Reminder deleted successfully!');
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Error deleting reminder');
    }
  };

  const handleComplete = async (reminderId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/reminders/${reminderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadReminders();
    } catch (error) {
      console.error('Error completing reminder:', error);
      alert('Error completing reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reminder_date: '',
      reminder_time: '',
      is_all_day: false,
      priority: 'medium'
    });
    setEditingReminder(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const formatDateForAPI = (date) => {
    // Create a date in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openAddModal = (date = null) => {
    const dateStr = date ? formatDateForAPI(date) : formatDateForAPI(selectedDate);
    setFormData({
      title: '',
      description: '',
      reminder_date: dateStr,
      reminder_time: '',
      is_all_day: false,
      priority: 'medium'
    });
    setShowAddModal(true);
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date,
      reminder_time: reminder.reminder_time || '',
      is_all_day: reminder.is_all_day,
      priority: reminder.priority
    });
    setShowEditModal(true);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getRemindersForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDateForAPI(date);
    return reminders.filter(reminder => reminder.reminder_date === dateStr);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#6b7280';
      case 'pending': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (permissionsLoading) {
    return (
      <PageLayout>
        <div>Loading permissions...</div>
      </PageLayout>
    );
  }

  if (!hasPermission('reminders', 'read')) {
    return (
      <PageLayout>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '8px', 
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          You don't have permission to view reminders.
        </div>
      </PageLayout>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <PageLayout>
      <div className="calendar-container">
        <div className="calendar-header">
          <h1>My Calendar</h1>
          {hasPermission('reminders', 'create') && (
            <button 
              className="btn btn-primary"
              onClick={() => openAddModal()}
            >
              Add Reminder
            </button>
          )}
        </div>

        <div className="calendar-navigation">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">
            ← Previous
          </button>
          <h2>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => navigateMonth(1)} className="nav-btn">
            Next →
          </button>
        </div>

        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            const dayReminders = getRemindersForDate(date);
            return (
              <div
                key={index}
                className={`calendar-day ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
                onClick={() => date && setSelectedDate(date)}
                onDoubleClick={() => date && hasPermission('reminders', 'create') && openAddModal(date)}
                title={date ? `Click to select, double-click to add reminder for ${formatDateForAPI(date)}` : ''}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-reminders">
                      {dayReminders.slice(0, 3).map(reminder => (
                        <div
                          key={reminder.id}
                          className="reminder-preview"
                          style={{ 
                            backgroundColor: getPriorityColor(reminder.priority),
                            opacity: reminder.status === 'completed' ? 0.6 : 1
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(reminder);
                          }}
                        >
                          {reminder.title}
                        </div>
                      ))}
                      {dayReminders.length > 3 && (
                        <div className="more-reminders">
                          +{dayReminders.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="selected-date-reminders">
          <h3>Reminders for {selectedDate.toLocaleDateString()}</h3>
          <div className="reminders-list">
            {getRemindersForDate(selectedDate).map(reminder => (
              <div key={reminder.id} className="reminder-item">
                <div className="reminder-content">
                  <div className="reminder-title">{reminder.title}</div>
                  {reminder.description && (
                    <div className="reminder-description">{reminder.description}</div>
                  )}
                  <div className="reminder-meta">
                    {!reminder.is_all_day && reminder.reminder_time && (
                      <span className="reminder-time">
                        {new Date(`2000-01-01T${reminder.reminder_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                    <span 
                      className="reminder-priority"
                      style={{ color: getPriorityColor(reminder.priority) }}
                    >
                      {reminder.priority}
                    </span>
                    <span 
                      className="reminder-status"
                      style={{ color: getStatusColor(reminder.status) }}
                    >
                      {reminder.status}
                    </span>
                  </div>
                </div>
                <div className="reminder-actions">
                  {reminder.status === 'pending' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleComplete(reminder.id)}
                    >
                      Complete
                    </button>
                  )}
                  {hasPermission('reminders', 'update') && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openEditModal(reminder)}
                    >
                      Edit
                    </button>
                  )}
                  {hasPermission('reminders', 'delete') && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {getRemindersForDate(selectedDate).length === 0 && (
              <div className="no-reminders">
                No reminders for this date
              </div>
            )}
          </div>
        </div>

        {/* Add Reminder Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Reminder</h3>
                <button className="modal-close" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.reminder_date}
                    onChange={e => setFormData({...formData, reminder_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_all_day}
                      onChange={e => setFormData({...formData, is_all_day: e.target.checked})}
                    />
                    All Day
                  </label>
                </div>
                {!formData.is_all_day && (
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={e => setFormData({...formData, reminder_time: e.target.value})}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={resetForm}>Cancel</button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Create Reminder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Reminder Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Reminder</h3>
                <button className="modal-close" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.reminder_date}
                    onChange={e => setFormData({...formData, reminder_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_all_day}
                      onChange={e => setFormData({...formData, is_all_day: e.target.checked})}
                    />
                    All Day
                  </label>
                </div>
                {!formData.is_all_day && (
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={e => setFormData({...formData, reminder_time: e.target.value})}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={resetForm}>Cancel</button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Update Reminder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
