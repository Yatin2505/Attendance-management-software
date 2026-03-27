const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

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

module.exports = router;
