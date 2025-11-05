# Phase 3: Core Transformers for Request/Response Conversion

**Status:** ✓ Complete
**Date:** 2025-10-29

## Overview

This directory contains the core transformation logic for converting between OpenAI and Qwen API formats. All transformers are fully implemented and validated against the official Qwen API documentation.

## Files

### 1. `openai-to-qwen-transformer.js` (225 lines)

Transforms OpenAI chat completion requests to Qwen message format.

**Key Features:**
- Creates Qwen messages with ALL 18 required fields
- Extracts only the last message from OpenAI messages array
- Uses Unix SECONDS for timestamps (not milliseconds)
- Handles parent_id chain for multi-turn conversations

**Exported Functions:**
- `extractLastMessage(messages)` - Extract last message from array
- `createQwenMessage(message, parentId, model)` - Create complete Qwen message
- `transformToQwenRequest(openAIRequest, session, stream)` - Transform complete request
- `transformToQwenRequestNonStreaming(openAIRequest, session)` - Non-streaming variant
- `validateQwenMessage(message)` - Validate all 18 fields are present

**Critical Requirements Met:**
- ✓ All 18 Qwen fields present (see list below)
- ✓ Timestamp in Unix seconds (10 digits, not 13)
- ✓ Only last message extracted (Qwen maintains context server-side)
- ✓ parent_id chain logic (null first, UUID for follow-ups)

### 2. `qwen-to-openai-transformer.js` (268 lines)

Transforms Qwen responses to OpenAI-compatible format.

**Key Features:**
- Handles both streaming and non-streaming responses
- Transforms Qwen usage format to OpenAI format
- Extracts parent_id for session management
- Identifies special chunks (response.created, finished)

**Exported Functions:**
- `transformToOpenAICompletion(qwenResponse, model)` - Non-streaming response
- `transformToOpenAIChunk(qwenChunk, model, completionId)` - Streaming chunk
- `extractParentId(qwenResponse)` - Get parent_id for session
- `extractUsage(qwenResponse)` - Transform usage format
- `createFinalChunk(finishReason, model, completionId)` - End-of-stream chunk
- `createUsageChunk(usage, model, completionId)` - Usage chunk
- `hasContent(qwenChunk)` - Check if chunk has content
- `isResponseCreatedChunk(chunk)` - Identify metadata chunk
- `isFinishedChunk(chunk)` - Identify finish chunk

### 3. `sse-transformer.js` (263 lines)

Handles Server-Sent Events (SSE) stream transformation.

**Key Features:**
- Buffers incomplete SSE chunks
- Filters out response.created metadata chunk
- Extracts parent_id from stream
- Sends proper [DONE] marker
- Handles usage info in final chunks

**Exported Classes:**
- `SSETransformer` - Main transformer class
  - `processChunk(chunk)` - Process raw SSE data
  - `transformChunk(qwenChunk)` - Transform single chunk
  - `finalize()` - Get final chunks before closing
  - `getParentId()` - Get extracted parent_id

**Exported Functions:**
- `transformStream(qwenStream, outputStream, model)` - High-level stream transformer

### 4. `index.js` (59 lines)

Central export point for all transformer functions.

### 5. `test-transformers.js` (329 lines)

Comprehensive validation tests for all transformers.

## The 18 Required Qwen Message Fields

Based on `/docs/payloads/completion/request.sh`:

1. **fid** - UUID v4 for this message
2. **parentId** - UUID from session or null (camelCase)
3. **parent_id** - Duplicate of parentId (snake_case, required by Qwen)
4. **childrenIds** - Empty array for new messages
5. **role** - "user" or "assistant"
6. **content** - Message text
7. **user_action** - Always "chat"
8. **files** - Empty array (no file support yet)
9. **timestamp** - Unix SECONDS (10 digits, NOT milliseconds)
10. **models** - Array with model name (e.g., ["qwen3-max"])
11. **chat_type** - "t2t" for text-to-text
12. **sub_chat_type** - Duplicate of chat_type
13. **feature_config** - Object with configuration
14. **feature_config.thinking_enabled** - Boolean, false
15. **feature_config.output_schema** - String, "phase"
16. **extra** - Object with metadata
17. **extra.meta** - Object with subChatType
18. **extra.meta.subChatType** - String, matches chat_type ("t2t")

**Critical Discovery:** Missing even 2% of these fields (e.g., `parent_id` duplicate) causes Qwen validation errors. ALL 18 fields are mandatory.

## Timestamp Format

**CRITICAL:** Timestamps must be Unix SECONDS, not milliseconds.

```javascript
// CORRECT (10 digits)
timestamp: Math.floor(Date.now() / 1000)  // 1761756270

// WRONG (13 digits)
timestamp: Date.now()  // 1761756270048
```

## SSE Streaming Flow

Based on `/docs/payloads/completion/streaming_response.md`:

### Qwen SSE Format:

1. **First chunk** (response.created):
   ```
   data: {"response.created":{"chat_id": "...", "parent_id": "...", "response_id":"..."}}
   ```
   - Extract `parent_id` for session management
   - **DO NOT** send this chunk to client

2. **Content chunks**:
   ```
   data: {"choices": [{"delta": {"content": "text", "role": "assistant", "status": "typing"}}], "usage": {...}}
   ```
   - Transform and send to client
   - Update usage info

3. **Final chunk**:
   ```
   data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished"}}]}
   ```
   - Detect by `status: "finished"`
   - **DO NOT** send Qwen's finish chunk
   - Instead, send OpenAI-format final chunk

### OpenAI SSE Format (Output):

1. **Content chunks**:
   ```
   data: {"id": "chatcmpl-...", "object": "chat.completion.chunk", "choices": [{"delta": {"content": "text"}}]}
   ```

2. **Final chunk**:
   ```
   data: {"id": "chatcmpl-...", "choices": [{"delta": {}, "finish_reason": "stop"}]}
   ```

3. **Usage chunk** (optional):
   ```
   data: {"id": "chatcmpl-...", "choices": [], "usage": {...}}
   ```

4. **Done marker**:
   ```
   data: [DONE]
   ```

## Usage Examples

### Request Transformation

```javascript
const { transformToQwenRequest } = require('./transformers');

const openAIRequest = {
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi!' },
    { role: 'user', content: 'How are you?' }
  ],
  stream: true
};

const session = {
  chatId: 'chat-uuid-123',
  parentId: 'parent-uuid-456' // from previous response
};

const qwenRequest = transformToQwenRequest(openAIRequest, session);
// Result:
// - Only last message included: "How are you?"
// - parent_id set to 'parent-uuid-456'
// - All 18 fields present in message
// - Timestamp in seconds
```

### Response Transformation (Non-streaming)

```javascript
const { transformToOpenAICompletion } = require('./transformers');

const qwenResponse = {
  success: true,
  data: {
    parent_id: 'parent-789',
    message_id: 'msg-123',
    choices: [{
      message: {
        role: 'assistant',
        content: 'I am doing well, thank you!'
      }
    }]
  }
};

const openAIResponse = transformToOpenAICompletion(qwenResponse, 'qwen3-max');
// Result: OpenAI-format completion with parent_id in _qwen_metadata
```

### Streaming Transformation

```javascript
const { SSETransformer } = require('./transformers');

const transformer = new SSETransformer('qwen3-max');

// Process chunks as they arrive
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

  // Update session with extracted parent_id
  const parentId = transformer.getParentId();
  sessionManager.updateParentId(conversationId, parentId);
});
```

## Validation

Run the comprehensive validation test:

```bash
node src/transformers/test-transformers.js
```

**Expected Output:**
```
=== Phase 3 Transformer Validation ===

Test 1: Extract Last Message
  ✓ Correctly extracts only last message

Test 2: All 18 Required Qwen Fields
  ✓ PASS - All 18 fields present!

Test 3: Timestamp Format (Unix Seconds)
  ✓ PASS: Timestamp is in seconds (10 digits)

Test 4: Complete Request Transformation
  ✓ PASS: Only last message included in request

Test 5: parent_id Chain Logic
  ✓ PASS: parent_id chain logic correct

Test 6: SSE Chunk Transformation
  ✓ Correctly identifies and extracts parent_id
  ✓ Correctly transforms content chunk
  ✓ Correctly identifies finish chunk

Test 7: Usage Transformation
  ✓ PASS: Usage correctly transformed

Test 8: SSE Transformer Class
  ✓ response.created chunk handled correctly
  ✓ Content chunk transformed correctly
  ✓ Finalization produces correct chunks

Test 9: Non-streaming Response Transformation
  ✓ PASS: Non-streaming response correctly transformed

✓ Phase 3 Complete!
```

## Integration Points

These transformers are used by:

- **Phase 8: Chat Completions Handler** - Uses `transformToQwenRequest` and `SSETransformer`
- **Phase 4: Session Manager** - Receives `parent_id` from `extractParentId`
- **Phase 5: Request Transformers** - Alternative names in implementation plan
- **Phase 6: Response Transformers** - Alternative names in implementation plan

## Key Discoveries from Tests

From `/backend/tests/03-parent-id-discovery.test.js`:

1. **parent_id vs message_id**: Use the `parent_id` field from Qwen's response, NOT the `message_id`
2. **Context preservation**: Qwen maintains conversation context server-side via the parent_id chain
3. **Only last message**: Sending full message history causes errors; Qwen expects only the latest message

## Dependencies

- `crypto` (Node.js built-in) - For UUID generation

## Performance Notes

- Request transformation: O(1) - Only processes last message
- Response transformation: O(1) - Single pass
- SSE transformation: O(n) - Buffers and processes each chunk once
- Validation: O(1) - Fixed number of field checks

## Error Handling

All transformers throw descriptive errors:

- `extractLastMessage`: Throws if messages array is empty
- `createQwenMessage`: Validates message structure
- `validateQwenMessage`: Returns detailed list of missing fields
- `SSETransformer.processChunk`: Catches and logs JSON parse errors

## Testing Coverage

- ✓ All 18 fields present in Qwen messages
- ✓ Timestamp format (seconds vs milliseconds)
- ✓ Last message extraction
- ✓ parent_id chain logic (null → UUID)
- ✓ SSE chunk types (response.created, content, finished)
- ✓ Usage transformation
- ✓ Non-streaming responses
- ✓ Stream finalization
- ✓ [DONE] marker

## Next Steps

Phase 3 is complete. The transformers are ready to be integrated into:

- **Phase 4**: Session management
- **Phase 7**: Models endpoint
- **Phase 8**: Chat completions handler

## References

- `/docs/payloads/completion/request.sh` - Qwen request format with all 18 fields
- `/docs/payloads/completion/response.json` - Qwen non-streaming response
- `/docs/payloads/completion/streaming_response.md` - Qwen SSE format
- `/backend/tests/03-parent-id-discovery.test.js` - parent_id chain discovery
- `/docs/CORRECT_IMPLEMENTATION_PLAN.md` - Phase 3 requirements
