require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db/init');
const authMiddleware = require('./middleware/auth');
const projectRoutes = require('./routes/projects');
const analyzeRoutes = require('./routes/analyze');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3100;

// CORS — configurable via CORS_ORIGIN env var (comma-separated origins)
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin
  ? { origin: corsOrigin.split(',').map(s => s.trim()), credentials: true }
  : undefined // default: allow all (safe for local dev, restrict in production)
));

// HTTP request logging
app.use(morgan('combined'));

// Body parser — 512KB is plenty for architecture descriptions
app.use(express.json({ limit: '512kb' }));

// Health check (no auth required — for monitoring/load balancers)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Auth middleware for all other API routes
app.use('/api', authMiddleware);

// Rate limiting for analysis endpoints (expensive LLM calls)
const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { error: 'Too many analysis requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/analyze', analyzeLimiter, analyzeRoutes);
app.use('/api/config', configRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  // In Docker: /app/dist (Dockerfile copies client/dist to /app/dist)
  // Locally: would need to run `npm run build` in client/ first
  const candidatePaths = [
    path.resolve(__dirname, '../dist'),          // Docker: /app/dist
    path.resolve(__dirname, '../../client/dist'), // Local: server/src → server → client/dist
  ];
  const distPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html')));
  if (distPath) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  No dist/ directory found — frontend will not be served');
  }
}

// Start
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🛡️ ThreatForge API running on http://localhost:${PORT}`);
    if (process.env.TF_ADMIN_KEY) {
      console.log('🔐 API authentication enabled (TF_ADMIN_KEY is set)');
    } else {
      console.log('⚠️  No TF_ADMIN_KEY set — API is open (set env var to enable auth)');
    }
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
