/**
 * Request Transformer
 * Converts OpenAI format to Qwen API format
 */

import { createQwenMessage, createCompletionPayload, generateUUID } from './qwen-types.js';
import { logger } from '../../utils/logger.js';

/**
 * Transform OpenAI request to Qwen format
 * @param {Object} openaiRequest - OpenAI-compatible request
 * @param {Object} sessionInfo - { chatId, parentId } from SessionManager
 * @returns {Object} Qwen API payload
 */
export function transformRequest(openaiRequest, sessionInfo) {
  try {
    const { messages, model, stream, temperature, max_tokens } = openaiRequest;
    const { chatId, parentId } = sessionInfo;

    // Get the last user message (Qwen only needs the latest user message, not full history)
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');

    if (!lastUserMessage) {
      throw new Error('No user message found in request');
    }

    // Create Qwen message object
    const fid = generateUUID();
    const qwenMessage = createQwenMessage({
      fid,
      parentId,
      role: 'user',
      content: lastUserMessage.content,
      models: [model || 'qwen3-max']
    });

    // Create completion payload
    const payload = createCompletionPayload({
      chatId,
      parentId,
      message: qwenMessage,
      stream: stream !== false, // Default to streaming
      model: model || 'qwen3-max'
    });

    // Add temperature if specified
    if (temperature !== undefined) {
      payload.temperature = temperature;
    }

    // Add max_tokens if specified
    if (max_tokens !== undefined) {
      payload.max_tokens = max_tokens;
    }

    logger.debug('Transformed OpenAI request to Qwen format', {
      chatId,
      parentId,
      fid,
      model: payload.model,
      stream: payload.stream,
      contentLength: qwenMessage.content.length
    });

    return {
      payload,
      metadata: {
        fid,
        originalModel: model,
        originalStream: stream
      }
    };
  } catch (error) {
    logger.error('Failed to transform request', {
      error: error.message,
      request: openaiRequest
    });
    throw error;
  }
}

/**
 * Extract system prompt from messages
 * @param {Array} messages - OpenAI messages array
 * @returns {string|null} System prompt or null
 */
export function extractSystemPrompt(messages) {
  const systemMessage = messages.find(m => m.role === 'system');
  return systemMessage ? systemMessage.content : null;
}

/**
 * Build context from message history
 * Qwen uses parent_id chain, but we may want to include context in user message
 * @param {Array} messages - OpenAI messages array
 * @returns {string} Formatted context
 */
export function buildContextString(messages) {
  // Filter out system messages
  const contextMessages = messages.filter(m => m.role !== 'system');

  // Format as conversation history
  return contextMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');
}
