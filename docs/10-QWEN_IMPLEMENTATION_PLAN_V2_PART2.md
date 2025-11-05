# Qwen Provider Implementation Plan V2 - Part 2

**Continuation of:** 09-QWEN_IMPLEMENTATION_PLAN_V2.md
**Phases Covered:** 5-10

**REVISION NOTES:**
- Removed Phase 6 (Qwen Session Manager) - using existing SessionManager
- Updated all references to use SessionManager at src/services/session-manager.js
- Updated phase numbering (5-10 instead of 6-13)
- All code examples now use existing SessionManager

---

## Phase 5: Request Transformer (OpenAI → Qwen)

**Priority:** Critical
**Goal:** Transform OpenAI-compatible requests into Qwen API format

**CHANGES:**
- Phase renumbered from 7 to 5
- Updated to use SessionManager from src/services/session-manager.js
- Removed references to QwenSessionManager

### Files to Create
- `src/providers/qwen/request-transformer.js` - Request transformation logic

### Integration Points
- `src/providers/qwen/qwen-types.js` - Uses type creators
- `src/services/session-manager.js` - Gets session info (EXISTING)
- `src/utils/logger.js` - Logging

### Acceptance Criteria
- [ ] `transformRequest(openaiRequest, sessionInfo)` converts to Qwen format
- [ ] Handles system messages correctly
- [ ] Preserves conversation context
- [ ] Extracts model, temperature, max_tokens
- [ ] Handles tool definitions (if present)
- [ ] Creates proper Qwen message objects with UUIDs

### Implementation Details

```javascript
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
```

### Testing Strategy

```javascript
// Test basic transformation
const openaiRequest = {
  model: 'qwen3-max',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  stream: true,
  temperature: 0.7
};

const sessionInfo = {
  chatId: 'chat-123',
  parentId: null
};

const result = transformRequest(openaiRequest, sessionInfo);

console.assert(result.payload.chat_id === 'chat-123');
console.assert(result.payload.model === 'qwen3-max');
console.assert(result.payload.stream === true);
console.assert(result.payload.temperature === 0.7);
console.assert(result.payload.messages[0].content === 'Hello!');
console.assert(result.payload.messages[0].role === 'user');
console.assert(result.metadata.fid !== null);

// Test system prompt extraction
const systemPrompt = extractSystemPrompt(openaiRequest.messages);
console.assert(systemPrompt === 'You are a helpful assistant.');

// Test context building
const context = buildContextString(openaiRequest.messages);
console.assert(context.includes('user: Hello!'));
```

---

## Phase 6: Response Transformer (Qwen → OpenAI)

**Priority:** Critical
**Goal:** Transform Qwen API responses into OpenAI-compatible format

**CHANGES:** Phase renumbered from 8 to 6

### Files to Create
- `src/providers/qwen/response-transformer.js` - Response transformation logic

### Integration Points
- `src/providers/qwen/qwen-types.js` - Uses parsing helpers
- `src/utils/logger.js` - Logging

### Acceptance Criteria
- [ ] `transformStreamChunk(qwenChunk)` converts SSE chunks to OpenAI format
- [ ] `transformNonStreamResponse(qwenResponse)` converts full response
- [ ] Extracts parent_id from response.created chunk
- [ ] Handles finish_reason mapping
- [ ] Preserves usage statistics
- [ ] Generates OpenAI-compatible IDs

### Implementation Details

```javascript
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
```

### Testing Strategy

```javascript
// Test stream chunk transformation
const sseLine = 'data: {"choices":[{"delta":{"content":"Hello"}}]}';
const result = transformStreamChunk(sseLine, 'qwen3-max');

console.assert(result.type === 'content');
console.assert(result.chunk.model === 'qwen3-max');
console.assert(result.chunk.choices[0].delta.content === 'Hello');
console.assert(result.chunk.object === 'chat.completion.chunk');

// Test parent_id extraction
const createdLine = 'data: {"response.created":{"parent_id":"parent-123"}}';
const metadataResult = transformStreamChunk(createdLine, 'qwen3-max');

console.assert(metadataResult.type === 'metadata');
console.assert(metadataResult.parentId === 'parent-123');

// Test non-stream transformation
const qwenResponse = {
  choices: [
    {
      message: {
        content: 'Hello, how can I help?'
      },
      finish_reason: 'finished'
    }
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }
};

const openaiResponse = transformNonStreamResponse(qwenResponse, 'qwen3-max');

console.assert(openaiResponse.model === 'qwen3-max');
console.assert(openaiResponse.choices[0].message.content === 'Hello, how can I help?');
console.assert(openaiResponse.choices[0].finish_reason === 'stop');
console.assert(openaiResponse.usage.total_tokens === 30);

// Test error response
const errorResponse = createErrorResponse('Invalid request', 'invalid_request_error');
console.assert(errorResponse.error.message === 'Invalid request');
console.assert(errorResponse.error.type === 'invalid_request_error');
```

---

## Phase 7: Qwen Provider Implementation

**Priority:** Critical
**Goal:** Implement QwenDirectProvider that extends BaseProvider

**CHANGES:**
- Phase renumbered from 9 to 7
- Updated to use SessionManager from src/services/session-manager.js
- Removed QwenSessionManager references
- Updated imports and constructor
- Removed cleanup interval (SessionManager already has this)

### Files to Modify
- `src/providers/qwen-direct-provider.js` - Complete provider implementation

### Integration Points
- `src/providers/base-provider.js` - Extends base class
- `src/services/session-manager.js` - Session management (EXISTING)
- `src/providers/qwen/request-transformer.js` - Request transformation
- `src/providers/qwen/response-transformer.js` - Response transformation
- `src/providers/qwen/qwen-client.js` - API client
- `src/database/services/qwen-credentials-service.js` - Credentials
- `src/utils/logger.js` - Logging

### Acceptance Criteria
- [ ] Implements `chat(messages, options)` method
- [ ] Implements `listModels()` method
- [ ] Implements `healthCheck()` method
- [ ] Supports both streaming and non-streaming
- [ ] Tracks parent_id across multi-turn conversations using SessionManager
- [ ] Handles errors gracefully
- [ ] Returns OpenAI-compatible responses

### Implementation Details

```javascript
/**
 * Qwen Direct Provider
 * Connects directly to Qwen API with database-backed credentials
 * Uses existing SessionManager for conversation tracking
 */

import BaseProvider from './base-provider.js';
import { QwenClient } from './qwen/qwen-client.js';
import SessionManager from '../services/session-manager.js';
import { transformRequest } from './qwen/request-transformer.js';
import { transformStreamChunk, transformNonStreamResponse, createErrorResponse } from './qwen/response-transformer.js';
import { QwenCredentialsService } from '../database/services/qwen-credentials-service.js';
import { generateConversationId } from './qwen/qwen-types.js';
import { logger } from '../utils/logger.js';
import { PassThrough } from 'stream';

class QwenDirectProvider extends BaseProvider {
  constructor(config = {}) {
    super('qwen-direct', {
      baseURL: 'https://chat.qwen.ai',
      models: ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash'],
      ...config
    });

    this.client = new QwenClient();

    // Use existing SessionManager
    this.sessionManager = new SessionManager({
      timeout: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 10 * 60 * 1000 // 10 minutes
    });

    // Start automatic cleanup
    this.sessionManager.startCleanup();

    logger.info('QwenDirectProvider initialized', {
      models: this.config.models
    });
  }

  /**
   * Chat completion
   * @param {Array} messages - OpenAI messages array
   * @param {Object} options - Options (model, stream, temperature, max_tokens)
   * @returns {Promise<Object|Stream>} Response or stream
   */
  async chat(messages, options = {}) {
    try {
      // Check credentials
      if (!QwenCredentialsService.isValid()) {
        throw new Error('Qwen credentials not found or expired');
      }

      const { model = 'qwen3-max', stream = false } = options;

      // Generate conversation ID from first user message
      const conversationId = generateConversationId(messages);

      logger.debug('Processing chat request', {
        conversationId,
        model,
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
          model
        });

        chatId = await this.client.createChat(`Conversation ${conversationId.substring(0, 8)}`, model);

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
        { messages, model, stream, ...options },
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
        return this.handleStreamResponse(response, conversationId, model);
      } else {
        return this.handleNonStreamResponse(response, conversationId, model);
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
   * @returns {Promise<Object>} OpenAI models list format
   */
  async listModels() {
    try {
      const models = await this.client.listModels();

      return {
        object: 'list',
        data: models.map(model => ({
          id: model.id || model.name,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'qwen'
        }))
      };
    } catch (error) {
      logger.error('Failed to list models', { error: error.message });

      // Return default models on error
      return {
        object: 'list',
        data: this.config.models.map(modelId => ({
          id: modelId,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'qwen'
        }))
      };
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
```

### Testing Strategy

```bash
# Set credentials via environment variables (Electron will pass these)
export QWEN_TOKEN="your-token"
export QWEN_COOKIES="your-cookies"

# Initialize credentials in database
node -e "
const { QwenCredentialsService } = require('./src/database/services/qwen-credentials-service.js');
QwenCredentialsService.setCredentials(process.env.QWEN_TOKEN, process.env.QWEN_COOKIES);
console.log('Credentials stored');
"

# Test provider
node -e "
const QwenDirectProvider = require('./src/providers/qwen-direct-provider.js').default;

const provider = new QwenDirectProvider();

// Test health check
provider.healthCheck().then(healthy => {
  console.log('Health:', healthy);
});

// Test list models
provider.listModels().then(models => {
  console.log('Models:', models.data.length);
});

// Test chat (non-streaming)
const messages = [
  { role: 'user', content: 'Hello!' }
];

provider.chat(messages, { model: 'qwen3-max', stream: false }).then(response => {
  console.log('Response:', response.choices[0].message.content);
});
"
```

---

## Phase 8: Provider Registration and Configuration

**Priority:** High
**Goal:** Register Qwen provider and handle credential initialization

**CHANGES:** Phase renumbered from 10 to 8

### Files to Modify
- `src/providers/index.js` - Register qwen-direct provider
- `src/index.js` - Add credential initialization from env vars

### Integration Points
- `src/providers/qwen-direct-provider.js` - Provider to register
- `src/database/services/qwen-credentials-service.js` - Credential storage
- `src/utils/logger.js` - Logging

### Acceptance Criteria
- [ ] Qwen provider registered in provider registry
- [ ] Credentials read from environment variables on startup
- [ ] Credentials stored in database if present
- [ ] Provider available via provider-router
- [ ] Graceful handling if credentials missing

### Implementation Details

**Modify `src/providers/index.js`:**

```javascript
/**
 * Provider Registry
 */

import LMStudioProvider from './lm-studio-provider.js'
import QwenProxyProvider from './qwen-proxy-provider.js'
import QwenDirectProvider from './qwen-direct-provider.js'
import { logger } from '../utils/logger.js'

// Registry of all available providers
const providers = new Map()

/**
 * Register LM Studio provider
 */
function registerLMStudio() {
  try {
    const provider = new LMStudioProvider({
      baseURL: process.env.LM_STUDIO_BASE_URL || 'http://192.168.0.22:1234/v1',
      models: ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    })
    providers.set('lm-studio', provider)
    logger.info('Registered LM Studio provider')
  } catch (error) {
    logger.error('Failed to register LM Studio provider', { error: error.message })
  }
}

/**
 * Register Qwen Proxy provider
 */
function registerQwenProxy() {
  try {
    const provider = new QwenProxyProvider({
      baseURL: process.env.QWEN_PROXY_BASE_URL || 'http://localhost:3000/v1',
      models: ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    })
    providers.set('qwen-proxy', provider)
    logger.info('Registered Qwen Proxy provider')
  } catch (error) {
    logger.error('Failed to register Qwen Proxy provider', { error: error.message })
  }
}

/**
 * Register Qwen Direct provider
 */
function registerQwenDirect() {
  try {
    const provider = new QwenDirectProvider({
      models: ['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']
    })
    providers.set('qwen-direct', provider)
    logger.info('Registered Qwen Direct provider')
  } catch (error) {
    logger.error('Failed to register Qwen Direct provider', { error: error.message })
  }
}

/**
 * Initialize all providers
 */
export function initializeProviders() {
  registerLMStudio()
  registerQwenProxy()
  registerQwenDirect()

  logger.info('Provider initialization complete', {
    count: providers.size,
    providers: Array.from(providers.keys())
  })
}

/**
 * Get provider by name
 */
export function getProvider(name) {
  return providers.get(name)
}

/**
 * Get all providers
 */
export function getAllProviders() {
  return Array.from(providers.values())
}

/**
 * Get provider names
 */
export function getProviderNames() {
  return Array.from(providers.keys())
}
```

**Modify `src/index.js`:**

```javascript
/**
 * Provider Router - Entry Point
 * Initializes database, credentials, and starts server
 */

import { initDb } from './database/connection.js'
import { QwenCredentialsService } from './database/services/qwen-credentials-service.js'
import { initializeProviders } from './providers/index.js'
import app from './server.js'
import { logger } from './utils/logger.js'

const PORT = process.env.PORT || 3001

/**
 * Initialize Qwen credentials from environment variables
 * Called on startup when Electron passes credentials
 */
function initializeQwenCredentials() {
  const token = process.env.QWEN_TOKEN
  const cookies = process.env.QWEN_COOKIES

  if (token && cookies) {
    try {
      // Check if credentials already exist
      if (!QwenCredentialsService.isValid()) {
        QwenCredentialsService.setCredentials(token, cookies)
        logger.info('Qwen credentials initialized from environment variables')
      } else {
        logger.debug('Qwen credentials already exist in database')
      }
    } catch (error) {
      logger.error('Failed to initialize Qwen credentials', {
        error: error.message
      })
    }
  } else {
    logger.warn('Qwen credentials not provided in environment variables', {
      hasToken: !!token,
      hasCookies: !!cookies
    })
  }
}

/**
 * Start server
 */
async function start() {
  try {
    // Initialize database
    logger.info('Initializing database...')
    initDb()

    // Initialize Qwen credentials if provided
    initializeQwenCredentials()

    // Initialize providers
    logger.info('Initializing providers...')
    initializeProviders()

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Provider-router listening on port ${PORT}`)
      logger.info('Endpoints:', {
        chat: `http://localhost:${PORT}/v1/chat/completions`,
        models: `http://localhost:${PORT}/v1/models`,
        health: `http://localhost:${PORT}/health`
      })
    })
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    })
    process.exit(1)
  }
}

// Handle cleanup on shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

start()
```

### Testing Strategy

```bash
# Test with credentials
QWEN_TOKEN="test-token" QWEN_COOKIES="test-cookies" npm start

# Check logs for:
# - "Qwen credentials initialized from environment variables"
# - "Registered Qwen Direct provider"
# - Provider count should be 3

# Test without credentials
npm start

# Check logs for:
# - "Qwen credentials not provided in environment variables"
# - Provider should still register but won't be usable

# Test health endpoint
curl http://localhost:3001/health

# Should show qwen-direct in providers list
```

---

## Phase 9: Integration Testing and Validation

**Priority:** High
**Goal:** End-to-end testing of Qwen provider integration

**CHANGES:** Phase renumbered from 11 to 9

### Files to Create
- `test-payloads/qwen-direct/` - Test payloads for qwen-direct provider

### Integration Points
- All Qwen components
- Provider router
- Test client

### Acceptance Criteria
- [ ] Non-streaming chat works end-to-end
- [ ] Streaming chat works end-to-end
- [ ] Multi-turn conversations maintain context via SessionManager
- [ ] Session tracking works correctly
- [ ] Credentials are used correctly
- [ ] Error handling works
- [ ] Response format matches OpenAI spec

### Implementation Details

**Create test payloads:**

```bash
mkdir -p /mnt/d/Projects/qwen_proxy_opencode/backend/test-client/test-payloads/qwen-direct
```

**`test-payloads/qwen-direct/01-simple-chat.json`:**

```json
{
  "provider": "qwen-direct",
  "model": "qwen3-max",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant."
    },
    {
      "role": "user",
      "content": "Say hello!"
    }
  ],
  "stream": false,
  "temperature": 0.7
}
```

**`test-payloads/qwen-direct/02-streaming-chat.json`:**

```json
{
  "provider": "qwen-direct",
  "model": "qwen3-coder",
  "messages": [
    {
      "role": "user",
      "content": "Write a hello world program in Python"
    }
  ],
  "stream": true,
  "temperature": 0.5
}
```

**`test-payloads/qwen-direct/03-multi-turn.json`:**

```json
{
  "provider": "qwen-direct",
  "model": "qwen3-max",
  "messages": [
    {
      "role": "user",
      "content": "My favorite color is blue"
    }
  ],
  "stream": false
}
```

**Test script `test-qwen-direct.sh`:**

```bash
#!/bin/bash

# Test Qwen Direct Provider
BASE_URL="http://localhost:3001/v1/chat/completions"
CONTENT_TYPE="Content-Type: application/json"

echo "========================================="
echo "Qwen Direct Provider Tests"
echo "========================================="
echo ""

# Check credentials
if [ -z "$QWEN_TOKEN" ] || [ -z "$QWEN_COOKIES" ]; then
  echo "ERROR: QWEN_TOKEN and QWEN_COOKIES must be set"
  exit 1
fi

# Restart provider-router with credentials
echo "Restarting provider-router with credentials..."
pkill -f "node.*provider-router" || true
sleep 2
cd /mnt/d/Projects/qwen_proxy_opencode/backend/provider-router
QWEN_TOKEN="$QWEN_TOKEN" QWEN_COOKIES="$QWEN_COOKIES" npm start &
sleep 5

# Test 1: Simple chat
echo "Test 1: Simple non-streaming chat"
response=$(curl -s -X POST "$BASE_URL" \
  -H "$CONTENT_TYPE" \
  -d @../test-client/test-payloads/qwen-direct/01-simple-chat.json)

if echo "$response" | jq empty 2>/dev/null; then
  content=$(echo "$response" | jq -r '.choices[0].message.content')
  echo "✓ Response: $content"
else
  echo "✗ Invalid response"
fi
echo ""

# Test 2: Streaming chat
echo "Test 2: Streaming chat"
curl -s -X POST "$BASE_URL" \
  -H "$CONTENT_TYPE" \
  -d @../test-client/test-payloads/qwen-direct/02-streaming-chat.json \
  | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      echo "$line"
    fi
  done
echo "✓ Stream completed"
echo ""

# Test 3: Multi-turn conversation
echo "Test 3: Multi-turn conversation"
# First turn
response1=$(curl -s -X POST "$BASE_URL" \
  -H "$CONTENT_TYPE" \
  -d @../test-client/test-payloads/qwen-direct/03-multi-turn.json)

echo "✓ First turn complete"

# Second turn (follow-up)
response2=$(curl -s -X POST "$BASE_URL" \
  -H "$CONTENT_TYPE" \
  -d '{
    "provider": "qwen-direct",
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "My favorite color is blue"},
      {"role": "assistant", "content": "'"$(echo "$response1" | jq -r '.choices[0].message.content')"'"},
      {"role": "user", "content": "What is my favorite color?"}
    ],
    "stream": false
  }')

if echo "$response2" | jq -r '.choices[0].message.content' | grep -i "blue"; then
  echo "✓ Context maintained across turns"
else
  echo "✗ Context not maintained"
fi
echo ""

echo "========================================="
echo "Tests Complete"
echo "========================================="
```

### Testing Strategy

```bash
# Set credentials
export QWEN_TOKEN="your-token"
export QWEN_COOKIES="your-cookies"

# Run tests
chmod +x test-qwen-direct.sh
./test-qwen-direct.sh

# Manual testing with provider-router
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'

# Test provider selection
curl -X POST http://localhost:3001/v1/chat/completions?provider=qwen-direct \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## Phase 10: Error Handling Enhancements

**Priority:** Medium
**Goal:** Robust error handling and retry logic

**CHANGES:** Phase renumbered from 12 to 10

### Files to Create
- `src/utils/retry-with-backoff.js` - Exponential backoff retry utility

### Files to Modify
- `src/providers/qwen/qwen-client.js` - Add retry logic
- `src/providers/qwen-direct-provider.js` - Enhanced error handling

### Acceptance Criteria
- [ ] Retry logic for transient failures (429, 503, network errors)
- [ ] Exponential backoff with jitter
- [ ] Credential expiry detection and handling
- [ ] Graceful degradation
- [ ] Detailed error logging

### Implementation Details

**Create `src/utils/retry-with-backoff.js`:**

```javascript
/**
 * Retry with Exponential Backoff
 */

import { logger } from './logger.js';

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of fn
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    jitter = true,
    shouldRetry = defaultShouldRetry,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with jitter
      const actualDelay = jitter
        ? delay * (0.5 + Math.random() * 0.5)
        : delay;

      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay: actualDelay,
        error: error.message
      });

      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, actualDelay);
      }

      // Wait before retry
      await sleep(actualDelay);

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Default retry predicate
 * @param {Error} error - Error to check
 * @returns {boolean} True if should retry
 */
function defaultShouldRetry(error) {
  // Retry on network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on rate limits and server errors
  const status = error.response?.status;
  if (status === 429 || status === 503 || status === 504) {
    return true;
  }

  // Don't retry on client errors (except 429)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry on server errors
  if (status >= 500) {
    return true;
  }

  return false;
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Modify `src/providers/qwen/qwen-client.js` to add retry:**

```javascript
// Add import at top
import { retryWithBackoff } from '../../utils/retry-with-backoff.js';

// Modify createChat to use retry
async createChat(title, model = 'qwen3-max') {
  return retryWithBackoff(async () => {
    try {
      const payload = createChatPayload(title, model);
      const headers = QwenCredentialsService.getHeaders();

      logger.debug('Creating Qwen chat', { title, model });

      const response = await axios.post(
        `${QWEN_BASE_URL}/api/v2/chats/new`,
        payload,
        { headers, timeout: 30000 }
      );

      const chatId = response.data.data.id;

      logger.info('Created Qwen chat', { chatId, title });

      return chatId;
    } catch (error) {
      // Check for credential errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.error('Qwen credentials invalid or expired');
        throw new Error('Qwen credentials invalid or expired');
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
      return true; // Use default retry logic for others
    }
  });
}

// Apply same pattern to sendMessage and listModels
```

**Enhanced error handling in `qwen-direct-provider.js`:**

```javascript
async chat(messages, options = {}) {
  try {
    // Check credentials with detailed error
    if (!QwenCredentialsService.isValid()) {
      logger.error('Qwen credentials not available', {
        hasCredentials: !!QwenCredentialsService.getCredentials(),
        isValid: QwenCredentialsService.isValid()
      });

      throw {
        statusCode: 503,
        error: createErrorResponse(
          'Qwen credentials not configured. Please provide credentials via environment variables.',
          'credentials_missing'
        )
      };
    }

    // Rest of implementation...
  } catch (error) {
    // Enhanced error handling
    if (error.statusCode) {
      // Already formatted error
      throw error;
    }

    // Map common errors
    if (error.message.includes('credentials')) {
      throw {
        statusCode: 503,
        error: createErrorResponse(error.message, 'credentials_error')
      };
    }

    if (error.message.includes('timeout')) {
      throw {
        statusCode: 504,
        error: createErrorResponse('Request timeout', 'timeout')
      };
    }

    // Generic error
    throw {
      statusCode: 500,
      error: createErrorResponse(
        `Qwen API error: ${error.message}`,
        'api_error'
      )
    };
  }
}
```

### Testing Strategy

```bash
# Test retry logic by temporarily blocking network
# Add iptables rule to simulate network issues
sudo iptables -A OUTPUT -p tcp --dport 443 -j DROP

# Try request - should retry and eventually fail
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "test"}]}'

# Remove rule
sudo iptables -D OUTPUT -p tcp --dport 443 -j DROP

# Test with invalid credentials
QWEN_TOKEN="invalid" QWEN_COOKIES="invalid" npm start

# Should fail gracefully with 503 error

# Test with missing credentials
npm start

# Should start but qwen-direct provider should be unavailable
curl http://localhost:3001/health
# Should show qwen-direct as unhealthy
```

---

## Completion Checklist

### Phase 1: Database Schema
- [ ] SQL schema added to `schema.sql`
- [ ] Credentials table created successfully
- [ ] Indexes verified

### Phase 2: Credentials Service
- [ ] Service implemented
- [ ] All CRUD operations tested
- [ ] Headers generation works

### Phase 3: Type Definitions
- [ ] All type helpers implemented
- [ ] Parsing functions tested
- [ ] Validation works

### Phase 4: HTTP Client
- [ ] Client implemented
- [ ] All endpoints work
- [ ] Health check functional

### Phase 5: Request Transformer
- [ ] Transformation logic works
- [ ] All fields mapped correctly
- [ ] System prompts handled

### Phase 6: Response Transformer
- [ ] Streaming transformation works
- [ ] Non-streaming works
- [ ] Parent ID extraction works

### Phase 7: Provider Implementation
- [ ] Provider extends BaseProvider
- [ ] Uses existing SessionManager
- [ ] Chat method works (streaming and non-streaming)
- [ ] Models list works
- [ ] Health check works

### Phase 8: Registration
- [ ] Provider registered
- [ ] Credentials initialized from env vars
- [ ] Available via provider-router

### Phase 9: Integration Testing
- [ ] All test scenarios pass
- [ ] Multi-turn conversations work via SessionManager
- [ ] Response format correct

### Phase 10: Error Handling
- [ ] Retry logic works
- [ ] Errors are descriptive
- [ ] Graceful degradation

---

## Summary

This implementation plan provides a complete, phased approach to integrating Qwen Direct provider:

- **Phases 1-4**: Foundation (database, services, types, client)
- **Phases 5-6**: Core logic (transformations)
- **Phase 7**: Provider implementation using existing SessionManager
- **Phases 8-10**: Integration, testing, polish

**Key Changes from Original Plan:**
- Removed Phase 3 (Qwen Sessions Service) - using existing sessions table
- Removed Phase 6 (Qwen Session Manager) - using existing SessionManager
- Updated QwenDirectProvider to use SessionManager from src/services/session-manager.js
- Phase count reduced from 12 to 10
- All session management now handled by existing infrastructure

Each phase is:
- Self-contained with clear boundaries
- Testable independently
- Builds on previous phases
- Follows SRP and DRY principles

The architecture ensures:
- Clean separation of concerns
- Database-backed persistence via existing SessionManager
- OpenAI compatibility
- Multi-turn conversation support via existing sessions infrastructure
- Robust error handling
