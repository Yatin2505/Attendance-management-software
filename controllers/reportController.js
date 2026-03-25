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

    const studentIdObj = new mongoose.Types.ObjectId(studentId);

    const matchStage = { $match: { studentId: studentIdObj } };
    
    // Aggregate overall attendance
    const report = await Attendance.aggregate([
      matchStage,
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      }
    ]);

    if (report.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this student' });
    }

    const data = report[0];
    const percentage = getPercentage(data.presentDays, data.totalDays);

    const student = await Student.findById(studentId).select('name rollNumber');

    res.status(200).json({
      student,
      stats: {
        totalDays: data.totalDays,
        presentDays: data.presentDays,
        absentDays: data.absentDays,
        percentage
      }
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
    const batchIdObj = new mongoose.Types.ObjectId(batchId);

    const report = await Attendance.aggregate([
      { $match: { batchId: batchIdObj } },
      {
        $group: {
          _id: '$studentId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
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
      { $unwind: '$studentInfo' },
      {
        $project: {
          studentId: '$_id',
          name: '$studentInfo.name',
          rollNumber: '$studentInfo.rollNumber',
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { rollNumber: 1 } }
    ]);

    // Format percentage nicely
    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number(r.percentage.toFixed(2))
    }));

    const batch = await Batch.findById(batchId).select('name timing');

    res.status(200).json({
      batch,
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

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide month (1-12) and year' });
    }

    // JS Date is 0-indexed for month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

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
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
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
      { $unwind: '$studentInfo' },
      {
        $project: {
          name: '$studentInfo.name',
          rollNumber: '$studentInfo.rollNumber',
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { 'studentInfo.name': 1 } }
    ]);

    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number(r.percentage.toFixed(2))
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
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
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
      { $unwind: '$studentInfo' },
      {
        $project: {
          name: '$studentInfo.name',
          rollNumber: '$studentInfo.rollNumber',
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { 'studentInfo.name': 1 } }
    ]);

    const formattedReport = report.map(r => ({
      ...r,
      percentage: Number(r.percentage.toFixed(2))
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
