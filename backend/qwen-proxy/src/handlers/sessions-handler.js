/**
 * Sessions Handler
 *
 * REST API endpoints for session management and statistics.
 * Part of Phase 5: Sessions CRUD API Endpoints
 *
 * Endpoints:
 * - GET /v1/sessions - List all sessions with pagination
 * - GET /v1/sessions/:sessionId - Get specific session details
 * - GET /v1/sessions/:sessionId/stats - Get session statistics (token usage)
 * - DELETE /v1/sessions/:sessionId - Delete session and related data
 */

const SessionRepository = require('../database/repositories/session-repository');
const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

const sessionRepo = new SessionRepository();
const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * GET /v1/sessions
 * List all sessions with pagination
 *
 * Query parameters:
 * - limit: Number of records to return (default: 50)
 * - offset: Number of records to skip (default: 0)
 * - orderBy: Sort order (default: 'created_at DESC')
 */
async function listSessions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const orderBy = req.query.orderBy || 'created_at DESC';

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

    const sessions = sessionRepo.findAll({}, orderBy, limit, offset);
    const total = sessionRepo.count();

    res.json({
      object: 'list',
      data: sessions.map(s => ({
        id: s.id,
        chat_id: s.chat_id,
        parent_id: s.parent_id,
        message_count: s.message_count,
        first_user_message: s.first_user_message.substring(0, 100), // Truncate for list view
        created_at: s.created_at,
        last_accessed: s.last_accessed,
        expires_at: s.expires_at
      })),
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
 * GET /v1/sessions/:sessionId
 * Get specific session details
 *
 * Returns:
 * - Session details
 * - Request count
 * - Full first user message
 */
async function getSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Get request count for this session
    const requestCount = requestRepo.count({ session_id: sessionId });

    res.json({
      id: session.id,
      chat_id: session.chat_id,
      parent_id: session.parent_id,
      message_count: session.message_count,
      request_count: requestCount,
      first_user_message: session.first_user_message,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      expires_at: session.expires_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/sessions/:sessionId/stats
 * Get session statistics (token usage, duration, etc.)
 *
 * Returns:
 * - Message count
 * - Token usage (completion, prompt, total)
 * - Average duration
 * - Response count
 */
async function getSessionStats(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Get usage statistics for this session
    const stats = responseRepo.getUsageStats(sessionId);

    res.json({
      session_id: sessionId,
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
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /v1/sessions/:sessionId
 * Delete session and all related data
 *
 * Note: Due to foreign key constraints with ON DELETE CASCADE,
 * deleting a session will automatically delete:
 * - All requests for this session
 * - All responses for this session
 */
async function deleteSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Delete session (cascades to requests and responses due to foreign keys)
    sessionRepo.delete(sessionId);

    res.json({
      deleted: true,
      session_id: sessionId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSessions,
  getSession,
  getSessionStats,
  deleteSession
};
