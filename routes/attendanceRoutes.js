const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markAllPresent,
  getAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(markAttendance)
  .get(getAttendance);

router.post('/mark-all', markAllPresent);

router.get('/student/:id', getAttendanceByStudent);

router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router;
