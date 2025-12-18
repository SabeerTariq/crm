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
    source: [],
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
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [schedulingLead, setSchedulingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [notesLead, setNotesLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    nature_of_business: '',
    email: '',
    business_email: '',
    phone: '',
    business_number: '',
    business_description: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    source: '',
    service_required: '',
    notes: '',
    budget: '',
    hours_type: '',
    day_type: '',
    created_at: '',
  });
  const [scheduleData, setScheduleData] = useState({
    schedule_date: '',
    schedule_time: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [leadDocuments, setLeadDocuments] = useState({});
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [loadingConvertedLeads, setLoadingConvertedLeads] = useState(false);
  const [convertedLeadsSearchEmail, setConvertedLeadsSearchEmail] = useState('');
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
      const response = await api.post('/leads', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get the lead ID from the response or fetch the latest lead
      let leadId = null;
      if (response.data.lead_id) {
        leadId = response.data.lead_id;
      } else if (response.data.id) {
        leadId = response.data.id;
      } else {
        // If no ID in response, reload leads and get the first one (most recent)
        await loadLeads();
        if (leads.length > 0) {
          leadId = leads[0].id;
        }
      }
      
      // Upload documents if any files are selected
      if (selectedFiles.length > 0 && leadId) {
        await uploadDocuments(leadId);
      }
      
      alert('Lead added successfully!');
      setFormData({ 
        name: '', 
        company_name: '', 
        nature_of_business: '',
        email: '', 
        business_email: '',
        phone: '', 
        business_number: '',
        business_description: '',
        city: '', 
        state: '', 
        source: '', 
        service_required: '', 
        notes: '',
        budget: '',
        hours_type: '',
        day_type: '',
        created_at: ''
      });
      setSelectedFiles([]);
      setShowAddForm(false);
      // Refresh leads list
      loadLeads();
    } catch (err) {
      alert('Error adding lead');
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const uploadDocuments = async (leadId) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });
      
      await api.post(`/leads/${leadId}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Fetch documents after upload
      await fetchLeadDocuments(leadId);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Error uploading documents');
    }
  };

  const fetchLeadDocuments = async (leadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/leads/${leadId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both response formats: response.data.documents or response.data directly
      const documents = response.data.documents || response.data || [];
      setLeadDocuments(prev => ({
        ...prev,
        [leadId]: Array.isArray(documents) ? documents : []
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Set empty array on error to prevent undefined issues
      setLeadDocuments(prev => ({
        ...prev,
        [leadId]: []
      }));
    }
  };

  const downloadDocument = async (leadId, documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/leads/${leadId}/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  const deleteDocument = async (leadId, documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/leads/${leadId}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Document deleted successfully');
      await fetchLeadDocuments(leadId);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  const handlePhoneClick = async (e, lead) => {
    e.preventDefault();
    if (!lead.phone) return;
    
    // Open phone app immediately (don't wait for tracking)
    window.location.href = `tel:${lead.phone}`;
    
    // Track click in background (non-blocking)
    try {
      const token = localStorage.getItem('token');
      api.post(`/leads/${lead.id}/track-phone-click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        // Update local state - fetch fresh data to get employee-specific counts
        api.get('/leads', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data && response.data.leads) {
            setLeads(response.data.leads);
            // Update viewingLead if it's the same lead
            if (viewingLead && viewingLead.id === lead.id) {
              const updatedLead = response.data.leads.find(l => l.id === lead.id);
              if (updatedLead) {
                setViewingLead(updatedLead);
              }
            }
          }
        }).catch(err => console.error('Error fetching updated leads:', err));
      }).catch(error => {
        console.error('Error tracking phone click:', error);
      });
    } catch (error) {
      console.error('Error tracking phone click:', error);
    }
  };

  const handleEmailClick = async (e, lead) => {
    e.preventDefault();
    if (!lead.email) return;
    
    // Open email app immediately (don't wait for tracking)
    window.location.href = `mailto:${lead.email}`;
    
    // Track click in background (non-blocking)
    try {
      const token = localStorage.getItem('token');
      api.post(`/leads/${lead.id}/track-email-click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        // Update local state - fetch fresh data to get employee-specific counts
        api.get('/leads', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data && response.data.leads) {
            setLeads(response.data.leads);
            // Update viewingLead if it's the same lead
            if (viewingLead && viewingLead.id === lead.id) {
              const updatedLead = response.data.leads.find(l => l.id === lead.id);
              if (updatedLead) {
                setViewingLead(updatedLead);
              }
            }
          }
        }).catch(err => console.error('Error fetching updated leads:', err));
      }).catch(error => {
        console.error('Error tracking email click:', error);
      });
    } catch (error) {
      console.error('Error tracking email click:', error);
    }
  };

  const handleBusinessEmailClick = async (e, lead) => {
    e.preventDefault();
    if (!lead.business_email) return;
    
    // Open email app immediately (don't wait for tracking)
    window.location.href = `mailto:${lead.business_email}`;
    
    // Track click in background (non-blocking)
    try {
      const token = localStorage.getItem('token');
      api.post(`/leads/${lead.id}/track-business-email-click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        // Update local state - fetch fresh data to get employee-specific counts
        api.get('/leads', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data && response.data.leads) {
            setLeads(response.data.leads);
            // Update viewingLead if it's the same lead
            if (viewingLead && viewingLead.id === lead.id) {
              const updatedLead = response.data.leads.find(l => l.id === lead.id);
              if (updatedLead) {
                setViewingLead(updatedLead);
              }
            }
          }
        }).catch(err => console.error('Error fetching updated leads:', err));
      }).catch(error => {
        console.error('Error tracking business email click:', error);
      });
    } catch (error) {
      console.error('Error tracking business email click:', error);
    }
  };

  const handleBusinessPhoneClick = async (e, lead) => {
    e.preventDefault();
    if (!lead.business_number) return;
    
    // Open phone app immediately (don't wait for tracking)
    window.location.href = `tel:${lead.business_number}`;
    
    // Track click in background (non-blocking)
    try {
      const token = localStorage.getItem('token');
      api.post(`/leads/${lead.id}/track-business-phone-click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        // Update local state - fetch fresh data to get employee-specific counts
        api.get('/leads', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          if (response.data && response.data.leads) {
            setLeads(response.data.leads);
            // Update viewingLead if it's the same lead
            if (viewingLead && viewingLead.id === lead.id) {
              const updatedLead = response.data.leads.find(l => l.id === lead.id);
              if (updatedLead) {
                setViewingLead(updatedLead);
              }
            }
          }
        }).catch(err => console.error('Error fetching updated leads:', err));
      }).catch(error => {
        console.error('Error tracking business phone click:', error);
      });
    } catch (error) {
      console.error('Error tracking business phone click:', error);
    }
  };

  const handleEditLead = async (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      company_name: lead.company_name || '',
      nature_of_business: lead.nature_of_business || '',
      email: lead.email || '',
      business_email: lead.business_email || '',
      phone: lead.phone || '',
      business_number: lead.business_number || '',
      business_description: lead.business_description || '',
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || '',
      zip_code: lead.zip_code || '',
      source: lead.source || '',
      service_required: lead.service_required || '',
      notes: lead.notes || '',
      budget: lead.budget || '',
      hours_type: lead.hours_type || '',
      day_type: lead.day_type || '',
      created_at: lead.created_at ? new Date(lead.created_at).toISOString().slice(0, 16) : '',
    });
    setSelectedFiles([]);
    await fetchLeadDocuments(lead.id);
    setShowEditForm(true);
  };

  const handleViewLead = async (lead) => {
    setViewingLead(lead);
    setShowViewModal(true);
    await fetchLeadNotes(lead.id);
    await fetchLeadDocuments(lead.id);
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

  const closeCsvImportModal = () => {
    setShowCsvImportModal(false);
    setCsvFile(null);
    setCsvPreview([]);
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseCsvFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        data.push(row);
      }
      
      setCsvPreview(data.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }
    
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file must have at least a header row and one data row');
          setImporting(false);
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const leads = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
          const lead = {};
          
          headers.forEach((header, index) => {
            lead[header] = values[index] || '';
          });
          
          leads.push(lead);
        }
        
        const token = localStorage.getItem('token');
        const response = await api.post('/leads/import-csv', { leads }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(response.data.message);
        closeCsvImportModal();
        loadLeads(); // Refresh the leads list
        
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Error importing CSV file');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      {
        name: 'John Doe',
        company_name: 'ABC Corporation',
        email: 'john.doe@abccorp.com',
        phone: '+1-555-0123',
        city: 'New York',
        state: 'NY',
        source: 'Website',
        service_required: 'Web Development',
        notes: 'Interested in e-commerce platform'
      },
      {
        name: 'Jane Smith',
        company_name: 'XYZ Industries',
        email: 'jane.smith@xyz.com',
        phone: '+1-555-0456',
        city: 'Los Angeles',
        state: 'CA',
        source: 'Referral',
        service_required: 'Mobile App',
        notes: 'Urgent project deadline'
      },
      {
        name: 'Mike Johnson',
        company_name: 'Tech Solutions Inc',
        email: 'mike@techsolutions.com',
        phone: '+1-555-0789',
        city: 'Chicago',
        state: 'IL',
        source: 'Cold Call',
        service_required: 'Consulting',
        notes: 'Looking for digital transformation'
      },
      {
        name: 'Sarah Williams',
        company_name: 'StartupCo',
        email: 'sarah@startupco.com',
        phone: '+1-555-0321',
        city: 'Austin',
        state: 'TX',
        source: 'Social Media',
        service_required: 'Marketing',
        notes: 'Early stage startup'
      },
      {
        name: 'David Brown',
        company_name: 'Enterprise Ltd',
        email: 'david.brown@enterprise.com',
        phone: '+1-555-0654',
        city: 'Seattle',
        state: 'WA',
        source: 'Trade Show',
        service_required: 'Cloud Migration',
        notes: 'Large enterprise client'
      }
    ];

    // Create CSV content
    const headers = [
      'name',
      'company_name', 
      'email',
      'phone',
      'city',
      'state',
      'source',
      'service_required',
      'notes'
    ];

    let csvContent = headers.join(',') + '\n';
    
    sampleData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_leads_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      // Upload documents if any files are selected
      if (selectedFiles.length > 0) {
        await uploadDocuments(editingLead.id);
      }
      
      alert('Lead updated successfully!');
      setShowEditForm(false);
      setEditingLead(null);
      setFormData({ 
        name: '', 
        company_name: '', 
        nature_of_business: '',
        email: '', 
        business_email: '',
        phone: '', 
        business_number: '',
        business_description: '',
        city: '', 
        state: '', 
        source: '', 
        service_required: '', 
        notes: '',
        budget: '',
        hours_type: '',
        day_type: '',
        created_at: ''
      });
      setSelectedFiles([]);
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
      // Build query params, only including non-empty filter values
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      // Add filters only if they have values
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.source && filters.source.length > 0) {
        filters.source.forEach(source => queryParams.append('source', source));
        console.log('Frontend - Sending source filters:', filters.source);
        console.log('Frontend - Query string:', queryParams.toString());
      }
      if (filters.createdBy) queryParams.append('createdBy', filters.createdBy);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const url = `/leads?${queryParams}`;
      console.log('Frontend - Full API URL:', url);
      
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Frontend - Response received:', {
        leadsCount: response.data.leads?.length || 0,
        total: response.data.pagination?.total || 0,
        sampleSources: response.data.leads?.slice(0, 3).map(l => l.source) || []
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

  const loadConvertedLeads = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoadingConvertedLeads(true);
    try {
      const response = await api.get('/leads/converted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConvertedLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching converted leads:', error);
    } finally {
      setLoadingConvertedLeads(false);
    }
  }, []);

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
  
  // Auto-apply filters when source, createdBy, startDate, or endDate changes
  useEffect(() => {
    // Only auto-apply if filters panel is open (to avoid applying on initial load)
    if (showFilters) {
      const timer = setTimeout(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadLeads(1);
      }, 300); // Debounce to avoid too many API calls
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters.source), filters.createdBy, filters.startDate, filters.endDate, showFilters]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadLeads(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      source: [],
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
    loadConvertedLeads();
  }, [hasPermission, loadLeads, loadFilterOptions, loadConvertedLeads]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showAddForm) {
          setShowAddForm(false);
        } else if (showEditForm) {
          setShowEditForm(false);
        } else if (openDropdownId) {
          setOpenDropdownId(null);
        }
      }
    };

    if (showAddForm || showEditForm) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      if (showAddForm || showEditForm) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [showAddForm, showEditForm, openDropdownId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

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
                  backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
                  color: showFilters ? 'white' : '#374151',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fas fa-filter"></i>
                Filters
                <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
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
              {hasPermission('leads', 'create') && (
                <button 
                  onClick={() => setShowCsvImportModal(true)}
                  style={{
                    backgroundColor: '#10b981',
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
                  📊 Import CSV
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
              borderTop: '2px solid #e2e8f0',
              paddingTop: '20px',
              marginTop: '20px'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Source
                  </label>
                  
                  {/* Selected Source Tags */}
                  {filters.source.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      minHeight: '40px'
                    }}>
                      {filters.source.map((selectedSource, index) => (
                        <span
                          key={index}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          {selectedSource}
                          <button
                            type="button"
                            onClick={() => {
                              setFilters(prev => ({
                                ...prev,
                                source: prev.source.filter((_, i) => i !== index)
                              }));
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.3)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              padding: 0,
                              lineHeight: 1
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Source Selection Dropdown */}
                  <select
                    name="source"
                    value=""
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      if (selectedValue && !filters.source.includes(selectedValue)) {
                        setFilters(prev => ({
                          ...prev,
                          source: [...prev.source, selectedValue]
                        }));
                      }
                      e.target.value = ''; // Reset dropdown
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select a source to add...</option>
                    {filterOptions.sources
                      .filter(source => !filters.source.includes(source))
                      .map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                  </select>
                  
                  {filters.source.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, source: [] }))}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      Clear All Sources
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
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
                      backgroundColor: '#ffffff',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                    marginBottom: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
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
                      backgroundColor: '#ffffff',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
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
                      backgroundColor: '#ffffff',
                      transition: 'border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                type="text" 
                name="nature_of_business" 
                placeholder="Nature of Business" 
                value={formData.nature_of_business} 
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
                type="email" 
                name="business_email" 
                placeholder="Business Email" 
                value={formData.business_email} 
                onChange={handleFormChange} 
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
                name="business_number" 
                placeholder="Business Number" 
                value={formData.business_number} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
              <textarea 
                name="business_description" 
                placeholder="Business Description" 
                value={formData.business_description} 
                onChange={handleFormChange} 
                style={{...inputStyle, gridColumn: '1 / -1', minHeight: '80px', resize: 'vertical'}}
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
                  name="country" 
                  placeholder="Country" 
                  value={formData.country} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="zip_code" 
                  placeholder="Zip Code" 
                  value={formData.zip_code} 
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
                <option value="Bark Picked">Bark Picked</option>
                <option value="Bark Scrapped">Bark Scrapped</option>
                <option value="Linkedin">Linkedin</option>
                <option value="Facebook">Facebook</option>
                <option value="Others">Others</option>
              </select>
              <input 
                type="text" 
                name="budget" 
                placeholder="Budget" 
                value={formData.budget} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
              <input 
                type="datetime-local" 
                name="created_at" 
                placeholder="Created Date & Time" 
                value={formData.created_at} 
                onChange={handleFormChange} 
                style={inputStyle}
              />
              <select 
                name="hours_type" 
                value={formData.hours_type} 
                onChange={handleFormChange} 
                style={inputStyle}
              >
                <option value="">Select Hours Type</option>
                <option value="Rush hours">Rush hours</option>
                <option value="Normal hours">Normal hours</option>
              </select>
              <select 
                name="day_type" 
                value={formData.day_type} 
                onChange={handleFormChange} 
                style={inputStyle}
              >
                <option value="">Select Day Type</option>
                <option value="Weekend">Weekend</option>
                <option value="Weekdays">Weekdays</option>
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
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  Upload Documents/Media
                </label>
                <input 
                  type="file" 
                  multiple
                  onChange={handleFileChange}
                  style={{
                    ...inputStyle,
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip,.rar,.mp4,.mpeg,.mp3,.wav"
                />
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>
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
                  type="text" 
                  name="nature_of_business" 
                  placeholder="Nature of Business" 
                  value={formData.nature_of_business} 
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
                  type="email" 
                  name="business_email" 
                  placeholder="Business Email" 
                  value={formData.business_email} 
                  onChange={handleFormChange} 
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
                  name="business_number" 
                  placeholder="Business Number" 
                  value={formData.business_number} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <textarea 
                  name="business_description" 
                  placeholder="Business Description" 
                  value={formData.business_description} 
                  onChange={handleFormChange} 
                  style={{...inputStyle, gridColumn: '1 / -1', minHeight: '80px', resize: 'vertical'}}
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
                  name="country" 
                  placeholder="Country" 
                  value={formData.country} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="zip_code" 
                  placeholder="Zip Code" 
                  value={formData.zip_code} 
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
                  <option value="Bark Picked">Bark Picked</option>
                  <option value="Bark Scrapped">Bark Scrapped</option>
                  <option value="Linkedin">Linkedin</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Others">Others</option>
                </select>
                <input 
                  type="text" 
                  name="budget" 
                  placeholder="Budget" 
                  value={formData.budget} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <input 
                  type="datetime-local" 
                  name="created_at" 
                  placeholder="Created Date & Time" 
                  value={formData.created_at} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                />
                <select 
                  name="hours_type" 
                  value={formData.hours_type} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                >
                  <option value="">Select Hours Type</option>
                  <option value="Rush hours">Rush hours</option>
                  <option value="Normal hours">Normal hours</option>
                </select>
                <select 
                  name="day_type" 
                  value={formData.day_type} 
                  onChange={handleFormChange} 
                  style={inputStyle}
                >
                  <option value="">Select Day Type</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Weekdays">Weekdays</option>
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Upload Documents/Media
                  </label>
                  <input 
                    type="file" 
                    multiple
                    onChange={handleFileChange}
                    style={{
                      ...inputStyle,
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip,.rar,.mp4,.mpeg,.mp3,.wav"
                  />
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      {selectedFiles.length} new file(s) selected
                    </div>
                  )}
                  
                  {/* Display existing documents */}
                  {editingLead && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#374151' 
                      }}>
                        Existing Documents
                      </label>
                      {leadDocuments[editingLead.id] !== undefined ? (
                        Array.isArray(leadDocuments[editingLead.id]) && leadDocuments[editingLead.id].length > 0 ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '8px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            {leadDocuments[editingLead.id].map((doc) => (
                              <div key={doc.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px',
                                backgroundColor: '#ffffff',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <span style={{ fontSize: '13px', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {doc.file_name}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => downloadDocument(editingLead.id, doc.id, doc.file_name)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Download
                                  </button>
                                  {hasPermission('leads', 'update') && (
                                    <button
                                      onClick={() => deleteDocument(editingLead.id, doc.id)}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '13px',
                            color: '#6b7280',
                            textAlign: 'center'
                          }}>
                            No documents uploaded
                          </div>
                        )
                      ) : (
                        <div style={{
                          padding: '12px',
                          backgroundColor: '#f0f9ff',
                          borderRadius: '8px',
                          border: '1px solid #bfdbfe',
                          fontSize: '13px',
                          color: '#1e40af',
                          textAlign: 'center'
                        }}>
                          Loading documents...
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nature of Business</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.nature_of_business || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                      {viewingLead.email ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a
                            href={`mailto:${viewingLead.email}`}
                            onClick={(e) => handleEmailClick(e, viewingLead)}
                            style={{
                              fontSize: '16px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {viewingLead.email}
                          </a>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {viewingLead.email_clicks || 0} clicks
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '16px', color: '#9ca3af' }}>N/A</div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                      {viewingLead.phone ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a
                            href={`tel:${viewingLead.phone}`}
                            onClick={(e) => handlePhoneClick(e, viewingLead)}
                            style={{
                              fontSize: '16px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {viewingLead.phone}
                          </a>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {viewingLead.phone_clicks || 0} clicks
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '16px', color: '#9ca3af' }}>N/A</div>
                      )}
                    </div>
                    {viewingLead.business_email && (
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Business Email</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a
                            href={`mailto:${viewingLead.business_email}`}
                            onClick={(e) => handleBusinessEmailClick(e, viewingLead)}
                            style={{
                              fontSize: '16px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {viewingLead.business_email}
                          </a>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {viewingLead.business_email_clicks || 0} clicks
                          </span>
                        </div>
                      </div>
                    )}
                    {viewingLead.business_number && (
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Business Phone</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a
                            href={`tel:${viewingLead.business_number}`}
                            onClick={(e) => handleBusinessPhoneClick(e, viewingLead)}
                            style={{
                              fontSize: '16px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {viewingLead.business_number}
                          </a>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {viewingLead.business_number_clicks || 0} clicks
                          </span>
                        </div>
                      </div>
                    )}
                    {viewingLead.business_description && (
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Business Description</label>
                        <div style={{
                          fontSize: '16px',
                          color: '#1f2937',
                          lineHeight: '1.5',
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                        }}>
                          {viewingLead.business_description}
                        </div>
                      </div>
                    )}
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
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Country</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.country || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Zip Code</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.zip_code || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Source</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.source || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Budget</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>
                        {viewingLead.budget !== null && viewingLead.budget !== undefined && viewingLead.budget !== '' 
                          ? String(viewingLead.budget) 
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Hours Type</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.hours_type || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Day Type</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>{viewingLead.day_type || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Created Date & Time</label>
                      <div style={{ fontSize: '16px', color: '#1f2937' }}>
                        {viewingLead.created_at ? new Date(viewingLead.created_at).toLocaleString() : 'N/A'}
                      </div>
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

              {/* Documents Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Documents/Media
                </h3>
                {viewingLead && leadDocuments[viewingLead.id] !== undefined ? (
                  Array.isArray(leadDocuments[viewingLead.id]) && leadDocuments[viewingLead.id].length > 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {leadDocuments[viewingLead.id].map((doc) => (
                        <div key={doc.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1f2937',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {doc.file_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center'
                            }}>
                              <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                              {doc.uploaded_by_name && (
                                <span>Uploaded by: {doc.uploaded_by_name}</span>
                              )}
                              {doc.created_at && (
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => downloadDocument(viewingLead.id, doc.id, doc.file_name)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              whiteSpace: 'nowrap',
                              marginLeft: '12px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}>
                      No documents uploaded
                    </div>
                  )
                ) : (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1e40af',
                    textAlign: 'center'
                  }}>
                    Loading documents...
                  </div>
                )}
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
          // overflow: 'auto',
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
                gridTemplateColumns: hasLeadScraperRole() ? '1.5fr 1.5fr 1.2fr 1.2fr 1fr 1fr 1fr' : '1.5fr 1.5fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr',
                gap: '12px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: '600',
                fontSize: '12px',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Name</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>Company</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>Email (Clicks)</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>Phone (Clicks)</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>Date</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>Source</div>
                {!hasLeadScraperRole() && <div style={{ display: 'flex', alignItems: 'center' }}>Scheduled By</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Actions</div>
              </div>

              {/* Table Rows */}
              {leads.map((lead, index) => (
                <div key={lead.id} style={{
                  display: 'grid',
                  gridTemplateColumns: hasLeadScraperRole() ? '1.5fr 1.5fr 1.2fr 1.2fr 1fr 1fr 1fr' : '1.5fr 1.5fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr',
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
                    flexDirection: 'column',
                    gap: '4px',
                    justifyContent: 'center',
                    minHeight: '40px'
                  }}>
                    {lead.email ? (
                      <>
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(e) => handleEmailClick(e, lead)}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: '500',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {lead.email}
                        </a>
                        <span style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          fontWeight: '500',
                          display: 'block'
                        }}>
                          {lead.email_clicks || 0} clicks
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', minHeight: '40px' }}>N/A</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    justifyContent: 'center',
                    minHeight: '40px'
                  }}>
                    {lead.phone ? (
                      <>
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => handlePhoneClick(e, lead)}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: '500',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {lead.phone}
                        </a>
                        <span style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          fontWeight: '500',
                          display: 'block'
                        }}>
                          {lead.phone_clicks || 0} clicks
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', minHeight: '40px' }}>N/A</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minHeight: '20px'
                  }}>
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minHeight: '20px'
                  }}>
                    {lead.source || 'N/A'}
                  </div>
                  {!hasLeadScraperRole() && (
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minHeight: '20px'
                    }}>
                      {lead.scheduled_by_names || 'Not scheduled'}
                    </div>
                  )}
                  <div 
                    data-dropdown-container
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '20px',
                      position: 'relative'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === lead.id ? null : lead.id);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      ⋯
                    </button>
                    {openDropdownId === lead.id && (
                      <div
                        data-dropdown-container
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1000,
                          minWidth: '160px',
                          padding: '4px 0'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleViewLead(lead);
                            setOpenDropdownId(null);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#374151',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <span>👁️</span> View
                        </button>
                        {hasPermission('lead_notes', 'create') && (
                          <button
                            onClick={() => {
                              handleAddNote(lead);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <span>📝</span> Notes
                          </button>
                        )}
                        {hasPermission('leads', 'update') && (
                          <button
                            onClick={() => {
                              handleEditLead(lead);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <span>✏️</span> Edit
                          </button>
                        )}
                        {hasPermission('leads', 'update') && !hasLeadScraperRole() && (
                          <button
                            onClick={() => {
                              openScheduleForm(lead);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <span>📅</span> {hasUserScheduledLead(lead) ? 'Reschedule' : 'Schedule'}
                          </button>
                        )}
                        {hasPermission('leads', 'update') && hasUserScheduledLead(lead) && !hasLeadScraperRole() && (
                          <button
                            onClick={() => {
                              handleCancelSchedule(lead.id);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <span>❌</span> Cancel Schedule
                          </button>
                        )}
                        {hasPermission('sales', 'create') && (
                          <button
                            onClick={() => {
                              convertLead(lead);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <span>🔄</span> Convert
                          </button>
                        )}
                      </div>
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

        {/* Converted Leads Section */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                Converted Leads
              </h2>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: '500'
              }}>
                {loadingConvertedLeads ? 'Loading...' : `${convertedLeads.filter(lead => 
                  !convertedLeadsSearchEmail || 
                  (lead.email && lead.email.toLowerCase().includes(convertedLeadsSearchEmail.toLowerCase()))
                ).length} converted`}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'relative',
                flex: '1',
                maxWidth: '400px'
              }}>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={convertedLeadsSearchEmail}
                  onChange={(e) => setConvertedLeadsSearchEmail(e.target.value)}
                  style={{
                    width: '90%',
                    padding: '10px 16px 10px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  fontSize: '16px'
                }}>
                  🔍
                </span>
                {convertedLeadsSearchEmail && (
                  <button
                    onClick={() => setConvertedLeadsSearchEmail('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {loadingConvertedLeads ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              Loading converted leads...
            </div>
          ) : (() => {
            const filteredConvertedLeads = convertedLeads.filter(lead => 
              !convertedLeadsSearchEmail || 
              (lead.email && lead.email.toLowerCase().includes(convertedLeadsSearchEmail.toLowerCase()))
            );
            
            return filteredConvertedLeads.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                  {convertedLeadsSearchEmail ? 'No matching converted leads' : 'No converted leads'}
                </h3>
                <p style={{ margin: '0' }}>
                  {convertedLeadsSearchEmail 
                    ? `No converted leads found matching "${convertedLeadsSearchEmail}"`
                    : 'No leads have been converted to customers yet.'}
                </p>
              </div>
            ) : (
              <div style={{
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '12px',
                  padding: '16px'
                }}>
                  {filteredConvertedLeads.map((convertedLead, index) => (
                  <div
                    key={convertedLead.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Name
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {convertedLead.name || 'N/A'}
                        </div>
                        {convertedLead.company_name && (
                          <>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginTop: '12px',
                              marginBottom: '4px'
                            }}>
                              Company
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: '#374151'
                            }}>
                              {convertedLead.company_name}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Contact
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          📧 {convertedLead.email || 'N/A'}
                        </div>
                        {convertedLead.phone && (
                          <div style={{
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            📞 {convertedLead.phone}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Location
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {convertedLead.city && convertedLead.state 
                            ? `${convertedLead.city}, ${convertedLead.state}`
                            : convertedLead.city || convertedLead.state || 'N/A'}
                        </div>
                        {convertedLead.source && (
                          <>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginTop: '12px',
                              marginBottom: '4px'
                            }}>
                              Source
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: '#374151'
                            }}>
                              {convertedLead.source}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Conversion Details
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Converted: {convertedLead.converted_at 
                              ? new Date(convertedLead.converted_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                        {convertedLead.created_by_name && (
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            By: {convertedLead.created_by_name}
                          </div>
                        )}
                        {convertedLead.assigned_to_name && (
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            Assigned: {convertedLead.assigned_to_name}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Sales Performance
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Sales: {convertedLead.sales_count || 0}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <span style={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Revenue: ${parseFloat(convertedLead.total_revenue || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {convertedLead.service_required && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Service Required
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {convertedLead.service_required}
                        </div>
                      </div>
                    )}

                    {convertedLead.notes && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Notes
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          lineHeight: '1.5'
                        }}>
                          {convertedLead.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* CSV Import Modal */}
        {showCsvImportModal && (
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
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Import Leads from CSV
                </h2>
                <button
                  onClick={closeCsvImportModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ×
                </button>
              </div>

              {/* CSV Format Instructions */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0369a1',
                  margin: '0 0 10px 0'
                }}>
                  📋 CSV Format Requirements
                </h3>
                <div style={{
                  fontSize: '14px',
                  color: '#0c4a6e',
                  lineHeight: '1.5',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Required columns:</strong> name
                  </p>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Optional columns:</strong> company_name, email, phone, city, state, source, service_required, notes
                  </p>
                  <p style={{ margin: '0' }}>
                    <strong>Note:</strong> The first row should contain column headers. Email addresses will be validated.
                  </p>
                </div>
                <button
                  onClick={downloadSampleCsv}
                  style={{
                    backgroundColor: '#0369a1',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📥 Download Sample CSV
                </button>
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 15px 0'
                  }}>
                    Preview (First 5 rows)
                  </h3>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      CSV Data Preview
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {csvPreview.map((row, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          borderBottom: index < csvPreview.length - 1 ? '1px solid #f3f4f6' : 'none',
                          fontSize: '13px',
                          color: '#6b7280'
                        }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            Row {index + 1}:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                            {Object.entries(row).map(([key, value]) => (
                              <div key={key} style={{
                                backgroundColor: '#f9fafb',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                <strong>{key}:</strong> {value || '(empty)'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={closeCsvImportModal}
                  disabled={importing}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    opacity: importing ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvFile || importing}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: importing ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!csvFile || importing) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {importing ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Importing...
                    </>
                  ) : (
                    'Import Leads'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </PageLayout>
    );
  }
