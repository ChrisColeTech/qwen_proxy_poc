/**
 * LM Studio Provider
 * Connects to local LM Studio instance via OpenAI-compatible API
 */

import axios from 'axios'
import { BaseProvider } from './base-provider.js'
import { logger } from '../utils/logger.js'
import { PROVIDER_TYPES } from './provider-types.js'

export class LMStudioProvider extends BaseProvider {
  constructor(id, name, config) {
    super(name, config, PROVIDER_TYPES.LM_STUDIO)
    this.id = id

    // Validate required config
    if (!config.baseURL) {
      throw new Error('LM Studio provider requires baseURL in config')
    }

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Send chat completion request to LM Studio
   */
  async chatCompletion(request, stream = false) {
    try {
      logger.debug('LM Studio request:', request)

      const response = await this.client.post('/chat/completions', {
        ...request,
        stream,
      }, {
        responseType: stream ? 'stream' : 'json',
      })

      if (stream) {
        // Return stream directly for streaming responses
        return response.data
      } else {
        logger.debug('LM Studio response:', response.data)
        return response.data
      }
    } catch (error) {
      logger.error('LM Studio request failed:', error)
      throw this.transformError(error)
    }
  }

  /**
   * List available models from LM Studio
   */
  async listModels() {
    try {
      const response = await this.client.get('/models')
      return response.data
    } catch (error) {
      logger.error('LM Studio list models failed:', error)
      throw this.transformError(error)
    }
  }

  /**
   * Transform axios errors to standard format
   */
  transformError(error) {
    if (error.response) {
      // Server responded with error
      return {
        error: {
          message: error.response.data?.error?.message || error.message,
          type: 'provider_error',
          provider: this.name,
          status: error.response.status,
        },
      }
    } else if (error.request) {
      // No response received
      return {
        error: {
          message: `LM Studio connection failed: ${error.message}`,
          type: 'connection_error',
          provider: this.name,
        },
      }
    } else {
      // Request setup error
      return {
        error: {
          message: error.message,
          type: 'request_error',
          provider: this.name,
        },
      }
    }
  }

  /**
   * Transform AI SDK tool definitions to LM Studio-compatible format
   *
   * AI SDK sends tools with:
   * - Missing or empty description
   * - Empty properties: {}
   * - strict: false field
   * - Missing type: "object" in parameters
   *
   * LM Studio expects standard OpenAI format:
   * - Required description field
   * - type: "object" in parameters
   * - No strict field
   */
  transformRequest(request) {
    console.log('transformRequest called with tools:', request.tools?.length || 0)

    // If no tools, return as-is
    if (!request.tools || request.tools.length === 0) {
      return request
    }

    console.log('First tool before transform:', JSON.stringify(request.tools[0], null, 2))

    // Transform tools to LM Studio format
    const transformedTools = request.tools.map(tool => {
      if (tool.type !== 'function') return tool

      const func = tool.function
      const params = func.parameters || {}

      // Build transformed parameters
      const transformedParams = {
        type: params.type || 'object',
        ...params
      }

      // Remove strict field (LM Studio doesn't support it)
      delete transformedParams.strict

      const transformed = {
        type: 'function',
        function: {
          name: func.name,
          description: func.description || `Execute ${func.name} function`,
          parameters: transformedParams
        }
      }

      return transformed
    })

    logger.debug('Transformed tools for LM Studio:', JSON.stringify(transformedTools, null, 2))

    return {
      ...request,
      tools: transformedTools
    }
  }

  /**
   * LM Studio returns OpenAI format, no transformation needed
   */
  transformResponse(response) {
    return response
  }
}
