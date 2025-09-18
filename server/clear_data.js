const db = require('./db');

// Tables to preserve (keep their data)
const preserveTables = [
  'users',
  'roles', 
  'role_permissions',
  'permissions',
  'targets',
  'team_members',
  'teams'
];

// Get all tables in the database
async function getAllTables() {
  return new Promise((resolve, reject) => {
    db.query('SHOW TABLES', (err, results) => {
      if (err) {
        reject(err);
      } else {
        const tables = results.map(row => Object.values(row)[0]);
        resolve(tables);
      }
    });
  });
}

// Clear data from a table
async function clearTable(tableName) {
  return new Promise((resolve, reject) => {
    console.log(`Clearing data from table: ${tableName}`);
    db.query(`DELETE FROM ${tableName}`, (err, result) => {
      if (err) {
        console.error(`Error clearing table ${tableName}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Cleared ${result.affectedRows} rows from ${tableName}`);
        resolve(result);
      }
    });
  });
}

// Main function
async function clearDatabaseData() {
  try {
    console.log('🗑️  Starting database cleanup...\n');
    
    // Get all tables
    const allTables = await getAllTables();
    console.log(`Found ${allTables.length} tables in database\n`);
    
    // Filter out tables to preserve
    const tablesToClear = allTables.filter(table => !preserveTables.includes(table));
    
    console.log('Tables to preserve:', preserveTables.join(', '));
    console.log('Tables to clear:', tablesToClear.join(', '));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Clear each table
    for (const table of tablesToClear) {
      try {
        await clearTable(table);
      } catch (error) {
        console.error(`❌ Failed to clear table ${table}:`, error.message);
        // Continue with other tables even if one fails
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database cleanup completed!');
    console.log(`Cleared data from ${tablesToClear.length} tables`);
    console.log(`Preserved data in ${preserveTables.length} system tables`);
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    // Close database connection
    db.end((err) => {
      if (err) {
        console.error('Error closing database connection:', err);
      } else {
        console.log('\n🔌 Database connection closed');
        process.exit(0);
      }
    });
  }
}

// Run the script
console.log('🚀 Database Data Cleanup Script');
console.log('This will clear all data except system tables\n');

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to clear all data? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    clearDatabaseData();
  } else {
    console.log('❌ Operation cancelled');
    rl.close();
    process.exit(0);
  }
});
