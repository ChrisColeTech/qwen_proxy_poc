/**
 * Logs Service
 * Manages request/response logging using sessions/requests/responses tables
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class LogsService {
  /**
   * Get recent logs from requests/responses tables
   */
  static getRecent(limit = 50) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT
          req.id,
          req.request_id,
          req.session_id,
          req.timestamp,
          req.method,
          req.path as endpoint,
          req.openai_request as request_body,
          res.openai_response as response_body,
          res.finish_reason,
          res.error,
          res.duration_ms,
          req.created_at
        FROM requests req
        LEFT JOIN responses res ON req.id = res.request_id
        ORDER BY req.created_at DESC
        LIMIT ?
      `)

      return stmt.all(limit).map(row => ({
        ...row,
        request_body: row.request_body ? JSON.parse(row.request_body) : null,
        response_body: row.response_body ? JSON.parse(row.response_body) : null,
      }))
    } catch (error) {
      logger.error('LogsService.getRecent error:', error)
      return []
    }
  }

  /**
   * Get logs by provider from requests/responses tables
   * Note: Provider info would need to be extracted from path or stored separately
   */
  static getByProvider(provider, limit = 50) {
    const db = getDatabase()

    try {
      // Extract provider from path (e.g., /v1/chat/completions might have provider in session or request metadata)
      // For now, return all logs since provider isn't directly stored in new schema
      const stmt = db.prepare(`
        SELECT
          req.id,
          req.request_id,
          req.session_id,
          req.timestamp,
          req.method,
          req.path as endpoint,
          req.openai_request as request_body,
          res.openai_response as response_body,
          res.finish_reason,
          res.error,
          res.duration_ms,
          req.created_at
        FROM requests req
        LEFT JOIN responses res ON req.id = res.request_id
        ORDER BY req.created_at DESC
        LIMIT ?
      `)

      return stmt.all(limit).map(row => ({
        ...row,
        request_body: row.request_body ? JSON.parse(row.request_body) : null,
        response_body: row.response_body ? JSON.parse(row.response_body) : null,
      }))
    } catch (error) {
      logger.error('LogsService.getByProvider error:', error)
      return []
    }
  }

  /**
   * Get statistics from requests/responses tables
   */
  static getStats() {
    const db = getDatabase()

    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM requests').get().count

      const avgDuration = db.prepare(`
        SELECT AVG(duration_ms) as avg_ms
        FROM responses
        WHERE duration_ms IS NOT NULL
      `).all()

      return {
        total,
        byProvider: [], // Provider not stored in new schema
        avgDuration
      }
    } catch (error) {
      logger.error('LogsService.getStats error:', error)
      return {
        total: 0,
        byProvider: [],
        avgDuration: []
      }
    }
  }
}
