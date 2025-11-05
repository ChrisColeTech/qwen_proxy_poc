/**
 * Sessions Controller
 * Handles session management endpoints
 */

import SessionRepository from '../database/repositories/session-repository.js'
import RequestRepository from '../database/repositories/request-repository.js'
import ResponseRepository from '../database/repositories/response-repository.js'

const sessionRepo = new SessionRepository()
const requestRepo = new RequestRepository()
const responseRepo = new ResponseRepository()

/**
 * GET /v1/sessions
 * List all sessions with pagination
 */
export async function listSessions(req, res, next) {
  try {
    // Parse query parameters with defaults
    const limit = parseInt(req.query.limit, 10) || 50
    const offset = parseInt(req.query.offset, 10) || 0
    const sortParam = req.query.sort || 'created_at'

    // Validate and map sort parameter
    const validSorts = {
      'created_at': 'created_at DESC',
      'last_accessed': 'last_accessed DESC'
    }
    const orderBy = validSorts[sortParam] || 'created_at DESC'

    // Fetch sessions from database
    const sessions = sessionRepo.findAll({}, orderBy, limit, offset)
    const total = sessionRepo.count()

    // Format response data
    const data = sessions.map(s => ({
      id: s.id,
      chat_id: s.chat_id,
      parent_id: s.parent_id,
      first_user_message: s.first_user_message.substring(0, 100), // Truncate for list view
      message_count: s.message_count,
      created_at: s.created_at,
      last_accessed: s.last_accessed,
      expires_at: s.expires_at
    }))

    // Send response
    res.json({
      sessions: data,
      count: data.length,
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
 * GET /v1/sessions/chat/:chatId
 * Get all sessions for a specific chat ID
 */
export async function getSessionsByChatId(req, res, next) {
  try {
    const { chatId } = req.params

    // Fetch sessions by chat ID
    const sessions = sessionRepo.findAll({ chat_id: chatId }, 'created_at DESC')
    const count = sessions.length

    // Format response data
    const data = sessions.map(s => ({
      id: s.id,
      chat_id: s.chat_id,
      parent_id: s.parent_id,
      first_user_message: s.first_user_message.substring(0, 100),
      message_count: s.message_count,
      created_at: s.created_at,
      last_accessed: s.last_accessed,
      expires_at: s.expires_at
    }))

    // Send response
    res.json({
      sessions: data,
      count
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/sessions/:id
 * Get single session details
 */
export async function getSession(req, res, next) {
  try {
    const { id } = req.params

    // Fetch session
    const session = sessionRepo.getSession(id)

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      })
    }

    // Get request count for this session
    const requestCount = requestRepo.count({ session_id: id })

    // Return full session details
    res.json({
      id: session.id,
      chat_id: session.chat_id,
      parent_id: session.parent_id,
      first_user_message: session.first_user_message,
      message_count: session.message_count,
      request_count: requestCount,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      expires_at: session.expires_at
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/sessions/:id
 * Delete a session and all related data
 */
export async function deleteSession(req, res, next) {
  try {
    const { id } = req.params

    // Check if session exists
    const session = sessionRepo.getSession(id)

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      })
    }

    // Delete session (cascades to requests and responses due to foreign keys)
    const deleted = sessionRepo.delete(id)

    if (deleted > 0) {
      res.json({
        success: true,
        message: 'Session deleted'
      })
    } else {
      res.status(500).json({
        error: {
          message: 'Failed to delete session',
          type: 'server_error',
          code: 'delete_failed'
        }
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/sessions
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(req, res, next) {
  try {
    // Delete all expired sessions
    const deleted = sessionRepo.cleanupExpired()

    res.json({
      success: true,
      deleted,
      message: `Cleaned up ${deleted} expired session${deleted !== 1 ? 's' : ''}`
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/sessions/:id/stats
 * Get session statistics (bonus endpoint for analytics)
 */
export async function getSessionStats(req, res, next) {
  try {
    const { id } = req.params

    // Check if session exists
    const session = sessionRepo.getSession(id)

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      })
    }

    // Get usage statistics for this session
    const stats = responseRepo.getUsageStats(id)

    res.json({
      session_id: id,
      message_count: session.message_count,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      usage: {
        total_responses: stats.total_responses || 0,
        total_completion_tokens: stats.total_completion_tokens || 0,
        total_prompt_tokens: stats.total_prompt_tokens || 0,
        total_tokens: stats.total_tokens || 0,
        avg_duration_ms: Math.round(stats.avg_duration_ms || 0)
      }
    })
  } catch (error) {
    next(error)
  }
}

export default {
  listSessions,
  getSession,
  getSessionsByChatId,
  deleteSession,
  cleanupExpiredSessions,
  getSessionStats
}
