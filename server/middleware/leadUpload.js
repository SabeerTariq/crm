const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/leads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'leads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use lead-specific directory if leadId is available
    const leadId = req.params.id || req.body.lead_id;
    if (leadId) {
      const leadUploadPath = path.join(uploadsDir, leadId.toString());
      if (!fs.existsSync(leadUploadPath)) {
        fs.mkdirSync(leadUploadPath, { recursive: true });
      }
      cb(null, leadUploadPath);
    } else {
      // Temporary directory for new leads
      cb(null, uploadsDir);
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

// File filter to allow common document and media types
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
    'image/webp',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'video/mpeg',
    'audio/mpeg',
    'audio/wav'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, Images, TXT, ZIP, RAR, MP4, MPEG, MP3, WAV'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('document');

// Middleware for multiple file upload
const uploadMultiple = upload.array('documents', 10);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum 10 files allowed.' });
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

