const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'teacher', 'student', 'parent'],
    default: 'admin'
  },
  plainPassword: {
    type: String, // As requested for visibility by superiors
    required: false
  },
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Null for SuperAdmins; itself for Admins; Admin ID for others
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
