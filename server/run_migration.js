const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crm_db',
});

async function runMigration() {
  try {
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('./migrations/create_lead_stats_tables.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          db.query(statement, (err, result) => {
            if (err) {
              console.error('❌ Error executing statement:', err.message);
              console.error('Statement:', statement);
              reject(err);
            } else {
              console.log('✅ Executed statement successfully');
              resolve(result);
            }
          });
        });
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    db.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    db.end();
  }
}

runMigration();
