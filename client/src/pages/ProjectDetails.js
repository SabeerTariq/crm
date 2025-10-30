import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import PageLayout from '../components/PageLayout';
import api from '../services/api';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [project, setProject] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [taskFormData, setTaskFormData] = useState({
    task_name: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    department_id: ''
  });
  const [departmentFormData, setDepartmentFormData] = useState({
    department_id: '',
    team_leader_id: ''
  });
  const [projectFormData, setProjectFormData] = useState({
    project_name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: ''
  });

  // Fetch project details
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.project);
      setDepartments(response.data.departments || []);
      setTasks(response.data.tasks || []);
      setStats(response.data.stats);
      setAttachments(response.data.attachments || []);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all departments for adding to project
  const fetchAllDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setAllDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchAllDepartments();
  }, [id]);

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...taskFormData,
        project_id: id
      });
      setShowAddTask(false);
      setTaskFormData({
        task_name: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        estimated_hours: '',
        department_id: ''
      });
      fetchProjectDetails();
      // Trigger storage event to refresh dashboards
      window.localStorage.setItem('tasksUpdated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'tasksUpdated' }));
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    }
  };

  // Handle department addition
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/departments`, departmentFormData);
      setShowAddDepartment(false);
      setDepartmentFormData({
        department_id: '',
        team_leader_id: ''
      });
      fetchProjectDetails();
    } catch (err) {
      console.error('Error adding department:', err);
      setError('Failed to add department');
    }
  };

  // Handle project edit
  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}`, projectFormData);
      setShowEditProject(false);
      fetchProjectDetails();
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    }
  };

  // Handle task edit
  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${editingTask.id}`, taskFormData);
      setShowEditTask(false);
      setEditingTask(null);
      setTaskFormData({
        task_name: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        estimated_hours: '',
        department_id: ''
      });
      fetchProjectDetails();
      // Trigger storage event to refresh dashboards
      window.localStorage.setItem('tasksUpdated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'tasksUpdated' }));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  // Handle task delete
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchProjectDetails();
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task');
      }
    }
  };

  // Handle project delete
  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects');
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project');
      }
    }
  };

  // Handle file selection for attachments
  const handleAttachmentFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachmentFiles(files);
  };

  // Handle attachment upload
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    try {
      if (attachmentFiles.length === 0) {
        setError('Please select files to upload');
        return;
      }

      const formData = new FormData();
      attachmentFiles.forEach(file => {
        formData.append('files', file);
      });
      
      await api.post(`/projects/${id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowAddAttachment(false);
      setAttachmentFiles([]);
      fetchProjectDetails();
    } catch (err) {
      console.error('Error adding attachment:', err);
      setError('Failed to add attachment');
    }
  };

  // Handle attachment delete
  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await api.delete(`/projects/${id}/attachments/${attachmentId}`);
        fetchProjectDetails();
      } catch (err) {
        console.error('Error deleting attachment:', err);
        setError('Failed to delete attachment');
      }
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachmentId) => {
    try {
      const response = await api.get(`/projects/${id}/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      // Get the attachment details to get the original filename
      const attachment = attachments.find(att => att.id === attachmentId);
      const filename = attachment ? attachment.file_name : 'download';
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      setError('Failed to download attachment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open edit project modal
  const openEditProject = () => {
    setProjectFormData({
      project_name: project.project_name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget || ''
    });
    setShowEditProject(true);
  };

  // Open edit task modal
  const openEditTask = (task) => {
    setTaskFormData({
      task_name: task.task_name,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours || '',
      department_id: task.department_id
    });
    setEditingTask(task);
    setShowEditTask(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      planning: '#6b7280',
      active: '#10b981',
      on_hold: '#f59e0b',
      completed: '#3b82f6',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  // Get available departments (not already assigned to project)
  const availableDepartments = allDepartments.filter(dept => 
    !departments.some(assignedDept => assignedDept.department_id === dept.id)
  );
  
  // Debug logging
  console.log('Debug info:', {
    allDepartments: allDepartments.length,
    assignedDepartments: departments.length,
    availableDepartments: availableDepartments.length,
    allDepartmentsData: allDepartments,
    assignedDepartmentsData: departments
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading project details...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>{error || 'Project not found'}</div>
          <button 
            onClick={() => navigate('/projects')}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Projects
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <button
                  onClick={() => navigate('/projects')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h1 style={{ 
                  margin: '0', 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  color: '#111827' 
                }}>
                  {project.project_name}
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: getStatusColor(project.status) + '20',
                    color: getStatusColor(project.status)
                  }}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: getPriorityColor(project.priority) + '20',
                    color: getPriorityColor(project.priority)
                  }}>
                    {project.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <p style={{ 
                margin: '0 0 16px 0', 
                color: '#6b7280', 
                fontSize: '16px' 
              }}>
                {project.description || 'No description provided'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {hasPermission('projects', 'update') && (
                <button
                  onClick={openEditProject}
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
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Edit Project
                </button>
              )}
              {hasPermission('projects', 'delete') && (
                <button
                  onClick={handleDeleteProject}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-trash"></i>
                  Delete Project
                </button>
              )}
            </div>
          </div>

          {/* Project Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #bae6fd' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#0369a1' }}>
                {departments.length}
              </div>
              <div style={{ fontSize: '14px', color: '#0c4a6e', marginTop: '4px' }}>
                Departments
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #bbf7d0' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                {tasks.length}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d', marginTop: '4px' }}>
                Total Tasks
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fde68a' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                Completed Tasks
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef2f2', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fecaca' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                {formatCurrency(project.budget)}
              </div>
              <div style={{ fontSize: '14px', color: '#991b1b', marginTop: '4px' }}>
                Budget
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e5e7eb',
            padding: '0 24px'
          }}>
            {[
              { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
              { id: 'departments', label: 'Departments', icon: 'fas fa-building' },
              { id: 'tasks', label: 'Tasks', icon: 'fas fa-tasks' },
              { id: 'attachments', label: 'Attachments', icon: 'fas fa-paperclip' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px'
                }}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                      Project Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Customer:</span>
                        <span style={{ fontWeight: '500' }}>{project.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Project Manager:</span>
                        <span style={{ fontWeight: '500' }}>{project.project_manager_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Created By:</span>
                        <span style={{ fontWeight: '500' }}>{project.created_by_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Start Date:</span>
                        <span style={{ fontWeight: '500' }}>{formatDate(project.start_date)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>End Date:</span>
                        <span style={{ fontWeight: '500' }}>{formatDate(project.end_date)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Budget:</span>
                        <span style={{ fontWeight: '500' }}>{formatCurrency(project.budget)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                      Task Statistics
                    </h3>
                    {stats && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>Total Tasks:</span>
                          <span style={{ fontWeight: '500' }}>{stats.total_tasks}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>Completed:</span>
                          <span style={{ fontWeight: '500', color: '#10b981' }}>{stats.completed_tasks}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>In Progress:</span>
                          <span style={{ fontWeight: '500', color: '#f59e0b' }}>{stats.in_progress_tasks}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>Pending:</span>
                          <span style={{ fontWeight: '500', color: '#6b7280' }}>{stats.pending_tasks}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Project Departments
                  </h3>
                  {hasPermission('projects', 'update') && (
                    <button
                      onClick={() => setShowAddDepartment(true)}
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
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Add Department
                    </button>
                  )}
                </div>

                {departments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <i className="fas fa-building" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                    <p>No departments assigned to this project</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {departments.map(dept => (
                      <div key={dept.id} style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                            {dept.department_name}
                          </h4>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: dept.status === 'completed' ? '#10b98120' : 
                                           dept.status === 'in_progress' ? '#f59e0b20' : '#6b728020',
                            color: dept.status === 'completed' ? '#10b981' : 
                                   dept.status === 'in_progress' ? '#f59e0b' : '#6b7280'
                          }}>
                            {dept.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                          {dept.department_description}
                        </p>
                        {dept.team_leader_name && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Team Leader: </span>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>{dept.team_leader_name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                          <span>{dept.tasks_count || 0} tasks</span>
                          <span>{dept.completed_tasks || 0} completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Project Tasks
                  </h3>
                  {hasPermission('tasks', 'create') && (
                    <button
                      onClick={() => setShowAddTask(true)}
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
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Add Task
                    </button>
                  )}
                </div>

                {tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                    <p>No tasks created for this project</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks.map(task => (
                      <div key={task.id} style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                              {task.task_name}
                            </h4>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: getStatusColor(task.status) + '20',
                              color: getStatusColor(task.status)
                            }}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: getPriorityColor(task.priority) + '20',
                              color: getPriorityColor(task.priority)
                            }}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                            {task.description || 'No description provided'}
                          </p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                            <span><i className="fas fa-building" style={{ marginRight: '4px' }}></i>{task.department_name}</span>
                            {task.assigned_to_name && (
                              <span><i className="fas fa-user" style={{ marginRight: '4px' }}></i>{task.assigned_to_name}</span>
                            )}
                            {task.due_date && (
                              <span><i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>{formatDate(task.due_date)}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {hasPermission('tasks', 'update') && (
                            <button
                              onClick={() => openEditTask(task)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {hasPermission('tasks', 'delete') && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Project Attachments
                  </h3>
                  {hasPermission('project_attachments', 'create') && (
                    <button
                      onClick={() => setShowAddAttachment(true)}
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
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      Add Attachment
                    </button>
                  )}
                </div>

                {attachments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <i className="fas fa-paperclip" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                    <p>No attachments uploaded for this project</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {attachments.map(attachment => (
                      <div key={attachment.id} style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <i className="fas fa-file" style={{ color: '#6b7280', fontSize: '16px' }}></i>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                              {attachment.file_name}
                            </h4>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                            <span>
                              <i className="fas fa-user" style={{ marginRight: '4px' }}></i>
                              {attachment.uploaded_by_name}
                            </span>
                            <span>
                              <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                              {formatDate(attachment.created_at)}
                            </span>
                            {attachment.file_size && (
                              <span>
                                <i className="fas fa-weight" style={{ marginRight: '4px' }}></i>
                                {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleDownloadAttachment(attachment.id)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#f0f9ff',
                              color: '#0369a1',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="fas fa-download"></i>
                            Download
                          </button>
                          {hasPermission('project_attachments', 'delete') && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddTask(false);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Create New Task
                </h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskFormData.task_name}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, task_name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Department *
                  </label>
                  <select
                    value={taskFormData.department_id}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Department</option>
                    {allDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskFormData.due_date}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Department Modal */}
        {showAddDepartment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddDepartment(false);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Add Department to Project
                </h2>
                <button
                  onClick={() => setShowAddDepartment(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleAddDepartment}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Department *
                  </label>
                  <select
                    value={departmentFormData.department_id}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    required
                    disabled={availableDepartments.length === 0}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: availableDepartments.length === 0 ? '#f9fafb' : 'white'
                    }}
                  >
                    <option value="">
                      {availableDepartments.length === 0 
                        ? 'All departments already assigned' 
                        : 'Select Department'
                      }
                    </option>
                    {availableDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddDepartment(false)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableDepartments.length === 0}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: availableDepartments.length === 0 ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: availableDepartments.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Add Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditProject && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditProject(false);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Edit Project
                </h2>
                <button
                  onClick={() => setShowEditProject(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleEditProject}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectFormData.project_name}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Status
                    </label>
                    <select
                      value={projectFormData.status}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, status: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      value={projectFormData.priority}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, priority: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectFormData.start_date}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectFormData.end_date}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Budget
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={projectFormData.budget}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, budget: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditProject(false)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Attachment Modal */}
        {showAddAttachment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddAttachment(false);
              setAttachmentFiles([]);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Add Attachment
                </h2>
                <button
                  onClick={() => {
                    setShowAddAttachment(false);
                    setAttachmentFiles([]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleAddAttachment}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Select Files
                  </label>
                  <div style={{ 
                    border: '2px dashed #d1d5db', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <input
                      type="file"
                      multiple
                      onChange={handleAttachmentFileChange}
                      style={{ display: 'none' }}
                      id="attachment-file-upload"
                    />
                    <label 
                      htmlFor="attachment-file-upload"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: '#6b7280' }}></i>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Click to upload files or drag and drop
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF up to 10MB
                      </span>
                    </label>
                  </div>
                  
                  {attachmentFiles.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Selected Files ({attachmentFiles.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {attachmentFiles.map((file, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-file" style={{ color: '#6b7280', fontSize: '14px' }}></i>
                              <span style={{ fontSize: '14px', color: '#374151' }}>{file.name}</span>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAttachment(false);
                      setAttachmentFiles([]);
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={attachmentFiles.length === 0}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: attachmentFiles.length === 0 ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: attachmentFiles.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Upload Files
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditTask && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditTask(false);
              setEditingTask(null);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Edit Task
                </h2>
                <button
                  onClick={() => {
                    setShowEditTask(false);
                    setEditingTask(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleEditTask}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskFormData.task_name}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, task_name: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Department *
                  </label>
                  <select
                    value={taskFormData.department_id}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Department</option>
                    {allDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskFormData.due_date}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskFormData.estimated_hours}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTask(false);
                      setEditingTask(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ProjectDetails;
