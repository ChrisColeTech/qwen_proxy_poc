import { BaseRepository } from './base-repository.js'
import crypto from 'crypto'

export class RequestRepository extends BaseRepository {
  constructor() {
    super('requests')
  }

  /**
   * Create a new request record
   */
  createRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
    const requestId = crypto.randomUUID()
    const now = Date.now()

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
    })

    return { id, requestId }
  }

  /**
   * Get request by request_id (UUID)
   */
  getByRequestId(requestId) {
    const request = this.findOne('request_id', requestId)

    if (request) {
      // Parse JSON fields
      request.openai_request = JSON.parse(request.openai_request)
      request.qwen_request = JSON.parse(request.qwen_request)
      request.stream = Boolean(request.stream)
    }

    return request
  }

  /**
   * Get all requests for a session
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const requests = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    )

    // Parse JSON fields
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }))
  }

  /**
   * Get requests within date range
   */
  getByDateRange(startDate, endDate, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `

    const stmt = this.db.prepare(sql)
    const requests = stmt.all(startDate, endDate, limit, offset)

    // Parse JSON fields
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }))
  }
}

export default RequestRepository
