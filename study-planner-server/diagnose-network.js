#!/usr/bin/env node

/**
 * StudyVerse Network Diagnostic Tool
 * 
 * This script helps diagnose network connectivity issues between
 * your server and mobile app by analyzing available network interfaces
 * and testing connectivity.
 */

const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

function analyzeNetworkInterfaces() {
    console.log('🔍 StudyVerse Network Diagnostic Tool');
    console.log('=====================================\n');
    
    const interfaces = os.networkInterfaces();
    
    // Helper function to categorize IP addresses
    const categorizeIP = (ip) => {
        const parts = ip.split('.').map(Number);
        
        if (parts[0] === 10) return { valid: true, type: 'Class A Private', color: '✅' };
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return { valid: true, type: 'Class B Private', color: '✅' };
        if (parts[0] === 192 && parts[1] === 168) return { valid: true, type: 'Class C Private', color: '✅' };
        if (parts[0] === 26) return { valid: false, type: 'VPN/Virtual Adapter', color: '❌' };
        if (parts[0] === 169 && parts[1] === 254) return { valid: false, type: 'APIPA/Link-local', color: '❌' };
        if (parts[0] === 127) return { valid: false, type: 'Loopback', color: '🏠' };
        if (parts[0] >= 224) return { valid: false, type: 'Multicast/Reserved', color: '❌' };
        
        return { valid: false, type: 'Unknown/Public', color: '⚠️' };
    };
    
    console.log('📡 Network Interfaces Analysis:');
    console.log('-------------------------------');
    
    const validIPs = [];
    const problematicIPs = [];
    
    for (const [name, addresses] of Object.entries(interfaces)) {
        console.log(`\n🔌 ${name}:`);
        
        addresses.forEach(addr => {
            if (addr.family === 'IPv4') {
                const category = categorizeIP(addr.address);
                const status = addr.internal ? 'Internal' : 'External';

                console.log(`   ${category.color} ${addr.address} (${status}) - ${category.type}`);

                if (!addr.internal) {
                    if (category.valid) {
                        // Prioritize real network interfaces over virtual ones
                        const isVirtual = name.toLowerCase().includes('vmware') ||
                                        name.toLowerCase().includes('virtualbox') ||
                                        name.toLowerCase().includes('hyper-v');
                        const isWiFi = name.toLowerCase().includes('wi-fi') ||
                                     name.toLowerCase().includes('wifi') ||
                                     name.toLowerCase().includes('wireless');
                        const isEthernet = name.toLowerCase().includes('ethernet');

                        validIPs.push({
                            ip: addr.address,
                            interface: name,
                            type: category.type,
                            isVirtual,
                            isWiFi,
                            isEthernet,
                            priority: isWiFi ? 1 : (isEthernet ? 2 : (isVirtual ? 4 : 3))
                        });
                    } else {
                        problematicIPs.push({ ip: addr.address, interface: name, type: category.type });
                    }
                }
            }
        });
    }
    
    console.log('\n📊 Summary:');
    console.log('-----------');
    
    if (validIPs.length > 0) {
        // Sort by priority (WiFi first, then Ethernet, then others, virtual last)
        validIPs.sort((a, b) => a.priority - b.priority);

        console.log('\n✅ Valid IPs for mobile connection:');
        validIPs.forEach((item, index) => {
            const priority = index === 0 ? '🎯 RECOMMENDED' : '   Alternative';
            const networkType = item.isWiFi ? '📶 WiFi' : (item.isEthernet ? '🔌 Ethernet' : (item.isVirtual ? '💻 Virtual' : '🌐 Network'));
            console.log(`   ${priority}: ${item.ip} (${item.interface}) - ${item.type} ${networkType}`);
        });

        const recommendedIP = validIPs[0].ip;
        console.log(`\n🚀 Quick Fix Commands:`);
        console.log(`   node update-ip.js ${recommendedIP}`);
        console.log(`   # Then restart your server and mobile app`);
        
        console.log(`\n📱 Your mobile app should connect to:`);
        console.log(`   http://${recommendedIP}:5000`);
        
    } else {
        console.log('\n❌ No valid LAN IPs found!');
        console.log('   Make sure you are connected to WiFi or Ethernet.');
    }
    
    if (problematicIPs.length > 0) {
        console.log('\n⚠️  Problematic IPs (avoid these):');
        problematicIPs.forEach(item => {
            console.log(`   ❌ ${item.ip} (${item.interface}) - ${item.type}`);
        });
    }
    
    return validIPs.length > 0 ? validIPs[0].ip : null;
}

async function testConnectivity(ip) {
    if (!ip) return;
    
    console.log('\n🔗 Testing Connectivity:');
    console.log('------------------------');
    
    try {
        // Test if the port is available
        const { stdout } = await execAsync(`netstat -an | findstr :5000`);
        if (stdout.includes(':5000')) {
            console.log('✅ Port 5000 is in use (server likely running)');
        } else {
            console.log('⚠️  Port 5000 is not in use (server not running?)');
        }
    } catch (error) {
        console.log('⚠️  Could not check port status');
    }
    
    console.log(`\n🌐 Test URLs:`);
    console.log(`   Server: http://${ip}:5000`);
    console.log(`   API Test: http://${ip}:5000/api/server-info`);
    console.log(`   Mobile should use: http://${ip}:5000`);
}

function showNextSteps(recommendedIP) {
    console.log('\n📋 Next Steps:');
    console.log('==============');
    
    if (recommendedIP) {
        console.log('1. Update your configuration:');
        console.log(`   node update-ip.js ${recommendedIP}`);
        console.log('');
        console.log('2. Restart your server:');
        console.log('   npm start');
        console.log('');
        console.log('3. Restart your mobile app:');
        console.log('   expo start -c');
        console.log('');
        console.log('4. Test the connection:');
        console.log(`   Open http://${recommendedIP}:5000/api/server-info in your browser`);
        console.log('');
        console.log('5. If still having issues:');
        console.log('   - Check Windows Firewall settings');
        console.log('   - Make sure both devices are on the same WiFi network');
        console.log('   - Try disabling VPN if you have one running');
    } else {
        console.log('❌ No valid network configuration found.');
        console.log('');
        console.log('Troubleshooting steps:');
        console.log('1. Connect to WiFi or Ethernet');
        console.log('2. Disable VPN connections');
        console.log('3. Run this script again');
        console.log('4. If still having issues, manually specify an IP:');
        console.log('   node update-ip.js YOUR_WIFI_IP');
    }
}

async function main() {
    const recommendedIP = analyzeNetworkInterfaces();
    await testConnectivity(recommendedIP);
    showNextSteps(recommendedIP);
    
    console.log('\n🎉 Diagnostic complete!');
    console.log('If you need help, share the output above.\n');
}

// Handle command line execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzeNetworkInterfaces, testConnectivity };
