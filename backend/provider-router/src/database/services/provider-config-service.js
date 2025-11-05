/**
 * Provider Config Service
 * Manages CRUD operations for provider configurations (key-value pairs)
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class ProviderConfigService {
  /**
   * Set a configuration value
   * @param {string} providerId - Provider ID
   * @param {string} key - Config key
   * @param {any} value - Config value (will be JSON stringified if object)
   * @param {boolean} isSensitive - Whether value is sensitive
   * @returns {Object} Config entry
   */
  static set(providerId, key, value, isSensitive = false) {
    const db = getDatabase()
    const now = Date.now()

    try {
      // Serialize value if it's an object
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

      const stmt = db.prepare(`
        INSERT INTO provider_configs (provider_id, key, value, is_sensitive, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider_id, key) DO UPDATE SET
          value = excluded.value,
          is_sensitive = excluded.is_sensitive,
          updated_at = excluded.updated_at
      `)

      stmt.run(providerId, key, serializedValue, isSensitive ? 1 : 0, now, now)

      logger.info(`Provider config set: ${providerId}.${key}`, { isSensitive })

      return { provider_id: providerId, key, value, is_sensitive: isSensitive }
    } catch (error) {
      logger.error(`Failed to set provider config: ${providerId}.${key}`, { error: error.message })
      throw error
    }
  }

  /**
   * Set multiple configuration values
   * @param {string} providerId - Provider ID
   * @param {Object} configs - Object with key-value pairs
   * @returns {number} Number of configs set
   */
  static setMultiple(providerId, configs) {
    let count = 0

    for (const [key, value] of Object.entries(configs)) {
      // Check if value is marked as sensitive (key ends with _sensitive)
      const isSensitive = key.toLowerCase().includes('key') ||
                         key.toLowerCase().includes('secret') ||
                         key.toLowerCase().includes('password') ||
                         key.toLowerCase().includes('token')

      this.set(providerId, key, value, isSensitive)
      count++
    }

    logger.info(`Set ${count} configs for provider: ${providerId}`)
    return count
  }

  /**
   * Get a configuration value
   * @param {string} providerId - Provider ID
   * @param {string} key - Config key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Config value (parsed if JSON)
   */
  static get(providerId, key, defaultValue = null) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM provider_configs WHERE provider_id = ? AND key = ?')
      const config = stmt.get(providerId, key)

      if (!config) {
        return defaultValue
      }

      // Try to parse JSON values
      try {
        return JSON.parse(config.value)
      } catch {
        // Return as string if not valid JSON
        return config.value
      }
    } catch (error) {
      logger.error(`Failed to get provider config: ${providerId}.${key}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all configuration values for a provider
   * @param {string} providerId - Provider ID
   * @param {boolean} maskSensitive - Whether to mask sensitive values
   * @returns {Object} Object with all config key-value pairs
   */
  static getAll(providerId, maskSensitive = true) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM provider_configs WHERE provider_id = ?')
      const configs = stmt.all(providerId)

      const result = {}

      for (const config of configs) {
        let value = config.value

        // Mask sensitive values
        if (maskSensitive && config.is_sensitive) {
          value = '***MASKED***'
        } else {
          // Try to parse JSON
          try {
            value = JSON.parse(value)
          } catch {
            // Keep as string if not valid JSON
          }
        }

        result[config.key] = value
      }

      return result
    } catch (error) {
      logger.error(`Failed to get provider configs: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get multiple configuration values
   * @param {string} providerId - Provider ID
   * @param {Array<string>} keys - Array of config keys
   * @returns {Object} Object with requested key-value pairs
   */
  static getMultiple(providerId, keys) {
    const result = {}

    for (const key of keys) {
      result[key] = this.get(providerId, key)
    }

    return result
  }

  /**
   * Delete a configuration value
   * @param {string} providerId - Provider ID
   * @param {string} key - Config key
   * @returns {boolean} True if deleted
   */
  static delete(providerId, key) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM provider_configs WHERE provider_id = ? AND key = ?')
      const result = stmt.run(providerId, key)

      if (result.changes === 0) {
        throw new Error(`Config not found: ${providerId}.${key}`)
      }

      logger.info(`Provider config deleted: ${providerId}.${key}`)

      return true
    } catch (error) {
      logger.error(`Failed to delete provider config: ${providerId}.${key}`, { error: error.message })
      throw error
    }
  }

  /**
   * Delete all configuration values for a provider
   * @param {string} providerId - Provider ID
   * @returns {number} Number of configs deleted
   */
  static deleteAll(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM provider_configs WHERE provider_id = ?')
      const result = stmt.run(providerId)

      logger.info(`Deleted ${result.changes} configs for provider: ${providerId}`)

      return result.changes
    } catch (error) {
      logger.error(`Failed to delete provider configs: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Check if a configuration exists
   * @param {string} providerId - Provider ID
   * @param {string} key - Config key
   * @returns {boolean} True if config exists
   */
  static exists(providerId, key) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM provider_configs WHERE provider_id = ? AND key = ?')
      const result = stmt.get(providerId, key)
      return result.count > 0
    } catch (error) {
      logger.error(`Failed to check config existence: ${providerId}.${key}`, { error: error.message })
      throw error
    }
  }

  /**
   * Build complete configuration object for provider
   * Combines all configs into a single object ready for provider instantiation
   * @param {string} providerId - Provider ID
   * @returns {Object} Complete config object
   */
  static buildConfig(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT key, value, is_sensitive FROM provider_configs WHERE provider_id = ?')
      const configs = stmt.all(providerId)

      const config = {}

      for (const row of configs) {
        let value = row.value

        // Try to parse JSON values
        try {
          value = JSON.parse(value)
        } catch {
          // Keep as string if not valid JSON
        }

        config[row.key] = value
      }

      logger.debug(`Built config for provider: ${providerId}`, { keys: Object.keys(config) })

      return config
    } catch (error) {
      logger.error(`Failed to build config: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all configs with metadata (including sensitive flag)
   * @param {string} providerId - Provider ID
   * @returns {Array} Array of config objects with metadata
   */
  static getAllWithMetadata(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM provider_configs WHERE provider_id = ? ORDER BY key ASC')
      const configs = stmt.all(providerId)

      return configs.map(config => ({
        id: config.id,
        provider_id: config.provider_id,
        key: config.key,
        value: config.value,
        is_sensitive: Boolean(config.is_sensitive),
        created_at: config.created_at,
        updated_at: config.updated_at
      }))
    } catch (error) {
      logger.error(`Failed to get configs with metadata: ${providerId}`, { error: error.message })
      throw error
    }
  }
}
