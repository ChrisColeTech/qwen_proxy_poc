/**
 * Settings Validator
 * Provides validation utilities for server settings
 */

import { createServer } from 'net'
import { logger } from './logger.js'

/**
 * Validate port number
 */
export function validatePort(port) {
  const portNum = parseInt(port)

  if (isNaN(portNum)) {
    return {
      valid: false,
      error: 'Port must be a number'
    }
  }

  if (portNum < 1 || portNum > 65535) {
    return {
      valid: false,
      error: 'Port must be between 1 and 65535'
    }
  }

  return { valid: true }
}

/**
 * Check if port is available
 */
export async function isPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false)
      } else {
        // Other errors also mean port is not available
        resolve(false)
      }
    })

    server.once('listening', () => {
      server.close()
      resolve(true)
    })

    server.listen(port, host)
  })
}

/**
 * Validate host address
 */
export function validateHost(host) {
  if (typeof host !== 'string' || host.trim().length === 0) {
    return {
      valid: false,
      error: 'Host must be a non-empty string'
    }
  }

  // Allow common formats
  const validPatterns = [
    /^0\.0\.0\.0$/,  // All interfaces
    /^localhost$/,   // Localhost
    /^127\.0\.0\.1$/, // Loopback
    /^(\d{1,3}\.){3}\d{1,3}$/ // IPv4 format (basic check)
  ]

  const isValid = validPatterns.some(pattern => pattern.test(host))

  if (!isValid) {
    return {
      valid: false,
      error: 'Host must be a valid IP address or "localhost"'
    }
  }

  // Additional check for valid IPv4 ranges
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const parts = host.split('.')
    const allValid = parts.every(part => {
      const num = parseInt(part)
      return num >= 0 && num <= 255
    })

    if (!allValid) {
      return {
        valid: false,
        error: 'Invalid IP address format'
      }
    }
  }

  return { valid: true }
}

/**
 * Validate log level
 */
export function validateLogLevel(level) {
  const validLevels = ['debug', 'info', 'warn', 'error']

  if (!validLevels.includes(level)) {
    return {
      valid: false,
      error: `Log level must be one of: ${validLevels.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Validate timeout value
 */
export function validateTimeout(timeout) {
  const timeoutNum = parseInt(timeout)

  if (isNaN(timeoutNum)) {
    return {
      valid: false,
      error: 'Timeout must be a number'
    }
  }

  if (timeoutNum < 1000) {
    return {
      valid: false,
      error: 'Timeout must be at least 1000ms (1 second)'
    }
  }

  if (timeoutNum > 600000) {
    return {
      valid: false,
      error: 'Timeout must be at most 600000ms (10 minutes)'
    }
  }

  return { valid: true }
}

/**
 * Validate boolean value
 */
export function validateBoolean(value) {
  if (typeof value !== 'boolean') {
    return {
      valid: false,
      error: 'Value must be a boolean (true or false)'
    }
  }

  return { valid: true }
}

/**
 * Validate setting by key
 */
export async function validateSetting(key, value) {
  // Server settings
  if (key === 'server.port') {
    const validation = validatePort(value)
    if (!validation.valid) {
      return validation
    }

    // Check if port is available (skip if it's the current port)
    // This is checked at runtime when starting server
    return { valid: true }
  }

  if (key === 'server.host') {
    return validateHost(value)
  }

  if (key === 'server.timeout') {
    return validateTimeout(value)
  }

  // Logging settings
  if (key === 'logging.level') {
    return validateLogLevel(value)
  }

  if (key === 'logging.logRequests' || key === 'logging.logResponses') {
    return validateBoolean(value)
  }

  // System settings
  if (key === 'system.autoStart' || key === 'system.minimizeToTray' || key === 'system.checkUpdates') {
    return validateBoolean(value)
  }

  // Unknown setting - allow it
  logger.warn(`Unknown setting key: ${key}`)
  return { valid: true }
}

/**
 * Validate multiple settings
 */
export async function validateSettings(settings) {
  const errors = []

  for (const [key, value] of Object.entries(settings)) {
    const validation = await validateSetting(key, value)
    if (!validation.valid) {
      errors.push(`${key}: ${validation.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if setting requires server restart
 */
export function requiresRestart(key) {
  const restartRequiredSettings = [
    'server.port',
    'server.host',
    'server.timeout'
  ]

  return restartRequiredSettings.includes(key)
}
