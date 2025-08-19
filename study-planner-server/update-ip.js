#!/usr/bin/env node

/**
 * StudyVerse IP Update Utility
 * 
 * This script manually updates IP addresses in .env files
 * Usage: node update-ip.js [new-ip-address]
 * 
 * If no IP is provided, it will auto-detect the current network IP
 */

const IPMonitor = require('./ip-monitor');
const os = require('os');

function showCurrentNetworkInfo() {
    console.log('\n🌐 Network Interface Information:');
    console.log('================================');
    
    const interfaces = os.networkInterfaces();
    
    for (const [name, addresses] of Object.entries(interfaces)) {
        console.log(`\n📡 ${name}:`);
        addresses.forEach(addr => {
            if (addr.family === 'IPv4') {
                const status = addr.internal ? '🏠 Internal' : '🌍 External';
                console.log(`   ${status}: ${addr.address}`);
            }
        });
    }
    console.log('\n');
}

function main() {
    const args = process.argv.slice(2);
    const providedIP = args[0];
    
    console.log('🔧 StudyVerse IP Update Utility');
    console.log('===============================\n');
    
    // Show current network information
    showCurrentNetworkInfo();
    
    // Initialize IP monitor
    const monitor = new IPMonitor({ port: 5000 });
    
    if (providedIP) {
        // Validate IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(providedIP)) {
            console.error('❌ Invalid IP address format. Please provide a valid IPv4 address.');
            process.exit(1);
        }
        
        console.log(`🎯 Updating to provided IP: ${providedIP}`);
        
        // Manually update files with provided IP
        const serverEnvPath = monitor.serverEnvFile;
        const mobileEnvPath = monitor.mobileEnvFile;
        
        console.log('\n📝 Updating configuration files...');
        
        const serverUpdated = monitor.updateEnvFile(serverEnvPath, providedIP);
        const mobileUpdated = monitor.updateEnvFile(mobileEnvPath, providedIP);
        
        if (serverUpdated && mobileUpdated) {
            console.log('\n✅ Successfully updated both .env files!');
            console.log(`\n📱 Mobile app should now use: http://${providedIP}:5000`);
            console.log(`🖥️  Server will be available at: http://${providedIP}:5000`);
            console.log('\n💡 Restart your server and mobile app to apply changes.');
        } else {
            console.log('\n⚠️  Some files could not be updated. Check the error messages above.');
        }
        
    } else {
        // Auto-detect current IP
        const currentIP = monitor.getLocalIP();
        
        if (currentIP === 'localhost') {
            console.log('❌ Could not detect a valid network IP address.');
            console.log('💡 Make sure you are connected to a network (WiFi or Ethernet).');
            console.log('🔧 Or provide an IP manually: node update-ip.js 192.168.1.100');
            process.exit(1);
        }
        
        console.log(`🔍 Auto-detected IP: ${currentIP}`);
        console.log('\n📝 Updating configuration files...');
        
        // Update files with detected IP
        const serverUpdated = monitor.updateEnvFile(monitor.serverEnvFile, currentIP);
        const mobileUpdated = monitor.updateEnvFile(monitor.mobileEnvFile, currentIP);
        
        if (serverUpdated && mobileUpdated) {
            console.log('\n✅ Successfully updated both .env files!');
            console.log(`\n📱 Mobile app will use: http://${currentIP}:5000`);
            console.log(`🖥️  Server will be available at: http://${currentIP}:5000`);
            console.log('\n💡 Restart your server and mobile app to apply changes.');
        } else {
            console.log('\n⚠️  Some files could not be updated. Check the error messages above.');
        }
    }
    
    console.log('\n🔄 For automatic IP monitoring, start your server normally.');
    console.log('   The IP monitor will detect changes in real-time.\n');
}

// Handle command line execution
if (require.main === module) {
    main();
}

module.exports = { main, showCurrentNetworkInfo };
