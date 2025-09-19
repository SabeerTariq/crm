import { useEffect, useState, useCallback } from 'react';

import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null); // user being edited (id) or null
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });

  const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const loadUsers = useCallback(() => {
    api.get('/users', { headers: tokenHeader() })
      .then(res => setUsers(res.data))
      .catch(e => alert(e.response?.data?.message || 'Failed to load users'));
  }, []);

  const loadRoles = useCallback(() => {
    api.get('/users/roles', { headers: tokenHeader() })
      .then(res => setRoles(res.data))
      .catch(e => alert(e.response?.data?.message || 'Failed to load roles'));
  }, []);

  useEffect(() => { 
    loadUsers(); 
    loadRoles();
  }, [loadUsers, loadRoles]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', role_id: '' });
    setEditing(null);
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form, { headers: tokenHeader() });
      resetForm();
      loadUsers();
      alert('User created');
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  const startEdit = (u) => {
    setEditing(u.id);
    setForm({ 
      name: u.name, 
      email: u.email, 
      password: '', 
      role_id: u.role_id || '' 
    });
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      // Only send fields that are set; backend supports partial updates.
      const payload = { name: form.name, email: form.email, role_id: form.role_id };
      if (form.password) payload.password = form.password;

      await api.put(`/users/${editing}`, payload, { headers: tokenHeader() });
      resetForm();
      loadUsers();
      alert('User updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`, { headers: tokenHeader() });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <PageLayout>
        <h2>User Management</h2>

        {/* Add / Edit form */}
        <form onSubmit={editing ? updateUser : createUser} style={{ maxWidth: 480, marginBottom: 20 }}>
          <h3>{editing ? 'Edit User' : 'Add User'}</h3>
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={onChange}
            required
            style={inputStyle}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
            style={inputStyle}
          />
          <input
            name="password"
            type="password"
            placeholder={editing ? 'New Password (optional)' : 'Password'}
            value={form.password}
            onChange={onChange}
            style={inputStyle}
          />
          <select name="role_id" value={form.role_id} onChange={onChange} style={inputStyle} required>
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} {role.description && `- ${role.description}`}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" onClick={resetForm} style={btnGhost}>Cancel</button>}
          </div>
        </form>

        {/* Users list */}
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Type</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {u.role_name ? (
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: u.user_type === 'Admin' ? '#fef3c7' : '#dbeafe', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: u.user_type === 'Admin' ? '#92400e' : '#1e40af'
                    }}>
                      {u.role_name}
                      {u.role_description && ` - ${u.role_description}`}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>No role assigned</span>
                  )}
                </td>
                <td>
                  <span style={{ 
                    padding: '2px 6px', 
                    backgroundColor: u.user_type === 'Admin' ? '#fef3c7' : '#d1fae5', 
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: u.user_type === 'Admin' ? '#92400e' : '#065f46'
                  }}>
                    {u.user_type}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(u)}>Edit</button>
                  <button onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="7">No users found</td></tr>
            )}
          </tbody>
        </table>
    </PageLayout>
  );
}

const inputStyle = { display: 'block', width: '100%', marginBottom: 10, padding: 8 };
const btnPrimary = { padding: '8px 14px', background: '#1f2937', color: '#fff', border: 'none', cursor: 'pointer' };
const btnGhost = { padding: '8px 14px', background: '#fff', color: '#1f2937', border: '1px solid #1f2937', cursor: 'pointer' };
