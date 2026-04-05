const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Batch = require('../models/Batch');

// @desc    Protect routes — verify JWT and attach user to req
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password').lean();
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account suspended. Please contact support.' });
      }

      // If user is not SuperAdmin, check if their institute is active
      if (req.user.role !== 'superadmin' && req.user.instituteId) {
        const institute = await User.findById(req.user.instituteId).lean();
        if (institute && !institute.isActive) {
           return res.status(403).json({ message: 'Institute account suspended. Please contact support.' });
        }
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @desc    Authorize teacher to only access their own batches; admins bypass
const authorizeTeacherBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id || req.body.batchId;
    if (!batchId) return res.status(400).json({ message: 'Batch ID required' });

    const { user } = req;

    // SuperAdmin and Admin have full access
    if (user.role === 'superadmin' || user.role === 'admin') return next();

    // Teachers can only access their own batches
    if (user.role === 'teacher') {
      const batch = await Batch.findById(batchId).lean();
      if (!batch || batch.teacherId.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: Not your batch' });
      }

      // Check institute isolation
      if (batch.instituteId.toString() !== user.instituteId.toString()) {
        return res.status(403).json({ message: 'Access denied: Batch belongs to another institute' });
      }

      return next();
    }

    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Single, correct export of both middleware functions
// @desc    Authorize by role
const authorize = (...roles) => {
  return (req, res, next) => {
    // SuperAdmin bypasses all role checks
    if (req.user.role === 'superadmin') return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorizeTeacherBatch, authorize };
