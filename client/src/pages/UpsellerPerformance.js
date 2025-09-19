import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function UpsellerPerformance() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/upseller-teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data);
    } catch (err) {
      console.error('Error fetching upseller teams:', err);
      setError('Failed to load upseller teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPerformance = async (teamId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/upseller-performance/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTeamPerformance(response.data);
    } catch (err) {
      console.error('Error fetching upseller team performance:', err);
      setError('Failed to load upseller team performance');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamId) => {
    setSelectedTeam(teamId);
    fetchTeamPerformance(teamId);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    if (percentage >= 50) return '#f97316';
    return '#ef4444';
  };

  const getPerformanceStatus = (percentage) => {
    if (percentage >= 100) return { text: 'Excellent', color: '#10b981', bg: '#dcfce7' };
    if (percentage >= 75) return { text: 'Good', color: '#f59e0b', bg: '#fef3c7' };
    if (percentage >= 50) return { text: 'Fair', color: '#f97316', bg: '#fed7aa' };
    return { text: 'Needs Improvement', color: '#ef4444', bg: '#fecaca' };
  };

  if (loading || permissionsLoading) {
    return (
      <PageLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px',
          color: '#64748b'
        }}>
          Loading upseller performance data...
        </div>
      </PageLayout>
    );
  }

  // Check if user has permission to view performance
  if (!hasPermission('upseller_performance', 'read')) {
    return (
      <PageLayout>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>Access Denied</h3>
          <p style={{ color: '#6b7280', margin: '0' }}>
            You don't have permission to view upseller performance data.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '30px' }}>
          <h2>Upseller Performance Tracking</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
            Monitor upseller team and individual performance against targets
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px',
            color: '#dc2626',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Team Selection */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Select Upseller Team</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {teams.map(team => (
              <div
                key={team.id}
                onClick={() => handleTeamSelect(team.id)}
                style={{
                  padding: '15px',
                  border: selectedTeam === team.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedTeam === team.id ? '#eff6ff' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '5px' }}>{team.name}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {team.member_count} members
                </div>
                {team.description && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                    {team.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        {selectedTeam && teamPerformance && (
          <div>
            {/* Team Summary */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
                Team Performance Summary - {teamPerformance.period_month}/{teamPerformance.period_year}
              </h3>
              
              {teamPerformance.performance && teamPerformance.performance.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {teamPerformance.performance.reduce((sum, p) => sum + p.customers_assigned, 0)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Customers Assigned</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                      {teamPerformance.performance.reduce((sum, p) => sum + p.sales_count, 0)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Sales Generated</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                      ${teamPerformance.performance.reduce((sum, p) => sum + parseFloat(p.total_revenue || 0), 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                      {Math.round(teamPerformance.performance.reduce((sum, p) => sum + p.progress_percentage, 0) / teamPerformance.performance.length)}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Average Progress</div>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Performance */}
            {teamPerformance.performance && teamPerformance.performance.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Individual Performance</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Upseller</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Target</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Assigned</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sales</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Revenue</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Progress</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerformance.performance.map((perf, index) => {
                        const status = getPerformanceStatus(perf.progress_percentage);
                        return (
                          <tr key={perf.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px' }}>
                              <div>
                                <div style={{ fontWeight: '500' }}>{perf.user_name}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{perf.email}</div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>
                              {perf.target} customers
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {perf.customers_assigned} customers
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {perf.sales_count} sales
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>
                              ${parseFloat(perf.total_revenue || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px' 
                              }}>
                                <div style={{
                                  width: '60px',
                                  height: '6px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min(perf.progress_percentage, 100)}%`,
                                    height: '100%',
                                    backgroundColor: getProgressColor(perf.progress_percentage),
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <span style={{
                                  color: getProgressColor(perf.progress_percentage),
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }}>
                                  {perf.progress_percentage}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: status.bg,
                                color: status.color,
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {status.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {(!teamPerformance.performance || teamPerformance.performance.length === 0) && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280', margin: '0' }}>No performance data available for this upseller team</p>
                <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '14px' }}>
                  Set targets and track assignments to see performance metrics
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Team Selected */}
        {!selectedTeam && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', margin: '0' }}>Select an upseller team to view performance data</p>
            <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '14px' }}>
              Choose a team from the list above to see detailed performance metrics
            </p>
          </div>
        )}
    </PageLayout>
  );
}
