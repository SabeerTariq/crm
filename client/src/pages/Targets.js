import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Targets() {
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    target_value: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    fetchTargets();
    fetchUsers();
    setCurrentMonth(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  }, []);

  const fetchTargets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/targets/current/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTargets(response.data);
    } catch (err) {
      console.error('Error fetching targets:', err);
      setError('Failed to load targets');
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
      // This endpoint already returns only sales role users
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      target_value: ''
    });
    setEditingTarget(null);
    setShowAddForm(false);
  };

  const submitTarget = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingTarget) {
        await api.put(`/targets/${editingTarget.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/targets', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetForm();
      fetchTargets();
    } catch (err) {
      console.error('Error saving target:', err);
      setError(err.response?.data?.message || 'Failed to save target');
    }
  };

  const editTarget = (target) => {
    setFormData({
      user_id: target.user_id,
      target_value: target.target_value
    });
    setEditingTarget(target);
    setShowAddForm(true);
  };

  const deleteTarget = async (id) => {
    const targetToDelete = targets.find(t => t.id === id);
    const confirmMessage = targetToDelete 
      ? `Are you sure you want to delete the target for ${targetToDelete.user_name}?\n\nTarget: ${targetToDelete.target_value} customers\n\nThis action cannot be undone.`
      : 'Are you sure you want to delete this target? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      await api.delete(`/targets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Show success message temporarily
      const successMessage = targetToDelete 
        ? `Target for ${targetToDelete.user_name} deleted successfully`
        : 'Target deleted successfully';
      setError(null);
      // Refresh the list
      fetchTargets();
      // Optional: Show success notification (you can replace with a toast notification library)
      alert(successMessage);
    } catch (err) {
      console.error('Error deleting target:', err);
      setError(err.response?.data?.message || 'Failed to delete target. Please try again.');
    }
  };

  const autoCreateNextMonth = async () => {
    if (!window.confirm('Create targets for next month based on current targets?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.post('/targets/auto-create-next-month', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTargets();
    } catch (err) {
      console.error('Error creating next month targets:', err);
      setError(err.response?.data?.message || 'Failed to create next month targets');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    if (percentage >= 50) return '#f97316';
    return '#ef4444';
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
          Loading targets...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h2>Sales Targets - {currentMonth}</h2>
              <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
                Set customer conversion targets for sales team members
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {hasPermission('targets', 'create') && (
                <button 
                  onClick={() => setShowAddForm(true)}
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
                  Set Target
                </button>
              )}
              {hasPermission('targets', 'create') && (
                <button 
                  onClick={autoCreateNextMonth}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Auto-Create Next Month
                </button>
              )}
            </div>
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

        {/* Add/Edit Target Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>
              {editingTarget ? 'Edit Target' : 'Set Target for ' + currentMonth}
            </h3>
            <form onSubmit={submitTarget}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Sales Person *
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Sales Person</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Target (Number of Customers) *
                  </label>
                  <input
                    type="number"
                    name="target_value"
                    value={formData.target_value}
                    onChange={handleFormChange}
                    min="1"
                    required
                    placeholder="e.g., 10"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                <p style={{ margin: '0', fontSize: '14px', color: '#1e40af' }}>
                  <strong>Note:</strong> This target represents the number of customers the sales person should convert from leads this month. 
                  The system will automatically track progress based on actual customer conversions.
                </p>
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
                  {editingTarget ? 'Update Target' : 'Set Target'}
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

        {/* Targets Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sales Person</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Target</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Converted</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Progress</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No targets set for {currentMonth}
                  </td>
                </tr>
              ) : (
                targets.map(target => (
                  <tr key={target.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{target.user_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{target.user_email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>
                      {target.target_value} customers
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>
                      {target.actual_conversions} customers
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '100px',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(target.progress_percentage, 100)}%`,
                            height: '100%',
                            backgroundColor: getProgressColor(target.progress_percentage),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          color: getProgressColor(target.progress_percentage),
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {target.progress_percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {hasPermission('targets', 'update') && (
                          <button
                            onClick={() => editTarget(target)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('targets', 'delete') && (
                          <button
                            onClick={() => deleteTarget(target.id)}
                            style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
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
    </PageLayout>
  );
}