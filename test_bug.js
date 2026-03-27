require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Batch = require('./models/Batch');
const { markAllPresent } = require('./controllers/attendanceController');

async function debugLoop() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected');
  const admin = await User.findOne({ role: 'admin' });
  const batch = await Batch.findOne().populate('students');
  
  const req = {
    user: { id: admin._id.toString(), role: 'admin' },
    body: {
      batchId: batch._id.toString(),
      date: new Date().toISOString()
    }
  };

  const res = {
    status: (code) => {
      console.log('--- RESPONSE STATUS ---', code);
      return {
        json: (data) => {
          console.log('--- RESPONSE JSON ---');
          console.dir(data, { depth: null });
        }
      };
    }
  };

  await markAllPresent(req, res);
  process.exit(0);
}

debugLoop();
