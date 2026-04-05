const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const initSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const email = 'superadmin@example.com';
    const password = 'superpassword123';

    // Check if superadmin already exists
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('SuperAdmin already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = await User.create({
      name: 'Super Admin',
      email,
      password: hashedPassword,
      plainPassword: password, // As requested for SaaS management
      role: 'superadmin'
    });

    console.log('SuperAdmin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
    process.exit(1);
  }
};

initSuperAdmin();
