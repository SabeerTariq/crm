import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import PageLayout from '../components/PageLayout';
import api from '../services/api';

const Departments = () => {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    department_name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    department_name: '',
    description: ''
  });
  const [teamFormData, setTeamFormData] = useState({
    user_id: '',
    role: 'team_member'
  });

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...departments];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dept => 
        dept.department_name?.toLowerCase().includes(term) ||
        dept.description?.toLowerCase().includes(term)
      );
    }

    setFilteredDepartments(filtered);
  }, [departments, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', formData);
      setShowAddForm(false);
      setFormData({ department_name: '', description: '' });
      fetchDepartments();
    } catch (err) {
      console.error('Error creating department:', err);
      setError('Failed to create department');
    }
  };

  // Fetch team members for a department
  const fetchTeamMembers = useCallback(async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}/members`);
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  }, []);

  // Fetch available users for department assignment
  const fetchAvailableUsers = useCallback(async (departmentId) => {
    try {
      const response = await api.get(`/departments/${departmentId}/available-users`);
      console.log('Available users response:', response.data);
      // Response.data might be an array or wrapped in an object
      const users = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setAvailableUsers(users);
    } catch (err) {
      console.error('Error fetching available users:', err);
      setAvailableUsers([]); // Set to empty array on error
    }
  }, []);


  // Handle team member addition
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/departments/${selectedDepartment.id}/members`, teamFormData);
      setTeamFormData({ user_id: '', role: 'team_member' });
      fetchTeamMembers(selectedDepartment.id);
      fetchAvailableUsers(selectedDepartment.id);
    } catch (err) {
      console.error('Error adding team member:', err);
      setError('Failed to add team member');
    }
  };

  // Handle team member role update
  const handleUpdateTeamMemberRole = async (memberId, newRole) => {
    try {
      await api.put(`/departments/members/${memberId}`, { role: newRole });
      fetchTeamMembers(selectedDepartment.id);
    } catch (err) {
      console.error('Error updating team member role:', err);
      setError('Failed to update team member role');
    }
  };

  // Handle team member removal
  const handleRemoveTeamMember = async (memberId) => {
    try {
      await api.delete(`/departments/members/${memberId}`);
      fetchTeamMembers(selectedDepartment.id);
      fetchAvailableUsers(selectedDepartment.id);
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member');
    }
  };

  // Handle department selection for team management
  const handleSelectDepartment = async (department) => {
    console.log('Opening team modal for department:', department);
    setSelectedDepartment(department);
    setShowTeamModal(true);
    await Promise.all([
      fetchTeamMembers(department.id),
      fetchAvailableUsers(department.id)
    ]);
  };

  // Handle department deletion
  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${departmentId}`);
        fetchDepartments();
      } catch (err) {
        console.error('Error deleting department:', err);
        setError('Failed to delete department');
      }
    }
  };

  // Handle edit department
  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setEditFormData({
      department_name: department.department_name,
      description: department.description || ''
    });
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/departments/${editingDepartment.id}`, editFormData);
      setEditFormData({ department_name: '', description: '' });
      setShowEditForm(false);
      setEditingDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error('Error updating department:', err);
      setError('Failed to update department');
    }
  };

  if (permissionsLoading || loading) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading departments...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#ef4444' }}>{error}</div>
          <button 
            onClick={fetchDepartments}
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
            Retry
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <div>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#111827' 
              }}>
                Department Management
              </h1>
              <p style={{ 
                margin: '0', 
                color: '#6b7280', 
                fontSize: '16px' 
              }}>
                Manage departments and team assignments
              </p>
            </div>
            {hasPermission('departments', 'create') && (
              <button
                onClick={() => setShowAddForm(true)}
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
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <i className="fas fa-plus"></i>
                Add Department
              </button>
            )}
          </div>
          
          {/* Stats Cards */}
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
                {filteredDepartments.length}
              </div>
              <div style={{ fontSize: '14px', color: '#0c4a6e', marginTop: '4px' }}>
                {searchTerm ? 'Filtered Departments' : 'Total Departments'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #bbf7d0' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                {filteredDepartments.reduce((sum, dept) => sum + (dept.team_members_count || 0), 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d', marginTop: '4px' }}>
                Total Team Members
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fde68a' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                {filteredDepartments.reduce((sum, dept) => sum + (dept.team_leaders_count || 0), 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                Team Leaders
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '16px'
            }}></i>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {/* Departments Grid */}
        {filteredDepartments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <i className="fas fa-building" style={{ 
              fontSize: '48px', 
              color: '#9ca3af', 
              marginBottom: '16px' 
            }}></i>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              No departments found
            </h3>
            <p style={{ 
              margin: '0 0 24px 0', 
              color: '#6b7280' 
            }}>
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first department'}
            </p>
            {hasPermission('departments', 'create') && !searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-plus"></i>
                Create Department
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {filteredDepartments.map(department => (
              <div key={department.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ 
                    margin: '0', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    lineHeight: '1.4'
                  }}>
                    {department.department_name}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: department.is_active ? '#10b98120' : '#ef444420',
                    color: department.is_active ? '#10b981' : '#ef4444'
                  }}>
                    {department.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: '#6b7280', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {department.description || 'No description provided'}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                    <span>
                      <i className="fas fa-users" style={{ marginRight: '4px' }}></i>
                      {department.team_members_count || 0} members
                    </span>
                    <span>
                      <i className="fas fa-user-tie" style={{ marginRight: '4px' }}></i>
                      {department.team_leaders_count || 0} leaders
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Created {new Date(department.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '16px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDepartment(department);
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    <i className="fas fa-users"></i>
                    Manage Team
                  </button>
                  
                  {hasPermission('departments', 'update') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDepartment(department);
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      <i className="fas fa-edit"></i>
                      Edit
                    </button>
                  )}
                  
                  {hasPermission('departments', 'delete') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(department.id);
                      }}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Department Modal */}
        {showAddForm && (
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
              setShowAddForm(false);
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
                  Create New Department
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
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

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={formData.department_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_name: e.target.value }))}
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

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
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
                    Create Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditForm && editingDepartment && (
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
              setShowEditForm(false);
              setEditingDepartment(null);
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
                  Edit Department
                </h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingDepartment(null);
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

              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.department_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, department_name: e.target.value }))}
                    placeholder="Enter department name"
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
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter department description"
                    rows={4}
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
                      setShowEditForm(false);
                      setEditingDepartment(null);
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
                    Update Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Management Modal */}
        {showTeamModal && selectedDepartment && (
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
              setShowTeamModal(false);
              setSelectedDepartment(null);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  Manage Team - {selectedDepartment.department_name}
                </h2>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setSelectedDepartment(null);
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

              {/* Add Team Member Form */}
              <div style={{ 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                padding: '20px', 
                marginBottom: '24px' 
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  Add Team Member
                </h3>
                <div style={{ 
                  backgroundColor: '#dbeafe', 
                  border: '1px solid #93c5fd', 
                  borderRadius: '6px', 
                  padding: '12px', 
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#1e40af'
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                  <strong>Note:</strong> Users can only be in one department at a time. Adding a user to this department will automatically remove them from their current department.
                </div>
                <form onSubmit={handleAddTeamMember} style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Select User
                    </label>
                    <select
                      value={teamFormData.user_id}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, user_id: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      required
                    >
                      <option value="">{availableUsers.length === 0 ? 'No users available' : 'Select a user...'}</option>
                      {availableUsers.length > 0 ? (
                        availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email}) - {user.role_name}
                            {user.current_department_name && ` - Currently in ${user.current_department_name}`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No users available for this department</option>
                      )}
                    </select>
                  </div>
                  <div style={{ minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Role
                    </label>
                    <select
                      value={teamFormData.role}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, role: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="team_member">Team Member</option>
                      <option value="team_leader">Team Leader</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      height: 'fit-content'
                    }}
                  >
                    Add Member
                  </button>
                </form>
              </div>

              {/* Team Members List */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  Team Members ({teamMembers.length})
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {teamMembers.map(member => (
                    <div key={member.id} style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: member.role === 'team_leader' ? '#3b82f6' : '#10b981',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {member.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                            {member.user_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {member.user_email} • {member.role_name}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateTeamMemberRole(member.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        >
                          <option value="team_member">Member</option>
                          <option value="team_leader">Leader</option>
                        </select>
                        <button
                          onClick={() => handleRemoveTeamMember(member.id)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      No team members assigned yet
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Departments;
