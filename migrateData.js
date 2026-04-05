const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Batch = require('./models/Batch');
const Attendance = require('./models/Attendance');
const Fee = require('./models/Fee');
const LeaveRequest = require('./models/LeaveRequest');
const Notification = require('./models/Notification');

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for migration...');

    // 1. Find the primary/first admin to own existing data
    const primaryAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!primaryAdmin) {
      console.error('No admin found to assign existing data to. Please create an admin first.');
      process.exit(1);
    }
    const instId = primaryAdmin._id;
    console.log(`Migrating orphaned data to Institute/Admin: ${primaryAdmin.email} (${instId})`);

    // 2. Models to update
    const models = [
      { name: 'Student', model: Student },
      { name: 'Batch', model: Batch },
      { name: 'Attendance', model: Attendance },
      { name: 'Fee', model: Fee },
      { name: 'LeaveRequest', model: LeaveRequest },
      { name: 'Notification', model: Notification }
    ];

    for (const m of models) {
      const result = await m.model.updateMany(
        { $or: [{ instituteId: { $exists: false } }, { instituteId: null }] },
        { $set: { instituteId: instId } }
      );
      console.log(`Updated ${result.modifiedCount} ${m.name} records.`);
    }

    // 3. Update Teachers and Students (User model)
    const usersResult = await User.updateMany(
      { 
        role: { $in: ['teacher', 'student'] },
        $or: [{ instituteId: { $exists: false } }, { instituteId: null }]
      },
      { $set: { instituteId: instId } }
    );
    console.log(`Updated ${usersResult.modifiedCount} User roles (teachers/students).`);

    // 4. Ensure Admin owns themselves (redundant but safe)
    await User.updateOne({ _id: instId }, { $set: { instituteId: instId } });

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
