const mongoose = require('mongoose');

// Cache connection across warm invocations in serverless
let cachedConn = null;

const connectDB = async () => {
  // Return cached connection if still alive
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      // Important for serverless — don't buffer commands
      bufferCommands: false,
    });

    cachedConn = conn;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    cachedConn = null;
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

module.exports = connectDB;
