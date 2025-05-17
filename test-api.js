const fetch = require('node-fetch');

// Replace this with a valid token from your local storage
const token = 'YOUR_JWT_TOKEN_HERE';

// Function to test API endpoints with authentication
async function testApi(endpoint) {
  try {
    console.log(`Testing endpoint with auth: ${endpoint}`);
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return null;
  }
}

// Function to test API endpoints without authentication
async function testApiNoAuth(endpoint) {
  try {
    console.log(`Testing endpoint without auth: ${endpoint}`);
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
  } catch (error) {
    console.error(`Error testing ${endpoint} (no auth):`, error.message);
    return null;
  }
}

// Test the note routes
async function runTests() {
  console.log('=== Testing API Endpoints ===');
  
  // Test debug endpoint first (no auth required)
  console.log('\n=== Debug Endpoint ===');
  await testApiNoAuth('/api/notes/debug');
  
  // Test without authentication 
  console.log('\n=== Tests WITHOUT Authentication ===');
  await testApiNoAuth('/api/notes');
  await testApiNoAuth('/api/notes/subjects');
  
  // Test with authentication
  console.log('\n=== Tests WITH Authentication ===');
  await testApi('/api/auth/profile');
  await testApi('/api/notes');
  await testApi('/api/notes/subjects');
}

runTests().catch(console.error); 