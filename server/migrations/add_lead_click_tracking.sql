-- Add click tracking columns to leads table
ALTER TABLE leads 
ADD COLUMN phone_clicks INT DEFAULT 0 AFTER phone,
ADD COLUMN email_clicks INT DEFAULT 0 AFTER email;

