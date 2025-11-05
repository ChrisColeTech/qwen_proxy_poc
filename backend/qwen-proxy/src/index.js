/**
 * Main Entry Point
 * Part of Phase 11: Main Server Setup with All Routes
 *
 * Starts the Express server and handles graceful shutdown
 */

const app = require('./server');
const config = require('./config');
const { initializeDatabase, shutdownDatabase } = require('./database');

const PORT = config.port;

// Initialize database before starting server
(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('[Fatal] Database initialization failed:', error);
    process.exit(1);
  }

  // Check credential status
  const auth = require('./api/qwen-auth');
  const credStatus = auth.isValid()
    ? '✓ Qwen credentials configured'
    : '⚠ Qwen credentials not configured - configure through dashboard';

  // Start server
  const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Qwen Proxy Backend');
  console.log('========================================');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${config.env}`);
  console.log(`${credStatus}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  Health check:  http://localhost:${PORT}/health`);
  console.log(`  Metrics:       http://localhost:${PORT}/metrics`);
  console.log(`  OpenAI API:    http://localhost:${PORT}/v1/`);
  if (!auth.isValid()) {
    console.log(`  Configure:     Open the Electron app and go to Settings`);
  }
  console.log('');
  console.log('Available routes:');
  console.log('  GET  /health');
  console.log('  GET  /health/detailed');
  console.log('  GET  /metrics');
  console.log('  GET  /v1/models');
  console.log('  GET  /v1/models/:model');
  console.log('  POST /v1/chat/completions');
  console.log('  POST /v1/completions');
  console.log('========================================');
});

  // Graceful shutdown handler
  function gracefulShutdown(signal) {
    console.log('');
    console.log(`[Shutdown] ${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('[Shutdown] HTTP server closed');

      // Shutdown chat completions handler (stops session cleanup)
      try {
        const { shutdown } = require('./handlers/chat-completions-handler');
        if (typeof shutdown === 'function') {
          shutdown();
          console.log('[Shutdown] Chat completions handler stopped');
        }
      } catch (e) {
        console.error('[Shutdown] Error stopping chat completions handler:', e.message);
      }

      // Shutdown database
      try {
        shutdownDatabase();
      } catch (e) {
        console.error('[Shutdown] Error closing database:', e.message);
      }

      console.log('[Shutdown] Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('[Shutdown] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[Fatal] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Fatal] Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Export server for testing
  module.exports = server;
})();
