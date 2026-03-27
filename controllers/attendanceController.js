const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// Helper: normalize a date to UTC midnight
const toUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// Helper: check if a user can access a batch
const canAccessBatch = (user, batch) => {
  if (user.role === 'admin') return true;
  if (!batch.teacherId) return false;
  return batch.teacherId.toString() === user.id;
};

// @desc    Mark attendance for a student (upsert — creates or updates)
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { studentId, batchId, date, status, notes } = req.body;

    if (!studentId || !batchId || !date || !status) {
      return res.status(400).json({ message: 'Please provide studentId, batchId, date, and status' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present, absent, or late' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (!canAccessBatch(req.user, batch)) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    const attendanceDate = toUTCMidnight(date);

    // Upsert: update if exists, create if not — avoids duplicate key errors
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, batchId, date: attendanceDate },
      {
        $set: {
          status,
          teacherId: req.user.id,
          notes: notes || ''
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark all students in a batch as present for a given date (upsert)
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

    if (!canAccessBatch(req.user, batch)) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    const attendanceDate = toUTCMidnight(date);
    const results = [];

    for (const student of batch.students) {
      const record = await Attendance.findOneAndUpdate(
        { studentId: student._id, batchId: batch._id, date: attendanceDate },
        {
          $setOnInsert: {
            status: 'present',
            teacherId: req.user.id,
            notes: ''
          }
        },
        { upsert: true, new: true }
      );
      results.push(record);
    }

    res.status(200).json({
      message: `Marked ${results.length} students as present.`,
      createdRecords: results
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

      if (myBatchIds.length === 0) {
        return res.status(200).json([]); // No assigned batches — return empty, not 403
      }

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
      const searchDate = toUTCMidnight(date);
      const nextDay = new Date(searchDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
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

    if (!canAccessBatch(req.user, attendance.batchId || {})) {
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

    if (!canAccessBatch(req.user, attendance.batchId || {})) {
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
