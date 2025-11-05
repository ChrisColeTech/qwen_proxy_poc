/**
 * Transformers Module
 *
 * Exports all transformer functions for OpenAI <-> Qwen conversion
 *
 * Phase 3: Core Transformers for Request/Response Conversion
 */

// OpenAI to Qwen Transformers
const {
  extractLastMessage,
  createQwenMessage,
  transformToQwenRequest,
  transformToQwenRequestNonStreaming,
  validateQwenMessage
} = require('./openai-to-qwen-transformer');

// Qwen to OpenAI Transformers
const {
  transformToOpenAICompletion,
  transformToOpenAIChunk,
  extractParentId,
  extractUsage,
  createFinalChunk,
  createUsageChunk,
  hasContent,
  isResponseCreatedChunk,
  isFinishedChunk
} = require('./qwen-to-openai-transformer');

// SSE Stream Transformers
const {
  SSETransformer,
  transformStream
} = require('./sse-transformer');

module.exports = {
  // Request transformation (OpenAI -> Qwen)
  extractLastMessage,
  createQwenMessage,
  transformToQwenRequest,
  transformToQwenRequestNonStreaming,
  validateQwenMessage,

  // Response transformation (Qwen -> OpenAI)
  transformToOpenAICompletion,
  transformToOpenAIChunk,
  extractParentId,
  extractUsage,
  createFinalChunk,
  createUsageChunk,
  hasContent,
  isResponseCreatedChunk,
  isFinishedChunk,

  // SSE streaming
  SSETransformer,
  transformStream
};
