const mongoose = require('mongoose');

// Middleware to check DB connection before any API route
const dbCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connecting... please retry in a few seconds',
      dbStatus: mongoose.connection.readyState,
    });
  }
  next();
};

module.exports = dbCheck;
