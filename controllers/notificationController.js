const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark all as read
// @route   POST /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Internal utility to create notifications
const createNotification = async (recipientId, title, message, type = 'info', link = '', instituteId = null) => {
  try {
    // If instituteId is not provided, try to find it from the recipient
    if (!instituteId) {
      const recipient = await User.findById(recipientId).select('instituteId');
      instituteId = recipient?.instituteId;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
      instituteId
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Internal utility to notify all admins of a specific institute
const notifyAdmins = async (title, message, type = 'info', link = '', instituteId = null) => {
  try {
    let query = { role: 'admin' };
    if (instituteId) {
      query._id = instituteId; // Since each institute has exactly one primary Admin User
    }
    
    const admins = await User.find(query);
    const promises = admins.map(admin => createNotification(admin._id, title, message, type, link, instituteId || admin.instituteId));
    await Promise.all(promises);
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  notifyAdmins
};
