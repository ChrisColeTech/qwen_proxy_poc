/**
 * Environment File Writer
 * Utility to update .env file with settings values
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to .env file
const ENV_FILE_PATH = join(__dirname, '../../.env')

// Mapping of database setting keys to .env variable names
const SETTING_TO_ENV_MAP = {
  'server.port': 'PORT',
  'server.host': 'HOST',
  'server.timeout': 'REQUEST_TIMEOUT',
  'logging.level': 'LOG_LEVEL',
  'logging.logRequests': 'LOG_REQUESTS',
  'logging.logResponses': 'LOG_RESPONSES'
}

/**
 * Read current .env file contents
 */
function readEnvFile() {
  try {
    return readFileSync(ENV_FILE_PATH, 'utf-8')
  } catch (error) {
    // If file doesn't exist, return empty string
    return ''
  }
}

/**
 * Parse .env file into key-value object
 */
function parseEnvFile(content) {
  const lines = content.split('\n')
  const env = {}

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      continue
    }

    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      env[key.trim()] = value.trim()
    }
  }

  return env
}

/**
 * Update .env file with new value
 * @param {string} settingKey - Database setting key (e.g., 'server.port')
 * @param {string} value - New value
 */
export function updateEnvFile(settingKey, value) {
  // Check if this setting should be persisted to .env
  const envKey = SETTING_TO_ENV_MAP[settingKey]
  if (!envKey) {
    // This setting doesn't map to an env variable, skip
    return
  }

  try {
    // Read current .env file
    const content = readEnvFile()
    const lines = content.split('\n')

    // Convert boolean values
    let envValue = value
    if (typeof value === 'boolean') {
      envValue = value ? 'true' : 'false'
    }

    // Find and update the line, or add new one
    let found = false
    const updatedLines = lines.map(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        return line
      }

      const match = line.match(/^([^=]+)=(.*)$/)
      if (match && match[1].trim() === envKey) {
        found = true
        return `${envKey}=${envValue}`
      }

      return line
    })

    // If not found, add to end
    if (!found) {
      updatedLines.push(`${envKey}=${envValue}`)
    }

    // Write back to file
    writeFileSync(ENV_FILE_PATH, updatedLines.join('\n'), 'utf-8')

    console.log(`[EnvWriter] Updated ${envKey}=${envValue} in .env file`)
  } catch (error) {
    console.error(`[EnvWriter] Failed to update .env file:`, error.message)
    // Don't throw - .env update is best-effort, database is source of truth
  }
}

/**
 * Bulk update multiple settings in .env file
 * @param {Object} settings - Object with setting keys and values
 */
export function bulkUpdateEnvFile(settings) {
  for (const [key, value] of Object.entries(settings)) {
    updateEnvFile(key, value)
  }
}
