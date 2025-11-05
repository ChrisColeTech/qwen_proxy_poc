/**
 * Provider Service
 * Manages CRUD operations for provider instances
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class ProviderService {
  /**
   * Create a new provider
   * @param {string} id - Provider ID (slug)
   * @param {string} name - Display name
   * @param {string} type - Provider type
   * @param {Object} options - Additional options
   * @returns {Object} Created provider
   */
  static create(id, name, type, options = {}) {
    const db = getDatabase()
    const now = Date.now()

    const {
      enabled = true,
      priority = 0,
      description = null
    } = options

    try {
      const stmt = db.prepare(`
        INSERT INTO providers (id, name, type, enabled, priority, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(id, name, type, enabled ? 1 : 0, priority, description, now, now)

      logger.info(`Provider created: ${id}`, { name, type })

      return this.getById(id)
    } catch (error) {
      logger.error(`Failed to create provider: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get provider by ID
   * @param {string} id - Provider ID
   * @returns {Object|null} Provider or null if not found
   */
  static getById(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM providers WHERE id = ?')
      const provider = stmt.get(id)

      if (provider) {
        // Convert BOOLEAN (0/1) to true/false
        provider.enabled = Boolean(provider.enabled)
      }

      return provider
    } catch (error) {
      logger.error(`Failed to get provider: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all providers by type
   * @param {string} type - Provider type
   * @returns {Array} Array of providers
   */
  static getByType(type) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM providers WHERE type = ? ORDER BY priority DESC, name ASC')
      const providers = stmt.all(type)

      return providers.map(p => ({
        ...p,
        enabled: Boolean(p.enabled)
      }))
    } catch (error) {
      logger.error(`Failed to get providers by type: ${type}`, { error: error.message })
      throw error
    }
  }

  /**
   * Get all providers with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of providers
   */
  static getAll(filters = {}) {
    const db = getDatabase()

    try {
      let query = 'SELECT * FROM providers WHERE 1=1'
      const params = []

      if (filters.type) {
        query += ' AND type = ?'
        params.push(filters.type)
      }

      if (filters.enabled !== undefined) {
        query += ' AND enabled = ?'
        params.push(filters.enabled ? 1 : 0)
      }

      if (filters.minPriority !== undefined) {
        query += ' AND priority >= ?'
        params.push(filters.minPriority)
      }

      query += ' ORDER BY priority DESC, name ASC'

      const stmt = db.prepare(query)
      const providers = stmt.all(...params)

      return providers.map(p => ({
        ...p,
        enabled: Boolean(p.enabled)
      }))
    } catch (error) {
      logger.error('Failed to get providers', { error: error.message })
      throw error
    }
  }

  /**
   * Get all enabled providers
   * @returns {Array} Array of enabled providers
   */
  static getEnabled() {
    return this.getAll({ enabled: true })
  }

  /**
   * Get providers ordered by priority
   * @returns {Array} Array of providers ordered by priority descending
   */
  static getByPriority() {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT * FROM providers WHERE enabled = 1 ORDER BY priority DESC, name ASC')
      const providers = stmt.all()

      return providers.map(p => ({
        ...p,
        enabled: Boolean(p.enabled)
      }))
    } catch (error) {
      logger.error('Failed to get providers by priority', { error: error.message })
      throw error
    }
  }

  /**
   * Update provider
   * @param {string} id - Provider ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated provider
   */
  static update(id, updates) {
    const db = getDatabase()
    const now = Date.now()

    try {
      const allowedFields = ['name', 'type', 'enabled', 'priority', 'description']
      const fields = []
      const values = []

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`)
          // Convert boolean to 0/1 for SQLite
          values.push(key === 'enabled' ? (value ? 1 : 0) : value)
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update')
      }

      fields.push('updated_at = ?')
      values.push(now, id)

      const query = `UPDATE providers SET ${fields.join(', ')} WHERE id = ?`
      const stmt = db.prepare(query)
      const result = stmt.run(...values)

      if (result.changes === 0) {
        throw new Error(`Provider not found: ${id}`)
      }

      logger.info(`Provider updated: ${id}`, { updates })

      return this.getById(id)
    } catch (error) {
      logger.error(`Failed to update provider: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Set provider enabled status
   * @param {string} id - Provider ID
   * @param {boolean} enabled - Enabled status
   * @returns {Object} Updated provider
   */
  static setEnabled(id, enabled) {
    return this.update(id, { enabled })
  }

  /**
   * Set provider priority
   * @param {string} id - Provider ID
   * @param {number} priority - Priority value
   * @returns {Object} Updated provider
   */
  static setPriority(id, priority) {
    return this.update(id, { priority })
  }

  /**
   * Delete provider
   * @param {string} id - Provider ID
   * @returns {boolean} True if deleted
   */
  static delete(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('DELETE FROM providers WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        throw new Error(`Provider not found: ${id}`)
      }

      logger.info(`Provider deleted: ${id}`)

      return true
    } catch (error) {
      logger.error(`Failed to delete provider: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Check if provider exists
   * @param {string} id - Provider ID
   * @returns {boolean} True if provider exists
   */
  static exists(id) {
    const db = getDatabase()

    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM providers WHERE id = ?')
      const result = stmt.get(id)
      return result.count > 0
    } catch (error) {
      logger.error(`Failed to check provider existence: ${id}`, { error: error.message })
      throw error
    }
  }

  /**
   * Count providers with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {number} Count of providers
   */
  static count(filters = {}) {
    const db = getDatabase()

    try {
      let query = 'SELECT COUNT(*) as count FROM providers WHERE 1=1'
      const params = []

      if (filters.type) {
        query += ' AND type = ?'
        params.push(filters.type)
      }

      if (filters.enabled !== undefined) {
        query += ' AND enabled = ?'
        params.push(filters.enabled ? 1 : 0)
      }

      const stmt = db.prepare(query)
      const result = stmt.get(...params)

      return result.count
    } catch (error) {
      logger.error('Failed to count providers', { error: error.message })
      throw error
    }
  }
}
