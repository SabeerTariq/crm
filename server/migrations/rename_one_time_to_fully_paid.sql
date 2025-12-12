-- Migration: Rename payment_type 'one_time' to 'fully_paid'
-- Date: 2025-01-XX
-- Description: Changes the payment_type enum value from 'one_time' to 'fully_paid' 
--              and updates all existing records in the sales table

-- Step 1: Update all existing records from 'one_time' to 'fully_paid'
UPDATE `sales` SET `payment_type` = 'fully_paid' WHERE `payment_type` = 'one_time';

-- Step 2: Modify the enum column to replace 'one_time' with 'fully_paid'
-- Note: MySQL doesn't support direct enum modification, so we need to alter the column
ALTER TABLE `sales` 
MODIFY COLUMN `payment_type` ENUM('fully_paid','recurring','installments') DEFAULT NULL;

