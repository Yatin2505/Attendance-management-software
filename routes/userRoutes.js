const express = require('express');
const router = express.Router();
const { getTeachers, createTeacher, deleteTeacher, getAdmins } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/teachers')
  .get(protect, getTeachers)
  .post(protect, createTeacher);

router.route('/teachers/:id')
  .delete(protect, deleteTeacher);

router.route('/admins')
  .get(protect, getAdmins);

module.exports = router;
