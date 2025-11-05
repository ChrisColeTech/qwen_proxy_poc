/**
 * Configuration Migrator Utilities
 * Helper functions for migrating configuration from .env to database
 */

import { logger } from './logger.js'
import { ProviderService } from '../database/services/provider-service.js'
import { ProviderConfigService } from '../database/services/provider-config-service.js'
import { ModelService } from '../database/services/model-service.js'
import { ProviderModelService } from '../database/services/provider-model-service.js'
import { SettingsService } from '../database/services/settings-service.js'

/**
 * Provider type definitions and their required configs
 */
export const PROVIDER_TYPES = {
  'lm-studio': {
    displayName: 'LM Studio',
    requiredConfigs: ['baseURL'],
    optionalConfigs: ['defaultModel', 'timeout'],
    defaultConfigs: {
      baseURL: 'http://192.168.0.22:1234/v1',
      defaultModel: 'qwen3-max',
      timeout: '120000'
    }
  },
  'qwen-proxy': {
    displayName: 'Qwen Proxy',
    requiredConfigs: ['baseURL'],
    optionalConfigs: ['timeout'],
    defaultConfigs: {
      baseURL: 'http://localhost:3000',
      timeout: '120000'
    }
  },
  'qwen-direct': {
    displayName: 'Qwen Direct API',
    requiredConfigs: ['baseURL'],
    optionalConfigs: ['apiKey', 'timeout'],
    sensitiveConfigs: ['apiKey'],
    defaultConfigs: {
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      timeout: '120000'
    }
  }
}

/**
 * Validate provider type
 * @param {string} type - Provider type
 * @returns {boolean} True if valid
 */
export function isValidProviderType(type) {
  return Object.keys(PROVIDER_TYPES).includes(type)
}

/**
 * Get provider type metadata
 * @param {string} type - Provider type
 * @returns {Object|null} Provider type metadata
 */
export function getProviderTypeMetadata(type) {
  return PROVIDER_TYPES[type] || null
}

/**
 * Validate provider configuration
 * @param {string} type - Provider type
 * @param {Object} config - Provider configuration
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateProviderConfig(type, config) {
  const errors = []

  if (!isValidProviderType(type)) {
    errors.push(`Invalid provider type: ${type}`)
    return { valid: false, errors }
  }

  const metadata = getProviderTypeMetadata(type)

  // Check required configs
  for (const requiredKey of metadata.requiredConfigs) {
    if (!config[requiredKey]) {
      errors.push(`Missing required config: ${requiredKey}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Normalize provider configuration
 * Ensures all config values are strings and applies defaults
 * @param {string} type - Provider type
 * @param {Object} config - Provider configuration
 * @returns {Object} Normalized configuration
 */
export function normalizeProviderConfig(type, config) {
  const metadata = getProviderTypeMetadata(type)
  if (!metadata) {
    throw new Error(`Unknown provider type: ${type}`)
  }

  const normalized = {}

  // Apply defaults
  Object.assign(normalized, metadata.defaultConfigs)

  // Apply provided config (convert to strings)
  for (const [key, value] of Object.entries(config)) {
    if (value !== null && value !== undefined) {
      normalized[key] = typeof value === 'string' ? value : String(value)
    }
  }

  return normalized
}

/**
 * Check if a config key is sensitive
 * @param {string} type - Provider type
 * @param {string} key - Config key
 * @returns {boolean} True if sensitive
 */
export function isSensitiveConfig(type, key) {
  const metadata = getProviderTypeMetadata(type)
  if (!metadata || !metadata.sensitiveConfigs) {
    return false
  }
  return metadata.sensitiveConfigs.includes(key)
}

/**
 * Create or update a provider from configuration
 * @param {string} providerId - Provider ID
 * @param {string} name - Provider display name
 * @param {string} type - Provider type
 * @param {Object} config - Provider configuration
 * @param {Object} options - Additional options
 * @returns {Object} Created/updated provider
 */
export function createOrUpdateProvider(providerId, name, type, config, options = {}) {
  try {
    // Validate config
    const validation = validateProviderConfig(type, config)
    if (!validation.valid) {
      throw new Error(`Invalid provider config: ${validation.errors.join(', ')}`)
    }

    // Normalize config
    const normalizedConfig = normalizeProviderConfig(type, config)

    // Check if provider exists
    const exists = ProviderService.exists(providerId)

    let provider
    if (exists) {
      // Update existing provider
      logger.info(`Updating existing provider: ${providerId}`)
      provider = ProviderService.update(providerId, {
        name,
        type,
        enabled: options.enabled !== undefined ? options.enabled : true,
        priority: options.priority !== undefined ? options.priority : 0,
        description: options.description || null
      })
    } else {
      // Create new provider
      logger.info(`Creating new provider: ${providerId}`)
      provider = ProviderService.create(providerId, name, type, {
        enabled: options.enabled !== undefined ? options.enabled : true,
        priority: options.priority !== undefined ? options.priority : 0,
        description: options.description || null
      })
    }

    // Set provider configs
    for (const [key, value] of Object.entries(normalizedConfig)) {
      const isSensitive = isSensitiveConfig(type, key)
      ProviderConfigService.set(providerId, key, value, isSensitive)
    }

    logger.info(`Provider configured: ${providerId}`, {
      type,
      configKeys: Object.keys(normalizedConfig)
    })

    return provider
  } catch (error) {
    logger.error(`Failed to create/update provider: ${providerId}`, {
      error: error.message
    })
    throw error
  }
}

/**
 * Link models to a provider
 * @param {string} providerId - Provider ID
 * @param {Array<string>} modelIds - Array of model IDs to link
 * @param {string} defaultModelId - Default model ID (optional)
 */
export function linkModelsToProvider(providerId, modelIds, defaultModelId = null) {
  try {
    logger.info(`Linking models to provider: ${providerId}`, { modelIds })

    for (const modelId of modelIds) {
      // Check if model exists
      if (!ModelService.exists(modelId)) {
        logger.warn(`Model does not exist, skipping: ${modelId}`)
        continue
      }

      // Check if already linked
      if (ProviderModelService.isLinked(providerId, modelId)) {
        logger.debug(`Model already linked: ${modelId}`)
        continue
      }

      // Link model
      ProviderModelService.link(providerId, modelId, {
        is_default: modelId === defaultModelId
      })

      logger.info(`Linked model to provider: ${providerId} -> ${modelId}`)
    }
  } catch (error) {
    logger.error(`Failed to link models to provider: ${providerId}`, {
      error: error.message
    })
    throw error
  }
}

/**
 * Get the legacy config mode status
 * @returns {boolean} True if legacy config mode is enabled
 */
export function isLegacyConfigMode() {
  return process.env.USE_LEGACY_CONFIG === 'true'
}

/**
 * Check if database has providers configured
 * @returns {boolean} True if providers exist in database
 */
export function hasDatabaseProviders() {
  try {
    const count = ProviderService.count()
    return count > 0
  } catch (error) {
    logger.error('Failed to check database providers', { error: error.message })
    return false
  }
}

/**
 * Determine which configuration source to use
 * Priority: USE_LEGACY_CONFIG flag > database providers > .env fallback
 * @returns {string} Configuration source: 'legacy', 'database', or 'none'
 */
export function getConfigurationSource() {
  if (isLegacyConfigMode()) {
    logger.info('Using legacy configuration mode (.env)')
    return 'legacy'
  }

  if (hasDatabaseProviders()) {
    logger.info('Using database configuration mode')
    return 'database'
  }

  logger.warn('No configuration found - falling back to legacy mode')
  return 'legacy'
}

/**
 * Get default models for a provider type
 * @param {string} type - Provider type
 * @returns {Array<string>} Array of default model IDs
 */
export function getDefaultModelsForType(type) {
  // All current provider types support the same models
  return ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
}

/**
 * Export provider configuration for backup
 * @param {string} providerId - Provider ID
 * @returns {Object} Provider configuration export
 */
export function exportProviderConfig(providerId) {
  try {
    const provider = ProviderService.getById(providerId)
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }

    const config = ProviderConfigService.getAll(providerId, true) // Mask sensitive
    const models = ProviderModelService.getModelsForProvider(providerId)

    return {
      provider,
      config,
      models,
      exportedAt: Date.now()
    }
  } catch (error) {
    logger.error(`Failed to export provider config: ${providerId}`, {
      error: error.message
    })
    throw error
  }
}

/**
 * Import provider configuration from backup
 * @param {Object} exportData - Exported provider data
 * @returns {Object} Imported provider
 */
export function importProviderConfig(exportData) {
  try {
    const { provider, config, models } = exportData

    // Create or update provider
    const imported = createOrUpdateProvider(
      provider.id,
      provider.name,
      provider.type,
      config,
      {
        enabled: provider.enabled,
        priority: provider.priority,
        description: provider.description
      }
    )

    // Link models
    const modelIds = models.map(m => m.model_id)
    const defaultModel = models.find(m => m.is_default)
    linkModelsToProvider(
      provider.id,
      modelIds,
      defaultModel ? defaultModel.model_id : null
    )

    logger.info(`Provider configuration imported: ${provider.id}`)

    return imported
  } catch (error) {
    logger.error('Failed to import provider config', { error: error.message })
    throw error
  }
}

export default {
  PROVIDER_TYPES,
  isValidProviderType,
  getProviderTypeMetadata,
  validateProviderConfig,
  normalizeProviderConfig,
  isSensitiveConfig,
  createOrUpdateProvider,
  linkModelsToProvider,
  isLegacyConfigMode,
  hasDatabaseProviders,
  getConfigurationSource,
  getDefaultModelsForType,
  exportProviderConfig,
  importProviderConfig
}
