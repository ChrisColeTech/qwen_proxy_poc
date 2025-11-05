/**
 * Provider Registry
 * Manages provider lifecycle (load, register, unregister, reload)
 */

import { ProviderFactory } from './provider-factory.js'
import { ProviderService } from '../database/services/provider-service.js'
import { logger } from '../utils/logger.js'

/**
 * Provider Registry
 * Centralized registry for managing provider instances
 */
export class ProviderRegistry {
  constructor() {
    this.providers = new Map() // providerId -> provider instance
    this.loaded = false
  }

  /**
   * Load all enabled providers from database
   * @returns {Promise<number>} Number of providers loaded
   */
  async loadProviders() {
    try {
      logger.info('Loading providers from database...')

      // Get all enabled providers from database
      const providerRecords = ProviderService.getEnabled()

      logger.info(`Found ${providerRecords.length} enabled providers`)

      let loadedCount = 0
      let failedCount = 0

      // Create and register each provider
      for (const record of providerRecords) {
        try {
          const provider = await ProviderFactory.createFromDatabase(record.id)
          this.register(record.id, provider)

          // Run health check
          const healthy = await provider.healthCheck()
          if (healthy) {
            logger.info(`Provider loaded and healthy: ${record.id}`)
            loadedCount++
          } else {
            logger.warn(`Provider loaded but unhealthy: ${record.id}`)
            loadedCount++
          }
        } catch (error) {
          logger.error(`Failed to load provider: ${record.id}`, {
            error: error.message
          })
          failedCount++
        }
      }

      this.loaded = true

      logger.info(`Provider loading complete: ${loadedCount} loaded, ${failedCount} failed`)

      return loadedCount
    } catch (error) {
      logger.error('Failed to load providers', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Reload specific provider from database
   * @param {string} providerId - Provider ID
   * @returns {Promise<BaseProvider>} Reloaded provider instance
   */
  async reloadProvider(providerId) {
    try {
      logger.info(`Reloading provider: ${providerId}`)

      // Unregister existing provider
      if (this.has(providerId)) {
        this.unregister(providerId)
      }

      // Create new instance from database
      const provider = await ProviderFactory.createFromDatabase(providerId)

      // Register new instance
      this.register(providerId, provider)

      // Run health check
      const healthy = await provider.healthCheck()
      if (!healthy) {
        logger.warn(`Reloaded provider is unhealthy: ${providerId}`)
      }

      logger.info(`Provider reloaded successfully: ${providerId}`)

      return provider
    } catch (error) {
      logger.error(`Failed to reload provider: ${providerId}`, {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Reload all providers
   * @returns {Promise<number>} Number of providers reloaded
   */
  async reloadAll() {
    logger.info('Reloading all providers...')

    // Clear all providers
    this.providers.clear()
    this.loaded = false

    // Load fresh from database
    return this.loadProviders()
  }

  /**
   * Register provider instance
   * @param {string} providerId - Provider ID
   * @param {BaseProvider} provider - Provider instance
   */
  register(providerId, provider) {
    if (this.providers.has(providerId)) {
      logger.warn(`Provider already registered, overwriting: ${providerId}`)
    }

    this.providers.set(providerId, provider)
    logger.debug(`Registered provider: ${providerId}`)
  }

  /**
   * Unregister provider
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if unregistered
   */
  unregister(providerId) {
    if (!this.providers.has(providerId)) {
      logger.warn(`Provider not registered: ${providerId}`)
      return false
    }

    // Cleanup provider resources if needed
    const provider = this.providers.get(providerId)
    if (provider && typeof provider.destroy === 'function') {
      try {
        provider.destroy()
      } catch (error) {
        logger.error(`Error destroying provider: ${providerId}`, {
          error: error.message
        })
      }
    }

    this.providers.delete(providerId)
    logger.debug(`Unregistered provider: ${providerId}`)

    return true
  }

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {BaseProvider} Provider instance
   * @throws {Error} If provider not found
   */
  get(providerId) {
    const provider = this.providers.get(providerId)

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }

    return provider
  }

  /**
   * Get provider by ID (safe - returns null if not found)
   * @param {string} providerId - Provider ID
   * @returns {BaseProvider|null} Provider instance or null
   */
  getSafe(providerId) {
    return this.providers.get(providerId) || null
  }

  /**
   * Check if provider is registered
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if registered
   */
  has(providerId) {
    return this.providers.has(providerId)
  }

  /**
   * Get all registered providers
   * @returns {Array<BaseProvider>} Array of provider instances
   */
  getAll() {
    return Array.from(this.providers.values())
  }

  /**
   * Get all provider IDs
   * @returns {Array<string>} Array of provider IDs
   */
  getAllIds() {
    return Array.from(this.providers.keys())
  }

  /**
   * Get providers by type
   * @param {string} type - Provider type
   * @returns {Array<BaseProvider>} Array of provider instances
   */
  getByType(type) {
    return this.getAll().filter(provider => provider.getType() === type)
  }

  /**
   * Get provider count
   * @returns {number} Number of registered providers
   */
  count() {
    return this.providers.size
  }

  /**
   * Check if any providers are loaded
   * @returns {boolean} True if loaded
   */
  isLoaded() {
    return this.loaded
  }

  /**
   * Clear all providers
   */
  clear() {
    // Cleanup all providers
    for (const [providerId, provider] of this.providers.entries()) {
      if (provider && typeof provider.destroy === 'function') {
        try {
          provider.destroy()
        } catch (error) {
          logger.error(`Error destroying provider during clear: ${providerId}`, {
            error: error.message
          })
        }
      }
    }

    this.providers.clear()
    this.loaded = false
    logger.info('Provider registry cleared')
  }

  /**
   * Health check all providers
   * @returns {Promise<Object>} Map of providerId -> health status
   */
  async healthCheckAll() {
    const results = {}

    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const healthy = await provider.healthCheck()
        results[providerId] = {
          healthy,
          error: null
        }
      } catch (error) {
        results[providerId] = {
          healthy: false,
          error: error.message
        }
      }
    }

    return results
  }

  /**
   * Get provider info (without full instance)
   * @returns {Array<Object>} Array of provider info objects
   */
  getInfo() {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getName(),
      type: provider.getType()
    }))
  }
}

// Create singleton instance
export const providerRegistry = new ProviderRegistry()
