/**
 * Response Routes
 * REST API endpoints for response history management
 */

import express from 'express'
import {
  listResponses,
  getResponse,
  getRequestResponse,
  getResponsesBySession,
  getResponseStats,
  deleteResponse
} from '../controllers/responses-controller.js'

const router = express.Router()

/**
 * GET /api/responses
 * List all responses with pagination and filtering
 * Query params:
 * - limit: number of responses to return (default: 50)
 * - offset: number of responses to skip (default: 0)
 * - session_id: filter by session ID
 * - request_id: filter by request ID
 * - finish_reason: filter by finish reason (stop, length, error, etc.)
 * - has_error: filter by error status (true/false)
 * - start_date: filter by start timestamp (milliseconds)
 * - end_date: filter by end timestamp (milliseconds)
 */
router.get('/', listResponses)

/**
 * GET /api/responses/stats
 * Get usage statistics
 * Query params:
 * - session_id: optional session ID to filter stats
 * Returns: { total_responses, total_tokens, total_completion_tokens, total_prompt_tokens, avg_duration_ms, success_rate }
 */
router.get('/stats', getResponseStats)

/**
 * GET /api/responses/:id
 * Get single response details
 * Params:
 * - id: response database ID or response_id UUID
 * Returns: Full response object with parsed JSON fields
 */
router.get('/:id', getResponse)

/**
 * GET /api/responses/request/:requestId
 * Get response for specific request
 * Params:
 * - requestId: request_id UUID or database ID
 * Returns: Response object for that request
 */
router.get('/request/:requestId', getRequestResponse)

/**
 * GET /api/responses/session/:sessionId
 * Get responses by session
 * Params:
 * - sessionId: session ID
 * Query params:
 * - limit: number of responses to return (default: 100)
 * - offset: number of responses to skip (default: 0)
 * Returns: { responses: [...], session_id: "...", total: N, limit: X, offset: Y }
 */
router.get('/session/:sessionId', getResponsesBySession)

/**
 * DELETE /api/responses/:id
 * Delete a response
 * Params:
 * - id: response database ID or response_id UUID
 * Returns: { success: true, message: "Response deleted" }
 */
router.delete('/:id', deleteResponse)

export default router
