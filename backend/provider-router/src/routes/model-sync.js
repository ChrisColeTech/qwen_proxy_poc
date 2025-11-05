/**
 * Model Sync Routes
 * API endpoints for triggering model synchronization
 */

import express from 'express'
import { ModelSyncService } from '../database/services/model-sync-service.js'
import { providerRegistry } from '../providers/provider-registry.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * POST /v1/models/sync
 * Trigger model sync for all providers
 */
router.post('/sync', async (req, res, next) => {
  try {
    logger.info('Manual model sync triggered via API')

    const syncResult = await ModelSyncService.syncAllProviders(providerRegistry)

    res.json({
      success: syncResult.success,
      message: syncResult.success
        ? 'Model sync completed successfully'
        : 'Model sync completed with errors',
      results: syncResult.results,
      totals: syncResult.totals
    })
  } catch (error) {
    logger.error('Model sync API request failed', { error: error.message })
    next(error)
  }
})

/**
 * POST /v1/models/sync/:providerId
 * Trigger model sync for a specific provider
 */
router.post('/sync/:providerId', async (req, res, next) => {
  try {
    const { providerId } = req.params

    logger.info(`Manual model sync triggered for provider: ${providerId}`)

    // Get provider instance
    const provider = providerRegistry.get(providerId)
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: `Provider not found: ${providerId}`
      })
    }

    // Sync models for this provider
    const result = await ModelSyncService.syncProviderModels(provider, providerId)

    res.json({
      success: result.success,
      message: result.success
        ? `Model sync completed for ${providerId}`
        : `Model sync failed for ${providerId}`,
      result
    })
  } catch (error) {
    logger.error(`Model sync API request failed for provider`, {
      providerId: req.params.providerId,
      error: error.message
    })
    next(error)
  }
})

export default router
