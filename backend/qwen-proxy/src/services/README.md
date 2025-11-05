# Services Module

This directory contains low-level service modules for interacting with external APIs.

## QwenClient

The `QwenClient` class provides a low-level HTTP client for the Qwen API with the following features:

### Features

1. **Real API Integration** - Makes actual HTTP calls to Qwen endpoints (NOT hardcoded data)
2. **Authentication** - Automatically includes auth headers from auth-service
3. **Error Handling** - Transforms errors to user-friendly messages
4. **Retry Logic** - Automatic retry with exponential backoff
5. **Streaming Support** - Handles both streaming and non-streaming responses

### Endpoints

#### getModels()
```javascript
const { QwenClient } = require('./services');
const client = new QwenClient();

const response = await client.getModels();
// Returns: { data: [ { id: "qwen3-max", name: "Qwen3-Max", ... } ] }
```

#### createNewChat()
```javascript
const chatId = await client.createNewChat("My Chat", ["qwen3-max"]);
// Returns: "0bb333d4-3f20-434d-88c4-5768860e772d"
```

#### sendMessage() - Non-streaming
```javascript
const qwenPayload = {
  stream: false,
  chat_id: chatId,
  messages: [...],
  // ... (complete Qwen payload format)
};

const response = await client.sendMessage(qwenPayload, { stream: false });
// Returns: { status: 200, data: { success: true, data: { ... } } }
```

#### sendMessage() - Streaming
```javascript
const qwenPayload = {
  stream: true,
  chat_id: chatId,
  messages: [...],
  // ... (complete Qwen payload format)
};

const response = await client.sendMessage(qwenPayload, { stream: true });

// Handle stream
response.data.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const data = JSON.parse(line.substring(5));
      // Process chunk...
    }
  }
});
```

### Error Handling

All errors are transformed to `QwenAPIError`:

```javascript
const { QwenAPIError } = require('./services');

try {
  await client.getModels();
} catch (error) {
  if (error instanceof QwenAPIError) {
    console.log('Status:', error.statusCode);
    console.log('Message:', error.message);
  }
}
```

### Retry Logic

The client automatically retries on:
- Network errors (ECONNREFUSED, ETIMEDOUT)
- Server errors (5xx)
- Rate limiting (429)

It does NOT retry on:
- Authentication errors (401, 403)
- Client errors (4xx except 429)

```javascript
const result = await client.withRetry(
  async () => await client.getModels(),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  }
);
```

## Usage in Handlers

The QwenClient is designed to be used by handler modules:

```javascript
// In handlers/models-handler.js
const { QwenClient } = require('../services');
const auth = require('../api/qwen-auth');
const config = require('../config');

const client = new QwenClient(auth, config);

async function listModels(req, res, next) {
  try {
    const qwenModels = await client.getModels();
    // Transform to OpenAI format...
    res.json(openAIFormat);
  } catch (error) {
    next(error); // Pass to error middleware
  }
}
```

## Testing

All endpoints are tested with REAL API calls:

```bash
npm test tests/unit/qwen-client.test.js
```

Tests verify:
- getModels() calls real Qwen API
- createNewChat() creates actual chat sessions
- sendMessage() works for both streaming and non-streaming
- Error handling transforms errors correctly
- Retry logic implements exponential backoff
- Integration with auth-service works

## SSEHandler

The `SSEHandler` class manages Server-Sent Events streaming for real-time responses from Qwen to OpenAI-compatible clients.

### Features

1. **SSE Protocol** - Proper Server-Sent Events headers and format
2. **Real-time Streaming** - Chunks sent as soon as received from Qwen
3. **Chunk Transformation** - Uses SSETransformer to convert Qwen → OpenAI format
4. **parent_id Management** - Extracts and updates session with parent_id
5. **Error Handling** - Graceful error handling with client notification
6. **Client Disconnect** - Stops streaming immediately on disconnect

### Usage

```javascript
const SSEHandler = require('./services/sse-handler');

// Initialize with dependencies
const handler = new SSEHandler(qwenClient, sessionManager);

// Stream a completion
app.post('/v1/chat/completions', async (req, res) => {
  const sessionId = getOrCreateSession(req.body.messages);

  const qwenMessage = {
    stream: true,
    chat_id: session.chatId,
    messages: [...],
    // ... complete Qwen payload
  };

  try {
    await handler.streamCompletion(
      qwenMessage,
      req,
      res,
      sessionId,
      'qwen3-max'
    );
  } catch (error) {
    // Error already sent to client
    console.error('Stream error:', error);
  }
});
```

### SSE Format

The handler sends chunks in standard SSE format:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":" World"}}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]

```

### parent_id Flow

```
1. Qwen sends: data: {"response.created": {"parent_id": "123"}}
   ↓
2. SSEHandler extracts parent_id
   ↓
3. SSEHandler filters out this chunk (not sent to client)
   ↓
4. At stream end: sessionManager.updateSession(sessionId, { parentId: "123" })
   ↓
5. Next request uses parent_id for conversation continuity
```

### Error Handling

Errors are sent to client in SSE format:

```javascript
data: {"error":{"message":"Stream error occurred","type":"stream_error","code":"unknown_error"}}

data: [DONE]

```

### Client Disconnect

```javascript
req.on('close', () => {
  // Handler automatically:
  // 1. Stops processing chunks
  // 2. Destroys Qwen stream
  // 3. Cleans up resources
});
```

### Testing

```bash
# Run unit tests
npm test tests/unit/sse-handler.test.js

# Run integration tests
npm test tests/integration/streaming.test.js

# Run standalone verification
node tests/run-sse-tests.js
```

### Documentation

See `/docs/PHASE_6_SSE_HANDLER.md` for complete documentation.

## Phase Status

### ✅ Phase 5 Complete
**Qwen API Client with Real Endpoint Calls**
- `QwenClient` with real API integration
- Error handling and retry logic
- Streaming and non-streaming support

### ✅ Phase 6 Complete
**SSE Streaming Handler for Real-Time Responses**
- `SSEHandler` with SSE protocol support
- Real-time chunk streaming
- parent_id extraction and session updates
- Client disconnect and error handling
- **Tests:** 17/17 passing

**Next:** Phase 7 will use QwenClient in `models-handler.js`
**Next:** Phase 8 will use both QwenClient and SSEHandler in `chat-completions-handler.js`
