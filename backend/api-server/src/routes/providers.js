/**
 * Provider Routes
 * REST API endpoints for provider management
 */

import express from 'express'
import {
  getProviderTypes,
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  enableProvider,
  disableProvider,
  testProvider,
  reloadProvider
} from '../controllers/providers-controller.js'
import {
  validateProvider,
  validateProviderId,
  validatePagination
} from '../middleware/validation.js'

const router = express.Router()

/**
 * GET /api/providers/types
 * Get provider type metadata
 */
router.get('/types', getProviderTypes)

/**
 * GET /api/providers
 * List all providers
 * Query params:
 * - type: filter by provider type (lm-studio, qwen-proxy, qwen-direct)
 * - enabled: filter by enabled status (true/false)
 */
router.get('/', validatePagination, listProviders)

/**
 * GET /api/providers/:id
 * Get provider details
 * Params:
 * - id: provider ID
 */
router.get('/:id', validateProviderId, getProvider)

/**
 * POST /api/providers
 * Create new provider
 * Body:
 * - id: provider ID (slug format, required)
 * - name: display name (required)
 * - type: provider type (required)
 * - enabled: enabled status (optional, default: true)
 * - priority: priority for routing (optional, default: 0)
 * - description: provider description (optional)
 * - config: provider configuration object (optional)
 */
router.post('/', validateProvider, createProvider)

/**
 * PUT /api/providers/:id
 * Update provider
 * Params:
 * - id: provider ID
 * Body:
 * - name: display name (optional)
 * - type: provider type (optional)
 * - enabled: enabled status (optional)
 * - priority: priority for routing (optional)
 * - description: provider description (optional)
 */
router.put('/:id', validateProviderId, validateProvider, updateProvider)

/**
 * DELETE /api/providers/:id
 * Delete provider
 * Params:
 * - id: provider ID
 */
router.delete('/:id', validateProviderId, deleteProvider)

/**
 * POST /api/providers/:id/enable
 * Enable provider
 * Params:
 * - id: provider ID
 */
router.post('/:id/enable', validateProviderId, enableProvider)

/**
 * POST /api/providers/:id/disable
 * Disable provider
 * Params:
 * - id: provider ID
 */
router.post('/:id/disable', validateProviderId, disableProvider)

/**
 * POST /api/providers/:id/test
 * Test provider connection/health
 * Params:
 * - id: provider ID
 */
router.post('/:id/test', validateProviderId, testProvider)

/**
 * POST /api/providers/:id/reload
 * Reload provider from database
 * Params:
 * - id: provider ID
 */
router.post('/:id/reload', validateProviderId, reloadProvider)

export default router
