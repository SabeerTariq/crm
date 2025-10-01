const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for unified project attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For task attachments, use the projectId set by the route handler
    const isTaskAttachment = req.route.path.includes('/tasks/');
    
    if (isTaskAttachment) {
      // For task attachments, use the projectId from the request
      const projectId = req.projectId || req.params.id;
      const projectUploadPath = path.join(uploadsDir, 'projects', projectId);
      
      // Create project-specific directory if it doesn't exist
      if (!fs.existsSync(projectUploadPath)) {
        fs.mkdirSync(projectUploadPath, { recursive: true });
      }
      
      cb(null, projectUploadPath);
    } else {
      const projectId = req.params.id;
      const projectUploadPath = path.join(uploadsDir, 'projects', projectId);
      
      // Create project-specific directory if it doesn't exist
      if (!fs.existsSync(projectUploadPath)) {
        fs.mkdirSync(projectUploadPath, { recursive: true });
      }
      
      cb(null, projectUploadPath);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExtension);
    const uniqueFileName = `${fileName}-${uniqueSuffix}${fileExtension}`;
    
    cb(null, uniqueFileName);
  }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF, TXT, ZIP, RAR files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware for multiple file upload
const uploadMultiple = upload.array('files', 5);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum 5 files allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected field name.' });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError
};
