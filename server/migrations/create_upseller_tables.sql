-- Create upseller teams table
CREATE TABLE IF NOT EXISTS upseller_teams (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INT(11),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create upseller team members table
CREATE TABLE IF NOT EXISTS upseller_team_members (
  id INT(11) NOT NULL AUTO_INCREMENT,
  team_id INT(11) NOT NULL,
  user_id INT(11) NOT NULL,
  role ENUM('leader', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (team_id) REFERENCES upseller_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_user (team_id, user_id)
);

-- Create upseller targets table
CREATE TABLE IF NOT EXISTS upseller_targets (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11),
  target_value DECIMAL(10,2) NOT NULL,
  target_month INT(11) NOT NULL,
  target_year INT(11) NOT NULL,
  created_by INT(11),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_month_year (user_id, target_month, target_year)
);

-- Create upseller performance metrics table
CREATE TABLE IF NOT EXISTS upseller_performance (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  team_id INT(11),
  metric_type ENUM('customers_assigned', 'sales_generated', 'revenue_generated', 'conversion_rate') NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  period_month INT(11) NOT NULL,
  period_year INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES upseller_teams(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_metric_period (user_id, metric_type, period_month, period_year)
);
