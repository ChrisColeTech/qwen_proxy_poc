/**
 * Provider Registry
 * Central registry for all provider implementations
 * Refactored to use database-driven provider management
 */

import { logger } from '../utils/logger.js'
import { providerRegistry } from './provider-registry.js'
import { ProviderFactory } from './provider-factory.js'

/**
 * Register a provider manually (for backward compatibility or testing)
 * @param {string} providerId - Provider ID
 * @param {BaseProvider} provider - Provider instance
 */
export function registerProvider(providerId, provider) {
  providerRegistry.register(providerId, provider)
  logger.debug(`Registered provider: ${providerId}`)
}

/**
 * Get a provider by ID
 * @param {string} providerId - Provider ID
 * @returns {BaseProvider} Provider instance
 * @throws {Error} If provider not found
 */
export function getProvider(providerId) {
  return providerRegistry.get(providerId)
}

/**
 * Get all registered providers
 * @returns {Array<BaseProvider>} Array of provider instances
 */
export function getAllProviders() {
  return providerRegistry.getAll()
}

/**
 * Get all provider IDs
 * @returns {Array<string>} Array of provider IDs
 */
export function getProviderNames() {
  return providerRegistry.getAllIds()
}

/**
 * Check if provider exists
 * @param {string} providerId - Provider ID
 * @returns {boolean} True if provider exists
 */
export function hasProvider(providerId) {
  return providerRegistry.has(providerId)
}

/**
 * Get default provider
 * Note: This function is deprecated. Use SettingsService.getActiveProvider() instead.
 * @deprecated
 * @returns {BaseProvider} Default provider instance
 */
export function getDefaultProvider() {
  logger.warn('getDefaultProvider() is deprecated. Use SettingsService.getActiveProvider() to get provider ID, then getProvider(id)')

  // Try to get first provider as fallback
  const providers = getAllProviders()
  if (providers.length > 0) {
    return providers[0]
  }

  throw new Error('No providers available')
}

/**
 * Initialize all providers from database
 * This replaces the old hardcoded provider registration
 * @returns {Promise<number>} Number of providers loaded
 */
export async function initializeProviders() {
  logger.info('Initializing providers from database...')

  try {
    // Load all enabled providers from database
    const count = await providerRegistry.loadProviders()

    if (count === 0) {
      logger.warn('No providers loaded from database')
    } else {
      logger.info(`Successfully initialized ${count} providers`)
      logger.info(`Registered providers: ${getProviderNames().join(', ')}`)
    }

    return count
  } catch (error) {
    logger.error('Failed to initialize providers', {
      error: error.message
    })
    throw error
  }
}

/**
 * Reload a specific provider from database
 * @param {string} providerId - Provider ID
 * @returns {Promise<BaseProvider>} Reloaded provider instance
 */
export async function reloadProvider(providerId) {
  return providerRegistry.reloadProvider(providerId)
}

/**
 * Reload all providers from database
 * @returns {Promise<number>} Number of providers reloaded
 */
export async function reloadAllProviders() {
  return providerRegistry.reloadAll()
}

/**
 * Unregister a provider
 * @param {string} providerId - Provider ID
 * @returns {boolean} True if unregistered
 */
export function unregisterProvider(providerId) {
  return providerRegistry.unregister(providerId)
}

/**
 * Get provider registry instance (for advanced usage)
 * @returns {ProviderRegistry} Provider registry instance
 */
export function getProviderRegistry() {
  return providerRegistry
}

/**
 * Get provider factory (for advanced usage)
 * @returns {ProviderFactory} Provider factory class
 */
export function getProviderFactory() {
  return ProviderFactory
}

// Export provider registry and factory for direct access
export { providerRegistry, ProviderFactory }

// Export provider types
export { PROVIDER_TYPES } from './provider-types.js'
