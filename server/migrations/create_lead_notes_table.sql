-- Create lead_notes table for storing notes added by users
CREATE TABLE IF NOT EXISTS lead_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  user_id INT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add permissions for lead_notes
INSERT INTO permissions (module, action) VALUES 
('lead_notes', 'create'),
('lead_notes', 'read'),
('lead_notes', 'update'),
('lead_notes', 'delete'),
('lead_notes', 'view');

-- Assign lead_notes permissions to roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('admin', 'sales', 'upseller', 'front-sales-manager') 
AND p.module = 'lead_notes';


