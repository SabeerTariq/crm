-- Add schedule-list permissions
INSERT INTO permissions (module, action)
SELECT 'schedule-list', 'read'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'schedule-list' AND action = 'read'
);

INSERT INTO permissions (module, action)
SELECT 'schedule-list', 'view'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'schedule-list' AND action = 'view'
);

-- Assign schedule-list permissions to admin role (role_id = 1) by default
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = 1
WHERE p.module = 'schedule-list' AND rp.permission_id IS NULL;








