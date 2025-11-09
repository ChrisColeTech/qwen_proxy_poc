/**
 * Validation Middleware
 * Request validation for provider configuration API
 */

import { logger } from '../utils/logger.js'

/**
 * Valid provider types
 */
const VALID_PROVIDER_TYPES = ['lm-studio', 'qwen-proxy', 'qwen-direct']

/**
 * Required config keys per provider type
 */
const REQUIRED_PROVIDER_CONFIGS = {
  'lm-studio': ['baseURL'],
  'qwen-proxy': ['baseURL'],
  'qwen-direct': ['token', 'cookies']
}

/**
 * Validate provider creation/update
 */
export function validateProvider(req, res, next) {
  const { id, name, type } = req.body

  const errors = []

  // Validate ID (only for POST/create)
  if (req.method === 'POST') {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      errors.push('id is required and must be a non-empty string')
    } else if (!/^[a-z0-9-]+$/.test(id)) {
      errors.push('id must contain only lowercase letters, numbers, and hyphens')
    }
  }

  // Validate name (required for POST, optional for PUT)
  if (req.method === 'POST' || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('name is required and must be a non-empty string')
    }
  }

  // Validate type (required for POST, optional for PUT)
  if (req.method === 'POST' || type !== undefined) {
    if (!type || typeof type !== 'string') {
      errors.push('type is required and must be a string')
    }
    // Allow any provider type - no restriction
  }

  // Validate enabled (if provided)
  if (req.body.enabled !== undefined && typeof req.body.enabled !== 'boolean') {
    errors.push('enabled must be a boolean')
  }

  // Validate priority (if provided)
  if (req.body.priority !== undefined) {
    const priority = req.body.priority
    if (typeof priority !== 'number' || !Number.isInteger(priority)) {
      errors.push('priority must be an integer')
    }
  }

  // Validate description (if provided)
  if (req.body.description !== undefined && req.body.description !== null) {
    if (typeof req.body.description !== 'string') {
      errors.push('description must be a string or null')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(req, res, next) {
  const { config } = req.body

  const errors = []

  // Config must be an object
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    errors.push('config must be an object')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * Validate single config key/value
 */
export function validateConfigKeyValue(req, res, next) {
  const { value } = req.body

  const errors = []

  if (value === undefined) {
    errors.push('value is required')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * Validate model creation/update
 */
export function validateModel(req, res, next) {
  const { id, name } = req.body

  const errors = []

  // Validate ID (only for POST/create)
  if (req.method === 'POST') {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      errors.push('id is required and must be a non-empty string')
    } else if (!/^[a-z0-9-]+$/.test(id)) {
      errors.push('id must contain only lowercase letters, numbers, and hyphens')
    }
  }

  // Validate name (required for POST, optional for PUT)
  if (req.method === 'POST' || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('name is required and must be a non-empty string')
    }
  }

  // Validate description (if provided)
  if (req.body.description !== undefined && req.body.description !== null) {
    if (typeof req.body.description !== 'string') {
      errors.push('description must be a string or null')
    }
  }

  // Validate capabilities (if provided)
  if (req.body.capabilities !== undefined) {
    if (!Array.isArray(req.body.capabilities)) {
      errors.push('capabilities must be an array')
    } else {
      const invalidCapabilities = req.body.capabilities.filter(c => typeof c !== 'string')
      if (invalidCapabilities.length > 0) {
        errors.push('all capabilities must be strings')
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * Validate provider-model link
 */
export function validateProviderModelLink(req, res, next) {
  const { model_id } = req.body

  const errors = []

  if (!model_id || typeof model_id !== 'string' || model_id.trim().length === 0) {
    errors.push('model_id is required and must be a non-empty string')
  }

  // Validate is_default (if provided)
  if (req.body.is_default !== undefined && typeof req.body.is_default !== 'boolean') {
    errors.push('is_default must be a boolean')
  }

  // Validate config (if provided)
  if (req.body.config !== undefined && req.body.config !== null) {
    if (typeof req.body.config !== 'object' || Array.isArray(req.body.config)) {
      errors.push('config must be an object or null')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * Validate provider ID parameter
 */
export function validateProviderId(req, res, next) {
  const { id } = req.params

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid provider ID',
        type: 'validation_error',
        code: 'invalid_provider_id'
      }
    })
  }

  next()
}

/**
 * Validate model ID parameter
 */
export function validateModelId(req, res, next) {
  const { id, modelId } = req.params
  const targetId = modelId || id

  if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid model ID',
        type: 'validation_error',
        code: 'invalid_model_id'
      }
    })
  }

  next()
}

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const errors = []

  if (req.query.limit !== undefined) {
    const limit = parseInt(req.query.limit, 10)
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('limit must be between 1 and 1000')
    }
  }

  if (req.query.offset !== undefined) {
    const offset = parseInt(req.query.offset, 10)
    if (isNaN(offset) || offset < 0) {
      errors.push('offset must be a non-negative number')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

export default {
  validateProvider,
  validateProviderConfig,
  validateConfigKeyValue,
  validateModel,
  validateProviderModelLink,
  validateProviderId,
  validateModelId,
  validatePagination
}
