/**
 * Provider Config Routes
 * REST API endpoints for provider configuration management
 */

import express from 'express'
import {
  ProviderService,
  ProviderConfigService
} from '../database/services/index.js'
import {
  validateProviderId,
  validateProviderConfig,
  validateConfigKeyValue
} from '../middleware/validation.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/providers/:id/config
 * Get all configuration for a provider
 * Params:
 * - id: provider ID
 * Query params:
 * - mask: whether to mask sensitive values (default: true)
 */
router.get('/:id/config', validateProviderId, async (req, res, next) => {
  try {
    const { id } = req.params
    const maskSensitive = req.query.mask !== 'false'

    // Check if provider exists
    if (!ProviderService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    const config = ProviderConfigService.getAll(id, maskSensitive)

    res.json({
      provider_id: id,
      config,
      masked: maskSensitive
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/providers/:id/config
 * Update provider configuration (bulk update)
 * Params:
 * - id: provider ID
 * Body:
 * - config: object with configuration key-value pairs
 */
router.put('/:id/config', validateProviderId, validateProviderConfig, async (req, res, next) => {
  try {
    const { id } = req.params
    const { config } = req.body

    // Check if provider exists
    if (!ProviderService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    // Set multiple config values
    const count = ProviderConfigService.setMultiple(id, config)

    logger.info(`Provider config updated: ${id}`, { count })

    // Return updated config
    const updatedConfig = ProviderConfigService.getAll(id, true)

    res.json({
      provider_id: id,
      config: updatedConfig,
      updated_count: count
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/providers/:id/config/:key
 * Update single configuration value
 * Params:
 * - id: provider ID
 * - key: configuration key
 * Body:
 * - value: configuration value
 * - is_sensitive: whether value is sensitive (optional)
 */
router.patch('/:id/config/:key', validateProviderId, validateConfigKeyValue, async (req, res, next) => {
  try {
    const { id, key } = req.params
    const { value, is_sensitive } = req.body

    // Check if provider exists
    if (!ProviderService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    // Auto-detect sensitive keys if not specified
    const isSensitive = is_sensitive !== undefined ? is_sensitive :
      (key.toLowerCase().includes('key') ||
       key.toLowerCase().includes('secret') ||
       key.toLowerCase().includes('password') ||
       key.toLowerCase().includes('token'))

    // Set config value
    ProviderConfigService.set(id, key, value, isSensitive)

    logger.info(`Provider config key updated: ${id}.${key}`, { isSensitive })

    res.json({
      provider_id: id,
      key,
      value: isSensitive ? '***MASKED***' : value,
      is_sensitive: isSensitive,
      updated_at: Date.now()
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/providers/:id/config/:key
 * Delete single configuration value
 * Params:
 * - id: provider ID
 * - key: configuration key
 */
router.delete('/:id/config/:key', validateProviderId, async (req, res, next) => {
  try {
    const { id, key } = req.params

    // Check if provider exists
    if (!ProviderService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    // Check if config exists
    if (!ProviderConfigService.exists(id, key)) {
      return res.status(404).json({
        error: {
          message: 'Configuration key not found',
          type: 'not_found_error',
          code: 'config_key_not_found'
        }
      })
    }

    // Delete config
    ProviderConfigService.delete(id, key)

    logger.info(`Provider config key deleted: ${id}.${key}`)

    res.json({
      success: true,
      message: 'Configuration key deleted'
    })
  } catch (error) {
    next(error)
  }
})

export default router
