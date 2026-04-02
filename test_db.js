const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Define schema directly to avoid import issues
const studentSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  batches: [mongoose.Schema.Types.ObjectId]
});
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    let students = await Student.find({}, 'name rollNumber').limit(5);
    
    if (students.length === 0) {
      console.log('No students found. Creating a test student...');
      const newStudent = await Student.create({
        name: 'Test Student',
        rollNumber: 'ROLL001',
        batches: []
      });
      console.log('Created Student:', newStudent);
      students = [newStudent];
    } else {
      console.log('--- FOUND STUDENTS ---');
      console.log(JSON.stringify(students, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
