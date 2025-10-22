-- Create chargeback_refunds table to track chargebacks and refunds
CREATE TABLE IF NOT EXISTS chargeback_refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    sale_id INT NOT NULL,
    type ENUM('chargeback', 'refund', 'retained') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    original_amount DECIMAL(12,2) NOT NULL COMMENT 'Original payment amount',
    refund_type ENUM('full', 'partial') DEFAULT 'full',
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_sale_id (sale_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Add chargeback_refund_id to payment_transactions for tracking
ALTER TABLE payment_transactions 
ADD COLUMN chargeback_refund_id INT NULL,
ADD FOREIGN KEY (chargeback_refund_id) REFERENCES chargeback_refunds(id) ON DELETE SET NULL;

-- Add index for the new foreign key
ALTER TABLE payment_transactions 
ADD INDEX idx_chargeback_refund_id (chargeback_refund_id);

-- Add customer status field to customers table if it doesn't exist
ALTER TABLE customers 
ADD COLUMN customer_status ENUM('active', 'chargeback', 'refunded', 'retained') DEFAULT 'active';

-- Add index for customer status
ALTER TABLE customers 
ADD INDEX idx_customer_status (customer_status);

-- Create audit log table for chargeback/refund actions
CREATE TABLE IF NOT EXISTS chargeback_refund_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chargeback_refund_id INT NOT NULL,
    action ENUM('created', 'updated', 'status_changed', 'processed') NOT NULL,
    old_values JSON,
    new_values JSON,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chargeback_refund_id) REFERENCES chargeback_refunds(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_chargeback_refund_id (chargeback_refund_id),
    INDEX idx_action (action),
    INDEX idx_performed_at (performed_at)
);
