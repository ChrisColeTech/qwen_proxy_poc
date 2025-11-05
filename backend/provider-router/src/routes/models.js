/**
 * Model Routes
 * REST API endpoints for model management
 */

import express from 'express'
import {
  listModels,
  getModel,
  createModel,
  updateModel,
  deleteModel
} from '../controllers/models-controller.js'
import {
  validateModel,
  validateModelId,
  validatePagination
} from '../middleware/validation.js'

const router = express.Router()

/**
 * GET /v1/models
 * List all models
 * Query params:
 * - capability: filter by capability (e.g., 'chat', 'vision')
 */
router.get('/', validatePagination, listModels)

/**
 * GET /v1/models/:id
 * Get model details
 * Params:
 * - id: model ID
 */
router.get('/:id', validateModelId, getModel)

/**
 * POST /v1/models
 * Create new model
 * Body:
 * - id: model ID (slug format, required)
 * - name: display name (required)
 * - description: model description (optional)
 * - capabilities: array of capability strings (optional, default: [])
 */
router.post('/', validateModel, createModel)

/**
 * PUT /v1/models/:id
 * Update model
 * Params:
 * - id: model ID
 * Body:
 * - name: display name (optional)
 * - description: model description (optional)
 * - capabilities: array of capability strings (optional)
 */
router.put('/:id', validateModelId, validateModel, updateModel)

/**
 * DELETE /v1/models/:id
 * Delete model
 * Params:
 * - id: model ID
 */
router.delete('/:id', validateModelId, deleteModel)

export default router
