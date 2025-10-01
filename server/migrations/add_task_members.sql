-- Add task members support
-- This migration adds support for multiple members per task

-- 1. Create task_members table
CREATE TABLE `task_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('assignee','collaborator','reviewer','observer') DEFAULT 'collaborator',
  `assigned_by` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_task_user` (`task_id`, `user_id`),
  KEY `fk_task_members_task` (`task_id`),
  KEY `fk_task_members_user` (`user_id`),
  KEY `fk_task_members_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_task_members_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_members_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Add permissions for task members
INSERT INTO `permissions` (`module`, `action`) VALUES
('task_members', 'create'),
('task_members', 'read'),
('task_members', 'update'),
('task_members', 'delete'),
('task_members', 'view');

-- 3. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 1, p.id FROM `permissions` p WHERE p.module = 'task_members';

-- Upseller gets task member permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 5, p.id FROM `permissions` p WHERE p.module = 'task_members';

-- Front Sales Manager gets task member permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 4, p.id FROM `permissions` p WHERE p.module = 'task_members';

-- Sales role gets task member permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 3, p.id FROM `permissions` p WHERE p.module = 'task_members';

-- 4. Migrate existing assigned_to data to task_members table
INSERT INTO `task_members` (`task_id`, `user_id`, `role`, `assigned_by`, `assigned_at`)
SELECT 
  pt.id as task_id,
  pt.assigned_to as user_id,
  'assignee' as role,
  pt.created_by as assigned_by,
  pt.created_at as assigned_at
FROM `project_tasks` pt
WHERE pt.assigned_to IS NOT NULL;
