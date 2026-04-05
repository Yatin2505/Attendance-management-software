const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Personal Leave', 'Holiday', 'Other'],
    required: false
  },
  leaveRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveRequest',
    required: false
  },
  notes: {
    type: String,
    default: ''
  },
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add compound index to prevent duplicate attendance marked for the same student, same batch, on the exact same date
attendanceSchema.index({ studentId: 1, batchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
