/**
 * Settings Service
 * Manages key-value configuration in database
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class SettingsService {
  /**
   * Get setting by key
   */
  static get(key) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key)
    return row ? row.value : null
  }

  /**
   * Set setting value
   */
  static set(key, value) {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    stmt.run(key, value)
    logger.info(`Setting updated: ${key} = ${value}`)
  }

  /**
   * Get active provider
   */
  static getActiveProvider() {
    return this.get('active_provider') || 'lm-studio'
  }

  /**
   * Set active provider
   */
  static setActiveProvider(provider) {
    this.set('active_provider', provider)
  }

  /**
   * Get all settings
   */
  static getAll() {
    const db = getDatabase()
    const stmt = db.prepare('SELECT key, value, updated_at FROM settings')
    const rows = stmt.all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  /**
   * Delete setting (reset to default)
   */
  static delete(key) {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM settings WHERE key = ?')
    stmt.run(key)
    logger.info(`Setting deleted: ${key}`)
  }

  /**
   * Check if setting exists
   */
  static exists(key) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT 1 FROM settings WHERE key = ?')
    const row = stmt.get(key)
    return !!row
  }

  /**
   * Get server settings
   */
  static getServerSettings() {
    const allSettings = this.getAll()
    return Object.entries(allSettings)
      .filter(([key]) => key.startsWith('server.'))
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {})
  }

  /**
   * Get settings by category
   */
  static getSettingsByCategory(category) {
    const allSettings = this.getAll()
    return Object.entries(allSettings)
      .filter(([key]) => key.startsWith(`${category}.`))
      .reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {})
  }

  /**
   * Update server setting
   */
  static updateServerSetting(key, value) {
    if (!key.startsWith('server.') && !key.startsWith('logging.') && !key.startsWith('system.')) {
      throw new Error('Invalid setting key. Must start with server., logging., or system.')
    }
    this.set(key, value)
  }
}
