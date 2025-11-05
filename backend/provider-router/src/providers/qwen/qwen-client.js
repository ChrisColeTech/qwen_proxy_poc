/**
 * Qwen HTTP Client
 * Low-level API client for Qwen endpoints
 *
 * Phase 4 of Qwen Implementation Plan
 * Implements HTTP client for Qwen API calls with authentication,
 * error handling, and support for both streaming and non-streaming responses.
 */

import axios from 'axios';
import { QwenCredentialsService } from '../../database/services/qwen-credentials-service.js';
import { createChatPayload, createCompletionPayload } from './qwen-types.js';
import { logger } from '../../utils/logger.js';
import { retryWithBackoff } from '../../utils/retry-with-backoff.js';

const QWEN_BASE_URL = 'https://chat.qwen.ai';

/**
 * QwenClient - Low-level HTTP client for Qwen API
 *
 * Provides methods to interact with Qwen's chat API:
 * - Create new chats
 * - Send messages (streaming and non-streaming)
 * - List available models
 * - Health check for credentials and connectivity
 */
class QwenClient {
  /**
   * Create new Qwen chat
   *
   * Creates a new chat session in Qwen's system. Each chat has a unique ID
   * that is used for subsequent message operations.
   *
   * @param {string} title - Chat title (displayed in chat history)
   * @param {string} [model='qwen3-max'] - Model ID to use for this chat
   * @returns {Promise<string>} Chat ID (used for sending messages)
   * @throws {Error} If API call fails or credentials are invalid
   *
   * @example
   * const chatId = await client.createChat('My Chat', 'qwen3-max');
   * console.log('Created chat:', chatId);
   */
  async createChat(title, model = 'qwen3-max') {
    return retryWithBackoff(async () => {
      try {
        const payload = createChatPayload(title, model);
        const headers = QwenCredentialsService.getHeaders();

        logger.debug('Creating Qwen chat', { title, model });

        const response = await axios.post(
          `${QWEN_BASE_URL}/api/v2/chats/new`,
          payload,
          {
            headers,
            timeout: 30000
          }
        );

        const chatId = response.data.data.id;

        logger.info('Created Qwen chat', { chatId, title });

        return chatId;
      } catch (error) {
        // Check for credential errors (don't retry these)
        if (error.response?.status === 401 || error.response?.status === 403) {
          logger.error('Qwen credentials invalid or expired');
          throw new Error('Qwen credentials invalid or expired');
        }

        // Check for chat not found
        if (error.response?.status === 404) {
          logger.error('Qwen chat not found');
          throw new Error('Qwen chat not found');
        }

        // Enhanced error messages based on status codes
        if (error.response?.status === 429) {
          logger.warn('Qwen rate limit exceeded');
          throw new Error('Qwen rate limit exceeded - please try again later');
        }

        if (error.response?.status >= 500) {
          logger.warn('Qwen server error', {
            status: error.response?.status,
            data: error.response?.data
          });
          throw new Error(`Qwen server error - service may be temporarily unavailable (${error.response?.status})`);
        }

        logger.error('Failed to create Qwen chat', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        throw error;
      }
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      shouldRetry: (error) => {
        // Don't retry on auth errors
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          return false;
        }
        // Use default retry logic for other errors
        return true;
      }
    });
  }

  /**
   * Send message to Qwen chat
   *
   * Sends a message to an existing chat and receives the assistant's response.
   * Supports both streaming (SSE) and non-streaming (JSON) modes.
   *
   * In streaming mode:
   * - Returns axios response with response.data as a readable stream
   * - Client must handle SSE parsing (data: prefix, [DONE] terminator)
   * - Each chunk contains partial response data
   *
   * In non-streaming mode:
   * - Returns complete response as JSON
   * - Contains full message content and usage statistics
   *
   * @param {Object} params - Send message parameters
   * @param {string} params.chatId - Chat ID from createChat()
   * @param {string|null} params.parentId - Parent message UUID (null for first message)
   * @param {Object} params.message - Message object from createQwenMessage()
   * @param {boolean} [params.stream=true] - Enable streaming (SSE) or return JSON
   * @param {string} [params.model='qwen3-max'] - Model ID to use
   * @returns {Promise<Object>} Axios response with stream or JSON data
   * @throws {Error} If API call fails or credentials are invalid
   *
   * @example
   * // Streaming mode
   * const response = await client.sendMessage({
   *   chatId: 'chat-123',
   *   parentId: null,
   *   message: messageObject,
   *   stream: true
   * });
   * response.data.on('data', chunk => {
   *   // Handle SSE chunks
   * });
   *
   * @example
   * // Non-streaming mode
   * const response = await client.sendMessage({
   *   chatId: 'chat-123',
   *   parentId: null,
   *   message: messageObject,
   *   stream: false
   * });
   * console.log('Full response:', response.data);
   */
  async sendMessage({ chatId, parentId, message, stream = true, model = 'qwen3-max' }) {
    return retryWithBackoff(async () => {
      try {
        const payload = createCompletionPayload({
          chatId,
          parentId,
          message,
          stream,
          model
        });

        const headers = QwenCredentialsService.getHeaders();

        logger.debug('Sending message to Qwen', {
          chatId,
          parentId,
          stream,
          model,
          contentLength: message.content.length
        });

        const response = await axios.post(
          `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
          payload,
          {
            headers,
            responseType: stream ? 'stream' : 'json',
            timeout: 30000
          }
        );

        logger.info('Message sent to Qwen', {
          chatId,
          parentId,
          status: response.status,
          streaming: stream
        });

        return response;
      } catch (error) {
        // Check for credential errors (don't retry these)
        if (error.response?.status === 401 || error.response?.status === 403) {
          logger.error('Qwen credentials invalid or expired');
          throw new Error('Qwen credentials invalid or expired');
        }

        // Check for chat not found
        if (error.response?.status === 404) {
          logger.error('Qwen chat not found', { chatId });
          throw new Error(`Qwen chat not found - chat ID may be invalid: ${chatId}`);
        }

        // Rate limit
        if (error.response?.status === 429) {
          logger.warn('Qwen rate limit exceeded');
          throw new Error('Qwen rate limit exceeded - please try again later');
        }

        // Server errors
        if (error.response?.status >= 500) {
          logger.warn('Qwen server error', {
            status: error.response?.status,
            chatId,
            data: error.response?.data
          });
          throw new Error(`Qwen server error - service may be temporarily unavailable (${error.response?.status})`);
        }

        logger.error('Failed to send message to Qwen', {
          chatId,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        throw error;
      }
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      shouldRetry: (error) => {
        // Don't retry on auth errors or not found
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        // Use default retry logic for other errors
        return true;
      }
    });
  }

  /**
   * List available models
   *
   * Fetches the list of available Qwen models that can be used for chat.
   * Each model has different capabilities, context lengths, and performance
   * characteristics.
   *
   * @returns {Promise<Array>} Array of model objects with id, name, capabilities
   * @throws {Error} If API call fails or credentials are invalid
   *
   * @example
   * const models = await client.listModels();
   * models.forEach(model => {
   *   console.log(`${model.id}: ${model.name}`);
   * });
   */
  async listModels() {
    return retryWithBackoff(async () => {
      try {
        const headers = QwenCredentialsService.getHeaders();

        logger.debug('Fetching Qwen models');

        const response = await axios.get(
          `${QWEN_BASE_URL}/api/models`,
          {
            headers,
            timeout: 30000
          }
        );

        const models = response.data.data;

        logger.info('Fetched Qwen models', {
          count: models.length
        });

        return models;
      } catch (error) {
        // Check for credential errors (don't retry these)
        if (error.response?.status === 401 || error.response?.status === 403) {
          logger.error('Qwen credentials invalid or expired');
          throw new Error('Qwen credentials invalid or expired');
        }

        // Rate limit
        if (error.response?.status === 429) {
          logger.warn('Qwen rate limit exceeded');
          throw new Error('Qwen rate limit exceeded - please try again later');
        }

        // Server errors
        if (error.response?.status >= 500) {
          logger.warn('Qwen server error', {
            status: error.response?.status,
            data: error.response?.data
          });
          throw new Error(`Qwen server error - service may be temporarily unavailable (${error.response?.status})`);
        }

        logger.error('Failed to fetch Qwen models', {
          error: error.message,
          status: error.response?.status
        });

        throw error;
      }
    }, {
      maxRetries: 2,
      initialDelay: 1000,
      shouldRetry: (error) => {
        // Don't retry on auth errors
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          return false;
        }
        // Use default retry logic for other errors
        return true;
      }
    });
  }

  /**
   * Health check - verify credentials and API connectivity
   *
   * Performs a health check to verify that:
   * 1. Credentials are present and valid
   * 2. Qwen API is reachable and responding
   * 3. Authentication is working correctly
   *
   * This is useful for:
   * - Startup verification
   * - Periodic health monitoring
   * - Pre-request validation
   * - Determining if credentials need refresh
   *
   * @returns {Promise<boolean>} True if healthy and ready, false otherwise
   *
   * @example
   * const isHealthy = await client.healthCheck();
   * if (!isHealthy) {
   *   console.log('Qwen client not ready - check credentials');
   * }
   */
  async healthCheck() {
    try {
      // First check if credentials exist and are valid
      if (!QwenCredentialsService.isValid()) {
        logger.warn('Qwen health check failed: credentials not valid');
        return false;
      }

      // Try to list models as a lightweight API health check
      // This verifies both connectivity and authentication
      await this.listModels();

      logger.info('Qwen health check passed');
      return true;
    } catch (error) {
      logger.error('Qwen health check failed', {
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  }
}

export { QwenClient };
