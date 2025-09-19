import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { getUserName } from '../utils/userUtils';
import { hasLeadScraperRole } from '../utils/roleUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    createdBy: '',
    startDate: '',
    endDate: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    sources: [],
    users: []
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    source: '',
    service_required: '',
    notes: '',
  });
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitLead = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/leads', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Lead added successfully!');
      setFormData({ 
        name: '', 
        company_name: '', 
        email: '', 
        phone: '', 
        city: '', 
        state: '', 
        source: '', 
        service_required: '', 
        notes: ''
      });
      setShowAddForm(false);
      // Refresh leads list
      loadLeads();
    } catch (err) {
      alert('Error adding lead');
      console.error(err);
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      company_name: lead.company_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      city: lead.city || '',
      state: lead.state || '',
      source: lead.source || '',
      service_required: lead.service_required || '',
      notes: lead.notes || '',
    });
    setShowEditForm(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.put(`/leads/${editingLead.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Lead updated successfully!');
      setShowEditForm(false);
      setEditingLead(null);
      setFormData({ 
        name: '', 
        company_name: '', 
        email: '', 
        phone: '', 
        city: '', 
        state: '', 
        source: '', 
        service_required: '', 
        notes: ''
      });
      // Refresh leads list
      loadLeads();
    } catch (err) {
      alert('Error updating lead');
      console.error(err);
    }
  };

  const loadLeads = useCallback(async (page = 1) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await api.get(`/leads?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLeads(response.data.leads);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching leads:', error);
      alert('Failed to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  const loadFilterOptions = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get('/leads/filter-options', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadLeads(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      source: '',
      createdBy: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    loadLeads(1);
  };

  const handlePageChange = (newPage) => {
    loadLeads(newPage);
  };

  const handleModalClose = (e) => {
    // Close modal when clicking on the backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      setShowAddForm(false);
      setShowEditForm(false);
    }
  };

  const convertLead = (lead) => {
    // Check permission before allowing conversion - convert requires sales.create permission
    if (!hasPermission('sales', 'create')) {
      alert('You do not have permission to create sales');
      return;
    }
    
    // Store lead data in localStorage to pre-fill sales form
    const leadData = {
      lead_id: lead.id,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      lead_company: lead.company_name,
      lead_city_state: lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.city || lead.state || '',
      lead_service_required: lead.service_required,
      lead_source: lead.source,
      lead_notes: lead.notes
    };
    
    localStorage.setItem('leadToConvert', JSON.stringify(leadData));
    
    // Navigate to sales page
    navigate('/sales');
  };

  useEffect(() => {
    // Check permission before fetching data
    if (!hasPermission('leads', 'read')) {
      return;
    }
    
    loadLeads();
    loadFilterOptions();
  }, [hasPermission, loadLeads, loadFilterOptions]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showAddForm) {
          setShowAddForm(false);
        } else if (showEditForm) {
          setShowEditForm(false);
        }
      }
    };

    if (showAddForm || showEditForm) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, showEditForm]);

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return (
      <PageLayout>
          <div>Loading permissions...</div>
      </PageLayout>
    );
  }

  // Check if user has permission to view leads
  if (!hasPermission('leads', 'read')) {
    return (
      <PageLayout>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px',
            color: '#dc2626'
          }}>
            <h3>Access Denied</h3>
            <p>You do not have permission to view leads.</p>
          </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h1 style={{ 
              margin: '0', 
              color: '#1f2937',
              fontSize: '32px',
              fontWeight: '700'
            }}>
              Leads Management
            </h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔍 Filters
              </button>
              {hasPermission('leads', 'create') && (
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Add Lead
              </button>
            )}
            </div>
          </div>
          <p style={{ 
            color: '#6b7280', 
            margin: '0',
            fontSize: '16px'
          }}>
            {hasLeadScraperRole() ? (
              <>
                Managing your leads for <strong>{getUserName()}</strong>
                <br />
                <small style={{ color: '#9ca3af' }}>
                  As a lead-scraper, you can only see and manage leads that you have created.
                </small>
              </>
            ) : (
              <>Managing leads for <strong>{getUserName()}</strong></>
            )}
          </p>
        </div>

        {/* Search and Filters */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'stretch',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                flex: '1', 
                minWidth: '300px',
                position: 'relative' 
              }}>
                <input
                  type="text"
                  name="search"
                  placeholder="Search leads by name, email, phone, or notes..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  fontSize: '18px',
                  pointerEvents: 'none'
                }}>
                  🔍
                </div>
              </div>
              <button
                onClick={handleSearch}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  minWidth: '100px',
                  height: '48px'
                }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '20px'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Source
                  </label>
                  <select
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">All Sources</option>
                    {filterOptions.sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Created By
                  </label>
                  <select
                    name="createdBy"
                    value={filters.createdBy}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">All Users</option>
                    {filterOptions.users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleSearch}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Lead Modal */}
        {showAddForm && hasPermission('leads', 'create') && (
          <div 
            onClick={handleModalClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
          <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>

              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600',
                paddingRight: '40px'
              }}>
                Add New Lead
              </h3>
              
              <form onSubmit={submitLead} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px' 
              }}>
              <input 
                type="text" 
                name="name" 
                  placeholder="Contact Name *" 
                value={formData.name} 
                onChange={handleFormChange} 
                required 
                style={inputStyle}
              />
                <input 
                  type="text" 
                  name="company_name" 
                  placeholder="Company/Business Name" 
                  value={formData.company_name} 
                  onChange={handleFormChange} 
                style={inputStyle}
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Email *" 
                value={formData.email} 
                onChange={handleFormChange} 
                required 
                style={inputStyle}
              />
              <input 
                type="text" 
                name="phone" 
                placeholder="Phone" 
                value={formData.phone} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
                <input 
                  type="text" 
                  name="city" 
                  placeholder="City" 
                  value={formData.city} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="state" 
                  placeholder="State" 
                  value={formData.state} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
              <input 
                type="text" 
                name="source" 
                placeholder="Source (e.g. Facebook, Web)" 
                value={formData.source} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
                <input 
                  type="text" 
                  name="service_required" 
                  placeholder="Service Required" 
                  value={formData.service_required} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
              <textarea 
                name="notes" 
                placeholder="Notes" 
                value={formData.notes} 
                onChange={handleFormChange} 
                  style={{...inputStyle, gridColumn: '1 / -1', minHeight: '100px', resize: 'vertical'}}
              />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                    cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                  }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                  Cancel
                </button>
                  <button 
                    type="submit" 
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  Add Lead
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {showEditForm && hasPermission('leads', 'update') && (
          <div 
            onClick={handleModalClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
          <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowEditForm(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>

              <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600',
                paddingRight: '40px'
              }}>
                Edit Lead
              </h3>
              
              <form onSubmit={handleUpdateLead} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px' 
              }}>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Contact Name *" 
                  value={formData.name} 
                  onChange={handleFormChange} 
                  required 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="company_name" 
                  placeholder="Company/Business Name" 
                  value={formData.company_name} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email *" 
                  value={formData.email} 
                  onChange={handleFormChange} 
                  required 
                  style={inputStyle}
                />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Phone" 
                  value={formData.phone} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="city" 
                  placeholder="City" 
                  value={formData.city} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="state" 
                  placeholder="State" 
                  value={formData.state} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <select 
                  name="source" 
                  value={formData.source} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                >
                  <option value="">Select Source</option>
                  {filterOptions.sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  name="service_required" 
                  placeholder="Service Required" 
                  value={formData.service_required} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <textarea 
                  name="notes" 
                  placeholder="Notes" 
                  value={formData.notes} 
                  onChange={handleFormChange} 
                  style={{...inputStyle, gridColumn: '1 / -1', minHeight: '100px', resize: 'vertical'}}
                />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditForm(false)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                    cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                  }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                  Cancel
                </button>
                  <button 
                    type="submit" 
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    Update Lead
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {loading ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
                  {hasLeadScraperRole() ? (
                    <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No leads found</h3>
                  <p style={{ margin: '0 0 16px 0' }}>
                        As a lead-scraper, you can only see leads that you have created. 
                  </p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#9ca3af' }}>
                    Start by adding your first lead using the "Add Lead" button above.
                      </p>
                    </div>
                  ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No leads found</h3>
                  <p style={{ margin: '0' }}>
                    No leads match your current search criteria.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '12px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: '600',
                fontSize: '12px',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Name</div>
                <div>Company</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Location</div>
                <div>Service</div>
                <div>Source</div>
                <div>Created By</div>
                <div>Date</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {leads.map((lead, index) => (
                <div key={lead.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '12px',
                  padding: '16px 20px',
                  borderBottom: index < leads.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: '#ffffff',
                  transition: 'background-color 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.company_name || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.email}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.phone || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.city && lead.state ? `${lead.city}, ${lead.state}` : 
                     lead.city ? lead.city : 
                     lead.state ? lead.state : 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.service_required || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.source || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.created_by_name || 'Unknown'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    {hasPermission('leads', 'update') && (
                      <button 
                        onClick={() => handleEditLead(lead)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission('sales', 'create') && (
                      <button 
                        onClick={() => convertLead(lead)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Convert
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: pagination.page === 1 ? '#f9fafb' : '#ffffff',
                        color: pagination.page === 1 ? '#9ca3af' : '#374151',
                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: pagination.page === pagination.pages ? '#f9fafb' : '#ffffff',
                        color: pagination.page === pagination.pages ? '#9ca3af' : '#374151',
                        cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Next
                    </button>
      </div>
    </div>
              )}
            </>
          )}
        </div>
    </PageLayout>
  );
}

const inputStyle = {
  padding: '12px 16px',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  backgroundColor: '#ffffff',
  ':focus': {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  }
};
