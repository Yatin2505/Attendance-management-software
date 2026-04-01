const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createLeaveRequest)
  .get(getLeaveRequests);

router.route('/:id')
  .put(updateLeaveStatus)
  .delete(deleteLeaveRequest);

module.exports = router;
