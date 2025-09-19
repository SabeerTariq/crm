// Utility functions for user information

export const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user;
};

export const getUserName = () => {
  const user = getCurrentUser();
  return user.name || user.email || 'Unknown User';
};

export const getUserEmail = () => {
  const user = getCurrentUser();
  return user.email || '';
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user.role_name || '';
};

export const getUserId = () => {
  const user = getCurrentUser();
  return user.id || null;
};
