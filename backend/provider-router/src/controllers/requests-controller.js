/**
 * Requests Controller
 * Handles request history management endpoints
 */

import RequestRepository from '../database/repositories/request-repository.js'
import ResponseRepository from '../database/repositories/response-repository.js'

const requestRepo = new RequestRepository()
const responseRepo = new ResponseRepository()

/**
 * GET /v1/requests
 * List all requests with pagination and filters
 */
export async function listRequests(req, res, next) {
  try {
    // Parse query parameters with defaults
    const limit = parseInt(req.query.limit, 10) || 50
    const offset = parseInt(req.query.offset, 10) || 0

    // Filters
    const sessionId = req.query.session_id
    const model = req.query.model
    const stream = req.query.stream !== undefined ? req.query.stream === 'true' : undefined
    const startDate = req.query.start_date ? parseInt(req.query.start_date, 10) : null
    const endDate = req.query.end_date ? parseInt(req.query.end_date, 10) : null

    let requests
    let total

    if (startDate && endDate) {
      // Date range query
      requests = requestRepo.getByDateRange(startDate, endDate, limit, offset)
      total = requestRepo.raw(
        'SELECT COUNT(*) as count FROM requests WHERE timestamp >= ? AND timestamp <= ?',
        [startDate, endDate]
      )[0].count
    } else if (sessionId) {
      // Session query
      requests = requestRepo.getBySessionId(sessionId, limit, offset)
      total = requestRepo.count({ session_id: sessionId })
    } else {
      // All requests with optional filters
      const where = {}
      if (model) where.model = model
      if (stream !== undefined) where.stream = stream ? 1 : 0

      requests = requestRepo.findAll(where, 'timestamp DESC', limit, offset)
      total = requestRepo.count(where)
    }

    // Add response summary to each request
    const enriched = requests.map(req => {
      const response = responseRepo.getByRequestId(req.id)

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
      }
    })

    // Send response
    res.json({
      requests: enriched,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/requests/:id
 * Get specific request details
 */
export async function getRequest(req, res, next) {
  try {
    const { id } = req.params

    // Try to parse as integer ID first, otherwise treat as UUID
    let request
    const numericId = parseInt(id, 10)

    if (!isNaN(numericId) && numericId.toString() === id) {
      // It's a numeric ID
      request = requestRepo.findById(numericId)
    } else {
      // Try as UUID request_id
      request = requestRepo.getByRequestId(id)
    }

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      })
    }

    // Parse JSON fields (if not already parsed by getByRequestId)
    if (typeof request.openai_request === 'string') {
      request.openai_request = JSON.parse(request.openai_request)
    }
    if (typeof request.qwen_request === 'string') {
      request.qwen_request = JSON.parse(request.qwen_request)
    }
    request.stream = Boolean(request.stream)

    // Get linked response
    const response = responseRepo.getByRequestId(request.id)

    // Return full request with linked response
    res.json({
      ...request,
      response: response || null
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/sessions/:sessionId/requests
 * Get all requests for a specific session
 * Note: This is called from sessions routes as /v1/sessions/:sessionId/requests
 */
export async function getSessionRequests(req, res, next) {
  try {
    const { sessionId } = req.params
    const limit = parseInt(req.query.limit, 10) || 100
    const offset = parseInt(req.query.offset, 10) || 0

    // Fetch requests for this session
    const requests = requestRepo.getBySessionId(sessionId, limit, offset)
    const total = requestRepo.count({ session_id: sessionId })

    // Send response
    res.json({
      session_id: sessionId,
      requests,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/requests/:id
 * Delete a request (cascades to delete related response)
 */
export async function deleteRequest(req, res, next) {
  try {
    const { id } = req.params

    // Try to parse as integer ID first, otherwise treat as UUID
    let request
    const numericId = parseInt(id, 10)

    if (!isNaN(numericId) && numericId.toString() === id) {
      // It's a numeric ID
      request = requestRepo.findById(numericId)
    } else {
      // Try as UUID request_id
      request = requestRepo.getByRequestId(id)
    }

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      })
    }

    // Delete request (cascades to responses due to foreign key)
    const deleted = requestRepo.delete(request.id)

    if (deleted > 0) {
      res.json({
        success: true,
        message: 'Request deleted'
      })
    } else {
      res.status(500).json({
        error: {
          message: 'Failed to delete request',
          type: 'server_error',
          code: 'delete_failed'
        }
      })
    }
  } catch (error) {
    next(error)
  }
}

export default {
  listRequests,
  getRequest,
  getSessionRequests,
  deleteRequest
}
