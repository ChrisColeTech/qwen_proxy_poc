/**
 * Requests Handler
 *
 * REST API endpoints for request history and filtering.
 * Part of Phase 6: Requests CRUD API Endpoints
 *
 * Endpoints:
 * - GET /v1/requests - List all requests with pagination and filters
 * - GET /v1/requests/:id - Get specific request details
 * - GET /v1/sessions/:sessionId/requests - Get all requests for a session
 */

const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * GET /v1/requests
 * List all requests with pagination and filters
 *
 * Query parameters:
 * - limit: Number of records to return (default: 50)
 * - offset: Number of records to skip (default: 0)
 * - session_id: Filter by session ID
 * - model: Filter by model name
 * - stream: Filter by stream type (true/false)
 * - start_date: Filter by start date (timestamp in milliseconds)
 * - end_date: Filter by end date (timestamp in milliseconds)
 */
async function listRequests(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

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

    // Filters
    const sessionId = req.query.session_id;
    const model = req.query.model;
    const stream = req.query.stream !== undefined ? req.query.stream === 'true' : undefined;
    const startDate = req.query.start_date ? parseInt(req.query.start_date, 10) : null;
    const endDate = req.query.end_date ? parseInt(req.query.end_date, 10) : null;

    let requests;
    let total;

    if (startDate && endDate) {
      // Date range query
      if (startDate > endDate) {
        return res.status(400).json({
          error: {
            message: 'start_date must be before or equal to end_date',
            type: 'invalid_request_error',
            code: 'invalid_date_range'
          }
        });
      }

      requests = requestRepo.getByDateRange(startDate, endDate, limit, offset);
      total = requestRepo.raw(
        'SELECT COUNT(*) as count FROM requests WHERE timestamp >= ? AND timestamp <= ?',
        [startDate, endDate]
      )[0].count;
    } else if (sessionId) {
      // Session query
      requests = requestRepo.getBySessionId(sessionId, limit, offset);
      total = requestRepo.count({ session_id: sessionId });
    } else {
      // All requests with optional filters
      const where = {};
      if (model) where.model = model;
      if (stream !== undefined) where.stream = stream ? 1 : 0;

      requests = requestRepo.findAll(where, 'timestamp DESC', limit, offset);
      total = requestRepo.count(where);
    }

    // Add response summary to each request
    const enriched = requests.map(req => {
      const response = responseRepo.getByRequestId(req.id);

      return {
        id: req.id,
        request_id: req.request_id,
        session_id: req.session_id,
        timestamp: req.timestamp,
        method: req.method,
        path: req.path,
        model: req.model,
        stream: req.stream,
        openai_request: req.openai_request,
        qwen_request: req.qwen_request,
        response_summary: response ? {
          response_id: response.response_id,
          finish_reason: response.finish_reason,
          total_tokens: response.total_tokens,
          duration_ms: response.duration_ms,
          error: response.error
        } : null
      };
    });

    res.json({
      object: 'list',
      data: enriched,
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
 * GET /v1/requests/:id
 * Get specific request details
 *
 * Returns:
 * - Full request details (OpenAI and Qwen formats)
 * - Linked response (if available)
 */
async function getRequest(req, res, next) {
  try {
    const { id } = req.params;

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid request ID',
          type: 'invalid_request_error',
          code: 'invalid_id'
        }
      });
    }

    const request = requestRepo.findById(requestId);

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      });
    }

    // Parse JSON fields
    request.openai_request = JSON.parse(request.openai_request);
    request.qwen_request = JSON.parse(request.qwen_request);
    request.stream = Boolean(request.stream);

    // Get linked response
    const response = responseRepo.getByRequestId(request.id);

    res.json({
      ...request,
      response: response || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/sessions/:sessionId/requests
 * Get all requests for a specific session
 *
 * Query parameters:
 * - limit: Number of records to return (default: 100)
 * - offset: Number of records to skip (default: 0)
 */
async function getSessionRequests(req, res, next) {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

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

    const requests = requestRepo.getBySessionId(sessionId, limit, offset);
    const total = requestRepo.count({ session_id: sessionId });

    res.json({
      object: 'list',
      session_id: sessionId,
      data: requests,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRequests,
  getRequest,
  getSessionRequests
};
