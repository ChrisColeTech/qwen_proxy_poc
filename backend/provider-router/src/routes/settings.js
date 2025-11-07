/**
 * Settings Routes
 * REST API endpoints for server settings management
 */

import express from 'express'
import {
  getAllSettings,
  getSetting,
  updateSetting,
  bulkUpdateSettings,
  deleteSetting
} from '../controllers/settings-controller.js'

const router = express.Router()

/**
 * GET /v1/settings
 * Get all settings
 * Query params:
 * - category: filter by category (server, logging, system, provider)
 */
router.get('/', getAllSettings)

/**
 * GET /v1/settings/:key
 * Get specific setting
 * Params:
 * - key: setting key (e.g., 'server.port', 'logging.level')
 */
router.get('/:key', getSetting)

/**
 * PUT /v1/settings/:key
 * Update specific setting
 * Params:
 * - key: setting key
 * Body:
 * - value: new value for the setting
 */
router.put('/:key', updateSetting)

/**
 * POST /v1/settings/bulk
 * Bulk update settings
 * Body:
 * - settings: object with key-value pairs
 */
router.post('/bulk', bulkUpdateSettings)

/**
 * DELETE /v1/settings/:key
 * Delete setting (reset to default)
 * Params:
 * - key: setting key
 */
router.delete('/:key', deleteSetting)

export default router
