const crypto = require('crypto');
const {
  transformToOpenAIChunk,
  extractParentId,
  extractUsage,
  createFinalChunk,
  createUsageChunk,
  hasContent,
  isResponseCreatedChunk,
  isFinishedChunk
} = require('./qwen-to-openai-transformer');
const {
  hasToolCall,
  hasPartialToolCall,
  parseResponse,
  extractToolName,
  generateCallId
} = require('../parsers/xml-tool-parser');

/**
 * SSE Transformer for Qwen Streaming Responses
 *
 * Transforms Qwen SSE chunks to OpenAI streaming format.
 *
 * Based on: /docs/payloads/completion/streaming_response.md
 *
 * Qwen Streaming Format:
 * 1. First chunk: data: {"response.created": {"chat_id": "...", "parent_id": "...", "response_id": "..."}}
 * 2. Content chunks: data: {"choices": [{"delta": {"content": "text", "role": "assistant", "status": "typing"}}], "usage": {...}}
 * 3. Final chunk: data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished"}}]}
 *
 * OpenAI Streaming Format:
 * 1. Content chunks: data: {"id": "...", "object": "chat.completion.chunk", "choices": [{"delta": {"content": "text"}}]}
 * 2. Final chunk: data: {"id": "...", "choices": [{"delta": {}, "finish_reason": "stop"}]}
 * 3. Usage chunk (optional): data: {"id": "...", "choices": [], "usage": {...}}
 * 4. Done marker: data: [DONE]
 */

class SSETransformer {
  constructor(model = 'qwen3-max') {
    this.model = model;
    this.completionId = `chatcmpl-${crypto.randomUUID()}`;
    this.parentId = null;
    this.lastUsage = null;
    this.buffer = ''; // Buffer for incomplete SSE lines
    this.accumulatedContent = ''; // Buffer for complete response content
    this.finishReason = 'stop'; // Default to 'stop', changes to 'tool_calls' if tool detected
  }

  /**
   * Process raw SSE data from Qwen
   * Handles buffering of incomplete chunks
   *
   * @param {Buffer|string} chunk - Raw data from Qwen stream
   * @returns {Array<Object>} Array of OpenAI-formatted chunks to send
   */
  processChunk(chunk) {
    const output = [];

    // Add to buffer
    this.buffer += chunk.toString();

    // Split by newlines
    const lines = this.buffer.split('\n');

    // Keep last incomplete line in buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed === '') {
        continue;
      }

      // Parse SSE data line
      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.substring(6); // Remove 'data: ' prefix

        // Skip [DONE] marker
        if (dataStr === '[DONE]') {
          continue;
        }

        try {
          const data = JSON.parse(dataStr);
          const transformed = this.transformChunk(data);

          if (transformed) {
            // transformChunk can return a single chunk or an array of chunks
            if (Array.isArray(transformed)) {
              output.push(...transformed);
            } else {
              output.push(transformed);
            }
          }
        } catch (err) {
          // Skip invalid JSON
          console.error('Failed to parse SSE chunk:', err.message);
        }
      }
    }

    return output;
  }

  /**
   * Transform a single parsed Qwen chunk to OpenAI format
   *
   * @param {Object} qwenChunk - Parsed Qwen chunk
   * @returns {Object|Array|null} OpenAI chunk(s) or null if should skip
   */
  transformChunk(qwenChunk) {
    // Handle response.created chunk (first chunk)
    if (isResponseCreatedChunk(qwenChunk)) {
      // Extract parent_id for session management
      this.parentId = extractParentId(qwenChunk);

      // Don't send this chunk to client
      return null;
    }

    // Update usage if present
    if (qwenChunk.usage) {
      this.lastUsage = extractUsage(qwenChunk);
    }

    // Check if this is the finish chunk FIRST (before hasContent check)
    if (isFinishedChunk(qwenChunk)) {
      // Stream is complete - flush buffered content now
      return this._flushBufferedContent();
    }

    // Handle content chunks
    if (hasContent(qwenChunk)) {
      // Accumulate content for database persistence and buffering
      const content = qwenChunk.choices?.[0]?.delta?.content;
      if (content && typeof content === 'string') {
        this.accumulatedContent += content;
      }

      // ALWAYS BUFFER - don't stream anything until we know if it's a tool call or not
      // This prevents sending partial XML as content, then switching to tool_calls mid-stream
      // We'll flush everything when the finish chunk arrives
      return null;
    }

    // Skip chunks without content
    return null;
  }

  /**
   * Flush buffered content when stream completes
   * Analyzes accumulated content and sends either content chunks OR tool_call chunks
   *
   * @returns {Array} Array of chunks to send
   * @private
   */
  _flushBufferedContent() {
    const output = [];

    // Parse accumulated content to check for tool calls
    const parsed = parseResponse(this.accumulatedContent);

    if (parsed.hasToolCall && parsed.toolCall) {
      // TOOL CALL PATH: Send tool_calls format
      this.finishReason = 'tool_calls';

      // Generate tool call ID
      const toolCallId = parsed.toolCall.id || generateCallId();

      // 1. Send text before tool call (if any)
      if (parsed.textBeforeToolCall && parsed.textBeforeToolCall.trim()) {
        output.push({
          id: this.completionId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{
            index: 0,
            delta: {
              role: 'assistant',
              content: parsed.textBeforeToolCall
            },
            finish_reason: null
          }]
        });
      }

      // 2. Send tool call start chunk (name + empty arguments)
      output.push({
        id: this.completionId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: this.model,
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            tool_calls: [{
              index: 0,
              id: toolCallId,
              type: 'function',
              function: {
                name: parsed.toolCall.function.name,
                arguments: ''
              }
            }]
          },
          finish_reason: null
        }]
      });

      // 3. Send tool call arguments chunk
      output.push({
        id: this.completionId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: this.model,
        choices: [{
          index: 0,
          delta: {
            tool_calls: [{
              index: 0,
              function: {
                arguments: parsed.toolCall.function.arguments
              }
            }]
          },
          finish_reason: null
        }]
      });

      console.log(`[SSETransformer] Flushed buffered tool call: ${parsed.toolCall.function.name}`);
    } else {
      // CONTENT PATH: Send as regular content
      this.finishReason = 'stop';

      // Send all accumulated content as a single chunk
      output.push({
        id: this.completionId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: this.model,
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            content: this.accumulatedContent
          },
          finish_reason: null
        }]
      });

      console.log(`[SSETransformer] Flushed buffered content (${this.accumulatedContent.length} chars)`);
    }

    return output;
  }

  /**
   * Finalize the stream
   * Returns final chunks to send before closing stream
   *
   * @returns {Array<Object>} Array of final chunks (finish chunk, usage chunk, DONE marker)
   */
  finalize() {
    const output = [];

    // Send final chunk with appropriate finish_reason
    const finalChunk = createFinalChunk(this.finishReason, this.model, this.completionId);
    output.push(finalChunk);

    // Send usage chunk if we have usage info
    if (this.lastUsage) {
      const usageChunk = createUsageChunk(this.lastUsage, this.model, this.completionId);
      output.push(usageChunk);
    }

    // Send [DONE] marker
    output.push('[DONE]');

    return output;
  }

  /**
   * Get the extracted parent_id
   * Used to update session after stream completes
   *
   * @returns {string|null} Parent ID
   */
  getParentId() {
    return this.parentId;
  }

  /**
   * Get the last extracted usage data
   * Used for logging to database
   *
   * @returns {Object|null} Usage object {completion_tokens, prompt_tokens, total_tokens}
   */
  getUsage() {
    return this.lastUsage;
  }

  /**
   * Get complete response for logging
   * Creates a complete response object from accumulated data
   *
   * @returns {Object} Complete OpenAI response object with full content
   */
  getCompleteResponse() {
    // Parse the accumulated content for tool calls
    const parsed = parseResponse(this.accumulatedContent);

    const message = {
      role: 'assistant',
      // When tool_calls are present, content should ONLY be text before the tool call
      // If no text before tool call, content should be null (not the XML)
      content: parsed.hasToolCall
        ? (parsed.textBeforeToolCall || null)
        : this.accumulatedContent
    };

    // Add tool_calls if present
    if (parsed.hasToolCall && parsed.toolCall) {
      message.tool_calls = [parsed.toolCall];
    }

    return {
      id: this.completionId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.model,
      choices: [
        {
          index: 0,
          message: message,
          finish_reason: this.finishReason
        }
      ],
      usage: this.lastUsage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  /**
   * Format chunk for SSE transmission
   * Converts object to SSE data format
   *
   * @param {Object|string} chunk - Chunk to format
   * @returns {string} Formatted SSE data line
   */
  static formatSSE(chunk) {
    if (chunk === '[DONE]') {
      return 'data: [DONE]\n\n';
    }

    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  /**
   * Parse a raw SSE line to extract data
   * Static utility for testing
   *
   * @param {string} line - SSE line
   * @returns {Object|null} Parsed data or null
   */
  static parseSSELine(line) {
    const trimmed = line.trim();

    if (!trimmed.startsWith('data: ')) {
      return null;
    }

    const dataStr = trimmed.substring(6);

    if (dataStr === '[DONE]') {
      return '[DONE]';
    }

    try {
      return JSON.parse(dataStr);
    } catch (err) {
      console.error('Failed to parse SSE line:', err.message);
      return null;
    }
  }
}

/**
 * Transform a complete Qwen SSE stream to OpenAI format
 * Higher-level utility that handles the entire stream
 *
 * @param {ReadableStream} qwenStream - Qwen SSE stream
 * @param {WritableStream} outputStream - Output stream for OpenAI format
 * @param {string} model - Model name
 * @returns {Promise<string|null>} Resolves with parent_id when stream completes
 */
async function transformStream(qwenStream, outputStream, model = 'qwen3-max') {
  const transformer = new SSETransformer(model);

  return new Promise((resolve, reject) => {
    qwenStream.on('data', (chunk) => {
      try {
        const transformed = transformer.processChunk(chunk);

        for (const item of transformed) {
          outputStream.write(SSETransformer.formatSSE(item));
        }
      } catch (err) {
        reject(err);
      }
    });

    qwenStream.on('end', () => {
      try {
        // Send final chunks
        const finalChunks = transformer.finalize();

        for (const item of finalChunks) {
          outputStream.write(SSETransformer.formatSSE(item));
        }

        outputStream.end();

        // Return parent_id for session update
        resolve(transformer.getParentId());
      } catch (err) {
        reject(err);
      }
    });

    qwenStream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  SSETransformer,
  transformStream
};
