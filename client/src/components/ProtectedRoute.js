import { usePermissions } from '../hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import { hasLeadScraperRole, hasSalesRole, hasUpsellerRole, isAdmin } from '../utils/roleUtils';

const ProtectedRoute = ({ children, module, action = 'read' }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Admin users have access to everything
  if (isAdmin()) {
    return children;
  }

  // If no module specified, deny access
  if (!module) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check for specified action permission (defaults to 'read')
  if (!hasPermission(module, action)) {
    // For main dashboard access, redirect to appropriate role-based dashboard
    if (module === 'users' && action === 'read') {
      if (hasLeadScraperRole()) {
        return <Navigate to="/lead-scraper-dashboard" replace />;
      } else if (hasSalesRole()) {
        return <Navigate to="/front-seller-dashboard" replace />;
      } else if (hasUpsellerRole()) {
        return <Navigate to="/upseller-dashboard" replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
