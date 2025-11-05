/**
 * Qwen API Type Definitions
 * Based on documentation in /docs/payloads/
 */

import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

/**
 * Create payload for new chat creation
 * @param {string} title - Chat title
 * @param {string} [model='qwen3-max'] - Model ID
 * @returns {Object} New chat payload
 */
export function createChatPayload(title, model = 'qwen3-max') {
  return {
    title,
    models: [model],
    chat_mode: 'guest',
    chat_type: 't2t',
    timestamp: Date.now() // milliseconds
  };
}

/**
 * Create Qwen message object
 * @param {Object} params - Message parameters
 * @param {string} params.fid - Message UUID
 * @param {string|null} params.parentId - Parent message UUID or null
 * @param {string} params.role - Message role ('user' or 'assistant')
 * @param {string} params.content - Message content
 * @param {string[]} params.models - Array of model IDs
 * @returns {Object} Complete Qwen message object
 */
export function createQwenMessage({ fid, parentId, role, content, models }) {
  const timestamp = Math.floor(Date.now() / 1000); // seconds

  return {
    fid,
    parentId,
    parent_id: parentId, // Qwen uses both formats
    childrenIds: [],
    role,
    content,
    user_action: 'chat',
    files: [],
    timestamp,
    models,
    chat_type: 't2t',
    sub_chat_type: 't2t',
    feature_config: {
      thinking_enabled: false,
      output_schema: 'phase'
    },
    extra: {
      meta: {
        subChatType: 't2t'
      }
    }
  };
}

/**
 * Create chat completion request payload
 * @param {Object} params - Completion parameters
 * @param {string} params.chatId - Qwen chat ID
 * @param {string|null} params.parentId - Parent message ID
 * @param {Object} params.message - Message object from createQwenMessage()
 * @param {boolean} [params.stream=true] - Enable streaming
 * @param {string} [params.model='qwen3-max'] - Model ID
 * @returns {Object} Complete completion payload
 */
export function createCompletionPayload({
  chatId,
  parentId,
  message,
  stream = true,
  model = 'qwen3-max'
}) {
  return {
    stream,
    incremental_output: true,
    chat_id: chatId,
    chat_mode: 'guest',
    model,
    parent_id: parentId,
    messages: [message],
    timestamp: Math.floor(Date.now() / 1000)
  };
}

/**
 * Parse SSE chunk from Qwen API
 * @param {string} line - SSE data line
 * @returns {Object|null} Parsed chunk or null
 */
export function parseSSEChunk(line) {
  if (!line.startsWith('data:')) {
    return null;
  }

  try {
    const jsonStr = line.substring(5).trim();
    if (!jsonStr || jsonStr === '[DONE]') {
      return null;
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    logger.warn('Failed to parse SSE chunk', { line, error: error.message });
    return null;
  }
}

/**
 * Validate parent_id format
 * @param {string|null} parentId - Parent ID to validate
 * @returns {boolean} True if valid
 */
export function validateParentId(parentId) {
  if (parentId === null) {
    return true; // null is valid for first message
  }

  // Must be a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof parentId === 'string' && uuidRegex.test(parentId);
}

/**
 * Generate conversation ID from first user message
 * @param {Array} messages - OpenAI messages array
 * @returns {string} MD5 hash as conversation ID
 */
export function generateConversationId(messages) {
  const firstUserMessage = messages.find(m => m.role === 'user');

  if (!firstUserMessage) {
    throw new Error('No user message found in conversation');
  }

  return crypto
    .createHash('md5')
    .update(firstUserMessage.content)
    .digest('hex');
}

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Extract parent_id from response.created chunk
 * @param {Object} chunk - Parsed SSE chunk
 * @returns {string|null} Parent ID or null
 */
export function extractParentId(chunk) {
  if (chunk && chunk['response.created']) {
    return chunk['response.created'].parent_id || null;
  }
  return null;
}

/**
 * Check if chunk contains content to send to client
 * @param {Object} chunk - Parsed SSE chunk
 * @returns {boolean} True if chunk has sendable content
 */
export function hasContent(chunk) {
  return !!(
    chunk &&
    chunk.choices &&
    chunk.choices[0] &&
    chunk.choices[0].delta &&
    chunk.choices[0].delta.content
  );
}

/**
 * Check if chunk indicates completion
 * @param {Object} chunk - Parsed SSE chunk
 * @returns {boolean} True if stream is finished
 */
export function isFinished(chunk) {
  return !!(
    chunk &&
    chunk.choices &&
    chunk.choices[0] &&
    chunk.choices[0].delta &&
    chunk.choices[0].delta.status === 'finished'
  );
}

/**
 * Extract usage stats from chunk
 * @param {Object} chunk - Parsed SSE chunk
 * @returns {Object|null} Usage object or null
 */
export function extractUsage(chunk) {
  if (chunk && chunk.usage) {
    return {
      prompt_tokens: chunk.usage.input_tokens || 0,
      completion_tokens: chunk.usage.output_tokens || 0,
      total_tokens: chunk.usage.total_tokens || 0
    };
  }
  return null;
}
