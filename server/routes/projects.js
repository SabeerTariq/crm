const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const checkCustomerAssignment = require('../middleware/checkCustomerAssignment');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const ProjectService = require('../services/projectService');
const DepartmentService = require('../services/departmentService');
const TaskService = require('../services/taskService');

// Get all projects with filters
router.get('/', auth, authorize('projects', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      customer_id,
      project_manager_id,
      search
    } = req.query;

    const filters = {
      status,
      priority,
      customer_id: customer_id ? parseInt(customer_id) : null,
      project_manager_id: project_manager_id ? parseInt(project_manager_id) : null,
      search
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const projects = await ProjectService.getAllProjects(filters);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    res.json({
      projects: paginatedProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: projects.length,
        pages: Math.ceil(projects.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Get project by ID
router.get('/:id', auth, authorize('projects', 'read'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectService.getProjectById(projectId);
    
    // Get project departments
    const departments = await DepartmentService.getProjectDepartments(projectId);
    
    // Get project tasks
    const tasks = await TaskService.getProjectTasks(projectId);
    
    // Get project statistics
    const stats = await TaskService.getProjectTaskStats(projectId);

    // Get project attachments
    const attachments = await ProjectService.getProjectAttachments(projectId);

    res.json({
      project,
      departments,
      tasks,
      stats,
      attachments
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error.message === 'Project not found') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// Create new project
router.post('/', auth, authorize('projects', 'create'), async (req, res) => {
  try {
    const {
      customer_id,
      project_name,
      description,
      status = 'planning',
      priority = 'medium',
      start_date,
      end_date,
      budget,
      departments = []
    } = req.body;

    // Validate required fields
    if (!customer_id || !project_name) {
      return res.status(400).json({ message: 'Customer ID and project name are required' });
    }

    // Get customer's assigned upseller
    const db = require('../db');
    const customerQuery = 'SELECT assigned_to FROM customers WHERE id = ?';
    
    db.query(customerQuery, [customer_id], async (err, results) => {
      if (err) {
        console.error('Error fetching customer:', err);
        return res.status(500).json({ message: 'Error fetching customer' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const assigned_upseller_id = results[0].assigned_to;
      if (!assigned_upseller_id) {
        return res.status(400).json({ message: 'Customer is not assigned to any upseller' });
      }

      try {
        // Create project
        const projectData = {
          customer_id,
          project_name,
          description,
          status,
          priority,
          start_date,
          end_date,
          budget,
          created_by: req.user.id,
          project_manager_id: assigned_upseller_id,
          assigned_upseller_id
        };

        const projectId = await ProjectService.createProject(projectData);

        // Add departments to project
        for (const departmentId of departments) {
          await DepartmentService.addDepartmentToProject(projectId, departmentId);
        }

        res.status(201).json({
          message: 'Project created successfully',
          project_id: projectId
        });
      } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Error creating project' });
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update project
router.put('/:id', auth, authorize('projects', 'update'), checkCustomerAssignment, async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;

    const success = await ProjectService.updateProject(projectId, updateData);
    
    if (success) {
      res.json({ message: 'Project updated successfully' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', auth, authorize('projects', 'delete'), checkCustomerAssignment, async (req, res) => {
  try {
    const projectId = req.params.id;
    const success = await ProjectService.deleteProject(projectId);
    
    if (success) {
      res.json({ message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// Get projects for a specific customer
router.get('/customer/:customerId', auth, authorize('projects', 'read'), async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const projects = await ProjectService.getProjectsByCustomer(customerId);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    res.status(500).json({ message: 'Error fetching customer projects' });
  }
});

// Get projects managed by current user
router.get('/my/projects', auth, authorize('projects', 'read'), async (req, res) => {
  try {
    const projects = await ProjectService.getProjectsByManager(req.user.id);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Error fetching user projects' });
  }
});

// Get project statistics
router.get('/stats/overview', auth, authorize('projects', 'read'), async (req, res) => {
  try {
    const userId = req.user.role_id === 1 ? null : req.user.id; // Admin sees all, others see their own
    const stats = await ProjectService.getProjectStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ message: 'Error fetching project statistics' });
  }
});

// Add department to project
router.post('/:id/departments', auth, authorize('projects', 'update'), checkCustomerAssignment, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { department_id, team_leader_id } = req.body;

    if (!department_id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }

    // Handle empty string for team_leader_id
    const leaderId = team_leader_id && team_leader_id !== '' ? team_leader_id : null;

    const departmentId = await DepartmentService.addDepartmentToProject(projectId, department_id, leaderId);
    
    res.status(201).json({
      message: 'Department added to project successfully',
      department_id: departmentId
    });
  } catch (error) {
    console.error('Error adding department to project:', error);
    res.status(500).json({ message: 'Error adding department to project' });
  }
});

// Update project department
router.put('/:id/departments/:deptId', auth, authorize('projects', 'update'), checkCustomerAssignment, async (req, res) => {
  try {
    const { deptId } = req.params;
    const updateData = req.body;

    const success = await DepartmentService.updateProjectDepartment(deptId, updateData);
    
    if (success) {
      res.json({ message: 'Project department updated successfully' });
    } else {
      res.status(404).json({ message: 'Project department not found' });
    }
  } catch (error) {
    console.error('Error updating project department:', error);
    res.status(500).json({ message: 'Error updating project department' });
  }
});

// Remove department from project
router.delete('/:id/departments/:deptId', auth, authorize('projects', 'update'), checkCustomerAssignment, async (req, res) => {
  try {
    const { deptId } = req.params;
    const success = await DepartmentService.removeDepartmentFromProject(deptId);
    
    if (success) {
      res.json({ message: 'Department removed from project successfully' });
    } else {
      res.status(404).json({ message: 'Project department not found' });
    }
  } catch (error) {
    console.error('Error removing department from project:', error);
    res.status(500).json({ message: 'Error removing department from project' });
  }
});

// Get project attachments
router.get('/:id/attachments', auth, authorize('project_attachments', 'read'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const attachments = await ProjectService.getProjectAttachments(projectId);
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching project attachments:', error);
    res.status(500).json({ message: 'Error fetching project attachments' });
  }
});

// Add attachment to project
router.post('/:id/attachments', auth, authorize('project_attachments', 'create'), checkCustomerAssignment, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const projectId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const attachmentIds = [];

    // Process each uploaded file
    for (const file of files) {
      const attachmentData = {
        project_id: projectId,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        file_type: file.mimetype,
        uploaded_by: req.user.id
      };

      const attachmentId = await ProjectService.addProjectAttachment(attachmentData);
      attachmentIds.push(attachmentId);
    }
    
    res.status(201).json({
      message: `${files.length} attachment(s) added successfully`,
      attachment_ids: attachmentIds
    });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ message: 'Error adding attachment' });
  }
});

// Delete project attachment
router.delete('/:id/attachments/:attachmentId', auth, authorize('project_attachments', 'delete'), checkCustomerAssignment, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get attachment details before deleting
    const attachments = await ProjectService.getProjectAttachments(req.params.id);
    const attachment = attachments.find(att => att.id == attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete from database
    const success = await ProjectService.deleteProjectAttachment(attachmentId);
    
    if (success) {
      // Delete physical file
      try {
        // Convert relative path to absolute path if needed
        let filePath = attachment.file_path;
        if (!path.isAbsolute(filePath)) {
          filePath = path.join(__dirname, '..', filePath);
        }
        const normalizedPath = path.normalize(filePath);
        
        if (fs.existsSync(normalizedPath)) {
          fs.unlinkSync(normalizedPath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
      
      res.json({ message: 'Attachment deleted successfully' });
    } else {
      res.status(404).json({ message: 'Attachment not found' });
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Error deleting attachment' });
  }
});

// Serve project attachment files
router.get('/:id/attachments/:attachmentId/download', auth, authorize('project_attachments', 'read'), async (req, res) => {
  try {
    const { id: projectId, attachmentId } = req.params;
    // Get attachment details
    const attachments = await ProjectService.getProjectAttachments(projectId);
    const attachment = attachments.find(att => att.id == attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Convert relative path to absolute path if needed
    let filePath = attachment.file_path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, '..', filePath);
    }
    
    // Normalize the file path for cross-platform compatibility
    const normalizedPath = path.normalize(filePath);

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    
    // Stream the file
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

module.exports = router;
