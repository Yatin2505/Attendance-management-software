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
    const { user } = req;
    
    // 1. Institute Isolation Check
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const instituteId = student.instituteId;
    if (user.role !== 'superadmin' && instituteId.toString() !== (user.role === 'admin' ? user._id : user.instituteId).toString()) {
      return res.status(403).json({ message: 'Access denied: Student belongs to another institute' });
    }

    const fee = await Fee.create({
      studentId, amount, month, year, dueDate, description, instituteId
    });
    
    // Notify student
    const studentUser = await User.findOne({ studentId });
    if (studentUser) {
      await createNotification(
        studentUser._id,
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
    const { user } = req;
    
    // Determine target institute
    const myInst = user.role === 'admin' ? user._id : user.instituteId;
    const instituteId = user.role === 'superadmin' ? (await Batch.findById(batchId))?.instituteId : myInst;

    // Find students in batch within the same institute
    const students = await Student.find({ batches: batchId, instituteId });
    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No students found in this batch within your institute' });
    }
    
    const feeRecords = students.map(s => ({
      studentId: s._id,
      amount, month, year, dueDate, description,
      instituteId
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
    const { user } = req;
    const fee = await Fee.findById(req.params.id);
    
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    
    // Institute Isolation
    const myInst = user.role === 'admin' ? user._id : user.instituteId;
    if (user.role !== 'superadmin' && fee.instituteId.toString() !== myInst.toString()) {
      return res.status(403).json({ message: 'Access denied: Not your institute record' });
    }
    
    fee.paidAmount += Number(amount);
    fee.paymentHistory.push({
      amount: Number(amount), 
      paymentMethod, 
      remarks, 
      paymentDate: new Date()
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
    const populatedFee = await Fee.findById(fee._id).populate('studentId');
    await notifyAdmins(
      'Payment Confirmed',
      `Payment of ₹${amount} recorded for student ${populatedFee.studentId?.name || 'Unknown'}. Status: ${populatedFee.status}`,
      'success'
    );

    res.status(200).json(fee);
  } catch (error) {
    console.error('Payment recording error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all fees with filters
// @route   GET /api/fees
// @access  Admin
const getFees = async (req, res) => {
  try {
    const { studentId, batchId, status, month, year } = req.query;
    const { user } = req;
    let query = {};
    
    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      query.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    if (studentId) query.studentId = studentId;
    if (status)    query.status = status;
    if (month)     query.month = month;
    if (year)      query.year = year;
    
    // If batchId is provided, we filter students belonging to that batch
    if (batchId) {
      const studentIds = await Student.find({ batches: batchId, ... (query.instituteId ? { instituteId: query.instituteId } : {}) }).distinct('_id');
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
    const { user } = req;
    let matchQuery = {};

    // Institute Isolation
    if (user.role !== 'superadmin') {
      matchQuery.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    const stats = await Fee.aggregate([
      { $match: matchQuery },
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

// @desc    Update a fee record
// @route   PUT /api/fees/:id
// @access  Admin
const updateFee = async (req, res) => {
  try {
    const { amount, month, year, dueDate, description } = req.body;
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (amount !== undefined)      fee.amount = amount;
    if (month !== undefined)       fee.month = month;
    if (year !== undefined)        fee.year = year;
    if (dueDate !== undefined)     fee.dueDate = dueDate;
    if (description !== undefined) fee.description = description;

    const updatedFee = await fee.save();
    res.status(200).json(updatedFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a fee record
// @route   DELETE /api/fees/:id
// @access  Admin
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    await Fee.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Fee record deleted successfully' });
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
  getFeeStats,
  updateFee,
  deleteFee
};
