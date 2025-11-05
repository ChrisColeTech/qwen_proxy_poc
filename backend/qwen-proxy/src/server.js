/**
 * Main Express Server
 * Part of Phase 11: Main Server Setup with All Routes
 *
 * Registers all routes and middleware:
 * - Health endpoints (no auth required)
 * - Metrics endpoint (no auth required)
 * - API routes (require auth)
 * - CRUD endpoints for sessions, requests, responses (require auth)
 * - Error handlers
 *
 * Route Registration Summary:
 * | Method | Path                           | Handler              | Auth | Purpose                |
 * |--------|--------------------------------|----------------------|------|------------------------|
 * | GET    | /health                        | health               | No   | Health check           |
 * | GET    | /health/detailed               | detailedHealth       | No   | Detailed status        |
 * | GET    | /metrics                       | metrics              | No   | Prometheus metrics     |
 * | GET    | /v1/models                     | listModels           | Yes  | List models            |
 * | GET    | /v1/models/:model              | getModel             | Yes  | Get model              |
 * | POST   | /v1/chat/completions           | chatCompletions      | Yes  | Chat (main)            |
 * | POST   | /v1/completions                | completions          | Yes  | Legacy completions     |
 * | GET    | /v1/sessions                   | listSessions         | Yes  | List sessions          |
 * | GET    | /v1/sessions/:sessionId        | getSession           | Yes  | Get session details    |
 * | GET    | /v1/sessions/:sessionId/stats  | getSessionStats      | Yes  | Get session statistics |
 * | DELETE | /v1/sessions/:sessionId        | deleteSession        | Yes  | Delete session         |
 * | GET    | /v1/requests                   | listRequests         | Yes  | List requests          |
 * | GET    | /v1/requests/:id               | getRequest           | Yes  | Get request details    |
 * | GET    | /v1/sessions/:sessionId/reqs   | getSessionRequests   | Yes  | Get session requests   |
 * | GET    | /v1/responses                  | listResponses        | Yes  | List responses         |
 * | GET    | /v1/responses/stats            | getResponseStats     | Yes  | Get usage statistics   |
 * | GET    | /v1/responses/:id              | getResponse          | Yes  | Get response details   |
 * | GET    | /v1/requests/:requestId/resp   | getRequestResponse   | Yes  | Get request response   |
 */

const express = require('express');
const config = require('./config');

// Import middleware
const { metricsMiddleware } = require('./handlers/metrics-handler');
const authMiddleware = require('./middleware/auth-middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error-middleware');

// Import handlers
const { listModels, getModel } = require('./handlers/models-handler');
const { chatCompletions } = require('./handlers/chat-completions-handler');
const { completions } = require('./handlers/completions-handler');
const { health, detailedHealth } = require('./handlers/health-handler');
const { metrics } = require('./handlers/metrics-handler');

// Import CRUD handlers (Phase 5-7: Sessions, Requests, Responses)
const {
  listSessions,
  getSession,
  getSessionStats,
  deleteSession
} = require('./handlers/sessions-handler');

const {
  listRequests,
  getRequest,
  getSessionRequests
} = require('./handlers/requests-handler');

const {
  listResponses,
  getResponse,
  getRequestResponse,
  getResponseStats
} = require('./handlers/responses-handler');

// Create Express app
const app = express();

// Trust proxy (if behind nginx/load balancer)
if (config.security.trustProxy) {
  app.set('trust proxy', true);
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));

// Metrics middleware (track all requests)
app.use(metricsMiddleware);

// CORS middleware (if enabled)
if (config.security.corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.security.corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  if (config.logging.level === 'debug' || config.logging.level === 'info') {
    console.log(`[Server] ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50)
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.logging.level === 'debug') {
      console.log(`[Server] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
});

// ============================================================================
// Health endpoints (NO AUTH REQUIRED)
// ============================================================================

app.get('/health', health);
app.get('/health/detailed', detailedHealth);
app.get('/metrics', metrics);

// ============================================================================
// API routes (REQUIRE AUTH)
// ============================================================================

// Models endpoints
app.get('/v1/models', authMiddleware, listModels);
app.get('/v1/models/:model', authMiddleware, getModel);

// Chat completions endpoint (main)
app.post('/v1/chat/completions', authMiddleware, chatCompletions);

// Legacy completions endpoint
app.post('/v1/completions', authMiddleware, completions);

// ============================================================================
// CRUD API Endpoints (Phase 5-7: Sessions, Requests, Responses)
// ============================================================================

// Sessions routes
app.get('/v1/sessions', authMiddleware, listSessions);
app.get('/v1/sessions/:sessionId', authMiddleware, getSession);
app.get('/v1/sessions/:sessionId/stats', authMiddleware, getSessionStats);
app.delete('/v1/sessions/:sessionId', authMiddleware, deleteSession);

// Requests routes
app.get('/v1/requests', authMiddleware, listRequests);
app.get('/v1/requests/:id', authMiddleware, getRequest);
app.get('/v1/sessions/:sessionId/requests', authMiddleware, getSessionRequests);

// Responses routes
app.get('/v1/responses', authMiddleware, listResponses);
app.get('/v1/responses/stats', authMiddleware, getResponseStats);
app.get('/v1/responses/:id', authMiddleware, getResponse);
app.get('/v1/requests/:requestId/response', authMiddleware, getRequestResponse);

// ============================================================================
// 404 Handler (MUST BE BEFORE ERROR HANDLER)
// ============================================================================

app.use(notFoundHandler);

// ============================================================================
// Error Handler (MUST BE LAST)
// ============================================================================

app.use(errorHandler);

// Export app for testing
module.exports = app;
