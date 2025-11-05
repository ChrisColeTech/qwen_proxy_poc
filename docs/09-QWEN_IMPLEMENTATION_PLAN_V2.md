# Qwen Provider Implementation Plan V2

**Generated:** 2025-10-31
**Purpose:** Integrate Qwen provider into existing provider-router architecture
**Approach:** Leverage existing infrastructure, add only Qwen-specific components

**REVISION NOTES:**
- Removed Phase 3 (Qwen Sessions Service) - using existing SessionManager
- Removed Phase 6 (Qwen Session Manager) - using existing SessionManager
- Updated all references to use SessionManager at src/services/session-manager.js
- Phase count reduced from 12 to 10 phases

---

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | Critical | Pending | Database schema for Qwen credentials only |
| Phase 2 | Critical | Pending | Qwen credentials service (database-backed) |
| Phase 3 | Critical | Pending | Qwen API type definitions and validators |
| Phase 4 | Critical | Pending | Qwen HTTP client for API calls |
| Phase 5 | Critical | Pending | Request transformer (OpenAI → Qwen format) |
| Phase 6 | Critical | Pending | Response transformer (Qwen → OpenAI format) |
| Phase 7 | Critical | Pending | Qwen provider implementation |
| Phase 8 | High | Pending | Provider registration and configuration |
| Phase 9 | High | Pending | Integration testing and validation |
| Phase 10 | Medium | Pending | Error handling enhancements |

---

## Project Structure

### Current Structure (Existing)
```
/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/
├── src/
│   ├── config.js                      # ✅ Existing - Configuration management
│   ├── index.js                       # ✅ Existing - Entry point
│   ├── server.js                      # ✅ Existing - Express server
│   ├── database/
│   │   ├── connection.js              # ✅ Existing - SQLite connection
│   │   ├── schema.sql                 # 🔧 Modified - Add Qwen credentials table
│   │   └── services/
│   │       ├── logs-service.js        # ✅ Existing - Logs CRUD
│   │       └── settings-service.js    # ✅ Existing - Settings CRUD
│   ├── services/
│   │   └── session-manager.js         # ✅ Existing - Session management (REUSE THIS)
│   ├── middleware/
│   │   ├── cors.js                    # ✅ Existing
│   │   ├── request-logger.js          # ✅ Existing
│   │   ├── response-logger.js         # ✅ Existing
│   │   ├── database-logger.js         # ✅ Existing
│   │   └── error-handler.js           # ✅ Existing
│   ├── providers/
│   │   ├── index.js                   # 🔧 Modified - Register Qwen provider
│   │   ├── base-provider.js           # ✅ Existing - Base class
│   │   ├── lm-studio-provider.js      # ✅ Existing
│   │   ├── qwen-proxy-provider.js     # ✅ Existing
│   │   └── qwen-direct-provider.js    # 🔧 Modified - Complete implementation
│   ├── router/
│   │   └── provider-router.js         # ✅ Existing - Provider routing
│   └── utils/
│       └── logger.js                  # ✅ Existing - Logging utility
```

### New Structure (To Be Added)
```
/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/
├── src/
│   ├── database/
│   │   └── services/
│   │       └── qwen-credentials-service.js  # ⭐ New - Qwen credentials CRUD
│   ├── providers/
│   │   └── qwen/
│   │       ├── qwen-client.js               # ⭐ New - Low-level HTTP client
│   │       ├── qwen-types.js                # ⭐ New - Type definitions
│   │       ├── request-transformer.js       # ⭐ New - OpenAI → Qwen
│   │       └── response-transformer.js      # ⭐ New - Qwen → OpenAI
│   └── utils/
│       └── retry-with-backoff.js            # ⭐ New - Retry logic utility
```

---

## Phase 1: Database Schema for Qwen Credentials

**Priority:** Critical
**Goal:** Add database table for storing Qwen credentials only (sessions already exist)

**CHANGES:** Removed qwen_sessions table - using existing sessions table

### Files to Modify
- `src/database/schema.sql` - Add Qwen credentials table

### Acceptance Criteria
- [ ] `qwen_credentials` table created with token, cookies, expiry
- [ ] Schema applied on database initialization
- [ ] Indexes added for performance

### Implementation Details

**Schema additions:**

```sql
-- Qwen API Credentials
CREATE TABLE IF NOT EXISTS qwen_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  cookies TEXT NOT NULL,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_qwen_credentials_expires
ON qwen_credentials(expires_at);
```

### Testing Strategy
```bash
# Verify schema
sqlite3 data/provider-router.db ".schema qwen_credentials"

# Verify indexes
sqlite3 data/provider-router.db ".indexes qwen_credentials"
```

---

## Phase 2: Qwen Credentials Service

**Priority:** Critical
**Goal:** Create database service for managing Qwen API credentials

### Files to Create
- `src/database/services/qwen-credentials-service.js` - Credentials CRUD operations

### Integration Points
- `src/database/connection.js` - Uses existing database connection
- `src/utils/logger.js` - Uses for logging

### Acceptance Criteria
- [ ] `getCredentials()` retrieves current valid credentials
- [ ] `setCredentials(token, cookies)` stores new credentials
- [ ] `updateCredentials(token, cookies)` updates existing credentials
- [ ] `isValid()` checks if credentials exist and not expired
- [ ] `deleteCredentials()` removes credentials
- [ ] Thread-safe operations with database transactions

### Implementation Details

```javascript
/**
 * Qwen Credentials Service
 * Manages Qwen API credentials in database
 */

import { getDb } from '../connection.js';
import { logger } from '../../utils/logger.js';

class QwenCredentialsService {
  /**
   * Get current valid credentials
   * @returns {Object|null} { id, token, cookies, expires_at, created_at, updated_at }
   */
  static getCredentials() {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    try {
      const stmt = db.prepare(`
        SELECT * FROM qwen_credentials
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const credentials = stmt.get(now);

      if (credentials) {
        logger.debug('Retrieved Qwen credentials from database', {
          id: credentials.id,
          hasToken: !!credentials.token,
          hasCookies: !!credentials.cookies,
          expiresAt: credentials.expires_at
        });
      }

      return credentials;
    } catch (error) {
      logger.error('Failed to get Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Set new credentials (replaces existing)
   * @param {string} token - bx-umidtoken value
   * @param {string} cookies - Cookie header value
   * @param {number} [expiresAt] - Optional expiry timestamp
   * @returns {number} The ID of the inserted credentials
   */
  static setCredentials(token, cookies, expiresAt = null) {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    try {
      // Delete old credentials first
      const deleteStmt = db.prepare('DELETE FROM qwen_credentials');
      deleteStmt.run();

      // Insert new credentials
      const insertStmt = db.prepare(`
        INSERT INTO qwen_credentials (token, cookies, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(token, cookies, expiresAt, now, now);

      logger.info('Qwen credentials stored in database', {
        id: result.lastInsertRowid,
        expiresAt
      });

      return result.lastInsertRowid;
    } catch (error) {
      logger.error('Failed to set Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Update existing credentials
   * @param {string} token - bx-umidtoken value
   * @param {string} cookies - Cookie header value
   * @param {number} [expiresAt] - Optional expiry timestamp
   */
  static updateCredentials(token, cookies, expiresAt = null) {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    try {
      const stmt = db.prepare(`
        UPDATE qwen_credentials
        SET token = ?, cookies = ?, expires_at = ?, updated_at = ?
        WHERE id = (SELECT id FROM qwen_credentials ORDER BY created_at DESC LIMIT 1)
      `);

      const result = stmt.run(token, cookies, expiresAt, now);

      logger.info('Qwen credentials updated', {
        changes: result.changes,
        expiresAt
      });

      return result.changes > 0;
    } catch (error) {
      logger.error('Failed to update Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if valid credentials exist
   * @returns {boolean}
   */
  static isValid() {
    const credentials = this.getCredentials();
    return credentials && credentials.token && credentials.cookies;
  }

  /**
   * Delete all credentials
   */
  static deleteCredentials() {
    const db = getDb();

    try {
      const stmt = db.prepare('DELETE FROM qwen_credentials');
      const result = stmt.run();

      logger.info('Qwen credentials deleted', {
        deleted: result.changes
      });

      return result.changes;
    } catch (error) {
      logger.error('Failed to delete Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Get headers for Qwen API requests
   * @returns {Object} Headers object with token and cookies
   * @throws {Error} If credentials are not valid
   */
  static getHeaders() {
    const credentials = this.getCredentials();

    if (!credentials || !credentials.token || !credentials.cookies) {
      throw new Error('Qwen credentials not found or expired');
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }
}

export { QwenCredentialsService };
```

### Testing Strategy

```javascript
// Test setting credentials
const id = QwenCredentialsService.setCredentials('test-token', 'test-cookies');
console.log('Credentials ID:', id);

// Test getting credentials
const creds = QwenCredentialsService.getCredentials();
console.assert(creds.token === 'test-token');
console.assert(creds.cookies === 'test-cookies');

// Test validity check
console.assert(QwenCredentialsService.isValid() === true);

// Test getting headers
const headers = QwenCredentialsService.getHeaders();
console.assert(headers['bx-umidtoken'] === 'test-token');
console.assert(headers['Cookie'] === 'test-cookies');

// Test deletion
QwenCredentialsService.deleteCredentials();
console.assert(QwenCredentialsService.isValid() === false);
```

---

## Phase 3: Qwen API Type Definitions

**Priority:** Critical
**Goal:** Create type definitions and validators for Qwen API payloads

**CHANGES:** Phase renumbered from 4 to 3

### Files to Create
- `src/providers/qwen/qwen-types.js` - Type creators and validators

### Acceptance Criteria
- [ ] `createChatPayload()` creates new chat request payload
- [ ] `createQwenMessage()` creates complete message object
- [ ] `createCompletionPayload()` creates chat completion request
- [ ] `parseSSEChunk()` parses Server-Sent Events format
- [ ] `validateParentId()` validates parent_id format
- [ ] All fields match Qwen API documentation exactly

### Implementation Details

```javascript
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
```

### Testing Strategy

```javascript
// Test chat payload creation
const chatPayload = createChatPayload('Test Chat', 'qwen3-max');
console.assert(chatPayload.title === 'Test Chat');
console.assert(chatPayload.models[0] === 'qwen3-max');
console.assert(chatPayload.chat_mode === 'guest');

// Test message creation
const message = createQwenMessage({
  fid: '123e4567-e89b-12d3-a456-426614174000',
  parentId: null,
  role: 'user',
  content: 'Hello',
  models: ['qwen3-max']
});
console.assert(message.fid === '123e4567-e89b-12d3-a456-426614174000');
console.assert(message.parentId === null);
console.assert(message.parent_id === null);
console.assert(message.feature_config.thinking_enabled === false);

// Test completion payload
const payload = createCompletionPayload({
  chatId: 'chat-123',
  parentId: null,
  message,
  stream: true,
  model: 'qwen3-max'
});
console.assert(payload.chat_id === 'chat-123');
console.assert(payload.stream === true);
console.assert(payload.incremental_output === true);

// Test SSE parsing
const chunk = parseSSEChunk('data: {"choices":[{"delta":{"content":"Hello"}}]}');
console.assert(chunk.choices[0].delta.content === 'Hello');

// Test parent_id validation
console.assert(validateParentId(null) === true);
console.assert(validateParentId('123e4567-e89b-12d3-a456-426614174000') === true);
console.assert(validateParentId('invalid') === false);

// Test conversation ID generation
const convId = generateConversationId([
  { role: 'user', content: 'test' }
]);
console.assert(typeof convId === 'string');
console.assert(convId.length === 32); // MD5 hash length
```

---

## Phase 4: Qwen HTTP Client

**Priority:** Critical
**Goal:** Implement low-level HTTP client for Qwen API calls

**CHANGES:**
- Phase renumbered from 5 to 4
- Removed references to qwen-sessions-service.js
- No longer creates SessionManager (uses existing one)

### Files to Create
- `src/providers/qwen/qwen-client.js` - HTTP client for Qwen API

### Integration Points
- `src/database/services/qwen-credentials-service.js` - Gets credentials
- `src/providers/qwen/qwen-types.js` - Uses type creators
- `src/utils/logger.js` - Logging
- `src/utils/retry-with-backoff.js` - Retry logic (to be created in Phase 10)

### Acceptance Criteria
- [ ] `createChat(title, model)` creates new Qwen chat
- [ ] `sendMessage(params)` sends message and returns stream/response
- [ ] `listModels()` fetches available models
- [ ] Handles authentication via credentials service
- [ ] Proper error handling with retries
- [ ] Supports both streaming and non-streaming

### Implementation Details

```javascript
/**
 * Qwen HTTP Client
 * Low-level API client for Qwen endpoints
 */

import axios from 'axios';
import { QwenCredentialsService } from '../../database/services/qwen-credentials-service.js';
import { createChatPayload, createCompletionPayload } from './qwen-types.js';
import { logger } from '../../utils/logger.js';

const QWEN_BASE_URL = 'https://chat.qwen.ai';

class QwenClient {
  /**
   * Create new Qwen chat
   * @param {string} title - Chat title
   * @param {string} [model='qwen3-max'] - Model ID
   * @returns {Promise<string>} Chat ID
   */
  async createChat(title, model = 'qwen3-max') {
    try {
      const payload = createChatPayload(title, model);
      const headers = QwenCredentialsService.getHeaders();

      logger.debug('Creating Qwen chat', { title, model });

      const response = await axios.post(
        `${QWEN_BASE_URL}/api/v2/chats/new`,
        payload,
        { headers }
      );

      const chatId = response.data.data.id;

      logger.info('Created Qwen chat', { chatId, title });

      return chatId;
    } catch (error) {
      logger.error('Failed to create Qwen chat', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Qwen API error: ${error.message}`);
    }
  }

  /**
   * Send message to Qwen chat
   * @param {Object} params - Send message parameters
   * @param {string} params.chatId - Chat ID
   * @param {string|null} params.parentId - Parent message ID
   * @param {Object} params.message - Message object
   * @param {boolean} [params.stream=true] - Enable streaming
   * @param {string} [params.model='qwen3-max'] - Model ID
   * @returns {Promise<Object>} Axios response with stream or JSON
   */
  async sendMessage({ chatId, parentId, message, stream = true, model = 'qwen3-max' }) {
    try {
      const payload = createCompletionPayload({
        chatId,
        parentId,
        message,
        stream,
        model
      });

      const headers = QwenCredentialsService.getHeaders();

      logger.debug('Sending message to Qwen', {
        chatId,
        parentId,
        stream,
        model,
        contentLength: message.content.length
      });

      const response = await axios.post(
        `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
        payload,
        {
          headers,
          responseType: stream ? 'stream' : 'json'
        }
      );

      logger.info('Message sent to Qwen', {
        chatId,
        parentId,
        status: response.status
      });

      return response;
    } catch (error) {
      logger.error('Failed to send message to Qwen', {
        chatId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Qwen API error: ${error.message}`);
    }
  }

  /**
   * List available models
   * @returns {Promise<Array>} Array of model objects
   */
  async listModels() {
    try {
      const headers = QwenCredentialsService.getHeaders();

      logger.debug('Fetching Qwen models');

      const response = await axios.get(
        `${QWEN_BASE_URL}/api/models`,
        { headers }
      );

      const models = response.data.data;

      logger.info('Fetched Qwen models', {
        count: models.length
      });

      return models;
    } catch (error) {
      logger.error('Failed to fetch Qwen models', {
        error: error.message,
        status: error.response?.status
      });
      throw new Error(`Qwen API error: ${error.message}`);
    }
  }

  /**
   * Health check - verify credentials and API connectivity
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      if (!QwenCredentialsService.isValid()) {
        logger.warn('Qwen credentials not valid');
        return false;
      }

      // Try to list models as health check
      await this.listModels();
      return true;
    } catch (error) {
      logger.error('Qwen health check failed', { error: error.message });
      return false;
    }
  }
}

export { QwenClient };
```

### Testing Strategy

```bash
# Set credentials first
node -e "
const { QwenCredentialsService } = require('./src/database/services/qwen-credentials-service.js');
QwenCredentialsService.setCredentials(process.env.QWEN_TOKEN, process.env.QWEN_COOKIES);
"

# Test client
node -e "
const { QwenClient } = require('./src/providers/qwen/qwen-client.js');
const client = new QwenClient();

// Test health check
client.healthCheck().then(healthy => {
  console.log('Health:', healthy);
});

// Test list models
client.listModels().then(models => {
  console.log('Models:', models.length);
});

// Test create chat
client.createChat('Test Chat').then(chatId => {
  console.log('Chat ID:', chatId);
});
"
```

---

**[Continued in Part 2: 10-QWEN_IMPLEMENTATION_PLAN_V2_PART2.md]**
