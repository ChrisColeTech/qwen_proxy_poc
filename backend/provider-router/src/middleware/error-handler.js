/**
 * Error Handler Middleware
 * Centralized error handling for all routes with comprehensive logging
 */

import { logger } from '../utils/logger.js'
import config from '../config.js'

/**
 * Error handler middleware
 * Catches all errors, logs them with full context, and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  // Build comprehensive error context
  const errorContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
    errorName: err.name,
    errorMessage: err.message,
  }

  // Log the error with full context
  logger.error(`Request Error: ${req.method} ${req.url}`, err)

  // Log additional error context
  logger.error('Error Context:', errorContext)

  // Log request body in debug mode for troubleshooting
  if (config.logging.level === 'debug' && req.body) {
    logger.debug('Request Body at Error:', {
      requestId: req.requestId,
      body: req.body,
    })
  }

  // Log full stack trace if available
  if (err.stack) {
    logger.error('Stack Trace:', {
      requestId: req.requestId,
      stack: err.stack
    })
  }

  // Log provider-specific error details if present
  if (err.provider) {
    logger.error('Provider Error Details:', {
      requestId: req.requestId,
      provider: err.provider,
      providerError: err.error,
    })
  }

  // Check if error is from a provider
  if (err.error) {
    // Provider error format
    const statusCode = err.error.status || 500

    return res.status(statusCode).json({
      ...err,
      requestId: req.requestId,
    })
  }

  // Check for specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: err.message,
        type: 'validation_error',
      },
      requestId: req.requestId,
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        message: 'Unauthorized',
        type: 'authentication_error',
      },
      requestId: req.requestId,
    })
  }

  // Handle timeout errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    logger.error('Request Timeout:', {
      requestId: req.requestId,
      code: err.code,
      timeout: config.request.timeout,
    })

    return res.status(504).json({
      error: {
        message: 'Request timeout',
        type: 'timeout_error',
        code: err.code,
      },
      requestId: req.requestId,
    })
  }

  // Handle connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    logger.error('Connection Error:', {
      requestId: req.requestId,
      code: err.code,
      message: err.message,
    })

    return res.status(503).json({
      error: {
        message: 'Service unavailable - could not connect to provider',
        type: 'connection_error',
        code: err.code,
      },
      requestId: req.requestId,
    })
  }

  // Default error response
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      type: err.type || 'internal_error',
    },
    requestId: req.requestId,
  })
}

export default errorHandler
