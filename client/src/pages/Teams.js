import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    member_ids: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  // Reset form when opening for new team creation
  useEffect(() => {
    if (showAddForm && !editingTeam) {
      setFormData({
        name: '',
        description: '',
        member_ids: []
      });
    }
  }, [showAddForm, editingTeam]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/for-teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Sales users from API:', response.data);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const memberIds = formData.member_ids;
      if (checked) {
        setFormData({ ...formData, member_ids: [...memberIds, parseInt(value)] });
      } else {
        setFormData({ ...formData, member_ids: memberIds.filter(id => id !== parseInt(value)) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      member_ids: []
    });
    setEditingTeam(null);
    setShowAddForm(false);
  };

  const openAddForm = () => {
    setFormData({
      name: '',
      description: '',
      member_ids: []
    });
    setEditingTeam(null);
    setShowAddForm(true);
  };

  const submitTeam = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/teams', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      alert('Team saved successfully!');
      resetForm();
      fetchTeams();
      fetchUsers(); // Refresh available users
    } catch (err) {
      console.error('Error saving team:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save team';
      setError(errorMessage);
      alert(errorMessage); // Show error to user
    }
  };

  const editTeam = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const team = response.data;
      setFormData({
        name: team.name,
        description: team.description || '',
        member_ids: team.members.map(member => member.user_id)
      });
      setEditingTeam(team);
      setShowAddForm(true);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError('Failed to load team details');
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm('Delete this team? This will also remove all team targets.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const viewTeamMembers = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const team = response.data;
      setSelectedTeam(team);
      setTeamMembers(team.members || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    }
  };

  const removeMember = async (teamId, userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this team?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/teams/${teamId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Member removed successfully!');
      // Refresh team members
      viewTeamMembers(teamId);
      // Refresh teams list
      fetchTeams();
    } catch (err) {
      console.error('Error removing member:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove member';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <PageLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px',
          color: '#64748b'
        }}>
          Loading teams...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Teams Management</h2>
            {hasPermission('teams', 'create') && (
              <button 
                onClick={openAddForm}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add Team
              </button>
            )}
          </div>
          {error && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '6px',
              color: '#dc2626',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Add/Edit Team Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>
              {editingTeam ? 'Edit Team' : 'Add New Team'}
            </h3>
            <form onSubmit={submitTeam}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Team Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                  Team Members (Sales Role Users)
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '10px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '10px'
                }}>
                  {users.map(user => (
                    <label key={user.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: formData.member_ids.includes(user.id) ? '#eff6ff' : '#ffffff',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        value={user.id}
                        checked={formData.member_ids.includes(user.id)}
                        onChange={handleFormChange}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {users.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                      No sales role users available
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                      Create sales role users first to add them to teams
                    </p>
                  </div>
                )}
                {users.length > 0 && (
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: '10px 0 0 0' }}>
                    Select sales role users to add to this team. Users can be in multiple teams.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Team Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Members</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created By</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created At</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No teams found
                  </td>
                </tr>
              ) : (
                teams.map(team => (
                  <tr key={team.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{team.name}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>
                      {team.description || 'No description'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {team.member_count} members
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>
                      {team.created_by_name}
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>
                      {new Date(team.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => viewTeamMembers(team.id)}
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          View Members
                        </button>
                        {hasPermission('teams', 'update') && (
                          <button
                            onClick={() => editTeam(team.id)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('teams', 'delete') && (
                          <button
                            onClick={() => deleteTeam(team.id)}
                            style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Team Members Modal */}
        {selectedTeam && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '15px'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                  {selectedTeam.name} - Team Members
                </h3>
                <button
                  onClick={() => setSelectedTeam(null)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>

              {teamMembers.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: '0 0 10px 0' }}>No members in this team</p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#9ca3af' }}>
                    Add sales role users to this team
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '15px'
                }}>
                  {teamMembers.map(member => (
                    <div key={member.id} style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {member.user_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: member.role === 'leader' ? '#fef3c7' : '#dbeafe',
                            color: member.role === 'leader' ? '#92400e' : '#1e40af',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {member.role}
                          </span>
                          {hasPermission('teams', 'update') && (
                            <button
                              onClick={() => removeMember(selectedTeam.id, member.user_id, member.user_name)}
                              style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Remove member"
                            >
                              <i className="fas fa-times"></i>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
                        {member.email}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Role: {member.role_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
                        Joined: {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
    </PageLayout>
  );
}
