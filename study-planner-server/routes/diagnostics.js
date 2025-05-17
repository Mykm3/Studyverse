const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get system diagnostics
router.get('/', async (req, res) => {
  console.log('[Diagnostics] Fetching system diagnostics');

  try {
    // Collect system information
    const diagnostics = {
      timestamp: new Date().toISOString(),
      server: {
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host || 'Unknown',
        name: mongoose.connection.name || 'Unknown',
      },
      cloudinary: {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'
      },
      user: {
        id: req.user._id,
      }
    };

    res.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    console.error('[Diagnostics] Error fetching diagnostics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system diagnostics'
    });
  }
});

// Test Cloudinary connection
router.get('/cloudinary-test', async (req, res) => {
  console.log('[Diagnostics] Testing Cloudinary connection');

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Cloudinary credentials are not properly configured'
      });
    }

    // Attempt to fetch account info from Cloudinary
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Successfully connected to Cloudinary',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: result.status || 'OK'
    });
  } catch (error) {
    console.error('[Diagnostics] Cloudinary connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Cloudinary',
      message: error.message,
      code: error.http_code || error.code
    });
  }
});

// Test MongoDB connection
router.get('/mongodb-test', async (req, res) => {
  console.log('[Diagnostics] Testing MongoDB connection');

  try {
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        error: 'Not connected to MongoDB',
        readyState: mongoose.connection.readyState
      });
    }

    // Test a simple DB operation
    const stats = await mongoose.connection.db.stats();
    
    res.json({
      success: true,
      message: 'Successfully connected to MongoDB',
      databaseName: mongoose.connection.name,
      stats: {
        collections: stats.collections,
        documents: stats.objects,
        indexes: stats.indexes,
        storageSize: stats.storageSize
      }
    });
  } catch (error) {
    console.error('[Diagnostics] MongoDB connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test MongoDB connection',
      message: error.message
    });
  }
});

module.exports = router; 