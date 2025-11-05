/**
 * Persistence Middleware
 *
 * Phase 4: Request/Response Persistence Middleware
 *
 * This middleware automatically logs all chat completion requests and responses
 * to the SQLite database for audit trails, analytics, and debugging.
 *
 * Key Features:
 * - Non-blocking: Persistence failures don't break API requests
 * - Try-catch: All database operations are wrapped in error handling
 * - Logging: Errors are logged but not thrown
 * - Timing: Accurate duration calculation
 * - UUIDs: Uses crypto.randomUUID() for request_id and response_id
 * - JSON: Stores full request/response objects as JSON strings
 *
 * Integration Points:
 * - RequestRepository: Logs request data
 * - ResponseRepository: Logs response data
 * - chat-completions-handler: Calls logRequest before sending to Qwen
 * - sse-handler: Calls logResponse after streaming completes
 */

const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

// Singleton repository instances
const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * Express middleware for persistence
 * (Optional - not actively used in current implementation)
 *
 * Attaches persistence metadata to request object.
 * The actual logging is done by logRequest() and logResponse().
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function persistenceMiddleware(req, res, next) {
  // Only apply to chat completion requests
  if (req.path !== '/v1/chat/completions') {
    return next();
  }

  // Attach persistence metadata
  req.persistence = {
    startTime: Date.now()
  };

  next();
}

/**
 * Log request to database
 *
 * Called from chat-completions-handler after session is determined
 * but BEFORE sending request to Qwen API.
 *
 * @param {string} sessionId - Session ID (MD5 hash of first user message)
 * @param {Object} openaiRequest - Original OpenAI format request
 * @param {Object} qwenRequest - Transformed Qwen format request
 * @param {string} model - Model name (e.g., 'qwen3-max')
 * @param {boolean} stream - Whether this is a streaming request
 * @returns {Promise<Object|null>} Object with {requestId, requestDbId} or null if failed
 */
async function logRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
  try {
    // Create request record
    const { id, requestId } = requestRepo.createRequest(
      sessionId,
      openaiRequest,
      qwenRequest,
      model,
      stream
    );

    // Return identifiers for linking response
    return {
      requestId,      // UUID for external tracking
      requestDbId: id // Database ID for foreign key
    };
  } catch (error) {
    // Log error but don't throw - persistence failure shouldn't break requests
    console.error('[Persistence] Failed to log request:', {
      error: error.message,
      sessionId,
      model,
      stream
    });

    return null;
  }
}

/**
 * Log response to database
 *
 * Called from chat-completions-handler (non-streaming) or sse-handler (streaming)
 * AFTER receiving complete response from Qwen API.
 *
 * @param {number} requestDbId - Request database ID (from logRequest)
 * @param {string} sessionId - Session ID
 * @param {Object|null} qwenResponse - Raw Qwen response (null for streaming)
 * @param {Object} openaiResponse - Transformed OpenAI response
 * @param {string|null} parentId - New parent_id for next message
 * @param {Object|null} usage - Token usage {completion_tokens, prompt_tokens, total_tokens}
 * @param {number} durationMs - Request duration in milliseconds
 * @param {string} finishReason - Finish reason (stop, length, error, etc.)
 * @param {string|null} error - Error message if request failed
 * @returns {Promise<string|null>} Response UUID or null if failed
 */
async function logResponse(
  requestDbId,
  sessionId,
  qwenResponse,
  openaiResponse,
  parentId,
  usage,
  durationMs,
  finishReason,
  error = null
) {
  try {
    // Create response record
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      qwenResponse,
      openaiResponse,
      parentId,
      usage,
      durationMs,
      finishReason,
      error
    );

    return responseId;
  } catch (err) {
    // Log error but don't throw - persistence failure shouldn't break requests
    console.error('[Persistence] Failed to log response:', {
      error: err.message,
      requestDbId,
      sessionId,
      finishReason
    });

    return null;
  }
}

module.exports = {
  persistenceMiddleware,
  logRequest,
  logResponse
};
