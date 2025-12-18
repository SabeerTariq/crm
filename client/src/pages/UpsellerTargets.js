import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function UpsellerTargets() {
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingTargetValue, setEditingTargetValue] = useState({});
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
      const response = await api.get('/upseller-targets/current/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTargets(response.data);
    } catch (err) {
      console.error('Error fetching upseller targets:', err);
      setError('Failed to load cash in targets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/upseller-teams/all-upsellers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // This endpoint returns all upseller role users for target setting
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching upseller users:', err);
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
    
    // Validate target value
    const targetValue = parseFloat(formData.target_value);
    if (isNaN(targetValue) || targetValue <= 0) {
      setError('Target value must be a number greater than 0');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingTarget) {
        await api.put(`/upseller-targets/${editingTarget.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/upseller-targets', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetForm();
      fetchTargets();
      setError(null);
    } catch (err) {
      console.error('Error saving upseller target:', err);
      setError(err.response?.data?.message || 'Failed to save cash in target');
    }
  };

  const handleInlineEdit = (target) => {
    setEditingTargetValue({
      ...editingTargetValue,
      [target.user_id]: target.target_value
    });
  };

  const handleInlineSave = async (target) => {
    const newValue = editingTargetValue[target.user_id];
    
    // Validate target value
    const targetValue = parseFloat(newValue);
    if (isNaN(targetValue) || targetValue <= 0) {
      setError('Target value must be a number greater than 0');
      return;
    }
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (target.id) {
        // Update existing target
        await api.put(`/upseller-targets/${target.id}`, { target_value: targetValue }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new target
        await api.post('/upseller-targets', { 
          user_id: target.user_id, 
          target_value: targetValue 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Clear editing state
      const newEditingState = { ...editingTargetValue };
      delete newEditingState[target.user_id];
      setEditingTargetValue(newEditingState);
      
      fetchTargets();
    } catch (err) {
      console.error('Error saving upseller target:', err);
      setError(err.response?.data?.message || 'Failed to save cash in target');
    }
  };

  const handleInlineCancel = (target) => {
    const newEditingState = { ...editingTargetValue };
    delete newEditingState[target.user_id];
    setEditingTargetValue(newEditingState);
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
      ? `Are you sure you want to delete the cash in target for ${targetToDelete.user_name}?\n\nTarget: $${parseFloat(targetToDelete.target_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nThis action cannot be undone.`
      : 'Are you sure you want to delete this cash in target? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      await api.delete(`/upseller-targets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Show success message temporarily
      const successMessage = targetToDelete 
        ? `Cash in target for ${targetToDelete.user_name} deleted successfully`
        : 'Cash in target deleted successfully';
      setError(null);
      // Refresh the list
      fetchTargets();
      // Optional: Show success notification (you can replace with a toast notification library)
      alert(successMessage);
    } catch (err) {
      console.error('Error deleting upseller target:', err);
      setError(err.response?.data?.message || 'Failed to delete cash in target. Please try again.');
    }
  };

  const autoCreateNextMonth = async () => {
    if (!window.confirm('Create cash in targets for next month based on current targets?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.post('/upseller-targets/auto-create-next-month', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTargets();
    } catch (err) {
      console.error('Error creating next month upseller targets:', err);
      setError(err.response?.data?.message || 'Failed to create next month cash in targets');
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
          Loading cash in targets...
        </div>
      </PageLayout>
    );
  }

  // Check if user has permission to view targets
  if (!hasPermission('upseller_targets', 'read')) {
    return (
      <PageLayout>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>Access Denied</h3>
          <p style={{ color: '#6b7280', margin: '0' }}>
            You don't have permission to view cash in targets.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h2>Cash In Targets - {currentMonth}</h2>
              <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
                Set cash in targets for upseller team members
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {hasPermission('upseller_targets', 'create') && (
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
                  Set Cash In Target
                </button>
              )}
              {hasPermission('upseller_targets', 'create') && (
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
                  Auto-Create Next Month Targets
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
              {editingTarget ? 'Edit Cash In Target' : 'Set Cash In Target for ' + currentMonth}
            </h3>
            <form onSubmit={submitTarget}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Upseller *
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
                    <option value="">Select Upseller</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Target Cash In Amount ($) *
                  </label>
                  <input
                    type="number"
                    name="target_value"
                    value={formData.target_value}
                    onChange={handleFormChange}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="e.g., 5000.00"
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
                  <strong>Note:</strong> This target represents the cash in amount the upseller should generate this month. 
                  The system will automatically track progress based on actual cash received from sales and payments.
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
                  {editingTarget ? 'Update Target' : 'Set Cash In Target'}
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
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Upseller</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Target ($)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actual ($)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Progress</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No upseller users found
                  </td>
                </tr>
              ) : (
                targets.map(target => {
                  const isEditing = editingTargetValue.hasOwnProperty(target.user_id);
                  const displayValue = isEditing ? editingTargetValue[target.user_id] : target.target_value;
                  
                  return (
                    <tr key={target.user_id || target.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{target.user_name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{target.user_email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>$</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={displayValue}
                              onChange={(e) => setEditingTargetValue({
                                ...editingTargetValue,
                                [target.user_id]: e.target.value
                              })}
                              style={{
                                width: '100px',
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleInlineSave(target)}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => handleInlineCancel(target)}
                              style={{
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600' }}>
                              ${parseFloat(target.target_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {!target.has_target && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: '#6b7280', 
                                fontStyle: 'italic',
                                padding: '2px 6px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '4px'
                              }}>
                                (default)
                              </span>
                            )}
                            {hasPermission('upseller_targets', 'update') && (
                              <button
                                onClick={() => handleInlineEdit(target)}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        ${parseFloat(target.actual_cash_in || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {hasPermission('upseller_targets', 'delete') && target.id && (
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
    </PageLayout>
  );
}
