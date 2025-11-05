# OpenCode Tool Calling Investigation Report

**Date**: 2025-10-30
**Investigator**: Claude
**OpenCode Version**: 0.15.29
**AI SDK Version**: 5.0.8 (Vercel AI SDK)

## Executive Summary

OpenCode uses the **Vercel AI SDK v5** with standard OpenAI-compatible tool calling. The implementation follows the standard function calling protocol defined in the OpenAI API specification, with tools being executed locally on the client side using the AI SDK's built-in tool execution framework.

## Key Findings

### 1. Tool Implementation Architecture

**Location**: `/mnt/d/Projects/opencode/packages/opencode/src/tool/`

OpenCode implements tools using a custom Tool framework that integrates with the Vercel AI SDK:

```typescript
// From: /mnt/d/Projects/opencode/packages/opencode/src/tool/tool.ts
export namespace Tool {
  export interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    id: string
    init: () => Promise<{
      description: string
      parameters: Parameters
      execute(args: z.infer<Parameters>, ctx: Context): Promise<{
        title: string
        metadata: M
        output: string
        attachments?: MessageV2.FilePart[]
      }>
    }>
  }
}
```

**Available Tools**:
- `bash` - Command execution
- `read` - File reading
- `write` - File writing
- `edit` - File editing
- `patch` - Apply patches
- `glob` - File pattern matching
- `grep` - Search in files
- `ls` - List directory contents
- `webfetch` - Fetch web content
- `todo` - Todo list management
- `task` - Sub-agent task execution
- Custom tools from plugins and user-defined tools

### 2. Tool Calling Flow

**Location**: `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt.ts`

The complete flow:

1. **Tool Registration** (lines 500-634):
   ```typescript
   async function resolveTools(input: {
     agent: Agent.Info
     sessionID: string
     modelID: string
     providerID: string
     tools?: Record<string, boolean>
     processor: Processor
   }) {
     const tools: Record<string, AITool> = {}

     for (const item of await ToolRegistry.tools(input.providerID, input.modelID)) {
       const schema = ProviderTransform.schema(
         input.providerID,
         input.modelID,
         z.toJSONSchema(item.parameters),
       )
       tools[item.id] = tool({
         id: item.id as any,
         description: item.description,
         inputSchema: jsonSchema(schema as any),
         async execute(args, options) {
           // Tool execution logic
         },
         toModelOutput(result) {
           return {
             type: "text",
             value: result.output,
           }
         },
       })
     }
     return tools
   }
   ```

2. **Request Formation** (lines 245-340):
   ```typescript
   const stream = streamText({
     headers: model.providerID === "opencode" ? {
       "x-opencode-session": input.sessionID,
       "x-opencode-request": userMsg.info.id,
     } : undefined,
     maxRetries: 0,
     activeTools: Object.keys(tools).filter((x) => x !== "invalid"),
     maxOutputTokens: ProviderTransform.maxOutputTokens(...),
     abortSignal: abort.signal,
     temperature: params.temperature,
     topP: params.topP,
     messages: [...system.map(...), ...MessageV2.toModelMessage(msgs)],
     tools: model.info.tool_call === false ? undefined : tools,
     model: wrapLanguageModel({ model: model.language })
   })
   ```

3. **Tool Execution** (lines 1035-1123):
   - Tools are executed **locally** by the AI SDK
   - Results are streamed back through the processor
   - OpenCode processes tool events: `tool-input-start`, `tool-call`, `tool-result`, `tool-error`

### 3. Request Format

OpenCode sends standard OpenAI-compatible requests with the `tools` parameter:

```json
{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "system",
      "content": "You are opencode, an interactive CLI tool..."
    },
    {
      "role": "user",
      "content": "Read the file /path/to/file.txt"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Reads a file from the local filesystem...",
        "parameters": {
          "type": "object",
          "properties": {
            "filePath": {
              "type": "string",
              "description": "The path to the file to read"
            },
            "offset": {
              "type": "number",
              "description": "The line number to start reading from (0-based)"
            },
            "limit": {
              "type": "number",
              "description": "The number of lines to read (defaults to 2000)"
            }
          },
          "required": ["filePath"],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute a bash command...",
        "parameters": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "description": "The command to execute"
            },
            "timeout": {
              "type": "number",
              "description": "Optional timeout in milliseconds"
            },
            "description": {
              "type": "string",
              "description": "Clear, concise description of what this command does"
            }
          },
          "required": ["command", "description"],
          "additionalProperties": false
        }
      }
    }
  ],
  "temperature": 0.55,
  "top_p": 1,
  "stream": true
}
```

### 4. Expected Response Format

OpenCode expects standard OpenAI streaming responses. When the model wants to call a tool:

**Non-Streaming Response**:
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "read",
              "arguments": "{\"filePath\":\"/path/to/file.txt\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 20,
    "total_tokens": 70
  }
}
```

**Streaming Response**:
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":null,"tool_calls":[{"index":0,"id":"call_abc123","type":"function","function":{"name":"read","arguments":""}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"file"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"Path\":\"/p"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ath/to/file.txt\"}"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}

data: [DONE]
```

### 5. Tool Execution Cycle

**Important Discovery**: OpenCode executes tools **CLIENT-SIDE**, not server-side.

The complete cycle:

1. **Initial Request**: Client sends messages + tool definitions to the API
2. **Model Response**: API returns `tool_calls` with `finish_reason: "tool_calls"`
3. **Local Execution**: OpenCode's AI SDK executes the tool locally (e.g., reads the file from local filesystem)
4. **Follow-up Request**: Client sends a new request with the tool result:
   ```json
   {
     "model": "qwen3-max",
     "messages": [
       {"role": "system", "content": "..."},
       {"role": "user", "content": "Read the file /path/to/file.txt"},
       {
         "role": "assistant",
         "content": null,
         "tool_calls": [
           {
             "id": "call_abc123",
             "type": "function",
             "function": {
               "name": "read",
               "arguments": "{\"filePath\":\"/path/to/file.txt\"}"
             }
           }
         ]
       },
       {
         "role": "tool",
         "tool_call_id": "call_abc123",
         "content": "<file>\n00001| import React from 'react'\n00002| ...\n</file>"
       }
     ],
     "tools": [...],
     "temperature": 0.55,
     "top_p": 1,
     "stream": true
   }
   ```
5. **Final Response**: API processes the tool result and generates final response

### 6. Provider-Specific Transformations

**Location**: `/mnt/d/Projects/opencode/packages/opencode/src/provider/transform.ts`

OpenCode applies special transformations for different providers:

```typescript
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

**For Qwen models specifically**:
- Temperature: 0.55 (fixed)
- Top P: 1 (fixed)

## Compatibility Analysis

### What Works

1. **Standard Chat Completions**: The proxy fully supports non-tool-calling requests
2. **Streaming**: SSE format is compatible
3. **Temperature/Top P**: Qwen-specific values are properly handled
4. **Multi-turn Conversations**: Full history handling works correctly

### What Doesn't Work (Tool Calling)

**CRITICAL ISSUE**: The Qwen web API does NOT support tool/function calling natively.

From the OpenCode provider configuration:
```typescript
// Line 280 in provider.ts
tool_call: model.tool_call ?? existing?.tool_call ?? true
```

This indicates that most models default to supporting tool calls, but the Qwen API does not provide this functionality through its web interface.

### Workarounds and Options

1. **Option 1: Accept Tool Definitions, Return Plain Text**
   - Accept `tools` parameter in request
   - Ignore tool definitions
   - Let model respond with plain text instructions
   - Client-side can parse natural language and manually execute tools
   - **Limitation**: Less reliable, requires parsing

2. **Option 2: Reject Tool Requests with Clear Error**
   - Return 400 error when `tools` parameter is present
   - Provide clear error message about lack of support
   - **Limitation**: Breaks OpenCode's tool-using workflows

3. **Option 3: Synthetic Tool Support (Future)**
   - Parse model's natural language output for tool-like patterns
   - Convert to OpenAI tool call format
   - **Limitation**: Complex, unreliable, requires significant development

4. **Option 4: Use a Different Model Backend**
   - Use OpenAI API, Anthropic, or other providers that support tools
   - Configure OpenCode to use compatible provider
   - **Limitation**: Defeats the purpose of the Qwen proxy

## Example Tool Definitions

### Bash Tool
```json
{
  "type": "function",
  "function": {
    "name": "bash",
    "description": "Execute bash commands in a persistent shell session...",
    "parameters": {
      "type": "object",
      "properties": {
        "command": {"type": "string", "description": "The command to execute"},
        "timeout": {"type": "number", "description": "Optional timeout in milliseconds"},
        "description": {"type": "string", "description": "Clear, concise description..."}
      },
      "required": ["command", "description"],
      "additionalProperties": false
    }
  }
}
```

### Read Tool
```json
{
  "type": "function",
  "function": {
    "name": "read",
    "description": "Reads a file from the local filesystem...",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {"type": "string", "description": "The path to the file to read"},
        "offset": {"type": "number", "description": "The line number to start reading from (0-based)"},
        "limit": {"type": "number", "description": "The number of lines to read (defaults to 2000)"}
      },
      "required": ["filePath"],
      "additionalProperties": false
    }
  }
}
```

### Write Tool
```json
{
  "type": "function",
  "function": {
    "name": "write",
    "description": "Writes content to a file...",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {"type": "string", "description": "The absolute path to the file to write"},
        "content": {"type": "string", "description": "The content to write to the file"}
      },
      "required": ["filePath", "content"],
      "additionalProperties": false
    }
  }
}
```

## Recommendations

### Immediate Actions

1. **Update Current Test**: The existing test at line 437-486 should be updated to properly simulate the full tool calling cycle
2. **Add Integration Tests**: Create comprehensive tests that simulate multi-turn tool calling conversations
3. **Document Limitations**: Clearly document that the Qwen proxy does not support native tool calling

### For the Proxy

The proxy should:

1. **Accept `tools` parameter gracefully**: Don't error when tools are present
2. **Strip tools before sending to Qwen**: Remove the `tools` parameter from the request
3. **Return standard responses**: Let the model respond with natural language
4. **Log warning**: Log when tools are requested but not supported

### For OpenCode Users

Users should:

1. **Configure OpenCode** to NOT enable tools when using the Qwen proxy
2. **Use direct commands** instead of relying on tool execution
3. **Consider alternative providers** if tool calling is essential

## Code References

| Component | File Path | Lines |
|-----------|-----------|-------|
| Tool Framework | `/mnt/d/Projects/opencode/packages/opencode/src/tool/tool.ts` | 1-51 |
| Tool Registry | `/mnt/d/Projects/opencode/packages/opencode/src/tool/registry.ts` | 22-132 |
| Session Prompt (Main Flow) | `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt.ts` | 138-414 |
| Tool Resolution | `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt.ts` | 500-634 |
| Tool Execution Processing | `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt.ts` | 1035-1123 |
| Provider Transform (Qwen) | `/mnt/d/Projects/opencode/packages/opencode/src/provider/transform.ts` | 76-85 |
| Bash Tool Example | `/mnt/d/Projects/opencode/packages/opencode/src/tool/bash.ts` | 48-282 |
| Read Tool Example | `/mnt/d/Projects/opencode/packages/opencode/src/tool/read.ts` | 16-123 |

## Conclusion

OpenCode uses **standard OpenAI-compatible tool calling** via the Vercel AI SDK 5.0.8. The tools are executed **client-side**, meaning the API only needs to:

1. Accept the `tools` parameter
2. Return `tool_calls` in the response when appropriate
3. Accept follow-up messages with `role: "tool"`

**However**, the Qwen web API does not natively support tool/function calling. This means the proxy cannot provide true tool calling compatibility without significant additional work to simulate this behavior, which would be unreliable.

The best approach is to accept tool definitions gracefully but document that they are not actively supported, allowing the model to respond with natural language instead of structured tool calls.
