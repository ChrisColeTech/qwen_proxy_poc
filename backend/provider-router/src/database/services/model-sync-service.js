/**
 * Model Sync Service
 * Discovers and syncs models from providers to database
 */

import { ModelService } from './model-service.js'
import { ProviderModelService } from './provider-model-service.js'
import { ProviderService } from './provider-service.js'
import { logger } from '../../utils/logger.js'

export class ModelSyncService {
  /**
   * Sync models for a specific provider
   * Queries the provider for available models and updates database
   * @param {BaseProvider} providerInstance - Provider instance
   * @param {string} providerId - Provider ID in database
   * @returns {Promise<Object>} Sync result
   */
  static async syncProviderModels(providerInstance, providerId) {
    try {
      logger.info(`Syncing models for provider: ${providerId}`)

      // Get models from provider
      const modelsResponse = await providerInstance.listModels()

      // Extract model IDs from response
      let modelIds = []
      if (modelsResponse && modelsResponse.data) {
        // OpenAI format: { data: [{ id: 'model-id', ... }] }
        modelIds = modelsResponse.data.map(model => model.id)
      } else if (Array.isArray(modelsResponse)) {
        // Array format
        modelIds = modelsResponse.map(model => model.id || model)
      } else {
        logger.warn(`Unexpected models response format for ${providerId}`, { modelsResponse })
        return { success: false, error: 'Unexpected response format', modelsAdded: 0, linksAdded: 0 }
      }

      if (modelIds.length === 0) {
        logger.warn(`No models found for provider: ${providerId}`)
        return { success: true, modelsAdded: 0, linksAdded: 0 }
      }

      logger.info(`Found ${modelIds.length} models for ${providerId}:`, modelIds)

      // Clear existing provider-model links
      const removedLinks = ProviderModelService.unlinkAll(providerId)
      logger.info(`Removed ${removedLinks} existing links for ${providerId}`)

      let modelsAdded = 0
      let linksAdded = 0
      const firstModelId = modelIds[0] // Use first model as default

      // Add each model to database and link to provider
      for (const modelId of modelIds) {
        // Create model if it doesn't exist
        if (!ModelService.exists(modelId)) {
          ModelService.create(modelId, modelId, {
            description: `${modelId} - Discovered from ${providerId}`,
            capabilities: JSON.stringify(['chat', 'completion'])
          })
          modelsAdded++
          logger.debug(`Created new model: ${modelId}`)
        }

        // Link model to provider
        ProviderModelService.link(providerId, modelId, {
          isDefault: modelId === firstModelId
        })
        linksAdded++
      }

      logger.info(`Model sync complete for ${providerId}: ${modelsAdded} new models, ${linksAdded} links created`)

      return {
        success: true,
        modelsAdded,
        linksAdded,
        totalModels: modelIds.length
      }
    } catch (error) {
      logger.error(`Failed to sync models for provider: ${providerId}`, {
        error: error.message,
        stack: error.stack
      })
      return {
        success: false,
        error: error.message,
        modelsAdded: 0,
        linksAdded: 0
      }
    }
  }

  /**
   * Sync models for all enabled providers
   * @param {ProviderRegistry} providerRegistry - Provider registry instance
   * @returns {Promise<Object>} Overall sync result
   */
  static async syncAllProviders(providerRegistry) {
    logger.info('Starting model sync for all providers...')

    const results = {}
    const providerIds = providerRegistry.getAllIds()

    for (const providerId of providerIds) {
      try {
        const provider = providerRegistry.get(providerId)
        const result = await this.syncProviderModels(provider, providerId)
        results[providerId] = result
      } catch (error) {
        logger.error(`Failed to sync provider ${providerId}`, { error: error.message })
        results[providerId] = {
          success: false,
          error: error.message,
          modelsAdded: 0,
          linksAdded: 0
        }
      }
    }

    // Calculate totals
    const totals = {
      providers: providerIds.length,
      successful: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length,
      totalModelsAdded: Object.values(results).reduce((sum, r) => sum + r.modelsAdded, 0),
      totalLinksAdded: Object.values(results).reduce((sum, r) => sum + r.linksAdded, 0)
    }

    logger.info('Model sync complete for all providers', totals)

    return {
      success: totals.successful > 0, // Success if at least one provider synced
      results,
      totals
    }
  }
}
