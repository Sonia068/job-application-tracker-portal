// ============================================================
// Job Application Tracker - Express Server Entry Point
// ============================================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startReminderCron } = require('./services/cronService');

// Load environment variables
dotenv.config();

// Connect to MongoDB (skip during standalone unit/mock tests if configured)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Static Files (Uploads) ──────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'Job Tracker API running 🚀' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startReminderCron();
  });
}

module.exports = app;