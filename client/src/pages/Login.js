import { useState } from 'react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login();
    }
  };

  const login = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirect to appropriate dashboard based on user role
      const user = res.data.user;
      let redirectUrl = '/dashboard'; // Default to main dashboard for admin
      
      // Check role after user is stored in localStorage
      if (user.role_id === 2) { // Lead Scraper
        redirectUrl = '/lead-scraper-dashboard';
      } else if (user.role_id === 3) { // Sales
        redirectUrl = '/front-seller-dashboard';
      } else if (user.role_id === 5) { // Upseller
        redirectUrl = '/upseller-dashboard';
      }
      
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Login failed:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Invalid credentials';
        alert(`Login failed: ${message}`);
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        alert('Cannot connect to server. Please check your connection.');
      } else {
        alert('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0e1525 0%, #1a1f3a 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            color: '#1f2937', 
            margin: '0 0 10px 0',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Welcome Back
          </h2>
          <p style={{ 
            color: '#6b7280', 
            margin: '0',
            fontSize: '16px'
          }}>
            Sign in to your CRM account
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <input 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#694bfb'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <input 
            placeholder="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#694bfb'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        
        <button 
          onClick={login}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #694bfb 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 12px rgba(105, 75, 251, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(105, 75, 251, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(105, 75, 251, 0.3)';
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
