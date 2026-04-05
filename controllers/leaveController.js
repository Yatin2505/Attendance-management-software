const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');
const { notifyAdmins, createNotification } = require('./notificationController');

// Helper: normalize a date to UTC midnight
const toUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @desc    Create a new leave request
// @route   POST /api/leave
// @access  Private (Teacher/Admin)
const createLeaveRequest = async (req, res) => {
  try {
    const { studentId, batchId, startDate, endDate, type, reason } = req.body;

    if (!studentId || !batchId || !startDate || !endDate || !type || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Institute Isolation
    const { user } = req;
    const instituteId = batch.instituteId;
    if (user.role !== 'superadmin' && instituteId.toString() !== (user.role === 'admin' ? user._id : user.instituteId).toString()) {
      return res.status(403).json({ message: 'Access denied: Batch belongs to another institute' });
    }

    const leaveRequest = await LeaveRequest.create({
      studentId,
      batchId,
      startDate: toUTCMidnight(startDate),
      endDate: toUTCMidnight(endDate),
      type,
      reason,
      status: 'pending',
      instituteId
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all leave requests
// @route   GET /api/leave
// @access  Private
const getLeaveRequests = async (req, res) => {
  try {
    const { status, batchId, studentId } = req.query;
    const { user } = req;
    let query = {};

    // 1. Institute Isolation
    if (user.role !== 'superadmin') {
      query.instituteId = user.role === 'admin' ? user._id : user.instituteId;
    }

    if (status) query.status = status;
    if (batchId) query.batchId = batchId;
    if (studentId) query.studentId = studentId;

    // Teacher isolation
    if (req.user.role === 'teacher') {
      const myBatches = await Batch.find({ teacherId: req.user.id }).select('_id');
      const myBatchIds = myBatches.map(b => b._id.toString());
      query.batchId = { $in: batchId ? [batchId].filter(id => myBatchIds.includes(id)) : myBatchIds };
    }

    const requests = await LeaveRequest.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('batchId', 'name')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve or Reject leave request
// @route   PUT /api/leave/:id
// @access  Private (Teacher/Admin)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Authorization check
    const batch = await Batch.findById(leaveRequest.batchId);
    if (req.user.role !== 'admin' && batch.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to process this request' });
    }

    leaveRequest.status = status;
    leaveRequest.notes = notes || '';
    leaveRequest.processedBy = req.user.id;
    await leaveRequest.save();

    // Automation: If approved, mark attendance as leave for the date range
    if (status === 'approved') {
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);
      const bulkOps = [];

      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        bulkOps.push({
          updateOne: {
            filter: { 
              studentId: leaveRequest.studentId, 
              batchId: leaveRequest.batchId, 
              date: new Date(d) 
            },
            update: {
              $set: {
                status: 'leave',
                leaveType: leaveRequest.type,
                leaveRequestId: leaveRequest._id,
                teacherId: req.user.id,
                notes: `System marked: ${leaveRequest.type} - ${leaveRequest.reason}`,
                instituteId: leaveRequest.instituteId
              }
            },
            upsert: true
          }
        });
      }

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }
    } else if (status === 'rejected' || status === 'pending') {
        // If it was previously approved and now rejected/pending, remove the leave attendance records
        // Actually, maybe keep them but update status? Usually, rejection after approval means it's now 'absent' or blank.
        // For simplicity, if we move away from 'approved', we remove the system-generated leave records.
        await Attendance.deleteMany({ leaveRequestId: leaveRequest._id });
    }

    res.status(200).json(leaveRequest);

    // Trigger notification
    const student = await require('../models/Student').findById(leaveRequest.studentId);
    const msg = `Leave request for ${student?.name || 'Unknown'} has been ${status.toUpperCase()} by ${req.user.name}`;
    await notifyAdmins('Leave Status Update', msg, status === 'approved' ? 'success' : 'error');
    if (batch.teacherId && batch.teacherId.toString() !== req.user.id) {
      await createNotification(batch.teacherId, 'Leave Status Update', msg, status === 'approved' ? 'success' : 'error');
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete leave request
// @route   DELETE /api/leave/:id
// @access  Private (Admin)
const deleteLeaveRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete leave requests' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Clean up associated attendance records
    await Attendance.deleteMany({ leaveRequestId: leaveRequest._id });
    await leaveRequest.deleteOne();

    res.status(200).json({ message: 'Leave request removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveStatus,
  deleteLeaveRequest
};
