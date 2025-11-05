/**
 * Model Service
 * Manages CRUD operations for LLM models
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class ModelService {
  /**
   * Create a new model
   * @param {string} id - Model ID
   * @param {string} name - Display name
   * @param {Object} options - Additional options
   * @returns {Object} Created model
   */
  static create(id, name, options = {}) {
    const db = getDatabase()
    const now = Date.now()

    const {
      description = null,
      capabilities = []
    } = options

    // Serialize capabilities array to JSON
    const capabilitiesJson = JSON.stringify(capabilities)

    try {
      const stmt = db.prepare(`
        INSERT INTO models (id, name, description, capabilities, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      stmt.run(id, name, description, capabilitiesJson, now, now)

      logger.info(`Model created: ${id}`, { name })

      return this.getById(id)
    } catch (error) {
      logger.error(`Failed to create model: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get model by ID
   * @param {string} id - Model ID
   * @returns {Object|null} Model or null if not found
   */
  static getById(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM models WHERE id = ?')
      const model = stmt.get(id)

      if (model) {
        // Parse capabilities JSON
        try {
          model.capabilities = JSON.parse(model.capabilities || '[]')
        } catch {
          model.capabilities = []
        }

        // Add status field (computed - all models are 'active' by default)
        model.status = 'active'
      }

      return model
    } catch (error) {
      logger.error(`Failed to get model: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all models with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of models
   */
  static getAll(filters = {}) {
    const db = getDatabase()

    try {
      let query = 'SELECT * FROM models WHERE 1=1'
      const params = []

      if (filters.nameContains) {
        query += ' AND name LIKE ?'
        params.push(`%${filters.nameContains}%`)
      }

      query += ' ORDER BY name ASC'

      const stmt = db.prepare(query)
      const models = stmt.all(...params)

      return models.map(model => ({
        ...model,
        capabilities: JSON.parse(model.capabilities || '[]'),
        status: 'active' // Add status field (computed - all models are 'active' by default)
      }))
    } catch (error) {
      logger.error('Failed to get models', { error: error.message })
      throw error
    }
  }

  /**
   * Get models by capability
   * @param {string} capability - Capability name (e.g., 'chat', 'vision')
   * @returns {Array} Array of models with this capability
   */
  static getByCapability(capability) {
    const db = getDatabase()

    try {
      // SQLite doesn't have native JSON array search, so we use LIKE
      const stmt = db.prepare('SELECT * FROM models WHERE capabilities LIKE ? ORDER BY name ASC')
      const models = stmt.all(`%"${capability}"%`)

      return models.map(model => ({
        ...model,
        capabilities: JSON.parse(model.capabilities || '[]'),
        status: 'active' // Add status field (computed - all models are 'active' by default)
      })).filter(model => model.capabilities.includes(capability))
    } catch (error) {
      logger.error(`Failed to get models by capability: ${capability}`, { error: error.message })
      throw error
    }
  }

  /**
   * Update model
   * @param {string} id - Model ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated model
   */
  static update(id, updates) {
    const db = getDatabase()
    const now = Date.now()

    try {
      const allowedFields = ['name', 'description', 'capabilities']
      const fields = []
      const values = []

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`)

          // Serialize capabilities to JSON
          if (key === 'capabilities') {
            values.push(JSON.stringify(value))
          } else {
            values.push(value)
          }
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update')
      }

      fields.push('updated_at = ?')
      values.push(now, id)

      const query = `UPDATE models SET ${fields.join(', ')} WHERE id = ?`
      const stmt = db.prepare(query)
      const result = stmt.run(...values)

      if (result.changes === 0) {
        throw new Error(`Model not found: ${id}`)
      }

      logger.info(`Model updated: ${id}`, { updates })

      return this.getById(id)
    } catch (error) {
      logger.error(`Failed to update model: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Delete model
   * @param {string} id - Model ID
   * @returns {boolean} True if deleted
   */
  static delete(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM models WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        throw new Error(`Model not found: ${id}`)
      }

      logger.info(`Model deleted: ${id}`)

      return true
    } catch (error) {
      logger.error(`Failed to delete model: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Check if model exists
   * @param {string} id - Model ID
   * @returns {boolean} True if model exists
   */
  static exists(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM models WHERE id = ?')
      const result = stmt.get(id)
      return result.count > 0
    } catch (error) {
      logger.error(`Failed to check model existence: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Count models
   * @returns {number} Total number of models
   */
  static count() {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM models')
      const result = stmt.get()
      return result.count
    } catch (error) {
      logger.error('Failed to count models', { error: error.message })
      throw error
    }
  }

  /**
   * Add capability to model
   * @param {string} id - Model ID
   * @param {string} capability - Capability to add
   * @returns {Object} Updated model
   */
  static addCapability(id, capability) {
    const model = this.getById(id)

    if (!model) {
      throw new Error(`Model not found: ${id}`)
    }

    const capabilities = model.capabilities || []

    if (!capabilities.includes(capability)) {
      capabilities.push(capability)
      return this.update(id, { capabilities })
    }

    return model
  }

  /**
   * Remove capability from model
   * @param {string} id - Model ID
   * @param {string} capability - Capability to remove
   * @returns {Object} Updated model
   */
  static removeCapability(id, capability) {
    const model = this.getById(id)

    if (!model) {
      throw new Error(`Model not found: ${id}`)
    }

    const capabilities = (model.capabilities || []).filter(c => c !== capability)

    return this.update(id, { capabilities })
  }
}
