import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { hasLeadScraperRole, isAdmin } from '../utils/roleUtils';
import { getUserName } from '../utils/userUtils';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function LeadScraperDashboard() {
  const [dashboardData, setDashboardData] = useState({
    currentMonth: {
      leadsAdded: 0,
      leadsConverted: 0,
      conversionRate: 0
    },
    pastMonths: []
  });
  const [allScrapersPerformance, setAllScrapersPerformance] = useState([]);
  const [loadingScrapersPerformance, setLoadingScrapersPerformance] = useState(false);
  const [convertedLeads, setConvertedLeads] = useState([]);
  const [loadingConvertedLeads, setLoadingConvertedLeads] = useState(false);
  const [loading, setLoading] = useState(true);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Check if user has lead-scraper role
    if (!hasLeadScraperRole()) {
      return;
    }
    
    loadDashboardData();
    loadConvertedLeads();
    
    // Load all scrapers performance if admin
    if (isAdmin()) {
      loadAllScrapersPerformance();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Load dashboard stats and monthly history in parallel
      const [statsResponse, historyResponse] = await Promise.all([
        api.get('/dashboard/stats', { headers }),
        api.get('/dashboard/monthly-history?months=12', { headers })
      ]);
      
      setDashboardData({
        currentMonth: statsResponse.data.currentMonth,
        pastMonths: historyResponse.data.map(month => ({
          year: month.year,
          month: month.month,
          monthName: formatMonth(month.year, month.month),
          leadsAdded: month.leads_added || 0,
          leadsConverted: month.leads_converted || 0,
          conversionRate: parseFloat(month.conversion_rate || 0)
        }))
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllScrapersPerformance = async () => {
    try {
      setLoadingScrapersPerformance(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await api.get('/dashboard/all-scrapers-performance', { headers });
      
      if (response.data.success) {
        setAllScrapersPerformance(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading all scrapers performance:', error);
    } finally {
      setLoadingScrapersPerformance(false);
    }
  };

  const loadConvertedLeads = async () => {
    try {
      setLoadingConvertedLeads(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await api.get('/dashboard/scraper-converted-leads', { headers });
      
      if (response.data.success) {
        setConvertedLeads(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading converted leads:', error);
    } finally {
      setLoadingConvertedLeads(false);
    }
  };

  const formatMonth = (year, month) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPreviousMonthName = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check if user has lead-scraper role
  const hasLeadScraperAccess = hasLeadScraperRole();

  if (loading) {
    return (
      <PageLayout>
        <div>Loading dashboard...</div>
      </PageLayout>
    );
  }

  if (!hasLeadScraperAccess) {
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
          <p>This dashboard is only available to users with the lead-scraper role.</p>
        </div>
      </PageLayout>
    );
  }

  if (!dashboardData) {
    return (
      <PageLayout>
        <div>Failed to load dashboard data.</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            color: '#1f2937',
            fontSize: '32px',
            fontWeight: '700'
          }}>
            Lead Scraper Dashboard
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: '0',
            fontSize: '16px'
          }}>
            Welcome back, <strong>{getUserName()}</strong>
          </p>
        </div>

        {/* Current Month Performance - Main Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Current Month Performance
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              {getCurrentMonthName()}
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '40px',
            marginBottom: '30px'
          }}>
            {/* Leads Added */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {dashboardData.currentMonth.leadsAdded}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                Leads Added
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                This month
              </div>
            </div>

            {/* Leads Converted */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#16a34a',
                marginBottom: '8px'
              }}>
                {dashboardData.currentMonth.leadsConverted}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                Leads Converted
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                This month
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              {dashboardData.currentMonth.conversionRate}%
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              Conversion Rate
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Leads converted vs added
            </div>
          </div>
        </div>

        {/* Past Months Performance Section */}
        {dashboardData.pastMonths && dashboardData.pastMonths.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Past Months Performance
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Historical performance over the last 12 months
              </p>
            </div>

            {/* Past Months Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {dashboardData.pastMonths.map((month, index) => (
                <div key={`${month.year}-${month.month}`} style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '16px'
                  }}>
                    {month.monthName}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        marginBottom: '4px'
                      }}>
                        {month.leadsAdded}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Added
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#16a34a',
                        marginBottom: '4px'
                      }}>
                        {month.leadsConverted}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Converted
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '2px'
                    }}>
                      {month.conversionRate}%
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Conversion Rate
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            {dashboardData.pastMonths.length > 0 && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#3b82f6'
                    }}>
                      {dashboardData.pastMonths.length}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Months Tracked
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#16a34a'
                    }}>
                      {dashboardData.pastMonths.reduce((sum, month) => sum + month.leadsAdded, 0)}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Added
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#7c3aed'
                    }}>
                      {dashboardData.pastMonths.reduce((sum, month) => sum + month.leadsConverted, 0)}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Converted
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: '#f59e0b'
                    }}>
                      {dashboardData.pastMonths.length > 0 ? 
                        (dashboardData.pastMonths.reduce((sum, month) => sum + month.conversionRate, 0) / dashboardData.pastMonths.length).toFixed(1) : 0}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Avg Conversion
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Converted Leads Section */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '1400px',
          margin: '40px auto 0'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              My Converted Leads
            </h2>
            <p style={{ 
              color: '#6b7280',
              margin: '0',
              fontSize: '16px'
            }}>
              Leads you added that have been converted to customers with sales information
            </p>
          </div>

          {loadingConvertedLeads ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading converted leads...
            </div>
          ) : convertedLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>No converted leads</h3>
              <p style={{ margin: '0' }}>
                None of your leads have been converted to customers yet.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Customer</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Contact</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Location</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Total Sale Amount</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Total Received</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Total Remaining</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Sales Count</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb'
                    }}>Converted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {convertedLeads.map((lead, index) => (
                    <tr key={lead.id} style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    }}>
                      <td style={{
                        padding: '16px',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {lead.name}
                        </div>
                        {lead.companyName && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {lead.companyName}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#374151'
                      }}>
                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                          📧 {lead.email || 'N/A'}
                        </div>
                        {lead.phone && (
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            📞 {lead.phone}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#374151'
                      }}>
                        {lead.city && lead.state 
                          ? `${lead.city}, ${lead.state}`
                          : lead.city || lead.state || 'N/A'}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#3b82f6',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        ${lead.totalSaleAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#16a34a',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        ${lead.totalReceived.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: lead.totalRemaining > 0 ? '#dc2626' : '#16a34a',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        ${lead.totalRemaining.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {lead.salesCount}
                      </td>
                      <td style={{
                        padding: '16px',
                        color: '#6b7280',
                        fontSize: '13px'
                      }}>
                        {lead.convertedAt 
                          ? new Date(lead.convertedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Scrapers Performance Section - Admin Only */}
        {isAdmin() && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '1400px',
            margin: '40px auto 0'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                All Scrapers Performance
              </h2>
              <p style={{ 
                color: '#6b7280',
                margin: '0',
                fontSize: '16px'
              }}>
                Overview of all lead scrapers' performance metrics
              </p>
            </div>

            {loadingScrapersPerformance ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Loading scrapers performance...
              </div>
            ) : allScrapersPerformance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No scrapers found
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Scraper</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Current Month</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Leads Added</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Leads Converted</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Conversion Rate</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>All Time Total</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>All Time Converted</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb'
                      }}>Overall Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allScrapersPerformance.map((scraper, index) => (
                      <tr key={scraper.id} style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}>
                        <td style={{
                          padding: '16px',
                          fontWeight: '500',
                          color: '#1f2937'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {scraper.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {scraper.email}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.currentMonthLeadsAdded > 0 ? '#dbeafe' : '#f3f4f6',
                            color: scraper.currentMonthLeadsAdded > 0 ? '#1e40af' : '#6b7280',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.currentMonthLeadsAdded}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#3b82f6',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {scraper.totalLeadsAdded.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#16a34a',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {scraper.totalLeadsConverted.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.currentMonthConversionRate >= 10 ? '#d1fae5' : scraper.currentMonthConversionRate >= 5 ? '#fef3c7' : '#fee2e2',
                            color: scraper.currentMonthConversionRate >= 10 ? '#065f46' : scraper.currentMonthConversionRate >= 5 ? '#92400e' : '#991b1b',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.currentMonthConversionRate.toFixed(1)}%
                          </div>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {scraper.totalLeadsAdded.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {scraper.totalLeadsConverted.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: scraper.overallConversionRate >= 10 ? '#d1fae5' : scraper.overallConversionRate >= 5 ? '#fef3c7' : '#fee2e2',
                            color: scraper.overallConversionRate >= 10 ? '#065f46' : scraper.overallConversionRate >= 5 ? '#92400e' : '#991b1b',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {scraper.overallConversionRate.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </PageLayout>
  );
}

