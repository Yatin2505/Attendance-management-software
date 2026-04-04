const express = require('express');
const router = express.Router();
const {
  createFee,
  assignBatchFees,
  recordPayment,
  getFees,
  getMyFees,
  getFeeStats,
  updateFee,
  deleteFee
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Admin-only routes
router.post('/',           authorize('admin'), createFee);
router.post('/batch',      authorize('admin'), assignBatchFees);
router.put('/:id/payment', authorize('admin'), recordPayment);
router.put('/:id',         authorize('admin'), updateFee);
router.delete('/:id',      authorize('admin'), deleteFee);
router.get('/',            authorize('admin'), getFees);
router.get('/stats',       authorize('admin'), getFeeStats);

// Student-only route
router.get('/me',          authorize('student'), getMyFees);

module.exports = router;
