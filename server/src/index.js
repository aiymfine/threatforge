const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/init');
const projectRoutes = require('./routes/projects');
const analyzeRoutes = require('./routes/analyze');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Start
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🛡️ ThreatForge API running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
