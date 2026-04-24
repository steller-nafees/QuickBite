-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Apr 15, 2026 at 07:59 AM
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
-- Database: `quickbite`
--

-- --------------------------------------------------------

--
-- Table structure for table `food`
--

CREATE TABLE `food` (
  `food_id` varchar(10) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `managed_by` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `food`
--

INSERT INTO `food` (`food_id`, `item_name`, `description`, `price`, `is_available`, `managed_by`, `created_at`, `updated_at`) VALUES
('QBF-0001', 'Chicken Biryani', 'Fragrant basmati rice cooked with tender chicken and aromatic spices', 450.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0002', 'Butter Chicken', 'Creamy tomato-based curry with succulent chicken pieces', 380.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0003', 'Paneer Tikka', 'Marinated cottage cheese cubes grilled with vegetables', 320.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0004', 'Dal Makhani', 'Creamy black lentils simmered overnight with butter and cream', 280.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0005', 'Garlic Naan', 'Soft bread brushed with garlic butter and fresh herbs', 120.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0006', 'Mango Lassi', 'Refreshing yogurt-based drink with fresh mango pulp', 150.00, 1, 'QBV-0002', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0007', 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil', 500.00, 1, 'QBV-0001', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0008', 'Pepperoni Pizza', 'Spicy pizza topped with pepperoni slices and melted cheese', 550.00, 1, 'QBV-0001', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0009', 'Veggie Supreme', 'Loaded with bell peppers, onions, mushrooms, and olives', 480.00, 1, 'QBV-0001', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0010', 'Chocolate Lava Cake', 'Decadent chocolate cake with a gooey center served with vanilla ice cream', 250.00, 1, 'QBV-0001', '2026-04-14 07:20:26', '2026-04-14 07:20:26'),
('QBF-0011', 'Fried Rice', 'Delicious fried rice with vegetables and egg', 250.00, 1, 'QBV-0002', '2026-04-14 07:31:53', '2026-04-14 07:31:53');

--
-- Triggers `food`
--
DELIMITER $$
CREATE TRIGGER `before_insert_food` BEFORE INSERT ON `food` FOR EACH ROW BEGIN
  DECLARE next_id INT;
  SET next_id = (SELECT COUNT(*) + 1 FROM `food`);
  SET NEW.food_id = CONCAT('QBF-', LPAD(next_id, 4, '0'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `order_id` varchar(10) NOT NULL,
  `customer_id` varchar(10) NOT NULL,
  `vendor_id` varchar(10) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','preparing','ready','completed','delivered') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pickup_time` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`order_id`, `customer_id`, `vendor_id`, `total_amount`, `status`, `created_at`, `pickup_time`, `updated_at`) VALUES
('QB-0001', 'QBC-0001', 'QBV-0002', 1280.00, 'completed', '2026-04-14 07:42:15', '2026-04-14 08:30:00', '2026-04-14 07:50:33'),
('QB-0002', 'QBC-0002', 'QBV-0002', 830.00, 'completed', '2026-04-14 09:00:00', '2026-04-14 09:30:00', '2026-04-14 09:35:00'),
('QB-0003', 'QBC-0003', 'QBV-0001', 1050.00, 'completed', '2026-04-14 10:00:00', '2026-04-14 10:30:00', '2026-04-14 10:35:00'),
('QB-0004', 'QBC-0004', 'QBV-0002', 450.00, 'completed', '2026-04-14 11:00:00', '2026-04-14 11:20:00', '2026-04-14 11:25:00'),
('QB-0005', 'QBC-0005', 'QBV-0001', 750.00, 'pending', '2026-04-14 12:00:00', '2026-04-14 12:30:00', '2026-04-14 12:00:00'),
('QB-0006', 'QBC-0002', 'QBV-0002', 580.00, 'completed', '2026-04-14 13:00:00', '2026-04-14 13:25:00', '2026-04-14 13:30:00');

--
-- Triggers `order`
--
DELIMITER $$
CREATE TRIGGER `before_insert_order` BEFORE INSERT ON `order` FOR EACH ROW BEGIN
  DECLARE next_id INT;
  SET next_id = (SELECT COUNT(*) + 1 FROM `order`);
  SET NEW.order_id = CONCAT('QB-', LPAD(next_id, 4, '0'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `order_item_id` varchar(10) NOT NULL,
  `order_id` varchar(10) NOT NULL,
  `food_id` varchar(10) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`order_item_id`, `order_id`, `food_id`, `item_name`, `quantity`, `unit_price`, `total_price`) VALUES
('QBI-0001', 'QB-0001', 'QBF-0001', 'Chicken Biryani', 2, 450.00, 900.00),
('QBI-0002', 'QB-0001', 'QBF-0002', 'Butter Chicken', 1, 380.00, 380.00),
('QBI-0003', 'QB-0002', 'QBF-0002', 'Butter Chicken', 1, 380.00, 380.00),
('QBI-0004', 'QB-0002', 'QBF-0005', 'Garlic Naan', 3, 120.00, 360.00),
('QBI-0005', 'QB-0002', 'QBF-0006', 'Mango Lassi', 1, 90.00, 90.00),
('QBI-0006', 'QB-0003', 'QBF-0007', 'Margherita Pizza', 1, 500.00, 500.00),
('QBI-0007', 'QB-0003', 'QBF-0010', 'Chocolate Lava Cake', 2, 250.00, 500.00),
('QBI-0008', 'QB-0004', 'QBF-0001', 'Chicken Biryani', 1, 450.00, 450.00),
('QBI-0009', 'QB-0005', 'QBF-0008', 'Pepperoni Pizza', 1, 550.00, 550.00),
('QBI-0010', 'QB-0005', 'QBF-0009', 'Veggie Supreme', 1, 480.00, 200.00),
('QBI-0011', 'QB-0006', 'QBF-0003', 'Paneer Tikka', 1, 320.00, 320.00),
('QBI-0012', 'QB-0006', 'QBF-0004', 'Dal Makhani', 1, 280.00, 280.00);

--
-- Triggers `order_item`
--
DELIMITER $$
CREATE TRIGGER `before_insert_order_item` BEFORE INSERT ON `order_item` FOR EACH ROW BEGIN
  DECLARE next_id INT;
  SET next_id = (SELECT COUNT(*) + 1 FROM `order_item`);
  SET NEW.order_item_id = CONCAT('QBI-', LPAD(next_id, 4, '0'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` varchar(10) NOT NULL,
  `order_id` varchar(10) NOT NULL,
  `method` enum('Bkash','Nagad','Card') NOT NULL,
  `account_reference` varchar(32) DEFAULT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `paid_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `order_id`, `method`, `account_reference`, `status`, `amount`, `paid_at`) VALUES
('QBP-0001', 'QB-0001', 'Bkash', '01711234567', 'completed', 1280.00, '2026-04-14 07:45:00'),
('QBP-0002', 'QB-0002', 'Card', '**** **** **** 3456', 'completed', 830.00, '2026-04-14 09:05:00'),
('QBP-0003', 'QB-0003', 'Nagad', '01876543210', 'completed', 1050.00, '2026-04-14 10:05:00'),
('QBP-0004', 'QB-0004', 'Card', '**** **** **** 1122', 'completed', 450.00, '2026-04-14 11:05:00'),
('QBP-0005', 'QB-0005', 'Bkash', '01812345678', 'pending', 750.00, NULL),
('QBP-0006', 'QB-0006', 'Card', '**** **** **** 9876', 'completed', 580.00, '2026-04-14 13:05:00');

--
-- Triggers `payment`
--
DELIMITER $$
CREATE TRIGGER `before_insert_payment` BEFORE INSERT ON `payment` FOR EACH ROW BEGIN
  DECLARE next_id INT;
  SET next_id = (SELECT COUNT(*) + 1 FROM `payment`);
  SET NEW.payment_id = CONCAT('QBP-', LPAD(next_id, 4, '0'));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` varchar(10) NOT NULL,
  `full_name` varchar(50) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Customer','Vendor') DEFAULT NULL,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `passwordResetExpires` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phone` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `full_name`, `email`, `password`, `role`, `passwordResetToken`, `passwordResetExpires`, `created_at`, `updated_at`, `phone`) VALUES
('QBC-0001', 'Turabi Rahman', 'turabi@gmail.com', '$2a$12$QblOfC6UqcoFsV6jJRDVouHpnerwJ8TRAu6TXNTiEl7ISMIVpcap2', 'Customer', NULL, NULL, '2026-04-14 05:56:00', '2026-04-14 05:56:00', NULL),
('QBC-0002', 'Rafiqul Islam', 'rafiqul.islam@gmail.com', '$2b$12$eo4afIGB00DWqejgSE49Ku/J9h4/t6c.sCMT796lJE15Q9kbGpQdS', 'Customer', NULL, NULL, '2026-04-14 08:00:00', '2026-04-14 08:00:00', '01711234567'),
('QBC-0003', 'Nusrat Jahan', 'nusrat.jahan@gmail.com', '$2b$12$.qoMX2nGMv.a/blymgXFEeW7ePVWlO4xZE/E2W83.bog.Y6vocGH.', 'Customer', NULL, NULL, '2026-04-14 08:05:00', '2026-04-14 08:05:00', '01812345678'),
('QBC-0004', 'Md. Shahadat Hossain', 'shahadat.hossain@gmail.com', '$2b$12$cGAq942kFCKnwFAOmLzMH.cqWF10J9sOpFFEJqFomZJxbviBA8YOm', 'Customer', NULL, NULL, '2026-04-14 08:10:00', '2026-04-14 08:10:00', '01923456789'),
('QBC-0005', 'Fatema Begum', 'fatema.begum@gmail.com', '$2b$12$5N4NF6.689xJ4BvRQK3kU.Dxdw2ApLxmCtKLS98oiNBpK.O4yb3E.', 'Customer', NULL, NULL, '2026-04-14 08:15:00', '2026-04-14 08:15:00', '01534567890'),
('QBV-0001', 'Updated Vendor Name', 'xx@example.com', '$2a$12$LoFD3pPBXQpe.p/3Hq2RyOjflX4ULHz.9EAUyX7Lrt5Z3jQhB10nW', 'Vendor', NULL, NULL, '2026-04-14 05:56:28', '2026-04-14 06:27:26', NULL),
('QBV-0002', 'The Kitchen', 'jane@example.com', '$2a$12$.iTZyld6MRmlw9KinNrmR.XgU.mJrmZu7E/9M7Ni5DbruSn/qCITW', 'Vendor', NULL, NULL, '2026-04-14 06:14:58', '2026-04-15 05:53:57', NULL),
('QBV-0003', 'Sarah Cloud Kitchen', 'karim.mia@gmail.com', '$2b$12$GH.5u7XnFhLmV4gIlQcbIeGAXNZkNFeB4u4u3XDGC9ql7W83IHIqO', 'Vendor', NULL, NULL, '2026-04-14 08:20:00', '2026-04-15 05:54:21', '01645678901');

--
-- Triggers `user`
--
DELIMITER $$
CREATE TRIGGER `before_insert_user` BEFORE INSERT ON `user` FOR EACH ROW BEGIN
  DECLARE next_id INT;
  IF NEW.role = 'Customer' THEN
    SET next_id = (SELECT COUNT(*) + 1 FROM `user` WHERE role = 'Customer');
    SET NEW.user_id = CONCAT('QBC-', LPAD(next_id, 4, '0'));
  ELSEIF NEW.role = 'Vendor' THEN
    SET next_id = (SELECT COUNT(*) + 1 FROM `user` WHERE role = 'Vendor');
    SET NEW.user_id = CONCAT('QBV-', LPAD(next_id, 4, '0'));
  END IF;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `food`
--
ALTER TABLE `food`
  ADD PRIMARY KEY (`food_id`),
  ADD KEY `idx_food_managed_by` (`managed_by`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_order_customer_id` (`customer_id`),
  ADD KEY `idx_order_vendor_id` (`vendor_id`),
  ADD KEY `idx_order_status` (`status`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order_item_order_id` (`order_id`),
  ADD KEY `idx_order_item_food_id` (`food_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_payment_order_id` (`order_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `food`
--
ALTER TABLE `food`
  ADD CONSTRAINT `food_ibfk_1` FOREIGN KEY (`managed_by`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `order_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_item_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food` (`food_id`) ON DELETE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
