const Batch = require('../models/Batch');
const Student = require('../models/Student');

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private
const createBatch = async (req, res) => {
  try {
    const { name, timing, teacherId } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!name) {
      return res.status(400).json({ message: 'Please provide a batch name' });
    }
    if (req.user.role !== 'admin') {
      // Teachers can only create batches for themselves
      if (teacherId && teacherId !== userId) {
        return res.status(403).json({ message: 'Teachers can only assign themselves to new batches' });
      }
    }

    const batch = await Batch.create({
      name,
      timing,
      teacherId: teacherId || userId, // Admin can assign, teacher self-assigns
      students: []
    });

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
const getBatches = async (req, res) => {
  try {
    const userId = req.user.id;
    let query = {};
    
    if (req.user.role === 'teacher') {
      query = { teacherId: userId };
    }
    
    const batches = await Batch.find(query).populate('students', 'name rollNumber').populate('teacherId', 'name');
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('students', 'name rollNumber');
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private
const updateBatch = async (req, res) => {
  try {
    const { name, timing } = req.body;

    const batch = await Batch.findById(req.params.id);

    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this batch' });
    }

    batch.name = name || batch.name;
    batch.timing = timing || batch.timing;
    
    // Only admins can reassign the teacher
    if (req.user.role === 'admin' && req.body.teacherId) {
      batch.teacherId = req.body.teacherId;
    }

    const updatedBatch = await batch.save();

    res.status(200).json(updatedBatch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this batch' });
    }

    // Remove reference from all students in this batch
    await Student.updateMany(
      { batches: batch._id },
      { $pull: { batches: batch._id } }
    );

    await Batch.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Batch removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign student to batch
// @route   POST /api/batches/:id/add-student
// @access  Private
const assignStudentToBatch = async (req, res) => {
  try {
    const { studentId } = req.body;
    const batchId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Please provide a studentId' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this batch' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // We no longer remove them from other batches (Multi-Batch feature)
    
    // Add student to batch if not already present
    if (!batch.students.includes(studentId)) {
        batch.students.push(studentId);
        await batch.save();
    }

    // Add batch to student's batches array if not already present
    if (!student.batches || !student.batches.includes(batchId)) {
        if (!student.batches) student.batches = [];
        student.batches.push(batchId);
        await student.save();
    }

    res.status(200).json({ message: 'Student assigned to batch successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove student from batch
// @route   POST /api/batches/:id/remove-student
// @access  Private
const removeStudentFromBatch = async (req, res) => {
  try {
    const { studentId } = req.body;
    const batchId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Please provide a studentId' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this batch' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove student from batch's students array
    batch.students = batch.students.filter(id => id.toString() !== studentId);
    await batch.save();

    // Remove batch reference from student's batches array
    if (student.batches) {
      student.batches = student.batches.filter(id => id.toString() !== batchId);
      await student.save();
    }

    res.status(200).json({ message: 'Student removed from batch successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  assignStudentToBatch,
  removeStudentFromBatch
};
