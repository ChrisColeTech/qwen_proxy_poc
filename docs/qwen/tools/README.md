# Tool Calling / Function Calling Support

## Current Status: ⚠️ Pass-Through Only

The proxy **accepts** tool/function calling parameters from OpenAI-compatible clients but Qwen does **not currently execute custom tools**.

### What Works

- ✅ Accepts `tools` parameter in OpenAI format
- ✅ Accepts `tool_choice` parameter (`auto`, `none`, or specific function)
- ✅ Transforms tools to Qwen format
- ✅ Passes tools to Qwen API without errors
- ✅ Returns normal text responses

### What Doesn't Work

- ❌ Qwen doesn't execute the custom tools you define
- ❌ No `tool_calls` in responses
- ❌ No function execution by the model
- ❌ Model answers questions directly instead of calling tools

### Example Request

**OpenAI Format:**
```json
{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather in San Francisco?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and state"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**Response (Actual):**
```json
{
  "id": "chatcmpl-xyz",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I can't provide real-time weather updates. For the most accurate weather in San Francisco, check weather.gov or a weather app."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

**What We Expected (OpenAI-style):**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"San Francisco, CA\"}"
            }
          }
        ]
      }
    }
  ]
}
```

## Testing Results

We tested with curl sending tools to Qwen's API:

```bash
# Test 1: Weather function
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Whats the weather in SF?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          }
        }
      }
    }]
  }'

# Result: Model responded with text, no tool call
```

```bash
# Test 2: Calculator function
# Asked: "Calculate 125 * 47"
# Provided calculator tool
# Result: Model calculated it directly (5875), didn't use tool
```

## Why This Limitation Exists

1. **Qwen's API doesn't support custom tool execution** through the chat.qwen.ai endpoint
2. May only support **built-in server-side tools** (not user-defined)
3. Might require **different authentication/endpoint** for MCP access
4. Tool calling might be a **web UI-only feature**

## Workarounds

### Option 1: Client-Side Tool Handling (Not Implemented)

You could:
1. Parse Qwen's text response for tool call intent
2. Execute tools client-side
3. Send results back for final response

**Cons:** Unreliable, requires NLP parsing, hacky

### Option 2: Use Qwen's Built-in Capabilities

For common tasks, Qwen can:
- Do math calculations natively
- Reason through problems
- Generate code

So you might not need custom tools for many use cases.

### Option 3: Use Different Model

If tool calling is critical, consider:
- GPT-4/GPT-3.5 (actual OpenAI)
- Claude with tool use
- Other models with proper function calling

## Future Support

We're monitoring Qwen's API for:
- Official MCP/tool calling documentation
- New endpoints that support custom tools
- Updates to the API

Once Qwen adds proper support, we'll implement:
- ✅ Full tool call transformation
- ✅ Tool execution response handling
- ✅ Multi-turn tool calling flows

## Using This Feature

Despite the limitation, you can still **use tool definitions** in your code:

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'any-key'
});

// This won't break, but tools won't be executed
const response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'What time is it?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current time',
      parameters: { type: 'object', properties: {} }
    }
  }]
});

// Response will be normal text, no tool_calls
console.log(response.choices[0].message.content);
// "I don't have access to real-time information..."
```

## Logs

When you send tools, you'll see in the server logs:

```
info: POST /v1/chat/completions {"model":"qwen3-max","messageCount":1,"stream":false,"hasExistingChatId":false,"hasTools":true,"toolChoice":"auto"}
warn: Tools provided but Qwen does not currently execute custom tools. Request will proceed with tools passed through.
```

This confirms:
- Your tools were received
- They're being passed to Qwen
- But won't be executed

## Summary

**Current State:** Pass-through support only
**Recommendation:** Don't rely on tool execution, but code won't break if you include tool definitions
**Future:** Will implement fully once Qwen adds proper support

For now, treat Qwen as a **pure text completion model** without tool calling capabilities.
