/**
 * Settings Sync Service
 * Synchronizes settings between database and runtime configuration
 */

import { SettingsService } from '../database/services/settings-service.js'
import { logger } from '../utils/logger.js'
import { requiresRestart } from '../utils/settings-validator.js'

/**
 * Settings Sync Manager
 */
class SettingsSyncManager {
  constructor() {
    this.listeners = []
  }

  /**
   * Load settings from database into runtime config
   */
  async loadSettings() {
    try {
      const settings = SettingsService.getAll()
      logger.info('Settings loaded from database', {
        count: Object.keys(settings).length
      })
      return settings
    } catch (error) {
      logger.error('Failed to load settings from database', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Save settings to database
   */
  async saveSettings(settings) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        SettingsService.set(key, value)
      }

      logger.info('Settings saved to database', {
        count: Object.keys(settings).length
      })

      // Notify listeners
      this.notifyListeners(settings)

      return { success: true }
    } catch (error) {
      logger.error('Failed to save settings to database', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get server settings for runtime use
   */
  getServerSettings() {
    return SettingsService.getServerSettings()
  }

  /**
   * Update server setting and check if restart is required
   */
  async updateServerSetting(key, value) {
    try {
      SettingsService.updateServerSetting(key, value)

      const needsRestart = requiresRestart(key)

      logger.info('Server setting updated', {
        key,
        value,
        requiresRestart: needsRestart
      })

      // Notify listeners
      this.notifyListeners({ [key]: value })

      return {
        success: true,
        requiresRestart: needsRestart
      }
    } catch (error) {
      logger.error('Failed to update server setting', {
        key,
        value,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Register listener for settings changes
   */
  onSettingsChanged(callback) {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of settings changes
   */
  notifyListeners(settings) {
    this.listeners.forEach(callback => {
      try {
        callback(settings)
      } catch (error) {
        logger.error('Error in settings change listener', {
          error: error.message
        })
      }
    })
  }

  /**
   * Check if settings exist in database
   */
  settingsExist() {
    const settings = SettingsService.getAll()
    return Object.keys(settings).length > 0
  }

  /**
   * Initialize default settings if none exist
   */
  async initializeDefaults() {
    if (!this.settingsExist()) {
      logger.info('Initializing default settings')

      const defaults = {
        'server.port': 3001,
        'server.host': '0.0.0.0',
        'server.timeout': 120000,
        'logging.level': 'info',
        'logging.logRequests': true,
        'logging.logResponses': true,
        'system.autoStart': false,
        'system.minimizeToTray': true,
        'system.checkUpdates': true
      }

      await this.saveSettings(defaults)
      logger.info('Default settings initialized')
    }
  }

  /**
   * Merge environment variables with database settings
   * Database settings take priority
   */
  mergeWithEnv(envConfig) {
    const dbSettings = SettingsService.getAll()

    // Merge settings - database takes priority
    const merged = { ...envConfig }

    if (dbSettings['server.port']) {
      merged.server.port = parseInt(dbSettings['server.port'])
    }

    if (dbSettings['server.host']) {
      merged.server.host = dbSettings['server.host']
    }

    if (dbSettings['logging.level']) {
      merged.logging.level = dbSettings['logging.level']
    }

    if (dbSettings['logging.logRequests'] !== undefined) {
      merged.logging.logRequests = dbSettings['logging.logRequests'] === 'true' ||
                                    dbSettings['logging.logRequests'] === true
    }

    if (dbSettings['logging.logResponses'] !== undefined) {
      merged.logging.logResponses = dbSettings['logging.logResponses'] === 'true' ||
                                     dbSettings['logging.logResponses'] === true
    }

    logger.debug('Settings merged with environment config', {
      hasDbSettings: Object.keys(dbSettings).length > 0
    })

    return merged
  }
}

// Export singleton instance
export const settingsSync = new SettingsSyncManager()
