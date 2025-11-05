/**
 * Server Entry Point
 * Initializes and starts the provider router server
 */

import app from './server.js'
import { validateConfig, isLegacyConfigMode, applyDatabaseSettings } from './config.js'
import { initializeProviders } from './providers/index.js'
import { initDatabase, closeDatabase } from './database/connection.js'
import { runMigrations } from './database/migrations.js'
import { QwenCredentialsService } from './database/services/qwen-credentials-service.js'
import { isMigrationNeeded, migrateEnvToDatabase } from './database/migrations/migrate-env-to-db.js'
import { getConfigurationSource } from './utils/config-migrator.js'
import { logger } from './utils/logger.js'
import { settingsSync } from './services/settings-sync.js'
import config from './config.js'

/**
 * Initialize Qwen credentials from environment variables
 * Called on startup when Electron passes credentials
 */
function initializeQwenCredentials() {
  const token = process.env.QWEN_TOKEN
  const cookies = process.env.QWEN_COOKIES

  if (token && cookies) {
    try {
      // Check if credentials already exist and are valid
      if (!QwenCredentialsService.isValid()) {
        QwenCredentialsService.setCredentials(token, cookies)
        logger.info('Qwen credentials initialized from environment variables')
      } else {
        logger.debug('Qwen credentials already exist in database')
      }
    } catch (error) {
      logger.error('Failed to initialize Qwen credentials', {
        error: error.message
      })
    }
  } else {
    logger.warn('Qwen credentials not provided in environment variables', {
      hasToken: !!token,
      hasCookies: !!cookies
    })
  }
}

/**
 * Check and perform automatic migration if needed
 * Only runs if not in legacy mode and migration is needed
 */
async function checkAndMigrate() {
  try {
    // Skip migration check if in legacy mode
    if (isLegacyConfigMode()) {
      logger.info('Legacy config mode enabled - skipping automatic migration')
      return
    }

    // Check if migration is needed
    if (isMigrationNeeded()) {
      logger.info('Database is empty - attempting automatic migration from .env')
      logger.info('To skip automatic migration, set USE_LEGACY_CONFIG=true in .env')

      // Run migration
      const result = await migrateEnvToDatabase({
        createBackup: true,
        dryRun: false
      })

      if (result.success) {
        logger.info('Automatic migration completed successfully', {
          providersCreated: result.providersCreated,
          backupPath: result.backupPath
        })
      } else {
        logger.error('Automatic migration failed', {
          error: result.error
        })
        logger.warn('Falling back to legacy configuration mode')
        logger.warn('To use legacy mode permanently, set USE_LEGACY_CONFIG=true in .env')
      }
    } else {
      logger.info('Migration not needed - providers already exist in database')
    }

    // Log configuration source
    const configSource = getConfigurationSource()
    logger.info(`Using configuration source: ${configSource}`)
  } catch (error) {
    logger.error('Migration check failed', {
      error: error.message,
      stack: error.stack
    })
    logger.warn('Continuing with existing configuration')
  }
}

/**
 * Load settings from database and apply to config
 */
async function loadAndApplySettings() {
  try {
    logger.info('Loading settings from database...')

    // Initialize default settings if none exist
    await settingsSync.initializeDefaults()

    // Load settings from database
    const dbSettings = await settingsSync.loadSettings()

    // Apply settings to config
    applyDatabaseSettings(dbSettings)

    logger.info('Settings loaded and applied successfully')
  } catch (error) {
    logger.error('Failed to load settings from database', {
      error: error.message
    })
    logger.warn('Continuing with environment-based configuration')
  }
}

/**
 * Start the server
 */
async function start() {
  try {
    logger.info('Starting Qwen Provider Router...')

    // Initialize database first
    logger.info('Initializing database...')
    initDatabase()
    logger.info('Database initialized')

    // Run pending migrations (v3, v4, v5, etc.)
    logger.info('Running database migrations...')
    await runMigrations()
    logger.info('Database migrations completed')

    // Load settings from database BEFORE validating config
    await loadAndApplySettings()

    // Validate configuration (now with database settings applied)
    logger.info('Validating configuration...')
    validateConfig()
    logger.info('Configuration valid')

    // Check and perform migration if needed
    logger.info('Checking database migration status...')
    await checkAndMigrate()

    // Initialize Qwen credentials if provided
    initializeQwenCredentials()

    // Initialize providers
    await initializeProviders()

    // Sync models from providers to database
    logger.info('Syncing models from providers...')
    const { ModelSyncService } = await import('./database/services/model-sync-service.js')
    const { providerRegistry } = await import('./providers/provider-registry.js')
    const syncResult = await ModelSyncService.syncAllProviders(providerRegistry)
    if (syncResult.success) {
      logger.info('Model sync completed successfully', syncResult.totals)
    } else {
      logger.warn('Model sync completed with errors', syncResult.totals)
    }

    // Start HTTP server
    const { host, port } = config.server
    app.listen(port, host, () => {
      logger.info(`Server listening on http://${host}:${port}`)
      logger.info(`Default provider: ${config.providers.default}`)
      logger.info('Ready to accept requests')
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})

// Start the server
start()
