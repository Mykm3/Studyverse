const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header and attaches the user to the request
 */
const auth = async (req, res, next) => {
  try {
    // Log incoming request headers
    console.log('[Auth Middleware] Request headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      method: req.method,
      path: req.path
    });

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth Middleware] No valid Authorization header found');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth Middleware] Token extracted:', token ? 'Present' : 'Missing');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Middleware] Token decoded successfully:', {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName
    });
    
    // Attach user info from decoded token to request
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName
    };

    // Log the final user object attached to request
    console.log('[Auth Middleware] User attached to request:', {
      hasUser: Boolean(req.user),
      userId: req.user._id,
      email: req.user.email
    });
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Authentication failed' });
  }
};

module.exports = auth; 