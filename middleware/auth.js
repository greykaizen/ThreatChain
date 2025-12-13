const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'threadchain-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
}

// Optional authentication - doesn't fail if no token
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid but we don't fail, just continue without user
      req.user = null;
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
