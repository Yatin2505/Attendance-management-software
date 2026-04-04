const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Bank', 'Other'],
    default: 'Cash'
  },
  remarks: String
}, { _id: true });

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Total fee amount is required']
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: 'Monthly Tuition Fee'
  },
  paymentHistory: [paymentHistorySchema]
}, {
  timestamps: true
});

// Pre-save hook to update status based on paidAmount
feeSchema.pre('save', function(next) {
  if (this.paidAmount >= this.amount) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Pending';
  }
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
