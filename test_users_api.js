// Test the users API to see what data is returned
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users API...\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Step 2: Test users API
    console.log('\n2. Testing users API...');
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users API working');
      console.log(`   Found ${usersData.length} users`);
      
      // Show all users with their roles
      console.log('\n   All users:');
      usersData.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role_name}`);
      });
      
      // Filter for sales users (like the Teams component does)
      const salesUsers = usersData.filter(user => user.role_name === 'sales');
      console.log(`\n   Sales users (filtered): ${salesUsers.length}`);
      salesUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role_name}`);
      });
      
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ Users API failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsersAPI();
