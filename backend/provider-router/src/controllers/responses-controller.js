/**
 * Responses Controller
 * Handles response history management endpoints
 */

import ResponseRepository from '../database/repositories/response-repository.js'
import RequestRepository from '../database/repositories/request-repository.js'

const responseRepo = new ResponseRepository()
const requestRepo = new RequestRepository()

/**
 * GET /v1/responses
 * List all responses with pagination and filtering
 */
export async function listResponses(req, res, next) {
  try {
    // Parse query parameters with defaults
    const limit = parseInt(req.query.limit, 10) || 50
    const offset = parseInt(req.query.offset, 10) || 0

    // Filters
    const sessionId = req.query.session_id
    const requestId = req.query.request_id
    const finishReason = req.query.finish_reason
    const hasError = req.query.has_error !== undefined ? req.query.has_error === 'true' : undefined
    const startDate = req.query.start_date ? parseInt(req.query.start_date, 10) : null
    const endDate = req.query.end_date ? parseInt(req.query.end_date, 10) : null

    let responses
    let total

    // Build where clause based on filters
    const where = {}
    if (sessionId) where.session_id = sessionId
    if (requestId) {
      // Find request by request_id UUID
      const request = requestRepo.getByRequestId(requestId)
      if (request) {
        where.request_id = request.id
      } else {
        // No matching request found
        return res.json({
          responses: [],
          total: 0,
          limit,
          offset,
          has_more: false
        })
      }
    }
    if (finishReason) where.finish_reason = finishReason

    // Handle error filter
    if (hasError === true) {
      // SQL to find records with non-null error field
      const sql = `
        SELECT * FROM responses
        WHERE error IS NOT NULL AND error != ''
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
        ${startDate && endDate ? 'AND timestamp >= ? AND timestamp <= ?' : ''}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `
      const params = []
      if (sessionId) params.push(sessionId)
      if (finishReason) params.push(finishReason)
      if (startDate && endDate) {
        params.push(startDate, endDate)
      }
      params.push(limit, offset)

      responses = responseRepo.raw(sql, params)

      // Parse JSON fields
      responses = responses.map(resp => ({
        ...resp,
        qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
        openai_response: JSON.parse(resp.openai_response)
      }))

      // Count total with same filters
      const countSql = `
        SELECT COUNT(*) as count FROM responses
        WHERE error IS NOT NULL AND error != ''
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
        ${startDate && endDate ? 'AND timestamp >= ? AND timestamp <= ?' : ''}
      `
      const countParams = []
      if (sessionId) countParams.push(sessionId)
      if (finishReason) countParams.push(finishReason)
      if (startDate && endDate) {
        countParams.push(startDate, endDate)
      }
      total = responseRepo.raw(countSql, countParams)[0].count

    } else if (hasError === false) {
      // SQL to find records with null or empty error field
      const sql = `
        SELECT * FROM responses
        WHERE (error IS NULL OR error = '')
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
        ${startDate && endDate ? 'AND timestamp >= ? AND timestamp <= ?' : ''}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `
      const params = []
      if (sessionId) params.push(sessionId)
      if (finishReason) params.push(finishReason)
      if (startDate && endDate) {
        params.push(startDate, endDate)
      }
      params.push(limit, offset)

      responses = responseRepo.raw(sql, params)

      // Parse JSON fields
      responses = responses.map(resp => ({
        ...resp,
        qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
        openai_response: JSON.parse(resp.openai_response)
      }))

      // Count total with same filters
      const countSql = `
        SELECT COUNT(*) as count FROM responses
        WHERE (error IS NULL OR error = '')
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
        ${startDate && endDate ? 'AND timestamp >= ? AND timestamp <= ?' : ''}
      `
      const countParams = []
      if (sessionId) countParams.push(sessionId)
      if (finishReason) countParams.push(finishReason)
      if (startDate && endDate) {
        countParams.push(startDate, endDate)
      }
      total = responseRepo.raw(countSql, countParams)[0].count

    } else if (startDate && endDate) {
      // Date range query
      const sql = `
        SELECT * FROM responses
        WHERE timestamp >= ? AND timestamp <= ?
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `
      const params = [startDate, endDate]
      if (sessionId) params.push(sessionId)
      if (finishReason) params.push(finishReason)
      params.push(limit, offset)

      responses = responseRepo.raw(sql, params)

      // Parse JSON fields
      responses = responses.map(resp => ({
        ...resp,
        qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
        openai_response: JSON.parse(resp.openai_response)
      }))

      // Count total
      const countSql = `
        SELECT COUNT(*) as count FROM responses
        WHERE timestamp >= ? AND timestamp <= ?
        ${sessionId ? 'AND session_id = ?' : ''}
        ${finishReason ? 'AND finish_reason = ?' : ''}
      `
      const countParams = [startDate, endDate]
      if (sessionId) countParams.push(sessionId)
      if (finishReason) countParams.push(finishReason)
      total = responseRepo.raw(countSql, countParams)[0].count

    } else {
      // Standard query with where clause
      responses = responseRepo.findAll(where, 'timestamp DESC', limit, offset)
      total = responseRepo.count(where)

      // Parse JSON fields
      responses = responses.map(resp => ({
        ...resp,
        qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
        openai_response: JSON.parse(resp.openai_response)
      }))
    }

    // Send response
    res.json({
      responses,
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
 * GET /v1/responses/:id
 * Get single response details
 */
export async function getResponse(req, res, next) {
  try {
    const { id } = req.params

    let response

    // Try to parse as integer (database ID)
    const dbId = parseInt(id, 10)
    if (!isNaN(dbId)) {
      response = responseRepo.findById(dbId)
    }

    // If not found, try as UUID (response_id)
    if (!response) {
      response = responseRepo.getByResponseId(id)
    }

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      })
    }

    // Parse JSON fields if not already parsed
    if (typeof response.qwen_response === 'string') {
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null
    }
    if (typeof response.openai_response === 'string') {
      response.openai_response = JSON.parse(response.openai_response)
    }

    // Get linked request for context
    const request = requestRepo.findById(response.request_id)

    res.json({
      ...response,
      request: request ? {
        id: request.id,
        request_id: request.request_id,
        model: request.model,
        stream: Boolean(request.stream),
        timestamp: request.timestamp
      } : null
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/responses/request/:requestId
 * Get response for specific request
 */
export async function getRequestResponse(req, res, next) {
  try {
    const { requestId } = req.params

    // Find request first (by UUID or database ID)
    let request

    const dbId = parseInt(requestId, 10)
    if (!isNaN(dbId)) {
      request = requestRepo.findById(dbId)
    }

    if (!request) {
      request = requestRepo.getByRequestId(requestId)
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

    // Get response for this request
    const response = responseRepo.getByRequestId(request.id)

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found for this request',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      })
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/responses/session/:sessionId
 * Get responses by session
 */
export async function getResponsesBySession(req, res, next) {
  try {
    const { sessionId } = req.params
    const limit = parseInt(req.query.limit, 10) || 100
    const offset = parseInt(req.query.offset, 10) || 0

    const responses = responseRepo.getBySessionId(sessionId, limit, offset)
    const total = responseRepo.count({ session_id: sessionId })

    res.json({
      responses,
      session_id: sessionId,
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
 * GET /v1/responses/stats
 * Get usage statistics
 */
export async function getResponseStats(req, res, next) {
  try {
    const sessionId = req.query.session_id

    // Get usage stats
    const stats = responseRepo.getUsageStats(sessionId || null)

    // Calculate success rate (responses without errors)
    let successRate = 0
    if (stats.total_responses > 0) {
      const errorSql = `
        SELECT COUNT(*) as error_count FROM responses
        WHERE error IS NOT NULL AND error != ''
        ${sessionId ? 'AND session_id = ?' : ''}
      `
      const params = sessionId ? [sessionId] : []
      const errorCount = responseRepo.raw(errorSql, params)[0].error_count
      successRate = ((stats.total_responses - errorCount) / stats.total_responses) * 100
    }

    res.json({
      total_responses: stats.total_responses || 0,
      total_tokens: stats.total_tokens || 0,
      total_completion_tokens: stats.total_completion_tokens || 0,
      total_prompt_tokens: stats.total_prompt_tokens || 0,
      avg_duration_ms: Math.round(stats.avg_duration_ms || 0),
      success_rate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/responses/:id
 * Delete a response
 */
export async function deleteResponse(req, res, next) {
  try {
    const { id } = req.params

    let response

    // Try to parse as integer (database ID)
    const dbId = parseInt(id, 10)
    if (!isNaN(dbId)) {
      response = responseRepo.findById(dbId)
    }

    // If not found, try as UUID (response_id)
    if (!response) {
      response = responseRepo.getByResponseId(id)
    }

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      })
    }

    // Delete the response
    const deleted = responseRepo.delete(response.id)

    if (deleted > 0) {
      res.json({
        success: true,
        message: 'Response deleted'
      })
    } else {
      res.status(500).json({
        error: {
          message: 'Failed to delete response',
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
  listResponses,
  getResponse,
  getRequestResponse,
  getResponsesBySession,
  getResponseStats,
  deleteResponse
}
