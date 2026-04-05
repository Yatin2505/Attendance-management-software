const mongoose = require('mongoose');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { notifyAdmins } = require('./notificationController');
// ... (removed redundant bcrypt import)

// @desc    Create a new student
// @route   POST /api/students
// @access  Private
const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, batches } = req.body;
    const { user } = req;

    // Determine target institute
    const instituteId = user.role === 'admin' ? user._id : user.instituteId;

    // Check if student exists by roll number within the same institute
    const studentExists = await Student.findOne({ rollNumber, instituteId });
    if (studentExists) {
      return res.status(400).json({ message: 'Student with this roll number already exists in your institute' });
    }

    const student = await Student.create({
      name,
      rollNumber,
      batches: Array.isArray(batches) ? batches : (batches ? [batches] : []),
      instituteId
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

    // Trigger notification
    const msg = `New student ${student.name} (Roll: ${student.rollNumber}) has been added.`;
    await notifyAdmins('New Student Added', msg, 'success');
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
    const { user } = req;
    
    let query = {};

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      query.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    // 2. Teacher Batch Isolation
    if (user.role === 'teacher') {
      const teacherBatches = await Batch.find({ teacherId: user._id }).select('_id');
      const batchIds = teacherBatches.map(b => b._id.toString());
      
      if (batchId && !batchIds.includes(batchId)) {
        return res.status(403).json({ message: 'Not authorized for this batch' });
      }
      query.batches = { $in: batchId ? [batchId] : batchIds };
    } else if (batchId) {
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
    const { user } = req;
    const student = await Student.findById(req.params.id).populate('batches', 'name timing');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Institute Isolation Check
    if (user.role !== 'superadmin') {
      const targetInst = user.role === 'admin' ? user._id : user.instituteId;
      if (student.instituteId.toString() !== targetInst.toString()) {
        return res.status(403).json({ message: 'Access denied: Not your student' });
      }
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const { user } = req;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Institute Isolation Check
    const targetInst = user.role === 'admin' ? user._id : user.instituteId;
    if (user.role !== 'superadmin' && student.instituteId.toString() !== targetInst.toString()) {
      return res.status(403).json({ message: 'Access denied: Not your student' });
    }

    // Avoid rollNumber conflicts if changed
    if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
      const rollExists = await Student.findOne({ rollNumber: req.body.rollNumber, instituteId: student.instituteId });
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
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = async (req, res) => {
  try {
    const { user } = req;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Institute Isolation Check
    const targetInst = user.role === 'admin' ? user._id : user.instituteId;
    if (user.role !== 'superadmin' && student.instituteId.toString() !== targetInst.toString()) {
      return res.status(403).json({ message: 'Access denied: Not your student' });
    }
    // Remove reference from all associated batches
    if (student.batches && student.batches.length > 0) {
      await Promise.all(student.batches.map(bId => 
        Batch.findByIdAndUpdate(bId, { $pull: { students: student._id } })
      ));
    }

    await student.deleteOne();
    res.status(200).json({ message: 'Student removed successfully' });
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

    const studentsToImport = req.body.students; 
    const { user } = req;
    const instituteId = user.role === 'admin' ? user._id : user.instituteId;

    if (!studentsToImport || !Array.isArray(studentsToImport)) {
      return res.status(400).json({ message: 'Invalid payload, expected array of students' });
    }

    // Filter duplicates against DB first (within the same institute)
    const existingRollNumbers = await Student.find({
      instituteId,
      rollNumber: { $in: studentsToImport.map(s => s.rollNumber).filter(Boolean) }
    }).select('rollNumber');
    
    const existingSet = new Set(existingRollNumbers.map(s => s.rollNumber));
    
    const validStudents = studentsToImport
      .filter(s => s.name && s.rollNumber && !existingSet.has(String(s.rollNumber)))
      .map(s => ({
        name: s.name.trim(),
        rollNumber: String(s.rollNumber).trim(),
        batches: s.batchId ? [s.batchId] : [],
        instituteId
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

// @desc    Get full student profile with attendance stats
// @route   GET /api/students/:id/profile
// @access  Private
const getStudentProfile = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.params.id);

    const [student, overallAgg, monthlyAgg, recentRecords] = await Promise.all([
      Student.findById(studentId).populate('batches', 'name timing'),

      // Overall attendance stats
      Attendance.aggregate([
        { $match: { studentId } },
        {
          $group: {
            _id: '$batchId',
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
            absent:  { $sum: { $cond: [{ $eq:  ['$status', 'absent'] }, 1, 0] } },
            late:    { $sum: { $cond: [{ $eq:  ['$status', 'late']   }, 1, 0] } },
            leave:   { $sum: { $cond: [{ $eq:  ['$status', 'leave']  }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'batches', localField: '_id', foreignField: '_id', as: 'batchInfo'
          }
        },
        { $unwind: { path: '$batchInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            batchName: { $ifNull: ['$batchInfo.name', 'Unknown'] },
            total: 1, present: 1, absent: 1, late: 1, leave: 1,
            percentage: {
              $cond: [
                { $gt: [{ $subtract: ['$total', '$leave'] }, 0] },
                { $round: [{ $multiply: [{ $divide: ['$present', { $subtract: ['$total', '$leave'] }] }, 100] }, 1] },
                0
              ]
            }
          }
        },
        { $sort: { batchName: 1 } }
      ]),

      // Monthly attendance trend (last 6 months)
      Attendance.aggregate([
        { $match: { studentId } },
        {
          $group: {
            _id: {
              year:  { $year: '$date' },
              month: { $month: '$date' }
            },
            total:   { $sum: 1 },
            present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
        {
          $project: {
            year: '$_id.year', month: '$_id.month',
            total: 1, present: 1, leave: 1,
            percentage: {
              $cond: [
                { $gt: [{ $subtract: ['$total', '$leave'] }, 0] },
                { $round: [{ $multiply: [{ $divide: ['$present', { $subtract: ['$total', '$leave'] }] }, 100] }, 0] },
                0
              ]
            },
            _id: 0
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]),

      // Last 20 attendance records
      Attendance.find({ studentId })
        .sort({ date: -1 })
        .limit(20)
        .populate('batchId', 'name')
        .lean()
    ]);

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Aggregate totals
    const totalSessions = overallAgg.reduce((s, b) => s + b.total,   0);
    const totalPresent  = overallAgg.reduce((s, b) => s + b.present, 0);
    const totalAbsent   = overallAgg.reduce((s, b) => s + b.absent,  0);
    const totalLate     = overallAgg.reduce((s, b) => s + b.late,    0);
    const totalLeave    = overallAgg.reduce((s, b) => s + b.leave,   0);
    const denom         = totalSessions - totalLeave;
    const overallPct    = denom > 0
      ? Math.round((totalPresent / denom) * 100)
      : 0;

    const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = monthlyAgg.map(m => ({
      label: `${MONTHS[m.month]} ${m.year}`,
      total: m.total, present: m.present,
      percentage: m.percentage
    }));

    const history = recentRecords.map(r => ({
      _id:       r._id,
      date:      r.date,
      status:    r.status,
      batchName: r.batchId?.name ?? 'Unknown'
    }));

    res.status(200).json({
      student,
      stats: { totalSessions, totalPresent, totalAbsent, totalLate, totalLeave, overallPct },
      batchBreakdown: overallAgg,
      monthly,
      history
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Enable student portal (Admin only)
// @route   POST /api/students/:id/enable-portal
// @access  Private/Admin
const enableStudentPortal = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already in use' });

    user = await User.create({
      name: student.name,
      email,
      password,
      plainPassword: password, // As requested
      role: 'student',
      studentId: student._id,
      instituteId: student.instituteId
    });

    res.status(201).json({ message: 'Portal enabled successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student portal status (Admin only)
// @route   GET /api/students/:id/portal-status
// @access  Private/Admin
const getStudentPortalStatus = async (req, res) => {
  try {
    const user = await User.findOne({ studentId: req.params.id, role: 'student' });
    res.status(200).json({ 
      enabled: !!user,
      email: user ? user.email : null,
      plainPassword: user ? user.plainPassword : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current student's own profile (Student only)
// @route   GET /api/students/me/profile
// @access  Private/Student
const getStudentSelfProfile = async (req, res) => {
  try {
    if (req.user.role !== 'student' || !req.user.studentId) {
      return res.status(403).json({ message: 'Access denied: Not a student account' });
    }

    // Reuse the same logic as getStudentProfile but using studentId from token
    req.params.id = req.user.studentId;
    return getStudentProfile(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
