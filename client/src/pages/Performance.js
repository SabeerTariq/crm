import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

export default function Performance() {
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
      const response = await api.get('/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPerformance = async (teamId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/targets/current/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get team members for this team
      const teamResponse = await api.get(`/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const teamMembers = teamResponse.data.members || [];
      const memberIds = teamMembers.map(member => member.user_id);
      
      // Filter targets for team members only
      const teamTargets = response.data.filter(target => memberIds.includes(target.user_id));
      
      setTeamPerformance({
        targets: teamTargets,
        members: teamMembers
      });
    } catch (err) {
      console.error('Error fetching team performance:', err);
      setError('Failed to load team performance');
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
          Loading performance data...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        <div style={{ marginBottom: '30px' }}>
          <h2>Performance Tracking</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
            Monitor team and individual performance against targets
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
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Select Team</h3>
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
            {/* Team Targets */}
            {teamPerformance.targets && teamPerformance.targets.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Team Targets</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {teamPerformance.targets.map((target, index) => (
                    <div key={index} style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '20px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <h4 style={{ margin: '0', fontSize: '16px' }}>{target.team_name}</h4>
                        <span style={{
                          backgroundColor: getProgressColor(target.progress_percentage),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {target.progress_percentage}%
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '8px'
                        }}>
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>Target:</span>
                          <span style={{ fontWeight: '600' }}>{target.target_value} customers</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '12px'
                        }}>
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>Converted:</span>
                          <span style={{ fontWeight: '600' }}>{target.actual_conversions} customers</span>
                        </div>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(target.progress_percentage, 100)}%`,
                          height: '100%',
                          backgroundColor: getProgressColor(target.progress_percentage),
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Performance */}
            {teamPerformance.members && teamPerformance.members.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Team Members Performance</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Member</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Target</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Converted</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Progress</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerformance.targets.map((target, index) => (
                        <tr key={target.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '500' }}>{target.user_name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{target.user_email}</div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {target.target_value} customers
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
                              {target.actual_conversions} customers
                            </span>
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
                                  width: `${Math.min(target.progress_percentage, 100)}%`,
                                  height: '100%',
                                  backgroundColor: getProgressColor(target.progress_percentage),
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{
                                color: getProgressColor(target.progress_percentage),
                                fontWeight: '600',
                                fontSize: '12px'
                              }}>
                                {target.progress_percentage}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: target.progress_percentage >= 100 ? '#dcfce7' : 
                                             target.progress_percentage >= 75 ? '#fef3c7' : 
                                             target.progress_percentage >= 50 ? '#fed7aa' : '#fecaca',
                              color: target.progress_percentage >= 100 ? '#166534' : 
                                     target.progress_percentage >= 75 ? '#92400e' : 
                                     target.progress_percentage >= 50 ? '#c2410c' : '#dc2626',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {target.progress_percentage >= 100 ? 'Excellent' : 
                               target.progress_percentage >= 75 ? 'Good' : 
                               target.progress_percentage >= 50 ? 'Fair' : 'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {(!teamPerformance.targets || teamPerformance.targets.length === 0) && 
             (!teamPerformance.members || teamPerformance.members.length === 0) && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#6b7280', margin: '0' }}>No performance data available for this team</p>
                <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '14px' }}>
                  Set targets and track sales to see performance metrics
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
            <p style={{ color: '#6b7280', margin: '0' }}>Select a team to view performance data</p>
            <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '14px' }}>
              Choose a team from the list above to see detailed performance metrics
            </p>
          </div>
        )}
    </PageLayout>
  );
}
