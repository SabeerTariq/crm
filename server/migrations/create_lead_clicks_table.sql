-- Create table to track clicks per employee per lead
CREATE TABLE IF NOT EXISTS `lead_clicks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `click_type` ENUM('email', 'phone', 'business_email', 'business_phone') NOT NULL,
  `clicked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_click` (`lead_id`, `user_id`, `click_type`, `clicked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index for faster queries
CREATE INDEX `idx_lead_user_type` ON `lead_clicks` (`lead_id`, `user_id`, `click_type`);

