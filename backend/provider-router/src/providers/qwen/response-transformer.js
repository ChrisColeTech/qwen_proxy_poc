/**
 * Response Transformer
 * Converts Qwen API responses to OpenAI format
 */

import { parseSSEChunk, extractParentId, hasContent, isFinished, extractUsage } from './qwen-types.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

/**
 * Transform Qwen SSE chunk to OpenAI format
 * @param {string} line - Raw SSE line
 * @param {string} model - Model name
 * @returns {Object|null} OpenAI-formatted chunk or null
 */
export function transformStreamChunk(line, model) {
  try {
    const chunk = parseSSEChunk(line);

    if (!chunk) {
      return null;
    }

    // Extract parent_id from response.created chunk (for session tracking)
    const parentId = extractParentId(chunk);
    if (parentId) {
      return {
        type: 'metadata',
        parentId
      };
    }

    // Check if chunk has content
    if (!hasContent(chunk)) {
      // Check if finished
      if (isFinished(chunk)) {
        return {
          type: 'finish',
          usage: extractUsage(chunk)
        };
      }
      return null;
    }

    // Transform to OpenAI format
    const openaiChunk = {
      id: `chatcmpl-${generateId()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: {
            role: 'assistant',
            content: chunk.choices[0].delta.content
          },
          finish_reason: null
        }
      ]
    };

    return {
      type: 'content',
      chunk: openaiChunk
    };
  } catch (error) {
    logger.error('Failed to transform stream chunk', {
      error: error.message,
      line
    });
    return null;
  }
}

/**
 * Transform non-streaming Qwen response to OpenAI format
 * @param {Object} qwenResponse - Qwen API response
 * @param {string} model - Model name
 * @returns {Object} OpenAI-formatted response
 */
export function transformNonStreamResponse(qwenResponse, model) {
  try {
    const openaiResponse = {
      id: `chatcmpl-${generateId()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: qwenResponse.choices[0].message.content
          },
          finish_reason: mapFinishReason(qwenResponse.choices[0].finish_reason)
        }
      ],
      usage: qwenResponse.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    logger.debug('Transformed non-stream response', {
      model,
      contentLength: openaiResponse.choices[0].message.content.length,
      usage: openaiResponse.usage
    });

    return openaiResponse;
  } catch (error) {
    logger.error('Failed to transform non-stream response', {
      error: error.message,
      response: qwenResponse
    });
    throw error;
  }
}

/**
 * Map Qwen finish_reason to OpenAI format
 * @param {string} qwenFinishReason - Qwen finish reason
 * @returns {string} OpenAI finish reason
 */
function mapFinishReason(qwenFinishReason) {
  const mapping = {
    'finished': 'stop',
    'length': 'length',
    'stopped': 'stop'
  };

  return mapping[qwenFinishReason] || 'stop';
}

/**
 * Generate OpenAI-compatible ID
 * @returns {string} Random ID
 */
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Create OpenAI error response
 * @param {string} message - Error message
 * @param {string} [type='api_error'] - Error type
 * @returns {Object} OpenAI error format
 */
export function createErrorResponse(message, type = 'api_error') {
  return {
    error: {
      message,
      type,
      param: null,
      code: null
    }
  };
}
