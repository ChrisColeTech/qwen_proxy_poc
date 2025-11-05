/**
 * Metrics Handler - /metrics endpoint and middleware
 * Part of Phase 11: Main Server Setup with All Routes
 *
 * Provides Prometheus-compatible metrics for monitoring
 */

const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();

// Collect default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const qwenAPICallsTotal = new promClient.Counter({
  name: 'qwen_api_calls_total',
  help: 'Total number of Qwen API calls',
  labelNames: ['endpoint', 'status']
});

const qwenAPIErrorsTotal = new promClient.Counter({
  name: 'qwen_api_errors_total',
  help: 'Total number of Qwen API errors',
  labelNames: ['error_type']
});

const activeSessions = new promClient.Gauge({
  name: 'active_sessions',
  help: 'Number of active sessions'
});

const streamingConnectionsActive = new promClient.Gauge({
  name: 'streaming_connections_active',
  help: 'Number of active streaming connections'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(qwenAPICallsTotal);
register.registerMetric(qwenAPIErrorsTotal);
register.registerMetric(activeSessions);
register.registerMetric(streamingConnectionsActive);

/**
 * Middleware to track HTTP request metrics
 * Should be applied to all routes
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, path, res.statusCode).inc();
  });

  next();
}

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus exposition format
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function metrics(req, res) {
  try {
    // Update session metrics if available
    try {
      const sessionManager = require('../services/session-manager');
      if (sessionManager && typeof sessionManager.getMetrics === 'function') {
        const sessionMetrics = sessionManager.getMetrics();
        activeSessions.set(sessionMetrics.activeSessions || 0);
      }
    } catch (e) {
      // Session manager not available yet
    }

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to generate metrics',
        type: 'server_error',
        code: 'metrics_error'
      }
    });
  }
}

/**
 * Track a Qwen API call
 * @param {string} endpoint - The API endpoint called
 * @param {string} status - 'success' or 'error'
 */
function trackQwenAPICall(endpoint, status) {
  qwenAPICallsTotal.labels(endpoint, status).inc();
}

/**
 * Track a Qwen API error
 * @param {string} errorType - Type of error
 */
function trackQwenAPIError(errorType) {
  qwenAPIErrorsTotal.labels(errorType).inc();
}

/**
 * Update active streaming connections count
 * @param {number} count - New count
 */
function setStreamingConnections(count) {
  streamingConnectionsActive.set(count);
}

/**
 * Increment streaming connections
 */
function incrementStreamingConnections() {
  streamingConnectionsActive.inc();
}

/**
 * Decrement streaming connections
 */
function decrementStreamingConnections() {
  streamingConnectionsActive.dec();
}

module.exports = {
  register,
  metricsMiddleware,
  metrics,
  trackQwenAPICall,
  trackQwenAPIError,
  setStreamingConnections,
  incrementStreamingConnections,
  decrementStreamingConnections,
  // Export individual metrics for external use
  httpRequestDuration,
  httpRequestTotal,
  qwenAPICallsTotal,
  qwenAPIErrorsTotal,
  activeSessions,
  streamingConnectionsActive
};
