const User = require('../models/User');

// @desc    Get all teachers
// @route   GET /api/users/teachers
// @access  Private/Admin
const getTeachers = async (req, res) => {
  try {
    // Only admins can see the full list of teachers to assign them to batches
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTeachers,
};
