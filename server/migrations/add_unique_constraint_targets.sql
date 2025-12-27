-- Add unique constraint to prevent duplicate targets for the same user, year, and month
ALTER TABLE targets 
ADD UNIQUE KEY unique_user_year_month (user_id, target_year, target_month);

