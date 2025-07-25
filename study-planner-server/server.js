require('dotenv').config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { passport } = require("./config/passport");
const authRoutes = require("./routes/auth");
const studySessionRoutes = require('./routes/studySessions');
const notesRoutes = require('./routes/notes');
const diagnosticsRoutes = require('./routes/diagnostics');
const groqRoutes = require('./routes/groq');

// Debug logging
console.log('Server configuration:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173');
console.log('SERVER_URL:', process.env.SERVER_URL || 'http://localhost:5000');

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000, // 60 seconds
  socketTimeoutMS: 90000, // 90 seconds
  connectTimeoutMS: 60000, // 60 seconds
  family: 4,
  maxPoolSize: 10,
  minPoolSize: 5,
  heartbeatFrequencyMS: 5000, // Check connection every 5 seconds
  retryWrites: true,
  w: 'majority',
  autoIndex: true,
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
  waitQueueTimeoutMS: 60000 // Wait queue timeout
};

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Attempting to connect to MongoDB...');
      const maskedUri = process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@');
      console.log('Connection string:', maskedUri);
      
      await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
      console.log('Successfully connected to MongoDB');
      return;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      
      if (error.name === 'MongoServerError' && error.message.includes('bad auth')) {
        console.error('Authentication failed. Please check your MongoDB credentials.');
        process.exit(1);
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
  // Don't exit on error, let the reconnection logic handle it
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  // Add a small delay before attempting to reconnect
  setTimeout(connectWithRetry, 1000);
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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit, let the application continue running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, let the application continue running
});

// Initial connection
connectWithRetry();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));
console.log('Serving static files from /uploads directory');

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

console.log('Mounting notes routes at /api/notes');
app.use('/api/notes', notesRoutes);

console.log('Mounting diagnostics routes at /api/diagnostics');
app.use('/api/diagnostics', diagnosticsRoutes);

console.log('Mounting groq routes at /api/groq');
app.use('/api/groq', groqRoutes);

// Protected route example
app.get("/api/protected", (req, res) => {
  res.send("This is a protected route");
});

// Add authentication debugging middleware AFTER routes
app.use((req, res, next) => {
  console.log('Authentication status:', {
    hasUser: Boolean(req.user),
    userId: req.user?._id,
    authHeader: req.headers.authorization ? 'Present' : 'Not present'
  });
  next();
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
