-- Add permissions for chargeback_refunds module
INSERT INTO permissions (module, action) VALUES
('chargeback_refunds', 'create'),
('chargeback_refunds', 'read'),
('chargeback_refunds', 'update'),
('chargeback_refunds', 'delete'),
('chargeback_refunds', 'view')
ON DUPLICATE KEY UPDATE module = module;

-- Assign chargeback_refunds permissions to admin role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.module = 'chargeback_refunds'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign chargeback_refunds permissions to upseller role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'upseller' 
AND p.module = 'chargeback_refunds'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign chargeback_refunds permissions to upseller manager role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'upseller manager' 
AND p.module = 'chargeback_refunds'
ON DUPLICATE KEY UPDATE role_id = role_id;
