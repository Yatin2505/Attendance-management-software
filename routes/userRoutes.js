const express = require('express');
const router = express.Router();
const { getTeachers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/teachers').get(protect, getTeachers);

module.exports = router;
