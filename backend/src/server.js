require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const routes = require('./routes');
const paymentController = require('./controllers/paymentController');

const app = express();

// ─── Trust Render proxy ───────────────────────────────────
app.set('trust proxy', 1);

// ─── Stripe Webhook ───────────────────────────────────────
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// ─── Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS — fully open ────────────────────────────────────
app.use(cors());
app.options('*', cors());

// ─── Health (no DB needed) ────────────────────────────────
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    service: 'Crave API',
    dbStatus: states[mongoose.connection.readyState],
    mongoUri: process.env.MONGODB_URI ? 'SET ✅' : 'NOT SET ❌',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Crave API is running!',
    health: '/health',
    restaurants: '/api/restaurants',
  });
});

// ─── Connect DB then mount routes ─────────────────────────
connectDB()
  .then(() => {
    app.use('/api', routes);
    console.log('✅ Routes mounted');
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    // Still mount routes so health check works
    app.use('/api', routes);
  });

// ─── Fallback API error ───────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Crave API running on port ${PORT}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET ✅' : 'NOT SET ❌'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
});

module.exports = app;
