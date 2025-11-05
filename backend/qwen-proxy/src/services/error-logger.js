/**
 * Error Logger Service
 *
 * Centralized error logging service with rich context and error classification.
 * Logs all application errors to the database for tracking and analysis.
 *
 * Part of Phase 3: Error Logging Service Implementation
 */

const ErrorRepository = require('../database/repositories/error-repository');
const crypto = require('crypto');

class ErrorLogger {
  constructor() {
    this.repo = new ErrorRepository();
  }

  /**
   * Main error logging method - all specialized methods use this
   *
   * @param {Error} error - Error object
   * @param {Object} context - Additional context (session_id, request_id, etc.)
   * @returns {string|null} error_id (UUID) for tracking, or null if logging failed
   */
  logError(error, context = {}) {
    try {
      // Allow context to override classification and severity
      const errorType = context.error_type || this.classifyError(error);
      const severity = context.severity || this.determineSeverity(error);

      const errorData = {
        error_id: crypto.randomUUID(),
        timestamp: Date.now(),
        error_type: errorType,
        error_code: error.code || error.statusCode || null,
        error_message: error.message || 'Unknown error',
        stack_trace: this.extractStackTrace(error),
        severity: severity,
        ...context
      };

      return this.repo.createError(errorData);
    } catch (loggingError) {
      // Fallback: log to console if DB logging fails
      // CRITICAL: Never throw - error logging must be non-blocking
      console.error('[ErrorLogger] Failed to log error:', loggingError);
      console.error('[ErrorLogger] Original error:', error);
      return null;
    }
  }

  /**
   * Log HTTP error with request/response context
   *
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} context - Additional context
   * @returns {string} error_id (UUID)
   */
  logHttpError(error, req, res, context = {}) {
    return this.logError(error, {
      endpoint: req.path || req.url,
      method: req.method,
      user_agent: req.get ? req.get('user-agent') : null,
      request_payload: this.sanitizePayload(req.body),
      ...context
    });
  }

  /**
   * Log streaming error
   *
   * @param {Error} error - Error object
   * @param {string} sessionId - Session ID
   * @param {Object} context - Additional context
   * @returns {string} error_id (UUID)
   */
  logStreamError(error, sessionId, context = {}) {
    return this.logError(error, {
      session_id: sessionId,
      error_type: 'stream_error',
      ...context
    });
  }

  /**
   * Log API error (Qwen API failures)
   *
   * @param {Error} error - Error object
   * @param {string} endpoint - API endpoint
   * @param {Object} payload - Request payload
   * @param {Object} context - Additional context
   * @returns {string} error_id (UUID)
   */
  logApiError(error, endpoint, payload, context = {}) {
    return this.logError(error, {
      endpoint: endpoint,
      error_type: 'api_error',
      request_payload: this.sanitizePayload(payload),
      ...context
    });
  }

  /**
   * Log database error
   *
   * @param {Error} error - Error object
   * @param {string} operation - Database operation that failed
   * @param {Object} context - Additional context
   * @returns {string} error_id (UUID)
   */
  logDatabaseError(error, operation, context = {}) {
    return this.logError(error, {
      error_type: 'database_error',
      notes: `Database operation failed: ${operation}`,
      ...context
    });
  }

  /**
   * Log validation error
   *
   * @param {Error} error - Error object
   * @param {Object} payload - Invalid payload
   * @param {Object} context - Additional context
   * @returns {string} error_id (UUID)
   */
  logValidationError(error, payload, context = {}) {
    return this.logError(error, {
      error_type: 'validation_error',
      request_payload: this.sanitizePayload(payload),
      ...context
    });
  }

  /**
   * Classify error type based on error properties
   *
   * @param {Error} error - Error object
   * @returns {string} Error type classification
   */
  classifyError(error) {
    // Axios/API errors (check first as they may also have statusCode)
    if (error.isAxiosError || error.response) {
      return 'api_error';
    }

    // SQLite errors
    if (error.code && error.code.startsWith('SQLITE')) {
      return 'database_error';
    }

    // HTTP errors (4xx, 5xx)
    if (error.statusCode || error.status) {
      return 'http_error';
    }

    // Network errors (ECONNREFUSED, ENOTFOUND, ETIMEDOUT, etc.)
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED') {
      return 'api_error';
    }

    // Validation errors (by message content or name)
    const message = error.message || '';
    if (message.toLowerCase().includes('validation') ||
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('required') ||
        error.name === 'ValidationError') {
      return 'validation_error';
    }

    // Default
    return 'unknown_error';
  }

  /**
   * Determine error severity
   *
   * @param {Error} error - Error object
   * @returns {string} Severity level (critical, error, warning)
   */
  determineSeverity(error) {
    const statusCode = error.statusCode || error.status;

    // Critical errors - system-breaking (5xx, connection errors, DB errors)
    if (statusCode >= 500) {
      return 'critical';
    }

    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        (error.code && error.code.startsWith('SQLITE'))) {
      return 'critical';
    }

    // Warnings - client errors (4xx), validation errors, cancelled requests
    if ((statusCode >= 400 && statusCode < 500) ||
        error.code === 'ERR_CANCELED') {
      return 'warning';
    }

    const message = error.message || '';
    if (message.toLowerCase().includes('validation') ||
        message.toLowerCase().includes('invalid')) {
      return 'warning';
    }

    // Default to error
    return 'error';
  }

  /**
   * Extract stack trace from error
   *
   * @param {Error} error - Error object
   * @returns {string|null} Stack trace string
   */
  extractStackTrace(error) {
    if (error.stack) {
      return error.stack;
    }
    return null;
  }

  /**
   * Sanitize payload to remove sensitive data
   *
   * @param {Object|string} payload - Payload to sanitize
   * @returns {string|null} Sanitized JSON string
   */
  sanitizePayload(payload) {
    if (!payload) {
      return null;
    }

    try {
      // If already a string, truncate and return
      if (typeof payload === 'string') {
        const maxLength = 1000;
        return payload.length > maxLength
          ? payload.substring(0, maxLength) + '...'
          : payload;
      }

      // Clone the payload to avoid modifying original
      const sanitized = JSON.parse(JSON.stringify(payload));

      // Remove sensitive fields
      const sensitiveFields = [
        'password',
        'token',
        'api_key',
        'apiKey',
        'secret',
        'authorization',
        'auth',
        'cookie',
        'cookies'
      ];

      const sanitizeObject = (obj) => {
        for (const key in obj) {
          const lowerKey = key.toLowerCase();

          // Check if field name contains sensitive keywords
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively sanitize nested objects
            sanitizeObject(obj[key]);
          }
        }
      };

      sanitizeObject(sanitized);

      // Convert to JSON string and limit length
      const jsonString = JSON.stringify(sanitized);
      const maxLength = 1000;

      if (jsonString.length > maxLength) {
        return jsonString.substring(0, maxLength) + '...';
      }

      return jsonString;
    } catch (err) {
      return '[Error serializing payload]';
    }
  }
}

// Export singleton instance
module.exports = new ErrorLogger();
