/**
 * Providers Controller
 * Wraps provider-router's providers controller with WebSocket event emission
 */

import {
  listProviders as _listProviders,
  getProvider as _getProvider,
  createProvider as _createProvider,
  updateProvider as _updateProvider,
  deleteProvider as _deleteProvider,
  enableProvider as _enableProvider,
  disableProvider as _disableProvider,
  testProvider as _testProvider,
  reloadProvider as _reloadProvider
} from '../../../provider-router/src/controllers/providers-controller.js'
import { eventEmitter } from '../services/event-emitter.js'
import { ProviderService } from '../../../provider-router/src/database/services/index.js'

/**
 * Helper to emit providers updated event
 */
function emitProvidersUpdate(action, providerId = null) {
  try {
    const providers = ProviderService.getAll()
    eventEmitter.emitProvidersUpdated({
      action,
      providerId,
      items: providers,
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length
    })
  } catch (error) {
    console.error('[Providers Controller] Error emitting providers update:', error)
  }
}

// Read-only operations (no event emission)
export async function listProviders(req, res, next) {
  return _listProviders(req, res, next)
}

export async function getProvider(req, res, next) {
  return _getProvider(req, res, next)
}

export async function testProvider(req, res, next) {
  return _testProvider(req, res, next)
}

// Write operations (with event emission)
export async function createProvider(req, res, next) {
  await _createProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('created', req.body?.id)
  }
}

export async function updateProvider(req, res, next) {
  await _updateProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('updated', req.params?.id)
  }
}

export async function deleteProvider(req, res, next) {
  await _deleteProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('deleted', req.params?.id)
  }
}

export async function enableProvider(req, res, next) {
  await _enableProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('enabled', req.params?.id)
  }
}

export async function disableProvider(req, res, next) {
  await _disableProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('disabled', req.params?.id)
  }
}

export async function reloadProvider(req, res, next) {
  await _reloadProvider(req, res, next)
  if (res.statusCode >= 200 && res.statusCode < 300) {
    emitProvidersUpdate('reloaded', req.params?.id)
  }
}
