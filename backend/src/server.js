require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const routes = require('./routes');
const paymentController = require('./controllers/paymentController');

const app = express();

// ─── Connect MongoDB ───────────────────────────────────────
connectDB().catch(err => {
  console.error('❌ Failed to connect MongoDB:', err.message);
  process.exit(1);
});

// ─── Stripe Webhook (raw body) ────────────────────────────
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// ─── Core Middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.endsWith('.cyclic.app') ||
      origin.endsWith('.cyclic.cloud') ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app') ||
      origin === process.env.FRONTEND_URL ||
      origin === 'http://localhost:3000'
    ) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve React Frontend (Production) ────────────────────
// Check multiple possible build locations
const frontendBuildPaths = [
  path.join(__dirname, '../../frontend/build'),
  path.join(__dirname, '../public/app'),
  path.join(__dirname, '../../build'),
];

let frontendPath = null;
const fs = require('fs');
for (const p of frontendBuildPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    frontendPath = p;
    console.log(`✅ Serving frontend from: ${p}`);
    break;
  }
}

if (frontendPath) {
  // Serve static files
  app.use(express.static(frontendPath));
  // All non-API routes → React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
} else {
  console.log('⚠️  Frontend build not found — API only mode');
  app.get('/', (req, res) => {
    res.json({
      message: '🍽️ Crave API is running!',
      health: '/health',
      api: '/api',
    });
  });
}

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
  console.log(`🚀 Crave running on port ${PORT}`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

module.exports = app;
