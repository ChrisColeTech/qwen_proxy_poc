/**
 * Provider Factory
 * Creates provider instances from database configuration
 */

import { LMStudioProvider } from './lm-studio-provider.js'
import { QwenProxyProvider } from './qwen-proxy-provider.js'
import QwenDirectProvider from './qwen-direct-provider.js'
import { GenericOpenAIProvider } from './generic-openai-provider.js'
import { ProviderService } from '../database/services/provider-service.js'
import { ProviderConfigService } from '../database/services/provider-config-service.js'
import { ProviderModelService } from '../database/services/provider-model-service.js'
import { PROVIDER_TYPES, validateProviderConfig, getDefaultConfig } from './provider-types.js'
import { logger } from '../utils/logger.js'

/**
 * Provider Factory
 * Creates provider instances dynamically from database configuration
 */
export class ProviderFactory {
  /**
   * Create provider instance from database
   * @param {string} providerId - Provider ID from database
   * @returns {Promise<BaseProvider>} Provider instance
   */
  static async createFromDatabase(providerId) {
    try {
      // 1. Load provider record
      const providerRecord = ProviderService.getById(providerId)
      if (!providerRecord) {
        throw new Error(`Provider not found: ${providerId}`)
      }

      // 2. Load provider configs
      const config = ProviderConfigService.buildConfig(providerId)

      // 3. Merge with defaults
      const defaultConfig = getDefaultConfig(providerRecord.type)
      const completeConfig = { ...defaultConfig, ...config }

      // 4. Validate configuration
      const validation = validateProviderConfig(providerRecord.type, completeConfig)
      if (!validation.valid) {
        throw new Error(`Invalid provider configuration: ${validation.errors.join(', ')}`)
      }

      // 5. Load models for provider
      const models = ProviderModelService.getModelsForProvider(providerId)
      const modelIds = models.map(m => m.id)
      const defaultModel = models.find(m => m.is_default)

      // Add models to config
      completeConfig.models = modelIds
      if (defaultModel) {
        completeConfig.defaultModel = defaultModel.id
      }

      // 6. Create provider instance
      const provider = this.create(
        providerRecord.type,
        providerId,
        providerRecord.name,
        completeConfig
      )

      logger.info(`Created provider from database: ${providerId}`, {
        type: providerRecord.type,
        name: providerRecord.name,
        models: modelIds.length
      })

      return provider
    } catch (error) {
      logger.error(`Failed to create provider from database: ${providerId}`, {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Create provider instance directly
   * @param {string} type - Provider type
   * @param {string} id - Provider ID
   * @param {string} name - Provider name
   * @param {Object} config - Provider configuration
   * @returns {BaseProvider} Provider instance
   */
  static create(type, id, name, config) {
    const ProviderClass = this.getProviderClass(type)

    if (!ProviderClass) {
      throw new Error(`Unknown provider type: ${type}`)
    }

    try {
      const provider = new ProviderClass(id, name, config)

      logger.debug(`Created provider instance: ${id}`, {
        type,
        name
      })

      return provider
    } catch (error) {
      logger.error(`Failed to instantiate provider: ${id}`, {
        type,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get provider class by type
   * @param {string} type - Provider type
   * @returns {Class} Provider class (returns GenericOpenAIProvider for unknown types)
   */
  static getProviderClass(type) {
    const classMap = {
      [PROVIDER_TYPES.LM_STUDIO]: LMStudioProvider,
      [PROVIDER_TYPES.QWEN_PROXY]: QwenProxyProvider,
      [PROVIDER_TYPES.QWEN_DIRECT]: QwenDirectProvider
    }

    // Return specific provider class if known, otherwise use generic OpenAI provider
    return classMap[type] || GenericOpenAIProvider
  }

  /**
   * Validate provider can be created
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
   */
  static validate(type, config) {
    // All provider types are supported via GenericOpenAIProvider fallback
    // Validate configuration (will use generic validation for unknown types)
    return validateProviderConfig(type, config)
  }

  /**
   * Get list of supported provider types
   * @returns {Array<string>} Array of provider type strings
   */
  static getSupportedTypes() {
    return Object.values(PROVIDER_TYPES)
  }

  /**
   * Check if provider type is supported
   * @param {string} type - Provider type
   * @returns {boolean} True if supported (always true with generic fallback)
   */
  static isSupported(type) {
    // All provider types are supported via GenericOpenAIProvider fallback
    return true
  }
}
