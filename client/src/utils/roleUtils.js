// Utility functions for role-based access control

export const getUserRoleId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role_id;
};

export const getUserRoleName = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role_name;
};

export const hasRole = (requiredRoleId) => {
  const userRoleId = getUserRoleId();
  return userRoleId === requiredRoleId || userRoleId === 1; // 1 is admin
};

export const hasLeadScraperRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check lead-scraper role (role_id = 2)
  return userRoleId === 2;
};

export const hasSalesRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check sales role (role_id = 3)
  return userRoleId === 3;
};

export const hasUpsellerRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check upseller role (role_id = 5)
  return userRoleId === 5;
};

export const isAdmin = () => {
  return getUserRoleId() === 1;
};
