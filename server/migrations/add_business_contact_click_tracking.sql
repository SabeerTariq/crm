-- Add click tracking columns for business email and business phone
ALTER TABLE leads 
ADD COLUMN business_email_clicks INT DEFAULT 0 AFTER business_email,
ADD COLUMN business_number_clicks INT DEFAULT 0 AFTER business_number;

