require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const batchRoutes = require('./routes/batchRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
// Allow main production, all Vercel preview deployments, and local dev
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/attendance-management-software[a-z0-9-]*\.vercel\.app$/,
  /^https:\/\/attendance-management-software[a-z0-9-]*-yatin2505s-projects\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health & root info endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'Tecno Skill Attendance Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    docs: 'Use /health to check service health'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', studentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leave', require('./routes/leaveRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
