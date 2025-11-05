# Qwen Proxy Backend - Implementation Plan

## Work Progression Tracking

| Phase | Status | Description | Files Changed | Integration Points |
|-------|--------|-------------|---------------|-------------------|
| Phase 1 | ✅ Complete | Core API Client | 3 new | dotenv, axios |
| Phase 2 | ✅ Complete | Session Management | 2 new | Phase 1 |
| Phase 3 | ✅ Complete | Request/Response Transformation | 2 new | Phase 1, Phase 2 |
| Phase 4 | ✅ Complete | OpenAI-Compatible Endpoint | 2 new, 1 modified | Phase 1-3, express |
| Phase 5 | ✅ Complete | Error Handling & Resilience | 3 modified | All previous phases |
| Phase 6 | ✅ Complete | Integration Tests | 4 new + README | All previous phases |
| Phase 7 | ✅ Complete | XML Tool Call System | 3 new, 1 modified | Phase 3, Phase 4 |
| Phase 8 | ✅ Complete | Session Lifecycle Management | 1 modified | Phase 2 |
| Phase 9 | ✅ Complete | Logging & Observability | 2 new, 6 modified, 3 tests | All phases |
| Phase 10 | ✅ Complete | Production Configuration & Deployment | 8 new, 4 modified | All phases |

**Legend:**
- 🔲 Not Started
- 🔄 In Progress
- ✅ Complete
- ⚠️ Blocked

---

## Project Structure (Final)

```
backend/
├── src/
│   ├── api/
│   │   ├── qwen-client.js              # Phase 1: Qwen API client
│   │   ├── qwen-types.js               # Phase 1: Type definitions/validation
│   │   └── qwen-auth.js                # Phase 1: Auth header management
│   ├── session/
│   │   ├── session-manager.js          # Phase 2: Session storage & retrieval
│   │   └── session-id-generator.js     # Phase 2: Conversation ID generation
│   ├── transform/
│   │   ├── request-transformer.js      # Phase 3: OpenAI → Qwen format
│   │   └── response-transformer.js     # Phase 3: Qwen → OpenAI format
│   ├── handlers/
│   │   ├── chat-completion-handler.js  # Phase 4: Main request handler
│   │   └── health-handler.js           # Phase 4: Health check endpoint
│   ├── middleware/
│   │   ├── error-middleware.js         # Phase 5: Error handling
│   │   ├── validation-middleware.js    # Phase 5: Request validation
│   │   └── logging-middleware.js       # Phase 9: Request/response logging
│   ├── tools/
│   │   ├── xml-generator.js            # Phase 7: Generate XML tool calls
│   │   ├── xml-detector.js             # Phase 7: Detect if Qwen outputs XML
│   │   └── system-prompts.js           # Phase 7: Tool-aware prompts
│   ├── utils/
│   │   ├── logger.js                   # Phase 9: Winston logger setup
│   │   └── metrics.js                  # Phase 9: Prometheus metrics
│   ├── config/
│   │   ├── default.js                  # Phase 10: Default config
│   │   └── production.js               # Phase 10: Production config
│   └── server.js                       # Phase 4: Express app setup
├── tests/
│   ├── unit/                           # Phase 6
│   │   ├── qwen-client.test.js
│   │   ├── session-manager.test.js
│   │   ├── request-transformer.test.js
│   │   └── response-transformer.test.js
│   ├── integration/                    # Phase 6
│   │   ├── chat-completion.test.js
│   │   ├── multi-turn.test.js
│   │   ├── error-handling.test.js
│   │   └── xml-tool-calls.test.js
│   ├── roocode-integration/            # Existing
│   │   ├── 01-openai-sdk-compatibility.test.js
│   │   ├── 02-sse-format-validation.test.js
│   │   ├── 03-xml-tool-call-parsing.test.js
│   │   └── 04-end-to-end-integration.test.js
│   └── fixtures/                       # Phase 6
│       ├── qwen-responses.js
│       └── openai-requests.js
├── .env.example                        # Phase 10
├── .env                                # Not in git
├── package.json                        # Existing
└── README.md                           # Existing
```

---

## Phase 1: Core API Client

**Priority:** CRITICAL - Foundation for all other phases

**Goal:** Create a reliable, well-tested Qwen API client that handles authentication and low-level API communication.

**Knowledge Applied:**
- From `DISCOVERIES.md`: Required headers, endpoint structure, parent_id behavior
- From tests: First message needs `parent_id: null`, follow-ups use parent_id from response

### Files to Create

#### `src/api/qwen-client.js`
**Purpose:** Low-level Qwen API client
**Responsibilities:**
- Make HTTP requests to Qwen API
- Handle streaming responses
- Manage connection lifecycle

**Key Methods:**
```javascript
class QwenClient {
  constructor(config)           // Initialize with auth config
  async createChat(title)       // POST /api/v2/chats/new
  async sendMessage(opts)       // POST /api/v2/chat/completions
  parseStreamChunk(line)        // Parse SSE data line
}
```

**Dependencies:**
- axios (HTTP client)
- qwen-auth.js (auth headers)
- qwen-types.js (request/response types)

#### `src/api/qwen-types.js`
**Purpose:** Type definitions and validation schemas
**Responsibilities:**
- Define request/response structure
- Validate API payloads
- Document Qwen API contract

**Key Exports:**
```javascript
const QwenMessageSchema = { ... }
const QwenResponseSchema = { ... }
function validateQwenRequest(payload)
function validateQwenResponse(data)
```

**Dependencies:**
- None (pure validation logic)

#### `src/api/qwen-auth.js`
**Purpose:** Authentication header management
**Responsibilities:**
- Load credentials from environment
- Generate auth headers for requests
- Validate credentials are present

**Key Methods:**
```javascript
class QwenAuth {
  constructor()                 // Load from env
  getHeaders()                  // Return auth headers object
  isValid()                     // Check credentials exist
}
```

**Dependencies:**
- dotenv (environment variables)

### Integration Points

**External:**
- `dotenv` - Load environment variables
- `axios` - HTTP client
- Environment variables: `QWEN_TOKEN`, `QWEN_COOKIES`

**Internal:**
- None (foundation phase)

### Acceptance Criteria

- [ ] Can create a new Qwen chat successfully
- [ ] Can send first message with `parent_id: null`
- [ ] Can send follow-up message with parent_id from response
- [ ] Handles streaming responses correctly
- [ ] Throws clear errors for missing credentials
- [ ] Existing Qwen API tests (00-03) still pass

### Testing Strategy

**Unit Tests:**
- Mock axios responses
- Test auth header generation
- Test request payload formatting

**Integration Tests:**
- Use existing tests: `tests/00-diagnostic.test.js` through `tests/03-parent-id-discovery.test.js`
- Verify real API calls work

---

## Phase 2: Session Management

**Priority:** CRITICAL - Required for multi-turn conversations

**Goal:** Implement reliable session tracking that maps OpenAI conversations to Qwen chats.

**Knowledge Applied:**
- From `MULTI_TURN_ANALYSIS.md`: Roocode doesn't send conversation ID
- From research: Hash of first USER message is most reliable approach
- From `DISCOVERIES.md`: Each session needs chat_id and parent_id

### Files to Create

#### `src/session/session-manager.js`
**Purpose:** Store and retrieve session state
**Responsibilities:**
- Store chat_id and parent_id per conversation
- Retrieve session by conversation ID
- Track last access time for cleanup

**Key Methods:**
```javascript
class SessionManager {
  createSession(conversationId, chatId)
  getSession(conversationId)
  updateParentId(conversationId, parentId)
  deleteSession(conversationId)
  getAllSessions()              // For monitoring
}
```

**Storage Structure:**
```javascript
{
  conversationId: {
    chatId: 'uuid',
    parentId: 'uuid' | null,
    lastAccessed: timestamp,
    createdAt: timestamp
  }
}
```

**Dependencies:**
- None (in-memory Map)

#### `src/session/session-id-generator.js`
**Purpose:** Generate conversation IDs from message arrays
**Responsibilities:**
- Find first user message
- Hash message content consistently
- Handle edge cases (no user message)

**Key Methods:**
```javascript
function generateConversationId(messages)
function findFirstUserMessage(messages)
```

**Algorithm:**
```javascript
// From improved proxy-server.js
1. Find first message with role === 'user'
2. Extract { role, content }
3. MD5 hash of JSON.stringify
```

**Dependencies:**
- crypto (built-in)

### Integration Points

**Internal:**
- `src/api/qwen-client.js` - Create new chats, send messages
- `src/api/qwen-types.js` - OpenAI message format

**External:**
- None

### Acceptance Criteria

- [ ] Same conversation ID for messages from same conversation
- [ ] Different conversation IDs for different conversations
- [ ] Handles missing user message gracefully
- [ ] Session persists across multiple requests
- [ ] Can retrieve and update parent_id correctly

### Testing Strategy

**Unit Tests:**
- Test conversation ID generation
- Test session CRUD operations
- Test edge cases (no user message, empty messages)

**Integration Tests:**
- Multi-turn conversation maintains same session
- Different conversations get different sessions

---

## Phase 3: Request/Response Transformation

**Priority:** CRITICAL - Core translation layer

**Goal:** Transform between OpenAI and Qwen formats correctly, applying discoveries from tests.

**Knowledge Applied:**
- From `DISCOVERIES.md`: Qwen message format structure
- From tests: Only send last message to Qwen
- From `MULTI_TURN_ANALYSIS.md`: Extract last message, use parent_id

### Files to Create

#### `src/transform/request-transformer.js`
**Purpose:** Transform OpenAI requests to Qwen format
**Responsibilities:**
- Extract last message from OpenAI message array
- Build Qwen message payload
- Handle first message (parent_id: null) vs follow-ups

**Key Methods:**
```javascript
function transformToQwenRequest(openAIMessages, session) {
  // Extract last message
  const lastMessage = extractLastMessage(openAIMessages)

  // Build Qwen payload
  return {
    stream: true,
    chat_id: session.chatId,
    parent_id: session.parentId,  // null for first message
    messages: [formatQwenMessage(lastMessage)]
  }
}

function extractLastMessage(messages)
function formatQwenMessage(openAIMessage)
```

**Dependencies:**
- `src/api/qwen-types.js` - Qwen message schema
- `crypto` - Generate message UUIDs

#### `src/transform/response-transformer.js`
**Purpose:** Transform Qwen responses to OpenAI format
**Responsibilities:**
- Parse Qwen SSE chunks
- Extract content, parent_id, usage
- Format as OpenAI-compatible SSE or JSON

**Key Methods:**
```javascript
function transformToOpenAIChunk(qwenChunk) {
  // Returns OpenAI-compatible chunk
  return {
    id: 'chatcmpl-xxx',
    object: 'chat.completion.chunk',
    model: 'qwen3-max',
    choices: [{
      delta: { content: qwenChunk.choices[0].delta.content },
      finish_reason: null
    }]
  }
}

function transformToOpenAICompletion(qwenData)
function extractParentId(qwenResponse)
function extractUsage(qwenResponse)
```

**Dependencies:**
- `src/api/qwen-types.js` - Qwen response schema
- `crypto` - Generate completion IDs

### Integration Points

**Internal:**
- `src/api/qwen-client.js` - Send transformed requests
- `src/session/session-manager.js` - Get/update session data

**External:**
- None

### Acceptance Criteria

- [ ] Extracts last message correctly from OpenAI format
- [ ] Builds valid Qwen request payload
- [ ] Transforms Qwen SSE chunks to OpenAI format
- [ ] Extracts parent_id from response correctly
- [ ] Handles usage data transformation
- [ ] Maintains finish_reason and completion markers

### Testing Strategy

**Unit Tests:**
- Test message extraction with various message arrays
- Test Qwen payload generation (first vs follow-up)
- Test SSE chunk transformation
- Test completion response transformation

**Fixtures:**
- Real OpenAI request examples
- Real Qwen response examples (from test discoveries)

---

## Phase 4: OpenAI-Compatible Endpoint

**Priority:** CRITICAL - User-facing API

**Goal:** Implement Express endpoint that ties everything together into OpenAI-compatible API.

**Knowledge Applied:**
- From `ROOCODE_INTEGRATION.md`: Roocode uses standard OpenAI SDK
- From tests: SSE format requirements, streaming behavior
- From discoveries: Session management flow

### Files to Create

#### `src/server.js`
**Purpose:** Express application setup
**Responsibilities:**
- Initialize Express app
- Configure middleware
- Register route handlers
- Start server

**Structure:**
```javascript
const express = require('express')
const chatHandler = require('./handlers/chat-completion-handler')
const healthHandler = require('./handlers/health-handler')

const app = express()
app.use(express.json())

app.post('/v1/chat/completions', chatHandler)
app.get('/health', healthHandler)

module.exports = app
```

**Dependencies:**
- express
- All handlers

#### `src/handlers/chat-completion-handler.js`
**Purpose:** Handle POST /v1/chat/completions requests
**Responsibilities:**
- Validate incoming request
- Get or create session
- Transform request to Qwen format
- Send to Qwen API
- Transform and stream response back
- Update session with new parent_id

**Flow:**
```javascript
async function handleChatCompletion(req, res) {
  // 1. Validate request
  const { messages, stream = false } = req.body

  // 2. Get/create session
  const conversationId = generateConversationId(messages)
  let session = sessionManager.getSession(conversationId)
  if (!session) {
    const chatId = await qwenClient.createChat()
    session = sessionManager.createSession(conversationId, chatId)
  }

  // 3. Transform request
  const qwenRequest = transformToQwenRequest(messages, session)

  // 4. Send to Qwen
  const qwenResponse = await qwenClient.sendMessage(qwenRequest)

  // 5. Transform & stream response
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    // Stream chunks, extract parent_id, update session
  } else {
    // Collect full response, return JSON
  }

  // 6. Update session
  sessionManager.updateParentId(conversationId, extractedParentId)
}
```

**Dependencies:**
- `src/api/qwen-client.js`
- `src/session/session-manager.js`
- `src/session/session-id-generator.js`
- `src/transform/request-transformer.js`
- `src/transform/response-transformer.js`

#### `src/handlers/health-handler.js`
**Purpose:** Health check endpoint
**Responsibilities:**
- Return service status
- Report active sessions count
- Check Qwen credentials configured

**Response:**
```javascript
{
  status: 'ok',
  sessions: 42,
  credentials: 'configured'
}
```

**Dependencies:**
- `src/session/session-manager.js`
- `src/api/qwen-auth.js`

### Files to Modify

#### `proxy-server.js` → Delete or archive
The existing `proxy-server.js` served as a prototype. Replace with modular structure.

### Integration Points

**Internal:**
- All previous phases (1-3)

**External:**
- express (HTTP server)
- Standard HTTP clients (OpenAI SDK, curl, etc.)

### Acceptance Criteria

- [ ] `/v1/chat/completions` endpoint responds
- [ ] Non-streaming requests work
- [ ] Streaming requests work (SSE format)
- [ ] `/health` endpoint returns status
- [ ] Compatible with OpenAI SDK client
- [ ] Matches OpenAI API response structure

### Testing Strategy

**Integration Tests:**
- Use existing `tests/roocode-integration/01-openai-sdk-compatibility.test.js`
- Test with OpenAI SDK client
- Test streaming and non-streaming modes

---

## Phase 5: Error Handling & Resilience

**Priority:** HIGH - Production reliability

**Goal:** Add comprehensive error handling for real-world failures.

**Knowledge Applied:**
- From discoveries: Expired tokens return HTML WAF page
- From experience: Network errors, invalid parent_id, rate limits
- From `IMPLEMENTATION_PLAN.md` (old): Error scenarios identified

### Files to Create

#### `src/middleware/error-middleware.js`
**Purpose:** Centralized error handling
**Responsibilities:**
- Catch all errors from handlers
- Format error responses (OpenAI-compatible)
- Log errors appropriately

**Error Types:**
```javascript
class QwenAuthError extends Error {}
class QwenAPIError extends Error {}
class SessionError extends Error {}
class ValidationError extends Error {}
```

**Handler:**
```javascript
function errorMiddleware(err, req, res, next) {
  if (err instanceof QwenAuthError) {
    return res.status(401).json({
      error: {
        message: 'Qwen credentials invalid or expired',
        type: 'authentication_error'
      }
    })
  }
  // ... handle other error types
}
```

**Dependencies:**
- None (middleware pattern)

#### `src/middleware/validation-middleware.js`
**Purpose:** Request validation
**Responsibilities:**
- Validate required fields present
- Validate message array format
- Validate parameters (model, temperature, etc.)

**Validations:**
```javascript
function validateChatRequest(req, res, next) {
  const { messages, model } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'messages array is required and must not be empty',
        type: 'invalid_request_error'
      }
    })
  }

  // Validate each message has role and content
  // ...

  next()
}
```

**Dependencies:**
- None

#### `src/utils/retry.js`
**Purpose:** Retry logic for transient failures
**Responsibilities:**
- Exponential backoff
- Retry on specific errors (network, 5xx)
- Max retry attempts

**Implementation:**
```javascript
async function withRetry(fn, options = {}) {
  const { maxRetries = 3, initialDelay = 1000 } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries - 1) {
        throw error
      }
      await delay(initialDelay * Math.pow(2, attempt))
    }
  }
}

function isRetryable(error) {
  return error.code === 'ECONNRESET' ||
         error.code === 'ETIMEDOUT' ||
         (error.response?.status >= 500 && error.response?.status < 600)
}
```

**Dependencies:**
- None

### Files to Modify

#### `src/api/qwen-client.js`
**Add:**
- Wrap HTTP calls with retry logic
- Detect auth errors (HTML WAF response)
- Detect invalid parent_id errors

**Changes:**
```javascript
async sendMessage(opts) {
  return withRetry(async () => {
    try {
      const response = await axios.post(url, payload, config)
      return response.data
    } catch (error) {
      // Detect HTML WAF page (auth error)
      if (error.response?.headers['content-type']?.includes('text/html')) {
        throw new QwenAuthError('Invalid or expired credentials')
      }

      // Detect invalid parent_id
      if (error.response?.data?.includes('parent_id') &&
          error.response?.data?.includes('not exist')) {
        throw new SessionError('Invalid parent_id')
      }

      throw error
    }
  })
}
```

#### `src/handlers/chat-completion-handler.js`
**Add:**
- Try/catch around main flow
- Handle SessionError (reset parent_id, retry)
- Handle QwenAuthError (return 401)
- Handle ValidationError (return 400)

**Changes:**
```javascript
async function handleChatCompletion(req, res, next) {
  try {
    // ... existing logic
  } catch (error) {
    if (error instanceof SessionError) {
      // Reset session parent_id and retry once
      session.parentId = null
      // ... retry logic
    }
    next(error)  // Pass to error middleware
  }
}
```

#### `src/server.js`
**Add:**
- Register validation middleware
- Register error middleware (last)

**Changes:**
```javascript
const validationMiddleware = require('./middleware/validation-middleware')
const errorMiddleware = require('./middleware/error-middleware')

app.post('/v1/chat/completions',
  validationMiddleware,
  chatHandler
)

app.use(errorMiddleware)  // Must be last
```

### Integration Points

**Internal:**
- All handlers and clients

**External:**
- None

### Acceptance Criteria

- [x] Invalid requests return 400 with clear message
- [x] Auth errors return 401
- [x] Network errors retry automatically
- [x] Invalid parent_id resets session and retries
- [x] All errors return OpenAI-compatible format
- [x] Error details logged for debugging
- [x] All unit tests pass (50/50 new tests passing)
- [x] Integration tests pass (12/12 tests passing)

### Testing Strategy

**Integration Tests:**
- Test invalid request payloads
- Test with expired credentials (mock)
- Test network failures (mock)
- Test invalid parent_id (mock)

---

## Phase 6: Integration Tests

**Priority:** HIGH - Validation of all phases

**Goal:** Comprehensive test suite validating end-to-end functionality.

**Knowledge Applied:**
- From existing tests: Real API test patterns
- From Roocode tests: XML parsing, SSE format
- From discoveries: Multi-turn behavior

### Files to Create

#### `tests/integration/chat-completion.test.js`
**Purpose:** Test basic chat completion flow
**Tests:**
- Single message completion
- Response format matches OpenAI
- Session created correctly
- Parent_id tracked

**Dependencies:**
- All application modules
- Real Qwen API (uses .env credentials)

#### `tests/integration/multi-turn.test.js`
**Purpose:** Test multi-turn conversations
**Tests:**
- 2-turn conversation maintains context
- 3-turn conversation maintains context
- Same session ID used across turns
- Parent_id chain correct

**Dependencies:**
- All application modules
- Real Qwen API

#### `tests/integration/error-handling.test.js`
**Purpose:** Test error scenarios
**Tests:**
- Invalid request returns 400
- Empty messages returns 400
- Session error recovery
- Network error retry

**Dependencies:**
- All application modules
- Mock failures (nock for HTTP mocking)

#### `tests/unit/qwen-client.test.js`
**Purpose:** Test Qwen client in isolation
**Tests:**
- Creates chat successfully
- Sends message with correct format
- Handles streaming responses
- Auth headers included

**Dependencies:**
- `src/api/qwen-client.js`
- nock (HTTP mocking)

#### `tests/unit/session-manager.test.js`
**Purpose:** Test session management
**Tests:**
- Creates sessions
- Retrieves sessions
- Updates parent_id
- Conversation ID generation

**Dependencies:**
- `src/session/session-manager.js`
- `src/session/session-id-generator.js`

#### `tests/unit/request-transformer.test.js`
**Purpose:** Test request transformation
**Tests:**
- Extracts last message correctly
- Builds Qwen payload correctly
- Handles first message (parent_id: null)
- Handles follow-up messages

**Dependencies:**
- `src/transform/request-transformer.js`

#### `tests/unit/response-transformer.test.js`
**Purpose:** Test response transformation
**Tests:**
- Transforms Qwen chunk to OpenAI format
- Extracts parent_id correctly
- Extracts usage data
- Handles finish_reason

**Dependencies:**
- `src/transform/response-transformer.js`

#### `tests/fixtures/qwen-responses.js`
**Purpose:** Real Qwen response examples
**Content:**
- First message response (with parent_id)
- Follow-up message response
- Streaming chunks
- Error responses

**Source:**
- Captured from real API tests

#### `tests/fixtures/openai-requests.js`
**Purpose:** OpenAI request examples
**Content:**
- Single message
- Multi-turn conversation
- With system message
- With tool calls (for future)

**Source:**
- Roocode integration tests

### Integration Points

**Internal:**
- All application modules

**External:**
- jest (test runner)
- nock (HTTP mocking)
- Real Qwen API

### Acceptance Criteria

- [x] All unit tests pass
- [x] All integration tests pass (4 new test files created)
- [x] Existing Qwen API tests still pass
- [x] Existing Roocode integration tests pass
- [x] Test coverage documented
- [x] Integration test README created

### Testing Strategy

**Run Order:**
1. Unit tests (fast, no external deps)
2. Integration tests (real API, slower)
3. Roocode integration tests (OpenAI SDK)

**Commands:**
```bash
npm test                           # All tests
npm run test:unit                  # Unit only
npm run test:integration           # Integration only
npm run test:roocode              # Roocode tests
```

---

## Phase 7: XML Tool Call System

**Priority:** MEDIUM - Needed for Roocode tool usage

**Goal:** Implement XML tool call detection and generation.

**Knowledge Applied:**
- From `ROOCODE_INTEGRATION.md`: XML format requirements
- From `tests/roocode-integration/03-xml-tool-call-parsing.test.js`: Parser expectations
- From discoveries: Qwen may not naturally output XML

### Files to Create

#### `src/tools/xml-detector.js`
**Purpose:** Detect if Qwen naturally outputs XML
**Responsibilities:**
- Test Qwen with tool-triggering prompt
- Check if response contains XML tool calls
- Return detection result

**Test Function:**
```javascript
async function detectXMLSupport(qwenClient) {
  const testPrompt = 'Please read the file src/index.js'
  const response = await qwenClient.sendMessage({
    messages: [{ role: 'user', content: testPrompt }]
  })

  const hasXML = response.content.includes('<read_file>')
  return {
    supported: hasXML,
    sample: response.content
  }
}
```

**Dependencies:**
- `src/api/qwen-client.js`

#### `src/tools/system-prompts.js`
**Purpose:** Tool-aware system prompts
**Responsibilities:**
- Define system prompt that teaches XML format
- List available tools
- Provide XML examples

**Content:**
```javascript
const TOOL_SYSTEM_PROMPT = `You are a helpful coding assistant.

When you need to use tools, output them in this XML format:

<read_file><path>file/path.js</path></read_file>
<write_to_file><path>file.js</path><content>
code here
</content><line_count>10</line_count></write_to_file>

Available tools:
- read_file: Read file contents
- write_to_file: Write or update a file
- execute_command: Run shell command
- search_files: Search for patterns in files
- list_files: List directory contents
- attempt_completion: Mark task as complete

Always output tool calls in this exact XML format.`

module.exports = { TOOL_SYSTEM_PROMPT }
```

**Dependencies:**
- None

#### `src/tools/xml-generator.js`
**Purpose:** Generate XML from other formats (fallback)
**Responsibilities:**
- Detect if Qwen used JSON tool calls
- Convert JSON tool calls to XML format
- Inject XML into response text

**Implementation:**
```javascript
function convertToXML(qwenResponse) {
  // If already has XML, return as-is
  if (hasXMLToolCalls(qwenResponse.content)) {
    return qwenResponse
  }

  // If has JSON tool_calls (OpenAI format), convert
  if (qwenResponse.tool_calls) {
    const xmlCalls = qwenResponse.tool_calls.map(convertToolCallToXML)
    qwenResponse.content += '\n\n' + xmlCalls.join('\n')
  }

  return qwenResponse
}

function convertToolCallToXML(toolCall) {
  const { name, arguments: args } = toolCall.function

  const params = Object.entries(args)
    .map(([key, val]) => `<${key}>${val}</${key}>`)
    .join('')

  return `<${name}>${params}</${name}>`
}
```

**Dependencies:**
- None (pure transform)

### Files to Modify

#### `src/transform/request-transformer.js`
**Add:**
- Inject TOOL_SYSTEM_PROMPT when tools are needed
- Detect if request involves tool usage

**Changes:**
```javascript
function transformToQwenRequest(openAIMessages, session, options = {}) {
  const messages = [...openAIMessages]

  // Add tool system prompt if needed
  if (options.enableTools) {
    messages.unshift({
      role: 'system',
      content: TOOL_SYSTEM_PROMPT
    })
  }

  // ... rest of transform
}
```

### Integration Points

**Internal:**
- `src/transform/request-transformer.js` - Inject prompts
- `src/transform/response-transformer.js` - Convert to XML if needed
- `src/api/qwen-client.js` - Test XML detection

**External:**
- None

### Acceptance Criteria

- [x] System prompt encourages XML output (implemented in tool-calling-system-prompt.js)
- [x] Fallback generator works if needed (implemented in xml-tool-converter.js)
- [x] XML format matches Roocode parser expectations (validated by unit tests)
- [x] Existing XML parsing tests still pass (9/9 tests passing)
- [x] System prompt injected on first message when tools are enabled
- [x] All 6 Roocode tools supported (read_file, write_to_file, execute_command, search_files, list_files, attempt_completion)
- [x] JSON to XML conversion handles all tool types
- [x] Auto-detection of tool-related keywords works
- [x] All unit tests pass (196/196 tests passing)

### Testing Strategy

**Detection Test:**
```bash
node -e "
const detector = require('./src/tools/xml-detector')
const result = await detector.detectXMLSupport(qwenClient)
console.log('XML Support:', result.supported)
console.log('Sample:', result.sample)
"
```

**Integration Tests:**
- Test request with tool-triggering prompt
- Verify XML in response
- Test with Roocode XML parser (existing test)

---

## Phase 8: Session Lifecycle Management

**Priority:** MEDIUM - Resource management

**Goal:** Implement session cleanup and lifecycle management.

**Knowledge Applied:**
- From analysis: Sessions accumulate in memory forever (current issue)
- From production needs: Need timeout and cleanup

### Files to Modify

#### `src/session/session-manager.js`
**Add:**
- Track last access time
- Implement cleanup interval
- Expose session metrics

**Changes:**
```javascript
class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map()
    this.lastAccessed = new Map()
    this.timeout = options.timeout || 30 * 60 * 1000  // 30 min default

    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      10 * 60 * 1000  // Run every 10 minutes
    )
  }

  cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [id, timestamp] of this.lastAccessed) {
      if (now - timestamp > this.timeout) {
        this.sessions.delete(id)
        this.lastAccessed.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[SESSION] Cleaned ${cleaned} expired sessions`)
    }
  }

  getSession(conversationId) {
    // Update access time
    this.lastAccessed.set(conversationId, Date.now())
    return this.sessions.get(conversationId)
  }

  getMetrics() {
    return {
      total: this.sessions.size,
      oldest: this.getOldestSessionAge(),
      newest: this.getNewestSessionAge()
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
  }
}
```

**Dependencies:**
- None (existing file)

### Integration Points

**Internal:**
- `src/handlers/health-handler.js` - Report metrics

**External:**
- None

### Acceptance Criteria

- [ ] Sessions older than 30 min are deleted
- [ ] Cleanup runs every 10 minutes
- [ ] Active sessions not affected
- [ ] Metrics available for monitoring
- [ ] No memory leaks

### Testing Strategy

**Unit Tests:**
- Test cleanup removes old sessions
- Test cleanup preserves recent sessions
- Test access time updates

**Integration Tests:**
- Create session, wait, verify cleanup
- Verify metrics accurate

---

## Phase 9: Logging & Observability

**Priority:** LOW - Production operations

**Goal:** Add comprehensive logging and metrics for production operations.

**Knowledge Applied:**
- From production needs: Need visibility into operations
- From error handling: Need detailed error logs

### Files to Create

#### `src/utils/logger.js`
**Purpose:** Winston logger configuration
**Responsibilities:**
- Configure log levels
- Configure transports (console, file)
- Export logger instance

**Configuration:**
```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

module.exports = logger
```

**Dependencies:**
- winston

#### `src/utils/metrics.js`
**Purpose:** Prometheus metrics
**Responsibilities:**
- Define metrics (counters, histograms, gauges)
- Expose /metrics endpoint

**Metrics:**
```javascript
const promClient = require('prom-client')

// Request duration
const requestDuration = new promClient.Histogram({
  name: 'qwen_proxy_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'status']
})

// Active sessions
const activeSessions = new promClient.Gauge({
  name: 'qwen_proxy_active_sessions',
  help: 'Number of active sessions'
})

// Request counter
const requestCounter = new promClient.Counter({
  name: 'qwen_proxy_requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'status']
})

module.exports = {
  requestDuration,
  activeSessions,
  requestCounter,
  register: promClient.register
}
```

**Dependencies:**
- prom-client

#### `src/middleware/logging-middleware.js`
**Purpose:** Request/response logging
**Responsibilities:**
- Log incoming requests
- Log response status and duration
- Log errors

**Implementation:**
```javascript
const logger = require('../utils/logger')

function loggingMiddleware(req, res, next) {
  const start = Date.now()

  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    messageCount: req.body?.messages?.length
  })

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    })
  })

  next()
}

module.exports = loggingMiddleware
```

**Dependencies:**
- `src/utils/logger.js`

### Files to Modify

#### `src/server.js`
**Add:**
- Logging middleware
- Metrics endpoint

**Changes:**
```javascript
const loggingMiddleware = require('./middleware/logging-middleware')
const { register } = require('./utils/metrics')

app.use(loggingMiddleware)

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})
```

#### `src/api/qwen-client.js`
**Add:**
- Log API calls
- Log errors with context

#### `src/handlers/chat-completion-handler.js`
**Add:**
- Log session operations
- Record metrics

#### `src/middleware/error-middleware.js`
**Add:**
- Log errors with full context

### Integration Points

**Internal:**
- All modules that need logging

**External:**
- winston (logging)
- prom-client (metrics)
- Prometheus (external scraper)

### Acceptance Criteria

- [x] All requests logged
- [x] All errors logged with stack traces
- [x] Metrics available at /metrics
- [x] Request duration tracked
- [x] Active sessions tracked
- [x] Logs structured (JSON)
- [x] Winston logger configured with file rotation
- [x] Prometheus metrics exposed at /metrics
- [x] Health endpoint includes session metrics
- [x] All console.log replaced with structured logging in key modules
- [x] Unit tests for logger (9 tests passing)
- [x] Unit tests for metrics (18 tests passing)
- [x] Integration tests for observability (14 tests passing)
- [x] All existing tests still pass

### Testing Strategy

**Manual:**
- Check logs directory created
- Check logs written correctly
- Check metrics endpoint returns data

**Monitoring:**
- Set up Prometheus to scrape /metrics
- Create Grafana dashboards

---

## Phase 10: Production Configuration

**Priority:** LOW - Deployment preparation

**Goal:** Externalize configuration for different environments.

**Knowledge Applied:**
- From production needs: Different configs per environment
- From security: Sensitive values in environment

### Files to Create

#### `src/config/default.js`
**Purpose:** Default configuration values
**Content:**
```javascript
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  qwen: {
    baseURL: 'https://chat.qwen.ai',
    timeout: 120000,  // 2 minutes
    retries: 3
  },
  session: {
    timeout: 30 * 60 * 1000,  // 30 minutes
    cleanupInterval: 10 * 60 * 1000  // 10 minutes
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: 'logs'
  }
}
```

**Dependencies:**
- None

#### `src/config/production.js`
**Purpose:** Production overrides
**Content:**
```javascript
module.exports = {
  logging: {
    level: 'warn',  // Less verbose in production
    dir: '/var/log/qwen-proxy'
  },
  session: {
    timeout: 60 * 60 * 1000  // 1 hour in production
  }
}
```

**Dependencies:**
- None

#### `.env.example`
**Purpose:** Example environment variables
**Content:**
```bash
# Qwen API Credentials (Required)
QWEN_TOKEN=your-bx-umidtoken-here
QWEN_COOKIES=your-cookies-here

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Session Management
SESSION_TIMEOUT_MS=1800000
```

**Dependencies:**
- None

### Files to Modify

#### All modules using config
**Change:**
- Import from config instead of hardcoded values
- Use environment variables through config

### Integration Points

**Internal:**
- All modules

**External:**
- dotenv (already used)

### Acceptance Criteria

- [x] Centralized configuration in `src/config/index.js`
- [x] All environment variables documented in `.env.example`
- [x] Comprehensive deployment guide in `DEPLOYMENT.md`
- [x] Docker support with Dockerfile and docker-compose.yml
- [x] Graceful shutdown handling (SIGTERM/SIGINT)
- [x] All files use centralized config (qwen-auth, logger, error-handler, server)
- [x] Production scripts in package.json (start, dev, test, docker commands)
- [x] Config validation on startup
- [x] Tests validate configuration (20/20 tests passing)
- [x] All 270+ tests still passing
- [x] IMPLEMENTATION_PLAN_V2.md updated to mark Phase 10 as ✅ Complete
- [x] PROJECT_COMPLETION_SUMMARY.md created with full project documentation

### Testing Strategy

**Manual:**
- Test with different NODE_ENV values
- Test with different config values
- Verify production config loads

---

## Dependencies to Add

```json
{
  "dependencies": {
    "axios": "^1.13.1",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "uuid": "^13.0.0",
    "winston": "^3.11.0",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "jest": "^30.2.0",
    "supertest": "^7.1.4",
    "openai": "^6.7.0",
    "nock": "^13.5.0"
  }
}
```

---

## Success Criteria

### Minimum Viable Product (MVP)
✅ Phases 1-4 complete
- [ ] Basic chat completion works
- [ ] Multi-turn conversations work
- [ ] OpenAI SDK compatible
- [ ] Session management functional

### Production Ready
✅ Phases 1-9 complete
- [ ] All MVP criteria
- [ ] Comprehensive error handling
- [ ] Full test coverage
- [ ] Logging and metrics
- [ ] Documentation complete

### Feature Complete
✅ All phases complete
- [ ] All Production Ready criteria
- [ ] XML tool calls working
- [ ] Session lifecycle managed
- [ ] Production configuration

---

## Notes

- Each phase builds on previous phases
- Phases can be implemented in parallel where dependencies allow
- Focus on SRP: Each file has single, clear responsibility
- Follow DRY: Shared logic extracted to utils
- Test after each phase before moving to next
