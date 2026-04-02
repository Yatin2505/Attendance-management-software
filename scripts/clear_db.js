require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing Attendance...');
    await Attendance.deleteMany({});

    console.log('Clearing Students...');
    await Student.deleteMany({});

    console.log('Clearing Batches...');
    await Batch.deleteMany({});

    console.log('Clearing Fees...');
    await Fee.deleteMany({});

    console.log('Clearing Notifications...');
    await Notification.deleteMany({});

    console.log('Clearing Leave Requests...');
    await LeaveRequest.deleteMany({});

    console.log('Clearing Users (except admins)...');
    // Keep admins, or at least yatin@test.com
    await User.deleteMany({ role: { $ne: 'admin' } });
    
    // Specifically ensure yatin@test.com is kept if he is an admin
    const adminExists = await User.findOne({ email: 'yatin@test.com' });
    if (adminExists) {
      console.log('Preserved admin user: yatin@test.com');
    } else {
      console.warn('Warning: yatin@test.com not found among admins. Please ensure you have an admin account.');
    }

    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
