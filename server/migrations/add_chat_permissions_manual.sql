-- Manual SQL script to add chat permissions
-- Run this in your MySQL client if the migration hasn't been run yet

-- Add chat permissions
INSERT INTO permissions (module, action)
SELECT 'chat', 'read'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'chat' AND action = 'read'
);

INSERT INTO permissions (module, action)
SELECT 'chat', 'create'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'chat' AND action = 'create'
);

INSERT INTO permissions (module, action)
SELECT 'chat', 'update'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'chat' AND action = 'update'
);

INSERT INTO permissions (module, action)
SELECT 'chat', 'delete'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'chat' AND action = 'delete'
);

INSERT INTO permissions (module, action)
SELECT 'chat', 'view'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'chat' AND action = 'view'
);

-- Assign chat permissions to all roles (everyone can use chat)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.module = 'chat' AND p.action IN ('read', 'create', 'update', 'view')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign delete permission only to admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p
WHERE p.module = 'chat' AND p.action = 'delete'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Verify the permissions were added
SELECT * FROM permissions WHERE module = 'chat';

