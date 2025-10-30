-- Production Dashboard Module Migration
-- This migration creates production roles and performance tracking

-- 1. Create production roles
INSERT INTO roles (name, description) VALUES
('production-head', 'Production head - manages all departments'),
('designer-lead', 'Design department leader'),
('designer-member', 'Design team member'),
('developer-lead', 'Development department leader'),
('developer-member', 'Development team member'),
('seo-lead', 'SEO department leader'),
('seo-member', 'SEO team member'),
('content-lead', 'Content department leader'),
('content-member', 'Content team member'),
('qa-lead', 'QA department leader'),
('qa-member', 'QA team member')
ON DUPLICATE KEY UPDATE name = name;

-- 2. Update department_team_members to add production_role_id
ALTER TABLE department_team_members 
ADD COLUMN production_role_id INT DEFAULT NULL,
ADD CONSTRAINT fk_production_role 
FOREIGN KEY (production_role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- 3. Create production_performance table
CREATE TABLE IF NOT EXISTS production_performance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  department_id INT NOT NULL,
  project_id INT DEFAULT NULL,
  task_id INT DEFAULT NULL,
  date_tracked DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_assigned INT DEFAULT 0,
  hours_logged DECIMAL(5,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE SET NULL,
  INDEX idx_user_dept (user_id, department_id),
  INDEX idx_date (date_tracked),
  INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Add permissions for production module
INSERT INTO permissions (module, action) VALUES
('production', 'create'),
('production', 'read'),
('production', 'update'),
('production', 'delete'),
('production', 'manage')
ON DUPLICATE KEY UPDATE module = module;

-- 5. Assign production permissions to production roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('production-head', 'designer-lead', 'developer-lead', 'seo-lead', 'content-lead', 'qa-lead', 
                  'designer-member', 'developer-member', 'seo-member', 'content-member', 'qa-member')
AND p.module = 'production'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- 6. Production head gets all production permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'production-head'
AND p.module IN ('production', 'tasks', 'projects', 'departments')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- 7. Production leads get manage permissions for their department
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('designer-lead', 'developer-lead', 'seo-lead', 'content-lead', 'qa-lead')
AND p.module = 'production' AND p.action IN ('create', 'read', 'update', 'manage')
ON DUPLICATE KEY UPDATE role_id = role_id;
