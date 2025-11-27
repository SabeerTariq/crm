-- Add business email and business number fields to leads table
ALTER TABLE leads 
ADD COLUMN business_email VARCHAR(100) NULL AFTER email,
ADD COLUMN business_number VARCHAR(20) NULL AFTER phone;

