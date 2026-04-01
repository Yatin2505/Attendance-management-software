const express = require('express');
const router = express.Router();
const { getTeachers, createTeacher, deleteTeacher } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/teachers')
  .get(protect, getTeachers)
  .post(protect, createTeacher);

router.route('/teachers/:id')
  .delete(protect, deleteTeacher);

module.exports = router;
