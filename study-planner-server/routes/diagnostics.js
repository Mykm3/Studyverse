const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const supabase = require('../config/supabaseClient');

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

router.get('/supabase-test', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.from('studyverse-uploads').list('');
    if (error) throw error;
    return res.json({ message: 'Supabase connected!', files: data });
  } catch (err) {
    return res.status(500).json({ message: 'Supabase connection failed', error: err.message });
  }
});

module.exports = router; 