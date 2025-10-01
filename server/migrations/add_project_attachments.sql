-- Add project attachments support
-- This migration adds support for project attachments

-- 1. Create project_attachments table
CREATE TABLE `project_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_project_attachments_project` (`project_id`),
  KEY `fk_project_attachments_user` (`uploaded_by`),
  CONSTRAINT `fk_project_attachments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_attachments_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Add permissions for project attachments
INSERT INTO `permissions` (`module`, `action`) VALUES
('project_attachments', 'create'),
('project_attachments', 'read'),
('project_attachments', 'update'),
('project_attachments', 'delete'),
('project_attachments', 'view');

-- 3. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 1, p.id FROM `permissions` p WHERE p.module = 'project_attachments';

-- Upseller gets project attachment permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 5, p.id FROM `permissions` p WHERE p.module = 'project_attachments';

-- Front Sales Manager gets project attachment view permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 4, p.id FROM `permissions` p WHERE p.module = 'project_attachments' AND p.action IN ('read', 'view');

-- Sales role gets project attachment view permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 3, p.id FROM `permissions` p WHERE p.module = 'project_attachments' AND p.action IN ('read', 'view');
