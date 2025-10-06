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
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [schedulingLead, setSchedulingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [notesLead, setNotesLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
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
  const [scheduleData, setScheduleData] = useState({
    schedule_date: '',
    schedule_time: ''
  });
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Helper function to check if current user has scheduled this lead
  const hasUserScheduledLead = (lead) => {
    if (!lead.scheduled_by_names) return false;
    const currentUserName = localStorage.getItem('userName');
    return lead.scheduled_by_names.includes(currentUserName);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleScheduleFormChange = (e) => {
    setScheduleData({ ...scheduleData, [e.target.name]: e.target.value });
  };

  const openScheduleForm = (lead) => {
    setSchedulingLead(lead);
    // If user already has a schedule, populate with existing data
    if (hasUserScheduledLead(lead)) {
      // Parse the schedule data from the lead
      const scheduleDates = lead.schedule_dates ? lead.schedule_dates.split(', ') : [];
      const scheduleTimes = lead.schedule_times ? lead.schedule_times.split(', ') : [];
      const scheduledByNames = lead.scheduled_by_names ? lead.scheduled_by_names.split(', ') : [];
      
      // Find the current user's schedule index
      const currentUserName = localStorage.getItem('userName');
      const userScheduleIndex = scheduledByNames.findIndex(name => name === currentUserName);
      
      setScheduleData({
        schedule_date: userScheduleIndex >= 0 ? scheduleDates[userScheduleIndex] : '',
        schedule_time: userScheduleIndex >= 0 ? scheduleTimes[userScheduleIndex] : ''
      });
    } else {
      setScheduleData({
        schedule_date: '',
        schedule_time: ''
      });
    }
    setShowScheduleForm(true);
  };

  const closeScheduleForm = () => {
    setShowScheduleForm(false);
    setSchedulingLead(null);
    setScheduleData({
      schedule_date: '',
      schedule_time: ''
    });
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingLead(null);
  };

  const handleScheduleLead = async (e) => {
    e.preventDefault();
    if (!scheduleData.schedule_date) {
      alert('Schedule date is required');
      return;
    }

    try {
      await api.post(`/leads/${schedulingLead.id}/schedule`, scheduleData);
      alert('Lead scheduled successfully!');
      closeScheduleForm();
      loadLeads(); // Refresh the leads list
    } catch (error) {
      console.error('Error scheduling lead:', error);
      alert('Error scheduling lead');
    }
  };

  const handleCancelSchedule = async (leadId) => {
    if (!window.confirm('Are you sure you want to cancel this schedule?')) return;

    try {
      await api.delete(`/leads/${leadId}/schedule`);
      alert('Schedule cancelled successfully!');
      loadLeads(); // Refresh the leads list
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Error cancelling schedule');
    }
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

  const handleViewLead = async (lead) => {
    setViewingLead(lead);
    setShowViewModal(true);
    await fetchLeadNotes(lead.id);
  };

  const handleAddNote = async (lead) => {
    setNotesLead(lead);
    setShowNotesModal(true);
    await fetchLeadNotes(lead.id);
  };

  const fetchLeadNotes = async (leadId) => {
    try {
      const response = await api.get(`/leads/${leadId}/notes`);
      setLeadNotes(response.data);
    } catch (error) {
      console.error('Error fetching lead notes:', error);
      setLeadNotes([]);
    }
  };

  const handleAddNewNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      const response = await api.post(`/leads/${notesLead.id}/notes`, {
        note: newNote.trim()
      });
      
      setLeadNotes([response.data, ...leadNotes]);
      setNewNote('');
      alert('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await api.delete(`/leads/notes/${noteId}`);
      setLeadNotes(leadNotes.filter(note => note.id !== noteId));
      alert('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note');
    }
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setNotesLead(null);
    setLeadNotes([]);
    setNewNote('');
  };

  const inputStyle = {
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#ffffff',
    width: '100%',
    boxSizing: 'border-box'
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

        {/* Schedule Lead Modal */}
        {showScheduleForm && hasPermission('leads', 'update') && (
          <div 
            onClick={closeScheduleForm}
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
              zIndex: 1000
            }}
          >
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeScheduleForm}
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
                {schedulingLead?.scheduled_by ? 'Reschedule Lead' : 'Schedule Lead'}
              </h3>
              
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '16px' }}>
                  {schedulingLead?.name}
                </h4>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                  {schedulingLead?.company_name && `${schedulingLead.company_name} • `}
                  {schedulingLead?.phone && `${schedulingLead.phone} • `}
                  {schedulingLead?.email}
                </p>
              </div>
              
              <form onSubmit={handleScheduleLead} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}>
                    Schedule Date *
                  </label>
                  <input 
                    type="date" 
                    name="schedule_date" 
                    value={scheduleData.schedule_date} 
                    onChange={handleScheduleFormChange} 
                    required 
                    style={inputStyle}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}>
                    Schedule Time (Optional)
                  </label>
                  <input 
                    type="time" 
                    name="schedule_time" 
                    value={scheduleData.schedule_time} 
                    onChange={handleScheduleFormChange} 
                    style={inputStyle}
                  />
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'flex-end',
                  marginTop: '20px'
                }}>
                  <button 
                    type="button"
                    onClick={closeScheduleForm}
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
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                  >
                    {schedulingLead?.scheduled_by ? 'Reschedule' : 'Schedule'} Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Lead Modal */}
        {showViewModal && viewingLead && (
          <div 
            onClick={closeViewModal}
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
              zIndex: 1000
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '32px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f3f4f6'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Lead Details
                </h2>
                <button 
                  onClick={closeViewModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px'
              }}>
                {/* Basic Information */}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Basic Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Name</label>
                      <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500' }}>{viewingLead.name || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Company</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.company_name || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.email || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Location & Source */}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Location & Source
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>City</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.city || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>State</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.state || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Source</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.source || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Created By</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.created_by_name || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Required */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Service Required
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#1f2937',
                  lineHeight: '1.5',
                  minHeight: '60px'
                }}>
                  {viewingLead.service_required || 'No service requirements specified'}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Notes
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#1f2937',
                  lineHeight: '1.5',
                  minHeight: '60px'
                }}>
                  {viewingLead.notes || 'No notes available'}
                </div>
              </div>

              {/* Schedule Information */}
              {!hasLeadScraperRole() && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Schedule Information
                  </h3>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#1f2937',
                    lineHeight: '1.5'
                  }}>
                    {viewingLead.scheduled_by_names ? (
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Scheduled by:</strong> {viewingLead.scheduled_by_names}
                        </div>
                        {viewingLead.schedule_dates && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Schedule dates:</strong> {viewingLead.schedule_dates}
                          </div>
                        )}
                        {viewingLead.schedule_times && (
                          <div>
                            <strong>Schedule times:</strong> {viewingLead.schedule_times}
                          </div>
                        )}
                      </div>
                    ) : (
                      'No schedules available'
                    )}
                  </div>
                </div>
              )}

              {/* User Notes */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  User Notes ({leadNotes.length})
                </h3>
                
                {leadNotes.length === 0 ? (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    No user notes yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leadNotes.map((note) => (
                      <div key={note.id} style={{
                        backgroundColor: '#f9fafb',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1f2937',
                              marginBottom: '2px'
                            }}>
                              {note.user_name}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7280'
                            }}>
                              {new Date(note.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {note.note}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <div>
                    <strong>Created:</strong> {viewingLead.created_at ? new Date(viewingLead.created_at).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {viewingLead.updated_at ? new Date(viewingLead.updated_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button 
                  onClick={closeViewModal}
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
                  Close
                </button>
            </div>
          </div>
        </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && notesLead && (
          <div 
            onClick={closeNotesModal}
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
              zIndex: 1000
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '32px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f3f4f6'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Notes for {notesLead.name}
                </h2>
                <button 
                  onClick={closeNotesModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>

              {/* Add New Note Form */}
              {hasPermission('lead_notes', 'create') && (
                <form onSubmit={handleAddNewNote} style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151' 
                    }}>
                      Add New Note
                    </label>
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '100px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                  }}>
                    <button 
                      type="button"
                      onClick={closeNotesModal}
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
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Previous Notes ({leadNotes.length})
                </h3>
                
                {leadNotes.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <p style={{ margin: 0, fontSize: '16px' }}>No notes yet</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Add the first note using the form above</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {leadNotes.map((note) => (
                      <div key={note.id} style={{
                        backgroundColor: '#f9fafb',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1f2937',
                              marginBottom: '4px'
                            }}>
                              {note.user_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              {new Date(note.created_at).toLocaleString()}
                            </div>
                          </div>
                          {hasPermission('lead_notes', 'delete') && (
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {note.note}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                gridTemplateColumns: hasLeadScraperRole() ? '1.5fr 1.5fr 1fr 1fr 1fr 1fr' : '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
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
                <div>Date</div>
                {!hasLeadScraperRole() && <div>Scheduled By</div>}
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {leads.map((lead, index) => (
                <div key={lead.id} style={{
                  display: 'grid',
                  gridTemplateColumns: hasLeadScraperRole() ? '1.5fr 1.5fr 1fr 1fr 1fr 1fr' : '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
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
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  {!hasLeadScraperRole() && (
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {lead.scheduled_by_names || 'Not scheduled'}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <button 
                      onClick={() => handleViewLead(lead)}
                      style={{
                        backgroundColor: '#6366f1',
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
                      View
                    </button>
                    {hasPermission('lead_notes', 'create') && (
                      <button 
                        onClick={() => handleAddNote(lead)}
                        style={{
                          backgroundColor: '#f59e0b',
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
                        Notes
                      </button>
                    )}
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
                    {hasPermission('leads', 'update') && !hasLeadScraperRole() && (
                      <button 
                        onClick={() => openScheduleForm(lead)}
                        style={{
                          backgroundColor: hasUserScheduledLead(lead) ? '#f59e0b' : '#8b5cf6',
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
                        {hasUserScheduledLead(lead) ? 'Reschedule' : 'Schedule'}
                      </button>
                    )}
                    {hasPermission('leads', 'update') && hasUserScheduledLead(lead) && !hasLeadScraperRole() && (
                      <button 
                        onClick={() => handleCancelSchedule(lead.id)}
                        style={{
                          backgroundColor: '#ef4444',
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
                        Cancel
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
