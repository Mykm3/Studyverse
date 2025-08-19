# 🔄 StudyVerse IP Monitoring System

This system automatically detects IP address changes and updates your configuration files in real-time, ensuring your mobile app can always connect to your development server.

## 🚀 Features

- **Real-time IP Detection**: Monitors network changes every 10 seconds
- **Automatic .env Updates**: Updates both server and mobile app configuration files
- **Dynamic CORS**: Automatically allows new IP addresses for mobile connections
- **Zero Configuration**: Works out of the box with your existing setup
- **Manual Override**: Utility script for manual IP updates

## 📱 How It Works

1. **Server Startup**: IP monitor starts automatically in development mode
2. **Network Change Detection**: Detects when your computer's IP address changes
3. **Automatic Updates**: Updates `.env` files in both server and mobile app directories
4. **CORS Configuration**: Dynamically allows new IP addresses for mobile connections
5. **Logging**: Provides clear feedback about IP changes and updates

## 🔧 Usage

### Automatic Monitoring (Recommended)

Just start your server normally:

```bash
cd study_scheduler/study-planner-server
npm start
# or
node server.js
```

The IP monitor will:
- ✅ Start automatically in development mode
- ✅ Check for IP changes every 10 seconds
- ✅ Update .env files when changes are detected
- ✅ Log all changes with clear messages

### Manual IP Update

If you need to manually set a specific IP address:

```bash
# Auto-detect current IP and update files
node update-ip.js

# Set a specific IP address
node update-ip.js 192.168.1.100

# Show network information
node update-ip.js --help
```

### Check Current Server Info

Visit the server info endpoint to see current configuration:

```
http://YOUR_IP:5000/api/server-info
```

This returns:
```json
{
  "ip": "192.168.1.100",
  "port": 5000,
  "serverUrl": "http://192.168.1.100:5000",
  "mobileUrl": "http://192.168.1.100:8081",
  "expUrl": "exp://192.168.1.100:8081",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "corsOrigins": [...]
}
```

## 📁 Files Updated

The system automatically updates these files:

1. **Server .env** (`study_scheduler/study-planner-server/.env`)
   - Updates `SERVER_URL=http://NEW_IP:5000`

2. **Mobile .env** (`studyverse_mobile/.env`)
   - Updates `EXPO_PUBLIC_API_URL=http://NEW_IP:5000`

## 🔍 Monitoring Logs

When IP changes are detected, you'll see logs like:

```
🔄 IP Address Changed!
   Old IP: 192.168.1.100
   New IP: 192.168.1.150
   Server URL: http://192.168.1.150:5000

✅ Updated server .env: SERVER_URL=http://192.168.1.150:5000
✅ Updated mobile .env: EXPO_PUBLIC_API_URL=http://192.168.1.150:5000
🔄 Updated runtime SERVER_URL: http://192.168.1.150:5000
📱 New mobile origins: http://192.168.1.150:8081, exp://192.168.1.150:8081

✨ IP monitoring update complete!
```

## 🛠️ Configuration

You can customize the IP monitor by modifying the options in `server.js`:

```javascript
const ipMonitor = new IPMonitor({
  interval: 10000,  // Check every 10 seconds (default)
  port: 5000,       // Your server port
  onChange: (newIP, oldIP) => {
    // Custom callback when IP changes
    console.log(`IP changed from ${oldIP} to ${newIP}`);
  }
});
```

## 🔧 Troubleshooting

### IP Not Detected
- Make sure you're connected to a network (WiFi or Ethernet)
- Try running `node update-ip.js` to see available network interfaces
- Manually specify an IP: `node update-ip.js YOUR_IP_ADDRESS`

### Mobile App Still Can't Connect
1. Check that the mobile `.env` file was updated
2. Restart your Expo development server
3. Clear Expo cache: `expo start -c`
4. Verify CORS origins in server logs

### Files Not Updating
- Check file permissions on `.env` files
- Ensure the paths in `ip-monitor.js` are correct
- Run the server with elevated permissions if needed

## 🚫 Disabling IP Monitoring

To disable automatic IP monitoring, set `NODE_ENV=production` or comment out the IP monitor initialization in `server.js`:

```javascript
// Comment out these lines to disable
// if (process.env.NODE_ENV === 'development') {
//   ipMonitor = new IPMonitor({...});
//   ipMonitor.start();
// }
```

## 📋 Network Priority

The system prioritizes network interfaces in this order:
1. Ethernet
2. Wi-Fi/WiFi
3. wlan0 (Linux)
4. eth0 (Linux)
5. Any other non-internal IPv4 interface

This ensures the most stable connection is used for your development server.

---

**🎉 That's it! Your StudyVerse server now automatically adapts to network changes.**
