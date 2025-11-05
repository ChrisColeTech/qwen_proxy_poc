/**
 * Environment to Database Migration
 * Migrates provider configurations from .env file to database
 */

import { config as dotenvConfig } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { getDatabase } from '../connection.js'
import { ProviderService } from '../services/provider-service.js'
import { SettingsService } from '../services/settings-service.js'
import { seedAllProviders, hasProviders } from '../seeders/default-providers.js'
import { logger } from '../../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Create a backup of the database before migration
 * @returns {string} Backup file path
 */
function createDatabaseBackup() {
  const dbPath = join(__dirname, '../../../data/provider-router.db')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' +
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '')
  const backupDir = join(__dirname, '../../../data/backups')
  const backupPath = join(backupDir, `provider-router-backup-${timestamp}.db`)

  try {
    // Create backups directory if it doesn't exist
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }

    // Copy database file
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, backupPath)
      logger.info(`Database backup created: ${backupPath}`)
      return backupPath
    } else {
      logger.warn('No database file to backup')
      return null
    }
  } catch (error) {
    logger.error('Failed to create database backup', { error: error.message })
    throw error
  }
}

/**
 * Parse provider configurations from environment variables
 * @returns {Object} Parsed provider configurations
 */
function parseEnvConfig() {
  // Load .env file
  const envPath = join(__dirname, '../../../.env')
  dotenvConfig({ path: envPath })

  const config = {
    defaultProvider: process.env.DEFAULT_PROVIDER || 'lm-studio',
    lmStudio: {
      baseURL: process.env.LM_STUDIO_BASE_URL || 'http://192.168.0.22:1234/v1',
      defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'qwen3-max',
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
    },
    qwenProxy: {
      baseURL: process.env.QWEN_PROXY_BASE_URL || 'http://localhost:3000',
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
    },
    qwenDirect: {
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.QWEN_API_KEY || null,
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
    }
  }

  logger.info('Parsed environment configuration', {
    defaultProvider: config.defaultProvider,
    lmStudioBaseURL: config.lmStudio.baseURL,
    qwenProxyBaseURL: config.qwenProxy.baseURL,
    qwenDirectConfigured: !!config.qwenDirect.apiKey
  })

  return config
}

/**
 * Check if migration is needed
 * @returns {boolean} True if migration is needed
 */
export function isMigrationNeeded() {
  try {
    // Check if providers table exists and has data
    const db = getDatabase()

    // Check if providers table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='providers'
    `).get()

    if (!tableExists) {
      logger.warn('Providers table does not exist - migration cannot proceed')
      return false
    }

    // Check if providers table is empty
    const isEmpty = !hasProviders()

    if (isEmpty) {
      logger.info('Providers table is empty - migration needed')
      return true
    } else {
      logger.info('Providers already exist in database - migration not needed')
      return false
    }
  } catch (error) {
    logger.error('Failed to check if migration is needed', { error: error.message })
    return false
  }
}

/**
 * Set the active provider in settings
 * @param {string} defaultProvider - Default provider from .env
 */
function setActiveProvider(defaultProvider) {
  try {
    // Map provider names to provider IDs
    const providerMap = {
      'lm-studio': 'lm-studio-default',
      'qwen-proxy': 'qwen-proxy-default',
      'qwen-direct': 'qwen-direct-default'
    }

    const providerId = providerMap[defaultProvider] || 'lm-studio-default'

    // Check if provider exists
    if (ProviderService.exists(providerId)) {
      SettingsService.set('active_provider', providerId)
      logger.info(`Active provider set to: ${providerId}`)
    } else {
      logger.warn(`Provider ${providerId} does not exist, skipping active_provider setting`)
    }
  } catch (error) {
    logger.error('Failed to set active provider', { error: error.message })
    // Don't throw - this is not critical
  }
}

/**
 * Run the migration from .env to database
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} Migration result
 */
export async function migrateEnvToDatabase(options = {}) {
  const { createBackup = true, dryRun = false } = options

  logger.info('Starting environment to database migration...')

  try {
    // Check if migration is needed
    if (!isMigrationNeeded()) {
      logger.info('Migration not needed - providers already exist in database')
      return {
        success: true,
        skipped: true,
        message: 'Migration skipped - providers already exist in database'
      }
    }

    // Create backup
    let backupPath = null
    if (createBackup && !dryRun) {
      backupPath = createDatabaseBackup()
    }

    // Parse environment configuration
    const envConfig = parseEnvConfig()

    if (dryRun) {
      logger.info('Dry run - would migrate the following configurations:', envConfig)
      return {
        success: true,
        dryRun: true,
        config: envConfig,
        message: 'Dry run completed - no changes made'
      }
    }

    // Seed providers from environment configuration
    logger.info('Seeding providers from environment configuration...')
    await seedAllProviders({
      lmStudio: envConfig.lmStudio,
      qwenProxy: envConfig.qwenProxy,
      qwenDirect: envConfig.qwenDirect
    })

    // Set active provider
    logger.info('Setting active provider...')
    setActiveProvider(envConfig.defaultProvider)

    // Verify migration
    const providerCount = ProviderService.count()
    logger.info(`Migration completed - ${providerCount} providers created`)

    return {
      success: true,
      backupPath,
      providersCreated: providerCount,
      activeProvider: envConfig.defaultProvider,
      message: 'Migration completed successfully'
    }
  } catch (error) {
    logger.error('Migration failed', { error: error.message, stack: error.stack })
    return {
      success: false,
      error: error.message,
      message: 'Migration failed - see logs for details'
    }
  }
}

/**
 * Validate that the migration was successful
 * @returns {boolean} True if migration is valid
 */
export function validateMigration() {
  try {
    // Check that providers exist
    const providerCount = ProviderService.count()
    if (providerCount === 0) {
      logger.error('Validation failed: No providers in database')
      return false
    }

    // Check that at least one provider is enabled
    const enabledProviders = ProviderService.getEnabled()
    if (enabledProviders.length === 0) {
      logger.warn('Validation warning: No enabled providers')
      return true // Not critical, but log warning
    }

    // Check that active_provider is set
    const activeProvider = SettingsService.get('active_provider')
    if (!activeProvider) {
      logger.warn('Validation warning: No active_provider set')
      return true // Not critical
    }

    // Check that active provider exists
    if (!ProviderService.exists(activeProvider)) {
      logger.error(`Validation failed: Active provider ${activeProvider} does not exist`)
      return false
    }

    logger.info('Migration validation passed', {
      providerCount,
      enabledProviders: enabledProviders.length,
      activeProvider
    })

    return true
  } catch (error) {
    logger.error('Migration validation failed', { error: error.message })
    return false
  }
}

export default {
  isMigrationNeeded,
  migrateEnvToDatabase,
  validateMigration,
  createDatabaseBackup
}
