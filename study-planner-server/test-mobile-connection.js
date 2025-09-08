#!/usr/bin/env node

/**
 * StudyVerse Mobile Connection Test
 * 
 * This script tests if the mobile app can successfully connect to the server
 * by simulating the API calls that the mobile app would make.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read the current server URL from .env
function getServerUrl() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/SERVER_URL=(.+)/);
        if (match) {
            return match[1].trim();
        }
    }
    return 'http://localhost:5000';
}

// Test basic server connectivity
async function testServerInfo(serverUrl) {
    console.log('🔍 Testing server info endpoint...');
    try {
        const response = await axios.get(`${serverUrl}/api/server-info`, {
            timeout: 5000
        });
        
        console.log('✅ Server info endpoint working!');
        console.log('📊 Server details:');
        console.log(`   IP: ${response.data.ip}`);
        console.log(`   Port: ${response.data.port}`);
        console.log(`   Server URL: ${response.data.serverUrl}`);
        console.log(`   Mobile URL: ${response.data.mobileUrl}`);
        return true;
    } catch (error) {
        console.log('❌ Server info endpoint failed:');
        if (error.code === 'ECONNREFUSED') {
            console.log('   Connection refused - server not running?');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   Connection timeout - firewall blocking?');
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

// Test authentication endpoint (what mobile app uses)
async function testAuthEndpoint(serverUrl) {
    console.log('\n🔐 Testing authentication endpoint...');
    try {
        // This should return a 401 or similar auth error, but not a connection error
        const response = await axios.get(`${serverUrl}/api/auth/me`, {
            timeout: 5000,
            validateStatus: () => true // Accept any status code
        });
        
        if (response.status === 401) {
            console.log('✅ Auth endpoint reachable (401 Unauthorized as expected)');
            return true;
        } else {
            console.log(`✅ Auth endpoint reachable (Status: ${response.status})`);
            return true;
        }
    } catch (error) {
        console.log('❌ Auth endpoint failed:');
        if (error.code === 'ECONNREFUSED') {
            console.log('   Connection refused - server not running?');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   Connection timeout - firewall blocking?');
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

// Test CORS headers (important for mobile app)
async function testCorsHeaders(serverUrl) {
    console.log('\n🌐 Testing CORS headers...');
    try {
        const response = await axios.options(`${serverUrl}/api/server-info`, {
            timeout: 5000,
            headers: {
                'Origin': 'http://localhost:8081',
                'Access-Control-Request-Method': 'GET'
            }
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
        };
        
        console.log('✅ CORS preflight successful!');
        console.log('📋 CORS headers:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            if (value) {
                console.log(`   ${key}: ${value}`);
            }
        });
        return true;
    } catch (error) {
        console.log('⚠️  CORS preflight test failed (this might be normal):');
        console.log(`   ${error.message}`);
        return false;
    }
}

// Main test function
async function runConnectionTests() {
    const serverUrl = getServerUrl();
    
    console.log('📱 StudyVerse Mobile Connection Test');
    console.log('===================================');
    console.log(`🎯 Testing server: ${serverUrl}\n`);
    
    const results = {
        serverInfo: false,
        auth: false,
        cors: false
    };
    
    // Run tests
    results.serverInfo = await testServerInfo(serverUrl);
    results.auth = await testAuthEndpoint(serverUrl);
    results.cors = await testCorsHeaders(serverUrl);
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Server Info: ${results.serverInfo ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Auth Endpoint: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CORS Headers: ${results.cors ? '✅ PASS' : '⚠️  SKIP'}`);
    
    const overallSuccess = results.serverInfo && results.auth;
    
    if (overallSuccess) {
        console.log('\n🎉 Connection test PASSED!');
        console.log('Your mobile app should be able to connect to the server.');
        console.log('\n📱 Next steps:');
        console.log('1. Restart your mobile app: expo start -c');
        console.log('2. Make sure your phone is on the same WiFi network');
        console.log('3. Test the mobile app connection');
    } else {
        console.log('\n❌ Connection test FAILED!');
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Make sure your server is running: npm start');
        console.log('2. Check Windows Firewall settings');
        console.log('3. Verify both devices are on the same WiFi network');
        console.log('4. Try disabling VPN/antivirus temporarily');
        console.log('5. Run: node diagnose-network.js');
    }
    
    return overallSuccess;
}

// Handle command line execution
if (require.main === module) {
    runConnectionTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = { runConnectionTests, getServerUrl };
