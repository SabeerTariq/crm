-- Add task checklists and activity logs support
-- This migration adds support for task checklists and activity tracking

-- 1. Create task_checklists table
CREATE TABLE `task_checklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_checklists_task` (`task_id`),
  KEY `fk_checklists_user` (`created_by`),
  CONSTRAINT `fk_checklists_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checklists_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Create task_checklist_items table
CREATE TABLE `task_checklist_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `checklist_id` int(11) NOT NULL,
  `item_text` varchar(500) NOT NULL,
  `is_completed` boolean DEFAULT FALSE,
  `completed_by` int(11) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_checklist_items_checklist` (`checklist_id`),
  KEY `fk_checklist_items_user` (`completed_by`),
  CONSTRAINT `fk_checklist_items_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `task_checklists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checklist_items_user` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Create task_activity_logs table
CREATE TABLE `task_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_activity_logs_task` (`task_id`),
  KEY `fk_activity_logs_user` (`user_id`),
  CONSTRAINT `fk_activity_logs_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Add permissions for task checklists and activity
INSERT INTO `permissions` (`module`, `action`) VALUES
('task_checklists', 'create'),
('task_checklists', 'read'),
('task_checklists', 'update'),
('task_checklists', 'delete'),
('task_activity', 'read');

-- 5. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 1, p.id FROM `permissions` p WHERE p.module IN ('task_checklists', 'task_activity');

-- Upseller gets task checklist permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 5, p.id FROM `permissions` p WHERE p.module IN ('task_checklists', 'task_activity');

-- Front Sales Manager gets task checklist permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 4, p.id FROM `permissions` p WHERE p.module IN ('task_checklists', 'task_activity');

-- Sales role gets task checklist permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 3, p.id FROM `permissions` p WHERE p.module IN ('task_checklists', 'task_activity');
