# VPS Setup Guide for CRM Application

## Common 500 Error Causes and Solutions

### 1. Database Connection Issues

**Problem**: Database connection refused or access denied
**Solution**: 
```bash
# Check if MySQL is running
sudo systemctl status mysql
sudo systemctl start mysql

# Check MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Ensure bind-address is set correctly
bind-address = 0.0.0.0  # or your VPS IP

# Restart MySQL
sudo systemctl restart mysql
```

**Environment Variables Check**:
```bash
# Create/update .env file
nano server/.env

# Ensure these are set correctly:
DB_HOST=localhost  # or your VPS IP
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_db
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 2. File Permissions Issues

**Problem**: Cannot write to uploads directory
**Solution**:
```bash
# Create uploads directory
mkdir -p server/uploads/projects
mkdir -p server/uploads/sales

# Set proper permissions
chmod -R 755 server/uploads/
chown -R www-data:www-data server/uploads/  # if using nginx/apache
```

### 3. Missing Dependencies

**Problem**: Module not found errors
**Solution**:
```bash
# Install dependencies
cd server
npm install

# Check if all packages are installed
npm list --depth=0
```

### 4. Process Management

**Problem**: Server crashes or doesn't restart
**Solution**:
```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start server/index.js --name "crm-api"

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor logs
pm2 logs crm-api
```

### 5. Firewall Configuration

**Problem**: Cannot access API endpoints
**Solution**:
```bash
# Open port 5000
sudo ufw allow 5000
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 6. Database Setup

**Problem**: Database or tables don't exist
**Solution**:
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE crm_db;

# Import database schema
mysql -u root -p crm_db < crm_db.sql

# Run migrations
cd server
node run_migration.js
```

### 7. Environment-Specific Issues

**Problem**: Different behavior between local and VPS
**Solution**:
```bash
# Set NODE_ENV
export NODE_ENV=production

# Add to .env file
echo "NODE_ENV=production" >> server/.env
```

## Diagnostic Commands

### Run Diagnostic Script
```bash
cd server
node vps-diagnostic.js
```

### Check Server Logs
```bash
# If using PM2
pm2 logs crm-api

# If using systemd
sudo journalctl -u your-service-name -f

# If running directly
node server/index.js
```

### Test Database Connection
```bash
mysql -h localhost -u root -p crm_db -e "SELECT 1;"
```

### Test API Endpoints
```bash
# Test basic connectivity
curl http://localhost:5000/api/auth/test

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/projects
```

## Quick Fix Checklist

- [ ] MySQL server is running
- [ ] Database credentials are correct in .env
- [ ] Uploads directory exists and is writable
- [ ] All npm dependencies are installed
- [ ] Port 5000 is open in firewall
- [ ] Process manager (PM2) is configured
- [ ] Environment variables are set
- [ ] Database schema is imported
- [ ] Server logs are being monitored

## Common Error Codes

- **ECONNREFUSED**: Database connection refused
- **ER_ACCESS_DENIED_ERROR**: Wrong database credentials
- **ER_BAD_DB_ERROR**: Database doesn't exist
- **EACCES**: Permission denied
- **ENOENT**: File/directory not found
- **JsonWebTokenError**: Invalid JWT token
- **TokenExpiredError**: JWT token expired
