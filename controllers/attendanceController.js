const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const { notifyAdmins, createNotification } = require('./notificationController');

// Helper: normalize a date to UTC midnight
const toUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// Helper: check if a user can access a batch
const canAccessBatch = (user, batch) => {
  if (user.role === 'superadmin') return true;
  if (user.role === 'admin') {
    return batch.instituteId.toString() === user._id.toString();
  }
  if (user.role === 'teacher') {
    return batch.teacherId?.toString() === user._id.toString() && 
           batch.instituteId?.toString() === user.instituteId.toString();
  }
  return false;
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

    if (!['present', 'absent', 'late', 'leave'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present, absent, late, or leave' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (!canAccessBatch(req.user, batch)) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    const attendanceDate = toUTCMidnight(date);
    const instituteId = batch.instituteId;

    // Upsert: update if exists, create if not — avoids duplicate key errors
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, batchId, date: attendanceDate },
      {
        $set: {
          status,
          teacherId: req.user.id,
          leaveType: req.body.leaveType || undefined,
          notes: notes || '',
          instituteId
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Trigger notification if absent
    if (status === 'absent') {
      const student = await Student.findById(studentId);
      const msg = `Student ${student?.name || 'Unknown'} was marked ABSENT in ${batch.name}`;
      await notifyAdmins('Student Absent', msg, 'warning');
      if (batch.teacherId && batch.teacherId.toString() !== req.user.id) {
        await createNotification(batch.teacherId, 'Student Absent', msg, 'warning');
      }
    }

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
    const instituteId = batch.instituteId;
    const results = [];

    for (const student of batch.students) {
      const record = await Attendance.findOneAndUpdate(
        { studentId: student._id, batchId: batch._id, date: attendanceDate },
        {
          $setOnInsert: {
            status: 'present',
            teacherId: req.user.id,
            notes: '',
            instituteId
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

// @desc    Bulk upsert attendance for an entire batch (single request, uses bulkWrite)
// @route   POST /api/attendance/bulk
// @access  Private
const markAttendanceBulk = async (req, res) => {
  try {
    const { batchId, date, records } = req.body;
    // records: [{ studentId, status, notes? }]

    if (!batchId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Please provide batchId, date, and a non-empty records array' });
    }

    const validStatuses = ['present', 'absent', 'late', 'leave'];
    for (const r of records) {
      if (!r.studentId || !validStatuses.includes(r.status)) {
        return res.status(400).json({ message: `Invalid record: each entry needs studentId and a valid status` });
      }
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (!canAccessBatch(req.user, batch)) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this batch' });
    }

    const attendanceDate = toUTCMidnight(date);
    const instituteId = batch.instituteId;

    const bulkOps = records.map(({ studentId, status, notes, leaveType }) => ({
      updateOne: {
        filter: { studentId, batchId, date: attendanceDate },
        update: {
          $set: {
            status,
            teacherId: req.user.id,
            leaveType: leaveType || undefined,
            notes: notes || '',
            instituteId
          }
        },
        upsert: true
      }
    }));

    const result = await require('../models/Attendance').bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({
      message: `Bulk upsert complete`,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      total: records.length
    });

    // Trigger notification for bulk marking
    const absentCount = records.filter(r => r.status === 'absent').length;
    const msg = `Attendance marked for batch ${batch.name}. Total: ${records.length}, Absentees: ${absentCount}`;
    await notifyAdmins('Attendance Marked', msg, 'success');
    if (batch.teacherId && batch.teacherId.toString() !== req.user.id) {
      await createNotification(batch.teacherId, 'Attendance Marked', msg, 'success');
    }
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
    const { user } = req;
    let query = {};

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      query.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    // 2. Teacher scope isolation
    if (user.role === 'teacher') {
      const myBatches = await Batch.find({ teacherId: user._id }).select('_id');
      const myBatchIds = myBatches.map(b => b._id.toString());

      if (myBatchIds.length === 0) {
        return res.status(200).json([]); 
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

    if (!['present', 'absent', 'late', 'leave'].includes(status)) {
      return res.status(400).json({ message: 'Status must be present, absent, late, or leave' });
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

// @desc    Get attendance trends (aggregated by date) typically for charts
// @route   GET /api/attendance/trends
// @access  Private
const getAttendanceTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { user } = req;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    let matchQuery = { date: { $gte: startDate } };

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      matchQuery.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    // 2. Teacher isolation check
    if (user.role === 'teacher') {
      const myBatches = await Batch.find({ teacherId: user._id }).select('_id');
      matchQuery.batchId = { $in: myBatches.map(b => b._id) };
    }

    const trends = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          },
          leave: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          present: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  markAttendance,
  markAttendanceBulk,
  markAllPresent,
  getAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  getAttendanceTrends
};
