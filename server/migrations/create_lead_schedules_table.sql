-- Create lead_schedules table for multiple schedules per lead
CREATE TABLE IF NOT EXISTS lead_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  scheduled_by INT NOT NULL,
  schedule_date DATE NOT NULL,
  schedule_time TIME NULL,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (scheduled_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_lead_schedule (lead_id, scheduled_by)
);

-- Migrate existing schedule data to the new table
INSERT INTO lead_schedules (lead_id, scheduled_by, schedule_date, schedule_time, scheduled_at)
SELECT id, scheduled_by, schedule_date, schedule_time, scheduled_at
FROM leads 
WHERE scheduled_by IS NOT NULL AND schedule_date IS NOT NULL;

-- Remove foreign key constraint first
ALTER TABLE leads DROP FOREIGN KEY leads_ibfk_2;

-- Remove schedule columns from leads table
ALTER TABLE leads DROP COLUMN scheduled_by;
ALTER TABLE leads DROP COLUMN schedule_date;
ALTER TABLE leads DROP COLUMN schedule_time;
ALTER TABLE leads DROP COLUMN schedule_notes;
ALTER TABLE leads DROP COLUMN scheduled_at;
