-- Create reminders table for user personal reminders
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date DATE NOT NULL,
    reminder_time TIME,
    is_all_day BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_reminder_date (reminder_date),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
);

-- Add reminders permissions
INSERT INTO permissions (module, action) VALUES 
('reminders', 'create'),
('reminders', 'read'),
('reminders', 'update'),
('reminders', 'delete'),
('reminders', 'view');

-- Assign reminders permissions to roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('Admin', 'Upseller', 'Front Sales Manager', 'Sales', 'Upseller Manager')
AND p.module = 'reminders' AND p.action IN ('create', 'read', 'update', 'delete', 'view');












