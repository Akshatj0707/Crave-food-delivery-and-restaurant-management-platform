const mongoose = require('mongoose');

const dbCheck = (req, res, next) => {
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting — allow both
  if (state === 1 || state === 2) return next();
  
  return res.status(503).json({
    success: false,
    message: 'Database not connected. Check MONGODB_URI on Render.',
    dbState: state,
    hint: 'Go to Render → Environment → verify MONGODB_URI is correct'
  });
};

module.exports = dbCheck;
