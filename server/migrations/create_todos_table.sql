-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date)
);

-- Add permissions for todos
INSERT INTO permissions (module, action) VALUES
('todos', 'create'),
('todos', 'read'),
('todos', 'update'),
('todos', 'delete'),
('todos', 'view')
ON DUPLICATE KEY UPDATE module = module;

-- Assign todos permissions to all roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('admin', 'upseller', 'upseller manager', 'sales', 'front-sales-manager', 'lead-scraper') 
AND p.module = 'todos'
ON DUPLICATE KEY UPDATE role_id = role_id;
