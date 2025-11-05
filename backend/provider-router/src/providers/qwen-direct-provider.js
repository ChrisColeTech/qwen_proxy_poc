/**
 * Qwen Direct Provider
 * Connects directly to Qwen API with database-backed credentials
 * Uses existing SessionManager for conversation tracking
 */

import { BaseProvider } from './base-provider.js';
import { QwenClient } from './qwen/qwen-client.js';
import SessionManager from '../services/session-manager.js';
import { transformRequest } from './qwen/request-transformer.js';
import { transformStreamChunk, transformNonStreamResponse, createErrorResponse } from './qwen/response-transformer.js';
import { QwenCredentialsService } from '../database/services/qwen-credentials-service.js';
import { generateConversationId } from './qwen/qwen-types.js';
import { logger } from '../utils/logger.js';
import { PassThrough } from 'stream';
import { PROVIDER_TYPES } from './provider-types.js';

class QwenDirectProvider extends BaseProvider {
  constructor(id, name, config) {
    // Set defaults for qwen-direct
    const completeConfig = {
      baseURL: 'https://chat.qwen.ai',
      timeout: 120000,
      models: config.models || [],
      ...config
    };

    super(name, completeConfig, PROVIDER_TYPES.QWEN_DIRECT);
    this.id = id;

    // Validate required config
    if (!config.token || !config.cookies) {
      throw new Error('Qwen Direct provider requires token and cookies in config');
    }

    // Initialize Qwen client with credentials
    this.client = new QwenClient();

    // Use existing SessionManager
    this.sessionManager = new SessionManager({
      timeout: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 10 * 60 * 1000 // 10 minutes
    });

    // Start automatic cleanup
    this.sessionManager.startCleanup();

    logger.info('QwenDirectProvider initialized', {
      id,
      name,
      models: this.config.models.length
    });
  }

  /**
   * Chat completion
   * @param {Object} request - OpenAI-compatible chat completion request
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<Object|Stream>} Response or stream
   */
  async chatCompletion(request, stream = false) {
    const { messages, model, temperature, max_tokens } = request;
    const options = { model, stream, temperature, max_tokens };
    try {
      // Check credentials
      if (!QwenCredentialsService.isValid()) {
        throw new Error('Qwen credentials not found or expired');
      }

      const requestModel = model || 'qwen3-max';

      // Generate conversation ID from first user message
      const conversationId = generateConversationId(messages);

      logger.debug('Processing chat request', {
        conversationId,
        model: requestModel,
        stream,
        messageCount: messages.length
      });

      // Get or create session
      let session = this.sessionManager.getSession(conversationId);
      let chatId;
      let parentId;

      if (!session) {
        // Create new Qwen chat
        logger.info('Creating new Qwen chat for conversation', {
          conversationId,
          model: requestModel
        });

        chatId = await this.client.createChat(`Conversation ${conversationId.substring(0, 8)}`, requestModel);

        // Create session in SessionManager
        const firstUserMessage = messages.find(m => m.role === 'user');
        const sessionId = this.sessionManager.generateSessionId(firstUserMessage.content);

        session = this.sessionManager.createSession(sessionId, chatId);
        parentId = null;

        logger.info('Created new session', {
          conversationId,
          sessionId,
          chatId
        });
      } else {
        chatId = session.chatId;
        parentId = session.parentId;

        logger.debug('Using existing session', {
          conversationId,
          chatId,
          parentId
        });
      }

      // Transform request
      const { payload, metadata } = transformRequest(
        { messages, model: requestModel, stream, temperature, max_tokens },
        { chatId, parentId }
      );

      // Send to Qwen API
      const response = await this.client.sendMessage({
        chatId,
        parentId,
        message: payload.messages[0],
        stream: payload.stream,
        model: payload.model
      });

      if (stream) {
        return this.handleStreamResponse(response, conversationId, requestModel);
      } else {
        return this.handleNonStreamResponse(response, conversationId, requestModel);
      }
    } catch (error) {
      logger.error('Chat request failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle streaming response
   * @param {Object} axiosResponse - Axios response with stream
   * @param {string} conversationId - Conversation ID
   * @param {string} model - Model name
   * @returns {Stream} PassThrough stream
   */
  handleStreamResponse(axiosResponse, conversationId, model) {
    const stream = new PassThrough();
    let newParentId = null;

    axiosResponse.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        const result = transformStreamChunk(line, model);

        if (!result) continue;

        if (result.type === 'metadata') {
          // Store parent_id for next turn
          newParentId = result.parentId;
        } else if (result.type === 'content') {
          // Send content to client
          stream.write(`data: ${JSON.stringify(result.chunk)}\n\n`);
        } else if (result.type === 'finish') {
          // Send final chunk with usage
          const finalChunk = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop'
              }
            ]
          };

          if (result.usage) {
            finalChunk.usage = result.usage;
          }

          stream.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
          stream.write('data: [DONE]\n\n');
          stream.end();

          // Update parent_id in SessionManager for next turn
          if (newParentId) {
            const session = this.sessionManager.getSession(conversationId);
            if (session) {
              this.sessionManager.updateParentId(session.sessionId, newParentId);
            }
          }
        }
      }
    });

    axiosResponse.data.on('error', (error) => {
      logger.error('Stream error', { error: error.message });
      stream.destroy(error);
    });

    return stream;
  }

  /**
   * Handle non-streaming response
   * @param {Object} axiosResponse - Axios response
   * @param {string} conversationId - Conversation ID
   * @param {string} model - Model name
   * @returns {Promise<Object>} OpenAI-formatted response
   */
  async handleNonStreamResponse(axiosResponse, conversationId, model) {
    const qwenResponse = axiosResponse.data;

    // Extract parent_id
    const parentId = qwenResponse.parent_id || qwenResponse['response.created']?.parent_id;

    if (parentId) {
      const session = this.sessionManager.getSession(conversationId);
      if (session) {
        this.sessionManager.updateParentId(session.sessionId, parentId);
      }
    }

    // Transform to OpenAI format
    return transformNonStreamResponse(qwenResponse, model);
  }

  /**
   * List available models
   * Returns models from database configuration
   * @returns {Promise<Object>} OpenAI models list format
   */
  async listModels() {
    try {
      // Use models from database configuration
      return {
        object: 'list',
        data: this.config.models.map(modelId => ({
          id: modelId,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'qwen'
        }))
      };
    } catch (error) {
      logger.error('Failed to list models', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      // Check credentials
      if (!QwenCredentialsService.isValid()) {
        return false;
      }

      // Check API connectivity
      return await this.client.healthCheck();
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.sessionManager) {
      this.sessionManager.stopCleanup();
    }
  }
}

export default QwenDirectProvider;
