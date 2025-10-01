-- Create task_statuses table for custom task statuses
CREATE TABLE IF NOT EXISTS task_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(100) NOT NULL UNIQUE,
    status_color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
    status_order INT DEFAULT 0, -- For ordering columns
    is_default BOOLEAN DEFAULT FALSE, -- Default system statuses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default statuses (matching current ENUM values)
INSERT INTO task_statuses (status_name, status_color, status_order, is_default) VALUES
('pending', '#6B7280', 1, TRUE),
('in_progress', '#3B82F6', 2, TRUE),
('review', '#F59E0B', 3, TRUE),
('completed', '#10B981', 4, TRUE),
('blocked', '#EF4444', 5, TRUE);

-- First, modify the status column to VARCHAR to allow custom statuses
ALTER TABLE project_tasks 
MODIFY COLUMN status VARCHAR(100) DEFAULT 'pending';

-- Add foreign key constraint to project_tasks table
ALTER TABLE project_tasks 
ADD CONSTRAINT fk_task_status 
FOREIGN KEY (status) REFERENCES task_statuses(status_name) 
ON UPDATE CASCADE ON DELETE RESTRICT;
