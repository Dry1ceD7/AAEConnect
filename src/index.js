const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version,
    bmad: {
      installed: require('fs').existsSync('.bmad-core'),
      agents: require('fs').existsSync('.cursor/rules/bmad'),
    },
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  // Basic metrics - in production, use prom-client library
  const metrics = `
# HELP aaeconnect_uptime_seconds Application uptime in seconds
# TYPE aaeconnect_uptime_seconds gauge
aaeconnect_uptime_seconds ${process.uptime()}

# HELP aaeconnect_memory_usage_bytes Memory usage in bytes
# TYPE aaeconnect_memory_usage_bytes gauge
aaeconnect_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
aaeconnect_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
aaeconnect_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// API routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AAEConnect - Advanced AI-Enabled Connection Platform',
    version: require('../package.json').version,
    bmad: 'Powered by BMAD Method',
    documentation: '/docs',
    health: '/health',
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 AAEConnect server running on port ${PORT}`);
  console.log(
    `🧙 BMAD Method: ${require('fs').existsSync('.bmad-core') ? 'Active' : 'Not Found'}`
  );
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
