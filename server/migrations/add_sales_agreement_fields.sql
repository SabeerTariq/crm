-- Add agreement fields to sales table
ALTER TABLE `sales` 
ADD COLUMN `agreement_file_name` VARCHAR(255) NULL AFTER `service_details`,
ADD COLUMN `agreement_file_path` VARCHAR(500) NULL AFTER `agreement_file_name`,
ADD COLUMN `agreement_file_size` INT(11) NULL AFTER `agreement_file_path`,
ADD COLUMN `agreement_file_type` VARCHAR(100) NULL AFTER `agreement_file_size`,
ADD COLUMN `agreement_uploaded_at` TIMESTAMP NULL AFTER `agreement_file_type`;
