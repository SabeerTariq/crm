// Script to add chat permissions to the database
// Run this with: node server/add_chat_permissions.js

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addChatPermissions() {
  const connection = await pool.promise().getConnection();
  
  try {
    console.log('Adding chat permissions...');
    
    // Add chat permissions
    const permissions = [
      { module: 'chat', action: 'read' },
      { module: 'chat', action: 'create' },
      { module: 'chat', action: 'update' },
      { module: 'chat', action: 'delete' },
      { module: 'chat', action: 'view' }
    ];
    
    for (const perm of permissions) {
      const [existing] = await connection.execute(
        'SELECT id FROM permissions WHERE module = ? AND action = ?',
        [perm.module, perm.action]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO permissions (module, action) VALUES (?, ?)',
          [perm.module, perm.action]
        );
        console.log(`✓ Added permission: ${perm.module}:${perm.action}`);
      } else {
        console.log(`- Permission already exists: ${perm.module}:${perm.action}`);
      }
    }
    
    // Get all role IDs
    const [roles] = await connection.execute('SELECT id FROM roles');
    
    // Get chat permission IDs (excluding delete)
    const [chatPerms] = await connection.execute(
      'SELECT id FROM permissions WHERE module = ? AND action != ?',
      ['chat', 'delete']
    );
    
    // Assign chat permissions to all roles (except delete)
    for (const role of roles) {
      for (const perm of chatPerms) {
        const [existing] = await connection.execute(
          'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [role.id, perm.id]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [role.id, perm.id]
          );
          console.log(`✓ Assigned permission ${perm.id} to role ${role.id}`);
        }
      }
    }
    
    // Assign delete permission only to admin (role_id = 1)
    const [deletePerm] = await connection.execute(
      'SELECT id FROM permissions WHERE module = ? AND action = ?',
      ['chat', 'delete']
    );
    
    if (deletePerm.length > 0) {
      const [existing] = await connection.execute(
        'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [1, deletePerm[0].id]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [1, deletePerm[0].id]
        );
        console.log(`✓ Assigned delete permission to admin role`);
      }
    }
    
    console.log('\n✅ Chat permissions added successfully!');
    console.log('\nSummary:');
    console.log('- All roles now have: chat:read, chat:create, chat:update, chat:view');
    console.log('- Only admin role has: chat:delete');
    
  } catch (error) {
    console.error('Error adding chat permissions:', error);
    process.exit(1);
  } finally {
    connection.release();
    pool.end();
  }
}

addChatPermissions();

