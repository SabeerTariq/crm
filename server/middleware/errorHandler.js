// Enhanced error handling middleware for VPS debugging
const errorHandler = (err, req, res, next) => {
  console.error('=== ERROR DETAILS ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('URL:', req.url);
  console.error('Headers:', req.headers);
  console.error('Body:', req.body);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('========================');
  
  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      message: 'Database connection refused',
      error: 'ECONNREFUSED',
      details: 'Check if MySQL server is running and accessible'
    });
  }
  
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({
      message: 'Database access denied',
      error: 'ER_ACCESS_DENIED_ERROR',
      details: 'Check database credentials in .env file'
    });
  }
  
  if (err.code === 'ER_BAD_DB_ERROR') {
    return res.status(500).json({
      message: 'Database does not exist',
      error: 'ER_BAD_DB_ERROR',
      details: 'Check DB_NAME in .env file'
    });
  }
  
  // File system errors
  if (err.code === 'EACCES') {
    return res.status(500).json({
      message: 'Permission denied',
      error: 'EACCES',
      details: 'Check file permissions for uploads directory'
    });
  }
  
  if (err.code === 'ENOENT') {
    return res.status(500).json({
      message: 'File or directory not found',
      error: 'ENOENT',
      details: 'Check if required directories exist'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: 'JsonWebTokenError'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'TokenExpiredError'
    });
  }
  
  // Generic error
  res.status(500).json({
    message: 'Internal server error',
    error: err.message || 'Unknown error',
    code: err.code || 'UNKNOWN'
  });
};

module.exports = errorHandler;
