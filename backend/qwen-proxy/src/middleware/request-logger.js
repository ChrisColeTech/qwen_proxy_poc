/**
 * Request Logger Middleware
 * Logs HTTP requests with timing information
 * Part of Phase 12: Error Handling and Logging Infrastructure
 */

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs each HTTP request with method, path, status code, and duration
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res.statusCode, duration);
  });

  next();
}

module.exports = requestLogger;
