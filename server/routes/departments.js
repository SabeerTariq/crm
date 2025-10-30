const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const DepartmentService = require('../services/departmentService');

// Get all departments
router.get('/', auth, authorize('departments', 'read'), async (req, res) => {
  try {
    const departments = await DepartmentService.getAllDepartments();
    res.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Error fetching departments' });
  }
});

// Get department by ID
router.get('/:id', auth, authorize('departments', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const department = await DepartmentService.getDepartmentById(departmentId);
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    if (error.message === 'Department not found') {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(500).json({ message: 'Error fetching department' });
  }
});

// Create new department (Admin only)
router.post('/', auth, authorize('departments', 'create'), async (req, res) => {
  try {
    const { department_name, description } = req.body;

    if (!department_name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const departmentId = await DepartmentService.createDepartment({
      department_name,
      description
    });

    res.status(201).json({
      message: 'Department created successfully',
      department_id: departmentId
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Department name already exists' });
    }
    res.status(500).json({ message: 'Error creating department' });
  }
});

// Update department (Admin only)
router.put('/:id', auth, authorize('departments', 'update'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const updateData = req.body;

    const success = await DepartmentService.updateDepartment(departmentId, updateData);
    
    if (success) {
      res.json({ message: 'Department updated successfully' });
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Error updating department' });
  }
});

// Get team members for a department
router.get('/:id/members', auth, authorize('departments', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const members = await DepartmentService.getDepartmentTeamMembers(departmentId);
    res.json(members);
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({ message: 'Error fetching department members' });
  }
});

// Add user to department
router.post('/:id/members', auth, authorize('departments', 'update'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { user_id, role = 'team_member' } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const teamMemberId = await DepartmentService.addTeamMember({
      department_id: departmentId,
      user_id,
      role
    });
    
    res.status(201).json({
      message: 'User added to department successfully',
      team_member_id: teamMemberId
    });
  } catch (error) {
    console.error('Error adding user to department:', error);
    if (error.message === 'User is already a member of this department') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding user to department' });
  }
});

// Update team member role
router.put('/members/:memberId', auth, authorize('departments', 'update'), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const success = await DepartmentService.updateTeamMemberRole(memberId, role);
    
    if (success) {
      res.json({ message: 'Team member role updated successfully' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({ message: 'Error updating team member role' });
  }
});

// Remove team member from department
router.delete('/members/:memberId', auth, authorize('departments', 'update'), async (req, res) => {
  try {
    const { memberId } = req.params;
    const success = await DepartmentService.removeTeamMember(memberId);
    
    if (success) {
      res.json({ message: 'Team member removed from department successfully' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    console.error('Error removing team member from department:', error);
    res.status(500).json({ message: 'Error removing team member from department' });
  }
});

// Get available users for department assignment
router.get('/:id/available-users', auth, authorize('departments', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const availableUsers = await DepartmentService.getAvailableUsers(departmentId);
    res.json(availableUsers); // Return array directly, not wrapped in data
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Error fetching available users' });
  }
});

// Get department tasks (for team leaders)
router.get('/:id/tasks', auth, authorize('departments', 'read'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const tasks = await DepartmentService.getDepartmentTasks(departmentId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching department tasks:', error);
    res.status(500).json({ message: 'Error fetching department tasks' });
  }
});

// Delete department (Admin only)
router.delete('/:id', auth, authorize('departments', 'delete'), async (req, res) => {
  try {
    const departmentId = req.params.id;
    const success = await DepartmentService.deleteDepartment(departmentId);
    
    if (success) {
      res.json({ message: 'Department deleted successfully' });
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Error deleting department' });
  }
});

module.exports = router;
