const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const NotificationService = require('../services/notificationService');

// Get aggregated notifications for current user
router.get('/', auth, authorize('notifications', 'read'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role_id;
    const { unread_only, type, limit } = req.query;

    // Get aggregated notifications from all sources (only user-specific)
    const aggregatedNotifications = await NotificationService.getAggregatedNotifications(userId, userRole);

    // Get stored notifications from notifications table (only for this user)
    const storedNotifications = await NotificationService.getUserNotifications(userId, {
      unread_only: false,
      type: null,
      limit: null,
      offset: 0
    });

    // Convert stored notifications to same format as aggregated
    const formattedStoredNotifications = storedNotifications.map(n => ({
      id: `stored_${n.id}`,
      type: n.type,
      title: n.title,
      message: n.message,
      entity_type: n.entity_type,
      entity_id: n.entity_id,
      related_user_id: n.related_user_id,
      related_user_name: n.related_user_name,
      priority: n.priority || 'medium',
      due_date: n.expires_at,
      created_at: n.created_at,
      is_read: n.is_read || false
    }));

    // Combine aggregated and stored notifications
    const allNotifications = [...aggregatedNotifications, ...formattedStoredNotifications];

    // Remove duplicates based on entity_type, entity_id, and type
    const uniqueNotifications = [];
    const seenKeys = new Set();
    
    allNotifications.forEach(n => {
      const key = `${n.type}_${n.entity_type}_${n.entity_id}_${n.created_at}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueNotifications.push(n);
      }
    });

    // Sort by created_at descending (most recent first)
    uniqueNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Filter if needed
    let filteredNotifications = uniqueNotifications;
    if (unread_only === 'true') {
      filteredNotifications = uniqueNotifications.filter(n => !n.is_read);
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    if (limit) {
      filteredNotifications = filteredNotifications.slice(0, parseInt(limit));
    }

    // Calculate unread count from all unique notifications
    const unreadCount = uniqueNotifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      data: filteredNotifications,
      unread_count: unreadCount,
      total: filteredNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get stored notifications (from notifications table)
router.get('/stored', auth, authorize('notifications', 'read'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, type, limit, offset } = req.query;

    const options = {
      unread_only: unread_only === 'true',
      type: type || null,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const notifications = await NotificationService.getUserNotifications(userId, options);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: notifications,
      unread_count: unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching stored notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread count
router.get('/unread-count', auth, authorize('notifications', 'read'), async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, authorize('notifications', 'update'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await NotificationService.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, authorize('notifications', 'update'), async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', auth, authorize('notifications', 'delete'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await NotificationService.deleteNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Delete all read notifications
router.delete('/read/delete-all', auth, authorize('notifications', 'delete'), async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.deleteReadNotifications(userId);

    res.json({
      success: true,
      message: 'All read notifications deleted',
      count
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications'
    });
  }
});

// Delete all notifications (both read and unread)
router.delete('/delete-all', auth, authorize('notifications', 'delete'), async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications deleted',
      count
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications'
    });
  }
});

module.exports = router;

