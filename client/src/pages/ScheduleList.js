import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function ScheduleList() {
  const navigate = useNavigate();
  const [scheduledLeads, setScheduledLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const loadScheduledLeads = useCallback(async (page = 1) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await api.get(`/leads/scheduled?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScheduledLeads(response.data.scheduledLeads);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching scheduled leads:', error);
      alert('Failed to load scheduled leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    if (hasPermission('leads', 'read')) {
      loadScheduledLeads();
    }
  }, [hasPermission, loadScheduledLeads]);

  const handleCancelSchedule = async (leadId) => {
    if (!window.confirm('Are you sure you want to cancel this schedule?')) return;

    try {
      await api.delete(`/leads/${leadId}/schedule`);
      alert('Schedule cancelled successfully!');
      loadScheduledLeads(pagination.page); // Refresh the list
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Error cancelling schedule');
    }
  };

  const viewLead = (lead) => {
    setViewingLead(lead);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingLead(null);
  };

  const formatDateTime = (date, time) => {
    const scheduleDate = new Date(date);
    const formattedDate = scheduleDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (time) {
      const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${formattedDate} at ${formattedTime}`;
    }
    
    return formattedDate;
  };

  const getScheduleStatus = (scheduleDate, scheduleTime) => {
    const now = new Date();
    const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime || '00:00:00'}`);
    
    if (scheduleDateTime < now) {
      return { status: 'past', color: '#6b7280', label: 'Past' };
    } else if (scheduleDateTime.toDateString() === now.toDateString()) {
      return { status: 'today', color: '#f59e0b', label: 'Today' };
    } else {
      return { status: 'upcoming', color: '#10b981', label: 'Upcoming' };
    }
  };

  if (permissionsLoading) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading permissions...</div>
        </div>
      </PageLayout>
    );
  }

  if (!hasPermission('leads', 'read')) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#dc2626' }}>You don't have permission to view scheduled leads.</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Schedule List
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '0',
            fontSize: '16px'
          }}>
            View and manage your scheduled leads
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {pagination.total}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Total Scheduled
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '4px'
            }}>
              {scheduledLeads.filter(lead => {
                const status = getScheduleStatus(lead.schedule_date, lead.schedule_time);
                return status.status === 'today';
              }).length}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Today's Calls
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '4px'
            }}>
              {scheduledLeads.filter(lead => {
                const status = getScheduleStatus(lead.schedule_date, lead.schedule_time);
                return status.status === 'upcoming';
              }).length}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Upcoming Calls
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading scheduled leads...</div>
          </div>
        )}

        {/* Scheduled Leads List */}
        {!loading && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {scheduledLeads.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  No Scheduled Leads
                </h3>
                <p style={{
                  fontSize: '16px',
                  margin: '0',
                  color: '#6b7280'
                }}>
                  You haven't scheduled any leads yet. Go to the Leads module to schedule calls.
                </p>
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '20px',
                  padding: '16px 20px',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <div>Lead Details</div>
                  <div>Schedule</div>
                  <div>Status</div>
                  <div>Scheduled By</div>
                  <div>Actions</div>
                </div>

                {/* Table Rows */}
                {scheduledLeads.map((lead) => {
                  const scheduleStatus = getScheduleStatus(lead.schedule_date, lead.schedule_time);
                  
                  return (
                    <div key={lead.schedule_id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                      gap: '20px',
                      padding: '16px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {/* Lead Details */}
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {lead.name}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '2px'
                        }}>
                          {lead.company_name || 'No Company'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af'
                        }}>
                          {lead.phone || lead.email || 'No Contact Info'}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '2px'
                        }}>
                          {formatDateTime(lead.schedule_date, lead.schedule_time)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          Scheduled {new Date(lead.scheduled_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: `${scheduleStatus.color}20`,
                          color: scheduleStatus.color,
                          border: `1px solid ${scheduleStatus.color}40`
                        }}>
                          {scheduleStatus.label}
                        </span>
                      </div>

                      {/* Created By / Scheduled By */}
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {lead.scheduled_by_name || lead.created_by_name || 'Unknown'}
                        {lead.scheduled_by_name && lead.created_by_name && lead.scheduled_by_name !== lead.created_by_name && (
                          <div style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginTop: '2px'
                          }}>
                            Created: {lead.created_by_name}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => viewLead(lead)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleCancelSchedule(lead.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '30px'
          }}>
            <button
              onClick={() => loadScheduledLeads(pagination.page - 1)}
              disabled={pagination.page === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: pagination.page === 1 ? '#f3f4f6' : '#ffffff',
                color: pagination.page === 1 ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <span style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => loadScheduledLeads(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              style={{
                padding: '8px 16px',
                backgroundColor: pagination.page === pagination.pages ? '#f3f4f6' : '#ffffff',
                color: pagination.page === pagination.pages ? '#9ca3af' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* View Lead Modal */}
        {showViewModal && viewingLead && (
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
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
                  Lead Details
                </h2>
                <button
                  onClick={closeViewModal}
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

              {/* Lead Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '15px'
                }}>
                  Contact Information
                </h3>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#1f2937',
                  lineHeight: '1.6'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Name:</strong> {viewingLead.name}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Company:</strong> {viewingLead.company_name || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Email:</strong> {viewingLead.email || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Phone:</strong> {viewingLead.phone || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Location:</strong> {viewingLead.city && viewingLead.state ? 
                      `${viewingLead.city}, ${viewingLead.state}` : 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Source:</strong> {viewingLead.source || 'N/A'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Service Required:</strong> {viewingLead.service_required || 'N/A'}
                  </div>
                  {viewingLead.notes && (
                    <div>
                      <strong>Notes:</strong> {viewingLead.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '15px'
                }}>
                  Schedule Information
                </h3>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '20px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#1f2937',
                  lineHeight: '1.6',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Scheduled Date & Time:</strong> {formatDateTime(viewingLead.schedule_date, viewingLead.schedule_time)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Scheduled On:</strong> {new Date(viewingLead.scheduled_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: `${getScheduleStatus(viewingLead.schedule_date, viewingLead.schedule_time).color}20`,
                      color: getScheduleStatus(viewingLead.schedule_date, viewingLead.schedule_time).color,
                      border: `1px solid ${getScheduleStatus(viewingLead.schedule_date, viewingLead.schedule_time).color}40`
                    }}>
                      {getScheduleStatus(viewingLead.schedule_date, viewingLead.schedule_time).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  onClick={closeViewModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    navigate('/leads');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Go to Leads
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
