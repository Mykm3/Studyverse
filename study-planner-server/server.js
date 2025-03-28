require('dotenv').config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const studySessionRoutes = require('./routes/studySessions');

// Debug logging
console.log('Server configuration:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173');
console.log('SERVER_URL:', process.env.SERVER_URL || 'http://localhost:5000');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'study_planner_session_secret_2024',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'study_planner_session'
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Add session debugging middleware
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  next();
});

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000, // Increase timeout to 60 seconds
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  family: 4,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 1,
  heartbeatFrequencyMS: 10000
};

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Attempting to connect to MongoDB...');
      // Log connection string without password
      const maskedUri = process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@');
      console.log('Connection string:', maskedUri);
      
      // Try connecting with options
      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
      console.log('Successfully connected to MongoDB');
      return;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      console.error('Error details:', error);
      
      // Handle specific error types
      if (error.name === 'MongoServerError' && error.message.includes('bad auth')) {
        console.error('Authentication failed. Please check your MongoDB credentials.');
        console.error('Make sure your IP address is whitelisted in MongoDB Atlas.');
        process.exit(1);
      }
      
      if (error.name === 'MongoNetworkError') {
        console.error('Network error. Please check your internet connection and MongoDB Atlas IP whitelist.');
      }
      
      retries--;
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after 5 attempts');
        process.exit(1);
      }
      console.log(`Retrying connection in 5 seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Initial connection
connectWithRetry();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Planner API is running' });
});

// Debug logging for route mounting
console.log('Mounting routes...');
console.log('Mounting auth routes at /api/auth');
app.use('/api/auth', authRoutes);

console.log('Mounting study sessions routes at /api/study-sessions');
app.use('/api/study-sessions', studySessionRoutes);

// Protected route example
app.get("/api/protected", (req, res) => {
  res.send("This is a protected route");
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.url
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle MongoDB timeout errors specifically
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    return res.status(503).json({ 
      message: 'Database connection timeout. Please try again.',
      error: err.message,
      retry: true
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({ 
      message: 'Database connection error. Please try again.',
      error: err.message,
      retry: true
    });
  }

  // Handle authentication errors
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      message: 'Authentication failed',
      error: err.message
    });
  }

  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
