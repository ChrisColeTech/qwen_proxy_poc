/**
 * Models Controller
 * Business logic for model management
 */

import {
  ModelService,
  ProviderModelService
} from '../database/services/index.js'
import { logger } from '../utils/logger.js'

/**
 * GET /v1/models
 * List all models
 * Query params:
 *  - capability: Filter by capability
 *  - provider: Filter by provider ID
 */
export async function listModels(req, res, next) {
  try {
    const { capability, provider } = req.query

    let models

    if (provider) {
      // Filter by provider using ProviderModelService
      models = ProviderModelService.getModelsForProvider(provider)
    } else if (capability) {
      models = ModelService.getByCapability(capability)
    } else {
      models = ModelService.getAll()
    }

    res.json({
      models,
      total: models.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/models/:id
 * Get model by ID
 */
export async function getModel(req, res, next) {
  try {
    const { id } = req.params

    const model = ModelService.getById(id)

    if (!model) {
      return res.status(404).json({
        error: {
          message: 'Model not found',
          type: 'not_found_error',
          code: 'model_not_found'
        }
      })
    }

    // Get providers that support this model
    const providers = ProviderModelService.getProvidersForModel(id)

    res.json({
      model: {
        ...model,
        providers
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /v1/models
 * Create new model
 */
export async function createModel(req, res, next) {
  try {
    const { id, name, description, capabilities } = req.body

    // Check if model already exists
    if (ModelService.exists(id)) {
      return res.status(409).json({
        error: {
          message: 'Model already exists',
          type: 'conflict_error',
          code: 'model_exists'
        }
      })
    }

    // Create model
    const model = ModelService.create(id, name, {
      description,
      capabilities: capabilities || []
    })

    logger.info(`Model created: ${id}`, { name })

    res.status(201).json({ model })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /v1/models/:id
 * Update model
 */
export async function updateModel(req, res, next) {
  try {
    const { id } = req.params
    const { name, description, capabilities } = req.body

    // Check if model exists
    if (!ModelService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Model not found',
          type: 'not_found_error',
          code: 'model_not_found'
        }
      })
    }

    // Build updates object
    const updates = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (capabilities !== undefined) updates.capabilities = capabilities

    // Update model
    const model = ModelService.update(id, updates)

    logger.info(`Model updated: ${id}`, { updates })

    res.json({ model })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/models/:id
 * Delete model
 */
export async function deleteModel(req, res, next) {
  try {
    const { id } = req.params

    // Check if model exists
    if (!ModelService.exists(id)) {
      return res.status(404).json({
        error: {
          message: 'Model not found',
          type: 'not_found_error',
          code: 'model_not_found'
        }
      })
    }

    // Delete model (cascades to provider_models links)
    ModelService.delete(id)

    logger.info(`Model deleted: ${id}`)

    res.json({
      success: true,
      message: 'Model deleted'
    })
  } catch (error) {
    next(error)
  }
}

export default {
  listModels,
  getModel,
  createModel,
  updateModel,
  deleteModel
}
