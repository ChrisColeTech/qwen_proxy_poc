# OpenCode API Integration: Lessons Learned

**Generated:** 2025-10-30
**Based on:** OpenCode source code analysis at `/mnt/d/Projects/opencode/`

---

## Executive Summary

**OpenCode uses the standard Vercel AI SDK** with OpenAI-compatible providers. It does NOT have custom API requirements beyond standard OpenAI format. The integration will be straightforward as OpenCode already supports OpenAI-compatible endpoints out of the box.

---

## Key Findings

### 1. OpenCode Uses Vercel AI SDK

OpenCode is built on top of the [Vercel AI SDK](https://sdk.vercel.ai/), specifically using:

```typescript
import {
  generateText,
  streamText,
  type ModelMessage,
  type Tool as AITool,
  tool,
  wrapLanguageModel,
  type StreamTextResult,
  stepCountIs,
  jsonSchema,
} from "ai"
```

**Source:** `packages/opencode/src/session/prompt.ts`

This means:
- OpenCode expects **standard OpenAI API format**
- Request/response follows OpenAI specification
- Streaming uses **Server-Sent Events (SSE)** format
- Tool calls use **OpenAI function calling format**

---

### 2. Provider System is Flexible

OpenCode has a provider abstraction layer that supports many LLM providers through the AI SDK:

```typescript
// From packages/opencode/src/provider/provider.ts
const providers = {
  anthropic,
  openai,
  azure,
  openrouter,
  vercel,
  "amazon-bedrock",
  "google-vertex",
  opencode,  // Their own hosted service
  // ... custom providers can be added
}
```

Each provider uses npm packages from `@ai-sdk/*`:
- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/openai-compatible` (for custom endpoints)

**For custom providers:** OpenCode uses `@ai-sdk/openai-compatible` which means **any OpenAI-compatible API will work**.

---

### 3. No Custom Request Format

OpenCode does NOT transform requests into a custom format. It passes standard OpenAI messages directly:

```typescript
// From session/prompt.ts
messages: [
  ...system.map((x): ModelMessage => ({
    role: "system",
    content: x,
  })),
  ...MessageV2.toModelMessage(msgs.filter(...))
],
```

**Messages structure:**
- Standard OpenAI format
- `role`: "system" | "user" | "assistant"
- `content`: string or array (for multimodal)
- Optional: `tool_calls`, `tool_call_id`

---

### 4. Streaming is Standard SSE

OpenCode uses standard Server-Sent Events (SSE) streaming:

```typescript
// From session/prompt.ts
const stream = await streamText({
  model: model.language,
  messages: [...],
  stream: true,
  tools: {...}
})

for await (const value of stream.fullStream) {
  switch (value.type) {
    case "text-delta":
      // Process text chunks
    case "tool-call":
      // Process tool calls
    case "finish":
      // Handle completion
  }
}
```

**SSE Format Expected:**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1234567890,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

This is **identical to OpenAI's streaming format** - no transformation needed.

---

### 5. Special Headers for OpenCode Provider

When using OpenCode's own hosted service, it sends custom headers:

```typescript
// From session/prompt.ts
headers: model.providerID === "opencode"
  ? {
      "x-opencode-session": input.sessionID,
      "x-opencode-request": userMsg.info.id,
    }
  : undefined,
```

**For our proxy:**
- These headers are ONLY for OpenCode's hosted service
- We do NOT need to handle these special headers
- Our proxy should work like any other OpenAI-compatible provider

---

### 6. Temperature and TopP for Qwen

OpenCode has model-specific parameter transformations:

```typescript
// From provider/transform.ts
export function temperature(_providerID: string, modelID: string) {
  if (modelID.toLowerCase().includes("qwen")) return 0.55
  if (modelID.toLowerCase().includes("claude")) return undefined
  return 0
}

export function topP(_providerID: string, modelID: string) {
  if (modelID.toLowerCase().includes("qwen")) return 1
  return undefined
}
```

**For Qwen models:**
- Temperature: 0.55 (not 0)
- TopP: 1

Our proxy should:
- Accept these parameters from OpenCode
- Pass them through to Qwen API (if supported)
- Use defaults if not provided

---

### 7. Tool Calling Support

OpenCode supports tool calling using OpenAI function calling format:

```typescript
// From session/prompt.ts
tools: model.info.tool_call === false ? undefined : tools,

// Tool definition
tool({
  id: item.id,
  description: item.description,
  inputSchema: jsonSchema(schema),
  async execute(args, options) {
    // Tool execution
    return { output: "..." }
  }
})
```

**Standard OpenAI function format:**
```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather for location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

**Note:** Qwen API doesn't currently support tool calling in the way OpenAI does. Our proxy should:
- Accept tool definitions
- Document that tools are not supported
- Return clear error if tools are requested

---

### 8. Caching Support

OpenCode implements prompt caching for supported providers:

```typescript
// From provider/transform.ts
function applyCaching(msgs: ModelMessage[], providerID: string) {
  const system = msgs.filter((msg) => msg.role === "system").slice(0, 2)
  const final = msgs.filter((msg) => msg.role !== "system").slice(-2)

  // Add cache control to key messages
  for (const msg of unique([...system, ...final])) {
    msg.providerOptions = {
      ...msg.providerOptions,
      anthropic: {
        cacheControl: { type: "ephemeral" }
      }
    }
  }
}
```

**For Qwen:**
- Caching is only applied to Anthropic/Claude models
- No special caching headers needed for Qwen
- Our proxy doesn't need to handle caching

---

### 9. Message History Handling

OpenCode sends **complete conversation history** in each request:

```typescript
// From session/prompt.ts
messages: [
  ...system.map((x): ModelMessage => ({
    role: "system",
    content: x,
  })),
  ...MessageV2.toModelMessage(msgs.filter(...))
]
```

**This is important:**
- OpenCode maintains full conversation context
- Sends ALL messages in each request
- Our proxy receives full history
- We transform to Qwen format (only last message with parent_id chain)

This is **identical to how RooCode works** - full history sent, proxy extracts context.

---

### 10. Error Handling Expected

OpenCode expects standard OpenAI error format:

```typescript
// Error handling in session/prompt.ts
onError(error) {
  log.error("stream error", { error })
}
```

**Standard OpenAI error format:**
```json
{
  "error": {
    "message": "Error description",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

Our proxy already implements this format - no changes needed.

---

### 11. Model Selection

OpenCode users can configure which model to use via config:

```typescript
// From provider/provider.ts
export async function defaultModel() {
  const cfg = await Config.get()
  if (cfg.model) return parseModel(cfg.model)
  // ... fallback logic
}

export function parseModel(model: string) {
  const [providerID, ...rest] = model.split("/")
  return {
    providerID: providerID,
    modelID: rest.join("/"),
  }
}
```

**Model format:** `providerID/modelID`
- Example: `openai/gpt-4`
- Example: `anthropic/claude-3-5-sonnet`
- Example: `custom-provider/qwen3-max`

**For our proxy:**
- Users will configure something like: `qwen-proxy/qwen3-max`
- Or just use `qwen3-max` if providerID is set separately

---

### 12. Models API Expected

OpenCode expects `/v1/models` endpoint to return available models:

```typescript
// From provider/models.ts
export async function get() {
  const result = await fetch("https://models.dev/api.json")
  return result as Record<string, Provider>
}

export const Model = z.object({
  id: z.string(),
  name: z.string(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  tool_call: z.boolean(),
  cost: z.object({
    input: z.number(),
    output: z.number(),
  }),
  limit: z.object({
    context: z.number(),
    output: z.number(),
  }),
})
```

**Standard OpenAI models format:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "created": 1234567890,
      "owned_by": "qwen",
      "metadata": {
        "capabilities": { ... },
        "max_context_length": 262144
      }
    }
  ]
}
```

Our proxy already implements this - no changes needed.

---

## Differences from Standard OpenAI

### What OpenCode DOESN'T Do

1. **No custom request format** - Uses standard OpenAI messages
2. **No custom response format** - Expects standard OpenAI responses
3. **No custom authentication** - Uses standard API key header
4. **No special streaming format** - Standard SSE
5. **No custom tool format** - Standard OpenAI functions

### What OpenCode DOES Differently

1. **Provider-specific transformations:**
   - Temperature: 0.55 for Qwen (not 0)
   - TopP: 1 for Qwen
   - Tool call ID normalization for Claude
   - Caching for Anthropic

2. **System prompt variations:**
   - Different prompts per provider/model
   - Qwen gets concise, direct prompt
   - Claude gets detailed TodoWrite instructions

3. **Message compaction:**
   - OpenCode can summarize long conversations
   - This happens client-side
   - Proxy sees normal messages

---

## Compatibility Assessment

### ✅ What Already Works

1. **Request format** - OpenCode sends standard OpenAI format
2. **Response format** - Our proxy returns standard OpenAI format
3. **Streaming** - Our proxy uses standard SSE
4. **Error handling** - Our proxy returns standard error format
5. **Models endpoint** - Already implemented
6. **Message history** - Already handled (like RooCode)

### ⚠️ What Needs Testing

1. **Temperature/TopP parameters** - Verify they're passed through
2. **System prompt handling** - Ensure concatenated prompts work
3. **Long conversations** - Test context limit handling
4. **Streaming performance** - Verify low latency

### ❌ What Doesn't Work (Yet)

1. **Tool calling** - Qwen API doesn't support this
   - Document limitation
   - Return clear error if tools requested
   - Future: Could implement via prompt engineering

2. **Thinking/Reasoning** - Qwen has different reasoning format
   - OpenCode expects `o1` style thinking
   - Qwen uses inline thinking tokens
   - May need transformation if important

---

## Integration Approach

### Option 1: Zero Changes (Recommended)

**Verdict:** Our existing proxy should work with OpenCode out-of-the-box.

**Why:**
- OpenCode uses standard OpenAI format
- Our proxy already implements OpenAI compatibility
- Same pattern as RooCode integration (already working)

**Testing needed:**
1. Configure OpenCode to use our proxy endpoint
2. Set base URL: `http://localhost:3000/v1`
3. Set API key: Any value (we don't validate)
4. Test basic chat
5. Test streaming
6. Test multi-turn conversations

### Option 2: Add OpenCode-Specific Optimizations

**Optional enhancements:**

1. **Detect OpenCode User-Agent:**
   ```javascript
   if (req.headers['user-agent']?.includes('opencode')) {
     // Apply OpenCode-specific optimizations
   }
   ```

2. **Auto-apply temperature/topP:**
   ```javascript
   if (!req.body.temperature && modelID.includes('qwen')) {
     req.body.temperature = 0.55
     req.body.top_p = 1
   }
   ```

3. **Handle tool call rejections gracefully:**
   ```javascript
   if (req.body.tools && req.body.tools.length > 0) {
     return res.status(400).json({
       error: {
         message: "Tool calling is not currently supported with Qwen models",
         type: "unsupported_feature",
         code: "tools_not_supported"
       }
     })
   }
   ```

---

## Configuration Guide

### OpenCode Configuration

To use our proxy, OpenCode users need to configure a custom provider:

**Option 1: Via Config File** (`~/.opencode/config.toml`)

```toml
[provider.qwen-proxy]
name = "Qwen Proxy"
npm = "@ai-sdk/openai-compatible"
api = "http://localhost:3000/v1"

[provider.qwen-proxy.models.qwen3-max]
id = "qwen3-max"
name = "Qwen3 Max"
tool_call = false
temperature = true
cost = { input = 0, output = 0 }
limit = { context = 262144, output = 32768 }
```

**Option 2: Via Environment Variables**

```bash
export OPENAI_BASE_URL="http://localhost:3000/v1"
export OPENAI_API_KEY="not-needed"
```

Then use `opencode` with `--provider openai --model qwen3-max`

---

## Testing Recommendations

### Basic Functionality Tests

1. **Simple request:**
   ```bash
   # Configure OpenCode to use proxy
   # Then:
   opencode "what is 2+2?"
   ```

2. **Streaming:**
   ```bash
   opencode "count from 1 to 5"
   # Should see incremental output
   ```

3. **Multi-turn:**
   ```bash
   opencode "my name is Alice"
   # Then:
   opencode "what is my name?"
   # Should remember "Alice"
   ```

### Edge Cases

1. **Long prompts:**
   - Test with large code files
   - Verify context window handling

2. **Special characters:**
   - Test with code containing quotes, backticks
   - Test with unicode

3. **Error conditions:**
   - Test without credentials (should fail gracefully)
   - Test with invalid model name
   - Test network errors

---

## Performance Considerations

### Latency

OpenCode users expect:
- **Time to first token:** < 2 seconds
- **Streaming chunks:** Every 50-100ms
- **Total response:** < 30 seconds

Our proxy should:
- Stream immediately (don't buffer)
- Use persistent HTTP connections
- Cache models list

### Token Usage

OpenCode tracks token usage:
```typescript
const usage = {
  input_tokens: 10,
  output_tokens: 50,
  total_tokens: 60
}
```

Our proxy already returns this in responses.

---

## Security Considerations

### API Key Handling

OpenCode sends API key in header:
```
Authorization: Bearer <api_key>
```

Our proxy:
- Currently doesn't validate API keys
- Should document this behavior
- Could add validation if needed

### System Prompt Injection

OpenCode concatenates multiple system messages:
1. Base prompt (provider-specific)
2. Environment info (directory, git status)
3. Custom instructions (AGENTS.md)

This could contain sensitive information:
- File paths
- Directory structure
- Custom prompts

Our proxy should:
- NOT log full system prompts
- Sanitize logs
- Respect user privacy

---

## Summary

### Key Takeaways

1. **OpenCode is fully OpenAI-compatible** - No custom format needed
2. **Our proxy should work out-of-the-box** - Same as RooCode
3. **No request/response transformers needed** - Standard format works
4. **Testing is critical** - Verify end-to-end flow
5. **Tool calling is not supported** - Document this limitation
6. **Temperature defaults differ** - 0.55 for Qwen vs 0 for others

### Next Steps

1. Create integration test (like `roocode-compatibility.test.js`)
2. Test with actual OpenCode CLI
3. Document configuration for users
4. Consider optional optimizations
5. Document known limitations (tool calling, reasoning)

### Confidence Level

**HIGH** - OpenCode should work with our existing proxy implementation with minimal to no changes. The integration follows the same pattern as RooCode, which is already working.
