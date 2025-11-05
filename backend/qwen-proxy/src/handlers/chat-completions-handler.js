/**
 * Chat Completions Handler
 *
 * Phase 8: Main endpoint that orchestrates all previous phases
 *
 * This is the ORCHESTRATION layer that brings together:
 * - Phase 1: Configuration
 * - Phase 2: Authentication (via QwenClient)
 * - Phase 3: Request/Response Transformers
 * - Phase 4: Session Management
 * - Phase 5: QwenClient
 * - Phase 6: SSE Handler
 *
 * Flow:
 * 1. Receive OpenAI request
 * 2. Extract and validate request
 * 3. Generate session ID from first user message
 * 4. Get or create session (parent_id chain)
 * 5. Transform OpenAI -> Qwen format
 * 6. Route to streaming or non-streaming
 * 7. Update session with new parent_id
 * 8. Transform Qwen -> OpenAI format
 * 9. Return response
 *
 * CRITICAL REQUIREMENTS:
 * - New conversation (no assistant messages): Session ID = UUID (always unique)
 * - Continuation (has assistant messages): Session ID = MD5(first_user_msg + first_assistant_msg)
 * - First message: parent_id = null
 * - Follow-ups: parent_id from session
 * - Extract ONLY last user message (Qwen maintains context)
 * - Update session after every response
 */

const crypto = require('crypto');
const config = require('../config');
const QwenClient = require('../services/qwen-client');
const SessionManager = require('../services/session-manager');
const SSEHandler = require('../services/sse-handler');
const transformers = require('../transformers');
const { logRequest, logResponse } = require('../middleware/persistence-middleware');
const errorLogger = require('../services/error-logger');

// Singleton instances
const qwenClient = new QwenClient();
const sessionManager = new SessionManager(config.session);
const sseHandler = new SSEHandler(qwenClient, sessionManager);

// Start session cleanup
sessionManager.startCleanup();

/**
 * Validate chat completion request
 *
 * @param {Object} body - Request body
 * @throws {Error} If validation fails
 */
function validateChatCompletionRequest(body) {
  if (!body.messages || !Array.isArray(body.messages)) {
    const error = new Error('messages must be an array');
    error.statusCode = 400;
    error.code = 'invalid_request';
    throw error;
  }

  if (body.messages.length === 0) {
    const error = new Error('messages array cannot be empty');
    error.statusCode = 400;
    error.code = 'invalid_request';
    throw error;
  }

  // Validate at least one user message exists
  const hasUserMessage = body.messages.some(m => m.role === 'user');
  if (!hasUserMessage) {
    const error = new Error('messages must contain at least one user message');
    error.statusCode = 400;
    error.code = 'invalid_request';
    throw error;
  }

  // Validate each message has required fields
  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];

    if (!msg.role) {
      const error = new Error(`messages[${i}] is missing required field: role`);
      error.statusCode = 400;
      error.code = 'invalid_request';
      throw error;
    }

    // Tool messages have different validation rules
    if (msg.role === 'tool') {
      // Tool messages must have tool_call_id
      if (!msg.tool_call_id) {
        const error = new Error(`messages[${i}] with role 'tool' is missing required field: tool_call_id`);
        error.statusCode = 400;
        error.code = 'invalid_request';
        throw error;
      }
      // Tool messages must have content field (but can be empty string)
      if (msg.content === undefined || msg.content === null) {
        const error = new Error(`messages[${i}] with role 'tool' is missing required field: content`);
        error.statusCode = 400;
        error.code = 'invalid_request';
        throw error;
      }
    } else {
      // Regular messages (system, user, assistant)
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        const error = new Error(`messages[${i}].role must be 'system', 'user', 'assistant', or 'tool'`);
        error.statusCode = 400;
        error.code = 'invalid_request';
        throw error;
      }

      // Content validation: assistant messages with tool_calls can have null content
      // All other messages must have content
      if (!msg.content && !(msg.role === 'assistant' && msg.tool_calls)) {
        const error = new Error(`messages[${i}] is missing required field: content`);
        error.statusCode = 400;
        error.code = 'invalid_request';
        throw error;
      }
    }
  }

  return true;
}

/**
 * Extract first user message content for session ID generation
 *
 * @param {Array} messages - OpenAI messages array
 * @returns {string} First user message content
 */
function extractFirstUserMessage(messages) {
  const firstUserMessage = messages.find(m => m.role === 'user');

  if (!firstUserMessage) {
    const error = new Error('No user message found in conversation');
    error.statusCode = 400;
    error.code = 'invalid_request';
    throw error;
  }

  // Handle both string content and array content (for multimodal)
  let content = firstUserMessage.content;

  if (Array.isArray(content)) {
    // For multimodal messages, extract text content
    const textContent = content.find(item => item.type === 'text');
    content = textContent ? textContent.text : '';
  }

  // Ensure content is a non-empty string
  if (!content || typeof content !== 'string' || content.trim() === '') {
    const error = new Error('First user message must have non-empty text content');
    error.statusCode = 400;
    error.code = 'invalid_request';
    throw error;
  }

  return content.trim();
}

/**
 * Main chat completions handler
 * Handles both streaming and non-streaming requests
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function chatCompletions(req, res, next) {
  try {
    // 1. Extract and validate OpenAI request
    const { messages, model, stream, temperature, max_tokens, tools, ...options } = req.body;

    // Validate request
    validateChatCompletionRequest(req.body);

    // Log request (debug mode)
    if (config.logging.level === 'debug') {
      console.log('[ChatCompletions] Request received:', {
        messageCount: messages.length,
        model: model || 'qwen3-max',
        stream: stream || false
      });
    }

    // 2. Determine session ID based on conversation state
    let sessionId;
    let session = null;
    let isNewSession = false;

    // Check if this is a new conversation or continuation
    // New conversation = no assistant messages yet
    // Continuation = has assistant messages (conversation history)
    const hasAssistantMessage = messages.some(m => m.role === 'assistant');

    if (!hasAssistantMessage) {
      // NEW CONVERSATION - No assistant messages, create unique session
      sessionId = crypto.randomUUID();

      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] New conversation detected (no assistant messages), session ID:', sessionId);
      }

      // Extract first user message to store with session
      const firstUserMessage = extractFirstUserMessage(messages);

      // Create new Qwen chat
      if (config.logging.level === 'info' || config.logging.level === 'debug') {
        console.log('[ChatCompletions] Creating new Qwen chat for session:', sessionId);
      }

      const chatId = await qwenClient.withRetry(
        async () => await qwenClient.createNewChat('API Chat', [model || 'qwen3-max'])
      );

      // Create session with chat ID and first user message
      session = sessionManager.createSession(sessionId, chatId, firstUserMessage);
      isNewSession = true;

      if (config.logging.level === 'info' || config.logging.level === 'debug') {
        console.log('[ChatCompletions] New session created:', {
          sessionId,
          chatId,
          parent_id: session.parent_id
        });
      }
    } else {
      // CONTINUATION - Hash first user+assistant exchange to find session
      const firstUserMessage = extractFirstUserMessage(messages);
      const firstAssistantMsg = messages.find(m => m.role === 'assistant');

      // Generate conversation hash from first exchange (user + assistant)
      // Handle assistant messages with tool_calls that may have null/undefined content
      const assistantContent = firstAssistantMsg.content || '';
      const conversationKey = firstUserMessage + assistantContent;
      const conversationHash = sessionManager.generateSessionId(conversationKey);

      console.log('[ChatCompletions] ===== CONTINUATION DEBUG =====');
      console.log('[ChatCompletions] First user message:', firstUserMessage.substring(0, 100));
      console.log('[ChatCompletions] First assistant message:', assistantContent.substring(0, 100));
      console.log('[ChatCompletions] Looking for conversation hash:', conversationHash);
      console.log('[ChatCompletions] =====================================');

      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Continuation detected (has assistant messages), conversation hash:', conversationHash);
      }

      // 3. Find existing session by conversation hash
      console.log('[ChatCompletions] Calling findSessionByConversationHash...');
      session = sessionManager.findSessionByConversationHash(conversationHash);
      console.log('[ChatCompletions] findSessionByConversationHash returned:', session ? 'found' : 'null');

      if (!session) {
        // FALLBACK 1: Try matching by first user message only (OpenCode bug workaround)
        // OpenCode sometimes sends truncated assistant messages, so hash doesn't match
        console.warn('[ChatCompletions] Session not found for hash:', conversationHash);
        console.warn('[ChatCompletions] Trying fallback: match by first user message only');

        const userMessageHash = sessionManager.generateSessionId(firstUserMessage);
        const allSessions = sessionManager.getAllSessions();

        // Find session with matching first user message
        for (const [sid, sess] of Object.entries(allSessions)) {
          if (sess.first_user_message === firstUserMessage) {
            console.warn('[ChatCompletions] Found session by first user message:', sid);
            session = sess;
            sessionId = sid;
            break;
          }
        }
      }

      if (!session) {
        // FALLBACK 2: Create new session (likely server restart)
        console.warn('[ChatCompletions] No matching session found, creating new session as fallback');

        sessionId = crypto.randomUUID();

        // Create new Qwen chat
        const chatId = await qwenClient.withRetry(
          async () => await qwenClient.createNewChat('API Chat (Recovered)', [model || 'qwen3-max'])
        );

        // Create session with chat ID and first user message
        session = sessionManager.createSession(sessionId, chatId, firstUserMessage);
        isNewSession = true;

        console.warn('[ChatCompletions] New recovery session created:', {
          sessionId,
          chatId,
          parent_id: session.parent_id,
          reason: 'session_not_found_fallback'
        });
      } else {
        // Extract the actual session ID from the found session
        sessionId = session.sessionId;
        console.log('[ChatCompletions] Extracted sessionId:', sessionId);
        console.log('[ChatCompletions] Session object:', JSON.stringify(session));
      }

      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Existing session found:', {
          sessionId,
          chatId: session.chatId,
          parent_id: session.parent_id,
          messageCount: session.messageCount
        });
      }
    }

    console.log('[ChatCompletions] About to extract parentId and chatId...');
    const parentId = session.parent_id; // null for first message, UUID for follow-ups
    const chatId = session.chatId;
    console.log('[ChatCompletions] Extracted:', { parentId, chatId });

    // 4. Transform OpenAI request to Qwen format
    // The transformer handles extracting the last message internally
    const qwenPayload = transformers.transformToQwenRequest(
      { messages, model: model || 'qwen3-max', tools }, // OpenAI request format with tools
      { chatId, parentId },                              // Session object
      stream !== false                                   // Stream flag (default true)
    );

    if (config.logging.level === 'debug') {
      console.log('[ChatCompletions] Qwen payload created:', {
        chatId: qwenPayload.chat_id,
        parentId: qwenPayload.parent_id,
        stream: qwenPayload.stream,
        messageCount: qwenPayload.messages.length
      });
    }

    // LOG REQUEST TO DATABASE (Phase 4: Persistence)
    const persistence = await logRequest(
      sessionId,
      req.body,      // OpenAI request
      qwenPayload,   // Qwen request
      model || 'qwen3-max',
      stream === true
    );

    // Track start time for duration calculation
    const startTime = Date.now();

    // 5. Route to streaming or non-streaming
    if (stream === true) {
      // STREAMING MODE
      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Streaming mode');
      }

      // Use SSEHandler from Phase 6
      await sseHandler.streamCompletion(
        qwenPayload,
        req,
        res,
        sessionId,
        model || 'qwen3-max',
        persistence,  // Pass persistence data for response logging
        startTime,    // Pass start time for duration calculation
        isNewSession  // Pass isNewSession flag for conversation hash setup
      );

      // Note: SSEHandler updates session and logs response internally after stream completes

    } else {
      // NON-STREAMING MODE
      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Non-streaming mode');
      }

      // Direct API call with retry logic
      const qwenResponse = await qwenClient.withRetry(async () => {
        return await qwenClient.sendMessage(qwenPayload, { stream: false });
      });

      // Calculate duration
      const duration = Date.now() - startTime;

      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Received response from Qwen');
      }

      // Extract parent_id from response for session update
      const newParentId = transformers.extractParentId(qwenResponse.data);

      if (newParentId) {
        sessionManager.updateSession(sessionId, newParentId);

        if (config.logging.level === 'debug') {
          console.log('[ChatCompletions] Session updated with new parent_id:', newParentId);
        }
      } else {
        console.warn('[ChatCompletions] Warning: No parent_id in response');
      }

      // Transform Qwen response to OpenAI format
      const openaiResponse = transformers.transformToOpenAICompletion(
        qwenResponse.data,
        {
          model: model || 'qwen3-max'
        }
      );

      // Set conversation hash for new sessions (after first response)
      if (isNewSession) {
        const assistantMessage = openaiResponse.choices[0]?.message?.content || '';
        // Always set the hash, even if content is empty, to allow continuations
        sessionManager.setConversationHash(sessionId, assistantMessage);
        if (config.logging.level === 'debug') {
          console.log('[ChatCompletions] Set conversation hash for new session');
        }
      }

      // LOG RESPONSE TO DATABASE (Phase 4: Persistence)
      if (persistence) {
        await logResponse(
          persistence.requestDbId,
          sessionId,
          qwenResponse.data,  // Qwen response
          openaiResponse,     // OpenAI response
          newParentId,
          openaiResponse.usage,
          duration,
          openaiResponse.choices[0]?.finish_reason || 'stop',
          null  // no error
        );
      }

      if (config.logging.level === 'debug') {
        console.log('[ChatCompletions] Sending OpenAI-formatted response');
      }

      // Send response
      res.json(openaiResponse);
    }

  } catch (error) {
    // NEW: Log error to database
    const errorId = errorLogger.logHttpError(error, req, res, {
      session_id: typeof sessionId !== 'undefined' ? sessionId : null,
      request_id: typeof persistence !== 'undefined' && persistence ? persistence.requestDbId : null,
      endpoint: '/v1/chat/completions'
    });

    console.error('[ChatCompletions] Error:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      errorId: errorId,  // NEW: Include error_id
      stack: config.logging.level === 'debug' ? error.stack : undefined
    });

    // LOG ERROR RESPONSE TO DATABASE (Phase 4: Persistence)
    // Only log if we have persistence initialized and startTime defined
    if (typeof persistence !== 'undefined' && persistence && typeof startTime !== 'undefined') {
      await logResponse(
        persistence.requestDbId,
        typeof sessionId !== 'undefined' ? sessionId : null,
        null,
        null,
        null,
        null,
        Date.now() - startTime,
        'error',
        error.message
      ).catch(err => {
        // Silently fail - don't let persistence errors mask the original error
        console.error('[ChatCompletions] Failed to log error response:', err.message);
      });
    }

    // Pass to error handler middleware
    next(error);
  }
}

/**
 * Get session manager instance (for testing and monitoring)
 *
 * @returns {SessionManager} Session manager instance
 */
function getSessionManager() {
  return sessionManager;
}

/**
 * Get QwenClient instance (for testing)
 *
 * @returns {QwenClient} Qwen client instance
 */
function getQwenClient() {
  return qwenClient;
}

/**
 * Shutdown handler
 * Called during graceful shutdown
 */
function shutdown() {
  console.log('[ChatCompletions] Shutting down...');
  sessionManager.shutdown();
  console.log('[ChatCompletions] Session manager stopped');
}

// Export handler and utilities
module.exports = {
  chatCompletions,
  getSessionManager,
  getQwenClient,
  shutdown,
  // Export for testing
  validateChatCompletionRequest,
  extractFirstUserMessage
};
