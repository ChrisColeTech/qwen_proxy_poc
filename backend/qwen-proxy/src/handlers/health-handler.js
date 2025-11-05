/**
 * Health Handler - /health endpoint implementation
 * Part of Phase 11: Main Server Setup with All Routes
 *
 * Provides health check endpoints for monitoring and load balancers
 */

const auth = require('../api/qwen-auth');
const ErrorRepository = require('../database/repositories/error-repository');

// Track server start time
const startTime = Date.now();

/**
 * GET /health
 * Basic health check endpoint
 * Returns 200 OK when healthy, 503 when unhealthy
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function health(req, res) {
  try {
    // Check authentication credentials are valid
    // NOTE: Server health is OK even without credentials configured
    // This allows server to start and be healthy before credentials are set
    const authValid = auth.isValid();

    // Check for excessive unresolved errors
    let unresolvedCount = 0;
    let status = 'healthy';

    try {
      const errorRepo = new ErrorRepository();
      const unresolvedErrors = errorRepo.getUnresolvedErrors();
      unresolvedCount = unresolvedErrors.length;

      // Degrade status if too many unresolved errors
      if (unresolvedCount > 100) {
        status = 'degraded';
      }
    } catch (e) {
      // Error repository not available, continue without error stats
    }

    // Server is healthy even without credentials
    // Credentials are checked per-request, not per-server
    const isHealthy = status !== 'degraded';

    res.status(isHealthy ? 200 : 503).json({
      status: status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        authentication: authValid ? 'ok' : 'not_configured',
        errors: unresolvedCount > 100 ? 'degraded' : 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * GET /health/detailed
 * Detailed health check with metrics
 * Returns detailed system information
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function detailedHealth(req, res) {
  try {
    // Check authentication
    const authValid = auth.isValid();

    // Get memory usage
    const memUsage = process.memoryUsage();

    // Get session manager if available
    let sessionMetrics = {
      activeSessions: 0,
      totalCreated: 0,
      totalCleaned: 0
    };

    try {
      const sessionManager = require('../services/session-manager');
      if (sessionManager && typeof sessionManager.getMetrics === 'function') {
        sessionMetrics = sessionManager.getMetrics();
      }
    } catch (e) {
      // Session manager not available or not implemented yet
    }

    // Get error statistics
    let errorMetrics = {
      recent_count: 0,
      unresolved_count: 0,
      last_error: null,
      statistics: {
        total: 0,
        unresolved: 0,
        by_type: {},
        by_severity: {}
      }
    };

    try {
      const errorRepo = new ErrorRepository();
      const recentErrors = errorRepo.getRecentErrors(10);
      const unresolvedErrors = errorRepo.getUnresolvedErrors();
      const errorStats = errorRepo.getErrorStats();

      errorMetrics = {
        recent_count: recentErrors.length,
        unresolved_count: unresolvedErrors.length,
        last_error: recentErrors[0] ? {
          error_id: recentErrors[0].error_id,
          error_message: recentErrors[0].error_message,
          error_type: recentErrors[0].error_type,
          severity: recentErrors[0].severity,
          timestamp: recentErrors[0].timestamp,
          endpoint: recentErrors[0].endpoint
        } : null,
        statistics: errorStats
      };
    } catch (e) {
      // Error repository not available, continue without error stats
      console.warn('[Health] Error fetching error statistics:', e.message);
    }

    // Determine overall health status
    // NOTE: Server health is OK even without credentials
    let status = 'healthy';
    if (errorMetrics.unresolved_count > 50) {
      status = 'degraded';
    }

    const isHealthy = status !== 'unhealthy';

    res.status(isHealthy ? 200 : 503).json({
      status: status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        authentication: authValid ? 'ok' : 'not_configured',
        sessions: 'ok',
        errors: errorMetrics.unresolved_count > 50 ? 'degraded' : 'ok'
      },
      metrics: {
        sessions: sessionMetrics,
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      errors: errorMetrics
    });
  } catch (error) {
    // Log health check error if error logger is available
    try {
      const logger = require('../utils/logger');
      if (logger && typeof logger.logError === 'function') {
        logger.logError(error, {
          endpoint: '/health/detailed',
          error_type: 'health_check_error',
          severity: 'warning'
        });
      }
    } catch (logError) {
      // Silently fail if logger is not available
    }

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

module.exports = {
  health,
  detailedHealth
};
