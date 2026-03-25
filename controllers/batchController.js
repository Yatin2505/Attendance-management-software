const Batch = require('../models/Batch');
const Student = require('../models/Student');

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private
const createBatch = async (req, res) => {
  try {
    const { name, timing } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a batch name' });
    }

    const batch = await Batch.create({
      name,
      timing,
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
    const batches = await Batch.find().populate('students', 'name rollNumber');
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

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    batch.name = name || batch.name;
    batch.timing = timing || batch.timing;

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

    // Remove reference from all students in this batch
    await Student.updateMany(
      { batchId: batch._id },
      { $set: { batchId: null } }
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

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is already in a batch
    if (student.batchId && student.batchId.toString() !== batchId) {
       // Remove student from old batch
       await Batch.findByIdAndUpdate(student.batchId, {
         $pull: { students: studentId }
       });
    }

    // Add student to new batch if not already present
    if (!batch.students.includes(studentId)) {
        batch.students.push(studentId);
        await batch.save();
    }

    // Update student's batchId
    student.batchId = batchId;
    await student.save();

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

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove student from batch's students array
    batch.students = batch.students.filter(id => id.toString() !== studentId);
    await batch.save();

    // Remove batch reference from student
    student.batchId = null;
    await student.save();

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
