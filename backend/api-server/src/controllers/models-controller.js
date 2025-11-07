/**
 * Models Controller
 * Wraps provider-router's models controller with WebSocket event emission
 */

import {
  listModels as _listModels,
  getModel as _getModel,
  createModel as _createModel,
  updateModel as _updateModel,
  deleteModel as _deleteModel
} from '../../../provider-router/src/controllers/models-controller.js'
import { eventEmitter } from '../services/event-emitter.js'
import { ModelService } from '../../../provider-router/src/database/services/index.js'

/**
 * Helper to emit models updated event
 */
function emitModelsUpdate(action, modelId = null) {
  try {
    const models = ModelService.getAll()
    eventEmitter.emitModelsUpdated({
      action,
      modelId,
      items: models,
      total: models.length
    })
  } catch (error) {
    console.error('[Models Controller] Error emitting models update:', error)
  }
}

// Read-only operations (no event emission)
export async function listModels(req, res, next) {
  return _listModels(req, res, next)
}

export async function getModel(req, res, next) {
  return _getModel(req, res, next)
}

// Write operations (with event emission)
export async function createModel(req, res, next) {
  await _createModel(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitModelsUpdate('created', req.body?.id)
  }
}

export async function updateModel(req, res, next) {
  await _updateModel(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitModelsUpdate('updated', req.params?.id)
  }
}

export async function deleteModel(req, res, next) {
  await _deleteModel(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitModelsUpdate('deleted', req.params?.id)
  }
}
