/**
 * QwenClient - Low-level HTTP client for Qwen API
 * Part of Phase 5: Qwen API Client
 *
 * Provides methods to call Qwen API endpoints with proper authentication
 * Based on payload documentation in /docs/payloads/
 */

const axios = require('axios');
const config = require('../config');
const auth = require('./qwen-auth');

/**
 * Custom error for Qwen API failures
 */
class QwenAPIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'QwenAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * QwenClient class for making HTTP requests to Qwen API
 */
class QwenClient {
  constructor() {
    this.baseURL = config.qwen.baseURL;
    this.timeout = config.qwen.timeout;

    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': auth.getUserAgent(),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new QwenAPIError(
            `Qwen API error: ${error.message}`,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new QwenAPIError(
            'No response received from Qwen API',
            null,
            null
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new QwenAPIError(
            `Request setup error: ${error.message}`,
            null,
            null
          );
        }
      }
    );
  }

  /**
   * Get list of available models from Qwen API
   * Endpoint: GET https://chat.qwen.ai/api/models
   * Based on: /docs/payloads/models/request.sh and response.json
   *
   * @returns {Promise<Object>} Response with models list
   * @throws {QwenAPIError} If API call fails
   */
  async getModels() {
    try {
      const response = await this.client.get('/api/models', {
        headers: {
          'Cookie': auth.getCookies(),
        },
      });

      return response.data;
    } catch (error) {
      // Re-throw QwenAPIError as is
      if (error instanceof QwenAPIError) {
        throw error;
      }
      // Wrap other errors
      throw new QwenAPIError(
        `Failed to fetch models: ${error.message}`,
        null,
        null
      );
    }
  }

  /**
   * Create a new chat session
   * Endpoint: POST https://chat.qwen.ai/api/v2/chats/new
   * Based on: /docs/payloads/new_chat/request.sh
   *
   * @param {string} title - Chat title
   * @param {string} model - Model ID (default: qwen3-max)
   * @returns {Promise<Object>} Response with chat_id
   * @throws {QwenAPIError} If API call fails
   */
  async createChat(title = 'New Chat', model = 'qwen3-max') {
    try {
      const payload = {
        title,
        models: [model],
        chat_mode: 'guest',
        chat_type: 't2t',
        timestamp: Date.now(), // milliseconds
      };

      const response = await this.client.post('/api/v2/chats/new', payload, {
        headers: {
          'bx-umidtoken': auth.getToken(),
          'Cookie': auth.getCookies(),
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof QwenAPIError) {
        throw error;
      }
      throw new QwenAPIError(
        `Failed to create chat: ${error.message}`,
        null,
        null
      );
    }
  }

  /**
   * Send a message and get completion
   * Endpoint: POST https://chat.qwen.ai/api/v2/chat/completions
   * Based on: /docs/payloads/completion/request.sh
   *
   * @param {Object} params - Completion parameters
   * @param {string} params.chatId - Chat ID
   * @param {string} params.parentId - Parent message ID (null for first message)
   * @param {Object} params.message - Message object
   * @param {boolean} params.stream - Enable streaming (default: true)
   * @returns {Promise<Object>} Response (stream or JSON)
   * @throws {QwenAPIError} If API call fails
   */
  async sendMessage({ chatId, parentId, message, stream = true }) {
    try {
      const response = await this.client.post(
        `/api/v2/chat/completions?chat_id=${chatId}`,
        {
          stream,
          incremental_output: true,
          chat_id: chatId,
          chat_mode: 'guest',
          model: message.models[0] || 'qwen3-max',
          parent_id: parentId,
          messages: [message],
          timestamp: Math.floor(Date.now() / 1000), // seconds
        },
        {
          headers: {
            'bx-umidtoken': auth.getToken(),
            'Cookie': auth.getCookies(),
            'Content-Type': 'application/json',
          },
          responseType: stream ? 'stream' : 'json',
        }
      );

      return response;
    } catch (error) {
      if (error instanceof QwenAPIError) {
        throw error;
      }
      throw new QwenAPIError(
        `Failed to send message: ${error.message}`,
        null,
        null
      );
    }
  }

  /**
   * Get base URL
   * @returns {string} Base URL
   */
  getBaseURL() {
    return this.baseURL;
  }

  /**
   * Get timeout
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    return this.timeout;
  }
}

// Export singleton instance
const clientInstance = new QwenClient();

module.exports = clientInstance;
module.exports.QwenClient = QwenClient;
module.exports.QwenAPIError = QwenAPIError;
