import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import PageLayout from '../components/PageLayout';
import EnhancedTaskModal from '../components/EnhancedTaskModal';
import api from '../services/api';

const TaskManagement = () => {
  const { hasPermission } = usePermissions();
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [taskChecklists, setTaskChecklists] = useState([]);
  const [taskActivity, setTaskActivity] = useState([]);
  const [taskMembers, setTaskMembers] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [newStatus, setNewStatus] = useState({
    status_name: '',
    status_color: '#6b7280'
  });
  const [newBoard, setNewBoard] = useState({
    board_name: '',
    department_id: '',
    description: ''
  });

  // Fetch tasks
  const fetchTasks = useCallback(async (boardId) => {
    if (!boardId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/boards/${boardId}/tasks`);
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch statuses
  const fetchStatuses = useCallback(async () => {
    try {
      const response = await api.get('/statuses');
      setStatuses(response.data.statuses || []);
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  }, []);

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data.boards || []);
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  }, []);

  // Fetch departments for board creation
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, []);


  // Handle task status update
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (selectedBoard) {
        fetchTasks(selectedBoard.id); // Refresh tasks
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };

  // Handle add new status
  const handleAddStatus = async (e) => {
    e.preventDefault();
    try {
      await api.post('/statuses', newStatus);
      setNewStatus({ status_name: '', status_color: '#6b7280' });
      setShowStatusModal(false);
      fetchStatuses(); // Refresh statuses
    } catch (err) {
      console.error('Error adding status:', err);
      setError('Failed to add status');
    }
  };

  // Handle add new board
  const handleAddBoard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/boards', newBoard);
      setNewBoard({ board_name: '', department_id: '', description: '' });
      setShowBoardModal(false);
      fetchBoards(); // Refresh boards
    } catch (err) {
      console.error('Error adding board:', err);
      setError('Failed to add board');
    }
  };

  // Handle delete board
  const handleDeleteBoard = (boardId, boardName) => {
    // Find the board to check if it's default
    const board = boards.find(b => b.id === boardId);
    if (board && board.is_default) {
      alert('Cannot delete default boards. Only custom boards can be deleted.');
      return;
    }
    setItemToDelete({ type: 'board', id: boardId, name: boardName });
    setShowDeleteModal(true);
  };

  // Handle delete status
  const handleDeleteStatus = (statusId, statusName) => {
    // Find the status to check if it's default
    const status = statuses.find(s => s.id === statusId);
    if (status && status.is_default) {
      alert('Cannot delete default status columns. Only custom status columns can be deleted.');
      return;
    }
    setItemToDelete({ type: 'status', id: statusId, name: statusName });
    setShowDeleteModal(true);
  };

  // Handle delete task
  const handleDeleteTask = (taskId, taskName) => {
    setItemToDelete({ type: 'task', id: taskId, name: taskName });
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'status') {
        await api.delete(`/statuses/${itemToDelete.id}`);
        fetchStatuses(); // Refresh statuses
      } else if (itemToDelete.type === 'task') {
        await api.delete(`/tasks/${itemToDelete.id}`);
        if (selectedBoard) {
          fetchTasks(selectedBoard.id); // Refresh tasks
        }
      } else if (itemToDelete.type === 'board') {
        await api.delete(`/boards/${itemToDelete.id}`);
        fetchBoards(); // Refresh boards
        // If deleted board was selected, select first available board
        if (selectedBoard && selectedBoard.id === itemToDelete.id) {
          const remainingBoards = boards.filter(b => b.id !== itemToDelete.id);
          if (remainingBoards.length > 0) {
            setSelectedBoard(remainingBoards[0]);
          } else {
            setSelectedBoard(null);
          }
        }
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(`Failed to delete ${itemToDelete.type}`);
    }
  };

  // Handle drag start
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      handleStatusUpdate(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  // Fetch detailed task information
  const fetchTaskDetails = async (taskId) => {
    try {
      const [taskRes, commentsRes, attachmentsRes, checklistsRes, activityRes, membersRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/attachments`),
        api.get(`/tasks/${taskId}/checklists`),
        api.get(`/tasks/${taskId}/activity`),
        api.get(`/tasks/${taskId}/members`)
      ]);

      setTaskDetails(taskRes.data);
      setTaskComments(commentsRes.data || []);
      setTaskAttachments(attachmentsRes.data || []);
      setTaskChecklists(checklistsRes.data || []);
      setTaskActivity(activityRes.data || []);
      setTaskMembers(membersRes.data || []);
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to fetch task details');
    }
  };

  // Open task details modal
  const openTaskModal = async (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
    await fetchTaskDetails(task.id);
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  // Get tasks for a specific status
  const getTasksForStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  useEffect(() => {
    fetchBoards();
    fetchStatuses();
    fetchDepartments();
  }, [fetchBoards, fetchStatuses, fetchDepartments]);

  // Handle board selection and task fetching
  useEffect(() => {
    if (boards.length > 0) {
      let targetBoard = null;
      
      if (boardId) {
        // If boardId is in URL, find that board
        targetBoard = boards.find(b => b.id === parseInt(boardId));
        if (!targetBoard) {
          // Board not found, redirect to main task management
          navigate('/task-management');
          return;
        }
      } else {
        // No boardId in URL, select first board
        targetBoard = boards[0];
      }
      
      if (targetBoard && (!selectedBoard || selectedBoard.id !== targetBoard.id)) {
        setSelectedBoard(targetBoard);
        fetchTasks(targetBoard.id);
      }
    }
  }, [boards, boardId, selectedBoard, navigate, fetchTasks]);

  if (loading) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading tasks...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <style>
        {`
          .kanban-board::-webkit-scrollbar {
            height: 8px;
          }
          .kanban-board::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .kanban-board::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .kanban-board::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .kanban-board {
              gap: 16px !important;
              padding-left: 4px !important;
              padding-right: 4px !important;
            }
            .kanban-column {
              min-width: 280px !important;
              max-width: 280px !important;
              width: 280px !important;
            }
          }
          
          @media (max-width: 480px) {
            .kanban-column {
              min-width: 260px !important;
              max-width: 260px !important;
              width: 260px !important;
            }
          }
        `}
      </style>
      <div style={{ padding: '24px' }}>
        <div style={{ 
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px',
          maxWidth: '100%',
          wordWrap: 'break-word'
        }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 'clamp(24px, 4vw, 32px)', 
            fontWeight: '700', 
            color: '#111827' 
          }}>
            Task Management
          </h1>
          <p style={{ 
            margin: '0', 
            color: '#6b7280', 
            fontSize: 'clamp(14px, 2.5vw, 16px)' 
          }}>
            Manage and track tasks across projects with a visual Kanban board
          </p>
        </div>

        {/* Board Selector */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#111827',
              whiteSpace: 'nowrap'
            }}>
              Select Board:
            </label>
            <select
              value={selectedBoard ? selectedBoard.id : ''}
              onChange={(e) => {
                const boardId = parseInt(e.target.value);
                // Navigate to the board-specific URL
                if (boardId) {
                  navigate(`/task-management/board/${boardId}`);
                } else {
                  navigate('/task-management');
                }
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                minWidth: '200px',
                maxWidth: '300px',
                width: '100%'
              }}
            >
              <option value="">Select a board...</option>
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.board_name} ({board.department_name})
                </option>
              ))}
            </select>
            {selectedBoard && (
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                  backgroundColor: selectedBoard.is_default ? '#10b981' : '#3b82f6',
                  color: 'white'
                }}>
                  {selectedBoard.is_default ? 'DEFAULT' : 'CUSTOM'}
                </span>
                {selectedBoard.description && (
                  <span>{selectedBoard.description}</span>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowBoardModal(true)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              <i className="fas fa-plus"></i>
              New Board
            </button>
            {selectedBoard && !selectedBoard.is_default && (
              <button
                onClick={() => handleDeleteBoard(selectedBoard.id, selectedBoard.board_name)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                <i className="fas fa-trash"></i>
                Delete Board
              </button>
            )}
          </div>
        </div>

        {/* Add Status Button */}
        <div style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setShowStatusModal(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <span>+</span>
            Add Status Column
          </button>
        </div>

        {/* Kanban Board */}
        <div style={{ 
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          <div 
            className="kanban-board"
            style={{ 
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingBottom: '16px',
              paddingLeft: '8px',
              paddingRight: '8px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              width: '100%',
              maxWidth: '100%'
            }}>
          {statuses.map(status => (
            <div key={status.id} className="kanban-column" style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              minWidth: '300px',
              maxWidth: '320px',
              width: '300px',
              flexShrink: 0,
              height: 'fit-content',
              maxHeight: '80vh',
              overflow: 'hidden'
            }}>
              {/* Column Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                borderRadius: '12px 12px 0 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: status.status_color
                    }}></div>
                    <h3 style={{ 
                      margin: '0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#111827' 
                    }}>
                      {status.status_name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getTasksForStatus(status.status_name).length}
                    </span>
                    <button
                      onClick={() => handleDeleteStatus(status.id, status.status_name)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: status.is_default ? '#9ca3af' : '#ef4444',
                        cursor: status.is_default ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        opacity: status.is_default ? '0.5' : '1'
                      }}
                      title={status.is_default ? 'Cannot delete default status' : 'Delete Status'}
                      disabled={status.is_default}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks */}
               <div
                 style={{
                   padding: '16px',
                   minHeight: '200px'
                 }}
                 onDragOver={handleDragOver}
                 onDrop={(e) => handleDrop(e, status.status_name)}
               >
                {getTasksForStatus(status.status_name).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => openTaskModal(task)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Task Header */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <h4 style={{ 
                          margin: '0', 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#111827',
                          lineHeight: '1.4',
                          flex: 1,
                          paddingRight: '8px'
                        }}>
                          {task.task_name}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening task modal
                            handleDeleteTask(task.id, task.task_name);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            opacity: '0.7',
                            transition: 'opacity 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '1'}
                          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                          title="Delete Task"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                          backgroundColor: getPriorityColor(task.priority) + '20',
                          color: getPriorityColor(task.priority)
                        }}>
                          {task.priority.toUpperCase()}
                        </span>
                        {task.department_name && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: '#f3f4f6',
                            color: '#374151'
                          }}>
                            {task.department_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '12px',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {task.description}
                      </p>
                    )}

                    {/* Task Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {task.assigned_to_name && (
                          <span>
                            <i className="fas fa-user" style={{ marginRight: '4px' }}></i>
                            {task.assigned_to_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span>
                            <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                      {task.estimated_hours && (
                        <span>
                          <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                          {task.estimated_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {getTasksForStatus(status.status_name).length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-tasks" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                    No tasks in this column
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
          
           {/* Scroll Hint */}
           <div style={{
             position: 'absolute',
             top: '8px',
             right: '16px',
             backgroundColor: 'rgba(0, 0, 0, 0.1)',
             color: '#6b7280',
             padding: '4px 8px',
             borderRadius: '4px',
             fontSize: '12px',
             pointerEvents: 'none'
           }}>
             <i className="fas fa-arrows-alt-h" style={{ marginRight: '4px' }}></i>
             Scroll horizontally
           </div>
        </div>

        {/* Enhanced Task Details Modal */}
        <EnhancedTaskModal
          showModal={showTaskModal}
          selectedTask={selectedTask}
          taskDetails={taskDetails}
          taskComments={taskComments}
          taskAttachments={taskAttachments}
          taskChecklists={taskChecklists}
          taskActivity={taskActivity}
          taskMembers={taskMembers}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            setTaskDetails(null);
          }}
          onRefresh={() => fetchTaskDetails(selectedTask?.id)}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          hasPermission={hasPermission}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
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
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '400px',
              maxWidth: '90vw',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}>
                <i className="fas fa-exclamation-triangle" style={{
                  fontSize: '24px',
                  color: '#ef4444'
                }}></i>
              </div>

              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Delete {itemToDelete.type === 'status' ? 'Status Column' : itemToDelete.type === 'board' ? 'Board' : 'Task'}?
              </h3>

              <p style={{
                margin: '0 0 24px 0',
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>? 
                {itemToDelete.type === 'task' 
                  ? ' This action cannot be undone.' 
                  : itemToDelete.type === 'board'
                  ? ' This will move all tasks to the default board for this department.'
                  : ' This will remove the status column and any tasks using this status will need to be reassigned.'
                }
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Delete {itemToDelete.type === 'status' ? 'Status' : itemToDelete.type === 'board' ? 'Board' : 'Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Status Modal */}
        {showStatusModal && (
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
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Add New Status Column
              </h3>

              <form onSubmit={handleAddStatus}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Status Name
                  </label>
                  <input
                    type="text"
                    value={newStatus.status_name}
                    onChange={(e) => setNewStatus(prev => ({ ...prev, status_name: e.target.value }))}
                    placeholder="e.g., In Review, Testing, Deployed"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Status Color
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={newStatus.status_color}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, status_color: e.target.value }))}
                      style={{
                        width: '50px',
                        height: '40px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={newStatus.status_color}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, status_color: e.target.value }))}
                      placeholder="#6b7280"
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusModal(false);
                      setNewStatus({ status_name: '', status_color: '#6b7280' });
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
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
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Add Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Board Modal */}
        {showBoardModal && (
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
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Create New Board
              </h3>

              <form onSubmit={handleAddBoard}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Board Name
                  </label>
                  <input
                    type="text"
                    value={newBoard.board_name}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, board_name: e.target.value }))}
                    placeholder="e.g., Marketing Campaign Board"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Department
                  </label>
                  <select
                    value={newBoard.department_id}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, department_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBoard.description}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this board's purpose..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBoardModal(false);
                      setNewBoard({ board_name: '', department_id: '', description: '' });
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
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
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TaskManagement;
