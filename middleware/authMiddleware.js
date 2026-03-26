const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// New: Teacher batch auth middleware
const authorizeTeacherBatch = async (req, res, next) => {
  try {
    const batchId = req.params.id || req.body.batchId;
    if (!batchId) return res.status(400).json({ message: 'Batch ID required' });

    const { user } = req;

    // Admins have full access
    if (user.role === 'admin') return next();

    // Teachers only own batches
    if (user.role === 'teacher') {
      const { Batch } = await import('../models/Batch.js');
      const batch = await Batch.findById(batchId).lean();
      if (!batch || batch.teacherId.toString() !== user.id) {
        return res.status(403).json({ message: 'Access denied: Not your batch' });
      }
      return next();
    }

    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { protect, authorizeTeacherBatch };

module.exports = { protect };
