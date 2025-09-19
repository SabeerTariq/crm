import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tokenHeader = useCallback(() => ({ 
    Authorization: `Bearer ${localStorage.getItem('token')}` 
  }), []);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Loading permissions for user:', user);
      
      // Get user's role permissions from the backend (works for all users including admin)
      console.log('Fetching permissions from API...');
      const response = await api.get('/rbac/user/permissions', { 
        headers: tokenHeader() 
      });
      
      console.log('Loaded permissions:', response.data);
      console.log('Number of permissions loaded:', response.data.length);
      setPermissions(response.data);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load permissions');
      // Fallback: if we can't load permissions, assume no access
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [tokenHeader]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback((module, action) => {
    // Get current user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('User object from localStorage:', user);
    console.log('User role_id:', user.role_id);
    
    // Check RBAC permissions (this works for all users including admin)
    const hasPerm = permissions.some(perm => 
      perm.module === module && perm.action === action
    );
    console.log(`Checking permission ${module}:${action} - ${hasPerm ? 'GRANTED' : 'DENIED'}`, permissions);
    return hasPerm;
  }, [permissions]);

  const canView = useCallback((module) => {
    return hasPermission(module, 'view');
  }, [hasPermission]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canView,
    refetch: loadPermissions
  };
};
