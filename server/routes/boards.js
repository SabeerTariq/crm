const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const BoardService = require('../services/boardService');

// Get all boards
router.get('/', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const boards = await BoardService.getAllBoards();
    res.json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Error fetching boards' });
  }
});

// Get boards by department
router.get('/department/:departmentId', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    const boards = await BoardService.getBoardsByDepartment(departmentId);
    res.json({ boards });
  } catch (error) {
    console.error('Error fetching department boards:', error);
    res.status(500).json({ message: 'Error fetching department boards' });
  }
});

// Get single board
router.get('/:id', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const board = await BoardService.getBoardById(id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json({ board });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Error fetching board' });
  }
});

// Get tasks for a specific board
router.get('/:id/tasks', auth, authorize('tasks', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const filters = req.query;
    
    const tasks = await BoardService.getTasksForBoard(id, filters);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching board tasks:', error);
    res.status(500).json({ message: 'Error fetching board tasks' });
  }
});

// Create new board
router.post('/', auth, authorize('tasks', 'create'), async (req, res) => {
  try {
    const {
      board_name,
      department_id,
      description
    } = req.body;

    if (!board_name || !department_id) {
      return res.status(400).json({ message: 'Board name and department ID are required' });
    }

    const boardData = {
      board_name,
      department_id,
      description,
      created_by: req.user.id
    };

    const boardId = await BoardService.createBoard(boardData);
    
    res.status(201).json({
      message: 'Board created successfully',
      board_id: boardId
    });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Error creating board' });
  }
});

// Update board
router.put('/:id', auth, authorize('tasks', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      board_name,
      description
    } = req.body;

    if (!board_name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const boardData = {
      board_name,
      description
    };

    const success = await BoardService.updateBoard(id, boardData);
    
    if (!success) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json({ message: 'Board updated successfully' });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Error updating board' });
  }
});

// Delete board
router.delete('/:id', auth, authorize('tasks', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await BoardService.deleteBoard(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    
    if (error.message === 'Cannot delete default board') {
      return res.status(400).json({ message: 'Cannot delete default board' });
    }
    
    res.status(500).json({ message: 'Error deleting board' });
  }
});

module.exports = router;
