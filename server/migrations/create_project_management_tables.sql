-- Project Management Module Database Schema
-- This migration creates all necessary tables for the project management system

-- 1. Master departments table
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_name` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default departments
INSERT INTO `departments` (`department_name`, `description`) VALUES
('Design', 'UI/UX Design, Graphics, Branding, Prototyping'),
('Development', 'Frontend Development, Backend Development, Full-stack'),
('SEO', 'Search Engine Optimization, Keyword Research, Link Building'),
('Content', 'Content Writing, Copywriting, Blog Posts, Documentation'),
('Marketing', 'Digital Marketing, Social Media, Email Marketing, PPC');

-- 2. Projects table
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(12,2) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `project_manager_id` int(11) NOT NULL,
  `assigned_upseller_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_projects_customer` (`customer_id`),
  KEY `fk_projects_created_by` (`created_by`),
  KEY `fk_projects_manager` (`project_manager_id`),
  KEY `fk_projects_upseller` (`assigned_upseller_id`),
  CONSTRAINT `fk_projects_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_projects_manager` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_projects_upseller` FOREIGN KEY (`assigned_upseller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Department team members table
CREATE TABLE `department_team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('team_leader','team_member') DEFAULT 'team_member',
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_department_user` (`department_id`, `user_id`),
  KEY `fk_dept_members_department` (`department_id`),
  KEY `fk_dept_members_user` (`user_id`),
  CONSTRAINT `fk_dept_members_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dept_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Project departments table
CREATE TABLE `project_departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `team_leader_id` int(11) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed','on_hold') DEFAULT 'not_started',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_department` (`project_id`, `department_id`),
  KEY `fk_proj_dept_project` (`project_id`),
  KEY `fk_proj_dept_department` (`department_id`),
  KEY `fk_proj_dept_leader` (`team_leader_id`),
  CONSTRAINT `fk_proj_dept_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proj_dept_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proj_dept_leader` FOREIGN KEY (`team_leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Project tasks table
CREATE TABLE `project_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in_progress','review','completed','blocked') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `due_date` date DEFAULT NULL,
  `completed_date` timestamp NULL DEFAULT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_tasks_project` (`project_id`),
  KEY `fk_tasks_department` (`department_id`),
  KEY `fk_tasks_assigned` (`assigned_to`),
  KEY `fk_tasks_created` (`created_by`),
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_created` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Task comments table
CREATE TABLE `task_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_comments_task` (`task_id`),
  KEY `fk_comments_user` (`user_id`),
  CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Task attachments table
CREATE TABLE `task_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_attachments_task` (`task_id`),
  KEY `fk_attachments_user` (`uploaded_by`),
  CONSTRAINT `fk_attachments_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attachments_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Add project management permissions
INSERT INTO `permissions` (`name`, `module`, `action`) VALUES
('projects', 'projects', 'create'),
('projects', 'projects', 'read'),
('projects', 'projects', 'update'),
('projects', 'projects', 'delete'),
('projects', 'projects', 'view'),
('departments', 'departments', 'create'),
('departments', 'departments', 'read'),
('departments', 'departments', 'update'),
('departments', 'departments', 'delete'),
('departments', 'departments', 'view'),
('tasks', 'tasks', 'create'),
('tasks', 'tasks', 'read'),
('tasks', 'tasks', 'update'),
('tasks', 'tasks', 'delete'),
('tasks', 'tasks', 'view');

-- 9. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 1, p.id FROM `permissions` p WHERE p.module IN ('projects', 'departments', 'tasks');

-- Upseller gets project management permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 5, p.id FROM `permissions` p WHERE p.module IN ('projects', 'departments', 'tasks');

-- Front Sales Manager gets project view permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 4, p.id FROM `permissions` p WHERE p.module = 'projects' AND p.action IN ('read', 'view');

-- Sales role gets project view permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) 
SELECT 3, p.id FROM `permissions` p WHERE p.module = 'projects' AND p.action IN ('read', 'view');
