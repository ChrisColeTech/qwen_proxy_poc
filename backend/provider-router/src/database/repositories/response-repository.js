import { BaseRepository } from './base-repository.js'
import crypto from 'crypto'

export class ResponseRepository extends BaseRepository {
  constructor() {
    super('responses')
  }

  /**
   * Create a new response record
   */
  createResponse(requestId, sessionId, qwenResponse, openaiResponse, parentId, usage, durationMs, finishReason, error = null) {
    const responseId = crypto.randomUUID()
    const now = Date.now()

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
    })

    return { id, responseId }
  }

  /**
   * Get response by response_id (UUID)
   */
  getByResponseId(responseId) {
    const response = this.findOne('response_id', responseId)

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null
      response.openai_response = JSON.parse(response.openai_response)
    }

    return response
  }

  /**
   * Get response for a specific request
   */
  getByRequestId(requestId) {
    const response = this.findOne('request_id', requestId)

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null
      response.openai_response = JSON.parse(response.openai_response)
    }

    return response
  }

  /**
   * Get all responses for a session
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const responses = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    )

    // Parse JSON fields
    return responses.map(resp => ({
      ...resp,
      qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
      openai_response: JSON.parse(resp.openai_response)
    }))
  }

  /**
   * Get usage statistics
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
    `

    const params = []
    if (sessionId) {
      sql += ' WHERE session_id = ?'
      params.push(sessionId)
    }

    const stmt = this.db.prepare(sql)
    return stmt.get(...params)
  }
}

export default ResponseRepository
