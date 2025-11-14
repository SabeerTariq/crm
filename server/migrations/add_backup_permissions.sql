-- Add backup permissions for database backup and restore module
-- This module should only be accessible to admin users

-- Add backup permissions
INSERT INTO permissions (module, action)
SELECT 'backup', 'view'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'backup' AND action = 'view'
);

INSERT INTO permissions (module, action)
SELECT 'backup', 'create'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'backup' AND action = 'create'
);

INSERT INTO permissions (module, action)
SELECT 'backup', 'read'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'backup' AND action = 'read'
);

INSERT INTO permissions (module, action)
SELECT 'backup', 'delete'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'backup' AND action = 'delete'
);

INSERT INTO permissions (module, action)
SELECT 'backup', 'restore'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'backup' AND action = 'restore'
);

-- Assign all backup permissions to admin role (role_id = 1) only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p
WHERE p.module = 'backup' AND p.action IN ('view', 'create', 'read', 'delete', 'restore')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 1 AND rp.permission_id = p.id
);

