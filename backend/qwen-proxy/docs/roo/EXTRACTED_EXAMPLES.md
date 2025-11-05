# Extracted Real Examples from Roo-Cline Requests

## Example 1: User Message Content Array

From Request #47 (session: 4f38bdc6-615c-4b10-88c8-8c0eba6ddf8c)

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "<task>\nread the task summary D:\\Projects\\api-key-vault\\docs\\tasks\\TASK_SUMMARY.md then use teh new_task tool and start assigning tasks\n</task>"
    },
    {
      "type": "text",
      "text": "<environment_details>\n# VSCode Visible Files\n\n\n# VSCode Open Tabs\n\n\n# Current Time\nCurrent time in ISO 8601 UTC format: 2025-10-29T20:12:38.691Z\nUser time zone: America/New_York, UTC-4:00\n\n# Current Cost\n$0.00\n\n# Current Mode\n<slug>code</slug>\n<name>💻 Code</name>\n<model>qwen3-max</model>\n\n\n# Current Workspace Directory (d:/Projects/api-key-vault) Files\n(Workspace files context disabled. Use list_files to explore if needed.)\n\n</environment_details>"
    }
  ]
}
```

## Example 2: Assistant Response (Attempted Tool Call)

From Request #48 (same session, turn 2)

```json
{
  "role": "assistant",
  "content": "I'll help you read the task summary and assign tasks. First, let me access the TASK_SUMMARY.md file to understand what needs to be done.\n\n```tool_code\n{\"tool\":\"file_system\",\"action\":\"read_file\",\"parameters\":{\"path\":\"D:\\\\Projects\\\\api-key-vault\\\\docs\\\\tasks\\\\TASK_SUMMARY.md\"}}\n```"
}
```

**Note**: This format was REJECTED! The client expects XML format instead.

## Example 3: Error Response from Roo-Cline Client

When the assistant uses wrong format:

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "[ERROR] You did not use a tool in your previous response! Please retry with a tool use.\n\n# Reminder: Instructions for Tool Use\n\nTool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:\n\n<actual_tool_name>\n<parameter1_name>value1</parameter1_name>\n<parameter2_name>value2</parameter2_name>\n...\n</actual_tool_name>\n\nFor example, to use the attempt_completion tool:\n\n<attempt_completion>\n<result>\nI have completed the task...\n</result>\n</attempt_completion>\n\nAlways use the actual tool name as the XML tag name for proper parsing and execution.\n\n# Next Steps\n\nIf you have completed the user's task, use the attempt_completion tool. \nIf you require additional information from the user, use the ask_followup_question tool. \nOtherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task. \n(This is an automated message, so do not respond to it conversationally.)"
    },
    {
      "type": "text",
      "text": "<environment_details>\n# VSCode Visible Files\n\n\n# VSCode Open Tabs\n\n\n# Current Time\nCurrent time in ISO 8601 UTC format: 2025-10-29T20:12:44.321Z\nUser time zone: America/New_York, UTC-4:00\n\n# Current Cost\n$0.00\n\n# Current Mode\n<slug>code</slug>\n<name>💻 Code</name>\n<model>qwen3-max</model>\n\n</environment_details>"
    }
  ]
}
```

## Example 4: Expected Tool Call Format (from System Prompt)

Read file tool (XML format):

```xml
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
  </file>
</args>
</read_file>
```

Execute command tool:

```xml
<execute_command>
<command>npm install</command>
</execute_command>
```

Write to file tool:

```xml
<write_to_file>
<path>config.json</path>
<content>
{
  "key": "value"
}
</content>
<line_count>3</line_count>
</write_to_file>
```

## Example 5: Complete Request Structure

Minimal working example:

```json
{
  "model": "qwen3-max",
  "temperature": 0,
  "stream": true,
  "stream_options": {
    "include_usage": true
  },
  "messages": [
    {
      "role": "system",
      "content": "You are Roo, a highly skilled software engineer...\n\n[Full 20KB system prompt with all tool definitions]"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<task>\nList files in the current directory\n</task>"
        },
        {
          "type": "text",
          "text": "<environment_details>\n# VSCode Visible Files\n\n\n# Current Time\nCurrent time in ISO 8601 UTC format: 2025-10-29T20:00:00.000Z\nUser time zone: America/New_York, UTC-4:00\n\n# Current Mode\n<slug>code</slug>\n<name>💻 Code</name>\n<model>qwen3-max</model>\n</environment_details>"
        }
      ]
    }
  ]
}
```

## Example 6: Tool Definitions from System Prompt

### read_file Tool

```
## read_file
Description: Request to read the contents of one or more files. The tool outputs line-numbered content (e.g. "1 | const x = 1") for easy reference when creating diffs or discussing code. Supports text extraction from PDF and DOCX files, but may not handle other binary files properly.

**IMPORTANT: You can read a maximum of 5 files in a single request.** If you need to read more files, use multiple sequential read_file requests.

Parameters:
- args: Contains one or more file elements, where each file contains:
  - path: (required) File path (relative to workspace directory d:\Projects\api-key-vault)
  
Usage:
<read_file>
<args>
  <file>
    <path>path/to/file</path>
  </file>
</args>
</read_file>

Examples:

1. Reading a single file:
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
  </file>
</args>
</read_file>

2. Reading multiple files (within the 5-file limit):
<read_file>
<args>
  <file>
    <path>src/app.ts</path>
  </file>
  <file>
    <path>src/utils.ts</path>
  </file>
</args>
</read_file>
```

### execute_command Tool

```
## execute_command
Description: Request to execute a CLI command on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user's task.

Parameters:
- command: (required) The CLI command to execute. This should be valid for the current operating system.
- cwd: (optional) The working directory to execute the command in (default: d:\Projects\api-key-vault)

Usage:
<execute_command>
<command>Your command here</command>
<cwd>Working directory path (optional)</cwd>
</execute_command>

Example: Requesting to execute npm run dev
<execute_command>
<command>npm run dev</command>
</execute_command>
```

### attempt_completion Tool

```
## attempt_completion
Description: After each tool use, the user will respond with the result of that tool use. Once you've received the results of tool uses and can confirm that the task is complete, use this tool to present the result of your work to the user.

IMPORTANT NOTE: This tool CANNOT be used until you've confirmed from the user that any previous tool uses were successful.

Parameters:
- result: (required) The result of the task. Formulate this result in a way that is final and does not require further input from the user.

Usage:
<attempt_completion>
<result>
Your final result description here
</result>
</attempt_completion>

Example:
<attempt_completion>
<result>
I've updated the CSS
</result>
</attempt_completion>
```

## Example 7: System Information Section

From the system prompt:

```
====

SYSTEM INFORMATION

Operating System: Windows 10
Default Shell: C:\Program Files\PowerShell\7\pwsh.exe
Home Directory: C:/Users/Risky Biz
Current Workspace Directory: d:/Projects/api-key-vault

The Current Workspace Directory is the active VS Code project directory, and is therefore the default directory for all tool operations.
```

## Example 8: Mode Definitions

From the system prompt:

```
====

MODES

- These are the currently available modes:
  * "🏗️ Architect" mode (architect) - Use this mode when you need to plan, design, or strategize before implementation.
  * "💻 Code" mode (code) - Use this mode when you need to write, modify, or refactor code.
  * "❓ Ask" mode (ask) - Use this mode when you need explanations, documentation, or answers to technical questions.
  * "🪲 Debug" mode (debug) - Use this mode when you're troubleshooting issues, investigating errors, or diagnosing problems.
  * "🪃 Orchestrator" mode (orchestrator) - Use this mode for complex, multi-step projects that require coordination across different specialties.
```

## Example 9: Conversation Context

Turn 1 (initial):
```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": [...]}
  ]
}
```

Turn 2 (after response):
```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": [...]},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": [...]}
  ]
}
```

Turn 3 (continuing):
```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": [...]},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": [...]},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": [...]}
  ]
}
```

Note: System prompt is repeated every turn!

## Example 10: Streaming Configuration

Always present:

```json
{
  "stream": true,
  "stream_options": {
    "include_usage": true
  }
}
```

This means:
- Responses are streamed via SSE
- Usage statistics are included in the final chunk
- Client expects `data:` prefix for chunks

## Key Insights from Examples

1. **User messages are ALWAYS content arrays** (never plain strings)
2. **Two content parts**: task + environment_details
3. **Task wrapped in XML tags**: `<task>...</task>`
4. **Environment details updated each turn** with current time, cost, mode
5. **System prompt is 20KB+** and identical every turn
6. **Tool calls use XML**, not JSON
7. **Windows paths** use backslashes: `D:\\Projects\\...`
8. **Workspace directory** is referenced in every tool definition
9. **Error messages** are verbose and include examples
10. **No tool_calls field** anywhere in the request/response

## Files for Complete Examples

- **roo_request_initial.json**: Full initial request (40KB)
- **roo_request_conversation.json**: Full conversation turn (42KB)
- **roo_system_prompt.txt**: Complete system prompt (38KB, 576 lines)

All files located in: `/mnt/d/Projects/qwen_proxy/backend/examples/`
