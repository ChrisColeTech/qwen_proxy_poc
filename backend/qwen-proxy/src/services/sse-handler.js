const { SSETransformer } = require('../transformers/sse-transformer');
const { logResponse } = require('../middleware/persistence-middleware');
const errorLogger = require('./error-logger');

/**
 * SSE Handler for Streaming Responses
 *
 * Manages Server-Sent Events streaming from Qwen API to OpenAI client.
 *
 * Based on:
 * - /docs/payloads/completion/streaming_response.md
 * - /docs/CORRECT_IMPLEMENTATION_PLAN.md Phase 6
 *
 * Responsibilities:
 * 1. Set correct SSE headers
 * 2. Stream Qwen response to client
 * 3. Transform chunks using SSETransformer
 * 4. Extract parent_id from response.created
 * 5. Update session with new parent_id
 * 6. Handle errors gracefully
 * 7. Send [DONE] marker at end
 * 8. Log response to database (Phase 4: Persistence)
 */

class SSEHandler {
  /**
   * Create SSE Handler
   *
   * @param {Object} qwenClient - Qwen API client for making requests
   * @param {Object} sessionManager - Session manager for updating sessions
   */
  constructor(qwenClient, sessionManager) {
    this.qwenClient = qwenClient;
    this.sessionManager = sessionManager;
  }

  /**
   * Stream completion from Qwen API to client
   *
   * Flow:
   * 1. Set SSE headers on response
   * 2. Call qwenClient.sendMessage with stream: true
   * 3. Create SSETransformer for this stream
   * 4. Process each chunk:
   *    - response.created: Extract parent_id, don't send
   *    - delta.content: Transform and stream to client
   *    - status: finished: Trigger finalization
   * 5. On stream end: Send final chunks + [DONE]
   * 6. Update session with parent_id
   * 7. Set conversation hash for new sessions
   * 8. Log response to database (Phase 4: Persistence)
   *
   * @param {Object} qwenMessage - Qwen format message payload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} sessionId - Conversation session ID
   * @param {string} model - Model name for response formatting
   * @param {Object|null} persistence - Persistence data from logRequest
   * @param {number} startTime - Request start time for duration calculation
   * @param {boolean} isNewSession - Whether this is a new session (for conversation hash)
   * @returns {Promise<void>}
   */
  async streamCompletion(qwenMessage, req, res, sessionId, model = 'qwen3-max', persistence = null, startTime = Date.now(), isNewSession = false) {
    // Set SSE headers
    this._setSSEHeaders(res);

    // Create transformer for this stream
    const transformer = new SSETransformer(model);

    // Track if client disconnects
    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
    });

    return new Promise(async (resolve, reject) => {
      try {
        // Call Qwen API with streaming enabled
        const response = await this.qwenClient.sendMessage(qwenMessage, { stream: true });

        // Extract the stream from response.data (axios returns response object)
        const qwenStream = response.data;

        // Process stream data
        qwenStream.on('data', (chunk) => {
          if (clientDisconnected) {
            // Client disconnected, stop processing
            qwenStream.destroy();
            return;
          }

          try {
            // Transform chunk
            const transformedChunks = transformer.processChunk(chunk);

            // Send each transformed chunk
            for (const transformedChunk of transformedChunks) {
              if (!clientDisconnected) {
                this._sendChunk(res, transformedChunk);
              }
            }
          } catch (err) {
            console.error('Error processing chunk:', err);
            // Continue streaming, don't fail entire stream for one chunk
          }
        });

        // Handle stream end
        qwenStream.on('end', async () => {
          if (clientDisconnected) {
            resolve();
            return;
          }

          try {
            // Get final chunks from transformer
            const finalChunks = transformer.finalize();

            // Send each final chunk
            for (const chunk of finalChunks) {
              this._sendChunk(res, chunk);
            }

            // Update session with parent_id
            const parentId = transformer.getParentId();
            if (parentId && sessionId) {
              this.sessionManager.updateSession(sessionId, parentId);
            }

            // Set conversation hash for new sessions (after first response)
            if (isNewSession && sessionId) {
              const completeResponse = transformer.getCompleteResponse();
              const assistantMessage = completeResponse.choices[0]?.message?.content || '';
              // Always set the hash, even if content is empty, to allow continuations
              this.sessionManager.setConversationHash(sessionId, assistantMessage);
              console.log('[SSEHandler] Set conversation hash for new session');
            }

            // LOG RESPONSE TO DATABASE (Phase 4: Persistence)
            if (persistence) {
              const duration = Date.now() - startTime;
              const usage = transformer.getUsage();
              const completeResponse = transformer.getCompleteResponse();

              await logResponse(
                persistence.requestDbId,
                sessionId,
                null,  // Qwen raw response not stored for streaming (only transformed)
                completeResponse,  // Complete OpenAI response with accumulated content
                parentId,
                usage,
                duration,
                'stop',
                null
              ).catch(err => {
                // Log but don't fail the stream
                console.error('[SSEHandler] Failed to log response:', err.message);
              });
            }

            // Close stream
            res.end();
            resolve();
          } catch (err) {
            this._handleStreamError(res, err, sessionId);
            reject(err);
          }
        });

        // Handle stream errors
        qwenStream.on('error', (err) => {
          if (!clientDisconnected) {
            this._handleStreamError(res, err, sessionId);
          }
          reject(err);
        });

      } catch (error) {
        // Handle errors in initiating stream
        this._handleStreamError(res, error, sessionId);
        reject(error);
      }
    });
  }

  /**
   * Set Server-Sent Events headers
   * Required for proper SSE streaming
   *
   * @param {Object} res - Express response object
   * @private
   */
  _setSSEHeaders(res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
  }

  /**
   * Send a chunk to client in SSE format
   *
   * Format:
   * - Regular chunks: data: {JSON}\n\n
   * - [DONE] marker: data: [DONE]\n\n
   *
   * @param {Object} res - Express response object
   * @param {Object|string} data - Data to send (object or '[DONE]')
   * @private
   */
  _sendChunk(res, data) {
    if (data === '[DONE]') {
      res.write('data: [DONE]\n\n');
    } else {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * Handle stream errors
   * Sends error in SSE format if possible
   * Otherwise closes stream
   *
   * @param {Object} res - Express response object
   * @param {Error} error - Error that occurred
   * @param {string} sessionId - Session ID for logging
   * @private
   */
  _handleStreamError(res, error, sessionId) {
    // Log error to database
    const errorId = errorLogger.logStreamError(error, sessionId, {
      endpoint: '/v1/chat/completions',
      error_type: 'stream_error'
    });

    console.error('Stream error:', {
      error: error.message,
      sessionId: sessionId,
      errorId: errorId,
      stack: error.stack
    });

    try {
      // Try to send error in SSE format
      const errorChunk = {
        error: {
          message: error.message || 'Stream error occurred',
          type: 'stream_error',
          code: error.code || 'unknown_error',
          error_id: errorId
        }
      };

      res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (writeError) {
      // If we can't write, just end the stream
      console.error('Could not write error to stream:', writeError);
      try {
        res.end();
      } catch (endError) {
        // Stream already closed
      }
    }
  }
}

module.exports = SSEHandler;
