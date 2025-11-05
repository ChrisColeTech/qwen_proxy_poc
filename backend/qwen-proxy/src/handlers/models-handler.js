/**
 * Models Handler - /v1/models endpoint implementation
 * Part of Phase 7: Models Endpoint with Real API Integration
 *
 * CRITICAL: This handler CALLS THE REAL QWEN API
 * It does NOT use hardcoded data - the previous implementation was deleted
 * because it was hardcoded. This version makes actual API calls.
 *
 * Based on:
 * - /docs/payloads/models/request.sh (API endpoint)
 * - /docs/payloads/models/response.json (response format)
 */

const qwenClient = require('../api/qwen-client');
const config = require('../config');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, QwenAPIError, asyncHandler } = require('../middleware/error-middleware');

/**
 * Models cache
 * Models don't change often, so we cache them to reduce API calls
 */
let modelsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = config.cache?.modelsCacheDuration || 3600000; // 1 hour

/**
 * Transform Qwen model to OpenAI format
 * @param {Object} qwenModel - Model from Qwen API
 * @returns {Object} OpenAI-formatted model
 */
function transformQwenModelToOpenAI(qwenModel) {
  return {
    id: qwenModel.id,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: qwenModel.owned_by || 'qwen',
    permission: [],
    root: qwenModel.id,
    parent: null,
    // Include Qwen-specific metadata in a metadata field
    metadata: {
      name: qwenModel.name,
      description: qwenModel.info?.meta?.description,
      capabilities: qwenModel.info?.meta?.capabilities,
      chat_types: qwenModel.info?.meta?.chat_type,
      max_context_length: qwenModel.info?.meta?.max_context_length,
      max_generation_length: qwenModel.info?.meta?.max_generation_length,
      abilities: qwenModel.info?.meta?.abilities,
      is_active: qwenModel.info?.is_active,
      is_visitor_active: qwenModel.info?.is_visitor_active,
    },
  };
}

/**
 * GET /v1/models
 * List all available models
 *
 * CRITICAL: This makes a REAL API call to Qwen
 * Endpoint: GET https://chat.qwen.ai/api/models
 *
 * Returns OpenAI-compatible format:
 * {
 *   "object": "list",
 *   "data": [
 *     {
 *       "id": "qwen3-max",
 *       "object": "model",
 *       "created": 1234567890,
 *       "owned_by": "qwen"
 *     },
 *     ...
 *   ]
 * }
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const listModels = asyncHandler(async (req, res) => {
  // Check cache first
  if (modelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    logger.debug('Serving models from cache');
    return res.json(modelsCache);
  }

  try {
    // REAL API CALL - NOT HARDCODED
    logger.info('Fetching models from Qwen API');
    const response = await qwenClient.getModels();

    // Qwen returns: { "data": [ { model objects } ] }
    // We need to transform to OpenAI format
    if (!response.data || !Array.isArray(response.data)) {
      throw new QwenAPIError('Unexpected response format from Qwen API');
    }

    // Transform each model to OpenAI format
    const openAIModels = {
      object: 'list',
      data: response.data
        .filter(model => model.info?.is_active) // Only include active models
        .map(transformQwenModelToOpenAI),
    };

    // Update cache
    modelsCache = openAIModels;
    cacheTimestamp = Date.now();

    logger.info('Models fetched successfully', { count: openAIModels.data.length });
    res.json(openAIModels);
  } catch (error) {
    logger.error('Failed to fetch models from Qwen API', {
      error: error.message,
      status: error.statusCode,
      name: error.name,
    });

    throw new QwenAPIError('Failed to fetch models from Qwen API', error);
  }
});

/**
 * GET /v1/models/:model
 * Retrieve a specific model
 *
 * CRITICAL: This makes a REAL API call to Qwen
 * Endpoint: GET https://chat.qwen.ai/api/models
 *
 * Returns OpenAI-compatible format (single model):
 * {
 *   "id": "qwen3-max",
 *   "object": "model",
 *   "created": 1234567890,
 *   "owned_by": "qwen"
 * }
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const getModel = asyncHandler(async (req, res) => {
  const modelId = req.params.model;

  if (!modelId) {
    throw new ValidationError('Model ID is required', 'model');
  }

  // Check cache first
  let modelsList;
  if (modelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    logger.debug('Serving model from cache', { modelId });
    modelsList = modelsCache;
  } else {
    try {
      // REAL API CALL - NOT HARDCODED
      logger.info('Fetching models from Qwen API', { modelId });
      const response = await qwenClient.getModels();

      if (!response.data || !Array.isArray(response.data)) {
        throw new QwenAPIError('Unexpected response format from Qwen API');
      }

      // Transform and cache
      modelsList = {
        object: 'list',
        data: response.data
          .filter(model => model.info?.is_active)
          .map(transformQwenModelToOpenAI),
      };

      modelsCache = modelsList;
      cacheTimestamp = Date.now();
    } catch (error) {
      logger.error('Failed to retrieve model from Qwen API', {
        error: error.message,
        modelId
      });
      throw new QwenAPIError('Failed to retrieve model from Qwen API', error);
    }
  }

  // Find the specific model
  const model = modelsList.data.find(m => m.id === modelId);

  if (!model) {
    throw new NotFoundError(`Model '${modelId}' not found`);
  }

  logger.info('Model retrieved successfully', { modelId });
  res.json(model);
});

/**
 * Clear the models cache (useful for testing or manual refresh)
 */
function clearCache() {
  modelsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get cache status (for monitoring/debugging)
 * @returns {Object} Cache status
 */
function getCacheStatus() {
  const now = Date.now();
  const age = modelsCache ? now - cacheTimestamp : null;
  const ttl = modelsCache ? Math.max(0, CACHE_DURATION - age) : null;

  return {
    cached: !!modelsCache,
    cacheAge: age,
    cacheTTL: ttl,
    cacheExpired: age ? age >= CACHE_DURATION : null,
    modelCount: modelsCache?.data?.length || 0,
  };
}

module.exports = {
  listModels,
  getModel,
  clearCache,
  getCacheStatus,
};
