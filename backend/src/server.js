require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const routes = require('./routes');
const paymentController = require('./controllers/paymentController');

const app = express();

// ─── Connect MongoDB ───────────────────────────────────────
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

// ─── Trust Render's proxy ─────────────────────────────────
app.set('trust proxy', 1);

// ─── Stripe Webhook (raw body before json parser) ─────────
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// ─── Core Middleware ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS — Open for all origins ──────────────────────────
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());

// ─── Rate Limiting ────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── API Routes ───────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'error',
    service: 'Crave API',
    database: 'MongoDB Atlas',
    dbStatus: states[mongoose.connection.readyState],
    environment: process.env.NODE_ENV,
    url: 'https://crave-api-aziw.onrender.com',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Crave API is running on Render!',
    version: '1.0.0',
    health: '/health',
    api: '/api',
    restaurants: '/api/restaurants',
  });
});

// ─── 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Crave API running on port ${PORT}`);
  console.log(`   URL: https://crave-api-aziw.onrender.com`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
