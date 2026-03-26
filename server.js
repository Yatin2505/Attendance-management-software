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

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
// app.use(cors());
app.use(cors({
  origin: "*"
}))
app.use(express.json());

// Routes
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
