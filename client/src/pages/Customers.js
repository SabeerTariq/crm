import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    source: '',
    dateFrom: '',
    dateTo: '',
    hasOutstanding: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Check permission before fetching data
    if (!hasPermission('customers', 'read')) {
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    api.get('/customers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setCustomers(res.data);
      setFilteredCustomers(res.data);
    })
    .catch(error => {
      console.error('Error fetching customers:', error);
    })
    .finally(() => setLoading(false));
  }, [hasPermission]);

  // Filter and search functionality
  const applyFilters = useCallback(() => {
    let filtered = [...customers];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.source?.toLowerCase().includes(term)
      );
    }

    // Source filter
    if (filters.source) {
      filtered = filtered.filter(customer => customer.source === filters.source);
    }

    // Outstanding balance filter
    if (filters.hasOutstanding) {
      if (filters.hasOutstanding === 'yes') {
        filtered = filtered.filter(customer => parseFloat(customer.total_remaining || 0) > 0);
      } else if (filters.hasOutstanding === 'no') {
        filtered = filtered.filter(customer => parseFloat(customer.total_remaining || 0) === 0);
      }
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(customer => 
        new Date(customer.converted_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(customer => 
        new Date(customer.converted_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filters]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Show loading while permissions are being fetched
  if (permissionsLoading || loading) {
    return (
      <PageLayout>
          <div>Loading...</div>
      </PageLayout>
    );
  }

  // Check if user has permission to view customers
  if (!hasPermission('customers', 'read')) {
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
            <p>You do not have permission to view customers.</p>
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
                Customer Management
              </h1>
              <p style={{ 
                margin: '0', 
                color: '#6b7280', 
                fontSize: '16px' 
              }}>
                Managing customers for <strong style={{ color: '#374151' }}>{getUserName()}</strong>
              </p>
            </div>
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
                {filteredCustomers.length}
              </div>
              <div style={{ fontSize: '14px', color: '#0c4a6e', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Customers' : 'Total Customers'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #bbf7d0' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                ${filteredCustomers.reduce((sum, customer) => sum + (parseFloat(customer.total_sales) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#14532d', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Sales' : 'Total Sales'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fde68a' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                ${filteredCustomers.reduce((sum, customer) => sum + (parseFloat(customer.total_paid) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Paid' : 'Total Paid'}
              </div>
            </div>
            <div style={{ 
              backgroundColor: '#fef2f2', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #fecaca' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                ${filteredCustomers.reduce((sum, customer) => sum + (parseFloat(customer.total_remaining) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#991b1b', marginTop: '4px' }}>
                {searchTerm || Object.values(filters).some(f => f) ? 'Filtered Outstanding' : 'Outstanding Balance'}
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
                  placeholder="Search customers by name, email, phone, or source..."
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
                  Source
                </label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
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
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="email">Email</option>
                  <option value="other">Other</option>
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
                  Outstanding Balance
                </label>
                <select
                  value={filters.hasOutstanding}
                  onChange={(e) => setFilters({ ...filters, hasOutstanding: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">All Customers</option>
                  <option value="yes">Has Outstanding Balance</option>
                  <option value="no">Fully Paid</option>
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
                  Converted From
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
                  Converted To
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
                    source: '',
                    dateFrom: '',
                    dateTo: '',
                    hasOutstanding: ''
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

        {/* Customers List */}
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
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1fr',
            gap: '16px',
            padding: '20px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '14px',
            color: '#374151'
          }}>
            <div>Customer</div>
            <div>Contact</div>
            <div>Source</div>
            <div>Total Sales</div>
            <div>Total Paid</div>
            <div>Remaining</div>
            <div>Status</div>
            <div>Converted At</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          {filteredCustomers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#6b7280',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>
                <i className="fas fa-users"></i>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                No customers found
              </h3>
              <p style={{ margin: '0', fontSize: '14px' }}>
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filters' 
                  : 'Customers will appear here when leads are converted'
                }
              </p>
          </div>
        ) : (
            filteredCustomers.map((customer, index) => (
              <div key={customer.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1fr',
                gap: '16px',
                padding: '20px 24px',
                borderBottom: index < filteredCustomers.length - 1 ? '1px solid #f3f4f6' : 'none',
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
                    {customer.name}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginBottom: '2px'
                  }}>
                    {customer.email}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280' 
                  }}>
                    {customer.phone || 'N/A'}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    display: 'inline-block'
                  }}>
                    {customer.source?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>

                {/* Total Sales */}
                <div style={{ 
                  fontWeight: '700', 
                  color: '#059669',
                  fontSize: '14px'
                }}>
                  ${parseFloat(customer.total_sales || 0).toLocaleString()}
                </div>

                {/* Total Paid */}
                <div style={{ 
                  fontWeight: '700', 
                  color: '#16a34a',
                  fontSize: '14px'
                }}>
                  ${parseFloat(customer.total_paid || 0).toLocaleString()}
                </div>

                {/* Remaining */}
                <div style={{ 
                  fontWeight: '700', 
                  color: parseFloat(customer.total_remaining || 0) > 0 ? '#dc2626' : '#16a34a',
                  fontSize: '14px'
                }}>
                  ${parseFloat(customer.total_remaining || 0).toLocaleString()}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    backgroundColor: parseFloat(customer.total_remaining || 0) > 0 ? '#fef2f2' : '#f0fdf4',
                    color: parseFloat(customer.total_remaining || 0) > 0 ? '#dc2626' : '#16a34a',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>
                    {parseFloat(customer.total_remaining || 0) > 0 ? 'Outstanding' : 'Paid'}
                  </span>
                </div>

                {/* Converted At */}
                <div style={{ 
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {customer.converted_at ? new Date(customer.converted_at).toLocaleDateString() : 'N/A'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link 
                    to={`/customers/${customer.id}/sales-profile`}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                        fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
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
                    <i className="fas fa-chart-line"></i>
                    View Profile
                    </Link>
                </div>
              </div>
            ))
        )}
      </div>
    </PageLayout>
  );
}
