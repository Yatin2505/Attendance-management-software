const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// Helper to calculate percentage safely
const getPercentage = (present, total) => {
  if (total === 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
};

// @desc    Get attendance percentage for a specific student
// @route   GET /api/reports/student/:id
// @access  Private
const getStudentReport = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { user } = req;
    const studentIdObj = new mongoose.Types.ObjectId(studentId);

    // 1. Student Ownership Check
    const studentObj = await Student.findById(studentId).select('name rollNumber instituteId');
    if (!studentObj) return res.status(404).json({ message: 'Student not found' });
    
    if (user.role !== 'superadmin') {
      const myInst = user.role === 'admin' ? user._id : user.instituteId;
      if (studentObj.instituteId.toString() !== myInst.toString()) {
        return res.status(403).json({ message: 'Access denied: Not your student' });
      }
    }

    const matchStage = { $match: { studentId: studentIdObj } };
    
    // Add instituteId to match stage for safety
    if (user.role !== 'superadmin') {
      matchStage.$match.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }
    
    // Aggregate attendance grouped by Batch
    const report = await Attendance.aggregate([
      matchStage,
      {
        $group: {
          _id: '$batchId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batchInfo'
        }
      },
      { $unwind: { path: '$batchInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          batchId: '$_id',
          batchName: { $ifNull: ['$batchInfo.name', 'Deleted Batch'] },
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          leaveDays: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$totalDays', '$leaveDays'] }, 0] },
              { $multiply: [ { $divide: ['$presentDays', { $subtract: ['$totalDays', '$leaveDays'] }] }, 100 ] },
              0
            ]
          }
        }
      },
      { $sort: { batchName: 1 } }
    ]);

    // Calculate global stats dynamically
    let globalTotal = 0, globalPresent = 0, globalAbsent = 0, globalLeave = 0;
    
    const batchReports = report.map(r => {
      globalTotal   += r.totalDays;
      globalPresent += r.presentDays;
      globalAbsent  += r.absentDays;
      globalLeave   += r.leaveDays;
      return {
        ...r,
        percentage: Number(r.percentage.toFixed(2))
      };
    });

    res.status(200).json({
      student: studentObj,
      stats: {
        totalDays:   globalTotal,
        presentDays: globalPresent,
        absentDays:  globalAbsent,
        leaveDays:   globalLeave,
        percentage:  getPercentage(globalPresent, globalTotal - globalLeave)
      },
      batchReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance data for all students in a batch
// @route   GET /api/reports/batch/:batchId
// @access  Private
const getBatchReport = async (req, res) => {
  try {
    const batchId = req.params.batchId;
    const { user } = req;
    const batchIdObj = new mongoose.Types.ObjectId(batchId);

    // 1. Batch Ownership Check
    const batchObj = await Batch.findById(batchId).select('name timing instituteId');
    if (!batchObj) return res.status(404).json({ message: 'Batch not found' });

    if (user.role !== 'superadmin') {
      const myInst = user.role === 'admin' ? user._id : user.instituteId;
      if (batchObj.instituteId.toString() !== myInst.toString()) {
        return res.status(403).json({ message: 'Access denied: Not your batch' });
      }
    }

    const matchQuery = { batchId: batchIdObj };
    if (user.role !== 'superadmin') {
      matchQuery.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    const report = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: '$_id',
          name: { $ifNull: ['$studentInfo.name', 'Deleted Student'] },
          rollNumber: { $ifNull: ['$studentInfo.rollNumber', 'N/A'] },
          totalDays: 1,
          presentDays: 1,
          leaveDays: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$totalDays', '$leaveDays'] }, 0] },
              { $multiply: [ { $divide: ['$presentDays', { $subtract: ['$totalDays', '$leaveDays'] }] }, 100 ] },
              0
            ]
          }
        }
      },
      { $sort: { rollNumber: 1 } }
    ]);

    // Format percentage nicely
    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number((r.percentage || 0).toFixed(2))
    }));

    res.status(200).json({
      batch: batchObj,
      studentsReport: formattedReport
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Monthly Report - get structured attendance for a month
// @route   GET /api/reports/monthly?month=3&year=2026&batchId=...
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, batchId } = req.query;
    const { user } = req;

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month (1-12) and year' });
    }

    // JS Date is 0-indexed for month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      matchQuery.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    if (batchId) {
      matchQuery.batchId = new mongoose.Types.ObjectId(batchId);
    }

    const report = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$studentInfo.name', 'Deleted Student'] },
          rollNumber: { $ifNull: ['$studentInfo.rollNumber', 'N/A'] },
          totalDays: 1,
          presentDays: 1,
          leaveDays: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$totalDays', '$leaveDays'] }, 0] },
              { $multiply: [ { $divide: ['$presentDays', { $subtract: ['$totalDays', '$leaveDays'] }] }, 100 ] },
              0
            ]
          }
        }
      },
      { $sort: { 'studentInfo.name': 1 } }
    ]);

    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number((r.percentage || 0).toFixed(2))
    }));

    res.status(200).json({
      period: { month, year },
      data: formattedReport
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Date Range Report - get attendance between dates
// @route   GET /api/reports/range?from=2026-03-01&to=2026-03-15&batchId=...
// @access  Private
const getDateRangeReport = async (req, res) => {
  try {
    const { from, to, batchId } = req.query;
    const { user } = req;

    if (!from || !to) {
      return res.status(400).json({ message: 'Please provide from and to dates (YYYY-MM-DD)' });
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      matchQuery.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    if (batchId) {
      matchQuery.batchId = new mongoose.Types.ObjectId(batchId);
    }

    const report = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          },
          leaveDays: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$studentInfo.name', 'Deleted Student'] },
          rollNumber: { $ifNull: ['$studentInfo.rollNumber', 'N/A'] },
          totalDays: 1,
          presentDays: 1,
          leaveDays: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$totalDays', '$leaveDays'] }, 0] },
              { $multiply: [ { $divide: ['$presentDays', { $subtract: ['$totalDays', '$leaveDays'] }] }, 100 ] },
              0
            ]
          }
        }
      },
      { $sort: { 'studentInfo.name': 1 } }
    ]);

    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number((r.percentage || 0).toFixed(2))
    }));

    res.status(200).json({
      period: { from: startDate, to: endDate },
      data: formattedReport
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentReport,
  getBatchReport,
  getMonthlyReport,
  getDateRangeReport
};
