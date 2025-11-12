-- Create notifications table for aggregated notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    related_user_id INT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add notifications permissions
INSERT INTO permissions (module, action)
SELECT 'notifications', 'read'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'notifications' AND action = 'read'
);

INSERT INTO permissions (module, action)
SELECT 'notifications', 'update'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'notifications' AND action = 'update'
);

INSERT INTO permissions (module, action)
SELECT 'notifications', 'delete'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'notifications' AND action = 'delete'
);

INSERT INTO permissions (module, action)
SELECT 'notifications', 'view'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module = 'notifications' AND action = 'view'
);

-- Assign notifications permissions to all roles (everyone can view their notifications)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.module = 'notifications' AND p.action IN ('read', 'update', 'view')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Assign delete permission only to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p
WHERE p.module = 'notifications' AND p.action = 'delete'
ON DUPLICATE KEY UPDATE role_id = role_id;






