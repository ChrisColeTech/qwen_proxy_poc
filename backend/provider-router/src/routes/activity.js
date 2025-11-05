/**
 * Activity Routes
 * REST API endpoints for activity logs and statistics
 */

import express from 'express'
import {
  getRecentActivity,
  getActivityStats
} from '../controllers/activity-controller.js'

const router = express.Router()

/**
 * GET /api/v1/activity/recent
 * Get recent activity from requests/responses tables
 * Query params:
 * - limit: number of activities to return (default: 20)
 */
router.get('/recent', getRecentActivity)

/**
 * GET /api/v1/activity/stats
 * Get aggregated statistics
 * Returns:
 * - Total API requests
 * - Average response time
 * - Active sessions count
 * - Recent error count
 * - Total providers
 * - Total models
 */
router.get('/stats', getActivityStats)

export default router
