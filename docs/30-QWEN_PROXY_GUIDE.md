# Document 30: Qwen Proxy Guide

**Created:** 2025-11-04
**Status:** Active
**Purpose:** Comprehensive documentation for the Qwen Proxy backend service - an OpenAI-compatible proxy server for the Qwen API

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Port and Configuration](#port-and-configuration)
5. [Startup and Lifecycle](#startup-and-lifecycle)
6. [OpenAI to Qwen Translation Layer](#openai-to-qwen-translation-layer)
7. [Credential Management](#credential-management)
8. [Session Management](#session-management)
9. [Streaming Response Handling](#streaming-response-handling)
10. [Database Integration](#database-integration)
11. [API Endpoints](#api-endpoints)
12. [Authentication Flow](#authentication-flow)
13. [Error Handling](#error-handling)
14. [Development vs Production](#development-vs-production)
15. [Common Operations](#common-operations)
16. [Troubleshooting](#troubleshooting)
17. [Integration with Provider Router](#integration-with-provider-router)

---

## Overview

The **Qwen Proxy** is a specialized Node.js backend service that acts as an OpenAI-compatible proxy for the Qwen AI API (`https://chat.qwen.ai`). It translates between OpenAI's chat completion API format and Qwen's proprietary message format, enabling OpenAI-compatible clients (like OpenCode, Continue, Cursor) to seamlessly interact with Qwen models.

### Key Features

- **OpenAI API Compatibility**: Implements `/v1/chat/completions` endpoint with OpenAI request/response format
- **Transparent Translation**: Converts OpenAI messages to Qwen's 18-field message format and back
- **Session Management**: Maintains conversation context using Qwen's `parent_id` chain mechanism
- **Streaming Support**: Full SSE (Server-Sent Events) streaming with proper chunk transformation
- **Tool Calling**: Transforms OpenAI tool definitions to Qwen's XML format and parses XML responses back
- **Centralized Database**: Shares SQLite database with provider-router for credentials and persistence
- **Graceful Degradation**: Server starts without credentials, returns 401 until configured via dashboard

### Architecture Position

```
┌─────────────────┐
│  Electron App   │ (Dashboard UI)
│  (port 3001)    │
└────────┬────────┘
         │
         v
┌─────────────────┐     spawns      ┌─────────────────┐
│   API Server    │ ───────────────> │   Qwen Proxy    │
│  (port 5001)    │                  │   (port 3000)   │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │                                    │
         v                                    v
┌─────────────────────────────────────────────────────┐
│     Centralized SQLite Database                     │
│     (provider-router/data/provider-router.db)       │
│     - qwen_credentials table                        │
│     - sessions, requests, responses tables          │
└─────────────────────────────────────────────────────┘
                                               │
                                               v
                                    ┌─────────────────┐
                                    │   Qwen API      │
                                    │ chat.qwen.ai    │
                                    └─────────────────┘
```

---

## Technology Stack

### Core Technologies

- **Runtime**: Node.js >= 18.0.0
- **Framework**: Express 5.1.0
- **Module System**: **CommonJS** (`type: "commonjs"` in package.json)
- **Database**: better-sqlite3 11.10.0 (synchronous SQLite driver)
- **HTTP Client**: axios 1.13.1
- **Logging**: winston 3.18.3
- **Metrics**: prom-client 15.1.3

### Key Differences from Provider Router

| Aspect | Qwen Proxy | Provider Router |
|--------|------------|-----------------|
| Module System | CommonJS (`require()`) | ES Modules (`import`) |
| Port | 3000 | 5002 |
| Purpose | OpenAI → Qwen translation | Multi-provider routing |
| Entry Point | `src/index.js` | `server.js` |
| Startup | Spawned by API Server | Independent service |

**Why CommonJS?** The qwen-proxy was developed as a separate service with its own module conventions. While provider-router uses modern ES Modules, qwen-proxy uses CommonJS for compatibility with certain tooling and to match the original development approach.

### Dependencies

```json
{
  "axios": "^1.13.1",           // HTTP client for Qwen API calls
  "better-sqlite3": "^11.10.0", // Synchronous SQLite (shared DB)
  "dotenv": "^17.2.3",          // Environment variable loading
  "express": "^5.1.0",          // Web framework
  "prom-client": "^15.1.3",     // Prometheus metrics
  "uuid": "^13.0.0",            // UUID generation for messages
  "winston": "^3.18.3"          // Structured logging
}
```

---

## Directory Structure

```
backend/qwen-proxy/
├── src/
│   ├── index.js                     # Entry point - starts server (lines 15-112)
│   ├── server.js                    # Express app setup and route registration
│   ├── config/
│   │   └── index.js                 # Configuration loader (port, database path, etc.)
│   ├── api/
│   │   ├── qwen-auth.js             # Authentication manager (reads from DB)
│   │   └── qwen-client.js           # Low-level Qwen API HTTP client
│   ├── services/
│   │   ├── qwen-credentials-service.js  # Database credential reader
│   │   ├── qwen-client.js           # High-level Qwen client with retry
│   │   ├── session-manager.js       # Session state management
│   │   ├── sse-handler.js           # Streaming response handler
│   │   └── error-logger.js          # Error logging service
│   ├── handlers/
│   │   ├── chat-completions-handler.js   # Main /v1/chat/completions logic
│   │   ├── completions-handler.js        # Legacy /v1/completions endpoint
│   │   ├── models-handler.js             # /v1/models endpoint
│   │   ├── health-handler.js             # /health endpoints
│   │   ├── metrics-handler.js            # /metrics endpoint
│   │   ├── sessions-handler.js           # Session CRUD endpoints
│   │   ├── requests-handler.js           # Request history endpoints
│   │   └── responses-handler.js          # Response history endpoints
│   ├── transformers/
│   │   ├── openai-to-qwen-transformer.js # OpenAI → Qwen format
│   │   ├── qwen-to-openai-transformer.js # Qwen → OpenAI format
│   │   ├── sse-transformer.js            # Streaming chunk transformer
│   │   ├── tool-to-xml-transformer.js    # OpenAI tools → XML
│   │   └── xml-tool-parser.js            # Parse Qwen XML → OpenAI tools
│   ├── middleware/
│   │   ├── auth-middleware.js        # Validates credentials before proxying
│   │   ├── error-middleware.js       # Global error handler
│   │   └── persistence-middleware.js # Logs requests/responses to DB
│   ├── database/
│   │   ├── index.js                  # Database initialization
│   │   ├── connection.js             # SQLite connection manager
│   │   ├── schema.js                 # Table definitions
│   │   ├── migrations.js             # Migration runner
│   │   └── repositories/             # Data access layer
│   │       ├── session-repository.js
│   │       ├── request-repository.js
│   │       ├── response-repository.js
│   │       └── error-repository.js
│   └── utils/
│       ├── logger.js                 # Winston logger configuration
│       └── hash-utils.js             # MD5 hashing for session IDs
├── package.json                      # Dependencies and scripts
├── .env.example                      # Environment variable template
└── data/                             # Data directory (not used - uses shared DB)
```

---

## Port and Configuration

### Server Port

**Default Port**: `3000`
**Configurable via**: `process.env.PORT` or `config.port`

**File**: `src/config/index.js` (line 34)
```javascript
port: parseInt(process.env.PORT, 10) || 3000,
```

### Database Configuration

**Critical**: Qwen Proxy uses the **centralized provider-router database**, NOT a local database.

**File**: `src/config/index.js` (lines 79-84)
```javascript
database: {
  path: process.env.DATABASE_PATH ||
        require('path').join(__dirname, '../../../provider-router/data/provider-router.db'),
  verbose: process.env.DATABASE_VERBOSE === 'true',
  busyTimeout: parseInt(process.env.DATABASE_BUSY_TIMEOUT, 10) || 5000,
}
```

**Database Tables Used**:
- `qwen_credentials` - Stores API credentials (token, cookies)
- `sessions` - Active conversation sessions
- `requests` - Request history
- `responses` - Response history
- `errors` - Error logs

### Environment Variables

See `.env.example` (103 lines) for full configuration options:

```bash
# Server
NODE_ENV=development
PORT=3000

# Qwen API (Optional - use dashboard instead)
# QWEN_TOKEN=your-token
# QWEN_COOKIES=your-cookies
QWEN_TIMEOUT=60000

# Session Management
SESSION_TIMEOUT=1800000           # 30 minutes
SESSION_CLEANUP_INTERVAL=600000   # 10 minutes

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# Security
CORS_ORIGIN=*
TRUST_PROXY=false

# Retry
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000

# Cache
MODELS_CACHE_DURATION=300000      # 5 minutes

# Tools
ENABLE_TOOL_CALLING=true
```

**Note**: Credentials (`QWEN_TOKEN`, `QWEN_COOKIES`) are optional in `.env` because they can be configured through the dashboard UI, which writes them to the database.

---

## Startup and Lifecycle

### How Qwen Proxy Starts

The qwen-proxy service is **spawned by the API Server** (port 5001), not launched independently.

**Spawned by**: API Server's proxy control mechanism
- **Note**: While the user mentioned `proxy-control.js:239` as the spawn location, the current codebase shows the API Server manages the qwen-proxy lifecycle directly through its server setup.

### Startup Sequence

**File**: `src/index.js` (lines 15-55)

```javascript
(async () => {
  try {
    // 1. Initialize database (connect, create schema, run migrations)
    await initializeDatabase();

    // 2. Check credential status (non-blocking)
    const auth = require('./api/qwen-auth');
    const credStatus = auth.isValid()
      ? '✓ Qwen credentials configured'
      : '⚠ Qwen credentials not configured - configure through dashboard';

    // 3. Start Express server on port 3000
    const server = app.listen(PORT, () => {
      console.log('========================================');
      console.log('  Qwen Proxy Backend');
      console.log('========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${config.env}`);
      console.log(`${credStatus}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  Health check:  http://localhost:${PORT}/health`);
      console.log(`  Metrics:       http://localhost:${PORT}/metrics`);
      console.log(`  OpenAI API:    http://localhost:${PORT}/v1/`);
      // ... (logs all available routes)
    });

    // 4. Register graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Fatal] Database initialization failed:', error);
    process.exit(1);
  }
})();
```

### Graceful Shutdown

**File**: `src/index.js` (lines 58-93)

```javascript
function gracefulShutdown(signal) {
  console.log(`[Shutdown] ${signal} received, shutting down gracefully...`);

  // 1. Stop accepting new connections
  server.close(() => {
    // 2. Shutdown chat completions handler (stops session cleanup timer)
    const { shutdown } = require('./handlers/chat-completions-handler');
    if (typeof shutdown === 'function') {
      shutdown();
    }

    // 3. Close database connection
    shutdownDatabase();

    // 4. Exit cleanly
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}
```

**Shutdown Triggers**:
- `SIGTERM` - Docker/PM2 stop commands
- `SIGINT` - Ctrl+C in terminal
- `uncaughtException` - Fatal errors (immediate exit)
- `unhandledRejection` - Unhandled promise rejections (immediate exit)

---

## OpenAI to Qwen Translation Layer

### The Translation Challenge

Qwen's API has a unique message format with **18 required fields** per message, different from OpenAI's simple `{role, content}` structure. The qwen-proxy handles this translation transparently.

### Request Transformation

**File**: `src/transformers/openai-to-qwen-transformer.js` (lines 1-372)

#### OpenAI Format (Input)
```javascript
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "Hello"}
  ],
  "stream": true,
  "tools": [...]
}
```

#### Qwen Format (Output)
```javascript
{
  "stream": true,
  "incremental_output": true,
  "chat_id": "uuid-from-session",
  "chat_mode": "guest",
  "model": "qwen3-max",
  "parent_id": null,  // or UUID for continuations
  "messages": [
    {
      "fid": "message-uuid",
      "parentId": null,
      "parent_id": null,
      "childrenIds": [],
      "role": "system",
      "content": "You are helpful",
      "user_action": "chat",
      "files": [],
      "timestamp": 1730745600,  // Unix seconds!
      "models": ["qwen3-max"],
      "chat_type": "t2t",
      "sub_chat_type": "t2t",
      "feature_config": {
        "thinking_enabled": false,
        "output_schema": "phase"
      },
      "extra": {
        "meta": {
          "subChatType": "t2t"
        }
      }
    },
    // ... (only last user message included in continuations)
  ],
  "timestamp": 1730745600
}
```

#### Critical Transformation Rules

**Function**: `transformToQwenRequest()` (lines 258-291)

1. **System Message Handling** (lines 101-128):
   - System messages are **ONLY sent on the first request** (when `parentId === null`)
   - Continuations omit system messages (Qwen maintains context via `parent_id` chain)
   - Tool definitions are injected into system message on first request only

2. **Message Extraction** (lines 88-137):
   ```javascript
   function extractMessagesToSend(messages, parentId = null, tools = null) {
     const result = [];

     // Include system ONLY on first request
     if (parentId === null) {
       const systemMessages = messages.filter(m => m.role === 'system');
       if (systemMessages.length > 0) {
         const combinedSystemContent = systemMessages
           .map(m => m.content)
           .join('\n\n');

         // Inject tool definitions if provided
         const enhancedContent = tools
           ? injectToolDefinitions(combinedSystemContent, tools)
           : combinedSystemContent;

         result.push({ role: 'system', content: enhancedContent });
       }
     }

     // Always include last message
     const lastMessage = messages[messages.length - 1];
     if (lastMessage.role !== 'system') {
       result.push(lastMessage);
     }

     return result;
   }
   ```

3. **18-Field Message Creation** (lines 194-248):
   ```javascript
   function createQwenMessage(message, parentId = null, model = 'qwen3-max') {
     const messageId = crypto.randomUUID();
     const timestamp = Math.floor(Date.now() / 1000); // SECONDS not milliseconds!

     return {
       fid: messageId,                    // 1. Message UUID
       parentId: parentId,                // 2. Parent (camelCase)
       parent_id: parentId,               // 3. Parent (snake_case) - duplicate!
       childrenIds: [],                   // 4. Children IDs
       role: message.role,                // 5. Role
       content: normalizeContent(message.content), // 6. Content
       user_action: 'chat',               // 7. User action
       files: [],                         // 8. Files
       timestamp: timestamp,              // 9. Timestamp (seconds!)
       models: [model],                   // 10. Models array
       chat_type: 't2t',                  // 11. Chat type
       sub_chat_type: 't2t',              // 12. Sub chat type
       feature_config: {                  // 13-15. Feature config
         thinking_enabled: false,
         output_schema: 'phase'
       },
       extra: {                           // 16-18. Extra metadata
         meta: {
           subChatType: 't2t'
         }
       }
     };
   }
   ```

4. **Tool Transformation** (lines 26-73):
   - OpenAI tool definitions → XML format in system prompt
   - Only injected on **first message** (`parentId === null`)
   - Example transformation:
     ```javascript
     // OpenAI format:
     {
       "type": "function",
       "function": {
         "name": "get_weather",
         "description": "Get weather",
         "parameters": { "type": "object", "properties": {...} }
       }
     }

     // Becomes in system prompt:
     <get_weather>
     <description>Get weather</description>
     <parameters>
       <location type="string" required="true">City name</location>
     </parameters>
     </get_weather>
     ```

### Response Transformation

**File**: `src/transformers/qwen-to-openai-transformer.js`

#### Qwen Format (Input)
```javascript
{
  "parent_id": "response-uuid",
  "choices": [{
    "delta": { "content": "Hello!" },
    "status": "finished"
  }],
  "usage": { "input_tokens": 10, "output_tokens": 5 }
}
```

#### OpenAI Format (Output)
```javascript
{
  "id": "chatcmpl-uuid",
  "object": "chat.completion.chunk",
  "created": 1730745600,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "delta": { "content": "Hello!" },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}
```

### Tool Call Transformation

**Qwen XML → OpenAI Tool Calls**

**File**: `src/parsers/xml-tool-parser.js`

```javascript
// Qwen response with XML:
"<get_weather>\n<location>San Francisco</location>\n</get_weather>"

// Transformed to OpenAI format:
{
  "tool_calls": [{
    "id": "call_abc123",
    "type": "function",
    "function": {
      "name": "get_weather",
      "arguments": "{\"location\":\"San Francisco\"}"
    }
  }]
}
```

---

## Credential Management

### Database-First Approach

Qwen Proxy uses a **database-first credential management** strategy, distinguishing it from traditional environment variable approaches.

**File**: `src/services/qwen-credentials-service.js` (lines 1-124)

### How Credentials Are Stored

**Database Table**: `qwen_credentials` (in centralized provider-router.db)

```sql
CREATE TABLE qwen_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,           -- bx-umidtoken header value
  cookies TEXT NOT NULL,          -- Cookie header value
  expires_at INTEGER,             -- Unix timestamp (optional)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Credential Retrieval Flow

**Class**: `QwenCredentialsService`

```javascript
class QwenCredentialsService {
  /**
   * Get current valid credentials from database
   * Returns most recent non-expired credential
   */
  static getCredentials() {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      SELECT * FROM qwen_credentials
      WHERE expires_at IS NULL OR expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const credentials = stmt.get(now);
    return credentials;
  }

  /**
   * Check if valid credentials exist
   */
  static isValid() {
    const credentials = this.getCredentials();
    return credentials && credentials.token && credentials.cookies;
  }

  /**
   * Get headers for Qwen API requests
   */
  static getHeaders() {
    const credentials = this.getCredentials();

    if (!credentials || !credentials.token || !credentials.cookies) {
      return null;
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 ...'
    };
  }
}
```

### Authentication Flow

**File**: `src/api/qwen-auth.js` (lines 1-178)

```javascript
class QwenAuth {
  /**
   * Get credentials with fallback chain:
   * 1. Try database first
   * 2. Fallback to .env variables
   * 3. Return null if neither available
   */
  _getCredentials() {
    // Try database first
    const dbCredentials = QwenCredentialsService.getCredentials();
    if (dbCredentials && dbCredentials.token && dbCredentials.cookies) {
      return {
        token: dbCredentials.token,
        cookies: dbCredentials.cookies,
        source: 'database'
      };
    }

    // Fallback to .env if set
    if (config.qwen.token && config.qwen.cookies) {
      return {
        token: config.qwen.token,
        cookies: config.qwen.cookies,
        source: 'environment'
      };
    }

    return null;
  }

  /**
   * Get authentication headers for Qwen API requests
   * @throws {QwenAuthError} If credentials not configured
   */
  getHeaders() {
    const credentials = this._getCredentials();

    if (!credentials) {
      throw new QwenAuthError(
        'Qwen credentials not configured. Please configure credentials through the Electron app Settings.'
      );
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };
  }
}
```

### Credential Configuration Methods

#### Method 1: Dashboard UI (Recommended)

1. Open Electron app dashboard (port 3001)
2. Navigate to Settings → Qwen API
3. Enter credentials obtained from browser DevTools:
   - **bx-umidtoken**: From request headers when using chat.qwen.ai
   - **Cookie**: Complete cookie string from browser
4. Save → credentials written to `qwen_credentials` table
5. No server restart required (credentials loaded on-demand)

#### Method 2: Environment Variables (Fallback)

1. Copy `.env.example` to `.env`
2. Set credentials:
   ```bash
   QWEN_TOKEN=your-bx-umidtoken-value
   QWEN_COOKIES=your-complete-cookie-string
   ```
3. Restart qwen-proxy service

### How to Obtain Credentials

**From Browser** (`https://chat.qwen.ai`):

1. Open Developer Tools (F12)
2. Go to Network tab
3. Start a chat conversation
4. Find the `/api/v2/chat/completions` request
5. Copy headers:
   - **Request Headers** → `bx-umidtoken`
   - **Request Headers** → `Cookie` (entire string)

**Credential Format**:
```
bx-umidtoken: C80A4D...long-token...3D8F
Cookie: sessionid=abc123...; csrftoken=xyz...; _ga=GA1.2...; ...
```

### Credential Validation

**File**: `src/middleware/auth-middleware.js` (lines 18-29)

```javascript
function authMiddleware(req, res, next) {
  try {
    // Check if authentication is valid
    if (!auth.isValid()) {
      return res.status(401).json({
        error: {
          message: 'Qwen credentials not configured. Please configure credentials through the Electron app Settings.',
          type: 'authentication_error',
          code: 'missing_credentials',
        },
      });
    }

    // Attach auth headers to request for handlers
    req.qwenAuth = {
      headers: auth.getHeaders(),
      token: auth.getToken(),
      cookies: auth.getCookies(),
      userAgent: auth.getUserAgent(),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: error.message || 'Authentication failed',
        type: 'authentication_error',
        code: 'auth_error',
      },
    });
  }
}
```

**Applied to Routes**: All `/v1/*` endpoints except `/health` and `/metrics`

**File**: `src/server.js` (lines 136-164)
```javascript
// Health endpoints (NO AUTH)
app.get('/health', health);
app.get('/metrics', metrics);

// API routes (REQUIRE AUTH)
app.get('/v1/models', authMiddleware, listModels);
app.post('/v1/chat/completions', authMiddleware, chatCompletions);
// ... (all other /v1/* routes)
```

---

## Session Management

### Session Concept

Qwen's API uses a **parent_id chain** to maintain conversation context. Each message references its parent, forming a conversation tree. The qwen-proxy manages this automatically using session objects.

**File**: `src/services/session-manager.js` (lines 1-419)

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. New Conversation (No assistant messages)                │
│    - Generate unique session ID (UUID)                      │
│    - Create Qwen chat (get chat_id)                         │
│    - Store session with parent_id: null                     │
│    - Send first message with parent_id: null                │
└─────────────────────────────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────┐
│ 2. First Response                                           │
│    - Extract parent_id from response                        │
│    - Update session.parent_id = response.parent_id          │
│    - Compute conversation hash: MD5(firstUser + firstAsst)  │
│    - Store conversation_hash in session                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────┐
│ 3. Continuation (Has assistant messages)                   │
│    - Compute conversation hash from first exchange          │
│    - Look up session by conversation_hash                   │
│    - Use session.parent_id for next message                 │
│    - Update parent_id after each response                   │
└─────────────────────────────────────────────────────────────┘
```

### Session ID Generation

**File**: `src/handlers/chat-completions-handler.js` (lines 193-315)

#### New Conversation
```javascript
// Check if this is a new conversation
const hasAssistantMessage = messages.some(m => m.role === 'assistant');

if (!hasAssistantMessage) {
  // NEW CONVERSATION - Generate unique UUID
  sessionId = crypto.randomUUID();

  // Create new Qwen chat
  const chatId = await qwenClient.createNewChat('API Chat', [model]);

  // Create session with parent_id: null
  session = sessionManager.createSession(sessionId, chatId, firstUserMessage);
  isNewSession = true;
}
```

#### Continuation
```javascript
else {
  // CONTINUATION - Look up by conversation hash
  const firstUserMessage = extractFirstUserMessage(messages);
  const firstAssistantMsg = messages.find(m => m.role === 'assistant');

  // Generate conversation hash: MD5(user + assistant)
  const assistantContent = firstAssistantMsg.content || '';
  const conversationKey = firstUserMessage + assistantContent;
  const conversationHash = sessionManager.generateSessionId(conversationKey);

  // Find existing session
  session = sessionManager.findSessionByConversationHash(conversationHash);

  if (!session) {
    // FALLBACK: Try matching by first user message only
    const allSessions = sessionManager.getAllSessions();
    for (const [sid, sess] of Object.entries(allSessions)) {
      if (sess.first_user_message === firstUserMessage) {
        session = sess;
        sessionId = sid;
        break;
      }
    }
  }

  if (!session) {
    // FALLBACK: Create new session (likely server restart)
    sessionId = crypto.randomUUID();
    const chatId = await qwenClient.createNewChat('API Chat (Recovered)', [model]);
    session = sessionManager.createSession(sessionId, chatId, firstUserMessage);
    isNewSession = true;
  }
}
```

### Session Structure

**Database Table**: `sessions`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- Session UUID or conversation hash
  chat_id TEXT NOT NULL,            -- Qwen chat_id
  parent_id TEXT,                   -- Current parent_id for next message
  first_user_message TEXT NOT NULL, -- First user message content
  conversation_hash TEXT,           -- MD5(firstUser + firstAssistant)
  message_count INTEGER DEFAULT 0,  -- Number of messages in conversation
  created_at INTEGER NOT NULL,      -- Unix timestamp
  last_accessed INTEGER NOT NULL,   -- Unix timestamp
  expires_at INTEGER NOT NULL       -- Unix timestamp
);

CREATE INDEX idx_sessions_conversation_hash ON sessions(conversation_hash);
```

### Session Manager API

**File**: `src/services/session-manager.js`

```javascript
class SessionManager {
  /**
   * Create a new session
   */
  createSession(sessionId, chatId, firstUserMessage) {
    this.repo.createSession(sessionId, chatId, firstUserMessage, this.timeout);
    const session = this.repo.getSession(sessionId);
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,  // null initially
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
  }

  /**
   * Update session with new parent_id from response
   * CRITICAL: Must be called after each message
   */
  updateSession(sessionId, parent_id) {
    this.repo.updateParentId(sessionId, parent_id);
    return true;
  }

  /**
   * Set conversation hash after first assistant response
   */
  setConversationHash(sessionId, firstAssistantMessage) {
    const session = this.repo.getSession(sessionId);
    const conversationKey = session.first_user_message + firstAssistantMessage;
    const conversationHash = generateMD5Hash(conversationKey);
    this.repo.setConversationHash(sessionId, conversationHash);
  }

  /**
   * Find session by conversation hash (for continuations)
   */
  findSessionByConversationHash(conversationHash) {
    const session = this.repo.findByConversationHash(conversationHash);
    if (!session) return null;

    // Update last accessed (keep-alive)
    this.repo.touchSession(session.id, this.timeout);

    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
  }

  /**
   * Clean up expired sessions (runs every 10 minutes)
   */
  cleanup() {
    return this.repo.cleanupExpired();
  }
}
```

### Session Cleanup

**Automatic Cleanup**: Runs every 10 minutes (configurable via `SESSION_CLEANUP_INTERVAL`)

**File**: `src/services/session-manager.js` (lines 246-262)

```javascript
startCleanup() {
  if (this.cleanupTimer) return; // Already running

  this.cleanupTimer = setInterval(() => {
    const cleaned = this.cleanup();
    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`);
    }
  }, this.cleanupInterval);

  // Don't keep process alive just for cleanup timer
  if (this.cleanupTimer.unref) {
    this.cleanupTimer.unref();
  }
}
```

**Stopped During Shutdown**: Timer cleared in graceful shutdown handler

**Session Timeout**: 30 minutes by default (`SESSION_TIMEOUT` env var)

---

## Streaming Response Handling

### SSE (Server-Sent Events)

Qwen Proxy supports full streaming responses using SSE, matching OpenAI's streaming format.

**File**: `src/services/sse-handler.js` (lines 1-273)

### Streaming Flow

```
Client Request (stream: true)
         │
         v
┌─────────────────────────────────────────────────┐
│ 1. Set SSE Headers                              │
│    Content-Type: text/event-stream              │
│    Cache-Control: no-cache                      │
│    Connection: keep-alive                       │
└─────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│ 2. Call Qwen API with stream: true             │
│    Returns readable stream                      │
└─────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│ 3. Process Each Chunk                           │
│    - Parse Qwen SSE format                      │
│    - Transform to OpenAI format                 │
│    - Write to response: data: {...}\n\n        │
└─────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│ 4. Extract parent_id from response.created     │
│    Store for next message in conversation      │
└─────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│ 5. Send [DONE] marker                           │
│    data: [DONE]\n\n                            │
└─────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────┐
│ 6. Update session with parent_id               │
│    Set conversation hash (if new session)       │
│    Log response to database                     │
└─────────────────────────────────────────────────┘
```

### SSEHandler Class

**File**: `src/services/sse-handler.js` (lines 25-273)

```javascript
class SSEHandler {
  constructor(qwenClient, sessionManager) {
    this.qwenClient = qwenClient;
    this.sessionManager = sessionManager;
  }

  /**
   * Stream completion from Qwen API to client
   */
  async streamCompletion(qwenMessage, req, res, sessionId, model, persistence, startTime, isNewSession) {
    // Set SSE headers
    this._setSSEHeaders(res);

    // Create transformer for this stream
    const transformer = new SSETransformer(model);

    // Track client disconnects
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    return new Promise(async (resolve, reject) => {
      try {
        // Call Qwen API with streaming
        const response = await this.qwenClient.sendMessage(qwenMessage, { stream: true });
        const qwenStream = response.data;

        // Process stream data
        qwenStream.on('data', (chunk) => {
          if (clientDisconnected) {
            qwenStream.destroy();
            return;
          }

          try {
            // Transform chunk to OpenAI format
            const transformedChunks = transformer.processChunk(chunk);

            // Send each transformed chunk
            for (const transformedChunk of transformedChunks) {
              if (!clientDisconnected) {
                this._sendChunk(res, transformedChunk);
              }
            }
          } catch (err) {
            console.error('Error processing chunk:', err);
            // Continue streaming (don't fail entire stream for one chunk)
          }
        });

        // Handle stream end
        qwenStream.on('end', async () => {
          if (clientDisconnected) {
            resolve();
            return;
          }

          // Get final chunks (accumulated content + [DONE])
          const finalChunks = transformer.finalize();
          for (const chunk of finalChunks) {
            this._sendChunk(res, chunk);
          }

          // Update session with parent_id
          const parentId = transformer.getParentId();
          if (parentId && sessionId) {
            this.sessionManager.updateSession(sessionId, parentId);
          }

          // Set conversation hash for new sessions
          if (isNewSession && sessionId) {
            const completeResponse = transformer.getCompleteResponse();
            const assistantMessage = completeResponse.choices[0]?.message?.content || '';
            this.sessionManager.setConversationHash(sessionId, assistantMessage);
          }

          // Log response to database
          if (persistence) {
            const duration = Date.now() - startTime;
            const usage = transformer.getUsage();
            const completeResponse = transformer.getCompleteResponse();

            await logResponse(
              persistence.requestDbId,
              sessionId,
              null,  // Qwen raw not stored for streaming
              completeResponse,
              parentId,
              usage,
              duration,
              'stop',
              null
            );
          }

          // Close stream
          res.end();
          resolve();
        });

        // Handle stream errors
        qwenStream.on('error', (err) => {
          if (!clientDisconnected) {
            this._handleStreamError(res, err, sessionId);
          }
          reject(err);
        });

      } catch (error) {
        this._handleStreamError(res, error, sessionId);
        reject(error);
      }
    });
  }

  /**
   * Set SSE headers
   */
  _setSSEHeaders(res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'  // Disable nginx buffering
    });
  }

  /**
   * Send a chunk in SSE format
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
   */
  _handleStreamError(res, error, sessionId) {
    // Log error to database
    const errorId = errorLogger.logStreamError(error, sessionId, {
      endpoint: '/v1/chat/completions',
      error_type: 'stream_error'
    });

    try {
      // Send error in SSE format
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
      // Stream already closed
      try { res.end(); } catch (e) {}
    }
  }
}
```

### SSETransformer Class

**File**: `src/transformers/sse-transformer.js`

Accumulates streaming chunks and transforms them to OpenAI format:

```javascript
class SSETransformer {
  constructor(model) {
    this.model = model;
    this.accumulated = '';    // Full response content
    this.parentId = null;     // Extracted from response.created
    this.usage = null;        // Token usage stats
    this.finishReason = null;
  }

  /**
   * Process a chunk from Qwen stream
   * Returns array of OpenAI-formatted chunks to send
   */
  processChunk(chunk) {
    // Parse Qwen SSE: data: {...}
    // Extract delta.content, status, parent_id
    // Transform to OpenAI format
    // Accumulate content
    // Return transformed chunks
  }

  /**
   * Finalize stream
   * Returns final chunks including [DONE]
   */
  finalize() {
    // Return final chunk with complete content
    // Return usage chunk
    // Return [DONE] marker
  }

  /**
   * Get complete response (for persistence)
   */
  getCompleteResponse() {
    return {
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: this.accumulated
        },
        finish_reason: this.finishReason || 'stop'
      }],
      usage: this.usage
    };
  }

  getParentId() { return this.parentId; }
  getUsage() { return this.usage; }
}
```

### Client Disconnect Handling

**File**: `src/services/sse-handler.js` (lines 72-89)

```javascript
// Track if client disconnects
let clientDisconnected = false;

req.on('close', () => {
  clientDisconnected = true;
});

// Check before processing chunks
qwenStream.on('data', (chunk) => {
  if (clientDisconnected) {
    qwenStream.destroy();  // Stop processing Qwen stream
    return;
  }

  // Process chunk...
});

qwenStream.on('end', async () => {
  if (clientDisconnected) {
    resolve();  // Exit cleanly
    return;
  }

  // Finalize stream...
});
```

---

## Database Integration

### Shared Database Architecture

Qwen Proxy **shares the same SQLite database** with provider-router for centralized data management.

**Database Path**: `backend/provider-router/data/provider-router.db`

**Configuration**: `src/config/index.js` (lines 79-84)
```javascript
database: {
  path: process.env.DATABASE_PATH ||
        require('path').join(__dirname, '../../../provider-router/data/provider-router.db'),
  verbose: process.env.DATABASE_VERBOSE === 'true',
  busyTimeout: parseInt(process.env.DATABASE_BUSY_TIMEOUT, 10) || 5000,
}
```

### Database Initialization

**File**: `src/database/index.js` (lines 19-46)

```javascript
async function initializeDatabase() {
  console.log('[Database] Initializing database...');

  try {
    // 1. Connect to database
    connection.connect();

    // 2. Initialize schema (creates tables if needed)
    schema.initializeSchema();

    // 3. Run migrations
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();

    // 4. Clear all sessions on startup
    // This prevents stale session bugs after server restart
    schema.clearAllSessions();

    // 5. Display stats
    const stats = schema.getDatabaseStats();
    console.log('[Database] Database ready:', stats);

    return true;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    throw error;
  }
}
```

**Note**: Sessions are **cleared on startup** to prevent stale session bugs (line 36).

### Database Tables

#### 1. qwen_credentials

Stores Qwen API credentials.

```sql
CREATE TABLE IF NOT EXISTS qwen_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,           -- bx-umidtoken header
  cookies TEXT NOT NULL,          -- Cookie header
  expires_at INTEGER,             -- Unix timestamp (optional)
  created_at INTEGER NOT NULL,    -- Unix timestamp
  updated_at INTEGER NOT NULL     -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_qwen_credentials_expires
  ON qwen_credentials(expires_at);
```

**Managed by**: Provider Router's API (dashboard updates this)

#### 2. sessions

Stores active conversation sessions.

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,              -- Session UUID or conversation hash
  chat_id TEXT NOT NULL,            -- Qwen chat_id
  parent_id TEXT,                   -- Current parent_id for next message
  first_user_message TEXT NOT NULL, -- First user message content
  conversation_hash TEXT,           -- MD5(firstUser + firstAssistant)
  message_count INTEGER DEFAULT 0,  -- Number of messages
  created_at INTEGER NOT NULL,      -- Unix timestamp
  last_accessed INTEGER NOT NULL,   -- Unix timestamp
  expires_at INTEGER NOT NULL       -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_sessions_conversation_hash
  ON sessions(conversation_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions(expires_at);
```

**Managed by**: `SessionRepository`

#### 3. requests

Logs all incoming API requests.

```sql
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,                 -- Session ID (can be null)
  openai_request TEXT NOT NULL,    -- JSON of OpenAI request
  qwen_request TEXT NOT NULL,      -- JSON of transformed Qwen request
  model TEXT NOT NULL,             -- Model used
  stream BOOLEAN DEFAULT 0,        -- Streaming enabled
  timestamp INTEGER NOT NULL,      -- Unix timestamp
  user_id TEXT                     -- User identifier (optional)
);

CREATE INDEX IF NOT EXISTS idx_requests_session_id
  ON requests(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_timestamp
  ON requests(timestamp);
```

**Managed by**: `RequestRepository`

#### 4. responses

Logs all API responses.

```sql
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,     -- Foreign key to requests.id
  session_id TEXT,                 -- Session ID
  qwen_response TEXT,              -- JSON of Qwen response (null for streaming)
  openai_response TEXT NOT NULL,   -- JSON of OpenAI response
  parent_id TEXT,                  -- parent_id from response
  prompt_tokens INTEGER,           -- Input tokens
  completion_tokens INTEGER,       -- Output tokens
  total_tokens INTEGER,            -- Total tokens
  duration_ms INTEGER,             -- Request duration
  finish_reason TEXT,              -- stop, length, tool_calls, error
  error TEXT,                      -- Error message (if failed)
  timestamp INTEGER NOT NULL,      -- Unix timestamp
  FOREIGN KEY (request_id) REFERENCES requests(id)
);

CREATE INDEX IF NOT EXISTS idx_responses_request_id
  ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id
  ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_timestamp
  ON responses(timestamp);
```

**Managed by**: `ResponseRepository`

#### 5. errors

Logs all errors (HTTP and stream errors).

```sql
CREATE TABLE IF NOT EXISTS errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_id TEXT UNIQUE NOT NULL,   -- UUID for error tracking
  error_type TEXT NOT NULL,        -- http_error, stream_error, etc.
  error_message TEXT NOT NULL,     -- Error message
  error_stack TEXT,                -- Stack trace
  severity TEXT DEFAULT 'error',   -- error, warning, critical
  endpoint TEXT,                   -- API endpoint
  method TEXT,                     -- HTTP method
  status_code INTEGER,             -- HTTP status code
  request_body TEXT,               -- Request body (JSON)
  session_id TEXT,                 -- Related session
  request_id INTEGER,              -- Related request
  user_id TEXT,                    -- User identifier
  timestamp INTEGER NOT NULL,      -- Unix timestamp
  resolved BOOLEAN DEFAULT 0,      -- Resolution status
  resolved_at INTEGER,             -- Resolution timestamp
  resolution_notes TEXT            -- Resolution notes
);

CREATE INDEX IF NOT EXISTS idx_errors_timestamp
  ON errors(timestamp);
CREATE INDEX IF NOT EXISTS idx_errors_error_type
  ON errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_severity
  ON errors(severity);
CREATE INDEX IF NOT EXISTS idx_errors_resolved
  ON errors(resolved);
```

**Managed by**: `ErrorRepository`

### Repository Pattern

Qwen Proxy uses a repository pattern for database access.

**File**: `src/database/repositories/session-repository.js`

```javascript
class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions');
  }

  /**
   * Create a new session
   */
  createSession(id, chatId, firstUserMessage, timeout) {
    const now = Date.now();
    const expiresAt = now + timeout;

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, chat_id, parent_id, first_user_message,
        conversation_hash, message_count,
        created_at, last_accessed, expires_at
      ) VALUES (?, ?, NULL, ?, NULL, 0, ?, ?, ?)
    `);

    stmt.run(id, chatId, firstUserMessage, now, now, expiresAt);
  }

  /**
   * Update parent_id (after receiving response)
   */
  updateParentId(id, parentId) {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET parent_id = ?,
          message_count = message_count + 1
      WHERE id = ?
    `);

    stmt.run(parentId, id);
  }

  /**
   * Set conversation hash (after first response)
   */
  setConversationHash(id, conversationHash) {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET conversation_hash = ?
      WHERE id = ?
    `);

    stmt.run(conversationHash, id);
  }

  /**
   * Find session by conversation hash
   */
  findByConversationHash(conversationHash) {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE conversation_hash = ?
      LIMIT 1
    `);

    return stmt.get(conversationHash);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpired() {
    const now = Date.now();
    const stmt = this.db.prepare(`
      DELETE FROM sessions
      WHERE expires_at < ?
    `);

    const result = stmt.run(now);
    return result.changes;
  }
}
```

### Persistence Middleware

**File**: `src/middleware/persistence-middleware.js`

Automatically logs requests and responses to database:

```javascript
/**
 * Log request to database
 * Returns persistence data for later response logging
 */
async function logRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
  try {
    const requestRepo = new RequestRepository();
    const requestDbId = requestRepo.create({
      session_id: sessionId,
      openai_request: JSON.stringify(openaiRequest),
      qwen_request: JSON.stringify(qwenRequest),
      model: model,
      stream: stream ? 1 : 0,
      timestamp: Date.now(),
      user_id: null  // Could be extracted from auth
    });

    return { requestDbId };
  } catch (error) {
    console.error('[Persistence] Failed to log request:', error.message);
    return null;
  }
}

/**
 * Log response to database
 */
async function logResponse(requestDbId, sessionId, qwenResponse, openaiResponse, parentId, usage, duration, finishReason, error) {
  try {
    const responseRepo = new ResponseRepository();
    responseRepo.create({
      request_id: requestDbId,
      session_id: sessionId,
      qwen_response: qwenResponse ? JSON.stringify(qwenResponse) : null,
      openai_response: JSON.stringify(openaiResponse),
      parent_id: parentId,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
      duration_ms: duration,
      finish_reason: finishReason,
      error: error,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Persistence] Failed to log response:', error.message);
  }
}

module.exports = { logRequest, logResponse };
```

**Usage in Handler**:

```javascript
// Log request
const persistence = await logRequest(
  sessionId,
  req.body,      // OpenAI request
  qwenPayload,   // Qwen request
  model,
  stream
);

// ... make API call ...

// Log response
await logResponse(
  persistence.requestDbId,
  sessionId,
  qwenResponse.data,
  openaiResponse,
  parentId,
  usage,
  duration,
  finishReason,
  null  // no error
);
```

---

## API Endpoints

### Complete Endpoint List

**File**: `src/server.js` (lines 13-32) - Route registration summary table

| Method | Path | Handler | Auth | Purpose |
|--------|------|---------|------|---------|
| GET | `/health` | health | No | Basic health check |
| GET | `/health/detailed` | detailedHealth | No | Detailed health with metrics |
| GET | `/metrics` | metrics | No | Prometheus metrics |
| GET | `/v1/models` | listModels | Yes | List available models |
| GET | `/v1/models/:model` | getModel | Yes | Get specific model info |
| POST | `/v1/chat/completions` | chatCompletions | Yes | Main chat endpoint |
| POST | `/v1/completions` | completions | Yes | Legacy completions |
| GET | `/v1/sessions` | listSessions | Yes | List all sessions |
| GET | `/v1/sessions/:sessionId` | getSession | Yes | Get session details |
| GET | `/v1/sessions/:sessionId/stats` | getSessionStats | Yes | Get session statistics |
| DELETE | `/v1/sessions/:sessionId` | deleteSession | Yes | Delete session |
| GET | `/v1/requests` | listRequests | Yes | List request history |
| GET | `/v1/requests/:id` | getRequest | Yes | Get request details |
| GET | `/v1/sessions/:sessionId/requests` | getSessionRequests | Yes | Get session requests |
| GET | `/v1/responses` | listResponses | Yes | List response history |
| GET | `/v1/responses/stats` | getResponseStats | Yes | Get usage statistics |
| GET | `/v1/responses/:id` | getResponse | Yes | Get response details |
| GET | `/v1/requests/:requestId/response` | getRequestResponse | Yes | Get request's response |

### 1. Health Endpoints

#### GET /health

Basic health check.

**File**: `src/handlers/health-handler.js` (lines 22-66)

**Authentication**: None required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T16:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "authentication": "ok",           // or "not_configured"
    "errors": "ok"                    // or "degraded"
  }
}
```

**Response** (503 Service Unavailable) - if degraded:
```json
{
  "status": "degraded",
  "timestamp": "2025-11-04T16:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "authentication": "not_configured",
    "errors": "degraded"
  }
}
```

**Health Criteria**:
- **authentication**: Checks if credentials configured (non-blocking)
- **errors**: Degrades if > 100 unresolved errors

#### GET /health/detailed

Detailed health with metrics.

**File**: `src/handlers/health-handler.js` (lines 76-193)

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T16:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "authentication": "ok",
    "sessions": "ok",
    "errors": "ok"
  },
  "metrics": {
    "sessions": {
      "activeSessions": 15,
      "totalCreated": 142,
      "totalCleaned": 23
    },
    "memory": {
      "heapUsed": 45678912,
      "heapTotal": 67108864,
      "rss": 89456123,
      "external": 1234567
    },
    "process": {
      "pid": 12345,
      "uptime": 3600.5,
      "nodeVersion": "v18.16.0",
      "platform": "darwin"
    }
  },
  "errors": {
    "recent_count": 5,
    "unresolved_count": 2,
    "last_error": {
      "error_id": "err_abc123",
      "error_message": "Connection timeout",
      "error_type": "http_error",
      "severity": "error",
      "timestamp": 1730745600000,
      "endpoint": "/v1/chat/completions"
    },
    "statistics": {
      "total": 156,
      "unresolved": 2,
      "by_type": {
        "http_error": 120,
        "stream_error": 36
      },
      "by_severity": {
        "error": 140,
        "warning": 16
      }
    }
  }
}
```

### 2. Models Endpoints

#### GET /v1/models

List all available Qwen models.

**File**: `src/handlers/models-handler.js` (lines 81-122)

**Authentication**: Required (authMiddleware)

**Response**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "created": 1730745600,
      "owned_by": "qwen",
      "permission": [],
      "root": "qwen3-max",
      "parent": null,
      "metadata": {
        "name": "Qwen3 Max",
        "description": "Most powerful Qwen model",
        "capabilities": ["chat", "code", "analysis"],
        "chat_types": ["t2t"],
        "max_context_length": 32768,
        "max_generation_length": 8192,
        "abilities": ["multilingual", "reasoning"],
        "is_active": true,
        "is_visitor_active": true
      }
    },
    // ... more models
  ]
}
```

**Caching**: Cached for 5 minutes (`MODELS_CACHE_DURATION`)

**Error** (401):
```json
{
  "error": {
    "message": "Qwen credentials not configured...",
    "type": "authentication_error",
    "code": "missing_credentials"
  }
}
```

#### GET /v1/models/:model

Get specific model details.

**File**: `src/handlers/models-handler.js` (lines 143-193)

**Authentication**: Required

**Example**: `GET /v1/models/qwen3-max`

**Response**:
```json
{
  "id": "qwen3-max",
  "object": "model",
  "created": 1730745600,
  "owned_by": "qwen",
  "metadata": {
    "name": "Qwen3 Max",
    // ... (same as list response)
  }
}
```

**Error** (404):
```json
{
  "error": {
    "message": "Model 'unknown-model' not found",
    "type": "not_found_error",
    "code": "model_not_found"
  }
}
```

### 3. Chat Completions (Main Endpoint)

#### POST /v1/chat/completions

Main chat endpoint - translates OpenAI requests to Qwen format.

**File**: `src/handlers/chat-completions-handler.js` (lines 175-482)

**Authentication**: Required

**Request Body**:
```json
{
  "model": "qwen3-max",
  "messages": [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

**Response (Non-Streaming)**:
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1730745600,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}
```

**Response (Streaming)**:
```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1730745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1730745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1730745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1730745600,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":15,"completion_tokens":8,"total_tokens":23}}

data: [DONE]
```

**Request Validation**:
- `messages` must be array with at least one user message
- Each message must have `role` and `content` (except assistant with tool_calls)
- Tool messages must have `tool_call_id`
- Returns 400 Bad Request if validation fails

**Error** (400):
```json
{
  "error": {
    "message": "messages must contain at least one user message",
    "type": "invalid_request_error",
    "code": "invalid_request"
  }
}
```

**Error** (401):
```json
{
  "error": {
    "message": "Qwen credentials not configured...",
    "type": "authentication_error",
    "code": "missing_credentials"
  }
}
```

### 4. Session Management Endpoints

#### GET /v1/sessions

List all active sessions.

**Response**:
```json
{
  "object": "list",
  "data": [
    {
      "id": "sess_abc123",
      "chat_id": "chat_xyz789",
      "parent_id": "msg_def456",
      "first_user_message": "Hello!",
      "conversation_hash": "md5_hash",
      "message_count": 5,
      "created_at": 1730745600000,
      "last_accessed": 1730747400000,
      "expires_at": 1730749200000
    }
    // ... more sessions
  ]
}
```

#### GET /v1/sessions/:sessionId

Get session details.

**Response**:
```json
{
  "id": "sess_abc123",
  "chat_id": "chat_xyz789",
  "parent_id": "msg_def456",
  "first_user_message": "Hello!",
  "conversation_hash": "md5_hash",
  "message_count": 5,
  "created_at": 1730745600000,
  "last_accessed": 1730747400000,
  "expires_at": 1730749200000
}
```

#### DELETE /v1/sessions/:sessionId

Delete a session.

**Response**:
```json
{
  "success": true,
  "message": "Session deleted"
}
```

### 5. Metrics Endpoint

#### GET /metrics

Prometheus-compatible metrics.

**File**: `src/handlers/metrics-handler.js`

**Authentication**: None required

**Response** (text/plain):
```
# HELP qwen_proxy_requests_total Total number of requests
# TYPE qwen_proxy_requests_total counter
qwen_proxy_requests_total{method="POST",endpoint="/v1/chat/completions",status="200"} 142

# HELP qwen_proxy_request_duration_seconds Request duration in seconds
# TYPE qwen_proxy_request_duration_seconds histogram
qwen_proxy_request_duration_seconds_bucket{le="0.1"} 45
qwen_proxy_request_duration_seconds_bucket{le="0.5"} 120
qwen_proxy_request_duration_seconds_bucket{le="1.0"} 140
qwen_proxy_request_duration_seconds_bucket{le="+Inf"} 142
qwen_proxy_request_duration_seconds_sum 67.5
qwen_proxy_request_duration_seconds_count 142

# HELP qwen_proxy_active_sessions Active session count
# TYPE qwen_proxy_active_sessions gauge
qwen_proxy_active_sessions 15

# ... more metrics
```

---

## Authentication Flow

### Request-Level Authentication

Authentication is checked **per-request**, not per-server. This allows:
1. Server to start without credentials
2. Credentials to be configured later via dashboard
3. No server restart required after configuration

**File**: `src/middleware/auth-middleware.js` (lines 18-50)

### Authentication Sequence

```
Incoming Request
      │
      v
┌──────────────────────────────────────────┐
│ 1. authMiddleware intercepts request    │
│    (for /v1/* endpoints only)            │
└──────────────────────────────────────────┘
      │
      v
┌──────────────────────────────────────────┐
│ 2. Check auth.isValid()                  │
│    ├─> QwenAuth._getCredentials()        │
│    ├─> Try database first                │
│    └─> Fallback to .env                  │
└──────────────────────────────────────────┘
      │
      ├─────> If Invalid ──────────────────────┐
      │                                         │
      v                                         v
┌──────────────────────────────────────┐  ┌─────────────────────────────┐
│ 3a. Valid: Get headers               │  │ 3b. Invalid: Return 401     │
│     auth.getHeaders()                │  │     {                       │
│     {                                │  │       error: {              │
│       'bx-umidtoken': token,         │  │         message: "...",     │
│       'Cookie': cookies,             │  │         type: "auth_error", │
│       'Content-Type': 'app/json',    │  │         code: "missing..."  │
│       'User-Agent': '...'            │  │       }                     │
│     }                                │  │     }                       │
└──────────────────────────────────────┘  └─────────────────────────────┘
      │
      v
┌──────────────────────────────────────────┐
│ 4. Attach auth to req.qwenAuth           │
│    req.qwenAuth = {                      │
│      headers: {...},                     │
│      token: '...',                       │
│      cookies: '...',                     │
│      userAgent: '...'                    │
│    }                                     │
└──────────────────────────────────────────┘
      │
      v
┌──────────────────────────────────────────┐
│ 5. next() - pass to handler              │
└──────────────────────────────────────────┘
      │
      v
┌──────────────────────────────────────────┐
│ 6. Handler uses req.qwenAuth.headers     │
│    to make Qwen API calls                │
└──────────────────────────────────────────┘
```

### Endpoints Without Authentication

- `GET /health`
- `GET /health/detailed`
- `GET /metrics`

**File**: `src/server.js` (lines 127-129)
```javascript
// Health endpoints (NO AUTH REQUIRED)
app.get('/health', health);
app.get('/health/detailed', detailedHealth);
app.get('/metrics', metrics);
```

### Endpoints With Authentication

All `/v1/*` endpoints require authentication:

**File**: `src/server.js` (lines 136-164)
```javascript
// API routes (REQUIRE AUTH)
app.get('/v1/models', authMiddleware, listModels);
app.get('/v1/models/:model', authMiddleware, getModel);
app.post('/v1/chat/completions', authMiddleware, chatCompletions);
app.post('/v1/completions', authMiddleware, completions);
// ... (all other /v1/* endpoints)
```

---

## Error Handling

### Error Handling Strategy

Qwen Proxy uses a **layered error handling** approach:

1. **Validation Errors**: Caught at request validation (400 Bad Request)
2. **Authentication Errors**: Caught by auth middleware (401 Unauthorized)
3. **API Errors**: Caught by handlers and transformed (500+ status codes)
4. **Stream Errors**: Sent via SSE format (error chunk + [DONE])
5. **Global Errors**: Caught by error middleware (500 Internal Server Error)

### Error Types

**File**: `src/middleware/error-middleware.js`

```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'invalid_request';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'not_found';
  }
}

class QwenAPIError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'QwenAPIError';
    this.statusCode = originalError?.statusCode || 502;
    this.code = 'qwen_api_error';
    this.originalError = originalError;
  }
}

class QwenAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QwenAuthError';
    this.statusCode = 401;
    this.code = 'authentication_error';
  }
}
```

### Global Error Handler

**File**: `src/middleware/error-middleware.js`

```javascript
function errorHandler(err, req, res, next) {
  // Log error to database
  const errorId = errorLogger.logHttpError(err, req, res, {
    endpoint: req.path,
    method: req.method
  });

  // Default to 500 if no status code
  const statusCode = err.statusCode || 500;

  // Build error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal server error',
      type: err.name || 'internal_error',
      code: err.code || 'internal_error',
      error_id: errorId  // Include error_id for tracking
    }
  };

  // Include field for validation errors
  if (err.field) {
    errorResponse.error.field = err.field;
  }

  // Include stack trace in development
  if (config.env === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
```

### Error Logging

**File**: `src/services/error-logger.js`

All errors are logged to the `errors` table for tracking and analysis.

```javascript
class ErrorLogger {
  /**
   * Log HTTP error to database
   */
  static logHttpError(error, req, res, metadata = {}) {
    const errorRepo = new ErrorRepository();
    const errorId = `err_${crypto.randomUUID()}`;

    errorRepo.create({
      error_id: errorId,
      error_type: metadata.error_type || 'http_error',
      error_message: error.message,
      error_stack: error.stack,
      severity: this._determineSeverity(error.statusCode),
      endpoint: metadata.endpoint || req.path,
      method: req.method,
      status_code: error.statusCode || 500,
      request_body: JSON.stringify(req.body),
      session_id: metadata.session_id || null,
      request_id: metadata.request_id || null,
      user_id: metadata.user_id || null,
      timestamp: Date.now(),
      resolved: 0
    });

    return errorId;
  }

  /**
   * Log stream error to database
   */
  static logStreamError(error, sessionId, metadata = {}) {
    const errorRepo = new ErrorRepository();
    const errorId = `err_${crypto.randomUUID()}`;

    errorRepo.create({
      error_id: errorId,
      error_type: 'stream_error',
      error_message: error.message,
      error_stack: error.stack,
      severity: 'error',
      endpoint: metadata.endpoint || null,
      session_id: sessionId,
      timestamp: Date.now(),
      resolved: 0
    });

    return errorId;
  }

  /**
   * Determine severity based on status code
   */
  static _determineSeverity(statusCode) {
    if (!statusCode) return 'error';
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'error';
    return 'warning';
  }
}
```

### Graceful Error Responses

#### Validation Error (400)
```json
{
  "error": {
    "message": "messages must contain at least one user message",
    "type": "ValidationError",
    "code": "invalid_request",
    "field": "messages",
    "error_id": "err_abc123"
  }
}
```

#### Authentication Error (401)
```json
{
  "error": {
    "message": "Qwen credentials not configured. Please configure credentials through the Electron app Settings.",
    "type": "QwenAuthError",
    "code": "authentication_error",
    "error_id": "err_def456"
  }
}
```

#### Not Found Error (404)
```json
{
  "error": {
    "message": "Model 'unknown-model' not found",
    "type": "NotFoundError",
    "code": "not_found",
    "error_id": "err_ghi789"
  }
}
```

#### Qwen API Error (502)
```json
{
  "error": {
    "message": "Qwen API error: Connection timeout",
    "type": "QwenAPIError",
    "code": "qwen_api_error",
    "error_id": "err_jkl012"
  }
}
```

#### Internal Error (500)
```json
{
  "error": {
    "message": "Internal server error",
    "type": "internal_error",
    "code": "internal_error",
    "error_id": "err_mno345",
    "stack": "Error: ...\n    at ..." // (development only)
  }
}
```

### Stream Error Handling

**File**: `src/services/sse-handler.js` (lines 232-269)

Stream errors are sent as SSE chunks:

```javascript
_handleStreamError(res, error, sessionId) {
  // Log error to database
  const errorId = errorLogger.logStreamError(error, sessionId, {
    endpoint: '/v1/chat/completions',
    error_type: 'stream_error'
  });

  try {
    // Send error in SSE format
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
    // Stream already closed
    try { res.end(); } catch (e) {}
  }
}
```

**Client receives**:
```
data: {"error":{"message":"Connection timeout","type":"stream_error","code":"timeout","error_id":"err_xyz789"}}

data: [DONE]
```

---

## Development vs Production

### Development Mode

**Environment**: `NODE_ENV=development`

**Features**:
- Pretty-printed logs
- Stack traces in error responses
- Verbose database logging (if enabled)
- Debug-level logging

**Start Command**:
```bash
npm run dev
```

Uses nodemon for auto-restart on file changes.

### Production Mode

**Environment**: `NODE_ENV=production`

**Features**:
- Minimal logging (info level)
- No stack traces in responses
- Optimized performance
- PM2 process management (recommended)

**Start Command**:
```bash
npm start
```

**PM2 Configuration** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'qwen-proxy',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Start with PM2**:
```bash
pm2 start ecosystem.config.js
```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

**Build and Run**:
```bash
npm run docker:build
npm run docker:run
```

### Environment-Specific Configuration

**File**: `.env.production.example`

```bash
NODE_ENV=production
PORT=3000

# Production logging
LOG_LEVEL=info
LOG_DIR=/var/log/qwen-proxy

# Production security
CORS_ORIGIN=https://your-app.com
TRUST_PROXY=true

# Production database
DATABASE_PATH=/data/provider-router.db
```

---

## Common Operations

### 1. Starting the Service

#### Standalone (Development)
```bash
cd backend/qwen-proxy
npm install
npm run dev
```

#### Via API Server (Production)
The qwen-proxy is automatically spawned by the API Server when it starts. No manual start required.

**API Server Start**:
```bash
cd backend/api-server
npm start
# API Server will spawn qwen-proxy on port 3000
```

### 2. Configuring Credentials

#### Method 1: Dashboard UI (Recommended)

1. Start the Electron app
2. Open dashboard: `http://localhost:3001`
3. Navigate to **Settings** → **Qwen API**
4. Enter credentials:
   - **bx-umidtoken**: Token from browser DevTools
   - **Cookie**: Cookie string from browser
5. Click **Save**
6. Credentials written to database
7. No restart required

#### Method 2: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env`:
   ```bash
   QWEN_TOKEN=your-bx-umidtoken-here
   QWEN_COOKIES=your-cookie-string-here
   ```

3. Restart service

#### Method 3: Direct Database Insert

For advanced users:

```bash
sqlite3 backend/provider-router/data/provider-router.db

INSERT INTO qwen_credentials (token, cookies, created_at, updated_at)
VALUES ('your-token', 'your-cookies', strftime('%s', 'now'), strftime('%s', 'now'));
```

### 3. Testing the Service

#### Health Check
```bash
curl http://localhost:3000/health
```

**Expected**:
```json
{
  "status": "healthy",
  "uptime": 123,
  "checks": {
    "authentication": "ok",
    "errors": "ok"
  }
}
```

#### List Models
```bash
curl http://localhost:3000/v1/models \
  -H "Authorization: Bearer any-value"
```

**Note**: Authorization header required but value is not validated (uses credentials from database).

#### Chat Completion
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-value" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

#### Streaming Chat Completion
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-value" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

### 4. Viewing Logs

#### Console Logs (Development)
```bash
npm run dev
# Logs appear in console
```

#### File Logs (Production)
```bash
tail -f logs/qwen-proxy.log
tail -f logs/error.log
```

#### PM2 Logs
```bash
pm2 logs qwen-proxy
pm2 logs qwen-proxy --lines 100
```

### 5. Monitoring Sessions

#### List Active Sessions
```bash
curl http://localhost:3000/v1/sessions \
  -H "Authorization: Bearer any-value"
```

#### Get Session Details
```bash
curl http://localhost:3000/v1/sessions/sess_abc123 \
  -H "Authorization: Bearer any-value"
```

#### Delete Session
```bash
curl -X DELETE http://localhost:3000/v1/sessions/sess_abc123 \
  -H "Authorization: Bearer any-value"
```

### 6. Viewing Request/Response History

#### List Requests
```bash
curl http://localhost:3000/v1/requests \
  -H "Authorization: Bearer any-value"
```

#### Get Request Details
```bash
curl http://localhost:3000/v1/requests/123 \
  -H "Authorization: Bearer any-value"
```

#### Get Response Details
```bash
curl http://localhost:3000/v1/responses/123 \
  -H "Authorization: Bearer any-value"
```

#### Get Usage Statistics
```bash
curl http://localhost:3000/v1/responses/stats \
  -H "Authorization: Bearer any-value"
```

**Response**:
```json
{
  "total_requests": 1542,
  "total_tokens": 487293,
  "total_prompt_tokens": 312045,
  "total_completion_tokens": 175248,
  "by_model": {
    "qwen3-max": {
      "requests": 1200,
      "tokens": 400000
    },
    "qwen3-turbo": {
      "requests": 342,
      "tokens": 87293
    }
  },
  "by_date": {
    "2025-11-04": {
      "requests": 145,
      "tokens": 45678
    }
    // ... more dates
  }
}
```

### 7. Database Operations

#### View Credentials
```bash
sqlite3 backend/provider-router/data/provider-router.db

SELECT id, substr(token, 1, 20) as token_preview,
       created_at, updated_at
FROM qwen_credentials
ORDER BY created_at DESC
LIMIT 5;
```

#### View Sessions
```bash
SELECT id, chat_id, parent_id, message_count,
       datetime(created_at/1000, 'unixepoch') as created
FROM sessions
ORDER BY created_at DESC
LIMIT 10;
```

#### View Recent Errors
```bash
SELECT error_id, error_type, error_message, severity,
       datetime(timestamp/1000, 'unixepoch') as time
FROM errors
WHERE resolved = 0
ORDER BY timestamp DESC
LIMIT 20;
```

### 8. Clearing Data

#### Clear All Sessions
```bash
sqlite3 backend/provider-router/data/provider-router.db "DELETE FROM sessions;"
```

**Note**: Sessions are automatically cleared on server startup.

#### Clear Request/Response History
```bash
sqlite3 backend/provider-router/data/provider-router.db "DELETE FROM requests;"
sqlite3 backend/provider-router/data/provider-router.db "DELETE FROM responses;"
```

#### Clear Errors
```bash
sqlite3 backend/provider-router/data/provider-router.db "DELETE FROM errors;"
```

---

## Troubleshooting

### Issue: Server Won't Start

**Symptoms**:
- `[Fatal] Database initialization failed`
- Process exits immediately

**Causes**:
1. Database file locked by another process
2. Missing database directory
3. Insufficient permissions

**Solutions**:

1. Check if database is locked:
   ```bash
   lsof backend/provider-router/data/provider-router.db
   ```

2. Create database directory if missing:
   ```bash
   mkdir -p backend/provider-router/data
   ```

3. Check file permissions:
   ```bash
   chmod 644 backend/provider-router/data/provider-router.db
   chmod 755 backend/provider-router/data
   ```

4. Kill port 3000 processes:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Issue: 401 Unauthorized on All Requests

**Symptoms**:
- All `/v1/*` endpoints return 401
- Health check works fine

**Cause**: Credentials not configured

**Solutions**:

1. Check credential status:
   ```bash
   curl http://localhost:3000/health/detailed
   ```

   Look for:
   ```json
   {
     "checks": {
       "authentication": "not_configured"  // <-- Problem!
     }
   }
   ```

2. Configure credentials via dashboard:
   - Open `http://localhost:3001`
   - Settings → Qwen API
   - Enter credentials and save

3. Or check database:
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "SELECT * FROM qwen_credentials ORDER BY created_at DESC LIMIT 1;"
   ```

4. Verify credentials are valid:
   - Get fresh credentials from browser DevTools
   - Credentials expire after session timeout

### Issue: Empty Responses or Timeouts

**Symptoms**:
- Requests timeout after 60+ seconds
- Responses are empty
- Stream hangs

**Causes**:
1. Invalid credentials (expired session)
2. Qwen API rate limiting
3. Network connectivity issues
4. Parent_id chain broken

**Solutions**:

1. Refresh credentials:
   - Get new credentials from browser
   - Update via dashboard

2. Check Qwen API status:
   ```bash
   curl https://chat.qwen.ai/api/models -I
   ```

3. Clear sessions and retry:
   ```bash
   curl -X DELETE http://localhost:3000/v1/sessions/sess_abc123
   ```

4. Check logs for errors:
   ```bash
   tail -f logs/qwen-proxy.log | grep ERROR
   ```

### Issue: Session Not Found for Continuation

**Symptoms**:
- First message works
- Follow-up messages create new chat instead of continuing
- "Session not found" warnings in logs

**Causes**:
1. Server restarted (sessions cleared)
2. Session expired (30 min timeout)
3. Conversation hash mismatch

**Solutions**:

1. Check if server restarted:
   ```bash
   curl http://localhost:3000/health/detailed
   ```

   Look at `uptime` value.

2. Check session expiration:
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "SELECT id, datetime(expires_at/1000, 'unixepoch') as expires
      FROM sessions WHERE id = 'sess_abc123';"
   ```

3. Check conversation hash:
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "SELECT id, conversation_hash, first_user_message
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 5;"
   ```

4. Increase session timeout:
   ```bash
   # .env
   SESSION_TIMEOUT=3600000  # 1 hour
   ```

### Issue: High Memory Usage

**Symptoms**:
- Memory usage grows over time
- Process killed by OS
- Slowness after extended operation

**Causes**:
1. Session cleanup not running
2. Too many active sessions
3. Memory leak in streaming

**Solutions**:

1. Check active sessions:
   ```bash
   curl http://localhost:3000/health/detailed
   ```

   Look at:
   ```json
   {
     "metrics": {
       "sessions": {
         "activeSessions": 500  // <-- Too high!
       }
     }
   }
   ```

2. Force session cleanup:
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "DELETE FROM sessions WHERE expires_at < strftime('%s', 'now') * 1000;"
   ```

3. Reduce session timeout:
   ```bash
   # .env
   SESSION_TIMEOUT=900000  # 15 minutes
   SESSION_CLEANUP_INTERVAL=300000  # 5 minutes
   ```

4. Restart service:
   ```bash
   pm2 restart qwen-proxy
   ```

### Issue: Streaming Responses Cut Off

**Symptoms**:
- Stream starts but stops midway
- No [DONE] marker received
- Incomplete responses

**Causes**:
1. Client disconnected
2. Network timeout
3. Qwen API stream ended unexpectedly

**Solutions**:

1. Check for client disconnect logs:
   ```bash
   grep "Client disconnected" logs/qwen-proxy.log
   ```

2. Check network timeout settings:
   ```bash
   # .env
   QWEN_TIMEOUT=120000  # 2 minutes
   ```

3. Check error logs:
   ```bash
   curl http://localhost:3000/v1/responses \
     -H "Authorization: Bearer any" | jq '.data[] | select(.error != null)'
   ```

4. Test with curl (no timeout):
   ```bash
   curl --no-buffer http://localhost:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello"}],"stream":true}'
   ```

### Issue: Tool Calling Not Working

**Symptoms**:
- Tool definitions sent but not used
- No XML in Qwen response
- Tools not parsed correctly

**Causes**:
1. Tool calling disabled in config
2. Tool definitions malformed
3. System message not sent on first request

**Solutions**:

1. Check tool calling config:
   ```bash
   # .env
   ENABLE_TOOL_CALLING=true
   ```

2. Verify tool definitions format:
   ```json
   {
     "tools": [
       {
         "type": "function",
         "function": {
           "name": "tool_name",
           "description": "Description",
           "parameters": {
             "type": "object",
             "properties": {...}
           }
         }
       }
     ]
   }
   ```

3. Check if system message was sent:
   ```bash
   # Look at request logs
   sqlite3 backend/provider-router/data/provider-router.db \
     "SELECT qwen_request FROM requests ORDER BY timestamp DESC LIMIT 1;" | jq '.messages[0]'
   ```

   Should include tool XML in system message.

4. Check logs for transformation errors:
   ```bash
   grep "ToolInjection" logs/qwen-proxy.log
   ```

### Issue: Database Locked Errors

**Symptoms**:
- `database is locked` errors
- Requests hang or timeout
- Database operations fail

**Causes**:
1. Multiple processes accessing database
2. Long-running transactions
3. SQLite busy timeout too low

**Solutions**:

1. Check busy timeout:
   ```bash
   # .env
   DATABASE_BUSY_TIMEOUT=10000  # 10 seconds
   ```

2. Check for multiple processes:
   ```bash
   lsof backend/provider-router/data/provider-router.db
   ```

3. Enable WAL mode (Write-Ahead Logging):
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "PRAGMA journal_mode=WAL;"
   ```

4. Restart all services:
   ```bash
   pm2 restart all
   ```

---

## Integration with Provider Router

### Relationship to Provider Router

The Qwen Proxy is a **specialized companion service** to the provider-router, not a replacement.

**Provider Router** (`port 5002`):
- Multi-provider routing (OpenAI, Anthropic, Gemini, **Qwen**, etc.)
- Load balancing and failover
- Cost optimization
- ES Modules architecture

**Qwen Proxy** (`port 3000`):
- Dedicated Qwen translation layer
- Session management with parent_id chains
- Streaming optimization for Qwen
- CommonJS architecture

### Shared Resources

#### 1. Shared Database

Both services use the **same SQLite database**:

```
backend/provider-router/data/provider-router.db
```

**Shared Tables**:
- `qwen_credentials` - Read by qwen-proxy, written by provider-router/dashboard
- (Other tables are qwen-proxy specific)

**Why Shared?**
- Centralized credential management
- Single source of truth
- Dashboard can manage credentials for both services

#### 2. Dashboard Configuration

The Electron app dashboard (`port 3001`) provides UI for:
- Configuring Qwen credentials (writes to `qwen_credentials`)
- Viewing qwen-proxy metrics and logs
- Managing sessions

### Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Electron App                          │
│                       Dashboard (3001)                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               │ Manage Credentials            │ View Metrics
               │ (Write to DB)                 │ (Read APIs)
               v                               v
┌──────────────────────────────────────────────────────────────┐
│              Centralized SQLite Database                     │
│        (provider-router/data/provider-router.db)             │
│                                                              │
│  Tables:                                                     │
│  - qwen_credentials (shared)                                 │
│  - sessions (qwen-proxy)                                     │
│  - requests (qwen-proxy)                                     │
│  - responses (qwen-proxy)                                    │
│  - errors (qwen-proxy)                                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               │ Read Credentials              │ Read Credentials
               │                               │
               v                               v
┌──────────────────────────────┐   ┌──────────────────────────┐
│      Provider Router         │   │       Qwen Proxy         │
│        (port 5002)           │   │       (port 3000)        │
│                              │   │                          │
│  - Multi-provider routing    │   │  - Qwen translation      │
│  - Can route to qwen-proxy   │   │  - Session management    │
│  - ES Modules                │   │  - Streaming             │
└──────────────────────────────┘   └──────────────────────────┘
```

### Use Cases

#### Use Case 1: Direct Qwen Access (via Qwen Proxy)

Client needs **full Qwen-specific features**:
- Session persistence with parent_id chains
- Fine-grained streaming control
- Tool calling with XML transformation

**Flow**:
```
Client → Qwen Proxy (3000) → Qwen API
```

**Example**:
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [...],
    "stream": true
  }'
```

#### Use Case 2: Multi-Provider Routing (via Provider Router)

Client needs **provider flexibility**:
- Route between OpenAI, Anthropic, Gemini, Qwen
- Automatic failover
- Cost optimization

**Flow**:
```
Client → Provider Router (5002) → [OpenAI | Anthropic | Qwen Proxy (3000)] → APIs
```

**Example**:
```bash
curl http://localhost:5002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",  # Provider Router routes to Qwen Proxy
    "messages": [...]
  }'
```

**Note**: Provider Router can route Qwen requests to the qwen-proxy internally.

### CommonJS vs ES Modules

**Qwen Proxy** (CommonJS):
```javascript
// src/index.js
const express = require('express');
const config = require('./config');

module.exports = app;
```

**Provider Router** (ES Modules):
```javascript
// server.js
import express from 'express';
import config from './config.js';

export default app;
```

**Why Different?**
- Qwen Proxy: Developed independently, uses CommonJS for compatibility
- Provider Router: Modern codebase, uses ES Modules

**Interop**: They don't directly `require`/`import` each other - they communicate via:
- Shared database (SQLite)
- HTTP APIs (if provider-router routes to qwen-proxy)
- Dashboard UI (manages both)

### Deployment Considerations

#### Scenario 1: All Services Together (Recommended)

```bash
# Start all services
cd backend
npm run start:all  # Starts API Server, Provider Router, Qwen Proxy, Electron App
```

**Ports**:
- API Server: 5001 (spawns qwen-proxy)
- Provider Router: 5002
- Qwen Proxy: 3000
- Dashboard: 3001

#### Scenario 2: Qwen Proxy Standalone

```bash
# Start only Qwen Proxy
cd backend/qwen-proxy
npm start
```

**Ports**:
- Qwen Proxy: 3000

**Requirements**:
- Credentials configured in database OR `.env`
- Database path correctly set in `config/index.js`

#### Scenario 3: Docker Compose

```yaml
version: '3.8'
services:
  qwen-proxy:
    build: ./backend/qwen-proxy
    ports:
      - "3000:3000"
    volumes:
      - ./backend/provider-router/data:/data
    environment:
      - DATABASE_PATH=/data/provider-router.db

  provider-router:
    build: ./backend/provider-router
    ports:
      - "5002:5002"
    volumes:
      - ./backend/provider-router/data:/data

  api-server:
    build: ./backend/api-server
    ports:
      - "5001:5001"
    depends_on:
      - qwen-proxy
      - provider-router
```

---

## Conclusion

The **Qwen Proxy** is a sophisticated translation layer that bridges the gap between OpenAI's standardized API and Qwen's proprietary message format. Key takeaways:

1. **Architecture**: CommonJS-based Node.js service on port 3000
2. **Core Function**: Transparent OpenAI ↔ Qwen translation with full streaming support
3. **Credentials**: Database-first approach with dashboard UI configuration
4. **Sessions**: Automatic conversation context management via parent_id chains
5. **Database**: Shared SQLite with provider-router for centralized data
6. **Error Handling**: Comprehensive error logging and graceful degradation
7. **Integration**: Works standalone or as part of larger provider-router ecosystem

**For Developers**:
- Study `chat-completions-handler.js` for main request flow
- Review `openai-to-qwen-transformer.js` for 18-field message transformation
- Check `session-manager.js` for conversation hash logic
- Examine `sse-handler.js` for streaming implementation

**For Operators**:
- Configure credentials via dashboard (no restart needed)
- Monitor `/health/detailed` for service health
- Review `errors` table for unresolved issues
- Adjust `SESSION_TIMEOUT` based on usage patterns

**For Users**:
- Use standard OpenAI client libraries (point to port 3000)
- All OpenAI features supported (streaming, tools, etc.)
- Conversations automatically continue via session hash
- 401 errors mean credentials need configuration (dashboard → Settings)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-04
**Maintainer**: See `package.json` author field
