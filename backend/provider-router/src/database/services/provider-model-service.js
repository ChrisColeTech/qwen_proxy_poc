/**
 * Provider Model Service
 * Manages many-to-many mappings between providers and models
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class ProviderModelService {
  /**
   * Link a model to a provider
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @param {Object} options - Additional options
   * @returns {Object} Created link
   */
  static link(providerId, modelId, options = {}) {
    const db = getDatabase()
    const now = Date.now()

    const {
      isDefault = false,
      config = null
    } = options

    const configJson = config ? JSON.stringify(config) : null

    try {
      const stmt = db.prepare(`
        INSERT INTO provider_models (provider_id, model_id, is_default, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(providerId, modelId, isDefault ? 1 : 0, configJson, now, now)

      logger.info(`Model linked to provider: ${providerId} -> ${modelId}`, { isDefault })

      return {
        id: result.lastInsertRowid,
        provider_id: providerId,
        model_id: modelId,
        is_default: isDefault,
        config,
        created_at: now,
        updated_at: now
      }
    } catch (error) {
      logger.error(`Failed to link model to provider: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all models for a provider
   * @param {string} providerId - Provider ID
   * @returns {Array} Array of models
   */
  static getModelsForProvider(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT m.*, pm.is_default, pm.config as provider_config
        FROM models m
        INNER JOIN provider_models pm ON m.id = pm.model_id
        WHERE pm.provider_id = ?
        ORDER BY pm.is_default DESC, m.name ASC
      `)

      const models = stmt.all(providerId)

      return models.map(model => ({
        ...model,
        is_default: Boolean(model.is_default),
        capabilities: JSON.parse(model.capabilities || '[]'),
        provider_config: model.provider_config ? JSON.parse(model.provider_config) : null
      }))
    } catch (error) {
      logger.error(`Failed to get models for provider: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all providers for a model
   * @param {string} modelId - Model ID
   * @returns {Array} Array of providers
   */
  static getProvidersForModel(modelId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT p.*, pm.is_default, pm.config as model_config
        FROM providers p
        INNER JOIN provider_models pm ON p.id = pm.provider_id
        WHERE pm.model_id = ?
        ORDER BY p.priority DESC, p.name ASC
      `)

      const providers = stmt.all(modelId)

      return providers.map(provider => ({
        ...provider,
        enabled: Boolean(provider.enabled),
        is_default: Boolean(provider.is_default),
        model_config: provider.model_config ? JSON.parse(provider.model_config) : null
      }))
    } catch (error) {
      logger.error(`Failed to get providers for model: ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get default model for a provider
   * @param {string} providerId - Provider ID
   * @returns {Object|null} Default model or null
   */
  static getDefaultModel(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT m.*, pm.config as provider_config
        FROM models m
        INNER JOIN provider_models pm ON m.id = pm.model_id
        WHERE pm.provider_id = ? AND pm.is_default = 1
        LIMIT 1
      `)

      const model = stmt.get(providerId)

      if (model) {
        model.capabilities = JSON.parse(model.capabilities || '[]')
        model.provider_config = model.provider_config ? JSON.parse(model.provider_config) : null
      }

      return model
    } catch (error) {
      logger.error(`Failed to get default model for provider: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Set default model for a provider
   * Clears any existing default and sets new one
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @returns {Object} Updated link
   */
  static setDefaultModel(providerId, modelId) {
    const db = getDatabase()
    const now = Date.now()

    try {
      // Start transaction
      db.prepare('BEGIN').run()

      // Clear existing default
      db.prepare(`
        UPDATE provider_models
        SET is_default = 0, updated_at = ?
        WHERE provider_id = ? AND is_default = 1
      `).run(now, providerId)

      // Set new default
      const result = db.prepare(`
        UPDATE provider_models
        SET is_default = 1, updated_at = ?
        WHERE provider_id = ? AND model_id = ?
      `).run(now, providerId, modelId)

      if (result.changes === 0) {
        db.prepare('ROLLBACK').run()
        throw new Error(`Model not linked to provider: ${providerId} -> ${modelId}`)
      }

      db.prepare('COMMIT').run()

      logger.info(`Default model set for provider: ${providerId} -> ${modelId}`)

      return this.getDefaultModel(providerId)
    } catch (error) {
      db.prepare('ROLLBACK').run()
      logger.error(`Failed to set default model: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Update provider-specific model config
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @param {Object} config - Configuration object
   * @returns {boolean} True if updated
   */
  static updateConfig(providerId, modelId, config) {
    const db = getDatabase()
    const now = Date.now()

    const configJson = JSON.stringify(config)

    try {
      const stmt = db.prepare(`
        UPDATE provider_models
        SET config = ?, updated_at = ?
        WHERE provider_id = ? AND model_id = ?
      `)

      const result = stmt.run(configJson, now, providerId, modelId)

      if (result.changes === 0) {
        throw new Error(`Model not linked to provider: ${providerId} -> ${modelId}`)
      }

      logger.info(`Provider model config updated: ${providerId} -> ${modelId}`)

      return true
    } catch (error) {
      logger.error(`Failed to update provider model config: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Unlink a model from a provider
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @returns {boolean} True if unlinked
   */
  static unlink(providerId, modelId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM provider_models WHERE provider_id = ? AND model_id = ?')
      const result = stmt.run(providerId, modelId)

      if (result.changes === 0) {
        throw new Error(`Model not linked to provider: ${providerId} -> ${modelId}`)
      }

      logger.info(`Model unlinked from provider: ${providerId} -> ${modelId}`)

      return true
    } catch (error) {
      logger.error(`Failed to unlink model from provider: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Unlink all models from a provider
   * @param {string} providerId - Provider ID
   * @returns {number} Number of models unlinked
   */
  static unlinkAll(providerId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM provider_models WHERE provider_id = ?')
      const result = stmt.run(providerId)

      logger.info(`Unlinked ${result.changes} models from provider: ${providerId}`)

      return result.changes
    } catch (error) {
      logger.error(`Failed to unlink all models from provider: ${providerId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Check if a model is linked to a provider
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @returns {boolean} True if linked
   */
  static isLinked(providerId, modelId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM provider_models
        WHERE provider_id = ? AND model_id = ?
      `)
      const result = stmt.get(providerId, modelId)
      return result.count > 0
    } catch (error) {
      logger.error(`Failed to check if model is linked: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get link details
   * @param {string} providerId - Provider ID
   * @param {string} modelId - Model ID
   * @returns {Object|null} Link details or null
   */
  static getLink(providerId, modelId) {
    const db = getDatabase()

    try {
      const stmt = db.prepare(`
        SELECT * FROM provider_models
        WHERE provider_id = ? AND model_id = ?
      `)
      const link = stmt.get(providerId, modelId)

      if (link) {
        link.is_default = Boolean(link.is_default)
        link.config = link.config ? JSON.parse(link.config) : null
      }

      return link
    } catch (error) {
      logger.error(`Failed to get link: ${providerId} -> ${modelId}`, { error: error.message })
      throw error
    }
  }
}
