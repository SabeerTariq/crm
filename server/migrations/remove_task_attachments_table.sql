-- Remove task_attachments table since we're using unified project attachments
-- This migration removes the separate task_attachments table

-- Drop the task_attachments table
DROP TABLE IF EXISTS `task_attachments`;

-- Note: All task attachments are now stored in project_attachments table
-- and are shared between project and all its tasks
