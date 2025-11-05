/**
 * Provider Router
 * Routes requests to appropriate provider based on configuration
 * Refactored to use new provider registry with fallback support
 */

import { providerRegistry } from '../providers/provider-registry.js'
import { SettingsService } from '../database/services/settings-service.js'
import { logger } from '../utils/logger.js'

export class ProviderRouter {
  /**
   * Route request to appropriate provider
   * @param {Object} request - Chat completion request
   * @param {boolean} stream - Whether to stream response
   * @returns {Promise<Object|Stream>} Response or stream
   */
  async route(request, stream = false) {
    // Get active provider from database
    const providerId = SettingsService.getActiveProvider()
    logger.info(`Routing request to provider: ${providerId}`)

    try {
      // Get provider instance from registry
      const provider = providerRegistry.get(providerId)

      // Transform request if needed
      const transformedRequest = provider.transformRequest(request)

      // Send request to provider
      const response = await provider.chatCompletion(transformedRequest, stream)

      // Transform response if needed
      if (!stream) {
        return provider.transformResponse(response)
      } else {
        return response // Streaming responses returned as-is
      }
    } catch (error) {
      logger.error(`Failed to route request to provider: ${providerId}`, {
        error: error.message
      })
      throw error
    }
  }

  /**
   * List models from specific provider
   * @param {string} providerId - Provider ID (optional, uses active if not specified)
   * @returns {Promise<Object>} Models list
   */
  async listModels(providerId = null) {
    // Use specified provider or active provider from database
    const activeProviderId = providerId || SettingsService.getActiveProvider()

    try {
      const provider = providerRegistry.get(activeProviderId)
      return provider.listModels()
    } catch (error) {
      logger.error(`Failed to list models for provider: ${activeProviderId}`, {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get provider info
   * @param {string} providerId - Provider ID (optional, uses active if not specified)
   * @returns {Object} Provider info
   */
  getProviderInfo(providerId = null) {
    const activeProviderId = providerId || SettingsService.getActiveProvider()

    try {
      const provider = providerRegistry.get(activeProviderId)
      return {
        id: activeProviderId,
        name: provider.getName(),
        type: provider.getType()
      }
    } catch (error) {
      logger.error(`Failed to get provider info: ${activeProviderId}`, {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Health check for specific provider
   * @param {string} providerId - Provider ID (optional, uses active if not specified)
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck(providerId = null) {
    const activeProviderId = providerId || SettingsService.getActiveProvider()

    try {
      const provider = providerRegistry.get(activeProviderId)
      return provider.healthCheck()
    } catch (error) {
      logger.error(`Failed to health check provider: ${activeProviderId}`, {
        error: error.message
      })
      return false
    }
  }

  /**
   * Get all available providers
   * @returns {Array<Object>} Array of provider info objects
   */
  getAllProviders() {
    return providerRegistry.getInfo()
  }
}

export const providerRouter = new ProviderRouter()
