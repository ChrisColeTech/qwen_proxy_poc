/**
 * Request Repository
 *
 * Manages request data access with request-specific operations.
 * Handles JSON serialization/deserialization for request payloads.
 *
 * Part of Phase 2: Core Database Service Layer
 */

const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class RequestRepository extends BaseRepository {
  constructor() {
    super('requests');
  }

  /**
   * Create a new request record
   *
   * @param {string} sessionId - Session ID
   * @param {Object} openaiRequest - Original OpenAI request object
   * @param {Object} qwenRequest - Transformed Qwen request object
   * @param {string} model - Model name (e.g., 'qwen3-max')
   * @param {boolean} stream - Whether this is a streaming request
   * @returns {Object} Object with id and requestId
   */
  createRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
    const requestId = crypto.randomUUID();
    const now = Date.now();

    const id = this.create({
      session_id: sessionId,
      request_id: requestId,
      timestamp: now,
      method: 'POST',
      path: '/v1/chat/completions',
      openai_request: JSON.stringify(openaiRequest),
      qwen_request: JSON.stringify(qwenRequest),
      model: model,
      stream: stream ? 1 : 0,
      created_at: now
    });

    return { id, requestId };
  }

  /**
   * Get request by request_id (UUID)
   * Automatically parses JSON fields
   *
   * @param {string} requestId - Request UUID
   * @returns {Object|null} Request object with parsed JSON fields
   */
  getByRequestId(requestId) {
    const request = this.findOne('request_id', requestId);

    if (request) {
      // Parse JSON fields
      request.openai_request = JSON.parse(request.openai_request);
      request.qwen_request = JSON.parse(request.qwen_request);
      request.stream = Boolean(request.stream);
    }

    return request;
  }

  /**
   * Get all requests for a session
   * Returns requests in reverse chronological order
   *
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of request objects with parsed JSON
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const requests = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    );

    // Parse JSON fields for all requests
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }));
  }

  /**
   * Get requests within a date range
   *
   * @param {number} startDate - Start timestamp in milliseconds
   * @param {number} endDate - End timestamp in milliseconds
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of request objects with parsed JSON
   */
  getByDateRange(startDate, endDate, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = this.db.prepare(sql);
    const requests = stmt.all(startDate, endDate, limit, offset);

    // Parse JSON fields for all requests
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }));
  }
}

module.exports = RequestRepository;
