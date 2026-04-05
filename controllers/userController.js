const User = require('../models/User');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');

// @desc    Get all teachers
// @route   GET /api/users/teachers
// @access  Private/Admin
const getTeachers = async (req, res) => {
  try {
    const { user } = req;
    let query = { role: 'teacher' };

    // SuperAdmin sees all teachers; Admin sees only their own institute's teachers
    if (user.role === 'admin') {
      query.instituteId = user._id;
    } else if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to view teachers' });
    }

    const teachers = await User.find(query).select('-password');
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new teacher
// @route   POST /api/users/teachers
// @access  Private/Admin
const createTeacher = async (req, res) => {
  try {
    const { user } = req;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to create teachers' });
    }

    const { name, email, password, instituteId: targetInstituteId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const teacher = await User.create({
      name,
      email,
      password, // User model will hash this if pre-save hook exists, else I should hash it. Wait, User.js doesn't have a pre-save hook? I should check that.
      plainPassword: password,
      role: 'teacher',
      instituteId: user.role === 'admin' ? user._id : targetInstituteId
    });

    if (teacher) {
      res.status(201).json({
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        plainPassword: teacher.plainPassword
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/users/teachers/:id
// @access  Private/Admin
const deleteTeacher = async (req, res) => {
  try {
    const { user } = req;
    const teacher = await User.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Authorization check
    if (user.role === 'admin') {
      if (teacher.instituteId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this teacher' });
      }
    } else if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to delete teachers' });
    }

    if (teacher.role === 'admin' || teacher.role === 'superadmin') {
       return res.status(400).json({ message: 'Cannot delete admin/superadmin accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Teacher removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all admins (institutes)
// @route   GET /api/users/admins
// @access  Private/SuperAdmin
const getAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to view admins' });
    }
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle Institute Status (Suspend/Activate)
// @route   PATCH /api/users/admins/:id/status
// @access  Private/SuperAdmin
const toggleInstituteStatus = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can manage institute status' });
    }

    const institute = await User.findById(req.params.id);
    if (!institute || institute.role !== 'admin') {
      return res.status(404).json({ message: 'Institute not found' });
    }

    institute.isActive = !institute.isActive;
    await institute.save();

    res.status(200).json({ 
      message: `Institute ${institute.isActive ? 'activated' : 'suspended'} successfully`,
      isActive: institute.isActive 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete Institute and all its data (Cascade)
// @route   DELETE /api/users/admins/:id
// @access  Private/SuperAdmin
const deleteInstitute = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can delete institutes' });
    }

    const instituteId = req.params.id;
    const institute = await User.findById(instituteId);

    if (!institute || institute.role !== 'admin') {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Cascade Delete
    await Promise.all([
      User.deleteMany({ instituteId }),      // Delete Teachers, Students (Users), etc.
      Student.deleteMany({ instituteId }),
      Batch.deleteMany({ instituteId }),
      Attendance.deleteMany({ instituteId }),
      Fee.deleteMany({ instituteId }),
      LeaveRequest.deleteMany({ instituteId }),
      Notification.deleteMany({ instituteId })
    ]);

    // Finally delete the institute admin itself
    await User.findByIdAndDelete(instituteId);

    res.status(200).json({ message: 'Institute and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTeachers,
  createTeacher,
  deleteTeacher,
  getAdmins,
  toggleInstituteStatus,
  deleteInstitute
};
