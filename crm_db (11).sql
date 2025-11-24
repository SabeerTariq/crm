-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 24, 2025 at 09:56 PM
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
(10, 'Design', 15, '', 1, 1, '2025-10-06 21:46:48', '2025-10-06 22:35:02'),
(11, 'Custom Development', 16, '', 0, 32, '2025-11-12 18:00:58', '2025-11-12 18:00:58');

-- --------------------------------------------------------

--
-- Table structure for table `channels`
--

CREATE TABLE `channels` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT 0,
  `is_archived` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `channels`
--

INSERT INTO `channels` (`id`, `name`, `description`, `is_private`, `is_archived`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Announcement', NULL, 0, 0, 32, '2025-11-12 16:57:23', '2025-11-12 16:57:23');

-- --------------------------------------------------------

--
-- Table structure for table `channel_members`
--

CREATE TABLE `channel_members` (
  `id` int(11) NOT NULL,
  `channel_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','admin','member') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `channel_members`
--

INSERT INTO `channel_members` (`id`, `channel_id`, `user_id`, `role`, `joined_at`, `last_read_at`) VALUES
(1, 1, 32, 'owner', '2025-11-12 16:57:23', '2025-11-12 16:57:30'),
(3, 1, 1, 'member', '2025-11-12 16:57:46', '2025-11-12 16:57:46');

-- --------------------------------------------------------

--
-- Table structure for table `chargeback_refunds`
--

CREATE TABLE `chargeback_refunds` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `type` enum('chargeback','refund','retained') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `amount_received` decimal(10,2) DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `original_amount` decimal(12,2) NOT NULL COMMENT 'Original payment amount',
  `refund_type` enum('full','partial') DEFAULT 'full',
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','processed') DEFAULT 'pending',
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chargeback_refunds`
--

INSERT INTO `chargeback_refunds` (`id`, `customer_id`, `sale_id`, `type`, `amount`, `amount_received`, `refund_amount`, `original_amount`, `refund_type`, `reason`, `status`, `processed_by`, `processed_at`, `created_by`, `created_at`, `updated_at`) VALUES
(12, 99, 99, 'refund', 500.00, NULL, NULL, 1000.00, 'partial', '', 'approved', 1, '2025-10-22 22:27:20', 1, '2025-10-22 22:26:58', '2025-10-22 22:27:20'),
(13, 100, 100, 'chargeback', 500.00, 500.00, NULL, 1500.00, 'full', '', 'approved', 1, '2025-10-22 22:47:49', 1, '2025-10-22 22:47:46', '2025-10-22 22:47:49');

-- --------------------------------------------------------

--
-- Table structure for table `chargeback_refund_audit`
--

CREATE TABLE `chargeback_refund_audit` (
  `id` int(11) NOT NULL,
  `chargeback_refund_id` int(11) NOT NULL,
  `action` enum('created','updated','status_changed','processed') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `performed_by` int(11) NOT NULL,
  `performed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chargeback_refund_audit`
--

INSERT INTO `chargeback_refund_audit` (`id`, `chargeback_refund_id`, `action`, `old_values`, `new_values`, `performed_by`, `performed_at`) VALUES
(12, 12, 'status_changed', '{\"status\":\"pending\"}', '{\"status\":\"approved\"}', 1, '2025-10-22 22:27:20'),
(13, 13, 'status_changed', '{\"status\":\"pending\"}', '{\"status\":\"approved\",\"customer_status\":\"chargeback\"}', 1, '2025-10-22 22:47:49');

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
  `last_payment_date` date DEFAULT NULL,
  `customer_status` enum('active','chargeback','refunded','retained') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `company_name`, `email`, `phone`, `city`, `state`, `service_required`, `source`, `notes`, `assigned_to`, `created_by`, `converted_at`, `updated_at`, `total_sales`, `total_paid`, `total_remaining`, `last_payment_date`, `customer_status`) VALUES
(90, 'Lisandra Benson', 'Morrow Copeland Inc', 'wuburu@mailinator.com', '+1 (806) 358-4623', 'Qui non in in minus ', 'Magni adipisicing as', 'Sit ex nisi autem q', 'Soluta rerum ipsum n', 'Aliquip et quia ulla', 1, 1, '2025-10-07 22:18:31', '2025-10-21 23:25:41', 1000.00, 500.00, 500.00, NULL, 'active'),
(92, 'Lester Lane', 'Tran Massey Plc', 'zuxozot@mailinator.com', '+1 (197) 823-6603', 'Natus et qui qui mag', 'Ea reiciendis odio f', 'Veniam ea eum qui a', 'Reprehenderit quis ', 'Et iusto error dolor', 1, 1, '2025-10-14 16:41:49', '2025-10-21 23:25:43', 1000.00, 100.00, 900.00, NULL, 'active'),
(93, 'Ruby Booth', 'Boyle and Heath Plc', 'bavidil@mailinator.com', '+1 (675) 579-2306', 'Eligendi omnis molli', 'Beatae labore Nam si', 'Nulla nisi quia est ', 'Voluptas voluptatem ', 'Placeat soluta labo', 1, 1, '2025-10-14 16:45:56', '2025-10-21 23:31:01', 1000.00, 200.00, 800.00, NULL, 'active'),
(94, 'Brendan Valentine', 'Roy and Dillon Co', 'belejoje@mailinator.com', '+1 (615) 104-8583', 'Et ipsum sed aut seq', 'Tempore quis minim ', 'Nisi similique hic m', 'Ut fugit qui rerum ', 'Sed ex a corrupti e', 1, 1, '2025-10-14 16:49:21', '2025-10-15 19:48:33', 15200.00, 6400.00, 8800.00, '2025-10-15', 'active'),
(95, 'John Doe', 'ABC Corporation', 'john.doe@abccorp.com', '+1-555-0123', 'New York', 'NY', 'Web Development', 'Website', 'Interested in e-commerce platform', 29, 29, '2025-10-15 23:24:30', '2025-10-15 23:24:30', 1000.00, 300.00, 700.00, NULL, 'active'),
(96, 'Chaney Blankenship', 'Blake Miller Co', 'tixyfiqil@mailinator.com', '+1 (442) 382-7082', 'Aut in non aut incid', 'Modi nemo odit conse', 'Id illum quas ut ut', 'Dolor et aute qui mo', 'Sint dolor fuga Id ', 29, 29, '2025-10-15 23:25:24', '2025-10-15 23:25:24', 2000.00, 100.00, 1900.00, NULL, 'active'),
(97, 'Jane Smith', 'XYZ Industries', 'jane.smith@xyz.com', '+1-555-0456', 'Los Angeles', 'CA', 'Mobile App', 'Referral', 'Urgent project deadline', 29, 29, '2025-10-15 23:36:04', '2025-10-15 23:36:04', 1000.00, 500.00, 500.00, NULL, 'active'),
(98, 'Camden Graves', 'Clemons and Mcneil Inc', 'lefi@mailinator.com', '+1 (822) 203-3275', 'Amet tempore ipsa', 'Magnam nobis magnam ', 'Amet sunt minim com', 'Et doloribus cupidit', 'Et sunt inventore n', 8, 8, '2025-10-21 23:59:44', '2025-10-22 22:18:18', 2000.00, 1000.00, 1000.00, NULL, 'active'),
(99, 'Chastity Mack', 'Osborn and Tillman LLC', 'ranukuqine@mailinator.com', '+1 (243) 355-6826', 'Nisi similique omnis', 'Numquam ut alias bea', 'Animi explicabo Ve', 'Qui fugiat esse de', 'Quam laudantium err', 1, 1, '2025-10-22 22:01:08', '2025-10-22 22:26:58', 3000.00, 1000.00, 2000.00, NULL, 'refunded'),
(100, 'Molly Marquez', 'Stevens and Berg Plc', 'fovokazaky@mailinator.com', '+1 (757) 208-3131', 'Aperiam officia ipsu', 'Consequuntur repudia', 'Voluptatem dolore pr', 'Libero ipsum dolores', 'Velit magna cumque ', 1, 1, '2025-10-22 22:15:44', '2025-10-22 22:47:46', 1000.00, 500.00, 500.00, NULL, 'chargeback'),
(101, 'Clio Jensen', 'Powell Cox Plc', 'qinyfo@mailinator.com', '+1 (562) 433-2837', 'Nam modi ad autem es', 'Rerum a dolorem aute', 'In sit deserunt et ', 'Autem porro esse su', 'Similique velit tem', 8, 8, '2025-11-12 17:50:13', '2025-11-12 17:50:13', 1000.00, 500.00, 500.00, NULL, 'active');

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

--
-- Dumping data for table `customer_assignments`
--

INSERT INTO `customer_assignments` (`id`, `customer_id`, `upseller_id`, `assigned_date`, `status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(25, 94, 10, '2025-10-22 22:40:33', 'active', '', 1, '2025-10-22 22:40:33', '2025-10-22 22:40:33'),
(26, 100, 10, '2025-10-22 22:40:46', 'active', '', 1, '2025-10-22 22:40:46', '2025-10-22 22:40:46'),
(27, 98, 10, '2025-11-12 17:50:43', 'active', '', 13, '2025-11-12 17:50:43', '2025-11-12 17:50:43');

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
(15, 'Design', '', 1, '2025-10-04 00:04:35', '2025-10-04 00:04:35'),
(16, 'Custom Development', 'Custom Projects Development', 1, '2025-11-12 16:47:41', '2025-11-12 16:47:41');

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `production_role_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_team_members`
--

INSERT INTO `department_team_members` (`id`, `department_id`, `user_id`, `role`, `is_active`, `assigned_at`, `created_at`, `updated_at`, `production_role_id`) VALUES
(7, 13, 14, 'team_leader', 0, '2025-10-06 22:38:01', '2025-10-06 22:38:01', '2025-10-06 22:38:17', NULL),
(8, 13, 15, 'team_member', 0, '2025-10-06 22:38:07', '2025-10-06 22:38:07', '2025-10-06 22:38:17', NULL),
(9, 13, 16, 'team_leader', 1, '2025-10-06 22:38:22', '2025-10-06 22:38:22', '2025-10-06 22:38:22', NULL),
(10, 13, 17, 'team_member', 1, '2025-10-06 22:38:24', '2025-10-06 22:38:24', '2025-11-12 16:32:58', NULL),
(11, 15, 14, 'team_leader', 1, '2025-10-06 22:38:29', '2025-10-06 22:38:29', '2025-10-06 22:38:29', NULL),
(12, 15, 17, 'team_member', 0, '2025-10-06 22:38:31', '2025-10-06 22:38:31', '2025-10-27 19:27:14', NULL),
(13, 15, 15, 'team_member', 1, '2025-10-27 20:04:40', '2025-10-27 20:04:40', '2025-10-27 20:04:40', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `direct_messages`
--

CREATE TABLE `direct_messages` (
  `id` int(11) NOT NULL,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `direct_messages`
--

INSERT INTO `direct_messages` (`id`, `user1_id`, `user2_id`, `created_at`, `updated_at`) VALUES
(1, 1, 7, '2025-11-05 21:09:46', '2025-11-05 22:03:43'),
(2, 7, 21, '2025-11-05 22:03:26', '2025-11-05 22:03:26'),
(3, 21, 32, '2025-11-12 16:54:26', '2025-11-12 16:54:26'),
(4, 22, 32, '2025-11-12 16:54:29', '2025-11-12 16:54:29'),
(5, 1, 32, '2025-11-12 16:54:30', '2025-11-12 21:36:54'),
(6, 7, 32, '2025-11-12 21:34:15', '2025-11-12 21:34:15');

-- --------------------------------------------------------

--
-- Table structure for table `direct_message_messages`
--

CREATE TABLE `direct_message_messages` (
  `id` int(11) NOT NULL,
  `direct_message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `message_type` enum('text','file') DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `direct_message_messages`
--

INSERT INTO `direct_message_messages` (`id`, `direct_message_id`, `user_id`, `content`, `message_type`, `is_read`, `read_at`, `is_edited`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'hi', 'text', 1, '2025-11-05 21:10:15', 0, 0, '2025-11-05 21:09:49', '2025-11-05 21:10:15'),
(2, 1, 7, 'hello', 'text', 1, '2025-11-05 21:10:20', 1, 0, '2025-11-05 21:10:19', '2025-11-05 21:21:12'),
(3, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:49', '2025-11-05 21:59:42'),
(4, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:50', '2025-11-05 21:59:42'),
(5, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:50', '2025-11-05 21:59:42'),
(6, 1, 7, 'jhi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:51', '2025-11-05 21:59:42'),
(7, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:52', '2025-11-05 21:59:42'),
(8, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:53', '2025-11-05 21:59:42'),
(9, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:54', '2025-11-05 21:59:42'),
(10, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:21:54', '2025-11-05 21:59:42'),
(11, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:53:52', '2025-11-05 21:59:42'),
(12, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:53:53', '2025-11-05 21:59:42'),
(13, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:53:54', '2025-11-05 21:59:42'),
(14, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:53:55', '2025-11-05 21:59:42'),
(15, 1, 7, 'hi', 'text', 1, '2025-11-05 21:59:42', 0, 0, '2025-11-05 21:53:56', '2025-11-05 21:59:42'),
(16, 1, 1, 'hi', 'text', 1, '2025-11-05 22:00:32', 0, 0, '2025-11-05 21:59:45', '2025-11-05 22:00:32'),
(17, 1, 1, 'hellloooo', 'text', 1, '2025-11-05 22:00:32', 0, 0, '2025-11-05 22:00:15', '2025-11-05 22:00:32'),
(18, 1, 7, 'Sample text message', 'text', 1, '2025-11-05 22:03:53', 0, 0, '2025-11-05 22:03:43', '2025-11-05 22:03:53'),
(19, 5, 32, 'Hi how are you?', 'text', 1, '2025-11-12 16:54:53', 0, 0, '2025-11-12 16:54:35', '2025-11-12 16:54:53'),
(20, 5, 1, 'I am good.', 'text', 1, '2025-11-12 16:55:42', 0, 0, '2025-11-12 16:55:41', '2025-11-12 16:55:42'),
(21, 5, 32, 'hi', 'text', 1, '2025-11-12 21:36:17', 0, 0, '2025-11-12 21:36:13', '2025-11-12 21:36:17'),
(22, 5, 32, 'hi', 'text', 1, '2025-11-12 21:36:54', 0, 0, '2025-11-12 21:36:52', '2025-11-12 21:36:54'),
(23, 5, 32, 'hi', 'text', 1, '2025-11-12 21:36:54', 0, 0, '2025-11-12 21:36:53', '2025-11-12 21:36:54'),
(24, 5, 32, 'hi', 'text', 1, '2025-11-12 21:36:56', 0, 0, '2025-11-12 21:36:54', '2025-11-12 21:36:56');

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
  `budget` decimal(10,2) DEFAULT NULL,
  `hours_type` enum('Rush hours','Normal hours') DEFAULT NULL,
  `lead_picked_time` time DEFAULT NULL,
  `day_type` enum('Weekend','Weekdays') DEFAULT NULL,
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

INSERT INTO `leads` (`id`, `name`, `company_name`, `email`, `phone`, `city`, `state`, `service_required`, `source`, `notes`, `budget`, `hours_type`, `lead_picked_time`, `day_type`, `assigned_to`, `created_by`, `converted_by`, `is_converted`, `converted_at`, `created_at`, `updated_at`) VALUES
(117, 'Griffith Maldonado', 'Washington and Callahan LLC', 'lonewogil@mailinator.com', '+1 (223) 541-3869', 'Consequatur quo plac', 'Qui est culpa nequ', 'Ducimus odio est nu', 'Consequatur eveniet', 'Accusamus aut fuga ', NULL, NULL, NULL, NULL, 7, 7, NULL, 0, NULL, '2025-10-30 22:05:39', '2025-10-30 22:05:39'),
(119, 'Edie Israel', 'www.ediesellshomes.com', 'edie@edieisraelteam.com', '714-623-3543', '4945 Yorba Ranch Rd. #C Yorba Linda CA 92887', 'California', 'Social Media Marketing', 'Bark', 'Advertise your business product or service, Build your business brand visibility, Gain followers for your business account, Gain followers for your personal account\n', NULL, NULL, NULL, NULL, 19, 19, NULL, 0, NULL, '2025-11-14 20:13:00', '2025-11-14 20:13:00'),
(120, 'Lily', '', 'j892li@outlook.com', '2268084516', 'Burnaby, British Columbia, Canada', '', 'Web Design', 'LinkedIn', '\"I’m looking for a creative, motivated web / visual designer to collaborate on the full branding / website package — including logo design, color palette, typography, website layout and the launch of the website. * This is a paid contract work on a personal client project * Who I’m looking for • Proficient in Figma, Adobe XD, or similar design tools • Peoficient in front-end implementation (HTML/CSS) and using different web tools \"\n', NULL, NULL, NULL, NULL, 6, 6, NULL, 0, NULL, '2025-11-14 20:14:32', '2025-11-14 20:14:32'),
(121, 'Nicholas', '', 'ntrolli@comcast.net', '(941) 423-9907', 'Georgetown, KY, 40324', '', 'Graphic Design', 'Bark Scrapped', 'Need a designer to help with a marketing piece. And someone to continue to create the advertisements on that our advertising venue. Less than $500\n', NULL, NULL, NULL, NULL, 18, 18, NULL, 0, NULL, '2025-11-14 20:15:50', '2025-11-14 20:15:50');

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

--
-- Dumping data for table `lead_schedules`
--

INSERT INTO `lead_schedules` (`id`, `lead_id`, `scheduled_by`, `schedule_date`, `schedule_time`, `scheduled_at`, `created_at`, `updated_at`) VALUES
(7, 117, 7, '2025-11-01', '05:05:00', '2025-10-30 22:05:54', '2025-10-30 22:05:54', '2025-10-30 22:05:54');

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
(217, 8, 114, 'created', '2025-10-21 23:59:08'),
(218, 8, 114, 'converted', '2025-10-21 23:59:44'),
(219, 1, 115, 'created', '2025-10-22 22:00:34'),
(220, 1, 115, 'converted', '2025-10-22 22:01:08'),
(221, 1, 116, 'created', '2025-10-22 22:15:25'),
(222, 1, 116, 'converted', '2025-10-22 22:15:44'),
(223, 7, 117, 'created', '2025-10-30 22:05:39'),
(224, 7, 118, 'created', '2025-10-31 00:03:15'),
(225, 7, 118, 'converted', '2025-11-12 17:50:13'),
(226, 8, 118, 'converted', '2025-11-12 17:50:13'),
(227, 19, 119, 'created', '2025-11-14 20:13:00'),
(228, 6, 120, 'created', '2025-11-14 20:14:32'),
(229, 18, 121, 'created', '2025-11-14 20:15:50'),
(230, 1, 122, 'created', '2025-11-24 20:52:54');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `channel_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `message_type` enum('text','file','system') DEFAULT 'text',
  `parent_message_id` int(11) DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `channel_id`, `user_id`, `content`, `message_type`, `parent_message_id`, `is_edited`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 1, 32, 'Check in', 'text', NULL, 0, 0, '2025-11-12 16:57:30', '2025-11-12 16:57:30'),
(2, 1, 1, 'Check in', 'text', NULL, 0, 0, '2025-11-12 16:57:46', '2025-11-12 16:57:46');

-- --------------------------------------------------------

--
-- Table structure for table `message_attachments`
--

CREATE TABLE `message_attachments` (
  `id` int(11) NOT NULL,
  `message_id` int(11) DEFAULT NULL,
  `direct_message_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_reactions`
--

CREATE TABLE `message_reactions` (
  `id` int(11) NOT NULL,
  `message_id` int(11) DEFAULT NULL,
  `direct_message_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `emoji` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message_reactions`
--

INSERT INTO `message_reactions` (`id`, `message_id`, `direct_message_id`, `user_id`, `emoji`, `created_at`) VALUES
(4, NULL, 2, 7, '😂', '2025-11-05 21:21:15'),
(5, NULL, 10, 7, '👍', '2025-11-05 21:49:14'),
(6, NULL, 18, 1, '🔥', '2025-11-05 22:04:01');

-- --------------------------------------------------------

--
-- Table structure for table `message_status`
--

CREATE TABLE `message_status` (
  `id` int(11) NOT NULL,
  `message_id` int(11) DEFAULT NULL,
  `direct_message_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('sent','delivered','read') DEFAULT 'sent',
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message_status`
--

INSERT INTO `message_status` (`id`, `message_id`, `direct_message_id`, `user_id`, `status`, `delivered_at`, `read_at`, `created_at`, `updated_at`) VALUES
(1, NULL, 20, 32, 'read', '2025-11-12 21:33:38', '2025-11-12 21:33:40', '2025-11-12 21:33:38', '2025-11-12 21:33:40'),
(2, NULL, 18, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(3, NULL, 15, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:10', '2025-11-12 21:34:06', '2025-11-12 21:34:10'),
(4, NULL, 13, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:10', '2025-11-12 21:34:06', '2025-11-12 21:34:10'),
(5, NULL, 14, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:12', '2025-11-12 21:34:06', '2025-11-12 21:34:12'),
(6, NULL, 12, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(7, NULL, 11, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:12', '2025-11-12 21:34:06', '2025-11-12 21:34:12'),
(8, NULL, 9, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:10', '2025-11-12 21:34:06', '2025-11-12 21:34:10'),
(9, NULL, 10, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:10', '2025-11-12 21:34:06', '2025-11-12 21:34:10'),
(10, NULL, 8, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(11, NULL, 7, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:06', '2025-11-12 21:34:06', '2025-11-12 21:34:06'),
(12, NULL, 6, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(13, NULL, 4, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(14, NULL, 5, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(15, NULL, 3, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:06', '2025-11-12 21:34:06', '2025-11-12 21:34:06'),
(16, NULL, 2, 1, 'read', '2025-11-12 21:34:06', '2025-11-12 21:34:08', '2025-11-12 21:34:06', '2025-11-12 21:34:08'),
(29, NULL, 21, 1, 'read', '2025-11-12 21:36:17', '2025-11-12 21:36:17', '2025-11-12 21:36:13', '2025-11-12 21:36:17'),
(30, NULL, 21, 32, 'delivered', '2025-11-12 21:36:13', NULL, '2025-11-12 21:36:13', '2025-11-12 21:36:13'),
(33, NULL, 19, 1, 'read', '2025-11-12 21:36:17', '2025-11-12 21:36:17', '2025-11-12 21:36:17', '2025-11-12 21:36:17'),
(88, NULL, 22, 1, 'read', '2025-11-12 21:36:54', '2025-11-12 21:36:54', '2025-11-12 21:36:52', '2025-11-12 21:36:54'),
(89, NULL, 22, 32, 'delivered', '2025-11-12 21:36:52', NULL, '2025-11-12 21:36:52', '2025-11-12 21:36:52'),
(92, NULL, 23, 32, 'delivered', '2025-11-12 21:36:53', NULL, '2025-11-12 21:36:53', '2025-11-12 21:36:53'),
(93, NULL, 23, 1, 'read', '2025-11-12 21:36:54', '2025-11-12 21:36:54', '2025-11-12 21:36:53', '2025-11-12 21:36:54'),
(99, NULL, 24, 1, 'read', '2025-11-12 21:36:56', '2025-11-12 21:36:56', '2025-11-12 21:36:54', '2025-11-12 21:36:56'),
(100, NULL, 24, 32, 'delivered', '2025-11-12 21:36:54', NULL, '2025-11-12 21:36:54', '2025-11-12 21:36:54');

-- --------------------------------------------------------

--
-- Table structure for table `message_threads`
--

CREATE TABLE `message_threads` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(48, 8, 2025, 10, 1, 1, '2025-10-21 23:59:08', '2025-10-21 23:59:44'),
(49, 1, 2025, 10, 2, 2, '2025-10-22 22:00:34', '2025-10-22 22:15:44'),
(50, 7, 2025, 10, 2, 0, '2025-10-30 22:05:39', '2025-10-31 00:03:15'),
(51, 8, 2025, 11, 0, 1, '2025-11-12 17:50:13', '2025-11-12 17:50:13'),
(52, 7, 2025, 11, 0, 1, '2025-11-12 17:50:13', '2025-11-12 17:50:13'),
(53, 19, 2025, 11, 1, 0, '2025-11-14 20:13:00', '2025-11-14 20:13:00'),
(54, 6, 2025, 11, 1, 0, '2025-11-14 20:14:32', '2025-11-14 20:14:32'),
(55, 18, 2025, 11, 1, 0, '2025-11-14 20:15:50', '2025-11-14 20:15:50'),
(56, 1, 2025, 11, 1, 0, '2025-11-24 20:52:54', '2025-11-24 20:52:54');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `related_user_id` int(11) DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `entity_type`, `entity_id`, `related_user_id`, `priority`, `is_read`, `read_at`, `created_at`, `expires_at`) VALUES
(7, 17, 'task_completed', 'Task completed: Greenhouse', 'Someone marked this task as completed', 'task', 30, 32, 'high', 0, NULL, '2025-11-12 21:32:52', NULL),
(8, 17, 'task_status_change', 'Task status changed: Greenhouse', 'Someone changed the status from \"Completed\" to \"New Task\"', 'task', 30, 32, 'medium', 0, NULL, '2025-11-12 21:33:14', NULL),
(9, 1, 'chat_message', 'New message from Production Head', 'hi', 'direct_messages', 5, 32, 'medium', 0, NULL, '2025-11-12 21:36:13', NULL),
(10, 1, 'chat_message', 'New message from Production Head', 'hi', 'direct_messages', 5, 32, 'medium', 0, NULL, '2025-11-12 21:36:52', NULL),
(11, 1, 'chat_message', 'New message from Production Head', 'hi', 'direct_messages', 5, 32, 'medium', 0, NULL, '2025-11-12 21:36:53', NULL),
(12, 1, 'chat_message', 'New message from Production Head', 'hi', 'direct_messages', 5, 32, 'medium', 0, NULL, '2025-11-12 21:36:54', NULL);

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
  `frequency` varchar(50) DEFAULT 'monthly',
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `chargeback_refund_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_transactions`
--

INSERT INTO `payment_transactions` (`id`, `sale_id`, `installment_id`, `recurring_id`, `amount`, `payment_source`, `transaction_reference`, `notes`, `created_by`, `received_by`, `created_at`, `chargeback_refund_id`) VALUES
(120, 98, NULL, NULL, 1000.00, 'zelle', 'Initial payment for sale 98', 'Initial payment received at sale creation', 8, 8, '2025-10-21 23:59:44', NULL),
(121, 99, NULL, NULL, 1000.00, 'wire', 'Initial payment for sale 99', 'Initial payment received at sale creation', 1, 1, '2025-10-22 22:01:08', NULL),
(122, 100, NULL, NULL, 500.00, 'wire', 'Initial payment for sale 100', 'Initial payment received at sale creation', 1, 1, '2025-10-22 22:15:44', NULL),
(123, 101, NULL, NULL, 500.00, 'wire', 'Initial payment for sale 101', 'Initial payment received at sale creation', 8, 8, '2025-11-12 17:50:13', NULL);

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
(167, 'backup', 'create'),
(169, 'backup', 'delete'),
(168, 'backup', 'read'),
(170, 'backup', 'restore'),
(166, 'backup', 'view'),
(136, 'chargeback_refunds', 'create'),
(138, 'chargeback_refunds', 'delete'),
(139, 'chargeback_refunds', 'read'),
(137, 'chargeback_refunds', 'update'),
(135, 'chargeback_refunds', 'view'),
(161, 'chat', 'create'),
(163, 'chat', 'delete'),
(160, 'chat', 'read'),
(162, 'chat', 'update'),
(164, 'chat', 'view'),
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
(158, 'notifications', 'delete'),
(156, 'notifications', 'read'),
(157, 'notifications', 'update'),
(159, 'notifications', 'view'),
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
(149, 'production', 'create'),
(152, 'production', 'delete'),
(153, 'production', 'manage'),
(150, 'production', 'read'),
(151, 'production', 'update'),
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
(154, 'schedule-list', 'read'),
(155, 'schedule-list', 'view'),
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
(144, 'todos', 'create'),
(147, 'todos', 'delete'),
(145, 'todos', 'read'),
(146, 'todos', 'update'),
(148, 'todos', 'view'),
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
-- Table structure for table `pinned_messages`
--

CREATE TABLE `pinned_messages` (
  `id` int(11) NOT NULL,
  `channel_id` int(11) DEFAULT NULL,
  `direct_message_id` int(11) DEFAULT NULL,
  `message_id` int(11) DEFAULT NULL,
  `direct_message_id_ref` int(11) DEFAULT NULL,
  `pinned_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_performance`
--

CREATE TABLE `production_performance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `date_tracked` date NOT NULL,
  `tasks_completed` int(11) DEFAULT 0,
  `tasks_assigned` int(11) DEFAULT 0,
  `hours_logged` decimal(5,2) DEFAULT 0.00,
  `efficiency_score` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `customer_id`, `project_name`, `description`, `status`, `priority`, `start_date`, `end_date`, `budget`, `created_by`, `project_manager_id`, `assigned_upseller_id`, `created_at`, `updated_at`) VALUES
(17, 100, 'Storie Valut', 'New Design for landing page', 'active', 'medium', '2025-10-28', '2025-12-28', NULL, 10, 1, 1, '2025-10-27 19:13:55', '2025-10-27 19:13:55'),
(18, 101, 'Greenhouse', 'Wordpress ecommerce website', 'active', 'medium', '2025-11-12', '2025-12-12', NULL, 32, 8, 8, '2025-11-12 17:59:51', '2025-11-12 17:59:51');

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

--
-- Dumping data for table `project_attachments`
--

INSERT INTO `project_attachments` (`id`, `project_id`, `file_name`, `file_path`, `file_size`, `file_type`, `uploaded_by`, `created_at`) VALUES
(8, 17, 'medical-concierge-program_agreement.pdf', 'C:\\Users\\MT\\Desktop\\crm\\server\\uploads\\projects\\29\\medical-concierge-program_agreement-1762965447680-673862752.pdf', 213179, 'application/pdf', 16, '2025-11-12 16:37:27');

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

--
-- Dumping data for table `project_departments`
--

INSERT INTO `project_departments` (`id`, `project_id`, `department_id`, `team_leader_id`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(32, 17, 15, NULL, 'not_started', NULL, NULL, '2025-10-27 19:14:57', '2025-10-27 19:14:57'),
(33, 18, 16, NULL, 'not_started', NULL, NULL, '2025-11-12 17:59:51', '2025-11-12 17:59:51'),
(34, 18, 15, NULL, 'not_started', NULL, NULL, '2025-11-12 17:59:51', '2025-11-12 17:59:51'),
(35, 18, 12, NULL, 'not_started', NULL, NULL, '2025-11-12 17:59:51', '2025-11-12 17:59:51'),
(36, 18, 13, NULL, 'not_started', NULL, NULL, '2025-11-12 17:59:51', '2025-11-12 17:59:51');

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

--
-- Dumping data for table `project_tasks`
--

INSERT INTO `project_tasks` (`id`, `project_id`, `department_id`, `task_name`, `description`, `status`, `priority`, `assigned_to`, `created_by`, `due_date`, `completed_date`, `estimated_hours`, `actual_hours`, `created_at`, `updated_at`, `board_id`) VALUES
(27, 17, 15, 'New Website Design', 'Design a landing page for ecommerce site', 'Completed', 'medium', 15, 10, '2025-10-29', NULL, NULL, 0.00, '2025-10-27 19:15:47', '2025-10-27 22:51:42', 10),
(28, 17, 15, 'Logo', 'Create a logo for this website', 'Completed', 'medium', 15, 10, '2025-10-30', NULL, NULL, 0.00, '2025-10-29 18:12:55', '2025-11-03 18:53:05', 10),
(29, 17, 13, 'Testing Raja', 'Test by Raja', 'In Progress', 'medium', 17, 32, '2025-11-27', NULL, NULL, 0.00, '2025-11-12 16:35:05', '2025-11-12 16:39:49', 7),
(30, 18, 13, 'Greenhouse', 'Create a website with ecommerce functionality', 'New Task', 'medium', 17, 32, '2025-11-12', NULL, NULL, 0.00, '2025-11-12 18:00:31', '2025-11-12 21:33:14', 7);

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

--
-- Dumping data for table `reminders`
--

INSERT INTO `reminders` (`id`, `user_id`, `title`, `description`, `reminder_date`, `reminder_time`, `is_all_day`, `priority`, `status`, `created_at`, `updated_at`) VALUES
(15, 7, 'Call with Griffith Maldonado (Washington and Callahan LLC)', 'Scheduled call with lead: Griffith Maldonado\nCompany: Washington and Callahan LLC\nPhone: +1 (223) 541-3869\nEmail: lonewogil@mailinator.com', '2025-11-01', '05:05:00', 0, 'medium', 'pending', '2025-10-30 22:05:54', '2025-10-30 22:05:54'),
(16, 7, 'Call with Clio Jensen (Powell Cox Plc)', 'Scheduled call with lead: Clio Jensen\nCompany: Powell Cox Plc\nPhone: +1 (562) 433-2837\nEmail: qinyfo@mailinator.com', '2025-10-31', '05:03:00', 0, 'medium', 'pending', '2025-10-31 00:03:43', '2025-10-31 00:03:43');

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
(7, 'production', '', '2025-09-23 23:28:47'),
(8, 'production-head', 'Production head - manages all departments', '2025-10-27 18:25:33'),
(9, 'designer-lead', 'Design department leader', '2025-10-27 18:25:33'),
(10, 'designer-member', 'Design team member', '2025-10-27 18:25:33'),
(11, 'developer-lead', 'Development department leader', '2025-10-27 18:25:33'),
(12, 'developer-member', 'Development team member', '2025-10-27 18:25:33'),
(13, 'seo-lead', 'SEO department leader', '2025-10-27 18:25:33'),
(14, 'seo-member', 'SEO team member', '2025-10-27 18:25:33'),
(15, 'content-lead', 'Content department leader', '2025-10-27 18:25:33'),
(16, 'content-member', 'Content team member', '2025-10-27 18:25:33'),
(17, 'qa-lead', 'QA department leader', '2025-10-27 18:25:33'),
(18, 'qa-member', 'QA team member', '2025-10-27 18:25:33');

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
(1, 135),
(1, 136),
(1, 137),
(1, 138),
(1, 139),
(1, 144),
(1, 145),
(1, 146),
(1, 147),
(1, 148),
(1, 149),
(1, 150),
(1, 151),
(1, 152),
(1, 154),
(1, 155),
(1, 156),
(1, 157),
(1, 158),
(1, 159),
(1, 160),
(1, 161),
(1, 162),
(1, 163),
(1, 164),
(1, 166),
(1, 167),
(1, 168),
(1, 169),
(1, 170),
(2, 1),
(2, 2),
(2, 3),
(2, 18),
(2, 125),
(2, 126),
(2, 127),
(2, 128),
(2, 129),
(2, 144),
(2, 145),
(2, 146),
(2, 147),
(2, 148),
(2, 156),
(2, 157),
(2, 159),
(2, 160),
(2, 161),
(2, 162),
(2, 164),
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
(3, 144),
(3, 145),
(3, 146),
(3, 147),
(3, 148),
(3, 154),
(3, 155),
(3, 156),
(3, 157),
(3, 159),
(3, 160),
(3, 161),
(3, 162),
(3, 164),
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
(4, 144),
(4, 145),
(4, 146),
(4, 147),
(4, 148),
(4, 154),
(4, 155),
(4, 156),
(4, 157),
(4, 159),
(4, 160),
(4, 161),
(4, 162),
(4, 164),
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
(5, 101),
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
(5, 135),
(5, 136),
(5, 137),
(5, 138),
(5, 139),
(5, 144),
(5, 145),
(5, 146),
(5, 147),
(5, 148),
(5, 156),
(5, 157),
(5, 159),
(5, 160),
(5, 161),
(5, 162),
(5, 164),
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
(6, 156),
(6, 157),
(6, 159),
(6, 160),
(6, 161),
(6, 162),
(6, 164),
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
(7, 129),
(7, 156),
(7, 157),
(7, 159),
(7, 160),
(7, 161),
(7, 162),
(7, 164),
(8, 6),
(8, 95),
(8, 96),
(8, 97),
(8, 98),
(8, 99),
(8, 100),
(8, 101),
(8, 102),
(8, 103),
(8, 104),
(8, 105),
(8, 106),
(8, 107),
(8, 108),
(8, 109),
(8, 115),
(8, 116),
(8, 117),
(8, 118),
(8, 120),
(8, 121),
(8, 122),
(8, 123),
(8, 124),
(8, 125),
(8, 126),
(8, 127),
(8, 128),
(8, 129),
(8, 149),
(8, 150),
(8, 151),
(8, 152),
(8, 153),
(8, 156),
(8, 157),
(8, 159),
(8, 160),
(8, 161),
(8, 162),
(8, 164),
(9, 96),
(9, 105),
(9, 106),
(9, 107),
(9, 109),
(9, 111),
(9, 115),
(9, 116),
(9, 117),
(9, 120),
(9, 121),
(9, 122),
(9, 124),
(9, 125),
(9, 126),
(9, 127),
(9, 128),
(9, 129),
(9, 149),
(9, 150),
(9, 151),
(9, 152),
(9, 153),
(9, 156),
(9, 157),
(9, 159),
(9, 160),
(9, 161),
(9, 162),
(9, 164),
(10, 106),
(10, 107),
(10, 109),
(10, 125),
(10, 126),
(10, 127),
(10, 128),
(10, 129),
(10, 149),
(10, 150),
(10, 151),
(10, 152),
(10, 153),
(10, 156),
(10, 157),
(10, 159),
(10, 160),
(10, 161),
(10, 162),
(10, 164),
(11, 105),
(11, 106),
(11, 107),
(11, 108),
(11, 109),
(11, 115),
(11, 116),
(11, 117),
(11, 118),
(11, 119),
(11, 120),
(11, 121),
(11, 122),
(11, 123),
(11, 124),
(11, 149),
(11, 150),
(11, 151),
(11, 152),
(11, 153),
(11, 156),
(11, 157),
(11, 159),
(11, 160),
(11, 161),
(11, 162),
(11, 164),
(12, 106),
(12, 107),
(12, 109),
(12, 119),
(12, 149),
(12, 150),
(12, 151),
(12, 152),
(12, 153),
(12, 156),
(12, 157),
(12, 159),
(12, 160),
(12, 161),
(12, 162),
(12, 164),
(13, 105),
(13, 106),
(13, 107),
(13, 108),
(13, 109),
(13, 115),
(13, 116),
(13, 117),
(13, 118),
(13, 119),
(13, 120),
(13, 121),
(13, 122),
(13, 123),
(13, 124),
(13, 149),
(13, 150),
(13, 151),
(13, 152),
(13, 153),
(13, 156),
(13, 157),
(13, 159),
(13, 160),
(13, 161),
(13, 162),
(13, 164),
(14, 106),
(14, 107),
(14, 109),
(14, 119),
(14, 149),
(14, 150),
(14, 151),
(14, 152),
(14, 153),
(14, 156),
(14, 157),
(14, 159),
(14, 160),
(14, 161),
(14, 162),
(14, 164),
(15, 105),
(15, 106),
(15, 107),
(15, 108),
(15, 109),
(15, 115),
(15, 116),
(15, 117),
(15, 118),
(15, 119),
(15, 120),
(15, 121),
(15, 122),
(15, 123),
(15, 124),
(15, 149),
(15, 150),
(15, 151),
(15, 152),
(15, 153),
(15, 156),
(15, 157),
(15, 159),
(15, 160),
(15, 161),
(15, 162),
(15, 164),
(16, 106),
(16, 107),
(16, 109),
(16, 119),
(16, 149),
(16, 150),
(16, 151),
(16, 152),
(16, 153),
(16, 156),
(16, 157),
(16, 159),
(16, 160),
(16, 161),
(16, 162),
(16, 164),
(17, 105),
(17, 106),
(17, 107),
(17, 108),
(17, 109),
(17, 115),
(17, 116),
(17, 117),
(17, 118),
(17, 119),
(17, 120),
(17, 121),
(17, 122),
(17, 123),
(17, 124),
(17, 149),
(17, 150),
(17, 151),
(17, 152),
(17, 153),
(17, 156),
(17, 157),
(17, 159),
(17, 160),
(17, 161),
(17, 162),
(17, 164),
(18, 106),
(18, 107),
(18, 109),
(18, 119),
(18, 149),
(18, 150),
(18, 151),
(18, 152),
(18, 153),
(18, 156),
(18, 157),
(18, 159),
(18, 160),
(18, 161),
(18, 162),
(18, 164);

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

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `customer_id`, `customer_name`, `customer_email`, `customer_phone`, `unit_price`, `gross_value`, `net_value`, `cash_in`, `remaining`, `payment_type`, `payment_source`, `payment_company`, `brand`, `notes`, `services`, `service_details`, `agreement_file_name`, `agreement_file_path`, `agreement_file_size`, `agreement_file_type`, `agreement_uploaded_at`, `created_by`, `created_at`, `updated_at`, `next_payment_date`, `last_payment_date`, `payment_status`) VALUES
(95, 90, 'Lisandra Benson', 'wuburu@mailinator.com', '555-0101', 5000.00, 5000.00, 4500.00, 10000.00, 0.00, 'one_time', 'stripe', 'american_digital_agency', 'liberty_web_studio', NULL, 'Web Development', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-10-21 22:34:01', '2025-10-21 23:25:41', NULL, NULL, 'pending'),
(96, 92, 'Lester Lane', 'zuxozot@mailinator.com', '555-0102', 3000.00, 3000.00, 2700.00, 6000.00, 0.00, 'one_time', 'paypal', 'logicworks', 'liberty_web_studio', NULL, 'SEO Services', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-10-21 22:34:01', '2025-10-21 23:25:43', NULL, NULL, 'pending'),
(97, 93, 'Ruby Booth', 'bavidil@mailinator.com', '555-0103', 2000.00, 2000.00, 1800.00, 4000.00, 0.00, 'recurring', 'stripe', 'oscs', 'liberty_web_studio', NULL, 'Maintenance', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-10-21 22:34:01', '2025-10-21 23:31:03', NULL, NULL, 'pending'),
(98, 98, 'Camden Graves', 'lefi@mailinator.com', '+1 (822) 203-3275', 2000.00, 2000.00, 2000.00, 3000.00, 1000.00, 'one_time', 'zelle', 'american_digital_agency', 'liberty_web_studio', 'Converted from lead: Clemons and Mcneil Inc - Amet sunt minim com - Et sunt inventore n', '[{\"id\":1761091184597,\"name\":\"Webdesign\",\"details\":\"Design\"}]', 'Design', 'agreement-65.pdf', 'C:\\Users\\MT\\Desktop\\crm\\server\\uploads\\sales\\agreement-65-1761091184626-843143283.pdf', 9030, 'application/pdf', '2025-10-21 23:59:44', 8, '2025-10-21 23:59:44', '2025-10-22 22:18:18', NULL, NULL, 'partial'),
(99, 99, 'Chastity Mack', 'ranukuqine@mailinator.com', '+1 (243) 355-6826', 3000.00, 3000.00, 3000.00, 500.00, 2000.00, 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', 'Converted from lead: Osborn and Tillman LLC - Animi explicabo Ve - Quam laudantium err', '[{\"id\":1761170468089,\"name\":\"Website\",\"details\":\"Fresh website\"}]', 'Fresh website', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-22 22:01:08', '2025-10-22 22:26:58', NULL, NULL, 'partial'),
(100, 100, 'Molly Marquez', 'fovokazaky@mailinator.com', '+1 (757) 208-3131', 1000.00, 1000.00, 1000.00, 1000.00, 500.00, 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', 'Converted from lead: Stevens and Berg Plc - Voluptatem dolore pr - Velit magna cumque', '[{\"id\":1761171344201,\"name\":\"Website\",\"details\":\"Fresh website\"}]', 'Fresh website', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-22 22:15:44', '2025-10-22 22:47:46', NULL, NULL, 'partial'),
(101, 101, 'Clio Jensen', 'qinyfo@mailinator.com', '+1 (562) 433-2837', 1000.00, 1000.00, 1000.00, 500.00, 500.00, 'one_time', 'wire', 'american_digital_agency', 'liberty_web_studio', 'Converted from lead: Powell Cox Plc - In sit deserunt et  - Similique velit tem', '[{\"id\":1762969813707,\"name\":\"Webdesign\",\"details\":\"Design\"}]', 'Design', NULL, NULL, NULL, NULL, NULL, 8, '2025-11-12 17:50:13', '2025-11-12 17:50:13', NULL, NULL, 'partial');

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
(14, 7, 10, 10, 2025, 30, '2025-10-15 23:29:10', '2025-10-15 23:29:10'),
(15, 29, 15, 10, 2025, 30, '2025-10-15 23:29:22', '2025-10-15 23:29:22');

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

--
-- Dumping data for table `task_activity_logs`
--

INSERT INTO `task_activity_logs` (`id`, `task_id`, `user_id`, `action`, `description`, `old_value`, `new_value`, `created_at`) VALUES
(5, 27, 14, 'member_added', 'Added member with role: assignee', NULL, NULL, '2025-10-27 22:43:27'),
(6, 28, 14, 'member_added', 'Added member with role: assignee', NULL, NULL, '2025-10-29 18:13:46'),
(7, 29, 16, 'member_added', 'Added member with role: reviewer', NULL, NULL, '2025-11-12 16:37:12'),
(8, 29, 16, 'attachment_added', 'Added 1 attachment(s)', NULL, NULL, '2025-11-12 16:37:27'),
(9, 29, 16, 'member_added', 'Added member with role: collaborator', NULL, NULL, '2025-11-12 16:37:43'),
(10, 30, 32, 'checklist_created', 'Created checklist: checklist 1', NULL, NULL, '2025-11-12 19:51:41'),
(11, 30, 32, 'checklist_created', 'Created checklist: checklst 2', NULL, NULL, '2025-11-12 19:52:00'),
(12, 30, 32, 'checklist_deleted', 'Deleted checklist: checklst 2', NULL, NULL, '2025-11-12 19:55:36'),
(13, 30, 32, 'checklist_deleted', 'Deleted checklist: checklist 1', NULL, NULL, '2025-11-12 19:55:39');

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

--
-- Dumping data for table `task_comments`
--

INSERT INTO `task_comments` (`id`, `task_id`, `user_id`, `comment`, `created_at`, `updated_at`) VALUES
(4, 29, 16, 'hi\n', '2025-11-12 16:37:59', '2025-11-12 16:37:59');

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

--
-- Dumping data for table `task_members`
--

INSERT INTO `task_members` (`id`, `task_id`, `user_id`, `role`, `assigned_by`, `assigned_at`, `is_active`, `created_at`, `updated_at`) VALUES
(23, 27, 10, 'collaborator', 10, '2025-10-27 19:15:47', 1, '2025-10-27 19:15:47', '2025-10-27 19:15:47'),
(24, 27, 14, 'reviewer', 10, '2025-10-27 19:15:47', 1, '2025-10-27 19:15:47', '2025-10-27 19:15:47'),
(25, 27, 15, 'assignee', 14, '2025-10-27 22:43:27', 1, '2025-10-27 22:43:27', '2025-10-27 22:43:27'),
(26, 28, 10, 'collaborator', 10, '2025-10-29 18:12:55', 1, '2025-10-29 18:12:55', '2025-10-29 18:12:55'),
(27, 28, 14, 'reviewer', 10, '2025-10-29 18:12:55', 1, '2025-10-29 18:12:55', '2025-10-29 18:12:55'),
(28, 28, 15, 'assignee', 14, '2025-10-29 18:13:46', 1, '2025-10-29 18:13:46', '2025-10-29 18:13:46'),
(29, 29, 32, 'collaborator', 32, '2025-11-12 16:35:05', 1, '2025-11-12 16:35:05', '2025-11-12 16:35:05'),
(30, 29, 16, 'reviewer', 32, '2025-11-12 16:35:05', 1, '2025-11-12 16:35:05', '2025-11-12 16:35:05'),
(31, 29, 9, 'reviewer', 16, '2025-11-12 16:37:12', 1, '2025-11-12 16:37:12', '2025-11-12 16:37:12'),
(32, 29, 10, 'collaborator', 16, '2025-11-12 16:37:43', 1, '2025-11-12 16:37:43', '2025-11-12 16:37:43'),
(33, 30, 32, 'collaborator', 32, '2025-11-12 18:00:31', 1, '2025-11-12 18:00:31', '2025-11-12 18:00:31'),
(34, 30, 16, 'reviewer', 32, '2025-11-12 18:00:31', 1, '2025-11-12 18:00:31', '2025-11-12 18:00:31');

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

-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `title`, `description`, `status`, `priority`, `due_date`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'New task', 'Todo Task', 'completed', 'high', '2025-10-28', '2025-11-03 18:27:03', '2025-10-27 16:42:43', '2025-11-03 18:27:03'),
(2, 1, 'NEw Task', 'New Task', 'completed', 'low', '2025-10-29', '2025-10-27 16:45:25', '2025-10-27 16:45:21', '2025-10-27 16:45:25'),
(3, 10, 'My New Task', 'Working on it', 'pending', 'medium', '2025-10-29', NULL, '2025-10-27 16:46:47', '2025-10-27 16:46:47');

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
(12, 10, 2000.00, 10, 2025, 10, '2025-10-03 23:26:15', '2025-10-03 23:26:15'),
(13, 12, 5000.00, 10, 2025, 1, '2025-10-14 20:30:06', '2025-10-14 20:30:06');

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
(15, 'Team A', '', 1, '2025-10-14 20:29:06', '2025-10-14 20:29:06');

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
(25, 15, 10, 'member', '2025-10-14 20:29:06'),
(26, 15, 12, 'member', '2025-10-14 20:29:06');

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
(14, 'Designer Lead', 'designerlead@example.com', '$2b$10$qw1eNoHEglWHp.YatzKZ6eoc6PFGO4t5z6JpeUIfmcpbUbVhfGG7m', '2025-09-23 23:30:21', 9),
(15, 'Designer', 'designer@example.com', '$2b$10$0gsHzVUJ2Z2fa9S/fXDMqO40mnIT2cj./iJqWCF5nZiemPHw3wQFC', '2025-09-23 23:30:40', 10),
(16, 'Developmer Lead', 'developerlead@example.com', '$2b$10$xA6Dmu/GUI45r.6btaAFgunuHKfaWShU4UQhibZZjFoCCgMHtPamW', '2025-10-01 00:21:56', 11),
(17, 'Developer', 'developer@example.com', '$2b$10$qSHD/bDbQNtLp/gjPQHoNeU0pQ5aAoB5rfmtYHvpdCm8G95nVEF3.', '2025-10-01 00:22:22', 12),
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
(28, 'Muheet', 'muheet@crm.com', '$2b$10$3G37APrgzrbsdxJW2XGOIOk.f6jBxlrnnczSmaEBV84v.WuWDNNMC', '2025-10-07 21:41:45', 3),
(29, 'Sales2', 'sales2@example.com', '$2b$10$KPHIK37jnSi7GjuOQ3/HHOpKcqW.U3lRupSNkNV.7IoV3bHumJ.P.', '2025-10-15 18:32:12', 3),
(30, 'Front Manager', 'frontmanager@example.com', '$2b$10$2BEBgA/7TRKJ.KEyZJPYY.S6qy4J5gkfmeudVWx9TLUPxPRV7hVim', '2025-10-15 23:28:40', 4),
(31, 'Ghazali Khan', 'ghazalikhan@crm.com', '$2b$10$oGEVvQzLBsYmV4U0M.V3eekdNyif9ZVFt220TqkU6lgadj7GfAPim', '2025-10-27 19:07:08', 2),
(32, 'Production Head', 'productionhead@example.com', '$2b$10$Swk0ArqZ/TkrwQCLWdIYW.0SzLiOc.pRCeQxQBfw.miLst6KPynem', '2025-10-27 19:09:41', 8);

-- --------------------------------------------------------

--
-- Table structure for table `user_presence`
--

CREATE TABLE `user_presence` (
  `user_id` int(11) NOT NULL,
  `status` enum('online','away','busy','offline') DEFAULT 'offline',
  `last_seen_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_presence`
--

INSERT INTO `user_presence` (`user_id`, `status`, `last_seen_at`) VALUES
(1, 'online', '2025-11-12 23:56:38'),
(7, 'online', '2025-11-06 00:51:55'),
(13, 'online', '2025-11-12 23:56:38'),
(32, 'online', '2025-11-12 22:01:27');

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
-- Indexes for table `channels`
--
ALTER TABLE `channels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_channel_name` (`name`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_is_archived` (`is_archived`);

--
-- Indexes for table `channel_members`
--
ALTER TABLE `channel_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_channel_member` (`channel_id`,`user_id`),
  ADD KEY `idx_channel_id` (`channel_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `chargeback_refunds`
--
ALTER TABLE `chargeback_refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `chargeback_refund_audit`
--
ALTER TABLE `chargeback_refund_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `performed_by` (`performed_by`),
  ADD KEY `idx_chargeback_refund_id` (`chargeback_refund_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_performed_at` (`performed_at`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `idx_customers_total_remaining` (`total_remaining`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_customer_status` (`customer_status`);

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
  ADD KEY `fk_dept_members_user` (`user_id`),
  ADD KEY `fk_production_role` (`production_role_id`);

--
-- Indexes for table `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dm_pair` (`user1_id`,`user2_id`),
  ADD KEY `idx_user1_id` (`user1_id`),
  ADD KEY `idx_user2_id` (`user2_id`);

--
-- Indexes for table `direct_message_messages`
--
ALTER TABLE `direct_message_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_direct_message_id` (`direct_message_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

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
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_channel_id` (`channel_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_parent_message_id` (`parent_message_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_direct_message_id` (`direct_message_id`);

--
-- Indexes for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_reaction` (`message_id`,`user_id`,`emoji`),
  ADD UNIQUE KEY `unique_dm_message_reaction` (`direct_message_id`,`user_id`,`emoji`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_direct_message_id` (`direct_message_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `message_status`
--
ALTER TABLE `message_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_status` (`message_id`,`user_id`),
  ADD UNIQUE KEY `unique_dm_message_status` (`direct_message_id`,`user_id`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_direct_message_id` (`direct_message_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `message_threads`
--
ALTER TABLE `message_threads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_month` (`user_id`,`year`,`month`),
  ADD KEY `idx_monthly_stats_user_date` (`user_id`,`year`,`month`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `related_user_id` (`related_user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

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
  ADD KEY `received_by` (`received_by`),
  ADD KEY `idx_chargeback_refund_id` (`chargeback_refund_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module` (`module`,`action`);

--
-- Indexes for table `pinned_messages`
--
ALTER TABLE `pinned_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_channel_pin` (`channel_id`,`message_id`),
  ADD UNIQUE KEY `unique_dm_pin` (`direct_message_id`,`direct_message_id_ref`),
  ADD KEY `direct_message_id_ref` (`direct_message_id_ref`),
  ADD KEY `pinned_by` (`pinned_by`),
  ADD KEY `idx_channel_id` (`channel_id`),
  ADD KEY `idx_direct_message_id` (`direct_message_id`),
  ADD KEY `idx_message_id` (`message_id`);

--
-- Indexes for table `production_performance`
--
ALTER TABLE `production_performance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `idx_user_dept` (`user_id`,`department_id`),
  ADD KEY `idx_date` (`date_tracked`),
  ADD KEY `idx_department` (`department_id`);

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
-- Indexes for table `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_due_date` (`due_date`);

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
-- Indexes for table `user_presence`
--
ALTER TABLE `user_presence`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_last_seen_at` (`last_seen_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `boards`
--
ALTER TABLE `boards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `channels`
--
ALTER TABLE `channels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `channel_members`
--
ALTER TABLE `channel_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `chargeback_refunds`
--
ALTER TABLE `chargeback_refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `chargeback_refund_audit`
--
ALTER TABLE `chargeback_refund_audit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `customer_assignments`
--
ALTER TABLE `customer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `customer_subscriptions`
--
ALTER TABLE `customer_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `department_team_members`
--
ALTER TABLE `department_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `direct_messages`
--
ALTER TABLE `direct_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `direct_message_messages`
--
ALTER TABLE `direct_message_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=123;

--
-- AUTO_INCREMENT for table `lead_notes`
--
ALTER TABLE `lead_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `lead_schedules`
--
ALTER TABLE `lead_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `lead_tracking`
--
ALTER TABLE `lead_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=231;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `message_attachments`
--
ALTER TABLE `message_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_reactions`
--
ALTER TABLE `message_reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `message_status`
--
ALTER TABLE `message_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1781;

--
-- AUTO_INCREMENT for table `message_threads`
--
ALTER TABLE `message_threads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `payment_installments`
--
ALTER TABLE `payment_installments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `payment_recurring`
--
ALTER TABLE `payment_recurring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

--
-- AUTO_INCREMENT for table `pinned_messages`
--
ALTER TABLE `pinned_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `production_performance`
--
ALTER TABLE `production_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `project_attachments`
--
ALTER TABLE `project_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_departments`
--
ALTER TABLE `project_departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `project_tasks`
--
ALTER TABLE `project_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `task_activity_logs`
--
ALTER TABLE `task_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `task_checklists`
--
ALTER TABLE `task_checklists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_checklist_items`
--
ALTER TABLE `task_checklist_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_comments`
--
ALTER TABLE `task_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `task_members`
--
ALTER TABLE `task_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `task_statuses`
--
ALTER TABLE `task_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `todos`
--
ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `upcoming_payments`
--
ALTER TABLE `upcoming_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `upseller_performance`
--
ALTER TABLE `upseller_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `upseller_targets`
--
ALTER TABLE `upseller_targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `upseller_teams`
--
ALTER TABLE `upseller_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `upseller_team_members`
--
ALTER TABLE `upseller_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

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
-- Constraints for table `channels`
--
ALTER TABLE `channels`
  ADD CONSTRAINT `channels_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `channel_members`
--
ALTER TABLE `channel_members`
  ADD CONSTRAINT `channel_members_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `channel_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chargeback_refunds`
--
ALTER TABLE `chargeback_refunds`
  ADD CONSTRAINT `chargeback_refunds_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chargeback_refunds_ibfk_2` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chargeback_refunds_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `chargeback_refunds_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chargeback_refund_audit`
--
ALTER TABLE `chargeback_refund_audit`
  ADD CONSTRAINT `chargeback_refund_audit_ibfk_1` FOREIGN KEY (`chargeback_refund_id`) REFERENCES `chargeback_refunds` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chargeback_refund_audit_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_dept_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_production_role` FOREIGN KEY (`production_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD CONSTRAINT `direct_messages_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `direct_messages_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `direct_message_messages`
--
ALTER TABLE `direct_message_messages`
  ADD CONSTRAINT `direct_message_messages_ibfk_1` FOREIGN KEY (`direct_message_id`) REFERENCES `direct_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `direct_message_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_attachments_ibfk_2` FOREIGN KEY (`direct_message_id`) REFERENCES `direct_message_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_attachments_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD CONSTRAINT `message_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_reactions_ibfk_2` FOREIGN KEY (`direct_message_id`) REFERENCES `direct_message_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_reactions_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_status`
--
ALTER TABLE `message_status`
  ADD CONSTRAINT `message_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_status_ibfk_2` FOREIGN KEY (`direct_message_id`) REFERENCES `direct_message_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_status_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_threads`
--
ALTER TABLE `message_threads`
  ADD CONSTRAINT `message_threads_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_threads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `monthly_lead_stats`
--
ALTER TABLE `monthly_lead_stats`
  ADD CONSTRAINT `monthly_lead_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`related_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `payment_transactions_ibfk_5` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payment_transactions_ibfk_6` FOREIGN KEY (`chargeback_refund_id`) REFERENCES `chargeback_refunds` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pinned_messages`
--
ALTER TABLE `pinned_messages`
  ADD CONSTRAINT `pinned_messages_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pinned_messages_ibfk_2` FOREIGN KEY (`direct_message_id`) REFERENCES `direct_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pinned_messages_ibfk_3` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pinned_messages_ibfk_4` FOREIGN KEY (`direct_message_id_ref`) REFERENCES `direct_message_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pinned_messages_ibfk_5` FOREIGN KEY (`pinned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_performance`
--
ALTER TABLE `production_performance`
  ADD CONSTRAINT `production_performance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_performance_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_performance_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `production_performance_ibfk_4` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `todos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `user_presence`
--
ALTER TABLE `user_presence`
  ADD CONSTRAINT `user_presence_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
