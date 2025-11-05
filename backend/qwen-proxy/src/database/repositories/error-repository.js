/**
 * Error Repository
 *
 * Manages error data access with error-specific operations.
 * Part of the comprehensive error handling system.
 *
 * Part of Phase 2: Error Repository Implementation
 */

const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class ErrorRepository extends BaseRepository {
  constructor() {
    super('errors');
  }

  /**
   * Create a new error record
   *
   * @param {Object} errorData - Error data object
   * @param {string} errorData.error_type - Type of error (http_error, stream_error, api_error, etc.)
   * @param {string} errorData.error_message - Error message
   * @param {string} errorData.severity - Severity level (critical, error, warning)
   * @param {string} [errorData.error_id] - UUID for error (generated if not provided)
   * @param {number} [errorData.timestamp] - Timestamp when error occurred (generated if not provided)
   * @param {string} [errorData.error_code] - Error code
   * @param {string} [errorData.stack_trace] - Stack trace
   * @param {string} [errorData.session_id] - Associated session ID
   * @param {number} [errorData.request_id] - Associated request ID
   * @param {string} [errorData.endpoint] - API endpoint where error occurred
   * @param {string} [errorData.method] - HTTP method
   * @param {string} [errorData.user_agent] - Client user agent
   * @param {string} [errorData.request_payload] - Request payload (JSON string)
   * @param {string} [errorData.response_payload] - Response payload (JSON string)
   * @param {string} [errorData.notes] - Additional notes
   * @returns {string} The error_id (UUID) of the created error
   */
  createError(errorData) {
    // Validate required fields
    if (!errorData.error_type) {
      throw new Error('error_type is required');
    }
    if (!errorData.error_message) {
      throw new Error('error_message is required');
    }
    if (!errorData.severity) {
      throw new Error('severity is required');
    }

    // Generate error_id if not provided
    const errorId = errorData.error_id || crypto.randomUUID();
    const now = Date.now();

    // Prepare error record
    const errorRecord = {
      error_id: errorId,
      timestamp: errorData.timestamp || now,
      error_type: errorData.error_type,
      error_code: errorData.error_code || null,
      error_message: errorData.error_message,
      stack_trace: errorData.stack_trace || null,
      session_id: errorData.session_id || null,
      request_id: errorData.request_id || null,
      endpoint: errorData.endpoint || null,
      method: errorData.method || null,
      user_agent: errorData.user_agent || null,
      request_payload: errorData.request_payload || null,
      response_payload: errorData.response_payload || null,
      severity: errorData.severity,
      resolved: errorData.resolved || 0,
      notes: errorData.notes || null,
      created_at: now
    };

    // Insert error record
    this.create(errorRecord);

    return errorId;
  }

  /**
   * Get error by error_id (UUID)
   *
   * @param {string} errorId - Error UUID
   * @returns {Object|null} Error object
   */
  getErrorById(errorId) {
    return this.findOne('error_id', errorId);
  }

  /**
   * Get all errors for a specific session
   *
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getErrorsBySession(sessionId, limit = 100, offset = 0) {
    return this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    );
  }

  /**
   * Get errors by type
   *
   * @param {string} errorType - Error type (http_error, stream_error, api_error, etc.)
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getErrorsByType(errorType, limit = 100, offset = 0) {
    return this.findAll(
      { error_type: errorType },
      'timestamp DESC',
      limit,
      offset
    );
  }

  /**
   * Get errors by severity
   *
   * @param {string} severity - Severity level (critical, error, warning)
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getErrorsBySeverity(severity, limit = 100, offset = 0) {
    return this.findAll(
      { severity: severity },
      'timestamp DESC',
      limit,
      offset
    );
  }

  /**
   * Get most recent errors
   *
   * @param {number} limit - Maximum number of records (default: 10)
   * @returns {Array} Array of error objects
   */
  getRecentErrors(limit = 10) {
    return this.findAll({}, 'timestamp DESC', limit);
  }

  /**
   * Get all unresolved errors
   *
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getUnresolvedErrors(limit = 100, offset = 0) {
    return this.findAll(
      { resolved: 0 },
      'timestamp DESC',
      limit,
      offset
    );
  }

  /**
   * Mark an error as resolved
   *
   * @param {string} errorId - Error UUID
   * @param {string} notes - Resolution notes
   * @returns {number} Number of rows updated
   */
  markAsResolved(errorId, notes = null) {
    // Find the error first to get its internal ID
    const error = this.getErrorById(errorId);

    if (!error) {
      return 0;
    }

    return this.update(error.id, {
      resolved: 1,
      notes: notes
    });
  }

  /**
   * Get error statistics
   *
   * @returns {Object} Statistics object with counts by type and severity
   */
  getErrorStats() {
    // Get total count
    const total = this.count();

    // Count by error type
    const byTypeStmt = this.db.prepare(`
      SELECT error_type, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY error_type
    `);
    const byTypeResults = byTypeStmt.all();
    const byType = {};
    byTypeResults.forEach(row => {
      byType[row.error_type] = row.count;
    });

    // Count by severity
    const bySeverityStmt = this.db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY severity
    `);
    const bySeverityResults = bySeverityStmt.all();
    const bySeverity = {};
    bySeverityResults.forEach(row => {
      bySeverity[row.severity] = row.count;
    });

    // Count unresolved
    const unresolved = this.count({ resolved: 0 });

    return {
      total,
      unresolved,
      by_type: byType,
      by_severity: bySeverity
    };
  }

  /**
   * Clean up old errors
   * Useful for database maintenance
   *
   * @param {number} olderThan - Timestamp in milliseconds. Errors older than this will be deleted
   * @returns {number} Number of rows deleted
   */
  cleanupOldErrors(olderThan) {
    const stmt = this.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE timestamp < ?
    `);
    const info = stmt.run(olderThan);
    return info.changes;
  }

  /**
   * Get errors within a date range
   *
   * @param {number} startDate - Start timestamp in milliseconds
   * @param {number} endDate - End timestamp in milliseconds
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getByDateRange(startDate, endDate, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = this.db.prepare(sql);
    return stmt.all(startDate, endDate, limit, offset);
  }

  /**
   * Get errors by endpoint
   *
   * @param {string} endpoint - API endpoint
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of error objects
   */
  getErrorsByEndpoint(endpoint, limit = 100, offset = 0) {
    return this.findAll(
      { endpoint: endpoint },
      'timestamp DESC',
      limit,
      offset
    );
  }

  /**
   * Get error count by request
   * Useful for identifying problematic requests
   *
   * @param {number} requestId - Request ID
   * @returns {number} Count of errors for this request
   */
  getErrorCountByRequest(requestId) {
    return this.count({ request_id: requestId });
  }
}

module.exports = ErrorRepository;
