const fs = require('fs');
const os = require('os');
const path = require('path');

class IPMonitor {
    constructor(options = {}) {
        this.currentIP = null;
        this.checkInterval = options.interval || 5000; // Check every 5 seconds
        this.port = options.port || 5000; // Default to your server port
        this.intervalId = null;
        this.onChange = options.onChange || (() => {});
        
        // File paths for updating
        this.serverEnvFile = path.join(__dirname, '.env');
        this.mobileEnvFile = path.join(__dirname, '../../studyverse_mobile/.env');
        
        console.log('📍 IP Monitor initialized');
        console.log('📁 Server .env path:', this.serverEnvFile);
        console.log('📱 Mobile .env path:', this.mobileEnvFile);
    }
    
    getLocalIP() {
        const interfaces = os.networkInterfaces();

        // Helper function to check if IP is in a valid LAN range
        const isValidLanIP = (ip) => {
            // Valid private IP ranges:
            // 10.0.0.0 - 10.255.255.255 (Class A)
            // 172.16.0.0 - 172.31.255.255 (Class B)
            // 192.168.0.0 - 192.168.255.255 (Class C)

            const parts = ip.split('.').map(Number);

            // Class A: 10.x.x.x
            if (parts[0] === 10) return true;

            // Class B: 172.16.x.x - 172.31.x.x
            if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

            // Class C: 192.168.x.x
            if (parts[0] === 192 && parts[1] === 168) return true;

            // Reject problematic ranges
            // 26.x.x.x (often VPN/virtual adapters)
            if (parts[0] === 26) return false;

            // 169.254.x.x (APIPA/link-local)
            if (parts[0] === 169 && parts[1] === 254) return false;

            return false;
        };

        // Collect all valid IPs with priority scoring
        const validIPs = [];

        for (const [name, addresses] of Object.entries(interfaces)) {
            for (const netInterface of addresses) {
                if (netInterface.family === 'IPv4' && !netInterface.internal) {
                    const ip = netInterface.address;
                    if (isValidLanIP(ip)) {
                        // Prioritize real network interfaces over virtual ones
                        const isVirtual = name.toLowerCase().includes('vmware') ||
                                        name.toLowerCase().includes('virtualbox') ||
                                        name.toLowerCase().includes('hyper-v');
                        const isWiFi = name.toLowerCase().includes('wi-fi') ||
                                     name.toLowerCase().includes('wifi') ||
                                     name.toLowerCase().includes('wireless');
                        const isEthernet = name.toLowerCase().includes('ethernet');

                        const priority = isWiFi ? 1 : (isEthernet ? 2 : (isVirtual ? 4 : 3));

                        validIPs.push({ ip, name, priority, isVirtual, isWiFi, isEthernet });
                    } else {
                        console.log(`⚠️  Skipping ${name}: ${ip} (not in valid LAN range)`);
                    }
                }
            }
        }

        // Sort by priority and return the best one
        if (validIPs.length > 0) {
            validIPs.sort((a, b) => a.priority - b.priority);
            const best = validIPs[0];
            const networkType = best.isWiFi ? '📶 WiFi' : (best.isEthernet ? '🔌 Ethernet' : (best.isVirtual ? '💻 Virtual' : '🌐 Network'));
            console.log(`✅ Selected ${best.name} interface: ${best.ip} ${networkType}`);
            return best.ip;
        }

        // Second pass: Look for any valid LAN IP in any interface
        console.log('🔍 Searching all interfaces for valid LAN IP...');
        for (const [name, addresses] of Object.entries(interfaces)) {
            for (const netInterface of addresses) {
                if (netInterface.family === 'IPv4' && !netInterface.internal) {
                    const ip = netInterface.address;
                    if (isValidLanIP(ip)) {
                        console.log(`✅ Found valid LAN IP on ${name}: ${ip}`);
                        return ip;
                    } else {
                        console.log(`⚠️  Skipping ${name}: ${ip} (not in valid LAN range)`);
                    }
                }
            }
        }

        // Last resort: any non-internal IPv4 (but warn about it)
        console.log('⚠️  No valid LAN IP found, using fallback...');
        for (const name of Object.keys(interfaces)) {
            for (const netInterface of interfaces[name]) {
                if (netInterface.family === 'IPv4' && !netInterface.internal) {
                    console.log(`⚠️  Using fallback IP from ${name}: ${netInterface.address}`);
                    return netInterface.address;
                }
            }
        }

        return 'localhost';
    }
    
    updateEnvFile(filePath, newIP) {
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${filePath}`);
                return false;
            }
            
            let content = fs.readFileSync(filePath, 'utf8');
            const apiUrl = `http://${newIP}:${this.port}`;
            
            // Determine which environment variable to update based on file
            const isMobileEnv = filePath.includes('studyverse_mobile');
            const envVar = isMobileEnv ? 'EXPO_PUBLIC_API_URL' : 'SERVER_URL';
            const newLine = `${envVar}=${apiUrl}`;
            
            if (content.includes(`${envVar}=`)) {
                // Replace existing line
                const regex = new RegExp(`^${envVar}=.*$`, 'm');
                content = content.replace(regex, newLine);
            } else {
                // Add new line
                content += content.endsWith('\n') ? newLine : `\n${newLine}`;
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated ${isMobileEnv ? 'mobile' : 'server'} .env: ${envVar}=${apiUrl}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update ${filePath}:`, error.message);
            return false;
        }
    }
    
    updateCorsOrigins(newIP) {
        // Update process.env for immediate effect on CORS
        const newOrigin = `http://${newIP}:8081`;
        const expOrigin = `exp://${newIP}:8081`;
        
        // Note: This updates the runtime environment
        // The actual CORS middleware would need to be restarted to pick up changes
        // But we can at least update the environment variables
        process.env.SERVER_URL = `http://${newIP}:${this.port}`;
        
        console.log(`🔄 Updated runtime SERVER_URL: http://${newIP}:${this.port}`);
        console.log(`📱 New mobile origins: ${newOrigin}, ${expOrigin}`);
    }
    
    checkIPChange() {
        const newIP = this.getLocalIP();
        
        if (newIP !== this.currentIP && newIP !== 'localhost') {
            const oldIP = this.currentIP || 'unknown';
            console.log(`\n🔄 IP Address Changed!`);
            console.log(`   Old IP: ${oldIP}`);
            console.log(`   New IP: ${newIP}`);
            console.log(`   Server URL: http://${newIP}:${this.port}`);
            
            // Update environment variables immediately
            process.env.SERVER_URL = `http://${newIP}:${this.port}`;
            process.env.API_BASE_URL = `http://${newIP}:${this.port}`;
            
            // Update .env files
            this.updateEnvFile(this.serverEnvFile, newIP);
            this.updateEnvFile(this.mobileEnvFile, newIP);
            
            // Update CORS origins
            this.updateCorsOrigins(newIP);
            
            // Call change handler
            this.onChange(newIP, this.currentIP);
            
            this.currentIP = newIP;
            
            console.log(`✨ IP monitoring update complete!\n`);
        }
    }
    
    start() {
        console.log(`\n🔍 Starting IP Monitor...`);
        console.log(`   Check interval: ${this.checkInterval}ms`);
        console.log(`   Server port: ${this.port}`);
        
        // Initial check
        this.checkIPChange();
        
        // Start monitoring
        this.intervalId = setInterval(() => {
            this.checkIPChange();
        }, this.checkInterval);
        
        // Cleanup on process exit
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
        
        console.log(`✅ IP Monitor started successfully\n`);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 IP Monitor stopped');
        }
    }
    
    getCurrentIP() {
        return this.currentIP || this.getLocalIP();
    }
    
    getServerUrl() {
        return `http://${this.getCurrentIP()}:${this.port}`;
    }
    
    // Add endpoint information for debugging
    addServerInfoEndpoint(app) {
        app.get('/api/server-info', (req, res) => {
            const currentIP = this.getCurrentIP();
            res.json({
                ip: currentIP,
                port: this.port,
                serverUrl: `http://${currentIP}:${this.port}`,
                mobileUrl: `http://${currentIP}:8081`,
                expUrl: `exp://${currentIP}:8081`,
                timestamp: new Date().toISOString(),
                corsOrigins: [
                    `http://${currentIP}:8081`,
                    `exp://${currentIP}:8081`,
                    `exp+studyverse-mobile://expo-development-client`
                ]
            });
        });
        
        console.log('📡 Added /api/server-info endpoint for IP debugging');
    }
}

module.exports = IPMonitor;
