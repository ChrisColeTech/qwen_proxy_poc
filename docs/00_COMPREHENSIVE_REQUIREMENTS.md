# Qwen Proxy for OpenCode - Comprehensive Requirements Document

## Executive Summary

This document defines the complete requirements for a production-grade OpenAI-compatible API proxy that translates between OpenAI's tool calling format and Qwen's native API format. The proxy enables OpenCode (Anthropic's Claude Code CLI) to use Qwen models while maintaining full compatibility with OpenAI's API specification.

---

## 1. Project Purpose

### 1.1 Primary Objective
Create a transparent middleware proxy that:
- Accepts OpenAI API format requests (specifically from OpenCode)
- Transforms tool calling formats bidirectionally
- Routes requests to Qwen API
- Returns OpenAI-compatible responses
- Maintains conversation state and history

### 1.2 Target Client
**OpenCode (Claude Code CLI)** - Anthropic's official CLI tool that:
- Sends 11 different tool definitions per request
- Uses OpenAI's tool calling format with `tool_calls` arrays
- Expects `content: ""` (empty string, NOT null) when tool calls are present
- Manages multi-turn conversations with tool execution results
- Relies on the Vercel AI SDK for response parsing

### 1.3 Success Criteria
- OpenCode can execute complete multi-tool workflows without hanging
- All 11 OpenCode tools work correctly (bash, read, write, edit, glob, grep, list, webfetch, todowrite, todoread, task)
- No null content bugs that break AI SDK parsing
- Sub-2-second response times for continuation requests
- Complete observability via SQLite database logging

---

## 2. Core Features

### 2.1 OpenAI API Compatibility
**Endpoints to Implement:**
- `POST /v1/chat/completions` - Chat completion (streaming and non-streaming)
- `GET /v1/models` - List available models
- `GET /health` - Health check endpoint

**OpenAI Request Format:**
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Read file /tmp/test.txt"},
    {"role": "assistant", "content": "", "tool_calls": [...]},
    {"role": "tool", "tool_call_id": "call_123", "content": "File contents"}
  ],
  "tools": [...],
  "stream": false
}
```

**OpenAI Response Format (Non-Streaming):**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "",  // CRITICAL: Empty string, NOT null when tool_calls present
      "tool_calls": [{
        "id": "call_123",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"file_path\":\"/tmp/test.txt\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 2.2 Tool Calling Transformation

#### 2.2.1 The Challenge
OpenCode sends tools in OpenAI format:
```json
{
  "type": "function",
  "function": {
    "name": "read",
    "description": "Read a file",
    "parameters": {
      "type": "object",
      "properties": {
        "file_path": {"type": "string"}
      },
      "required": ["file_path"]
    }
  }
}
```

Qwen expects tools defined as XML in the system prompt:
```xml
<tools>
  <tool_description>
    <tool_name>read</tool_name>
    <description>Read a file</description>
    <parameters>
      <parameter>
        <name>file_path</name>
        <type>string</type>
        <required>true</required>
      </parameter>
    </parameters>
  </tool_description>
</tools>
```

#### 2.2.2 Transformation Requirements

**Component: OpenAI-to-XML Transformer**
- Input: Array of OpenAI tool definitions
- Output: XML string for injection into system prompt
- Must handle all JSON Schema types: string, number, boolean, array, object, enum
- Must handle nested objects and arrays
- Must preserve required fields
- Must handle optional descriptions

**Component: XML-to-OpenAI Parser**
- Input: Qwen's text response containing XML tool calls
- Output: OpenAI `tool_calls` array
- Must parse XML format:
  ```xml
  <tool_call>
    <tool_name>read</tool_name>
    <parameters>
      <file_path>/tmp/test.txt</file_path>
    </parameters>
  </tool_call>
  ```
- Must convert to:
  ```json
  {
    "id": "call_<random>",
    "type": "function",
    "function": {
      "name": "read",
      "arguments": "{\"file_path\":\"/tmp/test.txt\"}"
    }
  }
  ```
- Must handle text before/after tool calls
- Must generate unique tool_call_id for each call

**Component: Tool Result Transformer**
- Input: OpenAI tool result message
  ```json
  {
    "role": "tool",
    "tool_call_id": "call_123",
    "content": "File contents here"
  }
  ```
- Output: Qwen user message
  ```json
  {
    "role": "user",
    "content": "Tool Result from read:\nFile contents here"
  }
  ```
- Must handle empty results (bash commands with no output)
- Must format results clearly for model understanding

### 2.3 Session Management

**Requirements:**
- Track conversation state using Qwen's `parent_id` chain
- Generate conversation hash from first user + assistant messages
- Store and retrieve parent_id for continuation requests
- Support multiple concurrent conversations
- Clean up old sessions (TTL: 1 hour)

**Session Flow:**
1. **New Conversation**: No parent_id, Qwen starts fresh
2. **Extract parent_id**: From Qwen's response metadata
3. **Store Mapping**: `conversation_hash → parent_id`
4. **Continuation**: Retrieve parent_id, include in next Qwen request
5. **Update**: Store new parent_id from response

### 2.4 Streaming Support

**Streaming Transformation:**
- Convert Qwen SSE format to OpenAI SSE format
- Handle chunk types: `response.created`, `response.updated`, `response.finished`
- Extract and forward tool calls in streaming mode
- Send usage data as final chunk
- Maintain session state during streaming

**OpenAI Streaming Format:**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

---

## 3. Critical Bugs to Prevent

### 3.1 The Null Content Bug
**Problem**: Setting `message.content = null` when tool calls are present causes OpenCode's AI SDK to reject the response with error: "The language model did not provide any assistant messages"

**Solution**: ALWAYS set `content: ""` (empty string) when tool_calls present
```javascript
// ❌ WRONG
message.content = parsed.textBeforeToolCall || null;

// ✅ CORRECT
message.content = parsed.textBeforeToolCall || '';
```

**Test Coverage Required:**
- Verify content is empty string when tool_calls present
- Verify content is never null in any scenario
- Test with multiple tool calls in sequence

### 3.2 The Empty Bash Result Loop
**Problem**: Bash commands that succeed silently (mkdir, touch, cp) return empty string. If proxy forwards empty result, model gets confused and may loop infinitely.

**Solution**: Transform empty results to explicit success message
```javascript
if (content === '' || content.trim() === '') {
  content = '(Command completed successfully with no output)';
}
```

**Test Coverage Required:**
- Test bash commands with empty output
- Test bash commands with actual output
- Test edit/write commands (also silent on success)

### 3.3 The Conversation Hash Bug
**Problem**: Attempting to call `.substring()` on null assistant content crashes the server

**Solution**: Always use fallback when computing conversation hash
```javascript
// ❌ WRONG
const conversationKey = firstUserMessage + firstAssistantMsg.content;

// ✅ CORRECT
const assistantContent = firstAssistantMsg.content || '';
const conversationKey = firstUserMessage + assistantContent;
```

---

## 4. Database Schema

### 4.1 Purpose
- Full observability into all requests and responses
- Debugging tool for investigating issues
- Session state persistence
- Error tracking and monitoring

### 4.2 Table Definitions

#### 4.2.1 `requests` Table
Stores all incoming OpenAI API requests.

```sql
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  model TEXT,
  messages TEXT,              -- JSON array
  tools TEXT,                 -- JSON array
  stream BOOLEAN,
  temperature REAL,
  max_tokens INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_request_id ON requests(request_id);
CREATE INDEX idx_requests_created_at ON requests(created_at);
```

**Sample Data:**
```json
{
  "id": 1,
  "request_id": "req_abc123",
  "endpoint": "/v1/chat/completions",
  "method": "POST",
  "model": "gpt-4",
  "messages": "[{\"role\":\"user\",\"content\":\"Read /tmp/test.txt\"}]",
  "tools": "[{\"type\":\"function\",\"function\":{\"name\":\"read\"...}}]",
  "stream": false,
  "created_at": "2025-10-30 12:00:00"
}
```

#### 4.2.2 `responses` Table
Stores all responses returned to clients.

```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  response_id TEXT,
  status_code INTEGER,
  response_body TEXT,          -- Full JSON response
  content TEXT,                -- Extracted message.content
  tool_calls TEXT,             -- Extracted tool_calls array
  finish_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id)
);

CREATE INDEX idx_responses_request_id ON responses(request_id);
```

**Sample Data:**
```json
{
  "id": 1,
  "request_id": "req_abc123",
  "response_id": "chatcmpl-xyz789",
  "status_code": 200,
  "response_body": "{\"id\":\"chatcmpl-xyz789\",\"choices\":[...]}",
  "content": "",
  "tool_calls": "[{\"id\":\"call_123\",\"function\":{\"name\":\"read\"...}}]",
  "finish_reason": "tool_calls",
  "created_at": "2025-10-30 12:00:01"
}
```

#### 4.2.3 `sessions` Table
Stores conversation session mappings.

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_hash TEXT UNIQUE NOT NULL,
  parent_id TEXT,
  message_id TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_conversation_hash ON sessions(conversation_hash);
CREATE INDEX idx_sessions_last_updated ON sessions(last_updated);
```

**Sample Data:**
```json
{
  "id": 1,
  "conversation_hash": "md5_hash_of_first_user_assistant_messages",
  "parent_id": "qwen_parent_id_12345",
  "message_id": "qwen_message_id_67890",
  "last_updated": "2025-10-30 12:00:05",
  "created_at": "2025-10-30 12:00:00"
}
```

#### 4.2.4 `errors` Table
Tracks all errors for monitoring and debugging.

```sql
CREATE TABLE errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  error_type TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context TEXT,                -- Additional JSON context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_errors_request_id ON errors(request_id);
CREATE INDEX idx_errors_created_at ON errors(created_at);
```

**Sample Data:**
```json
{
  "id": 1,
  "request_id": "req_abc123",
  "error_type": "QwenAPIError",
  "error_code": "rate_limit_exceeded",
  "error_message": "Rate limit exceeded: 10 requests per minute",
  "stack_trace": "Error: Rate limit...\n  at ...",
  "context": "{\"retry_after\":60}",
  "created_at": "2025-10-30 12:00:00"
}
```

#### 4.2.5 `qwen_requests` Table
Stores transformed requests sent to Qwen API.

```sql
CREATE TABLE qwen_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  qwen_request_body TEXT NOT NULL,  -- Full Qwen request JSON
  parent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id)
);

CREATE INDEX idx_qwen_requests_request_id ON qwen_requests(request_id);
```

#### 4.2.6 `qwen_responses` Table
Stores raw responses from Qwen API.

```sql
CREATE TABLE qwen_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  qwen_response_body TEXT NOT NULL,  -- Full Qwen response JSON
  parent_id TEXT,
  message_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id)
);

CREATE INDEX idx_qwen_responses_request_id ON qwen_responses(request_id);
```

### 4.3 Database Access Patterns

**On Request Received:**
1. Insert into `requests` table
2. Check `sessions` table for existing parent_id
3. Transform request to Qwen format
4. Insert into `qwen_requests` table

**On Qwen Response:**
1. Insert into `qwen_responses` table
2. Extract parent_id and message_id
3. Update or insert into `sessions` table
4. Transform to OpenAI format
5. Insert into `responses` table

**On Error:**
1. Insert into `errors` table with full context
2. Return error response to client

---

## 5. Testing Requirements

### 5.1 Test Philosophy
**CRITICAL RULE: NO MOCKS, NO FAKE API CALLS**

All tests must:
- Make REAL HTTP requests to the running proxy server
- Make REAL requests to Qwen API
- Verify actual transformations and behavior
- Test complete end-to-end workflows

**Rationale:** Mocks hide real integration issues. The previous implementation had passing tests with mocks but failed in production with OpenCode.

### 5.2 Test Categories

#### 5.2.1 Unit Tests
**Scope:** Individual transformation functions only

**Files:**
- `tests/unit/openai-to-xml-transformer.test.js`
- `tests/unit/xml-to-openai-parser.test.js`
- `tests/unit/tool-result-transformer.test.js`
- `tests/unit/session-manager.test.js`

**Example Test:**
```javascript
test('Transform OpenAI tool to XML format', () => {
  const openaiTool = {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' }
        },
        required: ['file_path']
      }
    }
  };

  const xml = transformToolToXML(openaiTool);

  expect(xml).toContain('<tool_name>read</tool_name>');
  expect(xml).toContain('<name>file_path</name>');
  expect(xml).toContain('<type>string</type>');
  expect(xml).toContain('<required>true</required>');
});
```

#### 5.2.2 Integration Tests
**Scope:** Full request/response cycles with REAL Qwen API

**Files:**
- `tests/integration/01-single-tool-workflow.test.js` - Test each tool individually
- `tests/integration/02-multi-tool-workflow.test.js` - Test tool sequences
- `tests/integration/03-opencode-exact-scenario.test.js` - Exact OpenCode payloads
- `tests/integration/04-streaming.test.js` - Streaming responses
- `tests/integration/05-session-continuity.test.js` - Multi-turn conversations
- `tests/integration/06-error-handling.test.js` - Error scenarios

**Example Test Structure:**
```javascript
describe('Single Tool Workflows', () => {
  test('bash tool: Execute ls command', async () => {
    // Step 1: Initial request
    const response1 = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Run ls command' }
      ],
      tools: ALL_11_OPENCODE_TOOLS,
      stream: false
    });

    expect(response1.status).toBe(200);
    const msg1 = response1.data.choices[0].message;

    // CRITICAL: Verify content is empty string, not null
    if (msg1.tool_calls) {
      expect(msg1.content).toBe('');
      expect(msg1.content).not.toBeNull();
    }

    // Step 2: Send tool result
    const response2 = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Run ls command' },
        { role: 'assistant', content: msg1.content || '', tool_calls: msg1.tool_calls },
        { role: 'tool', tool_call_id: msg1.tool_calls[0].id, content: 'file1.txt\nfile2.txt' }
      ],
      tools: ALL_11_OPENCODE_TOOLS,
      stream: false
    });

    expect(response2.status).toBe(200);
    // Should receive final text response
    expect(response2.data.choices[0].message.content).toBeTruthy();
  });
});
```

#### 5.2.3 Multi-Tool Workflow Tests

**Test ALL these sequences:**
1. **glob → read → edit** - Find files, read one, modify it
2. **bash → grep → read** - List files, search content, read file
3. **list → read → write** - List directory, read config, create file
4. **todowrite → todoread** - Create todo list, read it back
5. **glob → bash → edit → bash** - 4-step workflow
6. **Complex 6-step chain** - Extended multi-turn conversation

**Each workflow MUST:**
- Use all 11 OpenCode tools in request
- Make real Qwen API calls
- Verify each tool transformation
- Verify content is never null
- Complete without hanging

#### 5.2.4 OpenCode Exact Scenario Test

**Purpose:** Reproduce EXACT OpenCode behavior

**Requirements:**
- Use EXACT 11 tools that OpenCode sends
- Use realistic system prompt
- Test initial request → tool call → tool result → continuation
- Test multiple continuations (3+ rounds)
- Measure response times (should be <5 seconds)

**Expected Results:**
- All requests complete successfully
- No hanging or timeouts
- content is always empty string when tool_calls present
- Response times under 5 seconds

### 5.3 Test Execution Requirements

**Prerequisites:**
1. Qwen API key configured in environment
2. Proxy server running on localhost:3000
3. SQLite database initialized

**Test Command:**
```bash
npm test                                    # Run all tests
npm test -- tests/integration/            # Integration tests only
npm test -- tests/unit/                   # Unit tests only
npm test -- <specific-file>.test.js       # Single test file
```

**CI/CD Requirements:**
- All tests must pass before deployment
- Integration tests run against staging environment
- Performance tests verify <5s response times

---

## 6. Architecture & Components

### 6.1 Technology Stack

**Backend Framework:** Express.js (Node.js)
**Database:** SQLite3 with better-sqlite3 driver
**HTTP Client:** axios for Qwen API requests
**Streaming:** Server-Sent Events (SSE)
**Testing:** Jest with axios for integration tests

### 6.2 Project Structure

```
qwen_proxy_opencode/
├── docs/
│   └── 00_COMPREHENSIVE_REQUIREMENTS.md
├── src/
│   ├── server.js                          # Express app entry point
│   ├── routes/
│   │   ├── chat-completions.js           # POST /v1/chat/completions
│   │   ├── models.js                     # GET /v1/models
│   │   └── health.js                     # GET /health
│   ├── transformers/
│   │   ├── openai-to-xml.js              # OpenAI tools → XML
│   │   ├── xml-to-openai.js              # XML tool calls → OpenAI format
│   │   ├── tool-result.js                # Tool results → Qwen format
│   │   └── qwen-to-openai-response.js    # Qwen response → OpenAI response
│   ├── handlers/
│   │   ├── chat-handler.js               # Main chat completion logic
│   │   ├── streaming-handler.js          # Streaming response logic
│   │   └── error-handler.js              # Centralized error handling
│   ├── services/
│   │   ├── qwen-api.js                   # Qwen API client
│   │   ├── session-manager.js            # Session/parent_id management
│   │   └── database.js                   # SQLite operations
│   ├── parsers/
│   │   └── xml-parser.js                 # XML parsing utilities
│   └── utils/
│       ├── logger.js                     # Logging utility
│       └── crypto.js                     # Hash generation
├── tests/
│   ├── unit/
│   │   ├── openai-to-xml-transformer.test.js
│   │   ├── xml-to-openai-parser.test.js
│   │   ├── tool-result-transformer.test.js
│   │   └── session-manager.test.js
│   └── integration/
│       ├── 01-single-tool-workflow.test.js
│       ├── 02-multi-tool-workflow.test.js
│       ├── 03-opencode-exact-scenario.test.js
│       ├── 04-streaming.test.js
│       ├── 05-session-continuity.test.js
│       └── 06-error-handling.test.js
├── database/
│   ├── schema.sql                        # Database schema
│   └── qwen_proxy.db                     # SQLite database file
├── .env.example                          # Environment variables template
├── package.json
└── README.md
```

### 6.3 Data Flow

**Non-Streaming Request Flow:**
```
OpenCode Client
  ↓ POST /v1/chat/completions (OpenAI format)
Express Server (routes/chat-completions.js)
  ↓ Log to requests table
  ↓ Extract tools array
OpenAI-to-XML Transformer
  ↓ Convert tools to XML
  ↓ Inject into system prompt
Session Manager
  ↓ Retrieve parent_id for conversation
  ↓ Transform tool results (role: tool → role: user)
Qwen API Client
  ↓ POST to Qwen API
  ↓ Log to qwen_requests table
Qwen API
  ↓ Response with XML tool calls
  ↓ Log to qwen_responses table
XML-to-OpenAI Parser
  ↓ Parse XML tool calls
  ↓ Convert to OpenAI tool_calls format
  ↓ CRITICAL: Set content = "" when tool_calls present
Qwen-to-OpenAI Response Transformer
  ↓ Format as OpenAI completion
  ↓ Extract parent_id from response
Session Manager
  ↓ Store parent_id for next request
  ↓ Log to sessions table
  ↓ Log to responses table
Express Server
  ↓ Return response
OpenCode Client
```

**Streaming Request Flow:**
```
OpenCode Client
  ↓ POST /v1/chat/completions (stream: true)
Express Server
  ↓ Set headers: Content-Type: text/event-stream
  ↓ Begin SSE connection
Streaming Handler
  ↓ Transform request to Qwen format
  ↓ Open streaming connection to Qwen
Qwen API (streaming)
  ↓ data: {"event":"response.created",...}
  ↓ data: {"event":"response.updated","delta":{"content":"text"}}
  ↓ data: {"event":"response.finished",...}
Streaming Transformer (for each chunk)
  ↓ Parse Qwen chunk
  ↓ Convert to OpenAI chunk format
  ↓ Detect tool calls in accumulated text
  ↓ Send: data: {"choices":[{"delta":{"content":"text"}}]}
  ↓ On finish: Send final chunk + usage chunk
  ↓ Send: data: [DONE]
OpenCode Client
```

### 6.4 Key Components Detail

#### 6.4.1 OpenAI-to-XML Transformer
**File:** `src/transformers/openai-to-xml.js`

**Input:**
```javascript
[
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to file' }
        },
        required: ['file_path']
      }
    }
  }
]
```

**Output:**
```xml
<tools>
  <tool_description>
    <tool_name>read</tool_name>
    <description>Read a file</description>
    <parameters>
      <parameter>
        <name>file_path</name>
        <type>string</type>
        <description>Path to file</description>
        <required>true</required>
      </parameter>
    </parameters>
  </tool_description>
</tools>
```

**Functions:**
- `transformToolsToXML(tools)` - Main transformation
- `transformParameterSchema(schema, required)` - Recursive schema transformation
- `generateToolXML(tool)` - Single tool transformation

#### 6.4.2 XML-to-OpenAI Parser
**File:** `src/transformers/xml-to-openai.js`

**Input:**
```
I'll read that file for you.

<tool_call>
  <tool_name>read</tool_name>
  <parameters>
    <file_path>/tmp/test.txt</file_path>
  </parameters>
</tool_call>
```

**Output:**
```javascript
{
  hasToolCall: true,
  textBeforeToolCall: "I'll read that file for you.",
  toolCall: {
    id: "call_abc123",
    type: "function",
    function: {
      name: "read",
      arguments: '{"file_path":"/tmp/test.txt"}'
    }
  }
}
```

**Functions:**
- `parseResponse(text)` - Main parser
- `extractToolCall(xml)` - Extract XML tool call block
- `parseXMLToolCall(xml)` - Parse XML to object
- `generateToolCallId()` - Generate unique ID

#### 6.4.3 Tool Result Transformer
**File:** `src/transformers/tool-result.js`

**Input:**
```javascript
{
  role: 'tool',
  tool_call_id: 'call_123',
  content: ''  // Empty bash result
}
```

**Output:**
```javascript
{
  role: 'user',
  content: 'Tool Result from bash:\n(Command completed successfully with no output)'
}
```

**Functions:**
- `transformToolResult(toolMessage, toolName)` - Main transformer
- `formatEmptyResult(toolName)` - Handle empty results
- `formatToolResult(content, toolName)` - Format with tool name

#### 6.4.4 Session Manager
**File:** `src/services/session-manager.js`

**Functions:**
- `getParentId(conversationHash)` - Retrieve parent_id for conversation
- `saveParentId(conversationHash, parentId, messageId)` - Store new parent_id
- `generateConversationHash(messages)` - Create hash from first user+assistant
- `cleanupOldSessions(ttlMinutes)` - Remove stale sessions

---

## 7. Environment Configuration

### 7.1 Required Environment Variables

```bash
# .env file
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxx
QWEN_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
PORT=3000
NODE_ENV=production
DATABASE_PATH=./database/qwen_proxy.db
LOG_LEVEL=info
SESSION_TTL_MINUTES=60
```

### 7.2 Configuration Validation

On startup, server MUST:
1. Verify QWEN_API_KEY is set
2. Verify database file exists or create it
3. Run database migrations
4. Test Qwen API connectivity
5. Log configuration summary

---

## 8. Error Handling

### 8.1 Error Categories

**Client Errors (4xx):**
- 400 Bad Request: Invalid request format
- 401 Unauthorized: Missing API key
- 429 Too Many Requests: Rate limit exceeded

**Server Errors (5xx):**
- 500 Internal Server Error: Transformation failures
- 502 Bad Gateway: Qwen API failures
- 503 Service Unavailable: Database failures

### 8.2 Error Response Format

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "param": null
  }
}
```

### 8.3 Error Logging

All errors MUST:
1. Log to `errors` table with full context
2. Log to console with stack trace
3. Return appropriate HTTP status code
4. NOT expose internal details to client

---

## 9. Performance Requirements

### 9.1 Response Time Targets

- **Initial Request:** <3 seconds (p95)
- **Continuation Request:** <2 seconds (p95)
- **Streaming First Chunk:** <1 second (p95)

### 9.2 Scalability

- Support 100 concurrent requests
- Handle 1000 requests/minute
- Database cleanup runs every 15 minutes
- Session TTL: 1 hour

### 9.3 Monitoring

Log the following metrics:
- Request count (total, per endpoint)
- Response times (avg, p95, p99)
- Error rate (percentage)
- Qwen API latency
- Tool call frequency (per tool type)

---

## 10. Security Considerations

### 10.1 API Key Protection

- Store Qwen API key in environment variables only
- Never log API keys
- Validate API key on startup
- Support API key rotation without downtime

### 10.2 Input Validation

- Validate all request fields against schema
- Sanitize user content before logging
- Limit request size (max 100KB)
- Limit message array length (max 100 messages)

### 10.3 Rate Limiting

- Respect Qwen API rate limits
- Implement client-side rate limiting (optional)
- Return proper 429 responses

---

## 11. Development Workflow

### 11.1 Setup Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd qwen_proxy_opencode

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Qwen API key

# 4. Initialize database
npm run db:init

# 5. Run tests
npm test

# 6. Start server
npm start

# 7. Verify health
curl http://localhost:3000/health
```

### 11.2 Testing Workflow

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/integration/01-single-tool-workflow.test.js

# Run tests in watch mode (development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### 11.3 Debugging

**Enable verbose logging:**
```bash
LOG_LEVEL=debug npm start
```

**Query database for debugging:**
```bash
sqlite3 database/qwen_proxy.db

# View recent requests
SELECT * FROM requests ORDER BY created_at DESC LIMIT 10;

# View responses for a request
SELECT * FROM responses WHERE request_id = 'req_abc123';

# View recent errors
SELECT * FROM errors ORDER BY created_at DESC LIMIT 10;
```

---

## 12. Deployment

### 12.1 Production Checklist

- [ ] Environment variables configured
- [ ] Database initialized with schema
- [ ] All tests passing (unit + integration)
- [ ] Qwen API connectivity verified
- [ ] Health endpoint responding
- [ ] Error logging working
- [ ] Session cleanup scheduled

### 12.2 Monitoring in Production

**Critical Alerts:**
- Error rate >5% in 5 minutes
- Response time p95 >5 seconds
- Qwen API failures >3 in 1 minute
- Database errors

**Dashboard Metrics:**
- Request throughput (requests/minute)
- Response time distribution
- Tool call frequency
- Error breakdown by type

---

## 13. Success Metrics

### 13.1 Functional Success

✅ OpenCode can use all 11 tools without errors
✅ Multi-turn conversations work correctly
✅ No null content bugs
✅ No infinite loops from empty results
✅ Sessions persist across requests
✅ Streaming works correctly

### 13.2 Performance Success

✅ 95% of continuation requests <2s
✅ 95% of initial requests <3s
✅ Error rate <1%
✅ Support 100 concurrent users

### 13.3 Quality Success

✅ 100% test coverage on transformers
✅ All integration tests use REAL API calls
✅ Zero known bugs in production
✅ Full observability via database

---

## 14. Known Limitations

1. **Single Qwen Model:** Only supports Qwen models, not other providers
2. **Session Storage:** In-memory sessions cleared on restart (use Redis for production)
3. **No Authentication:** Proxy trusts all clients (add auth for production)
4. **SQLite Limitations:** Single-writer database (use PostgreSQL for high concurrency)
5. **Tool Call Ordering:** Assumes Qwen returns one tool call per response

---

## 15. Future Enhancements

### 15.1 Phase 2 Features

- Support multiple LLM providers (Anthropic, OpenAI, etc.)
- Redis-based session storage
- Request authentication and authorization
- Response caching
- Metrics dashboard (Grafana)
- Docker deployment
- Kubernetes manifests

### 15.2 Phase 3 Features

- Multi-model routing
- Cost tracking per request
- User quotas and billing
- Advanced monitoring (distributed tracing)
- A/B testing framework

---

## Appendix A: OpenCode Tool Definitions

The exact 11 tools that OpenCode sends:

1. **bash** - Execute bash commands
2. **edit** - Edit a file (old_string → new_string)
3. **webfetch** - Fetch web content
4. **glob** - Find files matching pattern
5. **grep** - Search file contents
6. **list** - List directory contents
7. **read** - Read file contents
8. **write** - Write to a file
9. **todowrite** - Write todo list
10. **todoread** - Read todo list
11. **task** - Launch a task agent

---

## Appendix B: Sample Requests/Responses

### B.1 Initial Request (OpenCode → Proxy)

```http
POST /v1/chat/completions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are Claude Code, an expert software engineer."
    },
    {
      "role": "user",
      "content": "Read the file /tmp/test.txt"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Read file contents",
        "parameters": {
          "type": "object",
          "properties": {
            "file_path": {"type": "string"}
          },
          "required": ["file_path"]
        }
      }
    }
  ],
  "stream": false
}
```

### B.2 Transformed Request (Proxy → Qwen)

```http
POST /v1/chat/completions HTTP/1.1
Host: dashscope.aliyuncs.com
Authorization: Bearer sk-xxxxx
Content-Type: application/json

{
  "model": "qwen-max",
  "messages": [
    {
      "role": "system",
      "content": "You are Claude Code, an expert software engineer.\n\n<tools>\n  <tool_description>\n    <tool_name>read</tool_name>\n    <description>Read file contents</description>\n    <parameters>\n      <parameter>\n        <name>file_path</name>\n        <type>string</type>\n        <required>true</required>\n      </parameter>\n    </parameters>\n  </tool_description>\n</tools>\n\nFormat tool calls as:\n<tool_call>\n  <tool_name>function_name</tool_name>\n  <parameters>\n    <param_name>value</param_name>\n  </parameters>\n</tool_call>"
    },
    {
      "role": "user",
      "content": "Read the file /tmp/test.txt"
    }
  ]
}
```

### B.3 Qwen Response

```json
{
  "id": "chatcmpl-qwen-123",
  "created": 1234567890,
  "model": "qwen-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll read that file for you.\n\n<tool_call>\n  <tool_name>read</tool_name>\n  <parameters>\n    <file_path>/tmp/test.txt</file_path>\n  </parameters>\n</tool_call>"
      },
      "finish_reason": "stop"
    }
  ],
  "parent_id": "parent_abc123",
  "message_id": "msg_xyz789"
}
```

### B.4 Transformed Response (Proxy → OpenCode)

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll read that file for you.",
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "read",
              "arguments": "{\"file_path\":\"/tmp/test.txt\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-30
- **Author:** Development Team
- **Status:** APPROVED - Ready for Implementation

---

**This document serves as the single source of truth for the Qwen Proxy implementation. All code must conform to these requirements.**
