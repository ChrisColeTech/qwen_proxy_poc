/**
 * Persistence Middleware
 * Automatically logs requests and responses to database
 *
 * This middleware captures:
 * - All incoming OpenAI-compatible requests
 * - Transformed provider-specific requests
 * - Provider responses
 * - Token usage and timing information
 * - Errors during request processing
 *
 * Integration:
 * - Works transparently with existing provider routing
 * - Updates session parent_id for conversation continuity
 * - Handles both streaming and non-streaming responses
 * - Graceful error handling (doesn't break request flow)
 */

import { RequestRepository } from '../database/repositories/request-repository.js'
import { ResponseRepository } from '../database/repositories/response-repository.js'
import { logger } from '../utils/logger.js'

const requestRepo = new RequestRepository()
const responseRepo = new ResponseRepository()

/**
 * Persistence middleware
 * Attaches persistence tracking to request object
 */
function persistenceMiddleware(req, res, next) {
  // Only log chat completion requests
  if (req.path !== '/v1/chat/completions') {
    return next()
  }

  // Initialize persistence tracking
  req.persistence = {
    startTime: Date.now(),
    requestDbId: null,
    sessionId: null
  }

  next()
}

/**
 * Log request to database
 * Called after session is determined and request is transformed
 *
 * @param {string} sessionId - Session ID from SessionManager
 * @param {Object} openaiRequest - Original OpenAI-compatible request
 * @param {Object} providerRequest - Transformed provider-specific request
 * @param {string} model - Model name (e.g., 'qwen3-max')
 * @param {boolean} stream - Whether request is streaming
 * @returns {Object|null} - { requestId, requestDbId } or null on error
 */
async function logRequest(sessionId, openaiRequest, providerRequest, model, stream) {
  try {
    const { id, requestId } = requestRepo.createRequest(
      sessionId,
      openaiRequest,
      providerRequest,
      model,
      stream
    )

    logger.debug('[Persistence] Request logged:', { requestId, sessionId, model, stream })

    return { requestId, requestDbId: id }
  } catch (error) {
    logger.error('[Persistence] Failed to log request:', error)
    // Don't throw - persistence failure shouldn't break the request
    return null
  }
}

/**
 * Log response to database
 * Called after response is complete
 *
 * @param {number} requestDbId - Database ID from logRequest
 * @param {string} sessionId - Session ID
 * @param {Object|null} providerResponse - Raw provider response (null for streaming)
 * @param {Object} openaiResponse - Transformed OpenAI-compatible response
 * @param {string|null} parentId - New parent_id from response (for conversation continuity)
 * @param {Object|null} usage - Token usage { completion_tokens, prompt_tokens, total_tokens }
 * @param {number} durationMs - Request duration in milliseconds
 * @param {string} finishReason - Finish reason ('stop', 'length', 'error', etc.)
 * @param {string|null} error - Error message if request failed
 * @returns {string|null} - Response ID or null on error
 */
async function logResponse(
  requestDbId,
  sessionId,
  providerResponse,
  openaiResponse,
  parentId,
  usage,
  durationMs,
  finishReason,
  error = null
) {
  try {
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      providerResponse,
      openaiResponse,
      parentId,
      usage,
      durationMs,
      finishReason,
      error
    )

    logger.debug('[Persistence] Response logged:', {
      responseId,
      sessionId,
      durationMs,
      finishReason,
      tokens: usage?.total_tokens || 0
    })

    return responseId
  } catch (err) {
    logger.error('[Persistence] Failed to log response:', err)
    // Don't throw - persistence failure shouldn't break the request
    return null
  }
}

/**
 * Log streaming response
 * Accumulates streaming chunks and logs complete response
 *
 * This function should be called when streaming completes.
 * During streaming, collect:
 * - All content chunks
 * - Final token usage (from last chunk)
 * - Finish reason
 * - Parent ID (if provider includes it)
 *
 * @param {number} requestDbId - Database ID from logRequest
 * @param {string} sessionId - Session ID
 * @param {Object} accumulatedResponse - Accumulated response from chunks
 * @param {string|null} parentId - Parent ID from final chunk
 * @param {Object|null} usage - Token usage from final chunk
 * @param {number} durationMs - Total streaming duration
 * @param {string} finishReason - Finish reason from final chunk
 * @returns {string|null} - Response ID or null on error
 */
async function logStreamingResponse(
  requestDbId,
  sessionId,
  accumulatedResponse,
  parentId,
  usage,
  durationMs,
  finishReason
) {
  // For streaming, we don't store the provider response (too large, chunks)
  // We only store the final accumulated OpenAI-compatible response
  return logResponse(
    requestDbId,
    sessionId,
    null, // Provider response not stored for streaming
    accumulatedResponse,
    parentId,
    usage,
    durationMs,
    finishReason,
    null
  )
}

/**
 * Log error response
 * Called when request processing fails
 *
 * @param {number|null} requestDbId - Database ID (may be null if error before logging request)
 * @param {string|null} sessionId - Session ID (may be null if error before session creation)
 * @param {Error} error - Error object
 * @param {number} durationMs - Time elapsed before error
 * @returns {string|null} - Response ID or null on error
 */
async function logErrorResponse(requestDbId, sessionId, error, durationMs) {
  if (!requestDbId) {
    // Can't log response without request ID
    logger.warn('[Persistence] Cannot log error response: no request ID')
    return null
  }

  try {
    const errorResponse = {
      error: {
        message: error.message,
        type: error.name || 'error',
        code: error.code || 'unknown_error'
      }
    }

    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      null,
      errorResponse,
      null,
      null,
      durationMs,
      'error',
      error.message
    )

    logger.debug('[Persistence] Error response logged:', {
      responseId,
      error: error.message
    })

    return responseId
  } catch (err) {
    logger.error('[Persistence] Failed to log error response:', err)
    return null
  }
}

/**
 * Create persistence helper object
 * Provides convenient methods for tracking request/response in handlers
 *
 * Usage in handler:
 * ```
 * const persistence = createPersistenceTracker(req)
 * await persistence.logRequest(sessionId, openaiReq, providerReq, model, stream)
 * // ... process request ...
 * await persistence.logResponse(response, parentId, usage, finishReason)
 * ```
 */
function createPersistenceTracker(req) {
  const startTime = Date.now()
  let requestDbId = null
  let sessionId = null

  return {
    /**
     * Log request
     */
    async logRequest(sid, openaiRequest, providerRequest, model, stream) {
      sessionId = sid
      const result = await logRequest(sid, openaiRequest, providerRequest, model, stream)
      if (result) {
        requestDbId = result.requestDbId
      }
      return result
    },

    /**
     * Log non-streaming response
     */
    async logResponse(providerResponse, openaiResponse, parentId, usage, finishReason) {
      const durationMs = Date.now() - startTime
      return logResponse(
        requestDbId,
        sessionId,
        providerResponse,
        openaiResponse,
        parentId,
        usage,
        durationMs,
        finishReason,
        null
      )
    },

    /**
     * Log streaming response
     */
    async logStreamingResponse(accumulatedResponse, parentId, usage, finishReason) {
      const durationMs = Date.now() - startTime
      return logStreamingResponse(
        requestDbId,
        sessionId,
        accumulatedResponse,
        parentId,
        usage,
        durationMs,
        finishReason
      )
    },

    /**
     * Log error
     */
    async logError(error) {
      const durationMs = Date.now() - startTime
      return logErrorResponse(requestDbId, sessionId, error, durationMs)
    },

    /**
     * Get current duration
     */
    getDuration() {
      return Date.now() - startTime
    },

    /**
     * Get request DB ID
     */
    getRequestDbId() {
      return requestDbId
    },

    /**
     * Get session ID
     */
    getSessionId() {
      return sessionId
    }
  }
}

export default persistenceMiddleware

export {
  persistenceMiddleware,
  logRequest,
  logResponse,
  logStreamingResponse,
  logErrorResponse,
  createPersistenceTracker
}
