// Simple test to check if session data API endpoints are working
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Mock authentication token (you'll need to replace this with a real token)
const TEST_TOKEN = 'your-test-token-here';

const testSessionId = '507f1f77bcf86cd799439011'; // Mock ObjectId
const testUserId = '507f1f77bcf86cd799439012'; // Mock ObjectId

async function testSessionDataAPI() {
  console.log('🧪 Testing Session Data API Endpoints...\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  };

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('   Error:', error.message);
      return;
    }

    // Test 2: Test conversation endpoint (GET)
    console.log('\n2️⃣ Testing conversation GET endpoint...');
    try {
      const conversationResponse = await axios.get(
        `${API_BASE_URL}/api/session-data/conversation/${testSessionId}`,
        { headers }
      );
      console.log('✅ Conversation GET endpoint accessible');
      console.log('   Response:', conversationResponse.data);
    } catch (error) {
      console.log('❌ Conversation GET endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data || error.message);
    }

    // Test 3: Test summary endpoint (GET)
    console.log('\n3️⃣ Testing summary GET endpoint...');
    try {
      const summaryResponse = await axios.get(
        `${API_BASE_URL}/api/session-data/summary/${testSessionId}`,
        { headers }
      );
      console.log('✅ Summary GET endpoint accessible');
      console.log('   Response:', summaryResponse.data);
    } catch (error) {
      console.log('❌ Summary GET endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data || error.message);
    }

    // Test 4: Test quiz endpoint (GET)
    console.log('\n4️⃣ Testing quiz GET endpoint...');
    try {
      const quizResponse = await axios.get(
        `${API_BASE_URL}/api/session-data/quiz/${testSessionId}`,
        { headers }
      );
      console.log('✅ Quiz GET endpoint accessible');
      console.log('   Response:', quizResponse.data);
    } catch (error) {
      console.log('❌ Quiz GET endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data || error.message);
    }

    // Test 5: Test without authentication
    console.log('\n5️⃣ Testing without authentication...');
    try {
      const noAuthResponse = await axios.get(
        `${API_BASE_URL}/api/session-data/conversation/${testSessionId}`
      );
      console.log('❌ Endpoint should require authentication but didn\'t');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication properly required');
      } else {
        console.log('❓ Unexpected error without auth:', error.response?.status, error.message);
      }
    }

    // Test 6: Test stats endpoint
    console.log('\n6️⃣ Testing stats endpoint...');
    try {
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/session-data/stats`,
        { headers }
      );
      console.log('✅ Stats endpoint accessible');
      console.log('   Response:', statsResponse.data);
    } catch (error) {
      console.log('❌ Stats endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Instructions for getting a real token
console.log('📋 To run this test with a real token:');
console.log('1. Login to your app and get the token from localStorage');
console.log('2. Replace TEST_TOKEN with your actual token');
console.log('3. Run: node test-session-api.js\n');

// Run the test
testSessionDataAPI();
