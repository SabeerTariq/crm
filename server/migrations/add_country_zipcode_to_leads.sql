-- Add country and zip_code columns to leads table
ALTER TABLE leads
ADD COLUMN country VARCHAR(100) NULL AFTER state,
ADD COLUMN zip_code VARCHAR(20) NULL AFTER country;

