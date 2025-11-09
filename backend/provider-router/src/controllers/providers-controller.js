/**
 * Providers Controller
 * Business logic for provider management
 */

import {
  ProviderService,
  ProviderConfigService,
  ProviderModelService
} from '../database/services/index.js'
import { logger } from '../utils/logger.js'
import { getAllProviders, hasProvider as registryHasProvider } from '../providers/index.js'
import { PROVIDER_TYPE_METADATA, PROVIDER_TYPES } from '../providers/provider-types.js'
import { providerRegistry } from '../providers/provider-registry.js'

/**
 * GET /v1/providers/types
 * Get provider type metadata
 */
export async function getProviderTypes(req, res, next) {
  try {
    // Transform metadata into array format for frontend
    const types = Object.entries(PROVIDER_TYPE_METADATA).map(([type, metadata]) => ({
      value: type,
      label: metadata.name,
      description: metadata.description,
      requiredConfig: metadata.requiredConfig,
      optionalConfig: metadata.optionalConfig,
      configSchema: metadata.configSchema,
      capabilities: metadata.capabilities
    }))

    res.json({
      types,
      total: types.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/providers
 * List all providers
 */
export async function listProviders(req, res, next) {
  try {
    const { type, enabled } = req.query

    const filters = {}
    if (type) filters.type = type
    if (enabled !== undefined) filters.enabled = enabled === 'true'

    const providers = ProviderService.getAll(filters)

    // Enrich with runtime status from provider registry
    const enrichedProviders = providers.map(provider => {
      const isLoaded = registryHasProvider(provider.id)
      return {
        ...provider,
        runtime_status: isLoaded ? 'loaded' : 'not_loaded'
      }
    })

    res.json({
      providers: enrichedProviders,
      total: enrichedProviders.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /v1/providers/:id
 * Get provider by ID
 */
export async function getProvider(req, res, next) {
  try {
    const { id } = req.params

    const provider = ProviderService.getById(id)

    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    // Get configuration
    const config = ProviderConfigService.getAll(id, true) // Mask sensitive values

    // Get linked models
    const models = ProviderModelService.getModelsForProvider(id)

    // Check runtime status
    const isLoaded = registryHasProvider(id)

    res.json({
      ...provider,
      config,
      models,
      runtime_status: isLoaded ? 'loaded' : 'not_loaded'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /v1/providers
 * Create new provider
 */
export async function createProvider(req, res, next) {
  try {
    const { id, name, type, enabled, priority, description, config } = req.body

    // Check if provider already exists
    if (ProviderService.exists(id)) {
      return res.status(409).json({
        error: {
          message: 'Provider already exists',
          type: 'conflict_error',
          code: 'provider_exists'
        }
      })
    }

    // Create provider
    const provider = ProviderService.create(id, name, type, {
      enabled,
      priority,
      description
    })

    // Set configuration if provided
    if (config && typeof config === 'object') {
      ProviderConfigService.setMultiple(id, config)
    }

    logger.info(`Provider created: ${id}`, { name, type })

    // Reload provider in registry if enabled
    if (provider.enabled) {
      try {
        await providerRegistry.reloadProvider(id)
        logger.info(`Provider ${id} loaded into registry`)
      } catch (error) {
        logger.warn(`Failed to load provider ${id} into registry:`, error.message)
      }
    }

    // Return created provider with config
    const providerConfig = ProviderConfigService.getAll(id, true)

    res.status(201).json({
      ...provider,
      config: providerConfig
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /v1/providers/:id
 * Update provider
 */
export async function updateProvider(req, res, next) {
  try {
    const { id } = req.params
    const { name, type, enabled, priority, description } = req.body

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

    // Build updates object
    const updates = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type
    if (enabled !== undefined) updates.enabled = enabled
    if (priority !== undefined) updates.priority = priority
    if (description !== undefined) updates.description = description

    // Update provider
    const provider = ProviderService.update(id, updates)

    logger.info(`Provider updated: ${id}`, { updates })

    // Reload provider in registry to pick up changes
    if (provider.enabled) {
      try {
        await providerRegistry.reloadProvider(id)
        logger.info(`Provider ${id} reloaded in registry`)
      } catch (error) {
        logger.warn(`Failed to reload provider ${id} in registry:`, error.message)
      }
    } else {
      // If provider was disabled, unregister it
      providerRegistry.unregister(id)
      logger.info(`Provider ${id} unregistered from registry`)
    }

    res.json(provider)
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /v1/providers/:id
 * Delete provider
 */
export async function deleteProvider(req, res, next) {
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

    // Delete provider (cascades to configs and model links)
    ProviderService.delete(id)

    logger.info(`Provider deleted: ${id}`)

    // Unregister from provider registry
    providerRegistry.unregister(id)
    logger.info(`Provider ${id} unregistered from registry`)

    res.json({
      success: true,
      message: 'Provider deleted'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /v1/providers/:id/enable
 * Enable provider
 */
export async function enableProvider(req, res, next) {
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

    const provider = ProviderService.setEnabled(id, true)

    logger.info(`Provider enabled: ${id}`)

    // Reload provider in registry now that it's enabled
    try {
      await providerRegistry.reloadProvider(id)
      logger.info(`Provider ${id} loaded into registry`)
    } catch (error) {
      logger.warn(`Failed to load provider ${id} into registry:`, error.message)
    }

    res.json({
      ...provider,
      message: 'Provider enabled'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /v1/providers/:id/disable
 * Disable provider
 */
export async function disableProvider(req, res, next) {
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

    const provider = ProviderService.setEnabled(id, false)

    logger.info(`Provider disabled: ${id}`)

    // Unregister from provider registry since it's disabled
    providerRegistry.unregister(id)
    logger.info(`Provider ${id} unregistered from registry`)

    res.json({
      ...provider,
      message: 'Provider disabled'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /v1/providers/:id/test
 * Test provider connection
 */
export async function testProvider(req, res, next) {
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

    // Check if provider is loaded in runtime
    if (!registryHasProvider(id)) {
      return res.status(400).json({
        error: {
          message: 'Provider not loaded. Use reload endpoint first.',
          type: 'provider_not_loaded_error',
          code: 'provider_not_loaded'
        }
      })
    }

    // Get provider from registry
    const { getProvider } = await import('../providers/index.js')
    const provider = getProvider(id)

    // Run health check
    const startTime = Date.now()
    const healthy = await provider.healthCheck()
    const duration = Date.now() - startTime

    res.json({
      provider_id: id,
      healthy,
      duration_ms: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    logger.error(`Provider test failed: ${req.params.id}`, { error: error.message })
    res.status(500).json({
      provider_id: req.params.id,
      healthy: false,
      error: error.message,
      timestamp: Date.now()
    })
  }
}

/**
 * POST /v1/providers/:id/reload
 * Reload provider from database
 */
export async function reloadProvider(req, res, next) {
  try {
    const { id } = req.params

    // Check if provider exists in database
    const provider = ProviderService.getById(id)

    if (!provider) {
      return res.status(404).json({
        error: {
          message: 'Provider not found',
          type: 'not_found_error',
          code: 'provider_not_found'
        }
      })
    }

    // Check if provider is enabled
    if (!provider.enabled) {
      return res.status(400).json({
        error: {
          message: 'Cannot reload disabled provider',
          type: 'provider_disabled_error',
          code: 'provider_disabled'
        }
      })
    }

    // Reload provider from database
    const { reloadProvider: reload } = await import('../providers/index.js')
    const reloadedProvider = await reload(id)

    logger.info(`Provider reloaded: ${id}`)

    res.json({
      provider_id: id,
      name: reloadedProvider.getName(),
      type: reloadedProvider.getType(),
      message: 'Provider reloaded successfully',
      timestamp: Date.now()
    })
  } catch (error) {
    logger.error(`Failed to reload provider: ${req.params.id}`, { error: error.message })
    next(error)
  }
}

export default {
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
}
