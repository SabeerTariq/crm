// Debug utility to check what permissions are loaded
export const debugPermissions = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  console.log('🔍 Debug Permissions:');
  console.log('User:', user);
  console.log('Token exists:', !!token);
  
  return {
    user,
    hasToken: !!token,
    userRole: user.role,
    userId: user.id
  };
};

// Test if user should have access to customers
export const testCustomerAccess = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('🧪 Testing Customer Access:');
  console.log('User role:', user.role);
  console.log('Should have customer access:', user.role === 'admin' || user.role === 'lead-scraper');
  return user.role === 'admin' || user.role === 'lead-scraper';
};
