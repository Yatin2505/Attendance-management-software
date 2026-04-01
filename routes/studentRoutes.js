const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents,
  getStudentProfile,
  enableStudentPortal,
  getStudentPortalStatus,
  getStudentSelfProfile
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.post('/import', importStudents);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

router.get('/me/profile', getStudentSelfProfile);

router.get('/:id/profile', authorize('admin', 'teacher'), getStudentProfile);

router.post('/:id/enable-portal', authorize('admin'), enableStudentPortal);
router.get('/:id/portal-status', authorize('admin'), getStudentPortalStatus);

module.exports = router;
