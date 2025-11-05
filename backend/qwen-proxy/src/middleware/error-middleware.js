/**
 * Error Middleware Module
 * Centralized error handling with OpenAI-compatible format
 * Part of Phase 12: Error Handling and Logging Infrastructure
 * Updated for Phase 4: Error Middleware Implementation
 */

const logger = require('../utils/logger');
const errorLogger = require('../services/error-logger');

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, type = 'api_error', code = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error (401)
 */
class AuthenticationError extends APIError {
  constructor(message = 'Invalid authentication') {
    super(message, 401, 'invalid_request_error', 'invalid_api_key');
    this.name = 'AuthenticationError';
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends APIError {
  constructor(message, param = null) {
    super(message, 400, 'invalid_request_error', 'invalid_request');
    this.name = 'ValidationError';
    this.param = param;
  }
}

/**
 * Rate Limit Error (429)
 */
class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'rate_limit_error', 'rate_limit_exceeded');
    this.name = 'RateLimitError';
  }
}

/**
 * Qwen API Error (502)
 */
class QwenAPIError extends APIError {
  constructor(message, originalError = null) {
    super(message, 502, 'api_error', 'qwen_api_error');
    this.name = 'QwenAPIError';
    this.originalError = originalError;
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'invalid_request_error', 'not_found');
    this.name = 'NotFoundError';
  }
}

/**
 * Error handler middleware
 * Catches all errors and returns OpenAI-compatible error responses
 * Logs errors to database via ErrorLogger service
 */
function errorHandler(err, req, res, next) {
  // Check if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Log error to Winston logger (file + console)
  logger.logError(err, {
    method: req.method,
    path: req.path || req.url,
    body: req.body ? JSON.stringify(req.body).substring(0, 200) : undefined,
    statusCode: err.statusCode
  });

  // Log error to database with full context
  const errorId = errorLogger.logHttpError(err, req, res, {
    session_id: req.session_id || null,     // May exist from previous middleware
    request_id: req.request_id || null       // May exist from previous middleware
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build OpenAI-compatible error response
  const errorResponse = {
    error: {
      message: err.message || 'An unexpected error occurred',
      type: err.type || 'api_error',
      param: err.param || null,
      code: err.code || 'internal_error',
      error_id: errorId  // Include error_id for tracking and support
    }
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route not found: ${req.method} ${req.path || req.url}`);
  next(error);
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  // Error classes
  APIError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  QwenAPIError,
  NotFoundError
};
