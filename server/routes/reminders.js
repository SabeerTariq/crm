const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ReminderService = require('../services/reminderService');

// Get user's reminders
router.get('/', auth, authorize('reminders', 'read'), (req, res) => {
  const { start_date, end_date, status, date } = req.query;
  const userId = req.user.id;
  
  if (date) {
    // Get reminders for a specific date
    ReminderService.getRemindersForDate(userId, date)
      .then(reminders => res.json(reminders))
      .catch(err => {
        console.error('Error fetching reminders for date:', err);
        res.status(500).json({ message: 'Error fetching reminders' });
      });
  } else {
    // Get reminders with optional filters
    ReminderService.getUserReminders(userId, start_date, end_date, status)
      .then(reminders => res.json(reminders))
      .catch(err => {
        console.error('Error fetching reminders:', err);
        res.status(500).json({ message: 'Error fetching reminders' });
      });
  }
});

// Get upcoming reminders
router.get('/upcoming', auth, authorize('reminders', 'read'), (req, res) => {
  const { days = 7 } = req.query;
  const userId = req.user.id;
  
  ReminderService.getUpcomingReminders(userId, parseInt(days))
    .then(reminders => res.json(reminders))
    .catch(err => {
      console.error('Error fetching upcoming reminders:', err);
      res.status(500).json({ message: 'Error fetching upcoming reminders' });
    });
});

// Create a new reminder
router.post('/', auth, authorize('reminders', 'create'), (req, res) => {
  const { title, description, reminder_date, reminder_time, is_all_day, priority } = req.body;
  const userId = req.user.id;
  
  if (!title || !reminder_date) {
    return res.status(400).json({ message: 'Title and reminder date are required' });
  }
  
  ReminderService.createReminder({
    user_id: userId,
    title,
    description,
    reminder_date,
    reminder_time,
    is_all_day,
    priority,
    status: 'pending'
  })
    .then(result => {
      res.status(201).json({ 
        message: 'Reminder created successfully', 
        reminder_id: result.insertId 
      });
    })
    .catch(err => {
      console.error('Error creating reminder:', err);
      res.status(500).json({ message: 'Error creating reminder' });
    });
});

// Update a reminder
router.put('/:id', auth, authorize('reminders', 'update'), (req, res) => {
  const reminderId = req.params.id;
  const userId = req.user.id;
  const updateData = req.body;
  
  // First check if the reminder belongs to the user
  ReminderService.getUserReminders(userId)
    .then(reminders => {
      const reminder = reminders.find(r => r.id == reminderId);
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      
      return ReminderService.updateReminder(reminderId, updateData);
    })
    .then(result => {
      res.json({ message: 'Reminder updated successfully' });
    })
    .catch(err => {
      console.error('Error updating reminder:', err);
      res.status(500).json({ message: 'Error updating reminder' });
    });
});

// Mark reminder as completed
router.patch('/:id/complete', auth, authorize('reminders', 'update'), (req, res) => {
  const reminderId = req.params.id;
  const userId = req.user.id;
  
  ReminderService.markAsCompleted(reminderId, userId)
    .then(result => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      res.json({ message: 'Reminder marked as completed' });
    })
    .catch(err => {
      console.error('Error completing reminder:', err);
      res.status(500).json({ message: 'Error completing reminder' });
    });
});

// Delete a reminder
router.delete('/:id', auth, authorize('reminders', 'delete'), (req, res) => {
  const reminderId = req.params.id;
  const userId = req.user.id;
  
  ReminderService.deleteReminder(reminderId, userId)
    .then(result => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      res.json({ message: 'Reminder deleted successfully' });
    })
    .catch(err => {
      console.error('Error deleting reminder:', err);
      res.status(500).json({ message: 'Error deleting reminder' });
    });
});

module.exports = router;
