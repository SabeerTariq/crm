import { useEffect, useState, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    paymentType: '',
    paymentSource: '',
    brand: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    unit_price: 0,
    cash_in: 0,
    notes: '',
    services: '',
    service_details: '',
    payment_type: 'one_time',
    payment_source: 'wire',
    payment_company: 'american_digital_agency',
    brand: 'liberty_web_studio',
    lead_id: '',
    convert_lead: false,
    // Payment type specific fields
    installment_count: 1,
    installment_frequency: 'monthly',
    installment_type: 'automatic', // 'automatic' or 'custom'
    recurring_frequency: 'monthly',
    recurring_type: 'automatic', // 'automatic' or 'custom'
    recurring_count: 1,
    payment_start_date: new Date().toISOString().split('T')[0],
    // Auto-generated fields
    sale_date: new Date().toISOString().split('T')[0],
    sale_time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  });
  
  // Agreement file state
  const [agreementFile, setAgreementFile] = useState(null);
  
  // Services array for multiple services
  const [services, setServices] = useState([]);
  const [currentService, setCurrentService] = useState({ name: '', details: '' });
  
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRoleId = user.role_id;
  
  // Determine what the user can work with based on role
  const canWorkWithLeads = userRoleId !== 5; // Upseller role (5) cannot work with leads
  const canWorkWithCustomers = userRoleId !== 3; // Sales role (3) cannot work with customers

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-calculate values when unit_price or cash_in changes
    if (['unit_price', 'cash_in'].includes(name)) {
      const unitPrice = name === 'unit_price' ? parseFloat(value) || 0 : parseFloat(formData.unit_price) || 0;
      const cashIn = name === 'cash_in' ? parseFloat(value) || 0 : parseFloat(formData.cash_in) || 0;
      
      const grossValue = unitPrice;
      const netValue = grossValue;
      const remaining = netValue - cashIn;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        gross_value: grossValue,
        net_value: netValue,
        remaining: remaining
      }));
    }
  };

  // Service management functions
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({ ...currentService, [name]: value });
  };

  const addService = () => {
    if (currentService.name.trim()) {
      const service = {
        id: Date.now(),
        name: currentService.name.trim(),
        details: currentService.details.trim()
      };
      
      setServices([...services, service]);
      setCurrentService({ name: '', details: '' });
    }
  };

  const removeService = (serviceId) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  // Search handlers
  const handleCustomerSearch = async (e) => {
    const searchTerm = e.target.value;
    setCustomerSearch(searchTerm);
    setShowCustomerDropdown(true);
    
    if (searchTerm.length >= 2) {
      await loadCustomers(searchTerm);
    } else if (searchTerm.length === 0) {
      await loadCustomers();
    }
  };

  const handleLeadSearch = async (e) => {
    const searchTerm = e.target.value;
    setLeadSearch(searchTerm);
    setShowLeadDropdown(true);
    
    if (searchTerm.length >= 2) {
      await loadLeads(searchTerm);
    } else if (searchTerm.length === 0) {
      await loadLeads();
    }
  };

  const handleCustomerSelect = (customer) => {
        setFormData({
          ...formData,
      customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          lead_id: '',
          convert_lead: false
        });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleLeadSelect = (lead) => {
    setFormData({
      ...formData,
      lead_id: lead.id,
      customer_name: lead.name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      customer_id: null,
      convert_lead: true
    });
    setLeadSearch(lead.name);
    setShowLeadDropdown(false);
  };

  const clearCustomerSelection = () => {
      setFormData({
        ...formData,
        customer_id: null,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        lead_id: '',
        convert_lead: false
      });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const clearLeadSelection = () => {
      setFormData({
        ...formData,
        lead_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_id: null,
        convert_lead: false
      });
    setLeadSearch('');
    setShowLeadDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      customer_id: null,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      unit_price: 0,
      cash_in: 0,
      notes: '',
      services: '',
      service_details: '',
      payment_type: 'one_time',
      payment_source: 'wire',
      payment_company: 'american_digital_agency',
      brand: 'liberty_web_studio',
      lead_id: '',
      convert_lead: false,
      installment_count: 1,
      installment_frequency: 'monthly',
      recurring_frequency: 'monthly',
      payment_start_date: new Date().toISOString().split('T')[0],
      sale_date: new Date().toISOString().split('T')[0],
      sale_time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    setServices([]);
    setCurrentService({ name: '', details: '' });
    setAgreementFile(null);
    setEditingSale(null);
    setConvertingLead(null);
    setShowAddForm(false);
    setCustomerSearch('');
    setLeadSearch('');
    setShowCustomerDropdown(false);
    setShowLeadDropdown(false);
  };

  const handleAgreementFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only PDF, DOC, DOCX, TXT, JPEG, and PNG files are allowed.');
        return;
      }
      
      setAgreementFile(file);
    }
  };

  const removeAgreementFile = () => {
    setAgreementFile(null);
  };

  const downloadAgreement = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/sales/${saleId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Get the original filename from the response headers or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `agreement-${saleId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading agreement:', error);
      alert('Error downloading agreement file');
    }
  };

  const submitSale = async (e) => {
    e.preventDefault();
    
    // If converting a lead, set the lead_id
    if (convertingLead) {
      formData.lead_id = convertingLead.lead_id;
    }
    
    // Validate based on user role
    if (userRoleId === 3) {
      // Sales role: must select a lead
      if (!formData.lead_id) {
        alert('Sales role must select a lead to convert to customer');
        return;
      }
    } else if (userRoleId === 5) {
      // Upseller role: must select a customer
      if (!formData.customer_id) {
        alert('Upseller role must select an existing customer');
        return;
      }
    } else {
      // Other roles: either customer or lead is selected
      if (!formData.customer_id && !formData.lead_id) {
        alert('Please select either an existing customer or a lead to convert');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = editingSale ? `/sales/${editingSale.id}` : '/sales';
      const method = editingSale ? 'put' : 'post';
      
      // Always include current service if it has a name (whether button was clicked or not)
      const allServices = [...services];
      if (currentService.name.trim()) {
        allServices.push({
          id: Date.now(),
          name: currentService.name.trim(),
          details: currentService.details.trim()
        });
      }

      const saleData = {
        ...formData,
        services: allServices.length > 0 ? JSON.stringify(allServices) : formData.services,
        service_details: allServices.length > 0 ? allServices.map(s => s.details).filter(d => d).join(', ') : formData.service_details
      };
      
      // Remove automatic installment fields when using custom installments
      if (formData.payment_type === 'installments' && formData.installment_type === 'custom') {
        delete saleData.installment_count;
        delete saleData.installment_frequency;
        delete saleData.payment_start_date;
      }
      
      // Remove automatic recurring fields when using custom recurring payments
      if (formData.payment_type === 'recurring' && formData.recurring_type === 'custom') {
        delete saleData.recurring_frequency;
        delete saleData.payment_start_date;
      }
      
      // Handle file upload
      let response;
      if (agreementFile) {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        Object.keys(saleData).forEach(key => {
          if (saleData[key] !== null && saleData[key] !== undefined) {
            formDataToSend.append(key, saleData[key]);
          }
        });
        formDataToSend.append('agreement', agreementFile);
        
        response = await api[method](url, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular JSON request
        response = await api[method](url, saleData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Handle custom installments if payment type is installments and custom dates are set
      if (formData.payment_type === 'installments' && formData.installment_type === 'custom' && !editingSale) {
        const saleId = response.data.saleId || response.data.id;
        if (saleId) {
          try {
            // Collect custom installment data
            const customInstallments = [];
            const installmentCount = parseInt(formData.installment_count) || 0;
            const totalAmount = parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0);
            const installmentAmount = totalAmount / installmentCount;
            
            for (let i = 0; i < installmentCount; i++) {
              const dueDate = formData[`custom_installment_${i}_date`];
              const notes = formData[`custom_installment_${i}_notes`] || '';
              
              if (dueDate) {
                customInstallments.push({
                  amount: installmentAmount,
                  due_date: dueDate,
                  notes: notes
                });
              }
            }
            
            if (customInstallments.length > 0) {
              // Create custom installments
              await api.post('/payments/installments/custom', {
                saleId: saleId,
                installments: customInstallments
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (installmentErr) {
            console.error('Error creating custom installments:', installmentErr);
            alert('Sale created but there was an error creating custom installments. Please create them manually.');
          }
        }
      }
      
      // Handle custom recurring payments if payment type is recurring and custom dates are set
      if (formData.payment_type === 'recurring' && formData.recurring_type === 'custom' && !editingSale) {
        const saleId = response.data.saleId || response.data.id;
        if (saleId) {
          try {
            // Collect custom recurring payment data
            const customRecurringPayments = [];
            const recurringCount = parseInt(formData.recurring_count) || 0;
            const paymentAmount = parseFloat(formData.cash_in || 0);
            
            for (let i = 0; i < recurringCount; i++) {
              const dueDate = formData[`custom_recurring_${i}_date`];
              const notes = formData[`custom_recurring_${i}_notes`] || '';
              
              if (dueDate) {
                customRecurringPayments.push({
                  amount: paymentAmount,
                  due_date: dueDate,
                  notes: notes
                });
              }
            }
            
            if (customRecurringPayments.length > 0) {
              // Create custom recurring payments
              await api.post('/payments/recurring/custom', {
                saleId: saleId,
                customerId: formData.customer_id,
                recurringPayments: customRecurringPayments
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (recurringErr) {
            console.error('Error creating custom recurring payments:', recurringErr);
            alert('Sale created but there was an error creating custom recurring payments. Please create them manually.');
          }
        }
      }
      
      if (response.data.leadConverted) {
        alert('Sale added and lead converted to customer successfully!');
      } else if (response.data.customerId) {
        alert('Sale added and customer created successfully!');
      } else {
        alert(editingSale ? 'Sale updated successfully!' : 'Sale added successfully!');
      }
      
      resetForm();
      loadSales();
      loadCustomers(); // Refresh customers list in case a new customer was created
      
      // Trigger dashboard refresh for upseller users
      localStorage.setItem('salesUpdated', Date.now().toString());
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving sale');
      console.error(err);
    }
  };

  const loadSales = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get('/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      alert('Failed to load sales. Please try again.');
    }
  };

  // Filter and search functionality
  const applyFilters = useCallback(() => {
    let filtered = [...sales];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.customer_name?.toLowerCase().includes(term) ||
        sale.customer_email?.toLowerCase().includes(term) ||
        sale.services?.toLowerCase().includes(term) ||
        sale.created_by_name?.toLowerCase().includes(term)
      );
    }

    // Payment type filter
    if (filters.paymentType) {
      filtered = filtered.filter(sale => sale.payment_type === filters.paymentType);
    }

    // Payment source filter
    if (filters.paymentSource) {
      filtered = filtered.filter(sale => sale.payment_source === filters.paymentSource);
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter(sale => sale.brand === filters.brand);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(sale => 
        new Date(sale.created_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, filters]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadCustomers = async (searchTerm = '') => {
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');
      
      const response = await api.get(`/sales/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // If user doesn't have permission to see customers, set empty array
      if (error.response?.status === 403) {
        setCustomers([]);
        setFilteredCustomers([]);
      }
    }
  };

  const loadLeads = async (searchTerm = '') => {
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');
      
      const response = await api.get(`/sales/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
      setFilteredLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      // If user doesn't have permission to see leads, set empty array
      if (error.response?.status === 403) {
        setLeads([]);
        setFilteredLeads([]);
      }
    }
  };

  const editSale = (sale) => {
    setEditingSale(sale);
    
    // Parse services if they're in JSON format
    let parsedServices = [];
    let servicesText = sale.services || '';
    
    try {
      const servicesData = JSON.parse(sale.services);
      if (Array.isArray(servicesData)) {
        parsedServices = servicesData;
        servicesText = '';
      }
    } catch (e) {
      // If not JSON, keep as text
    }
    
    setServices(parsedServices);
    setCurrentService({ name: '', details: '' });
    setFormData({
      customer_id: sale.customer_id || null,
      customer_name: sale.customer_name || '',
      customer_email: sale.customer_email || '',
      customer_phone: sale.customer_phone || '',
      unit_price: sale.unit_price || 0,
      cash_in: sale.cash_in || 0,
      notes: sale.notes || '',
      services: servicesText,
      service_details: sale.service_details || '',
      payment_type: sale.payment_type || 'one_time',
      payment_source: sale.payment_source || 'wire',
      payment_company: sale.payment_company || 'american_digital_agency',
      brand: sale.brand || 'liberty_web_studio',
      // Payment type specific fields
      installment_count: sale.installment_count || 1,
      installment_frequency: sale.installment_frequency || 'monthly',
      recurring_frequency: sale.recurring_frequency || 'monthly',
      payment_start_date: sale.payment_start_date || new Date().toISOString().split('T')[0],
      // Auto-generated fields
      sale_date: sale.created_at ? new Date(sale.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      sale_time: sale.created_at ? new Date(sale.created_at).toTimeString().split(' ')[0].substring(0, 5) : new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    setShowAddForm(true);
  };

  const deleteSale = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Sale deleted successfully!');
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale. Please try again.');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-dropdown-container')) {
        setShowCustomerDropdown(false);
        setShowLeadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!hasPermission('sales', 'read')) {
      return;
    }
    
    loadSales();
    
    // Load customers only if user can work with customers
    if (canWorkWithCustomers) {
      loadCustomers();
    }
    
    // Load leads only if user can work with leads
    if (canWorkWithLeads) {
      loadLeads();
    }
  }, [hasPermission, canWorkWithCustomers, canWorkWithLeads]);

  // Check for lead conversion data and pre-fill form
  useEffect(() => {
    const leadData = localStorage.getItem('leadToConvert');
    if (leadData && hasPermission('sales', 'create')) {
      try {
        const lead = JSON.parse(leadData);
        
        // Set converting lead state
        setConvertingLead(lead);
        
        // Pre-fill form with lead data and auto-populate lead search
        setFormData(prev => ({
          ...prev,
          customer_name: lead.lead_name || '',
          customer_email: lead.lead_email || '',
          customer_phone: lead.lead_phone || '',
          notes: `Converted from lead: ${lead.lead_company || ''} - ${lead.lead_service_required || ''} - ${lead.lead_notes || ''}`.trim(),
          services: lead.lead_service_required || '',
          lead_id: lead.lead_id || '',
          convert_lead: true,
          customer_id: null
        }));
        
        // Auto-populate the lead search field
        setLeadSearch(lead.lead_name || '');
        
        // Open the sales form modal
        setShowAddForm(true);
        
        // Clear the lead data from localStorage
        localStorage.removeItem('leadToConvert');
      } catch (error) {
        console.error('Error parsing lead data:', error);
        localStorage.removeItem('leadToConvert');
      }
    }
  }, [hasPermission]);

  // Additional useEffect to catch lead conversion data when component mounts
  useEffect(() => {
    // This runs only once when component mounts
    const leadData = localStorage.getItem('leadToConvert');
    if (leadData) {
      // Check if permission is available and has sales.create permission
      if (hasPermission && hasPermission('sales', 'create')) {
      try {
        const lead = JSON.parse(leadData);
        
        // Set converting lead state
        setConvertingLead(lead);
        
        // Pre-fill form with lead data and auto-populate lead search
        setFormData(prev => ({
          ...prev,
          customer_name: lead.lead_name || '',
          customer_email: lead.lead_email || '',
          customer_phone: lead.lead_phone || '',
          notes: `Converted from lead: ${lead.lead_company || ''} - ${lead.lead_service_required || ''} - ${lead.lead_notes || ''}`.trim(),
          services: lead.lead_service_required || '',
          lead_id: lead.lead_id || '',
          convert_lead: true,
          customer_id: null
        }));
        
        // Auto-populate the lead search field
        setLeadSearch(lead.lead_name || '');
        
        // Open the sales form modal
        setShowAddForm(true);
        
        // Clear the lead data from localStorage
        localStorage.removeItem('leadToConvert');
      } catch (error) {
        console.error('Error parsing lead data:', error);
        localStorage.removeItem('leadToConvert');
      }
      }
    }
  }, [hasPermission]); // Include hasPermission dependency

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddForm) {
        resetForm();
      }
    };

    if (showAddForm) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm]);

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return (
      <PageLayout>
          <div>Loading permissions...</div>
      </PageLayout>
    );
  }

  // Check if user has permission to view sales
  if (!hasPermission('sales', 'read')) {
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
            <p>You do not have permission to view sales.</p>
          </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Header Section */}
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
                Sales Management
              </h1>
              <p style={{ 
                margin: '0', 
                color: '#6b7280', 
                fontSize: '16px' 
              }}>
                Managing sales for <strong style={{ color: '#374151' }}>{getUserName()}</strong>
              </p>
            </div>
            {hasPermission('sales', 'create') && (
              <button 
                onClick={() => setShowAddForm(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
              >
                <i className="fas fa-plus"></i>
                Add New Sale
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
                {filteredSales.length}
              </div>
              <div style={{ fontSize: '14px', color: '#0c4a6e', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Sales' : 'Total Sales'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #bbf7d0' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                ${filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.unit_price) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Revenue' : 'Total Revenue'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fde68a' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                ${filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.cash_in) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Cash' : 'Cash Received'}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
          <div style={{
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Search Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search sales by customer, email, services, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    border: '1px solid #d1d5db',
            borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}></i>
              </div>
            </div>
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-times"></i>
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}>
                  Payment Type
                </label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Types</option>
                  <option value="one_time">One Time</option>
                  <option value="installment">Installment</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}>
                  Payment Source
                </label>
                <select
                  value={filters.paymentSource}
                  onChange={(e) => setFilters({ ...filters, paymentSource: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Sources</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}>
                  Brand
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Brands</option>
                  <option value="liberty_web_studio">Liberty Web Studio</option>
                  <option value="american_digital_agency">American Digital Agency</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}>
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px' 
                }}>
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'end', 
                gap: '8px' 
              }}>
                <button
                  onClick={() => setFilters({
                    paymentType: '',
                    paymentSource: '',
                    brand: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Sale Form Modal */}
        {showAddForm && hasPermission('sales', 'create') && (
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetForm();
            }
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '100%',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                  {editingSale ? 'Edit Sale' : convertingLead ? 'Convert Lead to Sale' : 'Add New Sale'}
            </h3>
                <button
                  onClick={resetForm}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px'
                  }}
                  title="Close"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
            <form onSubmit={submitSale}>
              {/* Section 1: Customer Details */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#1f2937', 
                  borderBottom: '2px solid #3b82f6', 
                  paddingBottom: '10px' 
                }}>
                  📋 Customer Details
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {/* Customer Selection - Only show for upseller role and other roles */}
                  {canWorkWithCustomers && (
                    <div className="search-dropdown-container" style={{ position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Search Customer {userRoleId === 5 ? '*' : ''}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Type to search customers..."
                          value={customerSearch}
                          onChange={handleCustomerSearch}
                          onFocus={() => setShowCustomerDropdown(true)}
                        style={inputStyle}
                        required={userRoleId === 5}
                        />
                        {formData.customer_id && (
                          <button
                            type="button"
                            onClick={clearCustomerSelection}
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
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      {/* Customer Dropdown */}
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                ':hover': {
                                  backgroundColor: '#f9fafb'
                                }
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: '500', color: '#1f2937' }}>{customer.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{customer.email}</div>
                              {customer.phone && (
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{customer.phone}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {userRoleId === 5 && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          backgroundColor: '#f0f9ff', 
                          border: '1px solid #0ea5e9', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0c4a6e'
                        }}>
                          💼 Upseller role: Search from assigned customers only
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lead Selection - Only show for sales role and other roles */}
                  {canWorkWithLeads && (
                    <div className="search-dropdown-container" style={{ position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        {userRoleId === 3 ? 'Search Lead to Convert *' : 'Or Search Lead to Convert'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Type to search leads..."
                          value={leadSearch}
                          onChange={handleLeadSearch}
                          onFocus={() => setShowLeadDropdown(true)}
                        style={inputStyle}
                        required={userRoleId === 3}
                        />
                        {formData.lead_id && (
                          <button
                            type="button"
                            onClick={clearLeadSelection}
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
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      {/* Lead Dropdown */}
                      {showLeadDropdown && filteredLeads.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {filteredLeads.map(lead => (
                            <div
                              key={lead.id}
                              onClick={() => handleLeadSelect(lead)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f3f4f6',
                                ':hover': {
                                  backgroundColor: '#f9fafb'
                                }
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: '500', color: '#1f2937' }}>{lead.name} (Lead)</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{lead.email}</div>
                              {lead.phone && (
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{lead.phone}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.convert_lead && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          backgroundColor: '#fef3c7', 
                          border: '1px solid #fde68a', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#92400e'
                        }}>
                          ⚠️ This will convert the lead to a customer
                        </div>
                      )}
                      {userRoleId === 3 && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          backgroundColor: '#f0fdf4', 
                          border: '1px solid #22c55e', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#14532d'
                        }}>
                          🎯 Sales role: Must search and select a lead to convert
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Information */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Customer Name *
                    </label>
                    <input 
                      type="text" 
                      name="customer_name" 
                      placeholder="Enter customer name" 
                      value={formData.customer_name} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      name="customer_email" 
                      placeholder="customer@example.com" 
                      value={formData.customer_email} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Phone Number
                    </label>
                    <input 
                      type="text" 
                      name="customer_phone" 
                      placeholder="+1 (555) 123-4567" 
                      value={formData.customer_phone} 
                      onChange={handleFormChange} 
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Service Details */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#1f2937', 
                  borderBottom: '2px solid #10b981', 
                  paddingBottom: '10px' 
                }}>
                  🛠️ Service Details
                </h4>
                
                {/* Service Input Fields */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr auto', 
                  gap: '15px', 
                  marginBottom: '20px'
                }}>
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Service name (e.g., Website Development)" 
                    value={currentService.name} 
                    onChange={handleServiceChange} 
                    style={inputStyle}
                  />
                  <input 
                    type="text" 
                    name="details" 
                    placeholder="Service details (e.g., 5-page responsive website)" 
                    value={currentService.details} 
                    onChange={handleServiceChange} 
                    style={inputStyle}
                  />
                  <button 
                    type="button"
                    onClick={addService}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Add Service
                  </button>
                </div>

                {/* Services List */}
                {services.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#374151' }}>Added Services:</h5>
                    {services.map((service) => (
                      <div key={service.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>{service.name}</span>
                          {service.details && (
                            <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>
                              - {service.details}
                            </span>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeService(service.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Agreement Upload */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#1f2937', 
                  borderBottom: '2px solid #8b5cf6', 
                  paddingBottom: '10px' 
                }}>
                  📄 Agreement Upload
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Upload Agreement Document
                    </label>
                    <input
                      type="file"
                      onChange={handleAgreementFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    />
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#6b7280', 
                      margin: '5px 0 0 0' 
                    }}>
                      Supported formats: PDF, DOC, DOCX, TXT, JPEG, PNG (Max 10MB)
                    </p>
                    
                    {agreementFile && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '14px', color: '#0c4a6e' }}>
                          📎 {agreementFile.name} ({(agreementFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={removeAgreementFile}
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
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Payment Details */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#1f2937', 
                  borderBottom: '2px solid #f59e0b', 
                  paddingBottom: '10px' 
                }}>
                  💰 Payment Details
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {/* Financial Information */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Sale Amount *
                    </label>
                    <input 
                      type="number" 
                      name="unit_price" 
                      placeholder="0.00" 
                      value={formData.unit_price} 
                      onChange={handleFormChange} 
                      min="0"
                      step="0.01"
                      required 
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Cash Received
                    </label>
                    <input 
                      type="number" 
                      name="cash_in" 
                      placeholder="0.00" 
                      value={formData.cash_in} 
                      onChange={handleFormChange} 
                      min="0"
                      step="0.01"
                      style={inputStyle}
                    />
                  </div>


                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Payment Type
                    </label>
                    <select 
                      name="payment_type" 
                      value={formData.payment_type} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    >
                      <option value="one_time">One Time Payment</option>
                      <option value="recurring">Recurring Subscription</option>
                      <option value="installments">Installment Plan</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Payment Source
                    </label>
                    <select 
                      name="payment_source" 
                      value={formData.payment_source} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    >
                      <option value="wire">Wire Transfer</option>
                      <option value="cashapp">CashApp</option>
                      <option value="stripe">Stripe</option>
                      <option value="zelle">Zelle</option>
                      <option value="paypal">PayPal</option>
                      <option value="authorize">Authorize.net</option>
                      <option value="square">Square</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Payment Company
                    </label>
                    <select 
                      name="payment_company" 
                      value={formData.payment_company} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    >
                      <option value="american_digital_agency">American Digital Agency</option>
                      <option value="logicworks">LogicWorks</option>
                      <option value="oscs">OSCS</option>
                      <option value="aztech">AZTech</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Brand
                    </label>
                    <select 
                      name="brand" 
                      value={formData.brand} 
                      onChange={handleFormChange} 
                      required 
                      style={inputStyle}
                    >
                      <option value="liberty_web_studio">Liberty Web Studio</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>

                {/* Payment Type Specific Fields */}
                {formData.payment_type === 'installments' && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '8px' 
                  }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#0c4a6e' }}>Installment Plan Settings</h5>
                    
                    {/* Installment Type Toggle */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Installment Schedule Type
                      </label>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="installment_type" 
                            value="automatic" 
                            checked={formData.installment_type === 'automatic'}
                            onChange={handleFormChange}
                          />
                          <span>Automatic (Based on Frequency)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="installment_type" 
                            value="custom" 
                            checked={formData.installment_type === 'custom'}
                            onChange={handleFormChange}
                          />
                          <span>Custom Dates</span>
                        </label>
                      </div>
                    </div>

                    {/* Automatic Installment Settings */}
                    {formData.installment_type === 'automatic' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Number of Installments
                          </label>
                          <input 
                            type="number" 
                            name="installment_count" 
                            placeholder="2" 
                            value={formData.installment_count} 
                            onChange={handleFormChange} 
                            min="2"
                            max="60"
                            required 
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Frequency
                          </label>
                          <select 
                            name="installment_frequency" 
                            value={formData.installment_frequency} 
                            onChange={handleFormChange} 
                            required 
                            style={inputStyle}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Start Date
                          </label>
                          <input 
                            type="date" 
                            name="payment_start_date" 
                            value={formData.payment_start_date} 
                            onChange={handleFormChange} 
                            required 
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom Installment Settings */}
                    {formData.installment_type === 'custom' && (
                      <div>
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Number of Installments
                          </label>
                          <input 
                            type="number" 
                            name="installment_count" 
                            placeholder="2" 
                            value={formData.installment_count} 
                            onChange={handleFormChange} 
                            min="2"
                            max="60"
                            required 
                            style={inputStyle}
                          />
                        </div>
                        
                        {/* Custom Installment Dates */}
                        <div style={{ marginTop: '20px' }}>
                          <h6 style={{ margin: '0 0 15px 0', color: '#0c4a6e' }}>Set Custom Dates for Each Installment</h6>
                          {Array.from({ length: parseInt(formData.installment_count) || 0 }, (_, index) => {
                            const installmentAmount = (parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0)) / parseInt(formData.installment_count || 1);
                            return (
                              <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px'
                              }}>
                                <div style={{ minWidth: '120px', fontWeight: '500' }}>
                                  Installment #{index + 1}
                                </div>
                                <div style={{ minWidth: '120px' }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Amount
                                  </label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={installmentAmount.toFixed(2)}
                                    readOnly
                                    style={{ 
                                      ...inputStyle, 
                                      backgroundColor: '#f9fafb',
                                      cursor: 'not-allowed'
                                    }}
                                  />
                                </div>
                                <div style={{ minWidth: '150px' }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Due Date
                                  </label>
                                  <input 
                                    type="date" 
                                    name={`custom_installment_${index}_date`}
                                    value={formData[`custom_installment_${index}_date`] || ''}
                                    onChange={handleFormChange}
                                    required
                                    style={inputStyle}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Notes (Optional)
                                  </label>
                                  <input 
                                    type="text" 
                                    name={`custom_installment_${index}_notes`}
                                    placeholder={`Installment ${index + 1} notes`}
                                    value={formData[`custom_installment_${index}_notes`] || ''}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Installment Preview */}
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                      <strong>Installment Preview:</strong><br/>
                      Total Sale: ${parseFloat(formData.unit_price || 0).toFixed(2)}<br/>
                      Cash Received: ${parseFloat(formData.cash_in || 0).toFixed(2)}<br/>
                      Remaining: ${(parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0)).toFixed(2)}<br/>
                      Per installment: ${((parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0)) / parseInt(formData.installment_count || 1)).toFixed(2)}<br/>
                      {formData.installment_type === 'automatic' ? (
                        <>Frequency: {formData.installment_frequency}</>
                      ) : (
                        <>Custom dates: {formData.installment_count} installments</>
                      )}
                    </div>
                  </div>
                )}

                {formData.payment_type === 'recurring' && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    borderRadius: '8px' 
                  }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#14532d' }}>Recurring Subscription Settings</h5>
                    
                    {/* Recurring Type Toggle */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Subscription Schedule Type
                      </label>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="recurring_type" 
                            value="automatic" 
                            checked={formData.recurring_type === 'automatic'}
                            onChange={handleFormChange}
                          />
                          <span>Automatic (Based on Frequency)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="recurring_type" 
                            value="custom" 
                            checked={formData.recurring_type === 'custom'}
                            onChange={handleFormChange}
                          />
                          <span>Custom Dates</span>
                        </label>
                      </div>
                    </div>

                    {/* Automatic Recurring Settings */}
                    {formData.recurring_type === 'automatic' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Subscription Frequency
                          </label>
                          <select 
                            name="recurring_frequency" 
                            value={formData.recurring_frequency} 
                            onChange={handleFormChange} 
                            required 
                            style={inputStyle}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Start Date
                          </label>
                          <input 
                            type="date" 
                            name="payment_start_date" 
                            value={formData.payment_start_date} 
                            onChange={handleFormChange} 
                            required 
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom Recurring Settings */}
                    {formData.recurring_type === 'custom' && (
                      <div>
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                            Number of Recurring Payments
                          </label>
                          <input 
                            type="number" 
                            name="recurring_count" 
                            placeholder="3" 
                            value={formData.recurring_count} 
                            onChange={handleFormChange} 
                            min="1"
                            max="60"
                            required 
                            style={inputStyle}
                          />
                        </div>
                        
                        {/* Custom Recurring Payment Dates */}
                        <div style={{ marginTop: '20px' }}>
                          <h6 style={{ margin: '0 0 15px 0', color: '#14532d' }}>Set Custom Dates for Each Recurring Payment</h6>
                          {Array.from({ length: parseInt(formData.recurring_count) || 0 }, (_, index) => {
                            const paymentAmount = parseFloat(formData.cash_in || 0);
                            return (
                              <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px'
                              }}>
                                <div style={{ minWidth: '120px', fontWeight: '500' }}>
                                  Payment #{index + 1}
                                </div>
                                <div style={{ minWidth: '120px' }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Amount
                                  </label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={paymentAmount.toFixed(2)}
                                    readOnly
                                    style={{ 
                                      ...inputStyle, 
                                      backgroundColor: '#f9fafb',
                                      cursor: 'not-allowed'
                                    }}
                                  />
                                </div>
                                <div style={{ minWidth: '150px' }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Due Date
                                  </label>
                                  <input 
                                    type="date" 
                                    name={`custom_recurring_${index}_date`}
                                    value={formData[`custom_recurring_${index}_date`] || ''}
                                    onChange={handleFormChange}
                                    required
                                    style={inputStyle}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Notes (Optional)
                                  </label>
                                  <input 
                                    type="text" 
                                    name={`custom_recurring_${index}_notes`}
                                    placeholder={`Payment ${index + 1} notes`}
                                    value={formData[`custom_recurring_${index}_notes`] || ''}
                                    onChange={handleFormChange}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Subscription Preview */}
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
                      <strong>Subscription Preview:</strong><br/>
                      Service Value: ${parseFloat(formData.unit_price || 0).toFixed(2)}<br/>
                      Subscription: ${parseFloat(formData.cash_in || 0).toFixed(2)} per {formData.recurring_type === 'automatic' ? formData.recurring_frequency : 'custom schedule'}<br/>
                      {formData.recurring_type === 'automatic' ? (
                        <>Indefinite subscription (ongoing until cancelled)</>
                      ) : (
                        <>{formData.recurring_count} scheduled payments</>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div style={{ 
                  marginTop: '20px', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Sale Amount</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      ${parseFloat(formData.unit_price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Cash Received</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
                      ${parseFloat(formData.cash_in || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Remaining</div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: (parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0)) > 0 ? '#dc2626' : '#16a34a' 
                    }}>
                      ${(parseFloat(formData.unit_price || 0) - parseFloat(formData.cash_in || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Notes & Additional Info */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0' 
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#1f2937', 
                  borderBottom: '2px solid #8b5cf6', 
                  paddingBottom: '10px' 
                }}>
                  📝 Notes & Additional Information
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Sale Notes
                    </label>
                    <textarea 
                      name="notes" 
                      placeholder="Add any additional notes about this sale..." 
                      value={formData.notes} 
                      onChange={handleFormChange} 
                      style={{...inputStyle, minHeight: '100px', resize: 'vertical'}}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Sale Date & Time
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input 
                        type="date" 
                        name="sale_date" 
                        value={formData.sale_date} 
                        onChange={handleFormChange} 
                        style={inputStyle}
                      />
                      <input 
                        type="time" 
                        name="sale_time" 
                        value={formData.sale_time} 
                        onChange={handleFormChange} 
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #bae6fd', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#0c4a6e'
                    }}>
                      💡 Date and time are automatically set to current values
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                justifyContent: 'flex-end',
                padding: '20px 0',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
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
                    fontWeight: '500'
                  }}
                >
                  {editingSale ? 'Update Sale' : 'Create Sale'}
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {/* Sales List */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '20px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}>
            <div>Customer</div>
            <div>Services</div>
            <div>Sale Amount</div>
            <div>Cash Received</div>
            <div>Remaining</div>
            <div>Payment Type</div>
            <div>Payment Source</div>
            <div>Brand</div>
            <div>Agreement</div>
            <div>Created By</div>
            <div>Date</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          {filteredSales.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#6b7280',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  No sales found
              </h3>
              <p style={{ margin: '0', fontSize: '14px' }}>
                Get started by creating your first sale
              </p>
            </div>
          ) : (
            filteredSales.map((sale, index) => (
              <div key={sale.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '16px',
                padding: '20px 24px',
                borderBottom: index < filteredSales.length - 1 ? '1px solid #f3f4f6' : 'none',
                backgroundColor: '#ffffff',
                transition: 'background-color 0.2s ease',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}>
                
                {/* Customer */}
                    <div>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    {sale.customer_name}
                    </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280' 
                  }}>
                    {sale.customer_email}
                  </div>
                </div>

                {/* Services */}
                <div>
                    {(() => {
                      try {
                        const servicesData = JSON.parse(sale.services);
                        if (Array.isArray(servicesData)) {
                        return servicesData.map((s, idx) => (
                          <div key={idx} style={{ 
                            backgroundColor: '#f3f4f6', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#374151',
                            fontWeight: '500',
                            display: 'inline-block',
                            margin: '2px 4px 2px 0'
                          }}>
                            {s.name}
                          </div>
                        ));
                        }
                      } catch (e) {
                        // If not JSON, return as is
                      }
                    return sale.services ? (
                      <div style={{ 
                        backgroundColor: '#f3f4f6', 
                        padding: '6px 12px', 
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#374151',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        {sale.services}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>N/A</span>
                    );
                    })()}
                </div>

                {/* Sale Amount */}
                <div style={{ 
                  fontWeight: '700', 
                  color: '#059669',
                  fontSize: '14px'
                }}>
                  ${parseFloat(sale.unit_price || 0).toLocaleString()}
                </div>

                {/* Cash Received */}
                <div style={{ 
                  fontWeight: '700', 
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  ${parseFloat(sale.cash_in || 0).toLocaleString()}
                </div>

                {/* Remaining */}
                <div style={{ 
                  fontWeight: '700', 
                  color: parseFloat(sale.remaining || 0) > 0 ? '#dc2626' : '#16a34a',
                  fontSize: '14px'
                }}>
                  ${parseFloat(sale.remaining || 0).toLocaleString()}
                </div>

                {/* Payment Type */}
                <div>
                  <span style={{
                    backgroundColor: sale.payment_type === 'one_time' ? '#dbeafe' : 
                                   sale.payment_type === 'installment' ? '#fef3c7' : '#d1fae5',
                    color: sale.payment_type === 'one_time' ? '#1e40af' : 
                          sale.payment_type === 'installment' ? '#92400e' : '#065f46',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    display: 'inline-block'
                  }}>
                    {sale.payment_type?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>

                {/* Payment Source */}
                <div style={{ 
                  fontSize: '12px', 
                  textTransform: 'capitalize',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {sale.payment_source?.replace('_', ' ') || 'N/A'}
                </div>

                {/* Brand */}
                <div style={{ 
                  fontSize: '12px', 
                  textTransform: 'capitalize',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {sale.brand?.replace('_', ' ') || 'N/A'}
                </div>

                {/* Agreement */}
                <div style={{ 
                  fontSize: '12px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {sale.agreement_file_name ? (
                    <button
                      onClick={() => downloadAgreement(sale.id)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={`Download: ${sale.agreement_file_name}`}
                    >
                      📄 Download
                    </button>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>No Agreement</span>
                  )}
                </div>

                {/* Created By */}
                <div style={{ 
                  fontSize: '12px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {sale.created_by_name || 'N/A'}
                </div>

                {/* Date */}
                <div style={{ 
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {hasPermission('sales', 'update') && (
                        <button 
                          onClick={() => editSale(sale)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                            cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2563eb';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#3b82f6';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="fas fa-edit"></i>
                          Edit
                        </button>
                      )}
                      {hasPermission('sales', 'delete') && (
                        <button 
                          onClick={() => deleteSale(sale.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                            cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#b91c1c';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc2626';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      )}
                    </div>
              </div>
              ))
            )}
      </div>
    </PageLayout>
  );
}

const inputStyle = {
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  backgroundColor: 'white',
  width: '100%',
  boxSizing: 'border-box',
  ':focus': {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  }
};
