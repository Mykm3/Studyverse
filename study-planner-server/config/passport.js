const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    proxy: true
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('Google profile received:', {
        id: profile.id,
        email: profile.emails[0].value,
        displayName: profile.displayName
      });

      // Validate profile data
      if (!profile || !profile.id || !profile.emails || !profile.emails[0]) {
        console.error('Invalid profile data received from Google');
        return done(new Error('Invalid profile data received from Google'));
      }

      // Find or create user with retry logic
      let user;
      try {
        user = await User.findOne({ googleId: profile.id }).maxTimeMS(5000);
        if (user) {
          console.log('Existing user found:', user.email);
          return done(null, user);
        }
      } catch (error) {
        console.error('Error finding user:', error);
      }

      try {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          photoUrl: profile.photos ? profile.photos[0].value : null
        });
        console.log('New user created:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('Error creating user:', error);
        return done(error);
      }
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  try {
    done(null, user.id);
  } catch (error) {
    console.error('Error in serializeUser:', error);
    done(error);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await withRetry(async () => {
      const foundUser = await User.findById(id);
      if (!foundUser) {
        console.error('User not found during deserialization');
        return false;
      }
      return foundUser;
    });
    
    done(null, user);
  } catch (error) {
    console.error('Error in deserializeUser:', error);
    done(error);
  }
});

module.exports = passport; 