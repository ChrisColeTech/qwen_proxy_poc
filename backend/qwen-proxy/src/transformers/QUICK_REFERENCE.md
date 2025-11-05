# Transformers Quick Reference Card

## Import

```javascript
const {
  // OpenAI → Qwen
  transformToQwenRequest,

  // Qwen → OpenAI
  transformToOpenAICompletion,

  // SSE Streaming
  SSETransformer
} = require('./src/transformers');
```

## Request Transformation (OpenAI → Qwen)

```javascript
// Input: OpenAI request
const openAIRequest = {
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi!' },
    { role: 'user', content: 'How are you?' }  // ← Only this sent
  ],
  stream: true
};

// Session from Phase 4
const session = {
  chatId: 'chat-uuid-123',
  parentId: 'parent-uuid-456'  // From previous response
};

// Transform
const qwenRequest = transformToQwenRequest(openAIRequest, session);

// Result: Qwen format with:
// - Only last message
// - All 18 required fields
// - Timestamp in seconds
// - parent_id from session
```

## Response Transformation (Qwen → OpenAI) - Non-Streaming

```javascript
// Input: Qwen response
const qwenResponse = {
  success: true,
  data: {
    parent_id: 'parent-789',  // ← Save this!
    message_id: 'msg-123',
    choices: [{
      message: {
        role: 'assistant',
        content: 'I am doing well!'
      }
    }]
  }
};

// Transform
const openAIResponse = transformToOpenAICompletion(qwenResponse, 'qwen3-max');

// Update session
const newParentId = openAIResponse._qwen_metadata.parent_id;
sessionManager.updateParentId(conversationId, newParentId);
```

## Streaming Transformation (SSE)

```javascript
const { SSETransformer } = require('./src/transformers');

async function handleStreaming(qwenStream, res, model) {
  const transformer = new SSETransformer(model);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Process chunks
  qwenStream.on('data', (chunk) => {
    const openAIChunks = transformer.processChunk(chunk);

    for (const item of openAIChunks) {
      res.write(`data: ${JSON.stringify(item)}\n\n`);
    }
  });

  // Finalize stream
  qwenStream.on('end', () => {
    const finalChunks = transformer.finalize();

    for (const item of finalChunks) {
      if (item === '[DONE]') {
        res.write('data: [DONE]\n\n');
      } else {
        res.write(`data: ${JSON.stringify(item)}\n\n`);
      }
    }

    res.end();

    // Update session
    const parentId = transformer.getParentId();
    sessionManager.updateParentId(conversationId, parentId);
  });

  qwenStream.on('error', (err) => {
    console.error('Stream error:', err);
    res.end();
  });
}
```

## The 18 Required Fields (Checklist)

When creating Qwen messages, ensure ALL 18 fields are present:

```javascript
{
  fid: crypto.randomUUID(),                          // 1
  parentId: parentId,                                // 2
  parent_id: parentId,                               // 3 (duplicate!)
  childrenIds: [],                                   // 4
  role: 'user',                                      // 5
  content: 'message text',                           // 6
  user_action: 'chat',                               // 7
  files: [],                                         // 8
  timestamp: Math.floor(Date.now() / 1000),          // 9 (seconds!)
  models: ['qwen3-max'],                             // 10
  chat_type: 't2t',                                  // 11
  sub_chat_type: 't2t',                              // 12
  feature_config: {                                  // 13
    thinking_enabled: false,                         // 14
    output_schema: 'phase'                           // 15
  },
  extra: {                                           // 16
    meta: {                                          // 17
      subChatType: 't2t'                             // 18
    }
  }
}
```

## Common Pitfalls

### ❌ WRONG: Sending full message history
```javascript
const qwenRequest = {
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi!' },
    { role: 'user', content: 'How are you?' }
  ]
};
// Error: Qwen expects only the last message
```

### ✅ CORRECT: Sending only last message
```javascript
const qwenRequest = {
  messages: [
    { role: 'user', content: 'How are you?', ...18_fields }
  ]
};
```

### ❌ WRONG: Timestamp in milliseconds
```javascript
timestamp: Date.now()  // 1761756270048 (13 digits)
```

### ✅ CORRECT: Timestamp in seconds
```javascript
timestamp: Math.floor(Date.now() / 1000)  // 1761756270 (10 digits)
```

### ❌ WRONG: Missing parent_id duplicate
```javascript
{
  parentId: 'uuid-123',
  // Missing: parent_id
}
// Error: Qwen validation fails
```

### ✅ CORRECT: Both parent_id variants
```javascript
{
  parentId: 'uuid-123',
  parent_id: 'uuid-123'  // Both required!
}
```

### ❌ WRONG: Using message_id for next request
```javascript
// Previous response
{ parent_id: 'parent-456', message_id: 'msg-789' }

// Next request
{ parent_id: 'msg-789' }  // WRONG! Use parent_id, not message_id
```

### ✅ CORRECT: Using parent_id for next request
```javascript
// Previous response
{ parent_id: 'parent-456', message_id: 'msg-789' }

// Next request
{ parent_id: 'parent-456' }  // Correct!
```

## Validation

```javascript
const { validateQwenMessage } = require('./src/transformers');

const message = createQwenMessage(...);
const result = validateQwenMessage(message);

if (!result.valid) {
  console.error('Missing fields:', result.missingFields);
}
```

## Testing

```bash
# Run all validation tests
node src/transformers/test-transformers.js

# Expected: 9/9 tests PASS
```

## SSE Chunk Types

### 1. response.created (metadata)
```javascript
{
  "response.created": {
    "chat_id": "...",
    "parent_id": "...",  // ← Extract this!
    "response_id": "..."
  }
}
// Action: Extract parent_id, DON'T send to client
```

### 2. Content chunks
```javascript
{
  "choices": [{
    "delta": {
      "role": "assistant",
      "content": "text",
      "status": "typing",
      "phase": "answer"
    }
  }],
  "usage": {...}
}
// Action: Transform and send to client
```

### 3. Finished chunk
```javascript
{
  "choices": [{
    "delta": {
      "content": "",
      "role": "assistant",
      "status": "finished",  // ← Detect this!
      "phase": "answer"
    }
  }]
}
// Action: Send custom final chunk with finish_reason: "stop"
```

## Usage Transformation

```javascript
// Qwen format
{
  input_tokens: 33,
  output_tokens: 838,
  total_tokens: 871
}

// OpenAI format (after transformation)
{
  prompt_tokens: 33,      // ← input_tokens
  completion_tokens: 838, // ← output_tokens
  total_tokens: 871       // ← total_tokens
}
```

## Session State Flow

```
Request 1 (First):
  Session IN:  { chatId: 'chat-123', parentId: null }
  Request:     parent_id = null
  Response:    parent_id = 'parent-456'
  Session OUT: { chatId: 'chat-123', parentId: 'parent-456' }

Request 2 (Follow-up):
  Session IN:  { chatId: 'chat-123', parentId: 'parent-456' }
  Request:     parent_id = 'parent-456'
  Response:    parent_id = 'parent-789'
  Session OUT: { chatId: 'chat-123', parentId: 'parent-789' }

Request 3 (Another follow-up):
  Session IN:  { chatId: 'chat-123', parentId: 'parent-789' }
  Request:     parent_id = 'parent-789'
  Response:    parent_id = 'parent-999'
  Session OUT: { chatId: 'chat-123', parentId: 'parent-999' }
```

## Files Reference

- `openai-to-qwen-transformer.js` - Request transformation
- `qwen-to-openai-transformer.js` - Response transformation
- `sse-transformer.js` - Streaming transformation
- `index.js` - Central exports
- `test-transformers.js` - Validation tests
- `README.md` - Full documentation
- `TRANSFORMATION_FLOW.md` - Visual diagrams
- `QUICK_REFERENCE.md` - This file

## Need Help?

1. Read full docs: `src/transformers/README.md`
2. See diagrams: `src/transformers/TRANSFORMATION_FLOW.md`
3. Run tests: `node src/transformers/test-transformers.js`
4. Check payload docs: `/docs/payloads/completion/`
