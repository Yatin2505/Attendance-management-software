const Student = require('../models/Student');
const Batch = require('../models/Batch');

// @desc    Create a new student
// @route   POST /api/students
// @access  Private
const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, batches } = req.body;

    // Check if student exists by roll number
    const studentExists = await Student.findOne({ rollNumber });
    if (studentExists) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    const student = await Student.create({
      name,
      rollNumber,
      batches: Array.isArray(batches) ? batches : (batches ? [batches] : [])
    });

    // Add reference to batches if assigned
    if (student.batches && student.batches.length > 0) {
      await Promise.all(student.batches.map(bId => 
        Batch.findByIdAndUpdate(bId, {
          $push: { students: student._id }
        })
      ));
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
    
    let query = {};
    if (req.user.role === 'teacher') {
      const teacherBatches = await Batch.find({ teacherId: req.user.id }).select('_id');
      const batchIds = teacherBatches.map(b => b._id);
      
      if (batchId && !batchIds.some(id => id.toString() === batchId)) {
        return res.status(403).json({ message: 'Not authorized for this batch' });
      }
      query.batches = { $in: batchId ? [batchId] : batchIds };
    } else if (batchId) {
      query.batches = { $in: [batchId] };
    }
    if (batchId) {
      query.batches = { $in: [batchId] };
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const students = await Student.find(query).populate('batches', 'name timing');
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
    const student = await Student.findById(req.params.id).populate('batches', 'name timing');

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

      const oldBatches = student.batches ? student.batches.map(id => id.toString()) : [];
      let newBatches = req.body.batches;
      
      // Normalize to array
      if (newBatches && !Array.isArray(newBatches)) {
        newBatches = [newBatches];
      } else if (!newBatches) {
        newBatches = [];
      } else {
        newBatches = newBatches.map(id => id.toString());
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('batches', 'name timing');

      // Calculate diffs for many-to-many propagation
      const addedBatches = newBatches.filter(b => !oldBatches.includes(b));
      const removedBatches = oldBatches.filter(b => !newBatches.includes(b));

      if (removedBatches.length > 0) {
        await Promise.all(removedBatches.map(bId => 
          Batch.findByIdAndUpdate(bId, { $pull: { students: student._id } })
        ));
      }
      if (addedBatches.length > 0) {
        await Promise.all(addedBatches.map(bId => 
          Batch.findByIdAndUpdate(bId, { $addToSet: { students: student._id } })
        ));
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
      // Remove reference from all associated batches
      if (student.batches && student.batches.length > 0) {
        await Promise.all(student.batches.map(bId => 
          Batch.findByIdAndUpdate(bId, { $pull: { students: student._id } })
        ));
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

// @desc    Import students from Excel/JSON array
// @route   POST /api/students/import
// @access  Private/Admin
const importStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can mass-import students' });
    }

    const studentsToImport = req.body.students; // expects array of { name, rollNumber, batchId? }
    if (!studentsToImport || !Array.isArray(studentsToImport)) {
      return res.status(400).json({ message: 'Invalid payload, expected array of students' });
    }

    // Filter duplicates against DB first
    const existingRollNumbers = await Student.find({
      rollNumber: { $in: studentsToImport.map(s => s.rollNumber).filter(Boolean) }
    }).select('rollNumber');
    
    const existingSet = new Set(existingRollNumbers.map(s => s.rollNumber));
    
    const validStudents = studentsToImport
      .filter(s => s.name && s.rollNumber && !existingSet.has(s.rollNumber))
      .map(s => ({
        name: s.name.trim(),
        rollNumber: String(s.rollNumber).trim(),
        batches: s.batchId ? [s.batchId] : []
      }));

    if (validStudents.length === 0) {
      return res.status(400).json({ message: 'No valid/new students to import' });
    }

    // Insert many
    const inserted = await Student.insertMany(validStudents);

    // Propagate many-to-many relationship tracking on batches
    const batchUpdates = {};
    for (const student of inserted) {
      if (student.batches && student.batches.length > 0) {
        student.batches.forEach(bId => {
          if (!batchUpdates[bId]) batchUpdates[bId] = [];
          batchUpdates[bId].push(student._id);
        });
      }
    }

    for (const [bId, studentIds] of Object.entries(batchUpdates)) {
      await Batch.findByIdAndUpdate(bId, { $addToSet: { students: { $each: studentIds } } });
    }

    res.status(201).json({ message: `Successfully imported ${inserted.length} students` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents
};
