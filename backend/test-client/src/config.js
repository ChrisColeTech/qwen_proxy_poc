/**
 * Configuration Module
 * Loads and validates configuration from environment variables
 */

import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
loadEnv({ path: join(__dirname, '../.env') })

/**
 * Application Configuration
 */
export const config = {
  // Proxy Configuration
  proxy: {
    baseURL: process.env.PROXY_BASE_URL || 'http://localhost:3000',
    apiKey: process.env.PROXY_API_KEY || null,
  },

  // Qwen API Configuration (for direct mode)
  qwen: {
    apiKey: process.env.QWEN_API_KEY || null,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },

  // Test Configuration
  test: {
    mode: process.env.TEST_MODE || 'proxy', // 'proxy' or 'direct'
    workingDir: process.env.WORKING_DIR || '/tmp/test-client',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
  },

  // Model Configuration (matching OpenCode)
  model: {
    name: 'qwen3-max',
    temperature: 0.55,
    topP: 1,
  },
}

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = []

  // Check test mode
  if (!['proxy', 'direct'].includes(config.test.mode)) {
    errors.push(`Invalid TEST_MODE: ${config.test.mode}. Must be 'proxy' or 'direct'`)
  }

  // Check API key for direct mode
  if (config.test.mode === 'direct' && !config.qwen.apiKey) {
    errors.push('QWEN_API_KEY is required when TEST_MODE=direct')
  }

  // Check log level
  if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
    errors.push(`Invalid LOG_LEVEL: ${config.logging.level}`)
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }

  return true
}

/**
 * Get API base URL based on mode
 */
export function getBaseURL() {
  return config.test.mode === 'proxy' ? config.proxy.baseURL : config.qwen.baseURL
}

/**
 * Get API key based on mode
 */
export function getAPIKey() {
  return config.test.mode === 'proxy' ? config.proxy.apiKey : config.qwen.apiKey
}

export default config
