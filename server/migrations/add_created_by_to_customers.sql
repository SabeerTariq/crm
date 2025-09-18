-- Add created_by column to customers table
-- This column will track which user created each customer record

ALTER TABLE customers 
ADD COLUMN created_by INT(11) NULL AFTER assigned_to,
ADD INDEX idx_created_by (created_by),
ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update existing records to set created_by to assigned_to if available
-- This assumes the assigned_to user was the one who created the customer
UPDATE customers 
SET created_by = assigned_to 
WHERE assigned_to IS NOT NULL AND created_by IS NULL;
