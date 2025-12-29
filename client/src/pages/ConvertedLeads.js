import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function ConvertedLeads() {
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (hasPermission('leads', 'read')) {
      loadConvertedLeads();
    }
  }, [hasPermission]);

  const loadConvertedLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/leads/converted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConvertedLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching converted leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <PageLayout>
        <div>Loading permissions...</div>
      </PageLayout>
    );
  }

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
          <p>You do not have permission to view converted leads.</p>
        </div>
      </PageLayout>
    );
  }

  const filteredLeads = convertedLeads.filter(lead => 
    !searchEmail || 
    (lead.email && lead.email.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  return (
    <PageLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          color: '#1f2937',
          fontSize: '32px',
          fontWeight: '700'
        }}>
          Converted Leads
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0',
          fontSize: '16px'
        }}>
          Leads that have been converted to customers
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '400px'
        }}>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            style={{
              width: '100%',
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
          {searchEmail && (
            <button
              onClick={() => setSearchEmail('')}
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
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {filteredLeads.length} of {convertedLeads.length} converted leads
        </div>
      </div>

      {/* Converted Leads List */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading converted leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
              {searchEmail ? 'No matching converted leads' : 'No converted leads'}
            </h3>
            <p style={{ margin: '0' }}>
              {searchEmail 
                ? `No converted leads found matching "${searchEmail}"`
                : 'No leads have been converted to customers yet.'}
            </p>
          </div>
        ) : (
          <div style={{
            maxHeight: '600px',
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
              {filteredLeads.map((lead, index) => (
                <div
                  key={lead.id}
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
                        {lead.name || 'N/A'}
                      </div>
                      {lead.company_name && (
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
                            {lead.company_name}
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
                        📧 {lead.email || 'N/A'}
                      </div>
                      {lead.phone && (
                        <div style={{
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          📞 {lead.phone}
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
                        {lead.city && lead.state 
                          ? `${lead.city}, ${lead.state}`
                          : lead.city || lead.state || 'N/A'}
                      </div>
                      {lead.source && (
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
                            {lead.source}
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
                          Converted: {lead.converted_at 
                            ? new Date(lead.converted_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      {lead.created_by_name && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          By: {lead.created_by_name}
                        </div>
                      )}
                      {lead.assigned_to_name && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          Assigned: {lead.assigned_to_name}
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
                          Sales: {lead.sales_count || 0}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Total: ${parseFloat(lead.total_amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Paid: ${parseFloat(lead.total_revenue || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        <span style={{
                          backgroundColor: parseFloat(lead.remaining_amount || 0) > 0 ? '#fee2e2' : '#f0fdf4',
                          color: parseFloat(lead.remaining_amount || 0) > 0 ? '#991b1b' : '#166534',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Remaining: ${parseFloat(lead.remaining_amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {lead.service_required && (
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
                        {lead.service_required}
                      </div>
                    </div>
                  )}

                  {lead.notes && (
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
                        {lead.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

