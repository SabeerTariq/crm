-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 07, 2025 at 11:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `boards`
--

CREATE TABLE `boards` (
  `id` int(11) NOT NULL,
  `board_name` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `boards`
--

INSERT INTO `boards` (`id`, `board_name`, `department_id`, `description`, `is_default`, `created_by`, `created_at`, `updated_at`) VALUES
(7, 'Development', 13, '', 1, 1, '2025-10-06 21:38:42', '2025-10-06 22:34:52'),
(9, 'Marketing', 12, '', 1, 1, '2025-10-06 21:46:24', '2025-10-06 22:34:58'),
(10, 'Design', 15, '', 1, 1, '2025-10-06 21:46:48', '2025-10-06 22:35:02');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `service_required` text DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `converted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_sales` decimal(12,2) DEFAULT 0.00,
  `total_paid` decimal(12,2) DEFAULT 0.00,
  `total_remaining` decimal(12,2) DEFAULT 0.00,
  `last_payment_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_assignments`
--

CREATE TABLE `customer_assignments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `upseller_id` int(11) NOT NULL,
  `assigned_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','inactive','transferred') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_subscriptions`
--

CREATE TABLE `customer_subscriptions` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `subscription_name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` enum('weekly','monthly','quarterly','yearly') NOT NULL,
  `start_date` date NOT NULL,
  `next_payment_date` date NOT NULL,
  `last_payment_date` date DEFAULT NULL,
  `status` enum('active','paused','cancelled','completed') DEFAULT 'active',
  `total_payments` int(11) DEFAULT NULL,
  `payments_made` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(12, 'Marketing', 'Marketing team', 1, '2025-10-03 23:59:25', '2025-10-03 23:59:25'),
(13, 'Development', 'Development team', 1, '2025-10-03 23:59:25', '2025-10-03 23:59:25'),
(15, 'Design', '', 1, '2025-10-04 00:04:35', '2025-10-04 00:04:35');

-- --------------------------------------------------------

--
-- Table structure for table `department_team_members`
--

CREATE TABLE `department_team_members` (
  `id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('team_leader','team_member') DEFAULT 'team_member',
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_team_members`
--

INSERT INTO `department_team_members` (`id`, `department_id`, `user_id`, `role`, `is_active`, `assigned_at`, `created_at`, `updated_at`) VALUES
(7, 13, 14, 'team_leader', 0, '2025-10-06 22:38:01', '2025-10-06 22:38:01', '2025-10-06 22:38:17'),
(8, 13, 15, 'team_member', 0, '2025-10-06 22:38:07', '2025-10-06 22:38:07', '2025-10-06 22:38:17'),
(9, 13, 16, 'team_leader', 1, '2025-10-06 22:38:22', '2025-10-06 22:38:22', '2025-10-06 22:38:22'),
(10, 13, 17, 'team_member', 0, '2025-10-06 22:38:24', '2025-10-06 22:38:24', '2025-10-06 22:38:31'),
(11, 15, 14, 'team_leader', 1, '2025-10-06 22:38:29', '2025-10-06 22:38:29', '2025-10-06 22:38:29'),
(12, 15, 17, 'team_member', 1, '2025-10-06 22:38:31', '2025-10-06 22:38:31', '2025-10-06 22:38:31');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `remaining_amount` decimal(10,2) NOT NULL,
  `status` enum('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  `services` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `service_required` text DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `converted_by` int(11) DEFAULT NULL,
  `is_converted` tinyint(1) DEFAULT 0,
  `converted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_notes`
--

CREATE TABLE `lead_notes` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `note` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_schedules`
--

CREATE TABLE `lead_schedules` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `scheduled_by` int(11) NOT NULL,
  `schedule_date` date NOT NULL,
  `schedule_time` time DEFAULT NULL,
  `scheduled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_tracking`
--

CREATE TABLE `lead_tracking` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `action` enum('created','converted') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lead_tracking`
--

INSERT INTO `lead_tracking` (`id`, `user_id`, `lead_id`, `action`, `created_at`) VALUES
(197, 21, 91, 'created', '2025-10-03 23:15:36'),
(198, 21, 91, 'converted', '2025-10-03 23:16:02'),
(199, 1, 92, 'created', '2025-10-07 21:39:26');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_lead_stats`
--

CREATE TABLE `monthly_lead_stats` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `leads_added` int(11) DEFAULT 0,
  `leads_converted` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_installments`
--

CREATE TABLE `payment_installments` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `installment_number` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','paid','overdue') DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_recurring`
--

CREATE TABLE `payment_recurring` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` enum('weekly','monthly','quarterly','yearly') NOT NULL,
  `next_payment_date` date NOT NULL,
  `last_payment_date` date DEFAULT NULL,
  `status` enum('active','paused','cancelled','completed') DEFAULT 'active',
  `total_payments` int(11) DEFAULT NULL,
  `payments_made` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `installment_id` int(11) DEFAULT NULL,
  `recurring_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_source` varchar(50) NOT NULL,
  `transaction_reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `received_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `module`, `action`) VALUES
(75, 'assignments', 'create'),
(78, 'assignments', 'delete'),
(76, 'assignments', 'read'),
(77, 'assignments', 'update'),
(79, 'assignments', 'view'),
(5, 'customers', 'create'),
(8, 'customers', 'delete'),
(6, 'customers', 'read'),
(7, 'customers', 'update'),
(17, 'customers', 'view'),
(100, 'departments', 'create'),
(103, 'departments', 'delete'),
(101, 'departments', 'read'),
(102, 'departments', 'update'),
(104, 'departments', 'view'),
(1, 'leads', 'create'),
(4, 'leads', 'delete'),
(2, 'leads', 'read'),
(3, 'leads', 'update'),
(18, 'leads', 'view'),
(130, 'lead_notes', 'create'),
(133, 'lead_notes', 'delete'),
(131, 'lead_notes', 'read'),
(132, 'lead_notes', 'update'),
(134, 'lead_notes', 'view'),
(65, 'payments', 'create'),
(68, 'payments', 'delete'),
(66, 'payments', 'read'),
(67, 'payments', 'update'),
(69, 'payments', 'view'),
(60, 'performance', 'create'),
(63, 'performance', 'delete'),
(61, 'performance', 'read'),
(62, 'performance', 'update'),
(64, 'performance', 'view'),
(95, 'projects', 'create'),
(98, 'projects', 'delete'),
(96, 'projects', 'read'),
(97, 'projects', 'update'),
(99, 'projects', 'view'),
(110, 'project_attachments', 'create'),
(113, 'project_attachments', 'delete'),
(111, 'project_attachments', 'read'),
(112, 'project_attachments', 'update'),
(114, 'project_attachments', 'view'),
(125, 'reminders', 'create'),
(128, 'reminders', 'delete'),
(126, 'reminders', 'read'),
(127, 'reminders', 'update'),
(129, 'reminders', 'view'),
(13, 'roles', 'create'),
(16, 'roles', 'delete'),
(14, 'roles', 'read'),
(15, 'roles', 'update'),
(19, 'roles', 'view'),
(29, 'sales', 'create'),
(32, 'sales', 'delete'),
(30, 'sales', 'read'),
(31, 'sales', 'update'),
(33, 'sales', 'view'),
(55, 'targets', 'create'),
(58, 'targets', 'delete'),
(56, 'targets', 'read'),
(57, 'targets', 'update'),
(59, 'targets', 'view'),
(105, 'tasks', 'create'),
(108, 'tasks', 'delete'),
(106, 'tasks', 'read'),
(107, 'tasks', 'update'),
(109, 'tasks', 'view'),
(119, 'task_activity', 'read'),
(115, 'task_checklists', 'create'),
(118, 'task_checklists', 'delete'),
(116, 'task_checklists', 'read'),
(117, 'task_checklists', 'update'),
(120, 'task_members', 'create'),
(123, 'task_members', 'delete'),
(121, 'task_members', 'read'),
(122, 'task_members', 'update'),
(124, 'task_members', 'view'),
(50, 'teams', 'create'),
(53, 'teams', 'delete'),
(51, 'teams', 'read'),
(52, 'teams', 'update'),
(54, 'teams', 'view'),
(91, 'upseller_performance', 'create'),
(94, 'upseller_performance', 'delete'),
(92, 'upseller_performance', 'read'),
(93, 'upseller_performance', 'update'),
(90, 'upseller_performance', 'view'),
(86, 'upseller_targets', 'create'),
(89, 'upseller_targets', 'delete'),
(87, 'upseller_targets', 'read'),
(88, 'upseller_targets', 'update'),
(85, 'upseller_targets', 'view'),
(81, 'upseller_teams', 'create'),
(84, 'upseller_teams', 'delete'),
(82, 'upseller_teams', 'read'),
(83, 'upseller_teams', 'update'),
(80, 'upseller_teams', 'view'),
(9, 'users', 'create'),
(12, 'users', 'delete'),
(10, 'users', 'read'),
(11, 'users', 'update'),
(20, 'users', 'view');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_attachments`
--

CREATE TABLE `project_attachments` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_departments`
--

CREATE TABLE `project_departments` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `team_leader_id` int(11) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed','on_hold') DEFAULT 'not_started',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_tasks`
--

CREATE TABLE `project_tasks` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(100) DEFAULT 'New Task',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `due_date` date DEFAULT NULL,
  `completed_date` timestamp NULL DEFAULT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `board_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminders`
--

CREATE TABLE `reminders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `reminder_date` date NOT NULL,
  `reminder_time` time DEFAULT NULL,
  `is_all_day` tinyint(1) DEFAULT 0,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'admin', 'Full access', '2025-09-14 07:56:06'),
(2, 'lead-scraper', NULL, '2025-09-14 08:10:10'),
(3, 'sales', '', '2025-09-14 08:27:03'),
(4, 'front-sales-manager', NULL, '2025-09-15 20:06:21'),
(5, 'upseller', 'Create Upsells and Manage Projects', '2025-09-16 23:29:27'),
(6, 'upseller-manager', 'Manage Upsell Teams and Performance', '2025-09-17 05:07:43'),
(7, 'production', '', '2025-09-23 23:28:47');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 50),
(1, 51),
(1, 52),
(1, 53),
(1, 54),
(1, 55),
(1, 56),
(1, 57),
(1, 58),
(1, 59),
(1, 60),
(1, 61),
(1, 62),
(1, 63),
(1, 64),
(1, 65),
(1, 66),
(1, 67),
(1, 68),
(1, 69),
(1, 75),
(1, 76),
(1, 77),
(1, 78),
(1, 79),
(1, 80),
(1, 81),
(1, 82),
(1, 83),
(1, 84),
(1, 85),
(1, 86),
(1, 87),
(1, 88),
(1, 89),
(1, 90),
(1, 91),
(1, 92),
(1, 93),
(1, 94),
(1, 95),
(1, 96),
(1, 97),
(1, 98),
(1, 99),
(1, 100),
(1, 101),
(1, 102),
(1, 103),
(1, 104),
(1, 105),
(1, 106),
(1, 107),
(1, 108),
(1, 109),
(1, 110),
(1, 111),
(1, 112),
(1, 113),
(1, 114),
(1, 115),
(1, 116),
(1, 117),
(1, 118),
(1, 119),
(1, 120),
(1, 121),
(1, 122),
(1, 123),
(1, 124),
(1, 125),
(1, 126),
(1, 127),
(1, 128),
(1, 129),
(1, 130),
(1, 131),
(1, 132),
(1, 133),
(1, 134),
(2, 1),
(2, 2),
(2, 3),
(2, 18),
(2, 125),
(2, 126),
(2, 127),
(2, 128),
(2, 129),
(3, 1),
(3, 2),
(3, 3),
(3, 5),
(3, 6),
(3, 7),
(3, 18),
(3, 29),
(3, 30),
(3, 31),
(3, 33),
(3, 65),
(3, 66),
(3, 67),
(3, 95),
(3, 96),
(3, 97),
(3, 99),
(3, 105),
(3, 106),
(3, 107),
(3, 109),
(3, 111),
(3, 114),
(3, 115),
(3, 116),
(3, 117),
(3, 118),
(3, 119),
(3, 120),
(3, 121),
(3, 122),
(3, 123),
(3, 124),
(3, 125),
(3, 126),
(3, 127),
(3, 128),
(3, 129),
(3, 130),
(3, 131),
(3, 132),
(3, 133),
(3, 134),
(4, 1),
(4, 2),
(4, 3),
(4, 5),
(4, 6),
(4, 7),
(4, 10),
(4, 17),
(4, 18),
(4, 29),
(4, 30),
(4, 31),
(4, 33),
(4, 50),
(4, 51),
(4, 52),
(4, 54),
(4, 55),
(4, 56),
(4, 57),
(4, 59),
(4, 60),
(4, 61),
(4, 62),
(4, 64),
(4, 65),
(4, 66),
(4, 67),
(4, 69),
(4, 96),
(4, 99),
(4, 111),
(4, 114),
(4, 115),
(4, 116),
(4, 117),
(4, 118),
(4, 119),
(4, 120),
(4, 121),
(4, 122),
(4, 123),
(4, 124),
(4, 125),
(4, 126),
(4, 127),
(4, 128),
(4, 129),
(4, 130),
(4, 131),
(4, 132),
(4, 133),
(4, 134),
(5, 5),
(5, 6),
(5, 7),
(5, 17),
(5, 29),
(5, 30),
(5, 31),
(5, 33),
(5, 65),
(5, 66),
(5, 67),
(5, 76),
(5, 81),
(5, 82),
(5, 83),
(5, 84),
(5, 86),
(5, 87),
(5, 88),
(5, 89),
(5, 91),
(5, 92),
(5, 93),
(5, 94),
(5, 95),
(5, 96),
(5, 97),
(5, 99),
(5, 105),
(5, 106),
(5, 107),
(5, 108),
(5, 109),
(5, 110),
(5, 111),
(5, 112),
(5, 113),
(5, 114),
(5, 115),
(5, 116),
(5, 117),
(5, 118),
(5, 119),
(5, 120),
(5, 121),
(5, 122),
(5, 123),
(5, 124),
(5, 125),
(5, 126),
(5, 127),
(5, 128),
(5, 129),
(5, 130),
(5, 131),
(5, 132),
(5, 133),
(5, 134),
(6, 5),
(6, 6),
(6, 7),
(6, 10),
(6, 17),
(6, 29),
(6, 30),
(6, 31),
(6, 33),
(6, 65),
(6, 66),
(6, 67),
(6, 69),
(6, 75),
(6, 76),
(6, 77),
(6, 79),
(6, 80),
(6, 81),
(6, 82),
(6, 83),
(6, 84),
(6, 85),
(6, 86),
(6, 87),
(6, 88),
(6, 89),
(6, 90),
(6, 91),
(6, 92),
(6, 93),
(6, 94),
(6, 125),
(6, 126),
(6, 127),
(6, 128),
(6, 129),
(7, 96),
(7, 97),
(7, 105),
(7, 106),
(7, 107),
(7, 109),
(7, 115),
(7, 116),
(7, 117),
(7, 119),
(7, 120),
(7, 121),
(7, 122),
(7, 124),
(7, 125),
(7, 126),
(7, 127),
(7, 128),
(7, 129);

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `gross_value` decimal(10,2) DEFAULT NULL,
  `net_value` decimal(10,2) DEFAULT NULL,
  `cash_in` decimal(10,2) DEFAULT 0.00,
  `remaining` decimal(10,2) DEFAULT NULL,
  `payment_type` enum('one_time','recurring','installments') DEFAULT NULL,
  `payment_source` enum('wire','cashapp','stripe','zelle','paypal','authorize','square','other') DEFAULT NULL,
  `payment_company` enum('american_digital_agency','logicworks','oscs','aztech','others') DEFAULT NULL,
  `brand` enum('liberty_web_studio','others') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `services` varchar(255) DEFAULT NULL,
  `service_details` text DEFAULT NULL,
  `agreement_file_name` varchar(255) DEFAULT NULL,
  `agreement_file_path` varchar(500) DEFAULT NULL,
  `agreement_file_size` int(11) DEFAULT NULL,
  `agreement_file_type` varchar(100) DEFAULT NULL,
  `agreement_uploaded_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `next_payment_date` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `payment_status` enum('pending','partial','completed','overdue') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `targets`
--

CREATE TABLE `targets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `target_value` int(11) NOT NULL,
  `target_month` int(11) NOT NULL,
  `target_year` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_activity_logs`
--

CREATE TABLE `task_activity_logs` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_checklists`
--

CREATE TABLE `task_checklists` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_checklist_items`
--

CREATE TABLE `task_checklist_items` (
  `id` int(11) NOT NULL,
  `checklist_id` int(11) NOT NULL,
  `item_text` varchar(500) NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `completed_by` int(11) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_members`
--

CREATE TABLE `task_members` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('assignee','collaborator','reviewer','observer') DEFAULT 'collaborator',
  `assigned_by` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_statuses`
--

CREATE TABLE `task_statuses` (
  `id` int(11) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `status_color` varchar(7) DEFAULT '#6B7280',
  `status_order` int(11) DEFAULT 0,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `task_statuses`
--

INSERT INTO `task_statuses` (`id`, `status_name`, `status_color`, `status_order`, `is_default`, `created_at`, `updated_at`) VALUES
(19, 'New Task', '#6B7280', 0, 1, '2025-10-06 21:43:55', '2025-10-07 06:13:45'),
(34, 'In Progress', '#0055ff', 1, 0, '2025-10-07 06:10:15', '2025-10-07 06:13:00'),
(35, 'Revisions', '#ffbb00', 2, 0, '2025-10-07 06:13:28', '2025-10-07 06:13:53'),
(37, 'On Hold', '#ff0000', 3, 0, '2025-10-07 21:46:51', '2025-10-07 21:47:40'),
(38, 'Completed', '#04ff00', 4, 0, '2025-10-07 21:47:18', '2025-10-07 21:47:44');

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`id`, `name`, `description`, `created_by`, `created_at`, `updated_at`) VALUES
(13, 'Team A', '', 9, '2025-10-01 22:49:15', '2025-10-01 22:49:15');

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('leader','member') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`) VALUES
(39, 13, 21, 'member', '2025-10-01 22:49:15'),
(40, 13, 22, 'member', '2025-10-01 22:49:15'),
(41, 13, 26, 'member', '2025-10-01 22:49:15'),
(42, 13, 20, 'member', '2025-10-01 22:49:15');

-- --------------------------------------------------------

--
-- Table structure for table `upcoming_payments`
--

CREATE TABLE `upcoming_payments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `payment_type` enum('installment','subscription','invoice') NOT NULL,
  `source_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('pending','paid','overdue') DEFAULT 'pending',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `upseller_performance`
--

CREATE TABLE `upseller_performance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) DEFAULT NULL,
  `metric_type` enum('customers_assigned','sales_generated','revenue_generated','conversion_rate') NOT NULL,
  `metric_value` decimal(10,2) NOT NULL,
  `period_month` int(11) NOT NULL,
  `period_year` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `upseller_targets`
--

CREATE TABLE `upseller_targets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `target_value` decimal(10,2) NOT NULL,
  `target_month` int(11) NOT NULL,
  `target_year` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `upseller_targets`
--

INSERT INTO `upseller_targets` (`id`, `user_id`, `target_value`, `target_month`, `target_year`, `created_by`, `created_at`, `updated_at`) VALUES
(12, 10, 2000.00, 10, 2025, 10, '2025-10-03 23:26:15', '2025-10-03 23:26:15');

-- --------------------------------------------------------

--
-- Table structure for table `upseller_teams`
--

CREATE TABLE `upseller_teams` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `upseller_team_members`
--

CREATE TABLE `upseller_team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('leader','member') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `role_id`) VALUES
(1, 'Admin', 'admin@example.com', '$2b$10$O1YGV4avBmgqHd61HjahcuG8rKaJ0RzydakgApg0Afyuc7MPXye/.', '2025-09-14 06:58:17', 1),
(2, 'Sabeer', 'sabeer@example.com', '$2b$10$/ReCwOi3xmJIpQPGULLFPuLlij.r62KTbeYefP/JOtS0kJYAEIrxC', '2025-09-14 07:47:01', 1),
(6, 'Asad Khan', 'asadkhan@crm.com', '$2b$10$6OM4b.IZPOfrlIYxAYGpl..ZGarGEmA.RhW7ZeXdCVd5HTNGdRajy', '2025-09-14 09:41:47', 2),
(7, 'Sales', 'sales@example.com', '$2b$10$peYfv8NHxeu7HzrNYjwLTOzks5lAkRp34CEdXg1SNvPkzvohDde5e', '2025-09-14 09:42:27', 3),
(8, 'Seller', 'seller@example.com', '$2b$10$KORUTgrezgKhRs4i0Op8Ne0jq.dTeKXso8CKIBGrJoH7zA9R99TkK', '2025-09-14 13:34:16', 3),
(9, 'Iftikhar Khan', 'iftikharkhan@crm.com', '$2b$10$hNhH/svuPvwKsJTnglLIqe.cMXbP/elcnjBCRioMYzX42X4HBAxua', '2025-09-15 20:07:34', 4),
(10, 'Upseller', 'upseller@example.com', '$2b$10$GiPWHs7KzHFxk8VYAVXRm.zgPXQBqhtN3g0ek0hL1FmDPd42J76aW', '2025-09-16 23:35:32', 5),
(11, 'Test User', 'test@example.com', '$2b$10$3XOL9qo7GsTNKos4f6o2C.vhrJSmRKOHLLwr.Us3t8.vSvoSaUZc2', '2025-09-16 23:47:51', 1),
(12, 'Upseller2', 'upseller2@example.com', '$2b$10$2UN4v2IRCMe3m2FFKtdfM.IMlHfOy/JFnus8iz8bbEsZOLPAvqy.O', '2025-09-17 00:03:00', 5),
(13, 'Upsell Manager', 'upsellmanager@example.com', '$2b$10$lLAWT3ChReDwQ42xZdn8R.tAVAZY84CwZrzQis8.Sil6W5Lp1oVSW', '2025-09-17 05:15:00', 6),
(14, 'Designer Lead', 'designerlead@example.com', '$2b$10$qw1eNoHEglWHp.YatzKZ6eoc6PFGO4t5z6JpeUIfmcpbUbVhfGG7m', '2025-09-23 23:30:21', 7),
(15, 'Designer', 'designer@example.com', '$2b$10$0gsHzVUJ2Z2fa9S/fXDMqO40mnIT2cj./iJqWCF5nZiemPHw3wQFC', '2025-09-23 23:30:40', 7),
(16, 'Developmer Lead', 'developerlead@example.com', '$2b$10$xA6Dmu/GUI45r.6btaAFgunuHKfaWShU4UQhibZZjFoCCgMHtPamW', '2025-10-01 00:21:56', 7),
(17, 'Developer', 'developer@example.com', '$2b$10$qSHD/bDbQNtLp/gjPQHoNeU0pQ5aAoB5rfmtYHvpdCm8G95nVEF3.', '2025-10-01 00:22:22', 7),
(18, 'Jahan Rasoli', 'jahan@crm.com', '$2b$10$3Yt/8LcavbbO/NecHH9wn.bpklTqViZspdybNGoeXGqCi1JG7n9zu', '2025-10-01 19:10:42', 2),
(19, 'Musawir Rasoli', 'musawir@crm.com', '$2b$10$pl8Nl/XaPbMWGWtbMiKsR.5ws6whuuga481IHsPOFZZJdPSiHRrFi', '2025-10-01 19:20:49', 2),
(20, 'Hassaan Umer Ansari ', 'hassan@crm.com', '$2b$10$7ntHdGnxg/o4Qpcz.QKJL.xujcrJfBP2t7A4p93jmY0.EDEZHFYRG', '2025-10-01 19:26:23', 3),
(21, 'Adam Zain Nasir', 'adam@crm.com', '$2b$10$ZXU8.Lts/lFQRJLtmm5YBOD/ksKKbvNho6kpwnofLQJBN6yPpp8Ky', '2025-10-01 19:49:38', 3),
(22, 'Adnan Shafaqat', 'adnan@crm.com', '$2b$10$skOH65Q6EQOd2M.8Gfr2Mu.jDr4V4Jlbp.ELJMyYcmbckD0SUiATa', '2025-10-01 19:55:47', 3),
(23, 'Muhammad Fahad ', 'fahad@crm.com', '$2b$10$YPSKznKoJ.QWcj3mDw307OoSLVSz1MzON2Pr5Oe5N2Rp1uS.k9vLG', '2025-10-01 19:57:50', 3),
(24, 'Shahbaz khan', 'shahbaz@crm.com', '$2b$10$.p8CbzrqsL/7ipgZjRBFfOdkCBHZInJocqmTHX7t8Q.9y5eAnTX9y', '2025-10-01 19:58:28', 3),
(25, 'Vincent Welfred Khan', 'vincent@crm.com', '$2b$10$2wIycws1OCuIHzmWKH4PPeeZJwM38RmOMTnJ02UoAO/rLhEwvAfha', '2025-10-01 19:59:00', 3),
(26, 'Bilal Ahmed ', 'bilal@crm.com', '$2b$10$BwcOLWPypwR3WZYKbh3mn.GsRX9SBkvjQI/zqRog.dpFZojACDOsq', '2025-10-01 19:59:25', 3),
(27, 'Sharjeel Ahmed', 'sharjeel@crm.com', '$2b$10$.gDVaOM.gBWsctAEztBn9e0dxg8KjncnQzw3pieFcrV8B5xVOPO.K', '2025-10-07 21:41:21', 3),
(28, 'Muheet', 'muheet@crm.com', '$2b$10$3G37APrgzrbsdxJW2XGOIOk.f6jBxlrnnczSmaEBV84v.WuWDNNMC', '2025-10-07 21:41:45', 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `boards`
--
ALTER TABLE `boards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `idx_customers_total_remaining` (`total_remaining`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_active_customer` (`customer_id`,`status`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_upseller_id` (`upseller_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assigned_date` (`assigned_date`);

--
-- Indexes for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `status` (`status`),
  ADD KEY `next_payment_date` (`next_payment_date`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `department_name` (`department_name`);

--
-- Indexes for table `department_team_members`
--
ALTER TABLE `department_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_department_user` (`department_id`,`user_id`),
  ADD KEY `fk_dept_members_department` (`department_id`),
  ADD KEY `fk_dept_members_user` (`user_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `fk_leads_created_by` (`created_by`),
  ADD KEY `fk_leads_converted_by` (`converted_by`);

--
-- Indexes for table `lead_notes`
--
ALTER TABLE `lead_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead_id` (`lead_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `lead_schedules`
--
ALTER TABLE `lead_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_lead_schedule` (`lead_id`,`scheduled_by`),
  ADD KEY `scheduled_by` (`scheduled_by`);

--
-- Indexes for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead_id` (`lead_id`),
  ADD KEY `idx_lead_tracking_user_date` (`user_id`,`created_at`);

--
-- Indexes for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_month` (`user_id`,`year`,`month`),
  ADD KEY `idx_monthly_stats_user_date` (`user_id`,`year`,`month`);

--
-- Indexes for table `payment_installments`
--
ALTER TABLE `payment_installments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `payment_recurring`
--
ALTER TABLE `payment_recurring`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_next_payment_date` (`next_payment_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_installment_id` (`installment_id`),
  ADD KEY `idx_recurring_id` (`recurring_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module` (`module`,`action`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projects_customer` (`customer_id`),
  ADD KEY `fk_projects_created_by` (`created_by`),
  ADD KEY `fk_projects_manager` (`project_manager_id`),
  ADD KEY `fk_projects_upseller` (`assigned_upseller_id`);

--
-- Indexes for table `project_attachments`
--
ALTER TABLE `project_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_project_attachments_project` (`project_id`),
  ADD KEY `fk_project_attachments_user` (`uploaded_by`);

--
-- Indexes for table `project_departments`
--
ALTER TABLE `project_departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_department` (`project_id`,`department_id`),
  ADD KEY `fk_proj_dept_project` (`project_id`),
  ADD KEY `fk_proj_dept_department` (`department_id`),
  ADD KEY `fk_proj_dept_leader` (`team_leader_id`);

--
-- Indexes for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tasks_project` (`project_id`),
  ADD KEY `fk_tasks_department` (`department_id`),
  ADD KEY `fk_tasks_assigned` (`assigned_to`),
  ADD KEY `fk_tasks_created` (`created_by`),
  ADD KEY `fk_tasks_board` (`board_id`);

--
-- Indexes for table `reminders`
--
ALTER TABLE `reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_reminder_date` (`reminder_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_sales_next_payment` (`next_payment_date`),
  ADD KEY `idx_sales_payment_status` (`payment_status`);

--
-- Indexes for table `targets`
--
ALTER TABLE `targets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `task_activity_logs`
--
ALTER TABLE `task_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_activity_logs_task` (`task_id`),
  ADD KEY `fk_activity_logs_user` (`user_id`);

--
-- Indexes for table `task_checklists`
--
ALTER TABLE `task_checklists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_checklists_task` (`task_id`),
  ADD KEY `fk_checklists_user` (`created_by`);

--
-- Indexes for table `task_checklist_items`
--
ALTER TABLE `task_checklist_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_checklist_items_checklist` (`checklist_id`),
  ADD KEY `fk_checklist_items_user` (`completed_by`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_comments_task` (`task_id`),
  ADD KEY `fk_comments_user` (`user_id`);

--
-- Indexes for table `task_members`
--
ALTER TABLE `task_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_task_user` (`task_id`,`user_id`),
  ADD KEY `fk_task_members_task` (`task_id`),
  ADD KEY `fk_task_members_user` (`user_id`),
  ADD KEY `fk_task_members_assigned_by` (`assigned_by`);

--
-- Indexes for table `task_statuses`
--
ALTER TABLE `task_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_name` (`status_name`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_user` (`team_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `due_date` (`due_date`),
  ADD KEY `status` (`status`),
  ADD KEY `payment_type` (`payment_type`);

--
-- Indexes for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_metric_period` (`user_id`,`metric_type`,`period_month`,`period_year`),
  ADD KEY `team_id` (`team_id`);

--
-- Indexes for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_month_year` (`user_id`,`target_month`,`target_year`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_upseller_targets_user_month_year` (`user_id`,`target_month`,`target_year`),
  ADD KEY `idx_upseller_targets_month_year` (`target_month`,`target_year`);

--
-- Indexes for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_user` (`team_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `boards`
--
ALTER TABLE `boards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `department_team_members`
--
ALTER TABLE `department_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `lead_notes`
--
ALTER TABLE `lead_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lead_schedules`
--
ALTER TABLE `lead_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=200;

--
-- AUTO_INCREMENT for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `payment_installments`
--
ALTER TABLE `payment_installments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `payment_recurring`
--
ALTER TABLE `payment_recurring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `project_attachments`
--
ALTER TABLE `project_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_departments`
--
ALTER TABLE `project_departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `project_tasks`
--
ALTER TABLE `project_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `task_activity_logs`
--
ALTER TABLE `task_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `task_checklists`
--
ALTER TABLE `task_checklists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_checklist_items`
--
ALTER TABLE `task_checklist_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_comments`
--
ALTER TABLE `task_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_members`
--
ALTER TABLE `task_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `task_statuses`
--
ALTER TABLE `task_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `boards`
--
ALTER TABLE `boards`
  ADD CONSTRAINT `boards_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `boards_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  ADD CONSTRAINT `customer_assignments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_assignments_ibfk_2` FOREIGN KEY (`upseller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_assignments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  ADD CONSTRAINT `customer_subscriptions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_subscriptions_ibfk_2` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `department_team_members`
--
ALTER TABLE `department_team_members`
  ADD CONSTRAINT `fk_dept_members_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dept_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_converted_by` FOREIGN KEY (`converted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_notes`
--
ALTER TABLE `lead_notes`
  ADD CONSTRAINT `lead_notes_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lead_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lead_schedules`
--
ALTER TABLE `lead_schedules`
  ADD CONSTRAINT `lead_schedules_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lead_schedules_ibfk_2` FOREIGN KEY (`scheduled_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  ADD CONSTRAINT `lead_tracking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  ADD CONSTRAINT `monthly_lead_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_installments`
--
ALTER TABLE `payment_installments`
  ADD CONSTRAINT `payment_installments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_recurring`
--
ALTER TABLE `payment_recurring`
  ADD CONSTRAINT `payment_recurring_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_recurring_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`installment_id`) REFERENCES `payment_installments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payment_transactions_ibfk_3` FOREIGN KEY (`recurring_id`) REFERENCES `payment_recurring` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payment_transactions_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_transactions_ibfk_5` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_projects_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_projects_manager` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_projects_upseller` FOREIGN KEY (`assigned_upseller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_attachments`
--
ALTER TABLE `project_attachments`
  ADD CONSTRAINT `fk_project_attachments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_project_attachments_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_departments`
--
ALTER TABLE `project_departments`
  ADD CONSTRAINT `fk_proj_dept_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_proj_dept_leader` FOREIGN KEY (`team_leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_proj_dept_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD CONSTRAINT `fk_tasks_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_board` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tasks_created` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tasks_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminders`
--
ALTER TABLE `reminders`
  ADD CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `targets`
--
ALTER TABLE `targets`
  ADD CONSTRAINT `targets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `targets_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `task_activity_logs`
--
ALTER TABLE `task_activity_logs`
  ADD CONSTRAINT `fk_activity_logs_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_checklists`
--
ALTER TABLE `task_checklists`
  ADD CONSTRAINT `fk_checklists_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_checklists_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_checklist_items`
--
ALTER TABLE `task_checklist_items`
  ADD CONSTRAINT `fk_checklist_items_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `task_checklists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_checklist_items_user` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_members`
--
ALTER TABLE `task_members`
  ADD CONSTRAINT `fk_task_members_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_members_task` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `team_members`
--
ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  ADD CONSTRAINT `upcoming_payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  ADD CONSTRAINT `upseller_performance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `upseller_performance_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `upseller_teams` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  ADD CONSTRAINT `upseller_targets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `upseller_targets_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  ADD CONSTRAINT `upseller_teams_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  ADD CONSTRAINT `upseller_team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `upseller_teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `upseller_team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
