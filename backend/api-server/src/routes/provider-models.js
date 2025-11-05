/**
 * Provider Model Routes
 * REST API endpoints for provider-model mappings
 */

import express from 'express'
import {
  ProviderService,
  ModelService,
  ProviderModelService
} from '../database/services/index.js'
import {
  validateProviderId,
  validateModelId,
  validateProviderModelLink
} from '../middleware/validation.js'
import { logger } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/providers/:id/models
 * Get all models linked to a provider
 * Params:
 * - id: provider ID
 */
router.get('/:id/models', validateProviderId, async (req, res, next) => {
  try {
    const { id } = req.params

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

    const models = ProviderModelService.getModelsForProvider(id)

    res.json({
      provider_id: id,
      models,
      total: models.length
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/providers/:id/models
 * Link a model to a provider
 * Params:
 * - id: provider ID
 * Body:
 * - model_id: model ID (required)
 * - is_default: whether this is the default model (optional, default: false)
 * - config: provider-specific model config (optional)
 */
router.post('/:id/models', validateProviderId, validateProviderModelLink, async (req, res, next) => {
  try {
    const { id } = req.params
    const { model_id, is_default, config } = req.body

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

    // Check if model exists
    if (!ModelService.exists(model_id)) {
      return res.status(404).json({
        error: {
          message: 'Model not found',
          type: 'not_found_error',
          code: 'model_not_found'
        }
      })
    }

    // Check if already linked
    if (ProviderModelService.isLinked(id, model_id)) {
      return res.status(409).json({
        error: {
          message: 'Model already linked to provider',
          type: 'conflict_error',
          code: 'model_already_linked'
        }
      })
    }

    // Link model to provider
    const link = ProviderModelService.link(id, model_id, {
      isDefault: is_default || false,
      config: config || null
    })

    logger.info(`Model linked to provider: ${id} -> ${model_id}`, { is_default })

    res.status(201).json(link)
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/providers/:id/models/:modelId
 * Unlink a model from a provider
 * Params:
 * - id: provider ID
 * - modelId: model ID
 */
router.delete('/:id/models/:modelId', validateProviderId, validateModelId, async (req, res, next) => {
  try {
    const { id, modelId } = req.params

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

    // Check if model is linked
    if (!ProviderModelService.isLinked(id, modelId)) {
      return res.status(404).json({
        error: {
          message: 'Model not linked to provider',
          type: 'not_found_error',
          code: 'model_not_linked'
        }
      })
    }

    // Unlink model
    ProviderModelService.unlink(id, modelId)

    logger.info(`Model unlinked from provider: ${id} -> ${modelId}`)

    res.json({
      success: true,
      message: 'Model unlinked from provider'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/providers/:id/models/:modelId/default
 * Set model as default for provider
 * Params:
 * - id: provider ID
 * - modelId: model ID
 */
router.put('/:id/models/:modelId/default', validateProviderId, validateModelId, async (req, res, next) => {
  try {
    const { id, modelId } = req.params

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

    // Check if model is linked
    if (!ProviderModelService.isLinked(id, modelId)) {
      return res.status(404).json({
        error: {
          message: 'Model not linked to provider',
          type: 'not_found_error',
          code: 'model_not_linked'
        }
      })
    }

    // Set as default
    const defaultModel = ProviderModelService.setDefaultModel(id, modelId)

    logger.info(`Default model set for provider: ${id} -> ${modelId}`)

    res.json({
      provider_id: id,
      default_model: defaultModel,
      message: 'Default model updated'
    })
  } catch (error) {
    next(error)
  }
})

export default router
