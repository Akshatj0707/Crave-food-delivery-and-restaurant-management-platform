const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  console.log('🔄 Connecting to MongoDB...');
  console.log('   Host:', uri.split('@')[1]?.split('/')[0] || 'unknown');

  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      maxPoolSize: 5,
      retryWrites: true,
    });
    console.log('✅ MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB failed:', err.message);
    throw err;
  }

  mongoose.connection.on('error', err => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — reconnecting...');
    setTimeout(connectDB, 5000);
  });
};

module.exports = connectDB;
