# OpenCode Tool Calling Example Payloads

This document contains actual request/response examples showing how OpenCode uses tool calling.

## Example 1: Simple Tool Call (Bash)

### Initial Request (User asks to list files)

```json
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "system",
      "content": "You are opencode, an interactive CLI tool that helps users with software engineering tasks.\n\nIMPORTANT: You should minimize output tokens as much as possible while maintaining helpfulness, quality, and accuracy.\nIMPORTANT: Keep your responses short. You MUST answer concisely with fewer than 4 lines of text.\n\n# Code style\n- IMPORTANT: DO NOT ADD ***ANY*** COMMENTS unless asked\n\nHere is some useful information about the environment you are running in:\n<env>\n  Working directory: /home/user/project\n  Is directory a git repo: yes\n  Platform: linux\n  Today's date: Thu Oct 30 2025\n</env>"
    },
    {
      "role": "user",
      "content": "List the files in the current directory"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute bash commands in a persistent shell session...",
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
              "description": "Clear, concise description of what this command does in 5-10 words"
            }
          },
          "required": ["command", "description"],
          "additionalProperties": false
        }
      }
    },
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
            }
          },
          "required": ["filePath"],
          "additionalProperties": false
        }
      }
    }
  ],
  "temperature": 0.55,
  "top_p": 1,
  "stream": false
}
```

### Expected Response (Model decides to call bash tool)

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1730303400,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_bash_001",
            "type": "function",
            "function": {
              "name": "bash",
              "arguments": "{\"command\":\"ls -la\",\"description\":\"List files in current directory\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 25,
    "total_tokens": 270
  }
}
```

### Follow-up Request (OpenCode sends tool result)

```json
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "system",
      "content": "You are opencode, an interactive CLI tool..."
    },
    {
      "role": "user",
      "content": "List the files in the current directory"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_bash_001",
          "type": "function",
          "function": {
            "name": "bash",
            "arguments": "{\"command\":\"ls -la\",\"description\":\"List files in current directory\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_bash_001",
      "content": "total 48\ndrwxr-xr-x 8 user user 4096 Oct 30 10:15 .\ndrwxr-xr-x 3 user user 4096 Oct 29 14:20 ..\n-rw-r--r-- 1 user user  220 Oct 29 14:20 .gitignore\ndrwxr-xr-x 2 user user 4096 Oct 30 09:45 src\ndrwxr-xr-x 2 user user 4096 Oct 30 09:45 tests\n-rw-r--r-- 1 user user 1234 Oct 30 10:15 package.json\n-rw-r--r-- 1 user user 4567 Oct 30 10:10 README.md"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute bash commands...",
        "parameters": { "type": "object", "properties": {...}, "required": ["command", "description"] }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Reads a file...",
        "parameters": { "type": "object", "properties": {...}, "required": ["filePath"] }
      }
    }
  ],
  "temperature": 0.55,
  "top_p": 1,
  "stream": false
}
```

### Final Response (Model processes tool result)

```json
{
  "id": "chatcmpl-abc124",
  "object": "chat.completion",
  "created": 1730303402,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The directory contains:\n- Source code in `src/`\n- Tests in `tests/`\n- Configuration files: `package.json`, `.gitignore`\n- Documentation: `README.md`"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 312,
    "completion_tokens": 45,
    "total_tokens": 357
  }
}
```

## Example 2: File Reading Tool Call

### Initial Request

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
      "content": "Read the package.json file"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Reads a file from the local filesystem. You can access any file directly by using this tool.\nAssume this tool is able to read all files on the machine...",
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
    }
  ],
  "temperature": 0.55,
  "top_p": 1,
  "stream": false
}
```

### Expected Response

```json
{
  "id": "chatcmpl-abc125",
  "object": "chat.completion",
  "created": 1730303405,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_read_001",
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
    "prompt_tokens": 198,
    "completion_tokens": 28,
    "total_tokens": 226
  }
}
```

## Example 3: Streaming Tool Call

### Initial Request (with stream: true)

```json
{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "user",
      "content": "Check if git is installed"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute bash commands...",
        "parameters": {
          "type": "object",
          "properties": {
            "command": {"type": "string"},
            "description": {"type": "string"}
          },
          "required": ["command", "description"]
        }
      }
    }
  ],
  "temperature": 0.55,
  "top_p": 1,
  "stream": true
}
```

### Expected Streaming Response

```
data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":null,"tool_calls":[{"index":0,"id":"call_bash_002","type":"function","function":{"name":"bash","arguments":""}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"command\""}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":":\"git --version\""}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":",\"description\":\"Check"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":" git version\"}"}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc126","object":"chat.completion.chunk","created":1730303410,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}

data: [DONE]
```

## Example 4: Multiple Tool Calls in Sequence

Sometimes the model may want to call multiple tools. OpenCode handles this through multiple turns:

### Turn 1: Read file

Request → Response with `tool_calls` for "read" → Execute locally → Send result back

### Turn 2: Analyze and modify

Request with tool result → Response with `tool_calls` for "write" → Execute locally → Send result back

### Turn 3: Final response

Request with tool result → Response with final text content

## Example 5: Tool Call with Error

If a tool call fails (e.g., file not found), OpenCode sends the error back:

```json
{
  "model": "qwen3-max",
  "messages": [
    {
      "role": "user",
      "content": "Read nonexistent.txt"
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_read_002",
          "type": "function",
          "function": {
            "name": "read",
            "arguments": "{\"filePath\":\"nonexistent.txt\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_read_002",
      "content": "Error: File not found: /home/user/project/nonexistent.txt"
    }
  ],
  "tools": [...],
  "temperature": 0.55,
  "top_p": 1,
  "stream": false
}
```

## Key Observations

1. **Tool definitions are always sent**: Even after a tool is called, the full `tools` array is included in follow-up requests
2. **Arguments are JSON strings**: The `arguments` field in `tool_calls` is always a JSON-encoded string
3. **Tool results use role "tool"**: The message containing tool results has `role: "tool"` and includes `tool_call_id`
4. **Finish reason "tool_calls"**: When the model wants to call a tool, `finish_reason` is `"tool_calls"`, not `"stop"`
5. **Content is null during tool calls**: When `tool_calls` is present, `content` is typically `null`
6. **Streaming format**: Tool calls can be streamed incrementally, with arguments built up over multiple chunks

## What Qwen API Needs to Support

To be compatible with OpenCode's tool calling:

1. **Accept `tools` parameter** in requests without erroring
2. **Return `tool_calls` in responses** when the model decides to use a tool
3. **Use `finish_reason: "tool_calls"`** instead of `"stop"` when tools are called
4. **Accept `role: "tool"` messages** in the conversation history
5. **Process tool results** in follow-up requests

**HOWEVER**: The Qwen web API does NOT provide native tool calling support. The API would need to either:
- Reject tool requests clearly
- Accept tools but ignore them (model responds with natural language)
- Implement synthetic tool calling (complex and unreliable)
