const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token', 
        code: 'INVALID_TOKEN' 
      });
    } else {
      return res.status(401).json({ 
        message: 'Token verification failed', 
        code: 'TOKEN_ERROR' 
      });
    }
  }
}

module.exports = auth;
