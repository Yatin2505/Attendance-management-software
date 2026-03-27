const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// @desc    Mark attendance for a student (present/absent)
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { studentId, batchId, date, status, notes } = req.body;
    const teacherId = req.user.id;

    if (!studentId || !batchId || !date || !status) {
      return res.status(400).json({ message: 'Please provide studentId, batchId, date, and status' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    
    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
        return res.status(400).json({ message: 'Status must be present, absent, or late' });
    }

    // Normalize date to start of the day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Prevent duplicate
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingRecord = await Attendance.findOne({
      studentId,
      batchId,
      date: { $gte: attendanceDate, $lt: nextDay }
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already marked for this student in this batch on this date' });
    }

    const attendance = await Attendance.create({
      studentId,
      batchId,
      teacherId,
      date: attendanceDate,
      status,
      notes: notes || ''
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark all students in a batch as present for a given date
// @route   POST /api/attendance/mark-all
// @access  Private
const markAllPresent = async (req, res) => {
  try {
    const { batchId, date } = req.body;

    if (!batchId || !date) {
      return res.status(400).json({ message: 'Please provide batchId and date' });
    }

    const batch = await Batch.findById(batchId).populate('students');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const createdRecords = [];
    const skippedRecords = [];

    // Process each student in the batch
    for (const student of batch.students) {
      // Check if attendance already exists for this student on this date
      const existingRecord = await Attendance.findOne({
        studentId: student._id,
        date: { $gte: attendanceDate, $lt: nextDay }
      });

      if (!existingRecord) {
        const attendance = await Attendance.create({
          studentId: student._id,
          batchId: batch._id,
          teacherId: req.user.id,
          date: attendanceDate,
          status: 'present'
        });
        createdRecords.push(attendance);
      } else {
        skippedRecords.push(student._id);
      }
    }

    res.status(201).json({
      message: `Marked ${createdRecords.length} students as present. Skipped ${skippedRecords.length} duplicates.`,
      createdRecords
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance (supports filtering by date, batchId, studentId via query params)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { date, batchId, studentId } = req.query;
    
    let query = {};
    
    // Teacher scope isolation
    if (req.user.role === 'teacher') {
      const myBatches = await Batch.find({ teacherId: req.user.id }).select('_id');
      const myBatchIds = myBatches.map(b => b._id.toString());
      if (batchId && !myBatchIds.includes(batchId)) {
        return res.status(403).json({ message: 'Not authorized to view this batch' });
      }
      query.batchId = { $in: batchId ? [batchId] : myBatchIds };
    } else if (batchId) {
      query.batchId = batchId;
    }
    
    if (studentId) {
      query.studentId = studentId;
    }
    
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('batchId', 'name timing');

    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance for a specific student
// @route   GET /api/attendance/student/:id
// @access  Private
const getAttendanceByStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    let query = { studentId };

    if (req.user.role === 'teacher') {
      const myBatches = await Batch.find({ teacherId: req.user.id }).select('_id');
      query.batchId = { $in: myBatches.map(b => b._id) };
    }
    
    const records = await Attendance.find(query)
      .populate('batchId', 'name timing');

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update attendance status
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['present', 'absent', 'late'].includes(status)) {
        return res.status(400).json({ message: 'Status must be present, absent, or late' });
    }

    const attendance = await Attendance.findById(req.params.id).populate('batchId');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (req.user.role !== 'admin' && attendance.batchId.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }

    attendance.status = status;
    const updatedAttendance = await attendance.save();

    res.status(200).json(updatedAttendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('batchId');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (req.user.role !== 'admin' && attendance.batchId.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Attendance record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  markAttendance,
  markAllPresent,
  getAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance
};
