import { useEffect, useState } from 'react';
import api from '../services/api';
import PageLayout from '../components/PageLayout';
import './Backup.css';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/backup/list', { headers: tokenHeader() });
      setBackups(res.data.backups || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load backups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setMessage({ type: 'error', text: 'Only .sql backup files are allowed' });
        e.target.value = ''; // Clear the input
        return;
      }
      setSelectedFile(file);
      setMessage({ type: '', text: '' });
    }
  };

  const uploadBackup = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a backup file to upload' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const formData = new FormData();
      formData.append('backupFile', selectedFile);

      const res = await api.post('/backup/upload', formData, {
        headers: {
          ...tokenHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({ type: 'success', text: res.data.message || 'Backup file uploaded successfully' });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('backup-file-input');
      if (fileInput) fileInput.value = '';
      await loadBackups();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload backup file' });
    } finally {
      setUploading(false);
    }
  };

  const createBackup = async () => {
    if (!window.confirm('Are you sure you want to create a new backup? This may take a few moments.')) {
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/backup/create', {}, { headers: tokenHeader() });
      setMessage({ type: 'success', text: res.data.message || 'Backup created successfully' });
      await loadBackups();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create backup' });
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (filename) => {
    try {
      const res = await api.get(`/backup/download/${filename}`, {
        headers: tokenHeader(),
        responseType: 'blob'
      });
      
      // Create a blob and download it
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup downloaded successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to download backup' });
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/backup/delete/${filename}`, { headers: tokenHeader() });
      setMessage({ type: 'success', text: 'Backup deleted successfully' });
      await loadBackups();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete backup' });
    }
  };

  const restoreBackup = async (filename) => {
    if (!window.confirm(
      `WARNING: Restoring "${filename}" will replace ALL current database data with the backup data. ` +
      `This action cannot be undone. Are you absolutely sure you want to proceed?`
    )) {
      return;
    }

    if (!window.confirm('This is your final warning. All current data will be lost. Continue?')) {
      return;
    }

    setRestoring(filename);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/backup/restore', { filename }, { headers: tokenHeader() });
      setMessage({ type: 'success', text: res.data.message || 'Database restored successfully. Please refresh the page.' });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to restore backup' });
      setRestoring(null);
    }
  };

  return (
    <PageLayout>
      <div className="backup-container">
        <div className="backup-header">
          <h1>Database Backup & Restore</h1>
          <p className="backup-description">
            Create backups of your database and restore them when needed. 
            Backups are stored on the server and can be downloaded.
          </p>
        </div>

        {message.text && (
          <div className={`backup-message ${message.type}`}>
            {message.text}
            <button className="close-message" onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className="backup-actions">
          <div className="backup-action-group">
            <button 
              className="btn-create-backup" 
              onClick={createBackup}
              disabled={creating}
            >
              {creating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Backup...
                </>
              ) : (
                <>
                  <i className="fas fa-database"></i> Create New Backup
                </>
              )}
            </button>
          </div>

          <div className="backup-upload-section">
            <h3>Upload Backup File</h3>
            <div className="upload-controls">
              <label htmlFor="backup-file-input" className="file-input-label">
                <i className="fas fa-upload"></i>
                {selectedFile ? selectedFile.name : 'Choose .sql file'}
              </label>
              <input
                id="backup-file-input"
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {selectedFile && (
                <div className="selected-file-info">
                  <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                  <button 
                    className="btn-remove-file"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('backup-file-input');
                      if (fileInput) fileInput.value = '';
                    }}
                    title="Remove file"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
              <button
                className="btn-upload-backup"
                onClick={uploadBackup}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt"></i> Upload Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="backups-list">
          <h2>Available Backups</h2>
          {loading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i> Loading backups...
            </div>
          ) : backups.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-database"></i>
              <p>No backups found. Create your first backup to get started.</p>
            </div>
          ) : (
            <div className="backups-table">
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup, index) => (
                    <tr key={index}>
                      <td className="filename-cell">
                        <i className="fas fa-file-archive"></i>
                        {backup.filename}
                      </td>
                      <td>{formatFileSize(backup.size)}</td>
                      <td>{formatDate(backup.created)}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-download"
                          onClick={() => downloadBackup(backup.filename)}
                          title="Download backup"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                        <button
                          className="btn-restore"
                          onClick={() => restoreBackup(backup.filename)}
                          disabled={restoring === backup.filename}
                          title="Restore database from this backup"
                        >
                          {restoring === backup.filename ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-undo"></i>
                          )}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => deleteBackup(backup.filename)}
                          title="Delete backup"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="backup-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Important:</strong>
            <ul>
              <li>Backups contain all database data including users, projects, tasks, and all other information.</li>
              <li>Restoring a backup will completely replace the current database with the backup data.</li>
              <li>Always create a backup before restoring to avoid data loss.</li>
              <li>You can upload .sql backup files from your computer to restore them.</li>
              <li>Backups are stored on the server. Download important backups for safekeeping.</li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

