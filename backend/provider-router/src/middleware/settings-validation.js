/**
 * Settings Validation Middleware
 * Validates setting keys and values
 */

import { logger } from '../utils/logger.js'
import { ProviderService } from '../database/services/provider-service.js'

// Valid setting keys
const VALID_SETTINGS = [
  'server.port',
  'server.host',
  'server.timeout',
  'logging.level',
  'logging.logRequests',
  'logging.logResponses',
  'system.autoStart',
  'system.minimizeToTray',
  'system.checkUpdates',
  'active_provider'
]

// Valid log levels
const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error']

/**
 * Validate setting key
 */
export function validateSettingKey(req, res, next) {
  const { key } = req.params

  if (!key) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Setting key is required'
    })
  }

  if (!VALID_SETTINGS.includes(key)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Invalid setting key: ${key}`,
      validKeys: VALID_SETTINGS
    })
  }

  next()
}

/**
 * Validate setting value based on key
 */
export function validateSettingValue(req, res, next) {
  const { key } = req.params
  const { value } = req.body

  if (value === undefined || value === null) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Setting value is required'
    })
  }

  try {
    // Validate based on setting type
    if (key === 'server.port') {
      validatePort(value)
    } else if (key === 'server.host') {
      validateHost(value)
    } else if (key === 'server.timeout') {
      validateTimeout(value)
    } else if (key === 'logging.level') {
      validateLogLevel(value)
    } else if (key === 'active_provider') {
      validateActiveProvider(value)
    } else if (key.startsWith('logging.log') || key.startsWith('system.')) {
      validateBoolean(value, key)
    }

    next()
  } catch (error) {
    logger.warn('Setting validation failed', { key, value, error: error.message })
    return res.status(400).json({
      error: 'Validation failed',
      details: {
        key,
        value,
        message: error.message
      }
    })
  }
}

/**
 * Validate bulk settings update
 */
export function validateBulkSettings(req, res, next) {
  const { settings } = req.body

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Settings object is required'
    })
  }

  if (Object.keys(settings).length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'At least one setting is required'
    })
  }

  // Validate each setting
  const errors = []
  for (const [key, value] of Object.entries(settings)) {
    if (!VALID_SETTINGS.includes(key)) {
      errors.push({
        key,
        message: `Invalid setting key: ${key}`
      })
      continue
    }

    try {
      if (key === 'server.port') {
        validatePort(value)
      } else if (key === 'server.host') {
        validateHost(value)
      } else if (key === 'server.timeout') {
        validateTimeout(value)
      } else if (key === 'logging.level') {
        validateLogLevel(value)
      } else if (key === 'active_provider') {
        validateActiveProvider(value)
      } else if (key.startsWith('logging.log') || key.startsWith('system.')) {
        validateBoolean(value, key)
      }
    } catch (error) {
      errors.push({
        key,
        value,
        message: error.message
      })
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate port number
 */
function validatePort(port) {
  const portNum = Number(port)

  if (!Number.isInteger(portNum)) {
    throw new Error('Port must be an integer')
  }

  if (portNum < 1 || portNum > 65535) {
    throw new Error('Port must be between 1 and 65535')
  }

  // Reserved ports warning
  if (portNum < 1024) {
    logger.warn('Using privileged port', { port: portNum })
  }
}

/**
 * Validate host address
 */
function validateHost(host) {
  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error('Host must be a non-empty string')
  }

  // Allow common patterns
  const validPatterns = [
    /^0\.0\.0\.0$/,
    /^127\.0\.0\.1$/,
    /^localhost$/,
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ]

  const isValid = validPatterns.some(pattern => pattern.test(host))

  if (!isValid) {
    throw new Error('Invalid host format. Must be a valid IP address or hostname.')
  }

  // Additional IPv4 validation
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    const parts = host.split('.')
    const invalidPart = parts.find(part => parseInt(part) > 255)
    if (invalidPart !== undefined) {
      throw new Error('Invalid IP address. Each octet must be between 0-255.')
    }
  }
}

/**
 * Validate timeout value
 */
function validateTimeout(timeout) {
  const timeoutNum = Number(timeout)

  if (!Number.isInteger(timeoutNum)) {
    throw new Error('Timeout must be an integer')
  }

  if (timeoutNum < 1000) {
    throw new Error('Timeout must be at least 1000ms (1 second)')
  }

  if (timeoutNum > 600000) {
    throw new Error('Timeout must not exceed 600000ms (10 minutes)')
  }
}

/**
 * Validate log level
 */
function validateLogLevel(level) {
  if (typeof level !== 'string') {
    throw new Error('Log level must be a string')
  }

  if (!VALID_LOG_LEVELS.includes(level)) {
    throw new Error(`Invalid log level. Must be one of: ${VALID_LOG_LEVELS.join(', ')}`)
  }
}

/**
 * Validate boolean value
 */
function validateBoolean(value, key) {
  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be a boolean (true or false)`)
  }
}

/**
 * Validate active provider
 */
function validateActiveProvider(providerId) {
  if (typeof providerId !== 'string' || providerId.trim().length === 0) {
    throw new Error('Provider ID must be a non-empty string')
  }

  // Check if provider exists in database
  const provider = ProviderService.getById(providerId)

  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`)
  }

  // Check if provider is enabled
  if (!provider.enabled) {
    logger.warn('Setting active provider to disabled provider', { providerId })
  }
}

export {
  VALID_SETTINGS,
  VALID_LOG_LEVELS
}
