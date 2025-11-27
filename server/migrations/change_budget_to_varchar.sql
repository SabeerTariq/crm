-- Change budget column from DECIMAL to VARCHAR to store as string
ALTER TABLE leads
MODIFY COLUMN budget VARCHAR(255) NULL;

