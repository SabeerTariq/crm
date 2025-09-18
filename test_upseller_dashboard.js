// Test script for upseller dashboard API
const axios = require('axios');

async function testUpsellerDashboard() {
  try {
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'upseller@example.com',
      password: 'password123' // You'll need to use the actual password
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Test the upseller dashboard endpoint
    const dashboardResponse = await axios.get('http://localhost:5000/api/upseller/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard API Response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing upseller dashboard:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testUpsellerDashboard();
