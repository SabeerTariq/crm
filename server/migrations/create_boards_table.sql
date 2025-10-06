-- Create boards table for department-specific Kanban boards
CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Add board_id column to project_tasks table
ALTER TABLE project_tasks 
ADD COLUMN board_id INT DEFAULT NULL,
ADD CONSTRAINT fk_tasks_board 
FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL;

-- Create default boards for existing departments
INSERT INTO boards (board_name, department_id, description, is_default, created_by)
SELECT 
    CONCAT(d.department_name, ' Board') as board_name,
    d.id as department_id,
    CONCAT('Default Kanban board for ', d.department_name, ' department') as description,
    TRUE as is_default,
    1 as created_by
FROM departments d;

-- Update existing tasks to use default boards based on their department
UPDATE project_tasks pt
JOIN boards b ON pt.department_id = b.department_id AND b.is_default = TRUE
SET pt.board_id = b.id;


