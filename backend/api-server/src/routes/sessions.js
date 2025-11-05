/**
 * Session Routes
 * REST API endpoints for session management
 */

import express from 'express'
import {
  listSessions,
  getSession,
  deleteSession,
  cleanupExpiredSessions
} from '../controllers/sessions-controller.js'
import { getSessionRequests } from '../controllers/requests-controller.js'

const router = express.Router()

/**
 * GET /api/sessions
 * List all sessions with pagination
 * Query params:
 * - limit: number of sessions to return (default: 50)
 * - offset: number of sessions to skip (default: 0)
 * - sort: sort order - created_at or last_accessed (default: created_at)
 */
router.get('/', listSessions)

/**
 * GET /api/sessions/:id
 * Get single session details
 * Params:
 * - id: session ID
 */
router.get('/:id', getSession)

/**
 * GET /api/sessions/:sessionId/requests
 * Get all requests for a specific session
 * Params:
 * - sessionId: session ID
 * Query params:
 * - limit: number of requests to return (default: 100)
 * - offset: number of requests to skip (default: 0)
 */
router.get('/:sessionId/requests', getSessionRequests)

/**
 * DELETE /api/sessions/:id
 * Delete a session and all related data (cascades to requests and responses)
 * Params:
 * - id: session ID
 */
router.delete('/:id', deleteSession)

/**
 * DELETE /api/sessions
 * Cleanup expired sessions
 * Body: none
 */
router.delete('/', cleanupExpiredSessions)

export default router
