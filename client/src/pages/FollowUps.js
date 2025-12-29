import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { getUserId, getUserRole } from '../utils/userUtils';
import { isAdmin } from '../utils/roleUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function FollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const userRole = getUserRole();
  const currentUserId = getUserId();
  const isAdminUser = isAdmin();

  const loadFollowUps = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await api.get('/follow-ups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowUps(response.data);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      alert('Failed to load follow-ups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasPermission('follow_ups', 'read')) {
      return;
    }
    loadFollowUps();
  }, [hasPermission, loadFollowUps]);

  const handleViewLead = async (leadId) => {
    const token = localStorage.getItem('token');
    setLoadingLead(true);
    setShowViewModal(true);
    try {
      // Fetch lead from leads list - we'll search for it by getting all leads and finding the one with matching ID
      // Note: This is not ideal but there's no single lead endpoint. In production, you'd want to add GET /leads/:id
      const response = await api.get('/leads?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lead = response.data.leads?.find(l => l.id === parseInt(leadId));
      if (lead) {
        setViewingLead(lead);
      } else {
        alert('Lead not found');
        setShowViewModal(false);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      alert('Failed to load lead details');
      setShowViewModal(false);
    } finally {
      setLoadingLead(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingLead(null);
  };

  const handleRemoveFollowUp = async (followUpId, leadId) => {
    if (!window.confirm('Are you sure you want to remove this follow-up?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/follow-ups/${followUpId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Follow-up removed successfully');
      await loadFollowUps();
    } catch (error) {
      console.error('Error removing follow-up:', error);
      alert('Error removing follow-up');
    }
  };

  const handleStatusChange = async (followUpId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/follow-ups/${followUpId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadFollowUps();
    } catch (error) {
      console.error('Error updating follow-up status:', error);
      alert('Error updating follow-up status');
    }
  };

  const filteredFollowUps = followUps.filter(fu => {
    if (filters.status && fu.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        (fu.lead_name && fu.lead_name.toLowerCase().includes(searchLower)) ||
        (fu.company_name && fu.company_name.toLowerCase().includes(searchLower)) ||
        (fu.user_name && fu.user_name.toLowerCase().includes(searchLower)) ||
        (fu.note && fu.note.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (permissionsLoading) {
    return (
      <PageLayout>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </PageLayout>
    );
  }

  if (!hasPermission('follow_ups', 'read')) {
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
          <p>You do not have permission to view follow-ups.</p>
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
            Follow-ups Management
          </h1>
        </div>
        <p style={{ 
          color: '#6b7280', 
          margin: '0',
          fontSize: '16px'
        }}>
          {isAdminUser || userRole === 'front-sales-manager' || userRole === 'upseller-manager' 
            ? 'Viewing all follow-ups across all users' 
            : 'Viewing your personal follow-ups'}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px'
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
              Search
            </label>
            <input
              type="text"
              placeholder="Search by lead, company, user, or note..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s ease'
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
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Follow-ups Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {loading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading follow-ups...
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No follow-ups found</h3>
            <p style={{ margin: '0' }}>
              {filters.search || filters.status 
                ? 'No follow-ups match your current filters.' 
                : 'No follow-ups available. Add leads to your follow-up menu from the Leads page.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
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
              <div>Lead</div>
              <div>Company</div>
              <div>Added By</div>
              <div>Follow-up Date</div>
              <div>Status</div>
              <div>Note</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>

            {/* Table Rows */}
            {filteredFollowUps.map((followUp) => (
              <div key={followUp.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#ffffff',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
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
                  {followUp.lead_name || 'Unknown Lead'}
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
                  {followUp.company_name || 'N/A'}
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
                  {followUp.user_full_name || followUp.user_name || 'Unknown User'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {followUp.follow_up_date ? new Date(followUp.follow_up_date).toLocaleDateString() : 'Not set'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <select
                    value={followUp.status || 'pending'}
                    onChange={(e) => handleStatusChange(followUp.id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  {followUp.note || 'No note'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => handleViewLead(followUp.lead_id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    View Lead
                  </button>
                  {(currentUserId === followUp.user_id || isAdminUser) && (
                    <button
                      onClick={() => handleRemoveFollowUp(followUp.id, followUp.lead_id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* View Lead Modal */}
      {showViewModal && (
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
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {loadingLead ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Loading lead details...
              </div>
            ) : viewingLead ? (
              <>
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
                          <a
                            href={`mailto:${viewingLead.email}`}
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
                        ) : (
                          <div style={{ fontSize: '16px', color: '#9ca3af' }}>N/A</div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                        {viewingLead.phone ? (
                          <a
                            href={`tel:${viewingLead.phone}`}
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
                        ) : (
                          <div style={{ fontSize: '16px', color: '#9ca3af' }}>N/A</div>
                        )}
                      </div>
                      {viewingLead.business_email && (
                        <div>
                          <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Business Email</label>
                          <a
                            href={`mailto:${viewingLead.business_email}`}
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
                        </div>
                      )}
                      {viewingLead.business_number && (
                        <div>
                          <label style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Business Phone</label>
                          <a
                            href={`tel:${viewingLead.business_number}`}
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
                {viewingLead.service_required && (
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
                      {viewingLead.service_required}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingLead.notes && (
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
                      {viewingLead.notes}
                    </div>
                  </div>
                )}

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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Lead not found
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

