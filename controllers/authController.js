const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber } = req.body;
    const creator = req.user; // Set by protect middleware

    // 1. Role-based Authorization logic
    if (role === 'admin') {
      if (creator.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only SuperAdmin can create Admin accounts' });
      }
    } else if (['teacher', 'student', 'parent'].includes(role)) {
      if (creator.role !== 'admin' && creator.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only Admin or SuperAdmin can create these accounts' });
      }
    } else if (role === 'superadmin') {
       return res.status(403).json({ message: 'Cannot create SuperAdmin via this route' });
    }

    let studentId = null;
    let instituteId = null;

    // 2. Determine Institute ID
    if (role === 'admin') {
      // New admin is their own institute head
      instituteId = null; // Will be set to self after creation if needed, or left null
    } else {
      // Subordinates inherit the Admin's instituteId
      instituteId = creator.role === 'admin' ? creator._id : creator.instituteId;
    }

    // 3. Student Linkage
    if (role === 'student' || role === 'parent') {
      if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required' });
      }
      const student = await Student.findOne({ rollNumber, instituteId });
      if (!student) {
        return res.status(404).json({ message: 'Student not found in this institute' });
      }
      studentId = student._id;
    }

    // 4. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 5. Create user
    const user = await User.create({
      name,
      email,
      password,
      plainPassword: password, // As requested for visibility
      role,
      studentId,
      instituteId,
      logo: req.body.logo,
      brandingColor: req.body.brandingColor
    });

    // If it's a new admin, they are their own institute
    if (role === 'admin') {
      user.instituteId = user._id;
      await user.save();
    }

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plainPassword: user.plainPassword,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        isActive: user.isActive,
        logo: user.logo,
        brandingColor: user.brandingColor,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If not superadmin, find the institute's branding
    if (user.role !== 'superadmin' && user.instituteId) {
      const institute = await User.findById(user.instituteId).select('logo brandingColor name').lean();
      if (institute) {
        user.instituteLogo = institute.logo;
        user.instituteColor = institute.brandingColor;
        user.instituteName = institute.name;
      }
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change current user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword
};
