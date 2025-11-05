/**
 * Responses Handler
 *
 * REST API endpoints for response history and usage statistics.
 * Part of Phase 7: Responses CRUD API Endpoints
 *
 * Endpoints:
 * - GET /v1/responses - List all responses with pagination
 * - GET /v1/responses/:id - Get specific response details
 * - GET /v1/requests/:requestId/response - Get response for a request
 * - GET /v1/responses/stats - Get overall usage statistics
 */

const ResponseRepository = require('../database/repositories/response-repository');
const RequestRepository = require('../database/repositories/request-repository');

const responseRepo = new ResponseRepository();
const requestRepo = new RequestRepository();

/**
 * GET /v1/responses
 * List all responses with pagination
 *
 * Query parameters:
 * - limit: Number of records to return (default: 50)
 * - offset: Number of records to skip (default: 0)
 * - session_id: Filter by session ID
 */
async function listResponses(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const sessionId = req.query.session_id;

    // Validate pagination parameters
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        error: {
          message: 'Limit must be between 1 and 1000',
          type: 'invalid_request_error',
          code: 'invalid_limit'
        }
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        error: {
          message: 'Offset must be non-negative',
          type: 'invalid_request_error',
          code: 'invalid_offset'
        }
      });
    }

    let responses;
    let total;

    if (sessionId) {
      responses = responseRepo.getBySessionId(sessionId, limit, offset);
      total = responseRepo.count({ session_id: sessionId });
    } else {
      responses = responseRepo.findAll({}, 'timestamp DESC', limit, offset);

      // Parse JSON fields for responses that weren't parsed by repository method
      responses = responses.map(resp => ({
        ...resp,
        qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
        openai_response: JSON.parse(resp.openai_response)
      }));

      total = responseRepo.count();
    }

    res.json({
      object: 'list',
      data: responses,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/responses/:id
 * Get specific response details
 *
 * Returns:
 * - Full response details (OpenAI and Qwen formats)
 * - Token usage information
 * - Linked request summary
 */
async function getResponse(req, res, next) {
  try {
    const { id } = req.params;

    const responseId = parseInt(id, 10);
    if (isNaN(responseId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid response ID',
          type: 'invalid_request_error',
          code: 'invalid_id'
        }
      });
    }

    const response = responseRepo.findById(responseId);

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      });
    }

    // Parse JSON fields
    response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
    response.openai_response = JSON.parse(response.openai_response);

    // Get linked request
    const request = requestRepo.findById(response.request_id);

    res.json({
      ...response,
      request: request ? {
        id: request.id,
        request_id: request.request_id,
        model: request.model,
        stream: Boolean(request.stream),
        timestamp: request.timestamp
      } : null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/requests/:requestId/response
 * Get response for specific request
 *
 * Returns:
 * - Full response details for the given request
 */
async function getRequestResponse(req, res, next) {
  try {
    const { requestId } = req.params;

    const reqId = parseInt(requestId, 10);
    if (isNaN(reqId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid request ID',
          type: 'invalid_request_error',
          code: 'invalid_id'
        }
      });
    }

    // Find request first
    const request = requestRepo.findById(reqId);

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      });
    }

    const response = responseRepo.getByRequestId(request.id);

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found for this request',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/responses/stats
 * Get overall usage statistics
 *
 * Query parameters:
 * - session_id: Get stats for specific session (optional)
 *
 * Returns:
 * - Total responses
 * - Token usage (completion, prompt, total)
 * - Average duration
 */
async function getResponseStats(req, res, next) {
  try {
    const sessionId = req.query.session_id;

    const stats = responseRepo.getUsageStats(sessionId || null);

    res.json({
      session_id: sessionId || 'all',
      statistics: {
        total_responses: stats.total_responses || 0,
        total_completion_tokens: stats.total_completion_tokens || 0,
        total_prompt_tokens: stats.total_prompt_tokens || 0,
        total_tokens: stats.total_tokens || 0,
        avg_duration_ms: Math.round(stats.avg_duration_ms || 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listResponses,
  getResponse,
  getRequestResponse,
  getResponseStats
};
