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

export const hasUpsellerManagerRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check upseller-manager role (role_id = 6)
  return userRoleId === 6;
};

export const hasFrontSalesManagerRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check front-sales-manager role (role_id = 4)
  return userRoleId === 4;
};

export const isAdmin = () => {
  return getUserRoleId() === 1;
};

export const hasProductionHeadRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check production-head role (role_id = 8)
  return userRoleId === 8;
};

export const hasProductionLeadRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check production lead roles (role_id = 9, 11, 13, 15, 17)
  return [9, 11, 13, 15, 17].includes(userRoleId);
};

export const hasProductionMemberRole = () => {
  // Check admin role first (role_id = 1)
  const userRoleId = getUserRoleId();
  if (userRoleId === 1) {
    return true;
  }
  
  // Check production member roles (role_id = 10, 12, 14, 16, 18)
  return [10, 12, 14, 16, 18].includes(userRoleId);
};
