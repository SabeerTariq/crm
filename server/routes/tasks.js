const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const checkCustomerAssignment = require('../middleware/checkCustomerAssignment');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const TaskService = require('../services/taskService');
const NotificationService = require('../services/notificationService');

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
    
    // Create notifications for task creation
    try {
      const createdTask = await TaskService.getTaskById(taskId);
      const creatorName = req.user.name || 'Someone';
      
      // Notify assigned user (if assigned)
      if (assigned_to && assigned_to !== req.user.id) {
        await NotificationService.createNotification({
          user_id: assigned_to,
          type: 'task_created',
          title: `New task assigned: ${task_name}`,
          message: `${creatorName} created and assigned you a new task`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: priority === 'urgent' || priority === 'high' ? 'high' : 'medium'
        });
      }

      // Notify project manager (if project exists)
      if (project_id) {
        const db = require('../db');
        const projectQuery = 'SELECT project_manager FROM projects WHERE id = ?';
        db.query(projectQuery, [project_id], async (err, projectRows) => {
          if (!err && projectRows.length > 0 && projectRows[0].project_manager) {
            const projectManagerId = projectRows[0].project_manager;
            if (projectManagerId !== req.user.id && projectManagerId !== assigned_to) {
              try {
                await NotificationService.createNotification({
                  user_id: projectManagerId,
                  type: 'task_created',
                  title: `New task created: ${task_name}`,
                  message: `${creatorName} created a new task in your project`,
                  entity_type: 'task',
                  entity_id: taskId,
                  related_user_id: req.user.id,
                  priority: 'medium'
                });
              } catch (notifErr) {
                console.error('Error creating notification for project manager:', notifErr);
              }
            }
          }
        });
      }
    } catch (notifError) {
      console.error('Error creating task creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }
    
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
    const userId = req.user.id;

    // Get current task data before update to check if status changed
    const currentTask = await TaskService.getTaskById(taskId);
    const oldStatus = currentTask ? currentTask.status : null;
    const newStatus = updateData.status;

    const success = await TaskService.updateTask(taskId, updateData);
    
    if (success) {
      // If status changed, create notifications
      if (newStatus && oldStatus && newStatus !== oldStatus) {
        try {
          // Get updated task data
          const updatedTask = await TaskService.getTaskById(taskId);
          
          if (updatedTask) {
            // Get status name for display
            const statusName = newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Get user who made the change
            const changerName = req.user.name || 'Someone';
            
            // Special handling for task completion
            if (newStatus === 'completed' || newStatus === 'Completed') {
              // Notify task assignee (if assigned and not the person making the change)
              if (updatedTask.assigned_to && updatedTask.assigned_to !== userId) {
                await NotificationService.createNotification({
                  user_id: updatedTask.assigned_to,
                  type: 'task_completed',
                  title: `Task completed: ${updatedTask.task_name}`,
                  message: `${changerName} marked this task as completed`,
                  entity_type: 'task',
                  entity_id: taskId,
                  related_user_id: userId,
                  priority: 'high'
                });
              }
              
              // Notify task creator (if not the person making the change and not the assignee)
              if (updatedTask.created_by && updatedTask.created_by !== userId && updatedTask.created_by !== updatedTask.assigned_to) {
                await NotificationService.createNotification({
                  user_id: updatedTask.created_by,
                  type: 'task_completed',
                  title: `Task completed: ${updatedTask.task_name}`,
                  message: `${changerName} marked this task as completed`,
                  entity_type: 'task',
                  entity_id: taskId,
                  related_user_id: userId,
                  priority: 'high'
                });
              }
            } else {
              // Regular status change notification
              // Notify task assignee (if assigned and not the person making the change)
              if (updatedTask.assigned_to && updatedTask.assigned_to !== userId) {
                await NotificationService.createNotification({
                  user_id: updatedTask.assigned_to,
                  type: 'task_status_change',
                  title: `Task status changed: ${updatedTask.task_name}`,
                  message: `${changerName} changed the status from "${oldStatus.replace('_', ' ')}" to "${statusName}"`,
                  entity_type: 'task',
                  entity_id: taskId,
                  related_user_id: userId,
                  priority: 'medium'
                });
              }
            }

            // Notify task creator for regular status changes (not completion, handled above)
            if (newStatus !== 'completed' && newStatus !== 'Completed' && 
                updatedTask.created_by && updatedTask.created_by !== userId && updatedTask.created_by !== updatedTask.assigned_to) {
              await NotificationService.createNotification({
                user_id: updatedTask.created_by,
                type: 'task_status_change',
                title: `Task status changed: ${updatedTask.task_name}`,
                message: `${changerName} changed the status from "${oldStatus.replace('_', ' ')}" to "${statusName}"`,
                entity_type: 'task',
                entity_id: taskId,
                related_user_id: userId,
                priority: 'medium'
              });
            }

            // Notify project manager (if project exists and manager is different)
            if (updatedTask.project_id) {
              const db = require('../db');
              const projectQuery = 'SELECT project_manager FROM projects WHERE id = ?';
              db.query(projectQuery, [updatedTask.project_id], async (err, projectRows) => {
                if (!err && projectRows.length > 0 && projectRows[0].project_manager) {
                  const projectManagerId = projectRows[0].project_manager;
                  // Only notify if manager is different from changer, assignee, and creator
                  if (projectManagerId !== userId && 
                      projectManagerId !== updatedTask.assigned_to && 
                      projectManagerId !== updatedTask.created_by) {
                    try {
                      await NotificationService.createNotification({
                        user_id: projectManagerId,
                        type: 'task_status_change',
                        title: `Task status changed: ${updatedTask.task_name}`,
                        message: `${changerName} changed the status from "${oldStatus.replace('_', ' ')}" to "${statusName}"`,
                        entity_type: 'task',
                        entity_id: taskId,
                        related_user_id: userId,
                        priority: newStatus === 'completed' ? 'high' : 'medium'
                      });
                    } catch (notifErr) {
                      console.error('Error creating notification for project manager:', notifErr);
                    }
                  }
                }
              });
            }

            // Notify department leader (if department exists and leader is different)
            if (updatedTask.department_id) {
              const db = require('../db');
              const deptQuery = `
                SELECT u.id 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.department_id = ? 
                AND r.name LIKE '%lead%'
                LIMIT 1
              `;
              db.query(deptQuery, [updatedTask.department_id], async (err, deptRows) => {
                if (!err && deptRows.length > 0) {
                  const deptLeaderId = deptRows[0].id;
                  // Only notify if leader is different from changer, assignee, creator, and project manager
                  if (deptLeaderId !== userId && 
                      deptLeaderId !== updatedTask.assigned_to && 
                      deptLeaderId !== updatedTask.created_by) {
                    try {
                      await NotificationService.createNotification({
                        user_id: deptLeaderId,
                        type: 'task_status_change',
                        title: `Task status changed: ${updatedTask.task_name}`,
                        message: `${changerName} changed the status from "${oldStatus.replace('_', ' ')}" to "${statusName}"`,
                        entity_type: 'task',
                        entity_id: taskId,
                        related_user_id: userId,
                        priority: newStatus === 'completed' ? 'high' : 'medium'
                      });
                    } catch (notifErr) {
                      console.error('Error creating notification for department leader:', notifErr);
                    }
                  }
                }
              });
            }
          }
        } catch (notifError) {
          console.error('Error creating status change notifications:', notifError);
          // Don't fail the request if notifications fail
        }
      }

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
    
    // Create notifications for comment
    try {
      const task = await TaskService.getTaskById(taskId);
      const commenterName = req.user.name || 'Someone';
      const commentPreview = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
      
      // Notify task assignee (if assigned and not the commenter)
      if (task.assigned_to && task.assigned_to !== req.user.id) {
        await NotificationService.createNotification({
          user_id: task.assigned_to,
          type: 'task_comment',
          title: `New comment on task: ${task.task_name}`,
          message: `${commenterName}: ${commentPreview}`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: 'medium'
        });
      }

      // Notify task creator (if not the commenter and not the assignee)
      if (task.created_by && task.created_by !== req.user.id && task.created_by !== task.assigned_to) {
        await NotificationService.createNotification({
          user_id: task.created_by,
          type: 'task_comment',
          title: `New comment on task: ${task.task_name}`,
          message: `${commenterName}: ${commentPreview}`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: 'medium'
        });
      }
    } catch (notifError) {
      console.error('Error creating comment notifications:', notifError);
      // Don't fail the request if notifications fail
    }
    
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
    
    // Create notifications for checklist creation
    try {
      const task = await TaskService.getTaskById(taskId);
      const creatorName = req.user.name || 'Someone';
      
      // Notify task assignee (if assigned and not the creator)
      if (task.assigned_to && task.assigned_to !== req.user.id) {
        await NotificationService.createNotification({
          user_id: task.assigned_to,
          type: 'checklist_added',
          title: `Checklist added to task: ${task.task_name}`,
          message: `${creatorName} added a checklist: "${title}"`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: 'medium'
        });
      }

      // Notify task creator (if not the creator and not the assignee)
      if (task.created_by && task.created_by !== req.user.id && task.created_by !== task.assigned_to) {
        await NotificationService.createNotification({
          user_id: task.created_by,
          type: 'checklist_added',
          title: `Checklist added to task: ${task.task_name}`,
          message: `${creatorName} added a checklist: "${title}"`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: 'medium'
        });
      }
    } catch (notifError) {
      console.error('Error creating checklist notifications:', notifError);
      // Don't fail the request if notifications fail
    }
    
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
      // Check if checklist is complete (all items completed)
      if (is_completed) {
        try {
          // Get checklist ID from item
          const db = require('../db');
          const itemQuery = 'SELECT checklist_id FROM task_checklist_items WHERE id = ?';
          db.query(itemQuery, [itemId], async (err, itemRows) => {
            if (!err && itemRows.length > 0) {
              const checklistId = itemRows[0].checklist_id;
              
              // Get all items for this checklist
              const items = await TaskService.getChecklistItems(checklistId);
              const allCompleted = items.length > 0 && items.every(item => item.is_completed);
              
              if (allCompleted) {
                // Get checklist and task info
                const checklistQuery = 'SELECT task_id, title FROM task_checklists WHERE id = ?';
                db.query(checklistQuery, [checklistId], async (err, checklistRows) => {
                  if (!err && checklistRows.length > 0) {
                    const taskId = checklistRows[0].task_id;
                    const checklistTitle = checklistRows[0].title;
                    const task = await TaskService.getTaskById(taskId);
                    const completerName = req.user.name || 'Someone';
                    
                    // Notify task assignee (if assigned and not the completer)
                    if (task.assigned_to && task.assigned_to !== req.user.id) {
                      await NotificationService.createNotification({
                        user_id: task.assigned_to,
                        type: 'checklist_complete',
                        title: `Checklist completed: ${task.task_name}`,
                        message: `${completerName} completed the checklist "${checklistTitle}"`,
                        entity_type: 'task',
                        entity_id: taskId,
                        related_user_id: req.user.id,
                        priority: 'medium'
                      });
                    }

                    // Notify task creator (if not the completer and not the assignee)
                    if (task.created_by && task.created_by !== req.user.id && task.created_by !== task.assigned_to) {
                      await NotificationService.createNotification({
                        user_id: task.created_by,
                        type: 'checklist_complete',
                        title: `Checklist completed: ${task.task_name}`,
                        message: `${completerName} completed the checklist "${checklistTitle}"`,
                        entity_type: 'task',
                        entity_id: taskId,
                        related_user_id: req.user.id,
                        priority: 'medium'
                      });
                    }
                  }
                });
              }
            }
          });
        } catch (notifError) {
          console.error('Error creating checklist complete notifications:', notifError);
          // Don't fail the request if notifications fail
        }
      }
      
      res.json({ message: 'Checklist item updated successfully' });
    } else {
      res.status(404).json({ message: 'Checklist item not found' });
    }
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    res.status(500).json({ message: 'Error updating checklist item' });
  }
});

// Update checklist
router.put('/checklists/:checklistId', auth, authorize('task_checklists', 'update'), async (req, res) => {
  try {
    const checklistId = req.params.checklistId;
    const { title, task_id } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Checklist title is required' });
    }

    const success = await TaskService.updateChecklist(checklistId, title);
    
    if (success) {
      // Log activity if task_id is provided
      if (task_id) {
        await TaskService.addActivityLog(task_id, req.user.id, 'checklist_updated', `Updated checklist: ${title}`);
      }
      
      res.json({ message: 'Checklist updated successfully' });
    } else {
      res.status(404).json({ message: 'Checklist not found' });
    }
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ message: 'Error updating checklist' });
  }
});

// Delete checklist
router.delete('/checklists/:checklistId', auth, authorize('task_checklists', 'delete'), async (req, res) => {
  try {
    const checklistId = req.params.checklistId;
    const { task_id } = req.body;
    
    // Get checklist info before deleting for activity log
    let checklistTitle = '';
    if (task_id) {
      const checklists = await TaskService.getTaskChecklists(task_id);
      const checklist = checklists.find(c => c.id === parseInt(checklistId));
      if (checklist) {
        checklistTitle = checklist.title;
      }
    }
    
    const success = await TaskService.deleteChecklist(checklistId);
    
    if (success) {
      if (task_id && checklistTitle) {
        await TaskService.addActivityLog(task_id, req.user.id, 'checklist_deleted', `Deleted checklist: ${checklistTitle}`);
      }
      res.json({ message: 'Checklist deleted successfully' });
    } else {
      res.status(404).json({ message: 'Checklist not found' });
    }
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ message: 'Error deleting checklist' });
  }
});

// Delete checklist item
router.delete('/checklist-items/:itemId', auth, authorize('task_checklists', 'delete'), async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const success = await TaskService.deleteChecklistItem(itemId);
    
    if (success) {
      res.json({ message: 'Checklist item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Checklist item not found' });
    }
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    res.status(500).json({ message: 'Error deleting checklist item' });
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
    
    // Create notification for task member addition
    try {
      const task = await TaskService.getTaskById(taskId);
      const adderName = req.user.name || 'Someone';
      
      // Notify the user being added (if different from adder)
      if (user_id !== req.user.id) {
        await NotificationService.createNotification({
          user_id: user_id,
          type: 'task_assigned',
          title: `Added to task: ${task.task_name}`,
          message: `${adderName} added you as ${role} to this task`,
          entity_type: 'task',
          entity_id: taskId,
          related_user_id: req.user.id,
          priority: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium'
        });
      }
    } catch (notifError) {
      console.error('Error creating task member notification:', notifError);
      // Don't fail the request if notifications fail
    }
    
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
    const userId = req.user.id;
    
    // Get the task
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const oldAssignee = task.assigned_to;
    
    // Update task assignment
    await TaskService.updateTask(taskId, { assigned_to });
    
    // Create notification for assignment change
    if (assigned_to && assigned_to !== oldAssignee) {
      try {
        const updatedTask = await TaskService.getTaskById(taskId);
        const assignerName = req.user.name || 'Someone';
        
        // Notify new assignee (if different from assigner)
        if (assigned_to !== userId) {
          await NotificationService.createNotification({
            user_id: assigned_to,
            type: 'task_assigned',
            title: `Task assigned to you: ${updatedTask.task_name}`,
            message: `${assignerName} assigned this task to you`,
            entity_type: 'task',
            entity_id: taskId,
            related_user_id: userId,
            priority: updatedTask.priority === 'urgent' || updatedTask.priority === 'high' ? 'high' : 'medium'
          });
        }

        // Notify old assignee if they were previously assigned (if different from assigner and new assignee)
        if (oldAssignee && oldAssignee !== userId && oldAssignee !== assigned_to) {
          await NotificationService.createNotification({
            user_id: oldAssignee,
            type: 'task_status_change',
            title: `Task reassigned: ${updatedTask.task_name}`,
            message: `${assignerName} reassigned this task`,
            entity_type: 'task',
            entity_id: taskId,
            related_user_id: userId,
            priority: 'medium'
          });
        }
      } catch (notifError) {
        console.error('Error creating assignment notifications:', notifError);
        // Don't fail the request if notifications fail
      }
    }
    
    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Error assigning task' });
  }
});

module.exports = router;
