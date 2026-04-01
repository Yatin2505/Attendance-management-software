const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Fee = require('../models/Fee');

// Helper: normalize a date to UTC midnight
const toUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @desc    Get all dashboard stats in a single request
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = toUTCMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // -- Parallel queries for basic counts --
    const [
      totalStudents,
      totalBatches,
      totalTeachers,
      todayRecords,
      recentActivity,
      feeAgg
    ] = await Promise.all([
      Student.countDocuments(),
      Batch.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      // Today's attendance records
      Attendance.find({ date: { $gte: today, $lt: tomorrow } })
        .populate('studentId', 'name rollNumber')
        .populate('batchId', 'name')
        .lean(),
      // Last 5 attendance records (any date)
      Attendance.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'name rollNumber')
        .populate('batchId', 'name')
        .lean(),
      // Fee stats
      Fee.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalPaid:   { $sum: '$paidAmount' }
          }
        }
      ])
    ]);

    const feeTotals = (feeAgg && feeAgg[0]) || { totalAmount: 0, totalPaid: 0 };

    // Today stats
    const todayPresent = todayRecords.filter(r => r.status === 'present').length;
    const todayAbsent  = todayRecords.filter(r => r.status === 'absent').length;
    const todayLate    = todayRecords.filter(r => r.status === 'late').length;
    const todayLeave   = todayRecords.filter(r => r.status === 'leave').length;
    const todayTotal   = todayRecords.length;
    const todayDenom   = todayTotal - todayLeave;
    const todayPercentage = todayDenom > 0 ? Math.round(((todayPresent + todayLate) / todayDenom) * 100) : 0;

    // -- Overall attendance percentage (all time) --
    const overallAgg = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
        }
      }
    ]);
    const overallTotal   = overallAgg[0]?.total ?? 0;
    const overallPresent = overallAgg[0]?.present ?? 0;
    const overallLeave   = overallAgg[0]?.leave ?? 0;
    const overallDenom   = overallTotal - overallLeave;
    const overallPercentage = overallDenom > 0 ? Math.round((overallPresent / overallDenom) * 100) : 0;

    // -- Monthly attendance trend (last 30 days, grouped by day) --
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          leave:   { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          present: 1,
          leave: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$total', '$leave'] }, 0] },
              { $round: [{ $multiply: [{ $divide: ['$present', { $subtract: ['$total', '$leave'] }] }, 100] }, 0] },
              0
            ]
          },
          _id: 0
        }
      }
    ]);

    // -- Batch-wise attendance (all time) --
    const batchWise = await Attendance.aggregate([
      {
        $group: {
          _id: '$batchId',
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          leave:   { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
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
          batchName: { $ifNull: ['$batchInfo.name', 'Unknown'] },
          total: 1,
          present: 1,
          leave: 1,
          percentage: {
            $cond: [
              { $gt: [{ $subtract: ['$total', '$leave'] }, 0] },
              { $round: [{ $multiply: [{ $divide: ['$present', { $subtract: ['$total', '$leave'] }] }, 100] }, 0] },
              0
            ]
          }
        }
      },
      { $sort: { batchName: 1 } }
    ]);

    // -- Format recent activity --
    const activity = recentActivity.map(r => ({
      _id: r._id,
      studentName: r.studentId?.name ?? 'Unknown Student',
      rollNumber:  r.studentId?.rollNumber ?? '',
      batchName:   r.batchId?.name ?? 'Unknown Batch',
      status:      r.status,
      date:        r.date
    }));

    res.status(200).json({
      counts: {
        totalStudents,
        totalBatches,
        totalTeachers
      },
      today: {
        present: todayPresent,
        absent:  todayAbsent,
        late:    todayLate,
        leave:   todayLeave,
        total:   todayTotal,
        percentage: todayPercentage
      },
      overall: {
        total:   overallTotal,
        present: overallPresent,
        percentage: overallPercentage
      },
      monthlyTrend,
      batchWise,
      recentActivity: activity,
      fees: {
        totalCollected: feeTotals.totalPaid,
        totalPending:   feeTotals.totalAmount - feeTotals.totalPaid
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };
