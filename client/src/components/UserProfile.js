import { getUserName, getUserEmail, getUserRole } from '../utils/userUtils';

export default function UserProfile({ showRole = true, size = 'default' }) {
  const name = getUserName();
  const email = getUserEmail();
  const role = getUserRole();

  const styles = {
    small: {
      fontSize: '12px',
      padding: '8px 12px'
    },
    default: {
      fontSize: '14px',
      padding: '15px'
    },
    large: {
      fontSize: '16px',
      padding: '20px'
    }
  };

  const currentStyle = styles[size] || styles.default;

  return (
    <div style={{
      ...currentStyle,
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '10px'
    }}>
      <div style={{
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: showRole ? '4px' : '0'
      }}>
        {name}
      </div>
      {showRole && (
        <div style={{
          fontSize: '0.85em',
          color: '#64748b',
          textTransform: 'capitalize'
        }}>
          {role}
        </div>
      )}
      {email && (
        <div style={{
          fontSize: '0.8em',
          color: '#94a3b8',
          marginTop: '2px'
        }}>
          {email}
        </div>
      )}
    </div>
  );
}
