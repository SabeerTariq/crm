-- Create follow_ups table for storing leads added to user's follow-up menu
CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  note TEXT,
  follow_up_date DATE,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_lead_followup (lead_id, user_id)
);

-- Add index for faster queries
CREATE INDEX idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);
CREATE INDEX idx_follow_ups_date ON follow_ups(follow_up_date);

-- Add permissions for follow_ups
INSERT INTO permissions (module, action) VALUES 
('follow_ups', 'create'),
('follow_ups', 'read'),
('follow_ups', 'update'),
('follow_ups', 'delete'),
('follow_ups', 'view')
ON DUPLICATE KEY UPDATE module=module;

-- Assign follow_ups permissions to roles
-- Admin and managers can see all follow-ups, regular users can see their own
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('admin', 'sales', 'upseller', 'front-sales-manager', 'upseller-manager', 'lead-scraper') 
AND p.module = 'follow_ups'
ON DUPLICATE KEY UPDATE role_id=role_id;

