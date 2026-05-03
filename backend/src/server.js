require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const paymentController = require('./controllers/paymentController');

const app = express();

// ─── Security & Middleware ─────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS — allow all Vercel + Render preview URLs ─────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app')
    ) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, try again in 15 minutes' }
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check (Render pings this) ──────────────────────
app.get('/health', async (req, res) => {
  try {
    const pool = require('./config/database');
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'Crave API',
      db: 'connected',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      service: 'Crave API',
      db: 'disconnected',
      error: err.message
    });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({ message: '🍽️ Crave API is running', docs: '/health' });
});

// ─── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Crave API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = app;
