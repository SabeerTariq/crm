import { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import api from '../services/api';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]); // [{module, action}]
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [form, setForm] = useState({ name: '', description: '' });
  const [mode, setMode] = useState('create'); // 'create' | 'edit'

  const [rolePerms, setRolePerms] = useState([]); // [{id, module, action} for selected role]
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [loading, setLoading] = useState(true);

  const tokenHeader = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  );

  // Build permissions matrix: { [module]: Set(actions) }
  const selectedPermMap = useMemo(() => {
    const map = {};
    for (const p of rolePerms) {
      map[p.module] ||= new Set();
      map[p.module].add(p.action);
    }
    return map;
  }, [rolePerms]);

  const availableModules = useMemo(() => {
    // { module: Set(actions) } derived from /modules
    const map = {};
    for (const m of modules) {
      map[m.module] ||= new Set();
      map[m.module].add(m.action);
    }
    // return array of { module, actions: string[] }
    const result = Object.entries(map).map(([module, set]) => ({
      module,
      actions: Array.from(set).sort((a, b) => {
        // Custom sort order: view, create, read, update, delete
        const order = { 'view': 0, 'create': 1, 'read': 2, 'update': 3, 'delete': 4 };
        return (order[a] || 5) - (order[b] || 5);
      }),
    })).sort((a,b)=>a.module.localeCompare(b.module));
    
    console.log('Available modules with actions:', result);
    return result;
  }, [modules]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rolesRes, modulesRes] = await Promise.all([
        api.get('/rbac/roles', { headers: tokenHeader }),
        api.get('/rbac/modules', { headers: tokenHeader }),
      ]);
      setRoles(rolesRes.data);
      console.log('Loaded modules:', modulesRes.data);
      setModules(modulesRes.data);
      // If there is at least one role, preselect it in edit mode
      if (rolesRes.data.length > 0) {
        const first = rolesRes.data[0];
        setSelectedRoleId(first.id);
        setMode('edit');
        setForm({ name: first.name, description: first.description || '' });
        await loadRolePermissions(first.id);
      } else {
        setMode('create');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load roles/modules');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const res = await api.get(`/rbac/roles/${roleId}/permissions`, { headers: tokenHeader });
      setRolePerms(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load role permissions');
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = async (role) => {
    setSelectedRoleId(role.id);
    setMode('edit');
    setForm({ name: role.name, description: role.description || '' });
    await loadRolePermissions(role.id);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createRole = async (e) => {
    e.preventDefault();
    setSavingBasic(true);
    try {
      const res = await api.post('/rbac/roles', form, { headers: tokenHeader });
      alert('Role created');
      setForm({ name: '', description: '' });
      setMode('create');
      await loadAll();
      // auto-select the new role
      setSelectedRoleId(res.data.id);
      setMode('edit');
      await loadRolePermissions(res.data.id);
    } catch (e) {
      alert(e.response?.data?.message || 'Create failed');
    } finally {
      setSavingBasic(false);
    }
  };

  const updateRole = async (e) => {
    e.preventDefault();
    if (!selectedRoleId) return;
    setSavingBasic(true);
    try {
      await api.put(`/rbac/roles/${selectedRoleId}`, form, { headers: tokenHeader });
      alert('Role updated');
      await loadAll();
      // keep selection
      setSelectedRoleId(selectedRoleId);
      setMode('edit');
      await loadRolePermissions(selectedRoleId);
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setSavingBasic(false);
    }
  };

  const togglePermission = (module, action) => {
    // if exists -> remove; else -> add
    const has = selectedPermMap[module]?.has(action);
    if (has) {
      // remove from rolePerms
      setRolePerms(prev => prev.filter(p => !(p.module === module && p.action === action)));
    } else {
      // add a phantom perm entry (id not required for submit)
      setRolePerms(prev => [...prev, { module, action }]);
    }
  };

  const savePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingPerms(true);
    try {
      // build payload: unique module-action pairs
      const payload = {
        permissions: rolePerms.map(p => ({ module: p.module, action: p.action })),
      };
      await api.post(`/rbac/roles/${selectedRoleId}/permissions`, payload, { headers: tokenHeader });
      alert('Permissions saved');
      await loadRolePermissions(selectedRoleId); // refresh from DB
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <PageLayout>
        <h2>Role Management</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Left: Roles list + create/edit form */}
            <div>
              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Existing Roles</h3>
                {roles.length === 0 && <p>No roles yet</p>}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {roles.map(r => (
                    <li key={r.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 10px', border: '1px solid #e5e7eb', marginBottom: 8,
                      background: selectedRoleId === r.id ? '#eef2ff' : '#fff',
                      cursor: 'pointer'
                    }}
                        onClick={() => handleSelectRole(r)}>
                      <span><strong>{r.name}</strong></span>
                      <span style={{ color: '#6b7280' }}>#{r.id}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>{mode === 'create' ? 'Create Role' : 'Edit Role'}</h3>
                <form onSubmit={mode === 'create' ? createRole : updateRole}>
                  <input
                    name="name"
                    placeholder="Role name (e.g., Sales, Viewer)"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={input}
                  />
                  <textarea
                    name="description"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    style={input}
                  />
                  <button type="submit" disabled={savingBasic} style={btnPrimary}>
                    {savingBasic ? 'Saving...' : (mode === 'create' ? 'Create Role' : 'Update Role')}
                  </button>
                  {mode === 'edit' && (
                    <button
                      type="button"
                      style={btnGhost}
                      onClick={() => { setMode('create'); setForm({ name: '', description: '' }); setSelectedRoleId(null); }}
                    >
                      New Role
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Right: Permissions matrix */}
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Permissions</h3>
              {!selectedRoleId ? (
                <p>Select a role to edit permissions.</p>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thTd}>Module</th>
                          <th style={thTd}>View</th>
                          <th style={thTd}>Create</th>
                          <th style={thTd}>Read</th>
                          <th style={thTd}>Update</th>
                          <th style={thTd}>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableModules.map(({ module, actions }) => {
                          const has = (action) => selectedPermMap[module]?.has(action);
                          const cell = (action) => (
                            <td style={thTd}>
                              {actions.includes(action) ? (
                                <input
                                  type="checkbox"
                                  checked={!!has(action)}
                                  onChange={() => togglePermission(module, action)}
                                />
                              ) : <span style={{ color: '#9ca3af' }}>—</span>}
                            </td>
                          );

                          return (
                            <tr key={module}>
                              <td style={thTd}><strong>{module}</strong></td>
                              {cell('view')}
                              {cell('create')}
                              {cell('read')}
                              {cell('update')}
                              {cell('delete')}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button onClick={savePermissions} disabled={savingPerms} style={btnPrimary}>
                      {savingPerms ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </PageLayout>
  );
}

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 };
const input = { display: 'block', width: '100%', padding: 10, marginBottom: 10, border: '1px solid #e5e7eb', borderRadius: 6 };
const btnPrimary = { padding: '10px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 };
const btnGhost = { padding: '10px 14px', background: '#fff', color: '#111827', border: '1px solid #111827', borderRadius: 6, cursor: 'pointer' };
const thTd = { border: '1px solid #e5e7eb', padding: 8, textAlign: 'center' };
