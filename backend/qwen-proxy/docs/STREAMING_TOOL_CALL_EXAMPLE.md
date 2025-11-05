# Streaming Tool Call Example

This document demonstrates how the streaming tool call transformation works in practice.

## Scenario

A user asks: "Read the package.json file"

## Step-by-Step Flow

### 1. Qwen Streaming Response (Input)

Qwen streams the response in chunks:

```
# Chunk 1: Metadata
data: {"response.created":{"chat_id":"chat-123","parent_id":"parent-456","response_id":"resp-789"}}

# Chunk 2: Start of text
data: {"choices":[{"delta":{"role":"assistant","content":"I'll ","phase":"answer","status":"typing"}}],"usage":{"input_tokens":25,"output_tokens":1}}

# Chunk 3: More text
data: {"choices":[{"delta":{"content":"read "}}]}

# Chunk 4: More text
data: {"choices":[{"delta":{"content":"the "}}]}

# Chunk 5: End of text
data: {"choices":[{"delta":{"content":"file.\n\n"}}]}

# Chunk 6: Start of XML
data: {"choices":[{"delta":{"content":"<read>\n"}}]}

# Chunk 7: XML parameter
data: {"choices":[{"delta":{"content":"<filePath>/home/user/package.json</filePath>\n"}}]}

# Chunk 8: End of XML
data: {"choices":[{"delta":{"content":"</read>"}}]}

# Chunk 9: Finish marker
data: {"choices":[{"delta":{"content":"","phase":"answer","status":"finished"}}]}

data: [DONE]
```

### 2. SSETransformer Processing

The transformer processes each chunk:

#### Chunks 1-2: Buffer text
```javascript
accumulatedContent = "I'll read the file.\n\n"
toolCallDetected = false
```

Output:
```json
{"id":"chatcmpl-xxx","choices":[{"delta":{"role":"assistant","content":"I'll read the file."}}]}
```

#### Chunks 6-8: Detect and buffer XML
```javascript
accumulatedContent = "I'll read the file.\n\n<read>\n<filePath>/home/user/package.json</filePath>\n</read>"
toolCallDetected = true
toolCallSent = false
```

After chunk 8, complete XML detected, parse and stream:

#### Output Chunk 1: Tool call start
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion.chunk",
  "created": 1698765432,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "delta": {
      "role": "assistant",
      "tool_calls": [{
        "index": 0,
        "id": "call_a1b2c3d4",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": ""
        }
      }]
    },
    "finish_reason": null
  }]
}
```

#### Output Chunk 2: Tool call arguments
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion.chunk",
  "created": 1698765432,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "delta": {
      "tool_calls": [{
        "index": 0,
        "function": {
          "arguments": "{\"filePath\":\"/home/user/package.json\"}"
        }
      }]
    },
    "finish_reason": null
  }]
}
```

### 3. Finalize Stream

When Qwen sends the finish marker, transformer finalizes:

#### Output Chunk 3: Final chunk
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion.chunk",
  "created": 1698765432,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "delta": {},
    "finish_reason": "tool_calls"
  }]
}
```

#### Output Chunk 4: Usage chunk
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion.chunk",
  "created": 1698765432,
  "model": "qwen3-max",
  "choices": [],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}
```

#### Output Chunk 5: Done marker
```
data: [DONE]
```

### 4. Complete Response (for logging)

The complete response object stored in the database:

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1698765432,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "I'll read the file.",
      "tool_calls": [{
        "id": "call_a1b2c3d4",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"filePath\":\"/home/user/package.json\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}
```

## Key Points

### 1. Content Buffering
All content is buffered in `accumulatedContent` to enable:
- Tool call detection
- Complete response generation for logging
- Text extraction before tool calls

### 2. Tool Call Detection
The system detects tool calls as soon as the opening tag `<read>` appears, but waits until the closing tag `</read>` before parsing and streaming.

### 3. Streaming Delay
There's a slight delay when a tool call is detected:
- Text before tool call: Streamed immediately
- Tool call: Streamed after complete XML received
- Typical delay: 1-2 chunks (~50-100ms)

### 4. finish_reason Determination
The `finish_reason` is determined during streaming:
- Tool call detected → `finish_reason: "tool_calls"`
- No tool call → `finish_reason: "stop"`

### 5. Session Management
After streaming completes:
- `parent_id` is extracted and session updated
- Complete response is logged to database
- Conversation hash is set (for new sessions)

## Comparison: Without Tool Call

For comparison, here's a normal response without tool calls:

### Input (Qwen)
```
data: {"choices":[{"delta":{"content":"The package.json file contains 5 dependencies."}}]}
data: [DONE]
```

### Output (OpenAI)
```json
{"choices":[{"delta":{"role":"assistant","content":"The package.json file contains 5 dependencies."}}]}
{"choices":[{"delta":{},"finish_reason":"stop"}]}
{"usage":{"prompt_tokens":20,"completion_tokens":10,"total_tokens":30}}
```

Note: `finish_reason: "stop"` instead of `"tool_calls"`

## Error Handling

### Malformed XML
If XML is malformed, the system gracefully falls back to text:

```javascript
// Malformed: <read><filePath>/test.js</read> (missing closing tag)
// Result: Streamed as normal text, no tool call detected
```

### Partial XML at Stream End
If stream ends with incomplete XML:

```javascript
// Incomplete: "Let me read it.\n\n<read>\n<filePath>/test"
// Result: Streamed as text up to incomplete XML
// Note: Tool call not sent because XML incomplete
```

## Testing

Test this flow with:

```bash
npm test -- tests/unit/sse-streaming-tools.test.js
```

Key test: "should handle realistic streaming sequence"

## Integration

The transformation is automatic - no code changes needed in:
- SSE handler
- Route handlers
- Persistence middleware

The transformer handles everything internally!

---

**See also**:
- `/docs/TOOL_CALLING_TRANSFORMATION_PLAN.md` - Overall architecture
- `/docs/TOOL_TRANSFORMATION_EXAMPLES.md` - More examples
- `/docs/PHASE_4_IMPLEMENTATION_REPORT.md` - Implementation details
