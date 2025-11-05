# Roo-Cline Client Request Format Analysis

## Database Analysis Results

**Database**: `/mnt/d/Projects/qwen_proxy/backend/data/qwen_proxy.db`
**Total Requests**: 85
**Total Sessions**: 43
**Real Roo-Cline Sessions**: 10+ sessions (IDs listed below)

## Real Roo-Cline Sessions Identified

From server logs (2025-10-29 20:12:40 - 20:21:39), these sessions were confirmed Roo-Cline client:

- `4f38bdc6-615c-4b10-88c8-8c0eba6ddf8c` (Requests: 47-51, 91-92)
- `598a3b33-2fa2-458e-845d-11447fe54390` (Request: 52)
- `a5eb69b0-6050-448f-a45f-4c8237e080eb` (Requests: 73-76)
- `eec7fffa-7948-4ea8-a2c1-a842b02245b3`
- `1d58864f-d480-485d-9e68-b20719402e4d`
- `fe571429-1a43-4e47-8186-93b67d05cf85`
- `a3f61c1f-2878-43ba-8a74-ed713f1d9db3`
- `85916740-ff87-400c-bad8-9ebfe5bccec5`
- `52413de6-da1a-4b2e-9bc3-8bf0f84182d1`
- `318a7907-0795-4750-bb14-a6b419f6e90e`

**Test requests** (axios/1.13.1 user agent) started at 2025-10-29 20:28:39+ and should be IGNORED.

## Request Format Structure

### Top-Level Request Object

```json
{
  "model": "qwen3-max",
  "temperature": 0,
  "messages": [...],
  "stream": true,
  "stream_options": {
    "include_usage": true
  }
}
```

### Key Findings

1. **Model**: Always `"qwen3-max"`
2. **Temperature**: Always `0` (deterministic output)
3. **Stream**: Always `true`
4. **Stream Options**: Always includes `{"include_usage": true}`
5. **Messages**: Array of message objects with specific structure

## Messages Array Structure

### Initial Request (First Turn)

```json
{
  "messages": [
    {
      "role": "system",
      "content": "<MASSIVE SYSTEM PROMPT WITH TOOL DEFINITIONS>"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<task>...</task>"
        },
        {
          "type": "text",
          "text": "<environment_details>...</environment_details>"
        }
      ]
    }
  ]
}
```

### Conversation Request (Subsequent Turns)

```json
{
  "messages": [
    {
      "role": "system",
      "content": "<SAME SYSTEM PROMPT>"
    },
    {
      "role": "user",
      "content": [...]
    },
    {
      "role": "assistant",
      "content": "Response with tool call in code block"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "[ERROR] You did not use a tool..."
        },
        {
          "type": "text",
          "text": "<environment_details>...</environment_details>"
        }
      ]
    }
  ]
}
```

## System Prompt Analysis

### Structure

The system prompt is a **massive text block** (approximately 20KB+) containing:

1. **Identity**: "You are Roo, a highly skilled software engineer..."
2. **Markdown Rules**: Formatting requirements for responses
3. **Tool Definitions**: XML-formatted tool descriptions including:
   - `read_file`
   - `fetch_instructions`
   - `search_files`
   - `list_files`
   - `list_code_definition_names`
   - `apply_diff`
   - `write_to_file`
   - `insert_content`
   - `search_and_replace`
   - `execute_command`
   - `ask_followup_question`
   - `attempt_completion`
   - `switch_mode`
   - `new_task`
4. **Tool Use Guidelines**: Detailed instructions on how to use tools
5. **Capabilities**: What the assistant can do
6. **Modes**: Available working modes (Architect, Code, Ask, Debug, etc.)
7. **Rules**: Project-specific rules and constraints
8. **System Information**: OS, shell, workspace directory
9. **Objective**: Step-by-step task completion instructions
10. **User's Custom Instructions**: Language preference, mode-specific rules

### Key System Prompt Characteristics

- **Tool Format**: XML-style tags (NOT OpenAI function calling format)
- **No JSON Tool Definitions**: Tools are described in plain text/XML
- **Workspace Context**: `d:\Projects\api-key-vault` (Windows path)
- **Shell**: PowerShell 7
- **Mode Restrictions**: Some modes can only edit certain file types

## User Message Format

### Content Structure

User messages use an **array of content objects** (multimodal format):

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "<task>actual user request</task>"
    },
    {
      "type": "text",
      "text": "<environment_details>context info</environment_details>"
    }
  ]
}
```

### Content Parts

1. **Task Block**: User's actual request wrapped in `<task>` tags
2. **Environment Details**: Auto-generated context including:
   - VSCode visible files
   - Open tabs
   - Current time (ISO 8601 UTC)
   - User timezone
   - Current cost
   - Current mode
   - Workspace files (or disabled message)

## Assistant Message Format

### NO OpenAI Tool Calls!

**CRITICAL**: Roo-Cline does NOT use OpenAI's `tool_calls` format. Instead:

```json
{
  "role": "assistant",
  "content": "Explanation text\n\n```tool_code\n{\"tool\":\"file_system\",\"action\":\"read_file\",\"parameters\":{...}}\n```"
}
```

### Tool Call Embedding

- Tools are embedded in **code blocks** with language tag `tool_code`
- Inside the code block is a **JSON object** with:
  - `tool`: Tool name
  - `action`: Action to perform
  - `parameters`: Tool parameters

**This is completely different from OpenAI's function calling!**

## Tool Response Format (User Reply)

When the client responds after a tool call:

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "[ERROR] You did not use a tool in your previous response! Please retry with a tool use.\n\n# Reminder: Instructions for Tool Use\n\nTool uses are formatted using XML-style tags..."
    },
    {
      "type": "text",
      "text": "<environment_details>...</environment_details>"
    }
  ]
}
```

## Expected Tool Format in Responses

Based on the system prompt, the assistant should respond with **XML-style tool calls**, NOT JSON code blocks:

```xml
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
  </file>
</args>
</read_file>
```

The error message indicates the assistant incorrectly used JSON instead of XML!

## Critical Differences from OpenAI Format

| Aspect | OpenAI Format | Roo-Cline Format |
|--------|--------------|------------------|
| Tools Definition | `tools` array with JSON schema | System prompt with XML examples |
| Tool Calls | `tool_calls` array in message | Text content only (no special field) |
| Tool Format | `function` object with `name` and `arguments` | XML tags or JSON in code blocks (both seen) |
| User Message | String or content array | Always content array |
| System Prompt | Usually brief | Massive (20KB+) with all tool docs |

## Recommendations for Tests

### 1. Replicate Exact Format

```javascript
const rooRequest = {
  model: "qwen3-max",
  temperature: 0,
  stream: true,
  stream_options: { include_usage: true },
  messages: [
    {
      role: "system",
      content: "<FULL SYSTEM PROMPT FROM DB>"
    },
    {
      role: "user",
      content: [
        { type: "text", text: "<task>test task</task>" },
        { type: "text", text: "<environment_details>...</environment_details>" }
      ]
    }
  ]
};
```

### 2. Test Conversation Flow

```javascript
// Turn 1: Initial request
const turn1 = { /* initial request */ };

// Turn 2: After assistant response
const turn2 = {
  messages: [
    ...turn1.messages,
    { role: "assistant", content: "response from turn 1" },
    { role: "user", content: [/* new user content */] }
  ]
};
```

### 3. DO NOT Test OpenAI Function Calling

The previous test requests using OpenAI `tools` array and `tool_calls` were **incorrect**. 

Roo-Cline does NOT use that format at all!

## Sample Requests Extracted

Three real Roo-Cline requests have been extracted:

1. **Request 47** (`/tmp/roo_request_1_complete.json`) - Initial request
2. **Request 48** (`/tmp/roo_request_48_complete.json`) - Conversation turn
3. **Request 52** (`/tmp/roo_request_2.json`) - Different session

## Next Steps

1. Copy the real system prompt from request 47
2. Create test cases that exactly match this format
3. Test streaming responses
4. Verify the proxy correctly forwards all fields
5. Test conversation context handling

## Files for Reference

- Initial request: `/tmp/roo_request_1_complete.json`
- Conversation request: `/tmp/roo_request_48_complete.json`
- System prompt extraction: See request 47 in database
