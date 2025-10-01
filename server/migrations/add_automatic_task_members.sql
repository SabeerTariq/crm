-- Add automatic members to existing tasks
-- This migration adds task creator and department lead as members to existing tasks

-- Add task creator as collaborator for all existing tasks
INSERT INTO `task_members` (`task_id`, `user_id`, `role`, `assigned_by`, `assigned_at`)
SELECT 
  pt.id as task_id,
  pt.created_by as user_id,
  'collaborator' as role,
  pt.created_by as assigned_by,
  pt.created_at as assigned_at
FROM `project_tasks` pt
WHERE pt.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM `task_members` tm 
  WHERE tm.task_id = pt.id AND tm.user_id = pt.created_by
);

-- Add department lead as reviewer for all existing tasks
INSERT INTO `task_members` (`task_id`, `user_id`, `role`, `assigned_by`, `assigned_at`)
SELECT 
  pt.id as task_id,
  dtm.user_id,
  'reviewer' as role,
  pt.created_by as assigned_by,
  pt.created_at as assigned_at
FROM `project_tasks` pt
JOIN `department_team_members` dtm ON pt.department_id = dtm.department_id
WHERE dtm.role = 'team_leader' 
AND dtm.is_active = 1
AND dtm.user_id != pt.created_by
AND NOT EXISTS (
  SELECT 1 FROM `task_members` tm 
  WHERE tm.task_id = pt.id AND tm.user_id = dtm.user_id
);

-- Add assigned_to as assignee for tasks that have assigned_to
INSERT INTO `task_members` (`task_id`, `user_id`, `role`, `assigned_by`, `assigned_at`)
SELECT 
  pt.id as task_id,
  pt.assigned_to as user_id,
  'assignee' as role,
  pt.created_by as assigned_by,
  pt.created_at as assigned_at
FROM `project_tasks` pt
WHERE pt.assigned_to IS NOT NULL
AND pt.assigned_to != pt.created_by
AND NOT EXISTS (
  SELECT 1 FROM `task_members` tm 
  WHERE tm.task_id = pt.id AND tm.user_id = pt.assigned_to
);
