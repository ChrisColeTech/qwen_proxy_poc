/**
 * Request Routes
 * REST API endpoints for request history management
 */

import express from 'express'
import {
  listRequests,
  getRequest,
  getSessionRequests,
  deleteRequest
} from '../controllers/requests-controller.js'

const router = express.Router()

/**
 * GET /api/requests
 * List all requests with pagination and filtering
 * Query params:
 * - limit: number of requests to return (default: 50)
 * - offset: number of requests to skip (default: 0)
 * - session_id: filter by session ID (optional)
 * - model: filter by model name (optional)
 * - stream: filter by stream flag - true or false (optional)
 * - start_date: filter by start date timestamp in ms (optional)
 * - end_date: filter by end date timestamp in ms (optional)
 */
router.get('/', listRequests)

/**
 * GET /api/requests/:id
 * Get single request details
 * Params:
 * - id: request database ID (integer) or request_id (UUID)
 * Returns full request object with parsed JSON fields and linked response
 */
router.get('/:id', getRequest)

/**
 * DELETE /api/requests/:id
 * Delete a request and related response (cascade)
 * Params:
 * - id: request database ID (integer) or request_id (UUID)
 */
router.delete('/:id', deleteRequest)

export default router
