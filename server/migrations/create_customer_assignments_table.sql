-- Create customer_assignments table
-- This table manages the assignment of customers to upsellers

CREATE TABLE IF NOT EXISTS customer_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    upseller_id INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_type ENUM('territory', 'product', 'manual', 'performance') DEFAULT 'manual',
    status ENUM('active', 'inactive', 'transferred') DEFAULT 'active',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (upseller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one active assignment per customer
    UNIQUE KEY unique_active_customer (customer_id, status),
    
    -- Indexes for performance
    INDEX idx_customer_id (customer_id),
    INDEX idx_upseller_id (upseller_id),
    INDEX idx_assignment_type (assignment_type),
    INDEX idx_status (status),
    INDEX idx_assigned_date (assigned_date)
);

-- Add assignment permissions
INSERT INTO permissions (module, action) VALUES 
('assignments', 'create'),
('assignments', 'read'),
('assignments', 'update'),
('assignments', 'delete'),
('assignments', 'view')
ON DUPLICATE KEY UPDATE module = module;

-- Assign assignment permissions to upseller role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 5, id FROM permissions WHERE module = 'assignments'
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign assignment permissions to admin role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions WHERE module = 'assignments'
ON DUPLICATE KEY UPDATE role_id = role_id;
