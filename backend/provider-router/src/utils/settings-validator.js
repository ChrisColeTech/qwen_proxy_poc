/**
 * Optional Settings Validation Utilities
 * Only validates settings that have specific requirements
 */

const CRITICAL_VALIDATIONS = {
  'server.port': validatePort,
  'server.host': validateHost,
  'server.timeout': validateTimeout,
  'logging.level': validateLogLevel
}

// Settings that require server restart to apply
const RESTART_REQUIRED_SETTINGS = [
  'server.port',
  'server.host',
  'logging.level'
]

/**
 * Validate setting if it has critical validation requirements
 * Returns: { valid: boolean, error?: string }
 */
export function validateIfNeeded(key, value) {
  const validator = CRITICAL_VALIDATIONS[key]

  if (!validator) {
    // No validation needed - allow any value
    return { valid: true }
  }

  try {
    validator(value)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Check if setting requires server restart to apply
 * Returns: boolean
 */
export function requiresRestart(key) {
  return RESTART_REQUIRED_SETTINGS.includes(key)
}

// Validation functions (moved from middleware)
function validatePort(port) {
  const portNum = Number(port)
  if (!Number.isInteger(portNum)) {
    throw new Error('Port must be an integer')
  }
  if (portNum < 1 || portNum > 65535) {
    throw new Error('Port must be between 1 and 65535')
  }
}

function validateHost(host) {
  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error('Host must be a non-empty string')
  }
  // Basic hostname/IP validation
  const validPatterns = [
    /^0\.0\.0\.0$/,
    /^127\.0\.0\.1$/,
    /^localhost$/,
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ]
  const isValid = validPatterns.some(pattern => pattern.test(host))
  if (!isValid) {
    throw new Error('Invalid host format')
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

function validateTimeout(timeout) {
  const timeoutNum = Number(timeout)
  if (!Number.isInteger(timeoutNum)) {
    throw new Error('Timeout must be an integer')
  }
  if (timeoutNum < 1000 || timeoutNum > 600000) {
    throw new Error('Timeout must be between 1000ms and 600000ms')
  }
}

function validateLogLevel(level) {
  const validLevels = ['debug', 'info', 'warn', 'error']
  if (!validLevels.includes(level)) {
    throw new Error(`Log level must be one of: ${validLevels.join(', ')}`)
  }
}
