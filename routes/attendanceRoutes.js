const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markAttendanceBulk,
  markAllPresent,
  getAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  getAttendanceTrends
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(markAttendance)
  .get(getAttendance);

router.post('/mark-all', markAllPresent);
router.post('/bulk', markAttendanceBulk);

router.get('/trends', getAttendanceTrends);

router.get('/student/:id', getAttendanceByStudent);

router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router;
