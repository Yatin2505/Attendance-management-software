const express = require('express');
const router = express.Router();
const { 
  getTeachers, 
  createTeacher, 
  deleteTeacher, 
  getAdmins,
  toggleInstituteStatus,
  deleteInstitute,
  updateInstituteBranding
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/teachers')
  .get(protect, getTeachers)
  .post(protect, createTeacher);

router.route('/teachers/:id')
  .delete(protect, deleteTeacher);

router.route('/admins')
  .get(protect, authorize('superadmin'), getAdmins);

router.route('/admins/:id')
  .delete(protect, authorize('superadmin'), deleteInstitute);

router.route('/admins/:id/status')
  .patch(protect, authorize('superadmin'), toggleInstituteStatus);

router.route('/institute/branding')
  .patch(protect, updateInstituteBranding);

module.exports = router;
