const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user's notifications
router.get('/', protect, getNotifications);

// @desc    Mark a notification as read
router.patch('/:id/read', protect, markAsRead);

// @desc    Mark all notifications as read
router.post('/read-all', protect, markAllAsRead);

module.exports = router;
