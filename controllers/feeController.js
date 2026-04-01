const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification, notifyAdmins } = require('./notificationController');

// @desc    Assign single student fee
// @route   POST /api/fees
// @access  Admin
const createFee = async (req, res) => {
  try {
    const { studentId, amount, month, year, dueDate, description } = req.body;
    
    const fee = await Fee.create({
      studentId, amount, month, year, dueDate, description
    });
    
    // Notify student
    const user = await User.findOne({ studentId });
    if (user) {
      await createNotification(
        user._id,
        'Fee Assigned',
        `A new fee of ₹${amount} for ${month} ${year} has been assigned to you.`,
        'info',
        '/student/dashboard'
      );
    }

    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Assign fees to all students in a batch
// @route   POST /api/fees/batch
// @access  Admin
const assignBatchFees = async (req, res) => {
  try {
    const { batchId, amount, month, year, dueDate, description } = req.body;
    
    // Find students in batch
    const students = await Student.find({ batches: batchId });
    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No students found in this batch' });
    }
    
    const feeRecords = students.map(s => ({
      studentId: s._id,
      amount, month, year, dueDate, description
    }));
    
    const result = await Fee.insertMany(feeRecords);

    // Notify students
    try {
      const studentIds = students.map(s => s._id);
      const feeUsers = await User.find({ studentId: { $in: studentIds } });
      const promises = feeUsers.map(u => 
        createNotification(
          u._id,
          'New Fee Assigned',
          `A new fee of ₹${amount} for ${month} ${year} has been assigned to your batch.`,
          'info',
          '/student/dashboard'
        )
      );
      await Promise.all(promises);
    } catch (err) {
      console.error('Batch notification error:', err);
    }

    res.status(201).json({ count: result.length, message: 'Fees assigned to batch' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Record a payment for a fee
// @route   PUT /api/fees/:id/payment
// @access  Admin
const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, remarks } = req.body;
    const fee = await Fee.findById(req.params.id);
    
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    
    fee.paidAmount += Number(amount);
    fee.paymentHistory.push({
      amount, paymentMethod, remarks, paymentDate: new Date()
    });
    
    await fee.save();

    // Notify student
    const feeUser = await User.findOne({ studentId: fee.studentId });
    if (feeUser) {
      await createNotification(
        feeUser._id,
        'Payment Recorded',
        `A payment of ₹${amount} for ${fee.month} ${fee.year} has been confirmed. Current status: ${fee.status}`,
        'success',
        '/student/dashboard'
      );
    }

    // Notify Admins
    await notifyAdmins(
      'Payment Confirmed',
      `Payment of ₹${amount} recorded for student ${feeUser?.name || 'Unknown'}. Status: ${fee.status}`,
      'success'
    );

    res.status(200).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all fees with filters
// @route   GET /api/fees
// @access  Admin
const getFees = async (req, res) => {
  try {
    const { studentId, batchId, status, month, year } = req.query;
    let query = {};
    
    if (studentId) query.studentId = studentId;
    if (status)    query.status = status;
    if (month)     query.month = month;
    if (year)      query.year = year;
    
    // If batchId is provided, we filter students belonging to that batch
    if (batchId) {
      const studentIds = await Student.find({ batches: batchId }).distinct('_id');
      query.studentId = { $in: studentIds };
    }
    
    const fees = await Fee.find(query)
      .populate('studentId', 'name rollNumber')
      .sort({ createdAt: -1 });
      
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own fees
// @route   GET /api/fees/me
// @access  Student
const getMyFees = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) return res.status(401).json({ message: 'No student linked to this account' });
    
    const fees = await Fee.find({ studentId })
      .sort({ createdAt: -1 });
      
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fee statistics for dashboard
// @route   GET /api/fees/stats
// @access  Admin
const getFeeStats = async (req, res) => {
  try {
    const stats = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPaid:   { $sum: '$paidAmount' }
        }
      }
    ]);
    
    const totals = stats[0] || { totalAmount: 0, totalPaid: 0 };
    res.status(200).json({
      totalCollected: totals.totalPaid,
      totalPending:   totals.totalAmount - totals.totalPaid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFee,
  assignBatchFees,
  recordPayment,
  getFees,
  getMyFees,
  getFeeStats
};
