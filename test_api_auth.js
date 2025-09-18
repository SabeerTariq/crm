// Test API authentication and assignments endpoint
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testing API Authentication and Assignments...\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123' // Assuming this is the password
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   Token:', loginData.token ? 'Received' : 'Not received');
    
    if (!loginData.token) {
      console.log('❌ No token received from login');
      return;
    }
    
    // Step 2: Test assignments API
    console.log('\n2. Testing assignments API...');
    const assignmentsResponse = await fetch('http://localhost:5000/api/assignments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', assignmentsResponse.status);
    console.log('   Headers:', Object.fromEntries(assignmentsResponse.headers.entries()));
    
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ Assignments API working');
      console.log('   Data:', JSON.stringify(assignmentsData, null, 2));
    } else {
      const errorText = await assignmentsResponse.text();
      console.log('❌ Assignments API failed:', errorText);
    }
    
    // Step 3: Test upsellers API
    console.log('\n3. Testing upsellers API...');
    const upsellersResponse = await fetch('http://localhost:5000/api/assignments/upsellers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', upsellersResponse.status);
    
    if (upsellersResponse.ok) {
      const upsellersData = await upsellersResponse.json();
      console.log('✅ Upsellers API working');
      console.log('   Data:', JSON.stringify(upsellersData, null, 2));
    } else {
      const errorText = await upsellersResponse.text();
      console.log('❌ Upsellers API failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
