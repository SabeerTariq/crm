const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const checkCustomerAssignment = require('../middleware/checkCustomerAssignment');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const TaskService = require('../services/taskService');

// Get all tasks (for task management board)
router.get('/', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const {
      project_id,
      department_id,
      status,
      priority,
      assigned_to,
      search
    } = req.query;

    const filters = {
      project_id: project_id ? parseInt(project_id) : null,
      department_id: department_id ? parseInt(department_id) : null,
      status,
      priority,
      assigned_to: assigned_to ? parseInt(assigned_to) : null,
      search
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const tasks = await TaskService.getAllTasks(filters);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Get all tasks for a project
router.get('/project/:projectId', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const {
      department_id,
      status,
      priority,
      assigned_to,
      search
    } = req.query;

    const filters = {
      department_id: department_id ? parseInt(department_id) : null,
      status,
      priority,
      assigned_to: assigned_to ? parseInt(assigned_to) : null,
      search
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const tasks = await TaskService.getProjectTasks(projectId, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ message: 'Error fetching project tasks' });
  }
});

// Get task by ID
router.get('/:id', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await TaskService.getTaskById(taskId);
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Create new task
router.post('/', auth, authorize('tasks', 'create'), async (req, res) => {
  try {
    const {
      project_id,
      department_id,
      task_name,
      description,
      priority = 'medium',
      assigned_to,
      due_date,
      estimated_hours
    } = req.body;

    if (!project_id || !department_id || !task_name) {
      return res.status(400).json({ message: 'Project ID, department ID, and task name are required' });
    }

    const taskData = {
      project_id,
      department_id,
      task_name,
      description,
      priority,
      assigned_to,
      created_by: req.user.id,
      due_date,
      estimated_hours
    };

    const taskId = await TaskService.createTask(taskData);
    
    res.status(201).json({
      message: 'Task created successfully',
      task_id: taskId
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.put('/:id', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = req.body;

    const success = await TaskService.updateTask(taskId, updateData);
    
    if (success) {
      res.json({ message: 'Task updated successfully' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', auth, authorize('tasks', 'delete'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const success = await TaskService.deleteTask(taskId);
    
    if (success) {
      res.json({ message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Get tasks assigned to current user
router.get('/my/tasks', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const {
      status,
      priority,
      project_id
    } = req.query;

    const filters = {
      status,
      priority,
      project_id: project_id ? parseInt(project_id) : null
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const tasks = await TaskService.getUserTasks(req.user.id, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Error fetching user tasks' });
  }
});

// Get tasks by department
router.get('/department/:departmentId', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const {
      status,
      project_id
    } = req.query;

    const filters = {
      status,
      project_id: project_id ? parseInt(project_id) : null
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const tasks = await TaskService.getDepartmentTasks(departmentId, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching department tasks:', error);
    res.status(500).json({ message: 'Error fetching department tasks' });
  }
});

// Add comment to task
router.post('/:id/comments', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const commentId = await TaskService.addTaskComment(taskId, req.user.id, comment);
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment_id: commentId
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Get task comments
router.get('/:id/comments', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const comments = await TaskService.getTaskComments(taskId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ message: 'Error fetching task comments' });
  }
});

// Add attachment to task (using project attachments)
router.post('/:id/attachments', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get the project_id for this task first
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Set the project_id in the request for the upload middleware
    req.projectId = task.project_id;
    
    // Use the upload middleware
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return handleUploadError(err, req, res, () => {});
      }
      
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const attachmentIds = [];

      // Process each uploaded file using project attachments
      for (const file of files) {
        const attachmentData = {
          file_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          file_type: file.mimetype,
          uploaded_by: req.user.id
        };

        const attachmentId = await TaskService.addTaskAttachment(taskId, attachmentData);
        attachmentIds.push(attachmentId);
      }
      
      // Log activity
      await TaskService.addActivityLog(taskId, req.user.id, 'attachment_added', `Added ${files.length} attachment(s)`);
      
      res.status(201).json({
        message: `${files.length} attachment(s) added successfully`,
        attachment_ids: attachmentIds
      });
    });
    
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ message: 'Error adding attachment' });
  }
});

// Get task attachments
router.get('/:id/attachments', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachments = await TaskService.getTaskAttachments(taskId);
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    res.status(500).json({ message: 'Error fetching task attachments' });
  }
});

// Download task attachment (using project attachments)
router.get('/:id/attachments/:attachmentId/download', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const { id: taskId, attachmentId } = req.params;
    const attachments = await TaskService.getTaskAttachments(taskId);
    const attachment = attachments.find(att => att.id == attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    let filePath = attachment.file_path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, '..', filePath);
    }
    const normalizedPath = path.normalize(filePath);

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    
    const fileStream = fs.createReadStream(normalizedPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error downloading file' });
    });
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Get project task statistics
router.get('/project/:projectId/stats', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const stats = await TaskService.getProjectTaskStats(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching project task stats:', error);
    res.status(500).json({ message: 'Error fetching project task statistics' });
  }
});

// Get user task statistics
router.get('/my/stats', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const stats = await TaskService.getUserTaskStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user task stats:', error);
    res.status(500).json({ message: 'Error fetching user task statistics' });
  }
});

// Add checklist to task
router.post('/:id/checklists', auth, authorize('task_checklists', 'create'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Checklist title is required' });
    }

    const checklistId = await TaskService.addTaskChecklist(taskId, title, req.user.id);
    
    // Log activity
    await TaskService.addActivityLog(taskId, req.user.id, 'checklist_created', `Created checklist: ${title}`);
    
    res.status(201).json({
      message: 'Checklist created successfully',
      checklist_id: checklistId
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ message: 'Error creating checklist' });
  }
});

// Get task checklists
router.get('/:id/checklists', auth, authorize('task_checklists', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const checklists = await TaskService.getTaskChecklists(taskId);
    
    // Get items for each checklist
    const checklistsWithItems = await Promise.all(
      checklists.map(async (checklist) => {
        const items = await TaskService.getChecklistItems(checklist.id);
        return { ...checklist, items };
      })
    );
    
    res.json(checklistsWithItems);
  } catch (error) {
    console.error('Error fetching task checklists:', error);
    res.status(500).json({ message: 'Error fetching task checklists' });
  }
});

// Add checklist item
router.post('/checklists/:checklistId/items', auth, authorize('task_checklists', 'create'), async (req, res) => {
  try {
    const checklistId = req.params.checklistId;
    const { item_text } = req.body;

    if (!item_text) {
      return res.status(400).json({ message: 'Item text is required' });
    }

    const itemId = await TaskService.addChecklistItem(checklistId, item_text);
    
    res.status(201).json({
      message: 'Checklist item added successfully',
      item_id: itemId
    });
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ message: 'Error adding checklist item' });
  }
});

// Toggle checklist item completion
router.put('/checklist-items/:itemId/toggle', auth, authorize('task_checklists', 'update'), async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { is_completed } = req.body;

    const success = await TaskService.toggleChecklistItem(itemId, is_completed, req.user.id);
    
    if (success) {
      res.json({ message: 'Checklist item updated successfully' });
    } else {
      res.status(404).json({ message: 'Checklist item not found' });
    }
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    res.status(500).json({ message: 'Error updating checklist item' });
  }
});

// Get task activity logs
router.get('/:id/activity', auth, authorize('task_activity', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const activityLogs = await TaskService.getTaskActivityLogs(taskId);
    res.json(activityLogs);
  } catch (error) {
    console.error('Error fetching task activity logs:', error);
    res.status(500).json({ message: 'Error fetching task activity logs' });
  }
});

// Add member to task
router.post('/:id/members', auth, authorize('task_members', 'create'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }

    const validRoles = ['assignee', 'collaborator', 'reviewer', 'observer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: assignee, collaborator, reviewer, observer' });
    }

    const result = await TaskService.addTaskMember(taskId, user_id, role, req.user.id);
    
    // Log activity
    await TaskService.addActivityLog(taskId, req.user.id, 'member_added', `Added member with role: ${role}`);
    
    res.status(201).json({
      message: 'Member added successfully',
      member_id: result
    });
  } catch (error) {
    console.error('Error adding task member:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User is already a member of this task' });
    }
    res.status(500).json({ message: 'Error adding task member' });
  }
});

// Get task members
router.get('/:id/members', auth, authorize('task_members', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const members = await TaskService.getTaskMembers(taskId);
    res.json(members);
  } catch (error) {
    console.error('Error fetching task members:', error);
    res.status(500).json({ message: 'Error fetching task members' });
  }
});

// Update task member role
router.put('/members/:memberId/role', auth, authorize('task_members', 'update'), async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const validRoles = ['assignee', 'collaborator', 'reviewer', 'observer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: assignee, collaborator, reviewer, observer' });
    }

    const success = await TaskService.updateTaskMemberRole(memberId, role);
    
    if (success) {
      // Log activity
      await TaskService.addActivityLog(req.body.task_id, req.user.id, 'member_role_updated', `Updated member role to: ${role}`);
      res.json({ message: 'Member role updated successfully' });
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Error updating member role' });
  }
});

// Remove member from task
router.delete('/members/:memberId', auth, authorize('task_members', 'delete'), async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const success = await TaskService.removeTaskMember(memberId);
    
    if (success) {
      // Log activity
      await TaskService.addActivityLog(req.body.task_id, req.user.id, 'member_removed', 'Removed member from task');
      res.json({ message: 'Member removed successfully' });
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (error) {
    console.error('Error removing task member:', error);
    res.status(500).json({ message: 'Error removing task member' });
  }
});

// Get available users for task assignment
router.get('/:id/available-users', auth, authorize('task_members', 'read'), async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get task details to get department_id
    const task = await TaskService.getTaskById(taskId);
    const availableUsers = await TaskService.getAvailableUsersForTask(task.department_id);
    
    res.json(availableUsers);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Error fetching available users' });
  }
});

// Get tasks by department (for department leaders)
router.get('/department/:departmentId', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const tasks = await TaskService.getTasksByDepartment(departmentId);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching department tasks:', error);
    res.status(500).json({ message: 'Error fetching department tasks' });
  }
});

// Assign task to department member
router.post('/:id/assign', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assigned_to } = req.body;
    
    // Get the task
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update task assignment
    await TaskService.updateTask(taskId, { assigned_to });
    
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Error assigning task' });
  }
});

module.exports = router;
