/**
 * Configuration Module
 * Loads and validates configuration from environment variables
 *
 * DEPRECATION NOTICE:
 * Provider configurations from .env are deprecated and will be removed in a future version.
 * Please migrate to database-driven configuration by running: provider-cli migrate
 *
 * Set USE_LEGACY_CONFIG=true to explicitly use .env provider configurations.
 */

import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
loadEnv({ path: join(__dirname, '../.env') })

/**
 * Check if legacy config mode is enabled
 */
export const isLegacyConfigMode = () => {
  return process.env.USE_LEGACY_CONFIG === 'true'
}

/**
 * Log deprecation warning for legacy provider config
 */
function logDeprecationWarning() {
  if (isLegacyConfigMode()) {
    console.warn('\n' + '='.repeat(80))
    console.warn('DEPRECATION WARNING: Legacy provider configuration is enabled')
    console.warn('='.repeat(80))
    console.warn('You are using USE_LEGACY_CONFIG=true which loads provider configurations')
    console.warn('from environment variables. This mode is deprecated and will be removed')
    console.warn('in a future version.')
    console.warn('')
    console.warn('Please migrate to database-driven configuration by running:')
    console.warn('  npm run cli migrate')
    console.warn('')
    console.warn('After migration, remove USE_LEGACY_CONFIG from your .env file.')
    console.warn('='.repeat(80) + '\n')
  }
}

// Log warning on module load
logDeprecationWarning()

/**
 * Application Configuration
 * NOTE: Server settings (port, host, timeout) and logging settings
 * are now loaded from database on startup. These are fallback defaults.
 */
export const config = {
  // Server Configuration (defaults - overridden by database settings)
  server: {
    port: parseInt(process.env.PORT) || 3001,  // Provider router port
    host: process.env.HOST || '0.0.0.0',
  },

  // Configuration Mode
  legacy: {
    enabled: isLegacyConfigMode(),
  },

  // Provider Configuration (DEPRECATED - use database configuration instead)
  providers: {
    default: process.env.DEFAULT_PROVIDER || 'lm-studio',

    lmStudio: {
      baseURL: process.env.LM_STUDIO_BASE_URL || 'http://192.168.0.22:1234/v1',
      defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'qwen3-max',
    },

    qwenProxy: {
      baseURL: process.env.QWEN_PROXY_BASE_URL || 'http://localhost:3000',
    },

    qwenDirect: {
      apiKey: process.env.QWEN_API_KEY || null,
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  },

  // Logging (defaults - overridden by database settings)
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logRequests: process.env.LOG_REQUESTS === 'true',
    logResponses: process.env.LOG_RESPONSES === 'true',
  },

  // Request Settings (defaults - overridden by database settings)
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000,
  },
}

/**
 * Apply settings from database to config
 * Called after settings are loaded from database
 */
export function applyDatabaseSettings(dbSettings) {
  if (dbSettings['server.port']) {
    config.server.port = parseInt(dbSettings['server.port'])
  }

  if (dbSettings['server.host']) {
    config.server.host = dbSettings['server.host']
  }

  if (dbSettings['server.timeout']) {
    config.request.timeout = parseInt(dbSettings['server.timeout'])
  }

  if (dbSettings['logging.level']) {
    config.logging.level = dbSettings['logging.level']
  }

  if (dbSettings['logging.logRequests'] !== undefined) {
    config.logging.logRequests = dbSettings['logging.logRequests'] === 'true' ||
                                  dbSettings['logging.logRequests'] === true
  }

  if (dbSettings['logging.logResponses'] !== undefined) {
    config.logging.logResponses = dbSettings['logging.logResponses'] === 'true' ||
                                   dbSettings['logging.logResponses'] === true
  }

  console.log('[Config] Database settings applied:', {
    port: config.server.port,
    host: config.server.host,
    logLevel: config.logging.level
  })
}

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = []

  // Validate port
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push(`Invalid PORT: ${config.server.port}. Must be between 1-65535`)
  }

  // Validate default provider
  const validProviders = ['lm-studio', 'qwen-proxy', 'qwen-direct']
  if (!validProviders.includes(config.providers.default)) {
    errors.push(`Invalid DEFAULT_PROVIDER: ${config.providers.default}. Must be one of: ${validProviders.join(', ')}`)
  }

  // Validate Qwen Direct API key if that provider is used
  if (config.providers.default === 'qwen-direct' && !config.providers.qwenDirect.apiKey) {
    errors.push('QWEN_API_KEY is required when DEFAULT_PROVIDER=qwen-direct')
  }

  // Validate log level
  const validLogLevels = ['debug', 'info', 'warn', 'error']
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push(`Invalid LOG_LEVEL: ${config.logging.level}. Must be one of: ${validLogLevels.join(', ')}`)
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }

  return true
}

export default config
