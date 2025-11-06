const crypto = require('crypto');
const { parseResponse } = require('../parsers/xml-tool-parser');

/**
 * Qwen to OpenAI Response Transformer
 *
 * Transforms Qwen API responses to OpenAI-compatible format.
 * Integrates XML tool call parser to transform Qwen XML responses to OpenAI tool_calls format.
 *
 * Based on:
 * - /docs/payloads/completion/response.json (non-streaming)
 * - /docs/payloads/completion/streaming_response.md (streaming)
 */

/**
 * Transform Qwen non-streaming response to OpenAI format
 * Integrates XML tool call parser to detect and transform tool calls
 *
 * @param {Object} qwenResponse - Qwen API response
 * @param {string|Object} options - Model name (legacy) or options object { model, enableToolCalling }
 * @returns {Object} OpenAI-compatible chat completion response
 */
function transformToOpenAICompletion(qwenResponse, options = {}) {
  // Support both old signature (qwenResponse, model) and new (qwenResponse, options)
  let model = 'qwen3-max';
  let enableToolCalling = true; // Default to enabled

  if (typeof options === 'string') {
    // Old signature: transformToOpenAICompletion(qwenResponse, 'model-name')
    model = options;
  } else if (options.model) {
    // New signature: transformToOpenAICompletion(qwenResponse, { model: 'model-name', enableToolCalling: true })
    model = options.model;
    enableToolCalling = options.enableToolCalling !== false; // Default true unless explicitly false
  }

  const data = qwenResponse.data || qwenResponse;

  // Extract content from Qwen response
  const content = data.choices?.[0]?.message?.content || '';
  const parentId = data.parent_id || null;
  const messageId = data.message_id || crypto.randomUUID();

  // Extract usage info
  const usage = extractUsage(qwenResponse);

  // Parse response for tool calls if enabled
  let message = {
    role: 'assistant',
    content: content
  };
  let finishReason = 'stop';

  if (enableToolCalling) {
    const parsed = parseResponse(content);

    if (parsed.hasToolCall && parsed.toolCall) {
      // Tool call detected - transform to OpenAI format
      // IMPORTANT: content must be empty string, not null, for AI SDK compatibility
      message.content = parsed.textBeforeToolCall || '';
      message.tool_calls = [parsed.toolCall];
      finishReason = 'tool_calls';

      console.log(`[QwenToOpenAI] Tool call detected in non-streaming response: ${parsed.toolCall.function.name}`);
    }
  }

  return {
    id: `chatcmpl-${messageId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: message,
        finish_reason: finishReason
      }
    ],
    usage: usage,
    // Store parent_id for session management
    _qwen_metadata: {
      parent_id: parentId,
      message_id: messageId
    }
  };
}

/**
 * Transform Qwen streaming chunk to OpenAI streaming format
 *
 * Qwen sends: {"choices": [{"delta": {"content": "text", "role": "assistant", "status": "typing"}}]}
 * OpenAI expects: {"choices": [{"delta": {"content": "text", "role": "assistant"}}]}
 *
 * @param {Object} qwenChunk - Qwen SSE chunk
 * @param {string} model - Model name
 * @param {string} completionId - Completion ID for this stream
 * @returns {Object} OpenAI-compatible streaming chunk
 */
function transformToOpenAIChunk(qwenChunk, model = 'qwen3-max', completionId = null) {
  const id = completionId || `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);

  // Handle different chunk types
  if (qwenChunk.choices && qwenChunk.choices[0]) {
    const delta = qwenChunk.choices[0].delta;

    // Check if this is a finish chunk
    const isFinished = delta.status === 'finished';

    return {
      id: id,
      object: 'chat.completion.chunk',
      created: created,
      model: model,
      choices: [
        {
          index: 0,
          delta: {
            role: delta.role || 'assistant',
            content: delta.content || ''
          },
          finish_reason: isFinished ? 'stop' : null
        }
      ]
    };
  }

  // Empty chunk
  return {
    id: id,
    object: 'chat.completion.chunk',
    created: created,
    model: model,
    choices: []
  };
}

/**
 * Extract parent_id from Qwen response
 * Used to update session for next message in conversation
 *
 * For streaming: Extract from response.created chunk
 * For non-streaming: Extract from response.data.parent_id
 *
 * @param {Object} qwenResponse - Qwen response
 * @returns {string|null} Parent ID or null
 */
function extractParentId(qwenResponse) {
  // Non-streaming response
  if (qwenResponse.data && qwenResponse.data.parent_id) {
    return qwenResponse.data.parent_id;
  }

  // Streaming response.created chunk
  if (qwenResponse['response.created']) {
    return qwenResponse['response.created'].parent_id;
  }

  return null;
}

/**
 * Extract usage information from Qwen response
 * Transforms Qwen usage format to OpenAI format
 *
 * Qwen format (streaming - in each chunk):
 * {
 *   input_tokens: 33,
 *   output_tokens: 838,
 *   total_tokens: 871,
 *   prompt_tokens_details: {...}
 * }
 *
 * Qwen format (non-streaming): Same as streaming (parsed from SSE)
 *
 * OpenAI format:
 * {
 *   prompt_tokens: 33,
 *   completion_tokens: 838,
 *   total_tokens: 871
 * }
 *
 * @param {Object} qwenResponse - Qwen response (may be chunk or full response)
 * @returns {Object} OpenAI-compatible usage object
 */
function extractUsage(qwenResponse) {
  // Try multiple locations where usage might be
  // 1. Direct on response (streaming chunks have this)
  // 2. In response.data (non-streaming, parsed from SSE)
  // 3. In response.data.usage (our parsed format)
  // 4. In choices[0] for streaming chunks
  let usage = qwenResponse.usage ||
              qwenResponse.data?.usage ||
              qwenResponse.choices?.[0]?.usage ||
              {};

  return {
    prompt_tokens: usage.input_tokens || 0,
    completion_tokens: usage.output_tokens || 0,
    total_tokens: usage.total_tokens || (usage.input_tokens || 0) + (usage.output_tokens || 0)
  };
}

/**
 * Create final chunk for streaming completion
 * This is sent after all content chunks to indicate completion
 *
 * @param {string} finishReason - Reason for completion (default: "stop")
 * @param {string} model - Model name
 * @param {string} completionId - Completion ID
 * @returns {Object} Final OpenAI streaming chunk
 */
function createFinalChunk(finishReason = 'stop', model = 'qwen3-max', completionId = null) {
  const id = completionId || `chatcmpl-${crypto.randomUUID()}`;

  return {
    id: id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: finishReason
      }
    ]
  };
}

/**
 * Create usage chunk for streaming completion
 * OpenAI sends usage info as a separate chunk after finish
 *
 * @param {Object} usage - OpenAI format usage object
 * @param {string} model - Model name
 * @param {string} completionId - Completion ID
 * @returns {Object} Usage chunk
 */
function createUsageChunk(usage, model = 'qwen3-max', completionId = null) {
  const id = completionId || `chatcmpl-${crypto.randomUUID()}`;

  return {
    id: id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [],
    usage: usage
  };
}

/**
 * Check if a Qwen chunk has content to send
 * Used to filter out empty chunks or metadata-only chunks
 *
 * @param {Object} qwenChunk - Qwen SSE chunk
 * @returns {boolean} True if chunk has content
 */
function hasContent(qwenChunk) {
  if (!qwenChunk.choices || qwenChunk.choices.length === 0) {
    return false;
  }

  const delta = qwenChunk.choices[0].delta;
  if (!delta) {
    return false;
  }

  // Has content if there's text or if it's a finish chunk
  return (delta.content && delta.content.length > 0) || delta.status === 'finished';
}

/**
 * Check if a chunk is the response.created metadata chunk
 * This chunk contains parent_id but should not be sent to client
 *
 * @param {Object} chunk - Parsed SSE chunk
 * @returns {boolean} True if this is response.created chunk
 */
function isResponseCreatedChunk(chunk) {
  return chunk && 'response.created' in chunk;
}

/**
 * Check if a chunk indicates the stream is finished
 *
 * @param {Object} chunk - Qwen chunk
 * @returns {boolean} True if stream is finished
 */
function isFinishedChunk(chunk) {
  if (!chunk.choices || chunk.choices.length === 0) {
    return false;
  }

  const delta = chunk.choices[0].delta;
  return delta && delta.status === 'finished';
}

module.exports = {
  transformToOpenAICompletion,
  transformToOpenAIChunk,
  extractParentId,
  extractUsage,
  createFinalChunk,
  createUsageChunk,
  hasContent,
  isResponseCreatedChunk,
  isFinishedChunk
};
