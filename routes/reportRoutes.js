const express = require('express');
const router = express.Router();
const {
  getStudentReport,
  getBatchReport,
  getMonthlyReport,
  getDateRangeReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.get('/monthly', getMonthlyReport);
router.get('/range', getDateRangeReport);
router.get('/student/:id', getStudentReport);
router.get('/batch/:batchId', getBatchReport);

module.exports = router;
