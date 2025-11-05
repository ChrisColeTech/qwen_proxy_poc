/**
 * Response Repository
 *
 * Manages response data access with response-specific operations.
 * Handles JSON serialization/deserialization and usage statistics.
 *
 * Part of Phase 2: Core Database Service Layer
 */

const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class ResponseRepository extends BaseRepository {
  constructor() {
    super('responses');
  }

  /**
   * Create a new response record
   *
   * @param {number} requestId - Request database ID (foreign key)
   * @param {string} sessionId - Session ID
   * @param {Object|null} qwenResponse - Raw Qwen response object (null for streaming)
   * @param {Object} openaiResponse - Transformed OpenAI response object
   * @param {string|null} parentId - New parent_id from response for next message
   * @param {Object|null} usage - Token usage object {completion_tokens, prompt_tokens, total_tokens}
   * @param {number} durationMs - Request duration in milliseconds
   * @param {string} finishReason - Finish reason (stop, length, error, etc.)
   * @param {string|null} error - Error message if request failed
   * @returns {Object} Object with id and responseId
   */
  createResponse(requestId, sessionId, qwenResponse, openaiResponse, parentId, usage, durationMs, finishReason, error = null) {
    const responseId = crypto.randomUUID();
    const now = Date.now();

    const id = this.create({
      request_id: requestId,
      session_id: sessionId,
      response_id: responseId,
      timestamp: now,
      qwen_response: qwenResponse ? JSON.stringify(qwenResponse) : null,
      openai_response: JSON.stringify(openaiResponse),
      parent_id: parentId,
      completion_tokens: usage?.completion_tokens || null,
      prompt_tokens: usage?.prompt_tokens || null,
      total_tokens: usage?.total_tokens || null,
      finish_reason: finishReason,
      error: error,
      duration_ms: durationMs,
      created_at: now
    });

    return { id, responseId };
  }

  /**
   * Get response by response_id (UUID)
   * Automatically parses JSON fields
   *
   * @param {string} responseId - Response UUID
   * @returns {Object|null} Response object with parsed JSON fields
   */
  getByResponseId(responseId) {
    const response = this.findOne('response_id', responseId);

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
      response.openai_response = JSON.parse(response.openai_response);
    }

    return response;
  }

  /**
   * Get response for a specific request
   *
   * @param {number} requestId - Request database ID
   * @returns {Object|null} Response object with parsed JSON fields
   */
  getByRequestId(requestId) {
    const response = this.findOne('request_id', requestId);

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
      response.openai_response = JSON.parse(response.openai_response);
    }

    return response;
  }

  /**
   * Get all responses for a session
   * Returns responses in reverse chronological order
   *
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records (default: 100)
   * @param {number} offset - Number of records to skip (default: 0)
   * @returns {Array} Array of response objects with parsed JSON
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const responses = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    );

    // Parse JSON fields for all responses
    return responses.map(resp => ({
      ...resp,
      qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
      openai_response: JSON.parse(resp.openai_response)
    }));
  }

  /**
   * Get usage statistics
   * Aggregates token usage and response metrics
   *
   * @param {string|null} sessionId - Session ID (null for all sessions)
   * @returns {Object} Statistics object with aggregated metrics
   */
  getUsageStats(sessionId = null) {
    let sql = `
      SELECT
        COUNT(*) as total_responses,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(total_tokens) as total_tokens,
        AVG(duration_ms) as avg_duration_ms
      FROM ${this.tableName}
    `;

    const params = [];
    if (sessionId) {
      sql += ' WHERE session_id = ?';
      params.push(sessionId);
    }

    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }
}

module.exports = ResponseRepository;
