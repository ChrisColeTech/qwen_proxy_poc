/**
 * Qwen Proxy Provider
 * Connects to Qwen proxy server (handles XML tool transformations)
 */

import axios from 'axios'
import { BaseProvider } from './base-provider.js'
import { logger } from '../utils/logger.js'
import { PROVIDER_TYPES } from './provider-types.js'

export class QwenProxyProvider extends BaseProvider {
  constructor(id, name, config) {
    super(name, config, PROVIDER_TYPES.QWEN_PROXY)
    this.id = id

    // Validate required config
    if (!config.baseURL) {
      throw new Error('Qwen Proxy provider requires baseURL in config')
    }

    this.client = axios.create({
      baseURL: `${config.baseURL}/v1`,
      timeout: config.timeout || 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async chatCompletion(request, stream = false) {
    try {
      logger.debug('Qwen Proxy request:', request)

      const response = await this.client.post('/chat/completions', {
        ...request,
        stream,
      }, {
        responseType: stream ? 'stream' : 'json',
      })

      if (stream) {
        return response.data
      } else {
        return response.data
      }
    } catch (error) {
      logger.error('Qwen Proxy request failed:', error)
      throw this.transformError(error)
    }
  }

  async listModels() {
    try {
      const response = await this.client.get('/models')
      return response.data
    } catch (error) {
      logger.error('Qwen Proxy list models failed:', error)
      throw this.transformError(error)
    }
  }

  transformError(error) {
    if (error.response) {
      return {
        error: {
          message: error.response.data?.error?.message || error.message,
          type: 'provider_error',
          provider: this.name,
          status: error.response.status,
        },
      }
    } else if (error.request) {
      return {
        error: {
          message: `Qwen Proxy connection failed: ${error.message}`,
          type: 'connection_error',
          provider: this.name,
        },
      }
    } else {
      return {
        error: {
          message: error.message,
          type: 'request_error',
          provider: this.name,
        },
      }
    }
  }

  // Qwen Proxy handles transformations internally, pass through
  transformRequest(request) {
    return request
  }

  transformResponse(response) {
    return response
  }
}
