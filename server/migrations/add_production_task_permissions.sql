-- Add task permissions for all production department leads and members
-- This gives them access to view and manage tasks in their dashboards

-- Assign task permissions to developer-lead (role_id: 11)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 11, p.id
FROM permissions p
WHERE p.module = 'tasks'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 11 AND rp.permission_id = p.id
);

-- Assign task permissions to developer-member (role_id: 12)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 12, p.id
FROM permissions p
WHERE p.module = 'tasks' AND p.action IN ('read', 'view', 'update')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 12 AND rp.permission_id = p.id
);

-- Assign task permissions to seo-lead (role_id: 13)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 13, p.id
FROM permissions p
WHERE p.module = 'tasks'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 13 AND rp.permission_id = p.id
);

-- Assign task permissions to seo-member (role_id: 14)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 14, p.id
FROM permissions p
WHERE p.module = 'tasks' AND p.action IN ('read', 'view', 'update')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 14 AND rp.permission_id = p.id
);

-- Assign task permissions to content-lead (role_id: 15)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 15, p.id
FROM permissions p
WHERE p.module = 'tasks'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 15 AND rp.permission_id = p.id
);

-- Assign task permissions to content-member (role_id: 16)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 16, p.id
FROM permissions p
WHERE p.module = 'tasks' AND p.action IN ('read', 'view', 'update')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 16 AND rp.permission_id = p.id
);

-- Assign task permissions to qa-lead (role_id: 17)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 17, p.id
FROM permissions p
WHERE p.module = 'tasks'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 17 AND rp.permission_id = p.id
);

-- Assign task permissions to qa-member (role_id: 18)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 18, p.id
FROM permissions p
WHERE p.module = 'tasks' AND p.action IN ('read', 'view', 'update')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 18 AND rp.permission_id = p.id
);

-- Add task_members permissions to all department leads (for assignment)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.id IN (11, 13, 15, 17) -- developer-lead, seo-lead, content-lead, qa-lead
AND p.module = 'task_members'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Add task_checklists permissions to all department leads
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.id IN (11, 13, 15, 17)
AND p.module = 'task_checklists'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Add task_activity permissions to all department leads and members
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.id IN (11, 12, 13, 14, 15, 16, 17, 18)
AND p.module = 'task_activity'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Production role (role_id: 7) - give it task read/update permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, p.id
FROM permissions p
WHERE p.module = 'tasks' AND p.action IN ('read', 'view', 'update', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = 7 AND rp.permission_id = p.id
);

