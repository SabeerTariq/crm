import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EnhancedTaskModal = ({ 
  showModal, 
  selectedTask, 
  taskDetails, 
  taskComments, 
  taskAttachments, 
  taskChecklists, 
  taskActivity,
  taskMembers,
  onClose, 
  onRefresh,
  getPriorityColor,
  formatDate,
  hasPermission 
}) => {
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('collaborator');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Handle adding comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await api.post(`/tasks/${selectedTask.id}/comments`, { comment: newComment });
      setNewComment('');
      onRefresh();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Handle adding checklist
  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    
    try {
      await api.post(`/tasks/${selectedTask.id}/checklists`, { title: newChecklistTitle });
      setNewChecklistTitle('');
      onRefresh();
    } catch (err) {
      console.error('Error adding checklist:', err);
    }
  };

  // Handle adding checklist item
  const handleAddChecklistItem = async (checklistId) => {
    if (!newChecklistItem.trim()) return;
    
    try {
      await api.post(`/tasks/checklists/${checklistId}/items`, { item_text: newChecklistItem });
      setNewChecklistItem('');
      onRefresh();
    } catch (err) {
      console.error('Error adding checklist item:', err);
    }
  };

  // Handle toggling checklist item
  const handleToggleChecklistItem = async (itemId) => {
    try {
      await api.put(`/tasks/checklist-items/${itemId}/toggle`);
      onRefresh();
    } catch (err) {
      console.error('Error toggling checklist item:', err);
    }
  };

  // Handle attachment file change
  const handleAttachmentFileChange = (e) => {
    setAttachmentFiles(Array.from(e.target.files));
  };

  // Handle adding attachments
  const handleAddAttachments = async () => {
    if (attachmentFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      attachmentFiles.forEach(file => {
        formData.append('files', file);
      });
      
      await api.post(`/tasks/${selectedTask.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAttachmentFiles([]);
      setShowAddAttachment(false);
      onRefresh();
    } catch (err) {
      console.error('Error adding attachments:', err);
    }
  };

  // Handle downloading attachment
  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await api.get(`/tasks/${selectedTask.id}/attachments/${attachment.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  };

  // Handle adding member
  const handleAddMember = async () => {
    if (!selectedUserId) return;
    
    try {
      await api.post(`/tasks/${selectedTask.id}/members`, {
        user_id: selectedUserId,
        role: selectedRole
      });
      
      setSelectedUserId('');
      setSelectedRole('collaborator');
      setShowAddMember(false);
      onRefresh();
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  // Handle updating member role
  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await api.put(`/tasks/members/${memberId}/role`, { role: newRole });
      onRefresh();
    } catch (err) {
      console.error('Error updating member role:', err);
    }
  };

  // Handle removing member
  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/tasks/members/${memberId}`);
      onRefresh();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  // Handle assigning task (primary assignee)
  const handleAssignTask = async () => {
    if (!selectedAssignee && taskDetails?.assigned_to) {
      // Unassigning
      try {
        await api.put(`/tasks/${selectedTask.id}`, { assigned_to: null });
        setShowAssignModal(false);
        onRefresh();
      } catch (err) {
        console.error('Error unassigning task:', err);
        alert('Failed to unassign task');
      }
    } else if (selectedAssignee) {
      try {
        await api.put(`/tasks/${selectedTask.id}`, { assigned_to: selectedAssignee });
        setShowAssignModal(false);
        onRefresh();
      } catch (err) {
        console.error('Error assigning task:', err);
        alert('Failed to assign task');
      }
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get(`/tasks/${selectedTask.id}/available-users`);
      setAvailableUsers(response.data);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  // Handle starting description edit
  const handleStartEditDescription = () => {
    setEditedDescription(taskDetails.description || '');
    setIsEditingDescription(true);
  };

  // Handle saving description
  const handleSaveDescription = async () => {
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        description: editedDescription
      });
      setIsEditingDescription(false);
      onRefresh();
    } catch (err) {
      console.error('Error updating description:', err);
    }
  };

  // Handle canceling description edit
  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  // Helper functions for member display
  const getRoleColor = (role) => {
    const colors = {
      assignee: '#0079bf',
      collaborator: '#61bd4f',
      reviewer: '#ff9f1a',
      observer: '#c1c7d0'
    };
    return colors[role] || '#c1c7d0';
  };

  const getRoleIcon = (role) => {
    const icons = {
      assignee: 'fas fa-user-check',
      collaborator: 'fas fa-users',
      reviewer: 'fas fa-eye',
      observer: 'fas fa-eye-slash'
    };
    return icons[role] || 'fas fa-user';
  };

  useEffect(() => {
    if (showModal && selectedTask && showAddMember) {
      fetchAvailableUsers();
    }
    if (showModal && taskDetails) {
      setSelectedAssignee(taskDetails.assigned_to || '');
    }
  }, [showModal, selectedTask, showAddMember, taskDetails]);

  useEffect(() => {
    if (showModal && selectedTask && showAssignModal) {
      fetchAvailableUsers();
    }
  }, [showModal, selectedTask, showAssignModal]);

  if (!showModal || !selectedTask || !taskDetails) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '48px 0'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}
    >
      <div style={{
        backgroundColor: '#f4f5f7',
        borderRadius: '8px',
        width: '95%',
        maxWidth: '768px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Trello-style Header */}
        <div style={{ 
          padding: '16px 24px 8px 24px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e1e5e9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#172b4d',
                lineHeight: '1.2'
              }}>
                {taskDetails.task_name}
              </h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Labels */}
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: getPriorityColor(taskDetails.priority),
                  color: 'white'
                }}>
                  {taskDetails.priority}
                </span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#dfe1e6',
                  color: '#5e6c84'
                }}>
                  {taskDetails.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                color: '#6b778c',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                marginLeft: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f4f5f7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
            {/* Quick Info Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center',
            fontSize: '14px',
            color: '#5e6c84',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            <span><i className="fas fa-project-diagram" style={{ marginRight: '4px' }}></i>{taskDetails.project_name}</span>
            {taskDetails.assigned_to_name ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-user"></i>
                Assigned to: {taskDetails.assigned_to_name}
              </span>
            ) : (
              <span style={{ color: '#de350b', fontStyle: 'italic' }}>
                <i className="fas fa-user-times" style={{ marginRight: '4px' }}></i>Unassigned
              </span>
            )}
            {taskDetails.due_date && (
              <span><i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>{formatDate(taskDetails.due_date)}</span>
            )}
            {taskDetails.estimated_hours && (
              <span><i className="fas fa-clock" style={{ marginRight: '4px' }}></i>{taskDetails.estimated_hours}h</span>
            )}
          </div>
        </div>

        {/* Main Content Area - Trello Style */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          backgroundColor: '#f4f5f7'
        }}>
          {/* Main Content */}
          <div style={{ 
            flex: 1, 
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: 'white',
            margin: '0 0 0 0'
          }}>
            {/* Description Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#172b4d', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-align-left"></i>
                Description
                {hasPermission('tasks', 'update') && !isEditingDescription && (
                  <button
                    onClick={handleStartEditDescription}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b778c',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      marginLeft: '8px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f4f5f7'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Edit description"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                )}
              </h3>
              
              {isEditingDescription ? (
                <div>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e1e5e9',
                      borderRadius: '3px',
                      padding: '12px',
                      minHeight: '80px',
                      fontSize: '14px',
                      color: '#172b4d',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Enter task description..."
                    autoFocus
                  />
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleCancelEditDescription}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6b778c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0079bf',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e1e5e9',
                    borderRadius: '3px',
                    padding: '12px',
                    minHeight: '60px',
                    fontSize: '14px',
                    color: '#172b4d',
                    lineHeight: '1.4',
                    cursor: hasPermission('tasks', 'update') ? 'pointer' : 'default'
                  }}
                  onClick={hasPermission('tasks', 'update') ? handleStartEditDescription : undefined}
                  title={hasPermission('tasks', 'update') ? 'Click to edit description' : undefined}
                >
                  {taskDetails.description || (
                    <span style={{ color: '#6b778c', fontStyle: 'italic' }}>
                      No description provided. Click to add one.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Members Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#172b4d', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-users"></i>
                Members ({taskMembers.length})
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {taskMembers.map(member => (
                  <div key={member.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#f8f9fa',
                    padding: '6px 8px',
                    borderRadius: '3px',
                    fontSize: '14px',
                    color: '#172b4d'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: getRoleColor(member.role),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px'
                    }}>
                      <i className={getRoleIcon(member.role)}></i>
                    </div>
                    <span>{member.user_name}</span>
                    <span style={{ fontSize: '12px', color: '#6b778c' }}>({member.role})</span>
                  </div>
                ))}
                {hasPermission('task_members', 'create') && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    style={{
                      backgroundColor: '#f4f5f7',
                      border: '1px dashed #c1c7d0',
                      borderRadius: '3px',
                      padding: '6px 8px',
                      fontSize: '14px',
                      color: '#6b778c',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add Member
                  </button>
                )}
              </div>
            </div>

            {/* Checklists Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#172b4d', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-tasks"></i>
                Checklists
              </h3>
              {taskChecklists.map(checklist => (
                <div key={checklist.id} style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#172b4d', 
                    marginBottom: '8px' 
                  }}>
                    {checklist.title}
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    {checklist.items && checklist.items.map(item => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '4px',
                        fontSize: '14px',
                        color: '#172b4d'
                      }}>
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={() => handleToggleChecklistItem(item.id)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ 
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                          color: item.is_completed ? '#6b778c' : '#172b4d'
                        }}>
                          {item.item_text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Attachments Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#172b4d', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-paperclip"></i>
                Attachments ({taskAttachments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {taskAttachments.map(attachment => (
                  <div key={attachment.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#f8f9fa',
                    padding: '8px',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-file" style={{ color: '#6b778c' }}></i>
                    <span style={{ flex: 1, color: '#172b4d' }}>{attachment.file_name}</span>
                    <span style={{ fontSize: '12px', color: '#6b778c' }}>
                      {(attachment.file_size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => handleDownloadAttachment(attachment)}
                      style={{
                        backgroundColor: '#0079bf',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#172b4d', 
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-comments"></i>
                Comments ({taskComments.length})
              </h3>
              
              {/* Comment Input */}
              {hasPermission('tasks', 'update') && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      style={{
                        flex: 1,
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e5e9',
                        borderRadius: '3px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#172b4d',
                        lineHeight: '1.4',
                        resize: 'vertical',
                        minHeight: '60px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: newComment.trim() ? '#0079bf' : '#c1c7d0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '14px',
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                        alignSelf: 'flex-start',
                        marginTop: '4px'
                      }}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {taskComments.map(comment => (
                  <div key={comment.id} style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}>
                    <div style={{ 
                      fontWeight: '500', 
                      color: '#172b4d', 
                      marginBottom: '4px' 
                    }}>
                      {comment.user_name}
                    </div>
                    <div style={{ color: '#172b4d', marginBottom: '4px' }}>
                      {comment.comment}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b778c' }}>
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                ))}
                {taskComments.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#6b778c',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ 
            width: '240px', 
            backgroundColor: '#f4f5f7',
            padding: '24px 16px',
            borderLeft: '1px solid #e1e5e9'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Add to Card */}
              <div>
                <h4 style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#6b778c', 
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Add to Card
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e1e5e9',
                      borderRadius: '3px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#172b4d',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-user-plus"></i>
                    Members
                  </button>
                  <button
                    onClick={() => setShowAddAttachment(!showAddAttachment)}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e1e5e9',
                      borderRadius: '3px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#172b4d',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-paperclip"></i>
                    Attachments
                  </button>
                </div>
              </div>

              {/* Task Assignment */}
              {hasPermission('tasks', 'update') && (
                <div>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#6b778c', 
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Assignment
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '3px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#172b4d',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-user-check"></i>
                      {taskDetails.assigned_to_name ? `Change Assignee` : 'Assign Task'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <h4 style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#6b778c', 
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Actions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e1e5e9',
                      borderRadius: '3px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#172b4d',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-history"></i>
                    Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
            width: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              Add Member
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                >
                  <option value="assignee">Assignee</option>
                  <option value="collaborator">Collaborator</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="observer">Observer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddMember(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b778c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedUserId ? '#0079bf' : '#c1c7d0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: selectedUserId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Attachment Form */}
        {showAddAttachment && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
            width: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              Add Attachments
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                  Select Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleAttachmentFileChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddAttachment(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b778c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttachments}
                  disabled={attachmentFiles.length === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: attachmentFiles.length > 0 ? '#0079bf' : '#c1c7d0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: attachmentFiles.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Task Modal */}
        {showAssignModal && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
            width: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              {taskDetails.assigned_to_name ? 'Change Assignee' : 'Assign Task'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                  Select User
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Unassign (No one)</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role_name})
                    </option>
                  ))}
                </select>
              </div>
              {taskDetails.assigned_to_name && (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f4f5f7', 
                  borderRadius: '3px',
                  fontSize: '12px',
                  color: '#6b778c'
                }}>
                  Currently assigned to: <strong>{taskDetails.assigned_to_name}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAssignee(taskDetails?.assigned_to || '');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b778c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0079bf',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedAssignee ? 'Assign' : 'Unassign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTaskModal;
