/**
 * Provider Types
 * Constants and metadata for provider types
 */

/**
 * Provider type constants
 */
export const PROVIDER_TYPES = {
  LM_STUDIO: 'lm-studio',
  QWEN_PROXY: 'qwen-proxy',
  QWEN_DIRECT: 'qwen-direct'
}

/**
 * Provider type metadata
 * Defines required and optional configuration fields for each provider type
 */
export const PROVIDER_TYPE_METADATA = {
  [PROVIDER_TYPES.LM_STUDIO]: {
    name: 'LM Studio',
    description: 'Local LM Studio instance via OpenAI-compatible API',
    requiredConfig: ['baseURL'],
    optionalConfig: ['timeout', 'defaultModel'],
    capabilities: ['chat', 'streaming', 'tools', 'models'],
    configSchema: {
      baseURL: {
        type: 'string',
        description: 'Base URL for LM Studio API',
        example: 'http://192.168.0.22:1234/v1'
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 120000
      },
      defaultModel: {
        type: 'string',
        description: 'Default model name if not specified in request',
        example: 'qwen3-max'
      }
    }
  },

  [PROVIDER_TYPES.QWEN_PROXY]: {
    name: 'Qwen Proxy',
    description: 'Qwen proxy server with XML tool transformations',
    requiredConfig: ['baseURL'],
    optionalConfig: ['timeout'],
    capabilities: ['chat', 'streaming', 'tools', 'models'],
    configSchema: {
      baseURL: {
        type: 'string',
        description: 'Base URL for Qwen proxy server',
        example: 'http://localhost:3000'
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 120000
      }
    }
  },

  [PROVIDER_TYPES.QWEN_DIRECT]: {
    name: 'Qwen Direct',
    description: 'Direct connection to Qwen API',
    requiredConfig: ['token', 'cookies'],
    optionalConfig: ['baseURL', 'timeout', 'expiresAt'],
    capabilities: ['chat', 'streaming', 'sessions', 'models'],
    configSchema: {
      token: {
        type: 'string',
        description: 'Qwen API token (bx-umidtoken)',
        sensitive: true
      },
      cookies: {
        type: 'string',
        description: 'Qwen API cookies',
        sensitive: true
      },
      baseURL: {
        type: 'string',
        description: 'Qwen API base URL',
        default: 'https://chat.qwen.ai'
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 120000
      },
      expiresAt: {
        type: 'number',
        description: 'Token expiration timestamp',
        example: 1706745600000
      }
    }
  }
}

/**
 * Get provider type metadata
 * @param {string} type - Provider type
 * @returns {Object|null} Metadata or null if not found
 */
export function getProviderTypeMetadata(type) {
  return PROVIDER_TYPE_METADATA[type] || null
}

/**
 * Validate provider type
 * @param {string} type - Provider type
 * @returns {boolean} True if valid
 */
export function isValidProviderType(type) {
  return Object.values(PROVIDER_TYPES).includes(type)
}

/**
 * Get all provider types
 * @returns {Array<string>} Array of provider type strings
 */
export function getAllProviderTypes() {
  return Object.values(PROVIDER_TYPES)
}

/**
 * Validate provider configuration
 * @param {string} type - Provider type
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
 */
export function validateProviderConfig(type, config) {
  const metadata = getProviderTypeMetadata(type)

  // If no metadata (unknown type), use generic OpenAI validation
  if (!metadata) {
    return validateGenericOpenAIConfig(config)
  }

  const errors = []

  // Check required config fields
  for (const field of metadata.requiredConfig) {
    if (!config[field]) {
      errors.push(`Missing required config field: ${field}`)
    }
  }

  // Validate field types if schema is available
  for (const [field, value] of Object.entries(config)) {
    const schema = metadata.configSchema[field]
    if (!schema) continue

    // Type validation
    if (schema.type === 'number' && typeof value !== 'number') {
      errors.push(`Config field '${field}' must be a number`)
    } else if (schema.type === 'string' && typeof value !== 'string') {
      errors.push(`Config field '${field}' must be a string`)
    } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Config field '${field}' must be a boolean`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate generic OpenAI-compatible provider configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
 */
function validateGenericOpenAIConfig(config) {
  const errors = []

  // Generic OpenAI providers only require baseURL
  if (!config.baseURL) {
    errors.push('Missing required config field: baseURL')
  }

  // Validate baseURL is a string
  if (config.baseURL && typeof config.baseURL !== 'string') {
    errors.push('Config field \'baseURL\' must be a string')
  }

  // Validate optional fields
  if (config.apiKey && typeof config.apiKey !== 'string') {
    errors.push('Config field \'apiKey\' must be a string')
  }

  if (config.timeout && typeof config.timeout !== 'number') {
    errors.push('Config field \'timeout\' must be a number')
  }

  if (config.headers && typeof config.headers !== 'object') {
    errors.push('Config field \'headers\' must be an object')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get default configuration for provider type
 * @param {string} type - Provider type
 * @returns {Object} Default configuration
 */
export function getDefaultConfig(type) {
  const metadata = getProviderTypeMetadata(type)

  if (!metadata) {
    // Return generic OpenAI defaults for unknown types
    return {
      timeout: 120000
    }
  }

  const config = {}

  // Add default values from schema
  for (const [field, schema] of Object.entries(metadata.configSchema)) {
    if (schema.default !== undefined) {
      config[field] = schema.default
    }
  }

  return config
}
