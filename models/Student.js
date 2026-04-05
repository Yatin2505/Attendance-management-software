const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profilePhoto: {
    type: String, // URL to student profile photo
    required: false
  },
  contactNumber: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
