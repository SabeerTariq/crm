-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 18, 2025 at 07:55 AM
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
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `converted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_sales` decimal(12,2) DEFAULT 0.00,
  `total_paid` decimal(12,2) DEFAULT 0.00,
  `total_remaining` decimal(12,2) DEFAULT 0.00,
  `last_payment_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `source`, `notes`, `assigned_to`, `created_by`, `converted_at`, `total_sales`, `total_paid`, `total_remaining`, `last_payment_date`) VALUES
(71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 'Sed voluptas quo id ', 'Id placeat laborum ', 7, 7, '2025-09-18 03:31:31', 17800.00, 17800.00, 0.00, '2025-09-18'),
(72, 'Knox Byers', 'fucolety@mailinator.com', '+1 (753) 227-7868', 'Aut ut quaerat ex qu', 'Aut quos possimus a', 7, 7, '2025-09-18 04:08:22', 10000.00, 6400.00, 3600.00, '2025-09-18');

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
(9, 71, 10, '2025-09-18 03:33:25', 'manual', 'active', '', 13, '2025-09-18 03:33:25', '2025-09-18 03:33:25'),
(10, 72, 12, '2025-09-18 04:08:39', 'manual', 'transferred', ' | Transferred to new upseller', 13, '2025-09-18 04:08:39', '2025-09-18 04:08:54'),
(11, 72, 10, '2025-09-18 04:08:54', 'manual', 'active', '', 13, '2025-09-18 04:08:54', '2025-09-18 04:08:54');

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
(38, NULL, 44, 'INV-1758166291785-44', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758166291777,\"name\":\"Website\",\"details\":\"132\"}]', 'Invoice for sale #44', 7, '2025-09-18 03:31:31', '2025-09-18 03:31:31'),
(39, 71, 44, 'INV-1758166291811-44', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758166291777,\"name\":\"Website\",\"details\":\"132\"}]', 'Invoice for sale #44', 7, '2025-09-18 03:31:31', '2025-09-18 03:31:31'),
(40, 71, 45, 'INV-1758167278796-45', '2025-09-18', '2025-10-18', 100.00, 0.00, 100.00, 'draft', '[{\"id\":1758167278768,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', 'Invoice for sale #45', 10, '2025-09-18 03:47:58', '2025-09-18 03:47:58'),
(41, 71, 46, 'INV-1758168427965-46', '2025-09-18', '2025-10-18', 1500.00, 0.00, 1500.00, 'draft', '[{\"id\":1758168427944,\"name\":\"web app\",\"details\":\"portal\"}]', 'Invoice for sale #46', 10, '2025-09-18 04:07:07', '2025-09-18 04:07:07'),
(42, NULL, 47, 'INV-1758168502119-47', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758168502112,\"name\":\"WEbsite\",\"details\":\"Fresh website\"}]', 'Invoice for sale #47', 7, '2025-09-18 04:08:22', '2025-09-18 04:08:22'),
(43, 72, 47, 'INV-1758168502144-47', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758168502112,\"name\":\"WEbsite\",\"details\":\"Fresh website\"}]', 'Invoice for sale #47', 7, '2025-09-18 04:08:22', '2025-09-18 04:08:22'),
(44, 71, 48, 'INV-1758169613991-48', '2025-09-18', '2025-10-18', 1500.00, 0.00, 1500.00, 'draft', '[{\"id\":1758169613968,\"name\":\"hosting\",\"details\":\"Server\"}]', 'Invoice for sale #48', 10, '2025-09-18 04:26:53', '2025-09-18 04:26:53'),
(45, 71, 49, 'INV-1758173834185-49', '2025-09-18', '2025-10-18', 1500.00, 0.00, 1500.00, 'draft', '[{\"id\":1758173834143,\"name\":\"Domain\",\"details\":\"Domain\"}]', 'Invoice for sale #49', 10, '2025-09-18 05:37:14', '2025-09-18 05:37:14'),
(46, 71, 50, 'INV-1758173878932-50', '2025-09-18', '2025-10-18', 800.00, 0.00, 800.00, 'draft', '[{\"id\":1758173878919,\"name\":\"Marketing\",\"details\":\"Smm\"}]', 'Invoice for sale #50', 10, '2025-09-18 05:37:58', '2025-09-18 05:37:58'),
(47, 71, 51, 'INV-1758174008258-51', '2025-09-18', '2025-10-18', 1500.00, 0.00, 1500.00, 'draft', '[{\"id\":1758174008231,\"name\":\"Seo\",\"details\":\"Seo\"}]', 'Invoice for sale #51', 10, '2025-09-18 05:40:08', '2025-09-18 05:40:08'),
(48, 71, 52, 'INV-1758174028260-52', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758174028248,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', 'Invoice for sale #52', 10, '2025-09-18 05:40:28', '2025-09-18 05:40:28'),
(49, 72, 53, 'INV-1758174398768-53', '2025-09-18', '2025-10-18', 5000.00, 0.00, 5000.00, 'draft', '[{\"id\":1758174398753,\"name\":\"Seo\",\"details\":\"Seo\"}]', 'Invoice for sale #53', 10, '2025-09-18 05:46:38', '2025-09-18 05:46:38');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `converted_by` int(11) DEFAULT NULL,
  `is_converted` tinyint(1) DEFAULT 0,
  `converted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `email`, `phone`, `source`, `notes`, `assigned_to`, `created_by`, `converted_by`, `is_converted`, `converted_at`, `created_at`) VALUES
(64, 'Randall Dillard', 'nabinyme@mailinator.com', '+1 (176) 371-1157', 'Et soluta ratione in', 'Voluptas pariatur P', 6, 6, NULL, 0, NULL, '2025-09-18 03:30:08'),
(66, 'Lunea Mcclure', 'wyquzox@mailinator.com', '+1 (886) 952-5794', 'Quasi assumenda moll', 'Quasi fugit est tem', 6, 6, NULL, 0, NULL, '2025-09-18 03:30:21');

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
(144, 6, 64, 'created', '2025-09-18 03:30:08'),
(145, 6, 65, 'created', '2025-09-18 03:30:17'),
(146, 6, 66, 'created', '2025-09-18 03:30:21'),
(147, 6, 67, 'created', '2025-09-18 03:30:27'),
(148, 7, 65, 'converted', '2025-09-18 03:31:31'),
(149, 6, 65, 'converted', '2025-09-18 03:31:31'),
(150, 7, 67, 'converted', '2025-09-18 04:08:22'),
(151, 6, 67, 'converted', '2025-09-18 04:08:22');

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
(32, 6, 2025, 9, 4, 2, '2025-09-18 03:30:08', '2025-09-18 04:08:22'),
(33, 7, 2025, 9, 0, 2, '2025-09-18 03:31:31', '2025-09-18 04:08:22');

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
(11, 48, 1, 500.00, '2025-09-18', 500.00, 'paid', '2025-09-18 05:29:36', NULL, '2025-09-18 04:26:53', '2025-09-18 05:29:36'),
(12, 48, 2, 500.00, '2025-10-18', 500.00, 'paid', '2025-09-18 05:30:23', NULL, '2025-09-18 04:26:53', '2025-09-18 05:30:23'),
(13, 51, 1, 500.00, '2025-09-18', 500.00, 'paid', '2025-09-18 05:44:54', NULL, '2025-09-18 05:40:08', '2025-09-18 05:44:54'),
(14, 51, 2, 500.00, '2025-10-18', 500.00, 'paid', '2025-09-18 05:45:27', NULL, '2025-09-18 05:40:08', '2025-09-18 05:45:27');

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

--
-- Dumping data for table `payment_recurring`
--

INSERT INTO `payment_recurring` (`id`, `sale_id`, `customer_id`, `amount`, `frequency`, `next_payment_date`, `last_payment_date`, `status`, `total_payments`, `payments_made`, `notes`, `created_at`, `updated_at`) VALUES
(9, 45, 71, 100.00, 'monthly', '2025-10-18', '2025-09-18', 'active', NULL, 1, NULL, '2025-09-18 03:47:58', '2025-09-18 04:05:13'),
(10, 50, 71, 800.00, 'monthly', '2025-10-18', '2025-09-18', 'active', NULL, 1, NULL, '2025-09-18 05:37:58', '2025-09-18 05:47:16');

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
  `payment_method` varchar(50) NOT NULL,
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

INSERT INTO `payment_transactions` (`id`, `sale_id`, `installment_id`, `recurring_id`, `amount`, `payment_method`, `payment_source`, `transaction_reference`, `notes`, `created_by`, `received_by`, `created_at`) VALUES
(46, 44, NULL, NULL, 1000.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 03:48:37'),
(47, 44, NULL, NULL, 500.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 03:59:12'),
(48, 44, NULL, NULL, 1000.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:01:27'),
(49, 45, NULL, 9, 100.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 04:05:13'),
(50, 47, NULL, NULL, 1000.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:10:13'),
(51, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:12:10'),
(52, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:15:41'),
(53, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:19:35'),
(54, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, 10, '2025-09-18 04:24:47'),
(55, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, 10, '2025-09-18 04:25:23'),
(56, 47, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:25:40'),
(57, 47, NULL, NULL, 1900.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:25:56'),
(58, 46, NULL, NULL, 1000.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 04:26:09'),
(59, 48, 11, NULL, 500.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 05:29:36'),
(60, 48, 12, NULL, 500.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 05:30:23'),
(61, 49, NULL, NULL, 600.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:38:27'),
(62, 49, NULL, NULL, 200.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:39:14'),
(63, 49, NULL, NULL, 50.00, 'cash', 'test', NULL, 'Test remaining payment', 1, NULL, '2025-09-18 05:44:01'),
(64, 51, 13, NULL, 500.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 05:44:54'),
(65, 51, 14, NULL, 500.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 05:45:27'),
(66, 49, NULL, NULL, 150.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:45:49'),
(67, 52, NULL, NULL, 4000.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:46:06'),
(68, 53, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:46:56'),
(69, 50, NULL, 10, 800.00, 'cash', 'wire', NULL, NULL, 10, NULL, '2025-09-18 05:47:16'),
(70, 53, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:49:22'),
(71, 53, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:49:39'),
(72, 53, NULL, NULL, 100.00, 'cash', 'wire', NULL, '', 10, NULL, '2025-09-18 05:49:55');

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
(3, 'sales', NULL, '2025-09-14 08:27:03'),
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
(3, 2),
(3, 3),
(3, 5),
(3, 6),
(3, 7),
(3, 17),
(3, 18),
(3, 29),
(3, 30),
(3, 31),
(3, 32),
(3, 33),
(3, 65),
(3, 66),
(3, 67),
(3, 69),
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
  `payment_method` varchar(50) DEFAULT NULL,
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

INSERT INTO `sales` (`id`, `customer_id`, `customer_name`, `customer_email`, `customer_phone`, `unit_price`, `gross_value`, `net_value`, `cash_in`, `remaining`, `payment_method`, `payment_type`, `payment_source`, `payment_company`, `brand`, `notes`, `services`, `service_details`, `created_by`, `created_at`, `updated_at`, `next_payment_date`, `last_payment_date`, `payment_status`) VALUES
(44, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 5000.00, 5000.00, 5000.00, 5000.00, 0.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758166291777,\"name\":\"Website\",\"details\":\"132\"}]', '132', 7, '2025-09-18 03:31:31', '2025-09-18 04:01:26', NULL, '2025-09-18', 'completed'),
(45, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 200.00, 100.00, 100.00, 200.00, 0.00, 'cash', 'recurring', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758167278768,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', 'Dedicated Server', 10, '2025-09-18 03:47:58', '2025-09-18 04:05:13', '2025-09-18', '2025-09-18', 'partial'),
(46, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 1500.00, 1500.00, 1500.00, 1500.00, 0.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758168427944,\"name\":\"web app\",\"details\":\"portal\"}]', 'portal', 10, '2025-09-18 04:07:07', '2025-09-18 04:26:09', NULL, '2025-09-18', 'completed'),
(47, 72, 'Knox Byers', 'fucolety@mailinator.com', '+1 (753) 227-7868', 5000.00, 5000.00, 5000.00, 5000.00, 0.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758168502112,\"name\":\"WEbsite\",\"details\":\"Fresh website\"}]', 'Fresh website', 7, '2025-09-18 04:08:22', '2025-09-18 04:25:56', NULL, '2025-09-18', 'completed'),
(48, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 1500.00, 1500.00, 1500.00, 1500.00, 0.00, 'cash', 'installments', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758169613968,\"name\":\"hosting\",\"details\":\"Server\"}]', 'Server', 10, '2025-09-18 04:26:53', '2025-09-18 05:30:23', '2025-09-18', NULL, 'partial'),
(49, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 1500.00, 1500.00, 1500.00, 1500.00, 0.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758173834143,\"name\":\"Domain\",\"details\":\"Domain\"}]', 'Domain', 10, '2025-09-18 05:37:14', '2025-09-18 05:45:49', NULL, '2025-09-18', 'completed'),
(50, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 1600.00, 800.00, 800.00, 1600.00, 0.00, 'cash', 'recurring', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758173878919,\"name\":\"Marketing\",\"details\":\"Smm\"}]', 'Smm', 10, '2025-09-18 05:37:58', '2025-09-18 05:47:16', '2025-09-18', '2025-09-18', 'partial'),
(51, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 1500.00, 1500.00, 1500.00, 1500.00, 0.00, 'cash', 'installments', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758174008231,\"name\":\"Seo\",\"details\":\"Seo\"}]', 'Seo', 10, '2025-09-18 05:40:08', '2025-09-18 05:45:27', '2025-09-18', NULL, 'partial'),
(52, 71, 'Kadeem Pruitt', 'cykepu@mailinator.com', '+1 (649) 818-7152', 5000.00, 5000.00, 5000.00, 5000.00, 0.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758174028248,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', 'Dedicated Server', 10, '2025-09-18 05:40:28', '2025-09-18 05:46:06', NULL, '2025-09-18', 'completed'),
(53, 72, 'Knox Byers', 'fucolety@mailinator.com', '+1 (753) 227-7868', 5000.00, 5000.00, 5000.00, 1400.00, 3600.00, 'cash', 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', '', '[{\"id\":1758174398753,\"name\":\"Seo\",\"details\":\"Seo\"}]', 'Seo', 10, '2025-09-18 05:46:38', '2025-09-18 05:49:55', NULL, '2025-09-18', 'partial');

-- --------------------------------------------------------

--
-- Table structure for table `targets`
--

CREATE TABLE `targets` (
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
-- Dumping data for table `targets`
--

INSERT INTO `targets` (`id`, `user_id`, `target_value`, `target_month`, `target_year`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 7, 800.00, 0, 0, 1, '2025-09-14 13:24:50', '2025-09-14 13:24:50'),
(2, 7, 10.00, 1, 2025, 1, '2025-09-14 13:29:22', '2025-09-14 13:29:22'),
(3, 7, 50.00, 9, 2025, 1, '2025-09-14 13:32:50', '2025-09-18 02:52:47'),
(4, 7, 15.00, 10, 2025, 1, '2025-09-14 13:33:03', '2025-09-14 13:33:03'),
(5, 7, 15.00, 10, 2025, 1, '2025-09-14 13:33:06', '2025-09-14 13:33:06'),
(7, 7, 12.00, 1, 2025, 1, '2025-09-14 13:38:44', '2025-09-14 13:38:44'),
(8, 7, 8.00, 12, 2024, 1, '2025-09-14 13:39:07', '2025-09-14 13:39:07'),
(9, 8, 10.00, 9, 2025, 1, '2025-09-17 20:17:53', '2025-09-17 20:17:53');

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
(6, 'Team A', '', 9, '2025-09-17 20:08:20', '2025-09-17 20:08:20');

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
(17, 6, 7, 'member', '2025-09-17 20:17:35'),
(18, 6, 8, 'member', '2025-09-17 20:17:35');

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
(26, 71, 'invoice', 39, 5000.00, '2025-10-18', 'pending', 'Invoice #INV-1758166291811-44 - [{\"id\":1758166291777,\"name\":\"Website\",\"details\":\"132\"}]', '2025-09-18 03:31:31', '2025-09-18 03:31:31'),
(27, 71, 'invoice', 40, 100.00, '2025-10-18', 'pending', 'Invoice #INV-1758167278796-45 - [{\"id\":1758167278768,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', '2025-09-18 03:47:58', '2025-09-18 03:47:58'),
(28, 71, 'invoice', 41, 1500.00, '2025-10-18', 'pending', 'Invoice #INV-1758168427965-46 - [{\"id\":1758168427944,\"name\":\"web app\",\"details\":\"portal\"}]', '2025-09-18 04:07:07', '2025-09-18 04:07:07'),
(29, 72, 'invoice', 43, 5000.00, '2025-10-18', 'pending', 'Invoice #INV-1758168502144-47 - [{\"id\":1758168502112,\"name\":\"WEbsite\",\"details\":\"Fresh website\"}]', '2025-09-18 04:08:22', '2025-09-18 04:08:22'),
(30, 71, 'invoice', 44, 1500.00, '2025-10-18', 'pending', 'Invoice #INV-1758169613991-48 - [{\"id\":1758169613968,\"name\":\"hosting\",\"details\":\"Server\"}]', '2025-09-18 04:26:53', '2025-09-18 04:26:53'),
(31, 71, 'invoice', 45, 1500.00, '2025-10-18', 'pending', 'Invoice #INV-1758173834185-49 - [{\"id\":1758173834143,\"name\":\"Domain\",\"details\":\"Domain\"}]', '2025-09-18 05:37:14', '2025-09-18 05:37:14'),
(32, 71, 'invoice', 46, 800.00, '2025-10-18', 'pending', 'Invoice #INV-1758173878932-50 - [{\"id\":1758173878919,\"name\":\"Marketing\",\"details\":\"Smm\"}]', '2025-09-18 05:37:58', '2025-09-18 05:37:58'),
(33, 71, 'invoice', 47, 1500.00, '2025-10-18', 'pending', 'Invoice #INV-1758174008258-51 - [{\"id\":1758174008231,\"name\":\"Seo\",\"details\":\"Seo\"}]', '2025-09-18 05:40:08', '2025-09-18 05:40:08'),
(34, 71, 'invoice', 48, 5000.00, '2025-10-18', 'pending', 'Invoice #INV-1758174028260-52 - [{\"id\":1758174028248,\"name\":\"Hosting\",\"details\":\"Dedicated Server\"}]', '2025-09-18 05:40:28', '2025-09-18 05:40:28'),
(35, 72, 'invoice', 49, 5000.00, '2025-10-18', 'pending', 'Invoice #INV-1758174398768-53 - [{\"id\":1758174398753,\"name\":\"Seo\",\"details\":\"Seo\"}]', '2025-09-18 05:46:38', '2025-09-18 05:46:38');

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
(1, 10, NULL, 'revenue_generated', 22300.00, 9, 2025, '2025-09-18 04:05:13', '2025-09-18 05:49:55'),
(2, 12, NULL, 'revenue_generated', 0.00, 9, 2025, '2025-09-18 05:28:10', '2025-09-18 05:28:10');

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
(3, 10, 20000.00, 9, 2025, 13, '2025-09-18 05:16:04', '2025-09-18 05:16:04'),
(4, 12, 15000.00, 9, 2025, 13, '2025-09-18 05:16:16', '2025-09-18 05:16:16');

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
(4, 'Team A', '', 13, '2025-09-18 04:34:21', '2025-09-18 04:34:21');

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
(4, 4, 10, 'member', '2025-09-18 04:34:21'),
(5, 4, 12, 'member', '2025-09-18 04:34:21');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `payment_installments`
--
ALTER TABLE `payment_installments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `payment_recurring`
--
ALTER TABLE `payment_recurring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
