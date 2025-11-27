-- Add nature of business and business description fields to leads table
ALTER TABLE leads 
ADD COLUMN nature_of_business VARCHAR(255) NULL AFTER company_name,
ADD COLUMN business_description TEXT NULL AFTER business_email;

