const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// Helper function to handle MongoDB errors
const handleMongoError = (error, res) => {
  console.error('MongoDB error:', error);
  
  if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
    return res.status(503).json({ 
      message: 'Database connection timeout. Please try again.',
      error: error.message 
    });
  }
  
  res.status(500).json({ 
    message: 'Database error occurred', 
    error: error.message 
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists with retry logic
    let existingUser;
    try {
      existingUser = await User.findOne({ email }).maxTimeMS(10000);
    } catch (error) {
      console.error('Error checking existing user:', error);
      return res.status(503).json({ 
        message: 'Database connection error. Please try again.',
        error: error.message 
      });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with retry logic
    let user;
    try {
      user = new User({
        email,
        password,
        displayName
      });

      await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(503).json({ 
        message: 'Database connection error. Please try again.',
        error: error.message 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    handleMongoError(error, res);
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email with timeout
    const user = await User.findOne({ email }).maxTimeMS(5000);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user has a password (wasn't created through Google OAuth)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account was created with Google. Please use Google Sign-In.' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    handleMongoError(error, res);
  }
});

// Google OAuth login route
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback route
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true,
    session: true
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        throw new Error('No user data received from Google');
      }

      console.log('Google OAuth callback received for user:', req.user.email);
      
      // Ensure user is saved in session
      req.session.user = {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName
      };

      // Save session explicitly
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Google callback:', error);
      
      // Handle specific error types
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        console.error('Database timeout error during Google callback');
        const errorUrl = `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('Database connection timeout. Please try again.')}`;
        return res.redirect(errorUrl);
      }

      if (error.name === 'MongoError' || error.name === 'MongooseError') {
        console.error('Database error during Google callback:', error);
        const errorUrl = `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('Database error occurred. Please try again.')}`;
        return res.redirect(errorUrl);
      }

      // Handle session errors
      if (error.name === 'SessionError') {
        console.error('Session error during Google callback:', error);
        const errorUrl = `${process.env.CLIENT_URL}/login?error=${encodeURIComponent('Session error occurred. Please try again.')}`;
        return res.redirect(errorUrl);
      }

      // Handle other errors
      const errorUrl = `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`;
      console.log('Redirecting to error page:', errorUrl);
      res.redirect(errorUrl);
    }
  }
);

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -googleId')
      .maxTimeMS(5000);
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    handleMongoError(error, res);
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error logging out', error: err.message });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router; 