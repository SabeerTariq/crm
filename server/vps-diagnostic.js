const mysql = require('mysql2');
require('dotenv').config();

console.log('=== VPS Diagnostic Script ===\n');

// 1. Check Environment Variables
console.log('1. Environment Variables:');
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('');

// 2. Test Database Connection
console.log('2. Database Connection Test:');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
    console.error('Error sqlState:', err.sqlState);
  } else {
    console.log('✅ Database connection successful');
    
    // Test a simple query
    connection.query('SELECT 1 as test', (queryErr, results) => {
      if (queryErr) {
        console.error('❌ Database query failed:', queryErr.message);
      } else {
        console.log('✅ Database query successful:', results);
      }
      connection.release();
      
      // 3. Test specific tables
      console.log('\n3. Testing Critical Tables:');
      testTables();
    });
  }
});

function testTables() {
  const criticalTables = [
    'users',
    'customers', 
    'projects',
    'departments',
    'department_team_members',
    'boards',
    'project_tasks',
    'task_statuses'
  ];
  
  let completedTests = 0;
  
  criticalTables.forEach(table => {
    pool.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
      completedTests++;
      
      if (err) {
        console.error(`❌ Table ${table}:`, err.message);
      } else {
        console.log(`✅ Table ${table}: ${results[0].count} records`);
      }
      
      if (completedTests === criticalTables.length) {
        console.log('\n4. File System Check:');
        testFileSystem();
      }
    });
  });
}

function testFileSystem() {
  const fs = require('fs');
  const path = require('path');
  
  // Check if uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('✅ Uploads directory exists');
    
    // Check permissions
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      console.log('✅ Uploads directory is writable');
    } catch (err) {
      console.error('❌ Uploads directory is not writable:', err.message);
    }
  } else {
    console.log('❌ Uploads directory does not exist');
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    } catch (err) {
      console.error('❌ Failed to create uploads directory:', err.message);
    }
  }
  
  // Check .env file
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
  } else {
    console.log('❌ .env file does not exist');
  }
  
  console.log('\n5. Dependencies Check:');
  testDependencies();
}

function testDependencies() {
  const requiredPackages = [
    'express',
    'mysql2',
    'cors',
    'dotenv',
    'jsonwebtoken',
    'bcryptjs',
    'multer'
  ];
  
  requiredPackages.forEach(pkg => {
    try {
      require(pkg);
      console.log(`✅ ${pkg} is installed`);
    } catch (err) {
      console.error(`❌ ${pkg} is missing:`, err.message);
    }
  });
  
  console.log('\n=== Diagnostic Complete ===');
  console.log('\nCommon VPS Issues and Solutions:');
  console.log('1. Database connection: Check DB_HOST, DB_USER, DB_PASSWORD');
  console.log('2. File permissions: Run "chmod -R 755 uploads/" if needed');
  console.log('3. Missing dependencies: Run "npm install"');
  console.log('4. Environment variables: Ensure .env file is properly configured');
  console.log('5. Firewall: Ensure port 5000 is open');
  console.log('6. Process manager: Use PM2 or similar for production');
  
  process.exit(0);
}
