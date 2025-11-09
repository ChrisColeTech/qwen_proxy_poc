/**
 * Generic OpenAI-Compatible Provider
 * Supports any OpenAI-compatible API (OpenRouter, Together, Groq, etc.)
 */

import axios from 'axios'
import { BaseProvider } from './base-provider.js'
import { logger } from '../utils/logger.js'

export class GenericOpenAIProvider extends BaseProvider {
  constructor(id, name, config, type = 'generic-openai') {
    super(name, config, type)
    this.id = id

    // Validate required config
    if (!config.baseURL) {
      throw new Error('Generic OpenAI provider requires baseURL in config')
    }

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
    }

    // Add API key if provided
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    // Add any custom headers
    if (config.headers) {
      Object.assign(headers, config.headers)
    }

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 120000,
      headers,
    })
  }

  /**
   * Send chat completion request to OpenAI-compatible API
   */
  async chatCompletion(request, stream = false) {
    try {
      logger.debug(`${this.name} request:`, request)

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
        logger.debug(`${this.name} response:`, response.data)
        return response.data
      }
    } catch (error) {
      logger.error(`${this.name} request failed:`, error)
      throw this.transformError(error)
    }
  }

  /**
   * List available models from OpenAI-compatible API
   */
  async listModels() {
    try {
      const response = await this.client.get('/models')
      return response.data
    } catch (error) {
      logger.error(`${this.name} list models failed:`, error)
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
          message: `${this.name} connection failed: ${error.message}`,
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
   * Transform AI SDK tool definitions to OpenAI-compatible format
   *
   * AI SDK sends tools with:
   * - Missing or empty description
   * - Empty properties: {}
   * - strict: false field
   * - Missing type: "object" in parameters
   *
   * OpenAI format expects:
   * - Required description field
   * - type: "object" in parameters
   * - No strict field (unless supported by specific provider)
   */
  transformRequest(request) {
    // If no tools, return as-is
    if (!request.tools || request.tools.length === 0) {
      return request
    }

    // Transform tools to OpenAI format
    const transformedTools = request.tools.map(tool => {
      if (tool.type !== 'function') return tool

      const func = tool.function
      const params = func.parameters || {}

      // Build transformed parameters
      const transformedParams = {
        type: params.type || 'object',
        ...params
      }

      // Remove strict field (not all providers support it)
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

    logger.debug(`Transformed tools for ${this.name}:`, JSON.stringify(transformedTools, null, 2))

    return {
      ...request,
      tools: transformedTools
    }
  }

  /**
   * OpenAI-compatible providers return OpenAI format, no transformation needed
   */
  transformResponse(response) {
    return response
  }
}
