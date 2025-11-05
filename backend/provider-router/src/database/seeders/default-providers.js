/**
 * Default Providers Seeder
 * Seeds default provider configurations and models
 */

import { getDatabase } from '../connection.js'
import { ProviderService } from '../services/provider-service.js'
import { ProviderConfigService } from '../services/provider-config-service.js'
import { ModelService } from '../services/model-service.js'
import { ProviderModelService } from '../services/provider-model-service.js'
import { logger } from '../../utils/logger.js'

/**
 * Default models to seed
 */
const DEFAULT_MODELS = [
  {
    id: 'qwen3-max',
    name: 'Qwen3 Max',
    description: 'Qwen3 Max - High performance model',
    capabilities: JSON.stringify(['chat', 'completion', 'tools'])
  },
  {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder',
    description: 'Qwen3 Coder - Specialized for coding tasks',
    capabilities: JSON.stringify(['chat', 'completion', 'code'])
  },
  {
    id: 'qwen3-coder-flash',
    name: 'Qwen3 Coder Flash',
    description: 'Qwen3 Coder Flash - Fast coding model',
    capabilities: JSON.stringify(['chat', 'completion', 'code'])
  }
]

/**
 * Seed default models into the database
 * @returns {Promise<void>}
 */
export async function seedDefaultModels() {
  logger.info('Seeding default models...')

  try {
    for (const model of DEFAULT_MODELS) {
      // Check if model already exists
      if (!ModelService.exists(model.id)) {
        ModelService.create(model.id, model.name, {
          description: model.description,
          capabilities: model.capabilities
        })
        logger.info(`Created model: ${model.id}`)
      } else {
        logger.debug(`Model already exists: ${model.id}`)
      }
    }

    logger.info('Default models seeded successfully')
  } catch (error) {
    logger.error('Failed to seed default models', { error: error.message })
    throw error
  }
}

/**
 * Seed a default LM Studio provider
 * @param {Object} config - Configuration from .env
 * @returns {Promise<Object>} Created provider
 */
export async function seedLMStudioProvider(config = {}) {
  const providerId = 'lm-studio-default'
  const providerName = 'LM Studio Default'

  logger.info(`Seeding LM Studio provider: ${providerId}`)

  try {
    // Check if provider already exists
    if (ProviderService.exists(providerId)) {
      logger.debug(`Provider already exists: ${providerId}`)
      return ProviderService.getById(providerId)
    }

    // Create provider
    const provider = ProviderService.create(providerId, providerName, 'lm-studio', {
      enabled: true,
      priority: 10,
      description: 'Default LM Studio provider instance'
    })

    // Set provider configs
    const baseURL = config.baseURL || 'http://localhost:1234/v1'
    const defaultModel = config.defaultModel || 'qwen3-max'
    const timeout = config.timeout || 120000

    ProviderConfigService.set(providerId, 'baseURL', baseURL, false)
    ProviderConfigService.set(providerId, 'defaultModel', defaultModel, false)
    ProviderConfigService.set(providerId, 'timeout', timeout.toString(), false)

    logger.info(`LM Studio provider configs set: baseURL=${baseURL}`)

    // Link models to provider
    const modelsToLink = ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    for (const modelId of modelsToLink) {
      if (ModelService.exists(modelId)) {
        ProviderModelService.link(providerId, modelId, {
          isDefault: modelId === defaultModel
        })
        logger.info(`Linked model ${modelId} to ${providerId}`)
      }
    }

    logger.info(`LM Studio provider seeded successfully: ${providerId}`)
    return provider
  } catch (error) {
    logger.error('Failed to seed LM Studio provider', { error: error.message })
    throw error
  }
}

/**
 * Seed a default Qwen Proxy provider
 * @param {Object} config - Configuration from .env
 * @returns {Promise<Object>} Created provider
 */
export async function seedQwenProxyProvider(config = {}) {
  const providerId = 'qwen-proxy-default'
  const providerName = 'Qwen Proxy Default'

  logger.info(`Seeding Qwen Proxy provider: ${providerId}`)

  try {
    // Check if provider already exists
    if (ProviderService.exists(providerId)) {
      logger.debug(`Provider already exists: ${providerId}`)
      return ProviderService.getById(providerId)
    }

    // Create provider
    const provider = ProviderService.create(providerId, providerName, 'qwen-proxy', {
      enabled: true,
      priority: 5,
      description: 'Default Qwen Proxy provider instance'
    })

    // Set provider configs
    const baseURL = config.baseURL || 'http://localhost:3000'
    const timeout = config.timeout || 120000

    ProviderConfigService.set(providerId, 'baseURL', baseURL, false)
    ProviderConfigService.set(providerId, 'timeout', timeout.toString(), false)

    logger.info(`Qwen Proxy provider configs set: baseURL=${baseURL}`)

    // Link models to provider
    const modelsToLink = ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    for (const modelId of modelsToLink) {
      if (ModelService.exists(modelId)) {
        ProviderModelService.link(providerId, modelId, {
          isDefault: modelId === 'qwen3-max'
        })
        logger.info(`Linked model ${modelId} to ${providerId}`)
      }
    }

    logger.info(`Qwen Proxy provider seeded successfully: ${providerId}`)
    return provider
  } catch (error) {
    logger.error('Failed to seed Qwen Proxy provider', { error: error.message })
    throw error
  }
}

/**
 * Seed a default Qwen Direct provider
 * @param {Object} config - Configuration from .env
 * @returns {Promise<Object>} Created provider
 */
export async function seedQwenDirectProvider(config = {}) {
  const providerId = 'qwen-direct-default'
  const providerName = 'Qwen Direct Default'

  logger.info(`Seeding Qwen Direct provider: ${providerId}`)

  try {
    // Check if provider already exists
    if (ProviderService.exists(providerId)) {
      logger.debug(`Provider already exists: ${providerId}`)
      return ProviderService.getById(providerId)
    }

    // Create provider
    const provider = ProviderService.create(providerId, providerName, 'qwen-direct', {
      enabled: config.apiKey ? true : false, // Only enable if API key is provided
      priority: 8,
      description: 'Default Qwen Direct API provider instance'
    })

    // Set provider configs
    const baseURL = config.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    const timeout = config.timeout || 120000

    ProviderConfigService.set(providerId, 'baseURL', baseURL, false)
    ProviderConfigService.set(providerId, 'timeout', timeout.toString(), false)

    if (config.apiKey) {
      ProviderConfigService.set(providerId, 'apiKey', config.apiKey, true) // Mark as sensitive
      logger.info(`Qwen Direct provider API key set`)
    } else {
      logger.warn(`Qwen Direct provider created without API key - provider disabled`)
    }

    logger.info(`Qwen Direct provider configs set: baseURL=${baseURL}`)

    // Link models to provider
    const modelsToLink = ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    for (const modelId of modelsToLink) {
      if (ModelService.exists(modelId)) {
        ProviderModelService.link(providerId, modelId, {
          isDefault: modelId === 'qwen3-max'
        })
        logger.info(`Linked model ${modelId} to ${providerId}`)
      }
    }

    logger.info(`Qwen Direct provider seeded successfully: ${providerId}`)
    return provider
  } catch (error) {
    logger.error('Failed to seed Qwen Direct provider', { error: error.message })
    throw error
  }
}

/**
 * Seed all default providers
 * @param {Object} configs - Provider configurations from .env
 * @returns {Promise<void>}
 */
export async function seedAllProviders(configs = {}) {
  logger.info('Seeding all default providers...')

  try {
    // First, seed models
    await seedDefaultModels()

    // Then seed providers
    const lmStudioConfig = configs.lmStudio || {}
    const qwenProxyConfig = configs.qwenProxy || {}
    const qwenDirectConfig = configs.qwenDirect || {}

    await seedLMStudioProvider(lmStudioConfig)
    await seedQwenProxyProvider(qwenProxyConfig)
    await seedQwenDirectProvider(qwenDirectConfig)

    logger.info('All default providers seeded successfully')
  } catch (error) {
    logger.error('Failed to seed default providers', { error: error.message })
    throw error
  }
}

/**
 * Check if database has any providers
 * @returns {boolean} True if database has providers
 */
export function hasProviders() {
  try {
    const count = ProviderService.count()
    return count > 0
  } catch (error) {
    logger.error('Failed to check if database has providers', { error: error.message })
    return false
  }
}

export default {
  seedDefaultModels,
  seedLMStudioProvider,
  seedQwenProxyProvider,
  seedQwenDirectProvider,
  seedAllProviders,
  hasProviders
}
