const express = require('express');
const router = express.Router();
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
require('dotenv').config();


const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const backupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, backupsDir);
  },
  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const uniqueName = `${originalName}_uploaded_${timestamp}${ext}`;
    cb(null, uniqueName);
  }
});

const uploadBackup = multer({
  storage: backupStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for backup files
  },
  fileFilter: (req, file, cb) => {
    // Only allow .sql files
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Only .sql backup files are allowed'), false);
    }
  }
});

router.get('/list', auth, isAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({ backups: files });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ message: 'Error listing backups', error: error.message });
  }
});

router.post('/upload', auth, isAdmin, (req, res) => {
  uploadBackup.single('backupFile')(req, res, (err) => {
    // Handle multer errors
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 100MB.' });
        }
        return res.status(400).json({ message: 'Upload error: ' + err.message });
      }
      // Handle file filter errors
      if (err.message.includes('Only .sql')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Upload error: ' + err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No backup file uploaded' });
    }

    try {
      const stats = fs.statSync(req.file.path);
      if (stats.size === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Uploaded file is empty' });
      }

      res.json({
        message: 'Backup file uploaded successfully',
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: stats.size,
        path: req.file.path
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Error processing uploaded file', error: error.message });
    }
  });
});

router.post('/create', auth, isAdmin, (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `crm_db_backup_${timestamp}.sql`;
  const filepath = path.join(backupsDir, filename);

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'crm_db';

  let mysqldumpCmd = `mysqldump -u ${dbUser}`;
  if (dbPassword) {
    mysqldumpCmd += ` -p${dbPassword}`;
  }
  mysqldumpCmd += ` -h ${dbHost} ${dbName} > "${filepath}"`;

  exec(mysqldumpCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ 
        message: 'Error creating backup', 
        error: error.message,
        stderr: stderr 
      });
    }

    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > 0) {
        res.json({ 
          message: 'Backup created successfully',
          filename: filename,
          size: stats.size,
          path: filepath
        });
      } else {
        fs.unlinkSync(filepath);
        res.status(500).json({ message: 'Backup file is empty' });
      }
    } else {
      res.status(500).json({ message: 'Backup file was not created' });
    }
  });
});

router.get('/download/:filename', auth, isAdmin, (req, res) => {
  const filename = req.params.filename;
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const filepath = path.join(backupsDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Backup file not found' });
  }

  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading backup file' });
      }
    }
  });
});

router.delete('/delete/:filename', auth, isAdmin, (req, res) => {
  const filename = req.params.filename;
  
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const filepath = path.join(backupsDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Backup file not found' });
  }

  try {
    fs.unlinkSync(filepath);
    res.json({ message: 'Backup file deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting backup file', error: error.message });
  }
});

router.post('/restore', auth, isAdmin, (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const filepath = path.join(backupsDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Backup file not found' });
  }

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'crm_db';

  let mysqlCmd = `mysql -u ${dbUser}`;
  if (dbPassword) {
    mysqlCmd += ` -p${dbPassword}`;
  }
  mysqlCmd += ` -h ${dbHost} ${dbName} < "${filepath}"`;

  exec(mysqlCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Restore error:', error);
      return res.status(500).json({ 
        message: 'Error restoring backup', 
        error: error.message,
        stderr: stderr 
      });
    }

    res.json({ message: 'Database restored successfully' });
  });
});

router.get('/export', (req, res) => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'crm_db';

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `crm_db_export_${timestamp}.sql`;

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const mysqldumpArgs = ['-u', dbUser];
  if (dbPassword) {
    mysqldumpArgs.push(`-p${dbPassword}`);
  }
  mysqldumpArgs.push('-h', dbHost, dbName);

  const mysqldump = spawn('mysqldump', mysqldumpArgs);

  mysqldump.on('error', (error) => {
    console.error('mysqldump spawn error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error starting database export', 
        error: error.message 
      });
    }
  });

  let errorOutput = '';
  mysqldump.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.warn('mysqldump warning:', data.toString());
  });

  mysqldump.stdout.on('data', (chunk) => {
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
    }
    res.write(chunk);
  });

  mysqldump.on('close', (code) => {
    if (code !== 0) {
      console.error('mysqldump exited with code:', code);
      console.error('Error output:', errorOutput);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error exporting database', 
          error: errorOutput || 'mysqldump process failed',
          exitCode: code
        });
      } else {
        res.end();
      }
    } else {
      res.end();
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    if (!mysqldump.killed) {
      mysqldump.kill();
    }
  });
});

module.exports = router;

