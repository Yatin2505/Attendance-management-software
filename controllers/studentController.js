const Student = require('../models/Student');
const Batch = require('../models/Batch');

// @desc    Create a new student
// @route   POST /api/students
// @access  Private
const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, batchId } = req.body;

    // Check if student exists by roll number
    const studentExists = await Student.findOne({ rollNumber });
    if (studentExists) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    const student = await Student.create({
      name,
      rollNumber,
      batchId: batchId || undefined
    });

    // Add reference to batch if assigned
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $push: { students: student._id }
      });
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all students (with search and filter)
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const { batchId, name } = req.query;
    
    // Build query object
    let query = {};
    if (batchId) {
      query.batchId = batchId;
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const students = await Student.find(query).populate('batchId', 'name timing');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('batchId', 'name timing');

    if (student) {
      res.status(200).json(student);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      // Avoid rollNumber conflicts if changed
      if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
        const rollExists = await Student.findOne({ rollNumber: req.body.rollNumber });
        if (rollExists) {
          return res.status(400).json({ message: 'Roll number already in use' });
        }
      }

      const oldBatchId = student.batchId;
      const newBatchId = req.body.batchId;

      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('batchId', 'name timing');

      // Update Batch array references if the batchId changed
      if (oldBatchId?.toString() !== newBatchId?.toString()) {
         if (oldBatchId) {
            await Batch.findByIdAndUpdate(oldBatchId, {
               $pull: { students: student._id }
            });
         }
         if (newBatchId) {
            await Batch.findByIdAndUpdate(newBatchId, {
               $addToSet: { students: student._id }
            });
         }
      }

      res.status(200).json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      // Remove reference from associated batch
      if (student.batchId) {
        await Batch.findByIdAndUpdate(student.batchId, {
          $pull: { students: student._id }
        });
      }

      await student.deleteOne();
      res.status(200).json({ message: 'Student removed successfully' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
