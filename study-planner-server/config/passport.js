const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Debug logging
console.log('Passport configuration:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('SERVER_URL:', process.env.SERVER_URL || 'http://localhost:5000');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Missing required Google OAuth credentials');
  process.exit(1);
}

// Helper function to handle database operations with retry
const withRetry = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry attempt ${i + 1} of ${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      displayName: user.displayName
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('[Passport] Google profile received:', {
        id: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName
      });

      // Validate profile data
      if (!profile || !profile.id || !profile.emails || !profile.emails[0]) {
        console.error('[Passport] Invalid profile data received from Google');
        return done(new Error('Invalid profile data received from Google'));
      }

      // Find or create user with retry logic
      let user;
      try {
        console.log('[Passport] Searching for existing user with Google ID:', profile.id);
        user = await User.findOne({ googleId: profile.id }).maxTimeMS(5000);
        
        if (user) {
          console.log('[Passport] Existing user found:', {
            id: user._id,
            email: user.email,
            displayName: user.displayName
          });
          return done(null, user);
        }
      } catch (error) {
        console.error('[Passport] Error finding user:', error);
      }

      try {
        console.log('[Passport] Creating new user with Google profile');
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          photoUrl: profile.photos ? profile.photos[0].value : null
        });
        
        console.log('[Passport] New user created successfully:', {
          id: user._id,
          email: user.email,
          displayName: user.displayName
        });
        
        return done(null, user);
      } catch (error) {
        console.error('[Passport] Error creating user:', error);
        return done(error);
      }
    } catch (error) {
      console.error('[Passport] Error in Google strategy:', error);
      return done(error);
    }
  }
));

// Export the generateToken function for use in auth routes
module.exports = {
  passport,
  generateToken
}; 