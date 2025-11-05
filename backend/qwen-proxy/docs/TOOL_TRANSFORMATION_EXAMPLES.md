# Tool Calling Transformation Examples

**Purpose**: Concrete before/after examples showing BOTH directions of transformation between OpenAI and RooCode XML formats.

**Critical**: These examples are the foundation for implementing the transformation middleware. Every implementer must understand these transformations completely.

---

## Table of Contents

1. [Direction 1: OpenAI → RooCode XML (Request Transformation)](#direction-1-openai--roocode-xml-request-transformation)
2. [Direction 2: RooCode XML → OpenAI (Response Transformation)](#direction-2-roocode-xml--openai-response-transformation)
3. [Complete Request/Response Cycle Examples](#complete-requestresponse-cycle-examples)

---

## Direction 1: OpenAI → RooCode XML (Request Transformation)

### Overview
When OpenCode sends a request with tools, we transform the OpenAI-format tools array into XML-style tool definitions that get injected into the system prompt.

---

### Example 1: Read File Tool

#### INPUT (OpenAI Format)
```json
{
  "type": "function",
  "function": {
    "name": "read",
    "description": "Read a file from the filesystem with line numbers",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "Absolute path to the file"
        },
        "offset": {
          "type": "number",
          "description": "Line number to start reading from"
        },
        "limit": {
          "type": "number",
          "description": "Number of lines to read"
        }
      },
      "required": ["filePath"]
    }
  }
}
```

#### OUTPUT (RooCode XML in System Prompt)
```xml
## read
Description: Read a file from the filesystem with line numbers
Parameters:
- filePath: (required) string - Absolute path to the file
- offset: (optional) number - Line number to start reading from
- limit: (optional) number - Number of lines to read

Usage:
<read>
<filePath>/path/to/file.js</filePath>
<offset>10</offset>
<limit>50</limit>
</read>
```

**Transformation Logic**:
1. Extract `function.name` → becomes `## read` header and `<read>` tag
2. Extract `function.description` → becomes Description line
3. For each property in `parameters.properties`:
   - Check if in `required` array → `(required)` or `(optional)`
   - Extract `type` → string/number/boolean/object/array
   - Extract `description` → parameter description
4. Generate usage example with XML tags

---

### Example 2: Bash Command Tool

#### INPUT (OpenAI Format)
```json
{
  "type": "function",
  "function": {
    "name": "bash",
    "description": "Execute a bash command in a persistent shell session",
    "parameters": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "description": "The command to execute"
        },
        "description": {
          "type": "string",
          "description": "Clear description of what this command does"
        },
        "timeout": {
          "type": "number",
          "description": "Timeout in milliseconds"
        }
      },
      "required": ["command", "description"]
    }
  }
}
```

#### OUTPUT (RooCode XML in System Prompt)
```xml
## bash
Description: Execute a bash command in a persistent shell session
Parameters:
- command: (required) string - The command to execute
- description: (required) string - Clear description of what this command does
- timeout: (optional) number - Timeout in milliseconds

Usage:
<bash>
<command>npm install axios</command>
<description>Install axios package for HTTP requests</description>
<timeout>30000</timeout>
</bash>
```

---

### Example 3: Write File Tool

#### INPUT (OpenAI Format)
```json
{
  "type": "function",
  "function": {
    "name": "write",
    "description": "Write content to a file, creating it if it doesn't exist",
    "parameters": {
      "type": "object",
      "properties": {
        "file_path": {
          "type": "string",
          "description": "Absolute path to the file"
        },
        "content": {
          "type": "string",
          "description": "Content to write to the file"
        }
      },
      "required": ["file_path", "content"]
    }
  }
}
```

#### OUTPUT (RooCode XML in System Prompt)
```xml
## write
Description: Write content to a file, creating it if it doesn't exist
Parameters:
- file_path: (required) string - Absolute path to the file
- content: (required) string - Content to write to the file

Usage:
<write>
<file_path>/src/app.js</file_path>
<content>
console.log('Hello World');
</content>
</write>
```

---

### Example 4: Multiple Tools in Request

#### INPUT (OpenAI Format)
```json
{
  "messages": [
    { "role": "user", "content": "Read package.json and install dependencies" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Read a file",
        "parameters": {
          "type": "object",
          "properties": {
            "filePath": { "type": "string", "description": "File path" }
          },
          "required": ["filePath"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute command",
        "parameters": {
          "type": "object",
          "properties": {
            "command": { "type": "string", "description": "Command" },
            "description": { "type": "string", "description": "Description" }
          },
          "required": ["command", "description"]
        }
      }
    }
  ]
}
```

#### OUTPUT (System Prompt Injection)
```
You have access to tools that help you accomplish tasks. Use tools by outputting XML-formatted tool calls.

## Tool Use Rules
1. Use exactly one tool per message
2. Format tool calls using XML with the tool name as the tag
3. Include all required parameters within parameter tags

## Tool Call Format
<tool_name>
<parameter1>value1</parameter1>
<parameter2>value2</parameter2>
</tool_name>

## Available Tools

## read
Description: Read a file
Parameters:
- filePath: (required) string - File path

Usage:
<read>
<filePath>/path/to/file</filePath>
</read>

## bash
Description: Execute command
Parameters:
- command: (required) string - Command
- description: (required) string - Description

Usage:
<bash>
<command>npm install</command>
<description>Install dependencies</description>
</bash>
```

---

## Direction 2: RooCode XML → OpenAI (Response Transformation)

### Overview
When Qwen responds with XML-formatted tool calls in its text, we parse them and convert to OpenAI's `tool_calls` format.

---

### Example 1: Simple Tool Call (Read)

#### INPUT (Qwen Response Text)
```
I'll read the package.json file to see the dependencies.

<read>
<filePath>/home/user/project/package.json</filePath>
</read>
```

#### OUTPUT (OpenAI Format)
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll read the package.json file to see the dependencies.",
        "tool_calls": [
          {
            "id": "call_1",
            "type": "function",
            "function": {
              "name": "read",
              "arguments": "{\"filePath\":\"/home/user/project/package.json\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 45,
    "total_tokens": 195
  }
}
```

**Transformation Logic**:
1. Extract text before XML tag → `content` field
2. Detect XML tag opening: `<read>` → `function.name = "read"`
3. Extract all parameters between opening/closing tags → parse to JSON arguments
4. Generate unique `id` for tool call (e.g., `call_1`, `call_2`)
5. Set `finish_reason` to `"tool_calls"` (not `"stop"`)

---

### Example 2: Tool Call with Multiple Parameters (Bash)

#### INPUT (Qwen Response Text)
```
I'll install the axios package using npm.

<bash>
<command>npm install axios</command>
<description>Install axios HTTP client library</description>
<timeout>60000</timeout>
</bash>
```

#### OUTPUT (OpenAI Format)
```json
{
  "id": "chatcmpl-def456",
  "object": "chat.completion",
  "created": 1234567891,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll install the axios package using npm.",
        "tool_calls": [
          {
            "id": "call_2",
            "type": "function",
            "function": {
              "name": "bash",
              "arguments": "{\"command\":\"npm install axios\",\"description\":\"Install axios HTTP client library\",\"timeout\":60000}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 160,
    "completion_tokens": 52,
    "total_tokens": 212
  }
}
```

**Parameter Parsing**:
- `<command>npm install axios</command>` → `"command": "npm install axios"`
- `<description>Install axios HTTP client library</description>` → `"description": "Install axios HTTP client library"`
- `<timeout>60000</timeout>` → `"timeout": 60000` (number, not string)

---

### Example 3: Tool Call with Multiline Content (Write)

#### INPUT (Qwen Response Text)
```
I'll create a new configuration file with the settings.

<write>
<file_path>/config/settings.json</file_path>
<content>
{
  "api": {
    "endpoint": "https://api.example.com",
    "timeout": 5000
  },
  "logging": {
    "level": "debug"
  }
}
</content>
</write>
```

#### OUTPUT (OpenAI Format)
```json
{
  "id": "chatcmpl-ghi789",
  "object": "chat.completion",
  "created": 1234567892,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll create a new configuration file with the settings.",
        "tool_calls": [
          {
            "id": "call_3",
            "type": "function",
            "function": {
              "name": "write",
              "arguments": "{\"file_path\":\"/config/settings.json\",\"content\":\"{\\n  \\\"api\\\": {\\n    \\\"endpoint\\\": \\\"https://api.example.com\\\",\\n    \\\"timeout\\\": 5000\\n  },\\n  \\\"logging\\\": {\\n    \\\"level\\\": \\\"debug\\\"\\n  }\\n}\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 175,
    "completion_tokens": 85,
    "total_tokens": 260
  }
}
```

**Important**: Multiline content must be properly escaped in JSON arguments string.

---

### Example 4: Response with NO Tool Call (Normal Completion)

#### INPUT (Qwen Response Text)
```
The package.json file contains 5 dependencies: express, axios, lodash, moment, and dotenv. All dependencies are production dependencies with no devDependencies listed.
```

#### OUTPUT (OpenAI Format)
```json
{
  "id": "chatcmpl-jkl012",
  "object": "chat.completion",
  "created": 1234567893,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The package.json file contains 5 dependencies: express, axios, lodash, moment, and dotenv. All dependencies are production dependencies with no devDependencies listed."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 200,
    "completion_tokens": 45,
    "total_tokens": 245
  }
}
```

**Note**: No `tool_calls` field present, `finish_reason` is `"stop"` (not `"tool_calls"`).

---

### Example 5: Streaming Response with Tool Call

#### INPUT (Qwen SSE Stream)
```
data: {"choices":[{"delta":{"content":"I'll "}}]}

data: {"choices":[{"delta":{"content":"read "}}]}

data: {"choices":[{"delta":{"content":"the "}}]}

data: {"choices":[{"delta":{"content":"file.\n\n<read"}}]}

data: {"choices":[{"delta":{"content":">\n<file"}}]}

data: {"choices":[{"delta":{"content":"Path>/src/app.js</filePath>\n</read>"}}]}

data: [DONE]
```

#### OUTPUT (OpenAI SSE Stream)
```
data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":"I'll "},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"read "},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"the "},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"file."},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_4","type":"function","function":{"name":"read","arguments":""}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"filePath\":\"/src/app.js\"}"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-stream1","object":"chat.completion.chunk","created":1234567894,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}

data: [DONE]
```

**Streaming Transformation Logic**:
1. Stream text chunks normally until XML detected
2. When `<` detected, start buffering
3. Once complete XML tag parsed:
   - Send initial tool_call chunk with `name` and empty `arguments`
   - Send arguments in one or more chunks
   - Send final chunk with `finish_reason: "tool_calls"`

---

## Complete Request/Response Cycle Examples

### Cycle 1: Read File → Execute → Continue

#### Step 1: Initial Request (OpenCode → Proxy)

**OpenCode sends:**
```json
{
  "model": "qwen3-max",
  "messages": [
    { "role": "user", "content": "What's in the package.json file?" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Read a file",
        "parameters": {
          "type": "object",
          "properties": {
            "filePath": { "type": "string" }
          },
          "required": ["filePath"]
        }
      }
    }
  ],
  "stream": true
}
```

**Proxy transforms to Qwen:**
```json
{
  "chat_id": "uuid-123",
  "parent_id": null,
  "messages": [
    {
      "role": "system",
      "content": "You have access to tools...\n\n## read\nDescription: Read a file\n..."
    },
    {
      "role": "user",
      "content": "What's in the package.json file?"
    }
  ],
  "stream": true
}
```

#### Step 2: Qwen Response (Qwen → Proxy)

**Qwen returns:**
```
I'll read the package.json file.

<read>
<filePath>/home/user/package.json</filePath>
</read>
```

**Proxy transforms to OpenAI:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "I'll read the package.json file.",
      "tool_calls": [{
        "id": "call_1",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"filePath\":\"/home/user/package.json\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

#### Step 3: Tool Result (OpenCode → Proxy)

**OpenCode executes tool locally and sends result:**
```json
{
  "model": "qwen3-max",
  "messages": [
    { "role": "user", "content": "What's in the package.json file?" },
    {
      "role": "assistant",
      "content": "I'll read the package.json file.",
      "tool_calls": [{
        "id": "call_1",
        "type": "function",
        "function": {
          "name": "read",
          "arguments": "{\"filePath\":\"/home/user/package.json\"}"
        }
      }]
    },
    {
      "role": "tool",
      "tool_call_id": "call_1",
      "content": "{\"dependencies\":{\"express\":\"^4.18.0\",\"axios\":\"^1.4.0\"}}"
    }
  ],
  "stream": true
}
```

**Proxy transforms tool message:**
```json
{
  "chat_id": "uuid-123",
  "parent_id": "parent-uuid-from-previous-response",
  "messages": [
    {
      "role": "user",
      "content": "Tool Result from read:\n{\"dependencies\":{\"express\":\"^4.18.0\",\"axios\":\"^1.4.0\"}}"
    }
  ],
  "stream": true
}
```

#### Step 4: Final Response (Qwen → Proxy → OpenCode)

**Qwen returns:**
```
The package.json file contains 2 dependencies: express version ^4.18.0 and axios version ^1.4.0.
```

**Proxy transforms (no tool call this time):**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "The package.json file contains 2 dependencies: express version ^4.18.0 and axios version ^1.4.0."
    },
    "finish_reason": "stop"
  }]
}
```

---

### Cycle 2: Multi-Turn with Bash Command

#### Step 1: Initial Request
```json
{
  "messages": [
    { "role": "user", "content": "Install the lodash package" }
  ],
  "tools": [
    { "type": "function", "function": { "name": "bash", "parameters": {...} } }
  ]
}
```

#### Step 2: Qwen Responds with Tool Call
```
I'll install lodash using npm.

<bash>
<command>npm install lodash</command>
<description>Install lodash utility library</description>
</bash>
```

Transformed to:
```json
{
  "tool_calls": [{
    "function": {
      "name": "bash",
      "arguments": "{\"command\":\"npm install lodash\",\"description\":\"Install lodash utility library\"}"
    }
  }]
}
```

#### Step 3: OpenCode Executes and Returns Result
```json
{
  "messages": [
    { "role": "user", "content": "Install the lodash package" },
    { "role": "assistant", "tool_calls": [...] },
    {
      "role": "tool",
      "tool_call_id": "call_5",
      "content": "added 1 package in 2.3s"
    }
  ]
}
```

#### Step 4: Final Confirmation
Qwen: `Successfully installed lodash version 4.17.21.`

---

## Edge Cases and Error Handling

### Case 1: Malformed XML in Response

**Qwen returns:**
```
I'll read the file.

<read>
<filePath>/path/to/file
</read>
```

**Missing closing tag for `<filePath>`**

**Proxy behavior:**
- Try to recover by detecting incomplete tag
- If recovery fails, return normal text response (no tool_call)
- Log warning for debugging

**Output:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "I'll read the file.\n\n<read>\n<filePath>/path/to/file\n</read>"
    },
    "finish_reason": "stop"
  }]
}
```

---

### Case 2: Tool Not in Original Request

**OpenCode sends tools: [`read`, `write`]**

**Qwen responds with:**
```
<bash>
<command>ls -la</command>
</bash>
```

**Proxy behavior:**
- Tool `bash` was not in original tools array
- Options:
  1. Allow it anyway (model might know about it)
  2. Strip it and return as text
  3. Return error

**Recommended: Option 1** - Allow it, OpenCode will handle unknown tools

---

### Case 3: Multiple Tool Calls (Against Rules)

**Qwen returns:**
```
<read>
<filePath>/file1.js</filePath>
</read>

<read>
<filePath>/file2.js</filePath>
</read>
```

**Proxy behavior:**
- RooCode rules say "one tool per message"
- Parse only the FIRST tool call
- Ignore subsequent ones
- Log warning

---

## Type Conversions

### String Parameters
```xml
<filePath>/path/to/file</filePath>
```
→
```json
"filePath": "/path/to/file"
```

### Number Parameters
```xml
<timeout>5000</timeout>
<offset>10</offset>
```
→
```json
"timeout": 5000,
"offset": 10
```

**Detection:** If content is numeric and parameter type is `number`, parse as number not string.

### Boolean Parameters
```xml
<recursive>true</recursive>
<force>false</force>
```
→
```json
"recursive": true,
"force": false
```

**Detection:** If content is `"true"` or `"false"` and parameter type is `boolean`, parse as boolean.

### Array Parameters (Not Common)
```xml
<files>
  <item>file1.js</item>
  <item>file2.js</item>
</files>
```
→
```json
"files": ["file1.js", "file2.js"]
```

### Object Parameters (Nested)
```xml
<options>
  <timeout>5000</timeout>
  <retries>3</retries>
</options>
```
→
```json
"options": {
  "timeout": 5000,
  "retries": 3
}
```

---

## Summary: Transformation Checklist

### Request Transformation (OpenAI → XML)
- [ ] Extract tools array from request
- [ ] For each tool:
  - [ ] Extract function name → XML tag name
  - [ ] Extract description → documentation
  - [ ] Extract parameters → parameter list with types
  - [ ] Mark required vs optional
  - [ ] Generate usage example
- [ ] Wrap in `<tools>` tags
- [ ] Inject into system message
- [ ] Strip tools from request before sending to Qwen

### Response Transformation (XML → OpenAI)
- [ ] Scan response text for XML patterns
- [ ] When XML tool detected:
  - [ ] Extract tool name from tag
  - [ ] Extract all parameters
  - [ ] Convert types (string/number/boolean)
  - [ ] Format as JSON arguments string
  - [ ] Generate unique tool_call id
  - [ ] Set finish_reason to "tool_calls"
- [ ] Text before XML becomes message content
- [ ] If no XML found, return normal completion

### Streaming Handling
- [ ] Buffer chunks until complete tag detected
- [ ] Stream text normally before tool call
- [ ] When tool detected:
  - [ ] Send tool_call chunk with name
  - [ ] Send arguments chunk(s)
  - [ ] Send finish chunk with finish_reason
- [ ] Handle partial/incomplete tags gracefully

---

## Implementation Notes

1. **XML Parser**: Use a streaming XML parser or regex-based detection
2. **ID Generation**: Use incrementing counter or UUID for tool_call ids
3. **Error Recovery**: Always prefer returning text over failing request
4. **Type Inference**: Use parameter schema types from original request to guide parsing
5. **Logging**: Log all transformations for debugging
6. **Testing**: Create comprehensive tests for every example in this document

---

**End of Transformation Examples**

These examples should be the reference guide for all implementation work on the tool calling transformation middleware.
