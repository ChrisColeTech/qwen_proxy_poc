/**
 * Default Settings Seeder
 * Seeds default server configuration settings
 */

import { SettingsService } from '../services/settings-service.js'
import { logger } from '../../utils/logger.js'

const DEFAULT_SETTINGS = {
  // Server settings
  'server.port': 3001,
  'server.host': '0.0.0.0',
  'server.timeout': 120000,

  // Logging settings
  'logging.level': 'info',
  'logging.logRequests': true,
  'logging.logResponses': true,

  // System settings
  'system.autoStart': false,
  'system.minimizeToTray': true,
  'system.checkUpdates': true
}

/**
 * Seed default settings
 * Only inserts settings that don't already exist
 */
export async function seedDefaultSettings() {
  logger.info('Seeding default settings...')

  let seededCount = 0
  let skippedCount = 0

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    try {
      const exists = await SettingsService.exists(key)

      if (!exists) {
        await SettingsService.set(key, value)
        seededCount++
        logger.debug(`Seeded setting: ${key} = ${value}`)
      } else {
        skippedCount++
        logger.debug(`Skipped existing setting: ${key}`)
      }
    } catch (error) {
      logger.error(`Failed to seed setting: ${key}`, { error: error.message })
    }
  }

  logger.info('Default settings seeding complete', {
    seeded: seededCount,
    skipped: skippedCount,
    total: Object.keys(DEFAULT_SETTINGS).length
  })

  return {
    seeded: seededCount,
    skipped: skippedCount,
    total: Object.keys(DEFAULT_SETTINGS).length
  }
}

export { DEFAULT_SETTINGS }
