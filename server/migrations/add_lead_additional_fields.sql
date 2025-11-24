-- Add new fields to leads table
ALTER TABLE leads 
ADD COLUMN budget DECIMAL(10, 2) NULL AFTER notes,
ADD COLUMN hours_type ENUM('Rush hours', 'Normal hours') NULL AFTER budget,
ADD COLUMN lead_picked_time TIME NULL AFTER hours_type,
ADD COLUMN day_type ENUM('Weekend', 'Weekdays') NULL AFTER lead_picked_time;

-- Update source column to be more specific (keeping existing data)
-- Note: The source field already exists, we'll just update the frontend to use dropdown

