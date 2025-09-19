-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 19, 2025 at 11:29 PM
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

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `company_name`, `email`, `phone`, `city`, `state`, `service_required`, `source`, `notes`, `assigned_to`, `created_by`, `converted_at`, `updated_at`, `total_sales`, `total_paid`, `total_remaining`, `last_payment_date`) VALUES
(73, 'Hasad Cox', NULL, 'puxenebi@mailinator.com', '+1 (773) 912-9584', NULL, NULL, NULL, 'Aut rerum sed facili', 'Nulla non illo et at', 7, 7, '2025-09-18 06:43:17', '2025-09-18 18:10:14', 5000.00, 2000.00, 3000.00, NULL),
(74, 'Hannah Keith', NULL, 'dufiniz@mailinator.com', '+1 (888) 506-1438', NULL, NULL, NULL, 'Eligendi ad debitis ', 'Quis laboriosam acc', 9, 9, '2025-09-18 18:54:44', '2025-09-19 20:04:28', 1000.00, 600.00, 400.00, '2025-09-19'),
(75, 'meo', NULL, 'test@gmail.com', '1231231231', NULL, NULL, NULL, 'facebook', '', 8, 8, '2025-09-18 19:33:14', '2025-09-18 19:33:14', 10000.00, 2000.00, 8000.00, NULL),
(76, 'Jon', NULL, 'jon@test.com', '', NULL, NULL, NULL, 'facebook', '', 8, 8, '2025-09-18 19:36:25', '2025-09-18 19:36:25', 500.00, 500.00, 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_assignments`
--

CREATE TABLE `customer_assignments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `upseller_id` int(11) NOT NULL,
  `assigned_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `assignment_type` enum('territory','product','manual','performance') DEFAULT 'manual',
  `status` enum('active','inactive','transferred') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_assignments`
--

INSERT INTO `customer_assignments` (`id`, `customer_id`, `upseller_id`, `assigned_date`, `assignment_type`, `status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(12, 74, 10, '2025-09-18 19:01:33', 'manual', 'active', '', 13, '2025-09-18 19:01:33', '2025-09-18 19:01:33');

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

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `customer_id`, `sale_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `services`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(50, NULL, 54, 'INV-1758177797304-54', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758177797294,\"name\":\"Website\",\"details\":\"Fresh website\"}]', 'Invoice for sale #54', 7, '2025-09-18 06:43:17', '2025-09-18 06:43:17'),
(51, 73, 54, 'INV-1758177797337-54', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758177797294,\"name\":\"Website\",\"details\":\"Fresh website\"}]', 'Invoice for sale #54', 7, '2025-09-18 06:43:17', '2025-09-18 06:43:17'),
(52, NULL, 55, 'INV-1758221684443-55', '2025-09-18', '2025-10-18', 1000.00, 0.00, 1000.00, 'draft', '[{\"id\":1758221596673,\"name\":\"Business Website\",\"details\":\"5 pages basic website\"}]', 'Invoice for sale #55', 9, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(53, 74, 55, 'INV-1758221684470-55', '2025-09-18', '2025-10-18', 1000.00, 0.00, 1000.00, 'draft', '[{\"id\":1758221596673,\"name\":\"Business Website\",\"details\":\"5 pages basic website\"}]', 'Invoice for sale #55', 9, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(54, NULL, 56, 'INV-1758223994705-56', '2025-09-18', '2025-10-18', 10000.00, 0.00, 10000.00, 'draft', '[{\"id\":1758223994577,\"name\":\"web app\",\"details\":\"Like youtube\"}]', 'Invoice for sale #56', 8, '2025-09-18 19:33:14', '2025-09-18 19:33:14'),
(55, 75, 56, 'INV-1758223994733-56', '2025-09-18', '2025-10-18', 10000.00, 0.00, 10000.00, 'draft', '[{\"id\":1758223994577,\"name\":\"web app\",\"details\":\"Like youtube\"}]', 'Invoice for sale #56', 8, '2025-09-18 19:33:14', '2025-09-18 19:33:14'),
(56, NULL, 57, 'INV-1758224185538-57', '2025-09-18', '2025-10-18', 500.00, 0.00, 500.00, 'draft', '[{\"id\":1758224162791,\"name\":\"Domain\",\"details\":\"1 year\"}]', 'Invoice for sale #57', 8, '2025-09-18 19:36:25', '2025-09-18 19:36:25'),
(57, 76, 57, 'INV-1758224185563-57', '2025-09-18', '2025-10-18', 500.00, 0.00, 500.00, 'draft', '[{\"id\":1758224162791,\"name\":\"Domain\",\"details\":\"1 year\"}]', 'Invoice for sale #57', 8, '2025-09-18 19:36:25', '2025-09-18 19:36:25');

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

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `company_name`, `email`, `phone`, `city`, `state`, `service_required`, `source`, `notes`, `assigned_to`, `created_by`, `converted_by`, `is_converted`, `converted_at`, `created_at`, `updated_at`) VALUES
(69, 'Paki Fuller', NULL, 'cizu@mailinator.com', '+1 (786) 917-1863', NULL, NULL, NULL, 'Aut tenetur dignissi', 'Adipisci deserunt po', 6, 6, NULL, 0, NULL, '2025-09-18 06:42:13', '2025-09-18 18:09:56'),
(70, 'Samson Vazquez', NULL, 'pegodytyz@mailinator.com', '+1 (194) 415-7129', NULL, NULL, NULL, 'Est aut molestiae ip', 'Blanditiis enim face', 7, 7, NULL, 0, NULL, '2025-09-18 07:34:31', '2025-09-18 18:09:56'),
(72, 'Tanek Alvarez', 'Glass and Santana Traders', 'cafoberulo@mailinator.com', '+1 (735) 514-2846', 'Accusamus eaque occa', 'sdasdasd', 'sdasdsadsd', 'Quisquam cum quia qu', 'Bhai bhot baap lead hain lakho doller aae gy  is say ', 6, 6, NULL, 0, NULL, '2025-09-18 18:08:12', '2025-09-18 18:15:56'),
(75, 'jess', '', 'jess@test.com', '3212312122', '', '', 'web', 'google', '', 6, 6, NULL, 0, NULL, '2025-09-18 18:42:53', '2025-09-18 18:42:53');

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
(152, 6, 68, 'created', '2025-09-18 06:41:59'),
(153, 6, 69, 'created', '2025-09-18 06:42:13'),
(154, 7, 68, 'converted', '2025-09-18 06:43:17'),
(155, 6, 68, 'converted', '2025-09-18 06:43:17'),
(156, 7, 70, 'created', '2025-09-18 07:34:31'),
(157, 1, 71, 'created', '2025-09-18 18:07:55'),
(158, 6, 72, 'created', '2025-09-18 18:08:12'),
(159, 6, 73, 'created', '2025-09-18 18:39:42'),
(160, 6, 74, 'created', '2025-09-18 18:40:42'),
(161, 6, 75, 'created', '2025-09-18 18:42:53'),
(162, 9, 71, 'converted', '2025-09-18 18:54:44'),
(163, 1, 71, 'converted', '2025-09-18 18:54:44'),
(164, 8, 74, 'converted', '2025-09-18 19:33:14'),
(165, 6, 74, 'converted', '2025-09-18 19:33:14'),
(166, 8, 73, 'converted', '2025-09-18 19:36:25'),
(167, 6, 73, 'converted', '2025-09-18 19:36:25');

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

--
-- Dumping data for table `monthly_lead_stats`
--

INSERT INTO `monthly_lead_stats` (`id`, `user_id`, `year`, `month`, `leads_added`, `leads_converted`, `created_at`, `updated_at`) VALUES
(34, 6, 2025, 9, 6, 3, '2025-09-18 06:41:59', '2025-09-18 19:36:25'),
(35, 7, 2025, 9, 1, 1, '2025-09-18 06:43:17', '2025-09-18 07:34:31'),
(36, 1, 2025, 9, 1, 1, '2025-09-18 18:07:55', '2025-09-18 18:54:44'),
(37, 9, 2025, 9, 0, 1, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(38, 8, 2025, 9, 0, 2, '2025-09-18 19:33:14', '2025-09-18 19:36:25');

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

--
-- Dumping data for table `payment_installments`
--

INSERT INTO `payment_installments` (`id`, `sale_id`, `installment_number`, `amount`, `due_date`, `paid_amount`, `status`, `paid_at`, `notes`, `created_at`, `updated_at`) VALUES
(15, 55, 1, 100.00, '2025-09-18', 100.00, 'paid', '2025-09-18 19:02:13', NULL, '2025-09-18 18:54:44', '2025-09-18 19:02:13'),
(16, 55, 2, 100.00, '2025-10-18', 100.00, 'paid', '2025-09-19 20:02:56', NULL, '2025-09-18 18:54:44', '2025-09-19 20:02:56'),
(17, 55, 3, 100.00, '2025-11-18', 100.00, 'paid', '2025-09-19 20:04:01', NULL, '2025-09-18 18:54:44', '2025-09-19 20:04:01'),
(18, 55, 4, 100.00, '2025-12-18', 100.00, 'paid', '2025-09-19 20:04:18', NULL, '2025-09-18 18:54:44', '2025-09-19 20:04:18'),
(19, 55, 5, 100.00, '2026-01-18', 0.00, 'pending', NULL, NULL, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(20, 55, 6, 100.00, '2026-02-18', 0.00, 'pending', NULL, NULL, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(21, 55, 7, 100.00, '2026-03-18', 0.00, 'pending', NULL, NULL, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(22, 55, 8, 100.00, '2026-04-18', 0.00, 'pending', NULL, NULL, '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(23, 55, 9, 100.00, '2026-05-18', 0.00, 'pending', NULL, NULL, '2025-09-18 18:54:44', '2025-09-18 18:54:44');

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

--
-- Dumping data for table `payment_transactions`
--

INSERT INTO `payment_transactions` (`id`, `sale_id`, `installment_id`, `recurring_id`, `amount`, `payment_source`, `transaction_reference`, `notes`, `created_by`, `received_by`, `created_at`) VALUES
(73, 55, 15, NULL, 100.00, 'wire', NULL, NULL, 10, NULL, '2025-09-18 19:02:13'),
(74, 55, 16, NULL, 50.00, 'wire', NULL, NULL, 1, 1, '2025-09-19 20:00:15'),
(75, 55, 16, NULL, 50.00, 'wire', NULL, NULL, 1, 1, '2025-09-19 20:02:56'),
(76, 55, 17, NULL, 100.00, 'paypal', NULL, NULL, 10, 10, '2025-09-19 20:04:01'),
(77, 55, 18, NULL, 100.00, 'wire', NULL, NULL, 10, 10, '2025-09-19 20:04:18'),
(78, 55, NULL, NULL, 100.00, 'wire', NULL, '', 10, 10, '2025-09-19 20:04:28');

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
(1, 'leads', 'create'),
(4, 'leads', 'delete'),
(2, 'leads', 'read'),
(3, 'leads', 'update'),
(18, 'leads', 'view'),
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
(6, 'upseller-manager', 'Manage Upsell Teams and Performance', '2025-09-17 05:07:43');

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
(2, 1),
(2, 2),
(2, 3),
(2, 18),
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
(6, 94);

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
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `next_payment_date` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `payment_status` enum('pending','partial','completed','overdue') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `customer_id`, `customer_name`, `customer_email`, `customer_phone`, `unit_price`, `gross_value`, `net_value`, `cash_in`, `remaining`, `payment_type`, `payment_source`, `payment_company`, `brand`, `notes`, `services`, `service_details`, `created_by`, `created_at`, `updated_at`, `next_payment_date`, `last_payment_date`, `payment_status`) VALUES
(54, 73, 'Hasad Cox', 'puxenebi@mailinator.com', '+1 (773) 912-9584', 5000.00, 5000.00, 5000.00, 2000.00, 3000.00, 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758177797294,\"name\":\"Website\",\"details\":\"Fresh website\"}]', 'Fresh website', 7, '2025-09-18 06:43:17', '2025-09-18 06:43:17', NULL, NULL, 'partial'),
(55, 74, 'Hannah Keith', 'dufiniz@mailinator.com', '+1 (888) 506-1438', 1000.00, 1000.00, 1000.00, 600.00, 400.00, 'installments', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758221596673,\"name\":\"Business Website\",\"details\":\"5 pages basic website\"}]', '5 pages basic website', 9, '2025-09-18 18:54:44', '2025-09-19 20:04:28', '2025-09-18', '2025-09-19', 'partial'),
(56, 75, 'meo', 'test@gmail.com', '1231231231', 10000.00, 10000.00, 10000.00, 2000.00, 8000.00, 'one_time', 'stripe', 'american_digital_agency', 'liberty_web_studio', 'best customer', '[{\"id\":1758223994577,\"name\":\"web app\",\"details\":\"Like youtube\"}]', 'Like youtube', 8, '2025-09-18 19:33:14', '2025-09-18 19:33:14', NULL, NULL, 'partial'),
(57, 76, 'Jon', 'jon@test.com', '', 500.00, 500.00, 500.00, 500.00, 0.00, 'one_time', 'stripe', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758224162791,\"name\":\"Domain\",\"details\":\"1 year\"}]', '1 year', 8, '2025-09-18 19:36:25', '2025-09-18 19:36:25', NULL, NULL, 'completed');

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

--
-- Dumping data for table `targets`
--

INSERT INTO `targets` (`id`, `user_id`, `target_value`, `target_month`, `target_year`, `created_by`, `created_at`, `updated_at`) VALUES
(3, 7, 40, 9, 2025, 1, '2025-09-14 13:32:50', '2025-09-18 06:57:18'),
(4, 7, 15, 8, 2025, 1, '2025-09-14 13:33:03', '2025-09-18 06:57:27'),
(5, 7, 15, 7, 2025, 1, '2025-09-14 13:33:06', '2025-09-18 06:57:33'),
(7, 7, 12, 6, 2025, 1, '2025-09-14 13:38:44', '2025-09-18 06:57:36'),
(9, 8, 2, 9, 2025, 1, '2025-09-17 20:17:53', '2025-09-18 19:27:43'),
(10, 7, 40, 10, 2025, 9, '2025-09-18 19:27:56', '2025-09-18 19:27:56'),
(11, 8, 2, 10, 2025, 9, '2025-09-18 19:27:56', '2025-09-18 19:27:56'),
(12, 7, 40, 10, 2025, 9, '2025-09-18 19:28:00', '2025-09-18 19:28:00'),
(13, 8, 2, 10, 2025, 9, '2025-09-18 19:28:00', '2025-09-18 19:28:00');

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
(12, 'Team A', '', 1, '2025-09-19 20:23:55', '2025-09-19 20:23:55');

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
(37, 12, 7, 'member', '2025-09-19 20:45:30'),
(38, 12, 8, 'member', '2025-09-19 20:45:30');

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

--
-- Dumping data for table `upcoming_payments`
--

INSERT INTO `upcoming_payments` (`id`, `customer_id`, `payment_type`, `source_id`, `amount`, `due_date`, `status`, `description`, `created_at`, `updated_at`) VALUES
(36, 73, 'invoice', 51, 5000.00, '2025-10-18', 'pending', 'Invoice #INV-1758177797337-54 - [{\"id\":1758177797294,\"name\":\"Website\",\"details\":\"Fresh website\"}]', '2025-09-18 06:43:17', '2025-09-18 06:43:17'),
(37, 74, 'invoice', 53, 1000.00, '2025-10-18', 'pending', 'Invoice #INV-1758221684470-55 - [{\"id\":1758221596673,\"name\":\"Business Website\",\"details\":\"5 pages basic website\"}]', '2025-09-18 18:54:44', '2025-09-18 18:54:44'),
(38, 75, 'invoice', 55, 10000.00, '2025-10-18', 'pending', 'Invoice #INV-1758223994733-56 - [{\"id\":1758223994577,\"name\":\"web app\",\"details\":\"Like youtube\"}]', '2025-09-18 19:33:14', '2025-09-18 19:33:14'),
(39, 76, 'invoice', 57, 500.00, '2025-10-18', 'pending', 'Invoice #INV-1758224185563-57 - [{\"id\":1758224162791,\"name\":\"Domain\",\"details\":\"1 year\"}]', '2025-09-18 19:36:25', '2025-09-18 19:36:25');

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

--
-- Dumping data for table `upseller_performance`
--

INSERT INTO `upseller_performance` (`id`, `user_id`, `team_id`, `metric_type`, `metric_value`, `period_month`, `period_year`, `created_at`, `updated_at`) VALUES
(3, 10, NULL, 'revenue_generated', 1200.00, 9, 2025, '2025-09-18 19:02:13', '2025-09-19 20:04:28');

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
(5, 10, 15000.00, 9, 2025, 13, '2025-09-18 06:11:11', '2025-09-18 06:11:11'),
(6, 12, 20000.00, 9, 2025, 13, '2025-09-18 06:11:17', '2025-09-18 06:11:17'),
(7, 10, 15000.00, 8, 2025, 13, '2025-09-18 06:11:11', '2025-09-18 06:11:11'),
(8, 10, 15000.00, 7, 2025, 13, '2025-09-18 06:11:11', '2025-09-18 06:11:11'),
(9, 10, 20000.00, 6, 2025, 13, '2025-09-18 06:11:17', '2025-09-18 06:11:17'),
(10, 10, 15000.00, 5, 2025, 13, '2025-09-18 06:11:11', '2025-09-18 06:11:11');

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

--
-- Dumping data for table `upseller_teams`
--

INSERT INTO `upseller_teams` (`id`, `name`, `description`, `created_by`, `created_at`, `updated_at`) VALUES
(12, 'Team A', '', 1, '2025-09-19 20:44:40', '2025-09-19 20:44:40'),
(13, 'Team B', '', 1, '2025-09-19 20:44:59', '2025-09-19 20:44:59');

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

--
-- Dumping data for table `upseller_team_members`
--

INSERT INTO `upseller_team_members` (`id`, `team_id`, `user_id`, `role`, `joined_at`) VALUES
(19, 12, 12, 'member', '2025-09-19 20:44:45'),
(20, 13, 10, 'member', '2025-09-19 20:45:04');

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
(6, 'Scraper', 'lead@example.com', '$2b$10$zWSd8k9gCbLzG93kuP2pz.Zkf8AKKdzymdq300bSFp8pTJGg41blu', '2025-09-14 09:41:47', 2),
(7, 'Sales', 'sales@example.com', '$2b$10$peYfv8NHxeu7HzrNYjwLTOzks5lAkRp34CEdXg1SNvPkzvohDde5e', '2025-09-14 09:42:27', 3),
(8, 'Seller', 'seller@example.com', '$2b$10$KORUTgrezgKhRs4i0Op8Ne0jq.dTeKXso8CKIBGrJoH7zA9R99TkK', '2025-09-14 13:34:16', 3),
(9, 'Front Manager', 'frontmanager@example.com', '$2b$10$t..1AcjJBnNKeozNwtA6OOPJRyY8af5zlKgwQtlxOcFHJ0yzmNMw2', '2025-09-15 20:07:34', 4),
(10, 'Upseller', 'upseller@example.com', '$2b$10$GiPWHs7KzHFxk8VYAVXRm.zgPXQBqhtN3g0ek0hL1FmDPd42J76aW', '2025-09-16 23:35:32', 5),
(11, 'Test User', 'test@example.com', '$2b$10$3XOL9qo7GsTNKos4f6o2C.vhrJSmRKOHLLwr.Us3t8.vSvoSaUZc2', '2025-09-16 23:47:51', 1),
(12, 'Upseller2', 'upseller2@example.com', '$2b$10$2UN4v2IRCMe3m2FFKtdfM.IMlHfOy/JFnus8iz8bbEsZOLPAvqy.O', '2025-09-17 00:03:00', 5),
(13, 'Upsell Manager', 'upsellmanager@example.com', '$2b$10$lLAWT3ChReDwQ42xZdn8R.tAVAZY84CwZrzQis8.Sil6W5Lp1oVSW', '2025-09-17 05:15:00', 6);

--
-- Indexes for dumped tables
--

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
  ADD KEY `idx_assignment_type` (`assignment_type`),
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
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

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
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_converted_by` FOREIGN KEY (`converted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
