const express = require('express');
const router = express.Router();
const { sendAttendanceNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendAttendanceNotification);

module.exports = router;
