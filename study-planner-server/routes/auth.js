// const express = require('express');
// const passport = require('passport');
// const router = express.Router();
// const User = require('../models/User');
// const auth = require('../middleware/auth');
// const { generateToken, verifyGoogleToken, findOrCreateUser } = require('../config/passport');

// // Helper function to handle MongoDB errors
// const handleMongoError = (error, res) => {
//   console.error('MongoDB error:', error);
  
//   if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
//     return res.status(503).json({ 
//       message: 'Database connection timeout. Please try again.',
//       error: error.message 
//     });
//   }
  
//   res.status(500).json({ 
//     message: 'Database error occurred', 
//     error: error.message 
//   });
// };

// // Register new user
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, displayName } = req.body;

//     // Validate input
//     if (!email || !password || !displayName) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create new user
//     const user = new User({
//       email,
//       password,
//       displayName
//     });

//     await user.save();

//     // Generate JWT token
//     const token = generateToken(user);

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         displayName: user.displayName
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     handleMongoError(error, res);
//   }
// });

// // Login user
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     // Find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     // Check if user has a password (wasn't created through Google OAuth)
//     if (!user.password) {
//       return res.status(400).json({ 
//         message: 'This account was created with Google. Please use Google Sign-In.' 
//       });
//     }

//     // Verify password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     // Generate JWT token
//     const token = generateToken(user);

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         displayName: user.displayName
//       }
//     });
//   } catch (error) {
//     handleMongoError(error, res);
//   }
// });

// // Google OAuth routes (existing - unchanged)
// router.get('/google',
//   (req, res, next) => {
//     console.log('[Auth] Initiating Google OAuth flow');
//     passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
//   }
// );

// router.get('/google/callback',
//   (req, res, next) => {
//     console.log('[Auth] Received Google OAuth callback');
//     passport.authenticate('google', { 
//       failureRedirect: '/login',
//       session: false // Disable session since we're using JWT
//     })(req, res, next);
//   },
//   async (req, res) => {
//     try {
//       console.log('[Auth] Google OAuth successful, user:', {
//         id: req.user._id,
//         email: req.user.email,
//         displayName: req.user.displayName
//       });

//       // Generate JWT token
//       const token = generateToken(req.user);
//       console.log('[Auth] JWT token generated successfully');

//       // Redirect to frontend with token
//       const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
//       console.log('[Auth] Redirecting to:', redirectUrl);
      
//       res.redirect(redirectUrl);
//     } catch (error) {
//       console.error('[Auth] Google OAuth callback error:', error);
//       res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent('OAuth authentication failed')}`);
//     }
//   }
// );

// // NEW: Mobile Google Auth endpoint
// router.post('/mobile/google', async (req, res) => {
//   try {
//     const { token } = req.body;
    
//     console.log('[Mobile Auth] Received Google ID token verification request');
    
//     // Validate input
//     if (!token) {
//       console.log('[Mobile Auth] Missing ID token in request');
//       return res.status(400).json({ 
//         success: false,
//         message: 'Google ID token is required' 
//       });
//     }

//     // Verify the Google ID token
//     console.log('[Mobile Auth] Verifying Google ID token...');
//     const userInfo = await verifyGoogleToken(token);
    
//     // Find or create user in database
//     console.log('[Mobile Auth] Finding or creating user for:', userInfo.email);
//     const user = await findOrCreateUser(userInfo);
    
//     // Generate JWT for mobile app
//     const jwtToken = generateToken(user);
    
//     console.log('[Mobile Auth] Authentication successful for user:', {
//       id: user._id,
//       email: user.email,
//       displayName: user.displayName
//     });
    
//     res.json({
//       success: true,
//       token: jwtToken,
//       user: {
//         id: user._id,
//         email: user.email,
//         displayName: user.displayName,
//         photoUrl: user.photoUrl
//       }
//     });
//   } catch (error) {
//     console.error('[Mobile Auth] Authentication failed:', error.message);
    
//     // Handle specific error types
//     if (error.message.includes('Invalid Google token')) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid Google token provided',
//         error: 'INVALID_TOKEN'
//       });
//     }
    
//     // Handle database errors
//     if (error.name === 'MongooseError') {
//       return handleMongoError(error, res);
//     }
    
//     // Generic error response
//     res.status(500).json({ 
//       success: false,
//       message: 'Mobile authentication failed',
//       error: error.message 
//     });
//   }
// });

// // Get user profile
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user profile:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Logout route (client-side only)
// router.post('/logout', (req, res) => {
//   res.json({ message: 'Logged out successfully' });
// });

// module.exports = router;



const express = require('express');
const passport = require('passport');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateToken } = require('../config/passport');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../utils/emailService');

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

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

    // Find user by email
    const user = await User.findOne({ email });
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
    const token = generateToken(user);

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

// Google OAuth routes
router.get('/google',
  (req, res, next) => {
    console.log('[Auth] Initiating Google OAuth flow');
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('[Auth] Received Google OAuth callback');
    passport.authenticate('google', { 
      failureRedirect: '/login',
      session: false // Disable session since we're using JWT
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('[Auth] Google OAuth successful, user:', {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName
      });

      // Generate JWT token
      const token = generateToken(req.user);
      console.log('[Auth] JWT token generated successfully');

      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
      console.log('[Auth] Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[Auth] Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent('OAuth authentication failed')}`);
    }
  }
);

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route (client-side only)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Check if user has a password (wasn't created through Google OAuth)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account was created with Google. Please use Google Sign-In.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiration (1 hour from now)
    const resetTokenExpire = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    user.resetToken = resetTokenHash;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.displayName);
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (emailError) {
      // If email fails, clear the token
      user.resetToken = null;
      user.resetTokenExpire = null;
      await user.save();
      
      console.error('Email sending failed:', emailError);
      res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    handleMongoError(error, res);
  }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

    // Send confirmation email (don't block on failure)
    try {
      await sendPasswordChangedEmail(user.email, user.displayName);
    } catch (emailError) {
      console.error('Failed to send password change confirmation email:', emailError);
    }

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    handleMongoError(error, res);
  }
});

module.exports = router; 