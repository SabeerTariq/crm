import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TodoSidebar.css';

const TodoSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [todos, setTodos] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('current');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: ''
  });
  const [editingTodo, setEditingTodo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const todosData = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data].filter(Boolean);
        
        setTodos(todosData);
        
        // Count pending and in_progress todos
        const pendingTodos = todosData.filter(todo => 
          todo.status === 'pending' || todo.status === 'in_progress'
        );
        setPendingCount(pendingTodos.length);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingTodo) {
        // Update existing todo
        await api.put(`/todos/${editingTodo.id}`, formData, { headers });
      } else {
        // Create new todo
        await api.post('/todos', formData, { headers });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: ''
      });
      setShowForm(false);
      setEditingTodo(null);
      loadTodos();
    } catch (error) {
      console.error('Error saving todo:', error);
      alert('Failed to save todo');
    }
  };

  const handleStatusChange = async (todoId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/todos/${todoId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTodos();
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      status: todo.status,
      priority: todo.priority,
      due_date: todo.due_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (todoId) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/todos/${todoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: ''
    });
  };

  const handleToggleComplete = (todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    handleStatusChange(todo.id, newStatus);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredTodos = () => {
    if (activeTab === 'current') {
      return todos.filter(todo => todo.status !== 'completed');
    } else {
      return todos.filter(todo => todo.status === 'completed');
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="todo-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Todo List"
      >
        <i className="fas fa-tasks"></i>
        {pendingCount > 0 && <span className="count">{pendingCount}</span>}
      </button>

      {/* Sidebar */}
      <div className={`todo-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="todo-sidebar-header">
          <h2>
            <i className="fas fa-check-circle"></i> My Todos
          </h2>
          <button className="todo-close-btn" onClick={() => setIsOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="todo-content">
          {!showForm ? (
            <>
              {/* Tabs */}
              <div className="todo-tabs">
                <button 
                  className={`todo-tab ${activeTab === 'current' ? 'active' : ''}`}
                  onClick={() => setActiveTab('current')}
                >
                  Current
                  <span className="todo-tab-badge">
                    {todos.filter(t => t.status !== 'completed').length}
                  </span>
                </button>
                <button 
                  className={`todo-tab ${activeTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                  <span className="todo-tab-badge">
                    {todos.filter(t => t.status === 'completed').length}
                  </span>
                </button>
              </div>

              {activeTab === 'current' && (
                <button 
                  className="todo-add-btn" 
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus"></i> Add New Todo
                </button>
              )}

              {loading ? (
                <div className="todo-empty">Loading...</div>
              ) : getFilteredTodos().length === 0 ? (
                <div className="todo-empty">
                  <i className="fas fa-clipboard-list" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <p>
                    {activeTab === 'current' 
                      ? 'No active todos. Create one to get started!' 
                      : 'No completed todos yet.'}
                  </p>
                </div>
              ) : (
                <div className="todo-list">
                  {getFilteredTodos().map(todo => (
                    <div key={todo.id} className={`todo-item ${todo.status}`}>
                      <div className="todo-item-header">
                        <div className="todo-item-title">{todo.title}</div>
                        <div className="todo-item-actions">
                          <button
                            className="todo-action-btn"
                            onClick={() => handleEdit(todo)}
                            title="Edit"
                          >
                            <i className="fas fa-edit" style={{ color: '#667eea' }}></i>
                          </button>
                          <button
                            className="todo-action-btn"
                            onClick={() => handleDelete(todo.id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash" style={{ color: '#ef4444' }}></i>
                          </button>
                        </div>
                      </div>
                      
                      {todo.description && (
                        <div className="todo-item-description">{todo.description}</div>
                      )}
                      
                      <div className="todo-item-footer">
                        <div className="todo-item-meta">
                          <span className={`todo-badge ${todo.priority}`}>
                            {todo.priority}
                          </span>
                          <span className="todo-badge" style={{
                            background: todo.status === 'completed' ? '#10b981' : 
                                        todo.status === 'in_progress' ? '#3b82f6' : 
                                        todo.status === 'cancelled' ? '#ef4444' : '#fbbf24',
                            color: 'white'
                          }}>
                            {todo.status}
                          </span>
                          {todo.due_date && (
                            <span className="todo-due-date">
                              <i className="fas fa-calendar"></i> {formatDate(todo.due_date)}
                            </span>
                          )}
                        </div>
                        <label className="todo-toggle">
                          <input
                            type="checkbox"
                            checked={todo.status === 'completed'}
                            onChange={() => handleToggleComplete(todo)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="todo-form">
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'white' }}>
                {editingTodo ? 'Edit Todo' : 'New Todo'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="todo-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="todo-form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="todo-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="todo-form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="todo-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="todo-form-actions">
                  <button type="submit" className="todo-form-btn todo-form-btn-primary">
                    <i className="fas fa-save"></i> {editingTodo ? 'Update' : 'Create'}
                  </button>
                  <button 
                    type="button" 
                    className="todo-form-btn todo-form-btn-secondary"
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TodoSidebar;
