-- Create monthly lead statistics table
CREATE TABLE IF NOT EXISTS monthly_lead_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    leads_added INT DEFAULT 0,
    leads_converted INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_month (user_id, year, month)
);

-- Create lead tracking table for real-time stats
CREATE TABLE IF NOT EXISTS lead_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lead_id INT NOT NULL,
    action ENUM('created', 'converted') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    -- Note: No foreign key constraint on lead_id since leads get deleted after conversion
);

-- Create index for better performance
CREATE INDEX idx_lead_tracking_user_date ON lead_tracking(user_id, created_at);
CREATE INDEX idx_monthly_stats_user_date ON monthly_lead_stats(user_id, year, month);
