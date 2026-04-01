const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  assignStudentToBatch,
  removeStudentFromBatch,
  getBatchStats
} = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getBatches)
  .post(createBatch);

router.route('/:id')
  .get(getBatchById)
  .put(updateBatch)
  .delete(deleteBatch);

router.post('/:id/add-student', assignStudentToBatch);
router.post('/:id/remove-student', removeStudentFromBatch);
router.get('/:id/stats', getBatchStats);

module.exports = router;
