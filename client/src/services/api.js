import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // Check if we're running on localhost (fallback detection)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Use production URL for production
  return 'https://crm.sitestaginglink.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect to login if not already on login page
      if (window.location.pathname !== '/login') {
        if (errorCode === 'TOKEN_EXPIRED') {
          alert('Your session has expired. Please log in again.');
        } else {
          alert('Authentication failed. Please log in again.');
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
