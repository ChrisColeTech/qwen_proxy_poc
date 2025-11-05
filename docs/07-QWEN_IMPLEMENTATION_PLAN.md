# Qwen Proxy Backend - Correct Implementation Plan

**Generated:** 2025-10-29
**Based on:** Documentation in `/mnt/d/Projects/qwen_proxy_opencode/docs/`
**Principle:** 100% compliance with documented Qwen API behavior

---

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | Critical | Pending | Project structure, configuration, and dependencies |
| Phase 2 | Critical | Pending | Core authentication and low-level HTTP client |
| Phase 3 | Critical | Pending | Qwen API type definitions and validators |
| Phase 4 | Critical | Pending | Session management for multi-turn conversations |
| Phase 5 | Critical | Pending | Request transformers (OpenAI → Qwen) |
| Phase 6 | Critical | Pending | Response transformers (Qwen → OpenAI) |
| Phase 7 | Critical | Pending | Models endpoint with real API integration |
| Phase 8 | Critical | Pending | Chat completions handler (streaming & non-streaming) |
| Phase 9 | High | Pending | Request validation middleware |
| Phase 10 | High | Pending | Error handling middleware |
| Phase 11 | High | Pending | Retry logic with exponential backoff |
| Phase 12 | High | Pending | Express server setup and routing |
| Phase 13 | Medium | Pending | Logging infrastructure |
| Phase 14 | Medium | Pending | Metrics and monitoring |
| Phase 15 | Medium | Pending | Health check endpoint |
| Phase 16 | Low | Pending | Legacy completions endpoint adapter |
| Phase 17 | Low | Pending | Graceful shutdown handling |

---

## Project Structure

```
/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router
├── src/
│   ├── api/
│   │   ├── index.js                     # Public API exports
│   │   ├── qwen-auth.js                 # Authentication manager
│   │   ├── qwen-client.js               # Low-level HTTP client
│   │   └── qwen-types.js                # Type definitions and validators
│   ├── config/
│   │   └── index.js                     # Centralized configuration
│   ├── handlers/
│   │   ├── chat-completion-handler.js   # Main chat completions logic
│   │   ├── completions-handler.js       # Legacy endpoint adapter
│   │   ├── health-handler.js            # Health check endpoint
│   │   └── models-handler.js            # Models list/retrieve endpoints
│   ├── middleware/
│   │   ├── error-handler.js             # Express error handler
│   │   └── request-validator.js         # Request validation
│   ├── session/
│   │   ├── session-id-generator.js      # Conversation ID generation
│   │   └── session-manager.js           # Session state tracking
│   ├── transform/
│   │   ├── request-transformer.js       # OpenAI → Qwen
│   │   └── response-transformer.js      # Qwen → OpenAI
│   ├── utils/
│   │   ├── logger.js                    # Logging utility
│   │   ├── metrics.js                   # Prometheus metrics
│   │   └── retry-handler.js             # Retry logic with backoff
│   └── server.js                        # Express app and server
├── .env.example                         # Environment variables template
├── package.json                         # Dependencies and scripts
└── README.md                            # Setup and usage instructions
```

---

## Phase 1: Project Structure and Configuration

**Priority:** Critical

**Goal:** Set up the foundational project structure, dependencies, and centralized configuration system.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/config/index.js` - Load and validate environment variables, export configuration object
- `/mnt/d/Projects/qwen_proxy_opencode/backend/.env.example` - Template showing required environment variables
- `/mnt/d/Projects/qwen_proxy_opencode/backend/package.json` - Dependencies: express, axios, dotenv

**Acceptance Criteria:**

- [ ] Configuration loads from environment with fallback defaults
- [ ] Required variables (QWEN_TOKEN, QWEN_COOKIES) are validated on startup
- [ ] Port, timeout, and other settings are configurable
- [ ] .env.example documents all available options
- [ ] package.json includes all necessary dependencies

**Testing Strategy:**

```bash
# Test configuration loading
node -e "const config = require('./src/config'); console.log(config);"

# Test validation - should fail without credentials
QWEN_TOKEN="" QWEN_COOKIES="" node -e "require('./src/config');"
```

**Key Implementation Details:**

From docs, we need:
- `QWEN_TOKEN` - The `bx-umidtoken` header value
- `QWEN_COOKIES` - Complete Cookie header value
- `PORT` - Server port (default 3000)
- `SESSION_TIMEOUT` - Session inactivity timeout (default 30 minutes)
- `LOG_LEVEL` - Logging level (default 'info')

```javascript
// src/config/index.js structure
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  qwen: {
    token: process.env.QWEN_TOKEN,
    cookies: process.env.QWEN_COOKIES,
    baseURL: 'https://chat.qwen.ai'
  },
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 30 * 60 * 1000,
    cleanupInterval: 10 * 60 * 1000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  security: {
    trustProxy: process.env.TRUST_PROXY === 'true'
  }
};
```

---

## Phase 2: Authentication Manager

**Priority:** Critical

**Goal:** Implement authentication credential management and header generation for Qwen API requests.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/api/qwen-auth.js` - QwenAuth class for credential management

**Integration Points:**

- `src/config/index.js` - Loads credentials (not modified)

**Acceptance Criteria:**

- [ ] QwenAuth loads credentials from config on construction
- [ ] Throws descriptive error if credentials are missing or invalid
- [ ] `getHeaders()` returns correct headers: `bx-umidtoken`, `Cookie`, `Content-Type`, `User-Agent`
- [ ] `isValid()` checks both token and cookies are present
- [ ] Provides token preview method for safe logging (first 20 chars only)

**Testing Strategy:**

```javascript
// Test with valid credentials
const auth = new QwenAuth();
console.log(auth.isValid()); // true
console.log(auth.getHeaders()); // Should include bx-umidtoken and Cookie

// Test with missing credentials
process.env.QWEN_TOKEN = '';
try {
  new QwenAuth(); // Should throw error
} catch (e) {
  console.log('Correctly caught missing credentials');
}
```

**Key Implementation Details:**

Based on `/docs/00-API_REFERENCE.md`:

Required headers for ALL Qwen API calls:
```javascript
{
  'bx-umidtoken': process.env.QWEN_TOKEN,
  'Cookie': process.env.QWEN_COOKIES,
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
```

The `bx-umidtoken` header is REQUIRED for:
- `/api/v2/chats/new` (create chat)
- `/api/v2/chat/completions` (send message)

The `Cookie` header is REQUIRED for:
- `/api/models` (list models)

---

## Phase 3: Qwen API Type Definitions

**Priority:** Critical

**Goal:** Create type definitions and validators for Qwen API payloads that match documentation EXACTLY.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/api/qwen-types.js` - Type creators and validators

**Acceptance Criteria:**

- [ ] `createChatPayload()` creates new chat payload matching `/docs/payloads/new_chat/request.sh`
- [ ] `createQwenMessage()` creates message object with ALL fields from `/docs/payloads/completion/request.sh`
- [ ] `createCompletionPayload()` creates completion request with all required fields
- [ ] `parseSSEChunk()` parses Qwen's SSE format from `/docs/payloads/completion/streaming_response.md`
- [ ] `validateParentId()` ensures parent_id is null or valid UUID string
- [ ] All field names match documentation exactly (snake_case for Qwen)

**Testing Strategy:**

```javascript
// Test message creation
const msg = createQwenMessage({
  fid: 'test-uuid',
  parentId: null,
  role: 'user',
  content: 'Hello',
  models: ['qwen3-max']
});

// Verify all required fields exist
assert(msg.fid === 'test-uuid');
assert(msg.parent_id === null);
assert(msg.parentId === null); // Both formats
assert(msg.feature_config.thinking_enabled === false);
assert(msg.feature_config.output_schema === 'phase');
assert(msg.extra.meta.subChatType === 't2t');
```

**Key Implementation Details:**

From `/docs/payloads/completion/request.sh`, a complete message MUST include:

```javascript
{
  fid: "8fc623f2-b790-4a73-a310-0c02ec766eb8",         // UUID
  parentId: "5594c51b-9b37-4f12-83f4-a17cb7d56ec7",    // UUID or null
  childrenIds: ["a45abf5c-0fbd-4e18-891e-83f020da7aee"], // Array (can be empty)
  role: "user",                                         // "user" or "assistant"
  content: "explain youtube to an alien",               // String
  user_action: "chat",                                  // Always "chat"
  files: [],                                            // Array (usually empty)
  timestamp: 1761484568,                                // Unix timestamp (seconds)
  models: ["qwen3-max"],                                // Array of model IDs
  chat_type: "t2t",                                     // "t2t" for text-to-text
  feature_config: {
    thinking_enabled: false,                            // Boolean
    output_schema: "phase"                              // String
  },
  extra: {
    meta: {
      subChatType: "t2t"                                // Matches chat_type
    }
  },
  sub_chat_type: "t2t",                                 // Duplicate of chat_type
  parent_id: "5594c51b-9b37-4f12-83f4-a17cb7d56ec7"    // Duplicate of parentId
}
```

Note: Both `parentId` and `parent_id` are included (Qwen's API uses both).

From `/docs/payloads/new_chat/request.sh`:

```javascript
{
  title: "New Chat",
  models: ["qwen3-max"],
  chat_mode: "guest",
  chat_type: "t2t",
  timestamp: 1761484022218  // Unix timestamp in MILLISECONDS
}
```

From `/docs/payloads/completion/streaming_response.md`, SSE format is:

```
data: {"response.created":{"chat_id": "...", "parent_id": "...", "response_id":"..."}}

data: {"choices": [{"delta": {"role": "assistant", "content": "text", "phase": "answer", "status": "typing"}}], "usage": {...}}

data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished", "phase": "answer"}}]}
```

---

## Phase 4: Session Manager

**Priority:** Critical

**Goal:** Implement session state management for tracking multi-turn conversations with Qwen.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/session/session-manager.js` - SessionManager class
- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/session/session-id-generator.js` - Conversation ID generator

**Acceptance Criteria:**

- [ ] `createSession(conversationId, chatId)` stores new session
- [ ] `getSession(conversationId)` retrieves existing session
- [ ] `updateParentId(conversationId, parentId)` updates after each response
- [ ] Sessions track: chatId, parentId, createdAt, lastAccessed
- [ ] Automatic cleanup of expired sessions based on timeout
- [ ] `generateConversationId(messages)` creates stable hash from first user message
- [ ] Provides metrics: active sessions, total created, total cleaned

**Testing Strategy:**

```javascript
const manager = new SessionManager({ sessionTimeout: 1000 });

// Create session
const session = manager.createSession('conv-123', 'chat-456');
assert(session.chatId === 'chat-456');
assert(session.parentId === null);

// Update parent_id
manager.updateParentId('conv-123', 'parent-789');
const updated = manager.getSession('conv-123');
assert(updated.parentId === 'parent-789');

// Test cleanup
setTimeout(() => {
  const count = manager.cleanup();
  assert(count === 1); // Should clean up expired session
}, 1500);
```

**Key Implementation Details:**

Session lifecycle:
1. First request → Generate conversation_id from first user message
2. Create Qwen chat → Get chat_id, store in session
3. Send first message → parent_id is null
4. Receive response → Extract parent_id from `response.created` chunk
5. Update session with parent_id
6. Next request → Use stored chat_id and parent_id
7. After 30 min inactivity → Cleanup removes session

Conversation ID generation (stable across requests with same starting message):
```javascript
function generateConversationId(messages) {
  // Find first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) {
    throw new Error('No user message found');
  }

  // Create MD5 hash of content
  return crypto.createHash('md5')
    .update(firstUserMessage.content)
    .digest('hex');
}
```

---

## Phase 5: Request Transformers

**Priority:** Critical

**Goal:** Transform OpenAI chat completion requests to Qwen API format.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/transform/request-transformer.js` - OpenAI → Qwen transformation

**Integration Points:**

- `src/api/qwen-types.js` - Uses createQwenMessage, createCompletionPayload (not modified)
- `src/session/session-manager.js` - Reads session.chatId and session.parentId (not modified)

**Acceptance Criteria:**

- [ ] `extractLastMessage(messages)` gets the most recent message
- [ ] `formatQwenMessage(message, parentId)` creates Qwen message structure
- [ ] `transformToQwenRequest(messages, session)` creates complete payload
- [ ] `transformToQwenRequestNonStreaming()` same but with stream: false
- [ ] Handles first message (parentId: null) and follow-ups correctly
- [ ] Uses session.chatId for chat_id field
- [ ] Uses session.parentId for parent_id field

**Testing Strategy:**

```javascript
// Test transformation
const openAIMessages = [
  { role: 'system', content: 'You are helpful' },
  { role: 'user', content: 'Hello' }
];

const session = { chatId: 'chat-123', parentId: null };
const payload = transformToQwenRequest(openAIMessages, session);

// Verify structure
assert(payload.chat_id === 'chat-123');
assert(payload.parent_id === null);
assert(payload.stream === true);
assert(payload.incremental_output === true);
assert(payload.messages.length === 1); // Only last message
assert(payload.messages[0].content === 'Hello');
assert(payload.messages[0].role === 'user');
```

**Key Implementation Details:**

Key transformation rules:

1. **Only send last message** - Qwen maintains context server-side via parent_id chain
2. **Must include ALL message fields** - See Phase 3 for complete structure
3. **First message has parent_id: null** - Subsequent messages use parent_id from previous response
4. **Timestamp in seconds** - Not milliseconds (different from chat creation)
5. **Always set incremental_output: true** - Required for streaming

Example transformation:

OpenAI input:
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ]
}
```

Qwen output:
```json
{
  "stream": true,
  "incremental_output": true,
  "chat_id": "c8c98d85-9175-4495-a851-0ff5ae3a6f2a",
  "chat_mode": "guest",
  "model": "qwen3-max",
  "parent_id": "previous-response-id",
  "messages": [{
    "fid": "new-uuid",
    "parentId": "previous-response-id",
    "childrenIds": [],
    "role": "user",
    "content": "How are you?",
    "user_action": "chat",
    "files": [],
    "timestamp": 1761484568,
    "models": ["qwen3-max"],
    "chat_type": "t2t",
    "feature_config": {
      "thinking_enabled": false,
      "output_schema": "phase"
    },
    "extra": {
      "meta": {
        "subChatType": "t2t"
      }
    },
    "sub_chat_type": "t2t",
    "parent_id": "previous-response-id"
  }],
  "timestamp": 1761484568
}
```

---

## Phase 6: Response Transformers

**Priority:** Critical

**Goal:** Transform Qwen API responses to OpenAI-compatible format.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/transform/response-transformer.js` - Qwen → OpenAI transformation

**Acceptance Criteria:**

- [ ] `transformToOpenAIChunk(qwenChunk)` converts streaming chunks
- [ ] `transformToOpenAICompletion(content, usage)` creates non-streaming response
- [ ] `extractParentId(qwenResponse)` gets parent_id for session update
- [ ] `extractUsage(qwenResponse)` converts usage format
- [ ] `createFinalChunk(finishReason)` creates end-of-stream marker
- [ ] `createUsageChunk(usage)` creates usage info chunk
- [ ] `hasContent(qwenChunk)` checks if chunk contains text to send

**Testing Strategy:**

```javascript
// Test chunk transformation
const qwenChunk = {
  choices: [{
    delta: {
      role: 'assistant',
      content: 'Hello',
      phase: 'answer',
      status: 'typing'
    }
  }],
  usage: {
    input_tokens: 10,
    output_tokens: 5
  }
};

const openAIChunk = transformToOpenAIChunk(qwenChunk);
assert(openAIChunk.object === 'chat.completion.chunk');
assert(openAIChunk.choices[0].delta.content === 'Hello');
assert(openAIChunk.choices[0].delta.role === 'assistant');
```

**Key Implementation Details:**

Qwen streaming chunk format (from docs):
```json
{
  "choices": [
    {
      "delta": {
        "role": "assistant",
        "content": "text",
        "phase": "answer",
        "status": "typing"
      }
    }
  ],
  "usage": {
    "input_tokens": 33,
    "output_tokens": 1,
    "total_tokens": 34,
    "input_tokens_details": {"text_tokens": 33},
    "output_tokens_details": {"text_tokens": 1},
    "cached_tokens": 0
  }
}
```

OpenAI streaming chunk format (output):
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion.chunk",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "delta": {
        "role": "assistant",
        "content": "text"
      },
      "finish_reason": null
    }
  ]
}
```

Special chunks:

1. **First chunk** in Qwen stream:
```json
data: {"response.created":{"chat_id": "...", "parent_id": "...", "response_id":"..."}}
```
- Extract parent_id from this
- Don't send to client
- Store for session update

2. **Final chunk** in Qwen stream:
```json
data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished", "phase": "answer"}}]}
```
- Detect by status: "finished"
- Send OpenAI final chunk with finish_reason: "stop"

3. **Usage chunk** (after final chunk):
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion.chunk",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [],
  "usage": {
    "prompt_tokens": 33,
    "completion_tokens": 838,
    "total_tokens": 871
  }
}
```

---

## Phase 7: Models Endpoint with Real API Integration

**Priority:** Critical

**Goal:** Implement `/v1/models` endpoint that ACTUALLY calls Qwen API and transforms the response.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/handlers/models-handler.js` - Models list and retrieve handlers

**Integration Points:**

- `src/api/qwen-auth.js` - Uses auth.getHeaders() (not modified)
- `src/utils/logger.js` - Logs API calls (not modified)

**Acceptance Criteria:**

- [ ] `listModels()` calls `https://chat.qwen.ai/api/models` with Cookie header
- [ ] Transforms Qwen's response to OpenAI format
- [ ] Includes model capabilities in metadata field
- [ ] `retrieveModel(model)` calls API and returns single model or 404
- [ ] Handles API errors gracefully
- [ ] Caches model list for 5 minutes to reduce API calls
- [ ] Returns real-time model availability

**Testing Strategy:**

```bash
# Test models list
curl http://localhost:3001/v1/models

# Should return:
# - Real model list from Qwen
# - Each model has capabilities, chat_types, context length
# - OpenAI-compatible format

# Test model retrieval
curl http://localhost:3001/v1/models/qwen3-max

# Should return specific model or 404
```

**Key Implementation Details:**

From `/docs/payloads/models/response.json`, Qwen returns:

```json
{
  "data": [
    {
      "id": "qwen3-max",
      "name": "Qwen3-Max",
      "object": "model",
      "owned_by": "qwen",
      "info": {
        "meta": {
          "capabilities": {
            "vision": true,
            "document": true,
            "video": true,
            "audio": true,
            "citations": true
          },
          "max_context_length": 262144,
          "max_generation_length": 32768,
          "chat_type": ["t2t", "t2v", "t2i", ...],
          "description": "Qwen3-Max is the most advanced..."
        }
      }
    }
  ]
}
```

Transform to OpenAI format:

```javascript
async function listModels(req, res, next) {
  try {
    // Cache check
    if (modelsCache && Date.now() - modelsCache.timestamp < 5 * 60 * 1000) {
      return res.json(modelsCache.data);
    }

    // CALL REAL API
    const response = await axios.get(
      'https://chat.qwen.ai/api/models',
      {
        headers: {
          'Cookie': auth.cookies,
          'User-Agent': 'Mozilla/5.0 ...'
        }
      }
    );

    // TRANSFORM to OpenAI format
    const openAIModels = {
      object: 'list',
      data: response.data.data
        .filter(model => model.info.is_active)  // Only active models
        .map(qwenModel => ({
          id: qwenModel.id,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: qwenModel.owned_by,
          permission: [],
          root: qwenModel.id,
          parent: null,
          metadata: {
            name: qwenModel.name,
            description: qwenModel.info.meta.description,
            capabilities: qwenModel.info.meta.capabilities,
            chat_types: qwenModel.info.meta.chat_type,
            max_context_length: qwenModel.info.meta.max_context_length,
            max_generation_length: qwenModel.info.meta.max_generation_length,
            abilities: qwenModel.info.meta.abilities
          }
        }))
    };

    // Cache result
    modelsCache = {
      data: openAIModels,
      timestamp: Date.now()
    };

    res.json(openAIModels);
  } catch (error) {
    logger.error('Failed to fetch models from Qwen API', {
      error: error.message,
      status: error.response?.status
    });
    next(error);
  }
}
```

---

## Phase 8: Chat Completions Handler

**Priority:** Critical

**Goal:** Implement the main `/v1/chat/completions` endpoint that orchestrates the entire flow.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/handlers/chat-completion-handler.js` - Main handler
- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/api/qwen-client.js` - Low-level HTTP client for Qwen API

**Integration Points:**

- `src/api/qwen-auth.js` - Uses for authentication (not modified)
- `src/session/session-manager.js` - Creates/retrieves sessions (not modified)
- `src/session/session-id-generator.js` - Generates conversation IDs (not modified)
- `src/transform/request-transformer.js` - Transforms requests (not modified)
- `src/transform/response-transformer.js` - Transforms responses (not modified)
- `src/api/qwen-types.js` - Uses type creators (not modified)

**Acceptance Criteria:**

- [ ] Handles both streaming and non-streaming requests
- [ ] Creates new Qwen chat for new conversations
- [ ] Reuses existing chat_id for follow-up messages
- [ ] Updates session.parentId after each response
- [ ] Streams OpenAI-format chunks in real-time
- [ ] Sends proper SSE format: `data: {...}\n\n`
- [ ] Sends `data: [DONE]\n\n` at end
- [ ] Handles errors and passes to error middleware
- [ ] Logs all API calls and timing

**Testing Strategy:**

```bash
# Test non-streaming
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'

# Test streaming
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true
  }'

# Test multi-turn
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "My name is Alice"},
      {"role": "assistant", "content": "Hello Alice!"},
      {"role": "user", "content": "What is my name?"}
    ]
  }'
# Should remember "Alice"
```

**Key Implementation Details:**

Complete flow:

1. **Request arrives**
   ```javascript
   POST /v1/chat/completions
   { model: "qwen3-max", messages: [...], stream: true }
   ```

2. **Generate conversation ID**
   ```javascript
   const conversationId = generateConversationId(messages);
   ```

3. **Get or create session**
   ```javascript
   let session = sessionManager.getSession(conversationId);
   if (!session) {
     const chatId = await qwenClient.createChat('API Chat');
     session = sessionManager.createSession(conversationId, chatId);
   }
   ```

4. **Transform request**
   ```javascript
   const qwenPayload = transformToQwenRequest(messages, session);
   ```

5. **Send to Qwen API**
   ```javascript
   const response = await axios.post(
     `https://chat.qwen.ai/api/v2/chat/completions?chat_id=${session.chatId}`,
     qwenPayload,
     {
       headers: auth.getHeaders(),
       responseType: 'stream'
     }
   );
   ```

6. **Stream response**
   ```javascript
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Connection', 'keep-alive');

   let newParentId = null;

   response.data.on('data', (chunk) => {
     const lines = chunk.toString().split('\n');
     for (const line of lines) {
       if (line.startsWith('data:')) {
         const data = JSON.parse(line.substring(5));

         // Extract parent_id from first chunk
         if (data['response.created']) {
           newParentId = data['response.created'].parent_id;
           continue; // Don't send this chunk to client
         }

         // Transform and send content chunks
         if (data.choices?.[0]?.delta?.content) {
           const openAIChunk = transformToOpenAIChunk(data);
           res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);
         }
       }
     }
   });

   response.data.on('end', () => {
     // Send final chunk
     const finalChunk = createFinalChunk('stop');
     res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);

     // Send [DONE]
     res.write('data: [DONE]\n\n');
     res.end();

     // Update session
     if (newParentId) {
       sessionManager.updateParentId(conversationId, newParentId);
     }
   });
   ```

QwenClient methods:

```javascript
class QwenClient {
  async createChat(title, model = 'qwen3-max') {
    const payload = createChatPayload(title, model);
    const response = await axios.post(
      'https://chat.qwen.ai/api/v2/chats/new',
      payload,
      { headers: this.auth.getHeaders() }
    );
    return response.data.data.id; // Return chat_id
  }

  async sendMessage({ chatId, parentId, message, stream = true }) {
    const messageId = crypto.randomUUID();
    const qwenMessage = createQwenMessage({
      fid: messageId,
      parentId,
      role: message.role,
      content: message.content,
      models: ['qwen3-max']
    });

    const payload = createCompletionPayload({
      chatId,
      parentId,
      message: qwenMessage,
      stream
    });

    return await axios.post(
      `https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`,
      payload,
      {
        headers: this.auth.getHeaders(),
        responseType: stream ? 'stream' : 'json'
      }
    );
  }
}
```

---

## Phase 9: Request Validation Middleware

**Priority:** High

**Goal:** Validate incoming requests before processing to catch errors early.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/middleware/request-validator.js` - Express middleware

**Acceptance Criteria:**

- [ ] Validates `messages` array is present and non-empty
- [ ] Validates each message has `role` and `content`
- [ ] Validates `role` is one of: 'system', 'user', 'assistant'
- [ ] Validates `model` is a string (if provided)
- [ ] Validates `stream` is boolean (if provided)
- [ ] Returns 400 with clear error message for invalid requests
- [ ] Passes valid requests to next middleware

**Testing Strategy:**

```bash
# Invalid: missing messages
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-max"}'
# Expected: 400 error

# Invalid: empty messages array
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-max", "messages": []}'
# Expected: 400 error

# Invalid: message missing content
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-max", "messages": [{"role": "user"}]}'
# Expected: 400 error

# Valid
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hi"}]}'
# Expected: 200 or SSE stream
```

**Key Implementation Details:**

```javascript
function requestValidator(req, res, next) {
  const { messages, model, stream } = req.body;

  // Validate messages
  if (!messages) {
    return res.status(400).json({
      error: {
        message: 'Missing required field: messages',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'missing_field'
      }
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'messages must be a non-empty array',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'invalid_type'
      }
    });
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!msg.role || !msg.content) {
      return res.status(400).json({
        error: {
          message: `messages[${i}] must have role and content`,
          type: 'invalid_request_error',
          param: `messages[${i}]`,
          code: 'missing_field'
        }
      });
    }

    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({
        error: {
          message: `messages[${i}].role must be 'system', 'user', or 'assistant'`,
          type: 'invalid_request_error',
          param: `messages[${i}].role`,
          code: 'invalid_value'
        }
      });
    }
  }

  // Validate stream type
  if (stream !== undefined && typeof stream !== 'boolean') {
    return res.status(400).json({
      error: {
        message: 'stream must be a boolean',
        type: 'invalid_request_error',
        param: 'stream',
        code: 'invalid_type'
      }
    });
  }

  next();
}
```

---

## Phase 10: Error Handling Middleware

**Priority:** High

**Goal:** Centralized error handling that catches all errors and returns OpenAI-compatible error responses.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/middleware/error-handler.js` - Express error middleware

**Acceptance Criteria:**

- [ ] Catches all unhandled errors
- [ ] Returns OpenAI-compatible error format
- [ ] Distinguishes between auth errors, API errors, validation errors
- [ ] Logs errors with full context
- [ ] Returns appropriate HTTP status codes
- [ ] Doesn't leak sensitive information

**Testing Strategy:**

```bash
# Test auth error (invalid credentials)
QWEN_TOKEN="invalid" node src/server.js
# Should fail on startup with clear message

# Test API error (network issue)
# Disconnect internet and make request
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}]}'
# Expected: 502 Bad Gateway with error details

# Test validation error
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request
```

**Key Implementation Details:**

```javascript
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    type: err.constructor.name,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Auth errors
  if (err.name === 'QwenAuthError') {
    return res.status(401).json({
      error: {
        message: err.message,
        type: 'authentication_error',
        code: 'invalid_credentials'
      }
    });
  }

  // API errors
  if (err.name === 'QwenAPIError') {
    return res.status(err.statusCode || 502).json({
      error: {
        message: err.message,
        type: 'upstream_error',
        code: 'qwen_api_error'
      }
    });
  }

  // Session errors
  if (err.name === 'SessionError') {
    return res.status(500).json({
      error: {
        message: 'Session error: ' + err.message,
        type: 'server_error',
        code: 'session_error'
      }
    });
  }

  // Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(502).json({
      error: {
        message: 'Unable to connect to Qwen API',
        type: 'connection_error',
        code: 'upstream_unavailable'
      }
    });
  }

  // Generic error
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'server_error',
      code: 'internal_error'
    }
  });
}
```

Custom error classes:

```javascript
class QwenAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QwenAuthError';
  }
}

class QwenAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'QwenAPIError';
    this.statusCode = statusCode;
  }
}

class SessionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionError';
  }
}
```

---

## Phase 11: Retry Logic with Exponential Backoff

**Priority:** High

**Goal:** Implement robust retry logic for transient failures when calling Qwen API.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/utils/retry-handler.js` - Retry utility

**Acceptance Criteria:**

- [ ] `withRetry(fn, options)` wraps async functions with retry logic
- [ ] Implements exponential backoff (1s, 2s, 4s, ...)
- [ ] Configurable max retries (default 3)
- [ ] Distinguishes retryable errors (network, 5xx) from non-retryable (4xx, auth)
- [ ] Calls onRetry callback with attempt number
- [ ] Doesn't retry on auth errors or client errors

**Testing Strategy:**

```javascript
// Test successful retry after failure
let attempts = 0;
const fn = async () => {
  attempts++;
  if (attempts < 3) throw new Error('ECONNREFUSED');
  return 'success';
};

const result = await withRetry(fn, { maxRetries: 3 });
assert(result === 'success');
assert(attempts === 3);

// Test non-retryable error
const authError = new QwenAuthError('Invalid token');
try {
  await withRetry(() => { throw authError; }, { maxRetries: 3 });
} catch (e) {
  assert(e === authError);
  // Should not retry auth errors
}
```

**Key Implementation Details:**

```javascript
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // Don't retry after max attempts
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function isNonRetryableError(error) {
  // Don't retry auth errors
  if (error instanceof QwenAuthError) return true;

  // Don't retry 4xx errors (client errors)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return true;
  }

  // Retry everything else (network, 5xx, etc.)
  return false;
}
```

Usage in handlers:

```javascript
const chatId = await withRetry(
  async () => await qwenClient.createChat('API Chat'),
  {
    maxRetries: 3,
    onRetry: (attempt, error, delay) => {
      logger.warn('Retrying create chat', { attempt, delay, error: error.message });
    }
  }
);
```

---

## Phase 12: Express Server Setup

**Priority:** High

**Goal:** Set up the Express application with all routes and middleware properly configured.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/server.js` - Main server file

**Integration Points:**

- All handlers (not modified)
- All middleware (not modified)
- Configuration (not modified)

**Acceptance Criteria:**

- [ ] Configures Express app with JSON body parser
- [ ] Registers all OpenAI-compatible routes
- [ ] Registers monitoring routes (health, metrics)
- [ ] Applies middleware in correct order
- [ ] Starts HTTP server on configured port
- [ ] Logs startup information
- [ ] Exports app for testing

**Testing Strategy:**

```bash
# Start server
node src/server.js

# Test all endpoints
curl http://localhost:3001/v1/models
curl http://localhost:3001/health
curl http://localhost:3001/metrics
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

**Key Implementation Details:**

```javascript
const express = require('express');
const config = require('./config');
const chatHandler = require('./handlers/chat-completion-handler');
const completionsHandler = require('./handlers/completions-handler');
const { listModels, retrieveModel } = require('./handlers/models-handler');
const healthHandler = require('./handlers/health-handler');
const requestValidator = require('./middleware/request-validator');
const errorHandler = require('./middleware/error-handler');
const logger = require('./utils/logger');
const { register } = require('./utils/metrics');

const app = express();

// Trust proxy if behind reverse proxy
if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

// Body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// OpenAI-compatible routes
app.get('/v1/models', listModels);
app.get('/v1/models/:model', retrieveModel);
app.post('/v1/chat/completions', requestValidator, chatHandler);
app.post('/v1/completions', completionsHandler);

// Monitoring routes
app.get('/health', healthHandler);
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Error handler (must be last)
app.use(errorHandler);

// Export for testing
module.exports = app;

// Start server if run directly
if (require.main === module) {
  const PORT = config.port;

  app.listen(PORT, () => {
    logger.info('Qwen proxy server started', {
      port: PORT,
      env: config.env,
      endpoints: {
        models: `http://localhost:${PORT}/v1/models`,
        chatCompletions: `http://localhost:${PORT}/v1/chat/completions`,
        health: `http://localhost:${PORT}/health`
      }
    });
  });
}
```

Middleware order is critical:
1. Body parser (express.json)
2. Request logging
3. Route handlers with validation middleware
4. Error handler (last)

---

## Phase 13: Logging Infrastructure

**Priority:** Medium

**Goal:** Set up structured logging for debugging and monitoring.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/utils/logger.js` - Logger utility

**Acceptance Criteria:**

- [ ] Provides structured logging with levels: debug, info, warn, error
- [ ] Includes timestamps in ISO format
- [ ] Supports metadata objects
- [ ] Respects LOG_LEVEL environment variable
- [ ] Pretty prints in development, JSON in production
- [ ] Sanitizes sensitive data (tokens, cookies) from logs

**Testing Strategy:**

```javascript
const logger = require('./utils/logger');

logger.debug('Debug message', { detail: 'value' });
logger.info('Info message');
logger.warn('Warning message', { warning: 'details' });
logger.error('Error message', { error: 'stack trace' });

// Check console output
// Development: colored, pretty-printed
// Production: JSON lines
```

**Key Implementation Details:**

```javascript
const config = require('../config');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;

function log(level, message, metadata = {}) {
  if (LOG_LEVELS[level] < currentLevel) {
    return; // Skip if below current log level
  }

  const timestamp = new Date().toISOString();
  const sanitized = sanitizeMetadata(metadata);

  if (config.env === 'production') {
    // JSON logging for production
    console.log(JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitized
    }));
  } else {
    // Pretty logging for development
    const levelColors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m'
    };
    const color = levelColors[level] || '';
    const reset = '\x1b[0m';

    console.log(
      `${color}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
      Object.keys(sanitized).length > 0 ? sanitized : ''
    );
  }
}

function sanitizeMetadata(metadata) {
  const sanitized = { ...metadata };

  // Remove sensitive fields
  const sensitiveKeys = ['token', 'cookie', 'password', 'auth', 'bx-umidtoken'];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};
```

---

## Phase 14: Metrics and Monitoring

**Priority:** Medium

**Goal:** Expose Prometheus-compatible metrics for monitoring.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/utils/metrics.js` - Metrics definitions

**Acceptance Criteria:**

- [ ] Tracks HTTP request duration (histogram)
- [ ] Tracks HTTP request count by status (counter)
- [ ] Tracks Qwen API calls (counter)
- [ ] Tracks active sessions (gauge)
- [ ] Exposes metrics at /metrics endpoint
- [ ] Uses Prometheus exposition format

**Testing Strategy:**

```bash
# Make some requests
curl http://localhost:3001/v1/models
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'

# Check metrics
curl http://localhost:3001/metrics

# Should see:
# http_request_duration_seconds{method="GET",path="/v1/models",status="200"} ...
# http_requests_total{method="GET",path="/v1/models",status="200"} 1
# qwen_api_calls_total{status="success"} 1
# active_sessions 1
```

**Key Implementation Details:**

```javascript
const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const qwenAPICallsTotal = new promClient.Counter({
  name: 'qwen_api_calls_total',
  help: 'Total number of Qwen API calls',
  labelNames: ['status']
});

const qwenAPIErrorsTotal = new promClient.Counter({
  name: 'qwen_api_errors_total',
  help: 'Total number of Qwen API errors',
  labelNames: ['error_type']
});

const activeSessions = new promClient.Gauge({
  name: 'active_sessions',
  help: 'Number of active sessions'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(qwenAPICallsTotal);
register.registerMetric(qwenAPIErrorsTotal);
register.registerMetric(activeSessions);

module.exports = {
  register,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    qwenAPICallsTotal,
    qwenAPIErrorsTotal,
    activeSessions
  }
};
```

Usage in code:

```javascript
// In server.js
res.on('finish', () => {
  const duration = (Date.now() - start) / 1000;
  metrics.httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
  metrics.httpRequestTotal.labels(req.method, req.path, res.statusCode).inc();
});

// In chat handler
metrics.qwenAPICallsTotal.labels('success').inc();
metrics.activeSessions.set(sessionManager.getSessionCount());

// On error
metrics.qwenAPIErrorsTotal.labels(error.constructor.name).inc();
```

---

## Phase 15: Health Check Endpoint

**Priority:** Medium

**Goal:** Provide a health check endpoint for monitoring and load balancers.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/handlers/health-handler.js` - Health check logic

**Integration Points:**

- `src/api/qwen-auth.js` - Check auth validity (not modified)
- `src/session/session-manager.js` - Get session metrics (not modified)

**Acceptance Criteria:**

- [ ] Returns 200 OK when healthy
- [ ] Returns 503 Service Unavailable when unhealthy
- [ ] Checks authentication credentials are valid
- [ ] Reports uptime, active sessions, memory usage
- [ ] Responds quickly (< 100ms)

**Testing Strategy:**

```bash
# Test healthy
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "authentication": "ok",
    "sessions": "ok"
  },
  "metrics": {
    "activeSessions": 5,
    "totalSessions": 100,
    "memoryUsage": {
      "heapUsed": 50000000,
      "heapTotal": 100000000
    }
  }
}
```

**Key Implementation Details:**

```javascript
const auth = require('../api/qwen-auth');
const sessionManager = require('../handlers/chat-completion-handler').sessionManager;

const startTime = Date.now();

function healthHandler(req, res) {
  try {
    // Check authentication
    const authValid = auth.isValid();

    // Get session metrics
    const sessionMetrics = sessionManager.getMetrics();

    // Get memory usage
    const memUsage = process.memoryUsage();

    // Determine overall health
    const isHealthy = authValid;

    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        authentication: authValid ? 'ok' : 'fail',
        sessions: 'ok'
      },
      metrics: {
        activeSessions: sessionMetrics.activeSessions,
        totalCreated: sessionMetrics.totalCreated,
        totalCleaned: sessionMetrics.totalCleaned,
        memoryUsage: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss
        }
      }
    };

    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}

module.exports = healthHandler;
```

---

## Phase 16: Legacy Completions Endpoint

**Priority:** Low

**Goal:** Support legacy `/v1/completions` endpoint by converting to chat format.

**Files to Create:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/handlers/completions-handler.js` - Legacy adapter

**Integration Points:**

- `src/handlers/chat-completion-handler.js` - Forwards to chat handler (not modified)

**Acceptance Criteria:**

- [ ] Accepts OpenAI completion format: `{ model, prompt, ... }`
- [ ] Converts prompt to chat messages format
- [ ] Forwards to chat completions handler
- [ ] Transforms response back to completion format
- [ ] Supports both streaming and non-streaming

**Testing Strategy:**

```bash
# Test legacy endpoint
curl -X POST http://localhost:3001/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "prompt": "Say hello",
    "stream": false
  }'

# Should return completion format:
{
  "id": "cmpl-...",
  "object": "text_completion",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [
    {
      "text": "Hello!",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {...}
}
```

**Key Implementation Details:**

```javascript
async function completionsHandler(req, res, next) {
  try {
    const { model, prompt, stream = false, ...options } = req.body;

    // Convert prompt to chat messages
    const chatRequest = {
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream,
      ...options
    };

    // Create fake request for chat handler
    req.body = chatRequest;

    if (stream) {
      // For streaming, intercept response and convert format
      const originalWrite = res.write.bind(res);
      res.write = (chunk) => {
        if (chunk.toString().startsWith('data: ')) {
          const data = JSON.parse(chunk.toString().substring(6));

          // Convert chat chunk to completion chunk
          if (data.choices?.[0]?.delta?.content) {
            const completionChunk = {
              id: data.id.replace('chatcmpl-', 'cmpl-'),
              object: 'text_completion',
              created: data.created,
              model: data.model,
              choices: [{
                text: data.choices[0].delta.content,
                index: 0,
                finish_reason: data.choices[0].finish_reason
              }]
            };
            originalWrite(`data: ${JSON.stringify(completionChunk)}\n\n`);
          } else {
            originalWrite(chunk);
          }
        } else {
          originalWrite(chunk);
        }
      };

      // Forward to chat handler
      await chatHandler(req, res, next);
    } else {
      // For non-streaming, intercept response and convert format
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        const completion = {
          id: data.id.replace('chatcmpl-', 'cmpl-'),
          object: 'text_completion',
          created: data.created,
          model: data.model,
          choices: [{
            text: data.choices[0].message.content,
            index: 0,
            finish_reason: data.choices[0].finish_reason
          }],
          usage: data.usage
        };
        originalJson(completion);
      };

      // Forward to chat handler
      await chatHandler(req, res, next);
    }
  } catch (error) {
    next(error);
  }
}
```

---

## Phase 17: Graceful Shutdown

**Priority:** Low

**Goal:** Handle SIGTERM/SIGINT signals for clean shutdown.

**Files to Modify:**

- `/mnt/d/Projects/qwen_proxy_opencode/backend/src/server.js` - Add shutdown handlers

**Acceptance Criteria:**

- [ ] Listens for SIGTERM and SIGINT signals
- [ ] Stops accepting new connections
- [ ] Waits for active requests to complete
- [ ] Cleans up session manager (stops cleanup interval)
- [ ] Exits with code 0 on success
- [ ] Force exits after 10 second timeout

**Testing Strategy:**

```bash
# Start server
node src/server.js &
PID=$!

# Make request
curl http://localhost:3001/v1/models &

# Send shutdown signal
kill -TERM $PID

# Check logs
# Should see: "Received shutdown signal"
# Should see: "Session manager cleaned up"
# Should see: "Graceful shutdown complete"
```

**Key Implementation Details:**

```javascript
// In server.js (at bottom)

if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  });

  const sessionManager = require('./handlers/chat-completion-handler').sessionManager;

  function gracefulShutdown(signal) {
    logger.info('Received shutdown signal', { signal });

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');

      // Cleanup session manager
      if (sessionManager && typeof sessionManager.shutdown === 'function') {
        sessionManager.shutdown();
        logger.info('Session manager cleaned up');
      }

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
```

---

## Testing Strategy

### Unit Tests (Not Required but Recommended)

Each module should be testable in isolation:

```bash
# Install Jest
npm install --save-dev jest

# Test individual modules
npm test src/api/qwen-types.test.js
npm test src/transform/request-transformer.test.js
npm test src/session/session-manager.test.js
```

### Integration Tests

Test the complete flow:

```bash
# Start server
npm start

# Run integration tests
node test/integration.js
```

Integration test script should:
1. Create a new chat
2. Send first message
3. Verify response
4. Send follow-up message
5. Verify context is maintained
6. Test models endpoint
7. Test health endpoint

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] /v1/models returns real Qwen models
- [ ] /v1/models/qwen3-max returns specific model
- [ ] /v1/chat/completions (non-streaming) works
- [ ] /v1/chat/completions (streaming) works
- [ ] Multi-turn conversation maintains context
- [ ] Invalid credentials fail with clear error
- [ ] Invalid request returns 400 with details
- [ ] Network errors trigger retries
- [ ] Sessions expire after timeout
- [ ] /health returns correct status
- [ ] /metrics returns Prometheus format
- [ ] Graceful shutdown works

---

## Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "prom-client": "^15.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

### System Requirements

- Node.js >= 18.0.0
- Valid Qwen credentials (bx-umidtoken and cookies)
- Internet connection to Qwen API
- 512MB RAM minimum
- 1GB disk space

---

## Security Considerations

1. **Credential Protection**
   - Never log full tokens or cookies
   - Store credentials in .env file
   - Add .env to .gitignore
   - Use environment variables in production

2. **Input Validation**
   - Validate all request parameters
   - Sanitize error messages
   - Prevent injection attacks

3. **Rate Limiting** (Future Enhancement)
   - Add express-rate-limit middleware
   - Limit requests per IP/user
   - Prevent abuse

4. **HTTPS in Production**
   - Use reverse proxy (nginx, Caddy)
   - Enable TLS/SSL
   - Force HTTPS redirects

---

## Performance Considerations

1. **Connection Pooling**
   - Axios uses HTTP keep-alive by default
   - Reuse QwenAuth and QwenClient instances

2. **Caching**
   - Cache models list for 5 minutes
   - Reduces API calls

3. **Streaming**
   - Use streaming for long responses
   - Lower latency, better UX

4. **Session Cleanup**
   - Automatic cleanup prevents memory leaks
   - Configurable timeout

---

## Deployment Guide

### Development

```bash
# Clone repository
git clone <repo>
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start server
npm start
```

### Production

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000
export QWEN_TOKEN="your-token"
export QWEN_COOKIES="your-cookies"

# Start with PM2
pm2 start src/server.js --name qwen-proxy

# Or with Docker
docker build -t qwen-proxy .
docker run -p 3000:3000 \
  -e QWEN_TOKEN="$QWEN_TOKEN" \
  -e QWEN_COOKIES="$QWEN_COOKIES" \
  qwen-proxy
```

---

## Monitoring and Observability

1. **Logs**
   - Structured JSON logs in production
   - Ship to centralized logging (Loki, ELK)

2. **Metrics**
   - Scrape /metrics with Prometheus
   - Create Grafana dashboards
   - Alert on errors and latency

3. **Tracing** (Future)
   - Add OpenTelemetry
   - Trace request flow
   - Identify bottlenecks

---

## Future Enhancements

### Phase 18: Advanced Features (Not in Current Plan)

1. **Tool Calling Support**
   - IF Qwen adds official support
   - Transform OpenAI tools to Qwen format
   - Handle tool execution responses

2. **Streaming Transformations**
   - Implement StreamTransformer from `/docs/STREAM_TRANSFORMATION_SOLUTION.md`
   - Wrap plain text in `<attempt_completion>` tags
   - For Roocode compatibility

3. **Model Capability Detection**
   - Read capabilities from Qwen models API
   - Reject requests for unsupported features (vision, audio)
   - Return clear error messages

4. **Request Queuing**
   - Implement queue for rate limiting
   - Prevent overwhelming Qwen API
   - Fair scheduling

5. **Multi-User Support**
   - Per-user authentication
   - Per-user sessions
   - Usage tracking

---

## Summary

This implementation plan provides a complete, phase-by-phase guide to rebuilding the Qwen Proxy backend with **100% compliance** to the documented Qwen API behavior.

Key principles:
1. **Follow documentation exactly** - Every API call, field, and format
2. **No shortcuts** - No hardcoded data, call real APIs
3. **Error handling** - Robust retry logic and error handling
4. **Monitoring** - Comprehensive logging and metrics
5. **Testing** - Verify against real API responses

The plan is ordered by priority (Critical → High → Medium → Low) to ensure the most important functionality is implemented first.

Each phase is self-contained with:
- Clear goals
- Acceptance criteria
- Testing strategy
- Implementation details from documentation

Follow this plan sequentially to build a production-ready Qwen proxy that correctly implements the OpenAI-compatible API while properly calling the Qwen backend.
