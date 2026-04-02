const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const path = require('path');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance');
    const students = await Student.find({}, 'name rollNumber').limit(5);
    console.log('--- FOUND STUDENTS ---');
    console.log(students);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
