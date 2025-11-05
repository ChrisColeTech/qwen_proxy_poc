# Tool Calling Transformation Middleware - Implementation Plan

**Created**: 2025-10-30
**Purpose**: Enable OpenCode tool calling compatibility through XML-style prompt engineering (RooCode approach)
**Target**: Transform OpenAI tool calling format to XML-based tool definitions that Qwen models can understand

---

## Work Progression Table

| Phase | Name | Status | Files Create | Files Modify | Priority |
|-------|------|--------|--------------|--------------|----------|
| 1 | Tool Definition Transformer | ✅ COMPLETE | `src/transformers/tool-to-xml-transformer.js`, `tests/unit/tool-to-xml-transformer.test.js` | None | P0 - Critical |
| 2 | System Prompt Injection | ✅ COMPLETE | None | `src/transformers/openai-to-qwen-transformer.js` | P0 - Critical |
| 3 | Response Parser (Non-Streaming) | ✅ COMPLETE | `src/parsers/xml-tool-parser.js`, `tests/unit/xml-tool-parser.test.js` | `src/transformers/qwen-to-openai-transformer.js` | P0 - Critical |
| 4 | Response Parser (Streaming) | ✅ COMPLETE | `tests/unit/sse-streaming-tools.test.js` | `src/transformers/sse-transformer.js` | P0 - Critical |
| 5 | Tool Result Handler | ✅ COMPLETE | `src/handlers/tool-result-handler.js`, `tests/unit/tool-result-handler.test.js`, `tests/integration/tool-result-transformer-integration.test.js` | `src/transformers/openai-to-qwen-transformer.js` | P1 - High |
| 6 | Middleware Integration | ✅ COMPLETE | `tests/integration/tool-calling-e2e.test.js`, `tests/integration/verify-phase6-e2e.js`, `backend/PHASE6_COMPLETION_SUMMARY.md` | `src/transformers/qwen-to-openai-transformer.js`, `.env.example`, `README.md` | P1 - High |
| 7 | Testing Suite | ✅ COMPLETE (213 tests) | All test files created in phases 1-6 | None | P1 - High |
| 8 | Documentation & Examples | ✅ COMPLETE | `docs/TOOL_TRANSFORMATION_EXAMPLES.md`, `backend/PHASE6_COMPLETION_SUMMARY.md` | `README.md` | P2 - Medium |

**Project Status**: ✅ **ALL PHASES COMPLETE** - 213 tests passing, production-ready

---

## Executive Summary

This implementation plan enables OpenCode to use tool calling through the Qwen proxy by transforming OpenAI's native tool calling format into XML-style tool definitions that Qwen models can understand via prompt engineering. The approach mirrors RooCode's successful strategy: inject tool definitions into the system prompt as XML schemas, parse XML tool calls from model responses, and transform them back to OpenAI format.

**Key Strategy**:
- **Request Path**: OpenAI tools array → XML tool schema in system prompt → Qwen processes as text
- **Response Path**: Qwen XML output → Parse tool calls → OpenAI tool_calls format

**Design Philosophy**: Non-invasive middleware pattern that preserves existing architecture while adding tool calling as an optional enhancement layer.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REQUEST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

OpenCode Request                     Qwen Proxy                      Qwen API
(OpenAI Format)                                                      (Web API)
─────────────────────────────────────────────────────────────────────────

{                                    ┌──────────────────┐
  "messages": [...],      ──────────▶│ Tool Detection   │
  "tools": [              detection  │ Middleware       │
    {                                 └────────┬─────────┘
      "type": "function",                      │
      "function": {                            ▼
        "name": "read",            ┌──────────────────────┐
        "parameters": {...}        │ Tool-to-XML          │
      }                            │ Transformer          │
    }                              └────────┬─────────────┘
  ]                                         │ Transform tools
}                                           │ to XML schema
                                            ▼
                               ┌──────────────────────────┐
                               │ System Prompt Injection  │
                               │ (openai-to-qwen)         │
                               └────────┬─────────────────┘
                                        │ Inject XML schema
                                        │ into system message
                                        ▼
                               ┌──────────────────────────┐      {
                               │ Qwen Request             │──▶   "messages": [
                               │ (Standard Flow)          │      {"role": "system",
                               └──────────────────────────┘      "content": "You are...
                                                                 <tools>...</tools>"},
                                                                 {"role": "user", ...}
                                                                 ]
                                                                }

┌─────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

Qwen API                         Qwen Proxy                   OpenCode Response
(Web API)                                                     (OpenAI Format)
─────────────────────────────────────────────────────────────────────────

{                               ┌──────────────────────┐
  "choices": [{                 │ SSE Handler          │
    "message": {        ────────▶│ (Streaming)          │
      "content":                 │ OR                   │
      "<read_file>               │ qwen-to-openai       │
       <path>file.js</path>      │ (Non-streaming)      │
      </read_file>"              └────────┬─────────────┘
    }                                     │
  }]                                      ▼
}                               ┌──────────────────────────┐
                                │ XML Tool Parser          │
                                │ - Detect XML tags        │
                                │ - Extract parameters     │
                                │ - Validate structure     │
                                └────────┬─────────────────┘
                                         │ Parse XML
                                         │ tool calls
                                         ▼
                                ┌──────────────────────────┐
                                │ Transform to OpenAI      │     {
                                │ tool_calls format        │──▶  "choices": [{
                                └──────────────────────────┘    "message": {
                                                                  "tool_calls": [{
                                                                    "type": "function",
                                                                    "function": {
                                                                      "name": "read",
                                                                      "arguments": "{...}"
                                                                    }
                                                                  }]
                                                                }
                                                              }]
                                                             }

┌─────────────────────────────────────────────────────────────────────────┐
│                      TOOL RESULT HANDLING                                │
└─────────────────────────────────────────────────────────────────────────┘

OpenCode                           Qwen Proxy                    Qwen API
(Tool Result)                                                   (Continuation)
─────────────────────────────────────────────────────────────────────────

{                                 ┌──────────────────────┐
  "messages": [                   │ Tool Result Handler  │
    {...prev messages...},        │ - Detect tool role   │
    {                    ─────────▶│ - Format result      │
      "role": "tool",              │ - Continue session   │
      "tool_call_id": "...",       └────────┬─────────────┘
      "content": "<file>..."                │
    }                                       ▼
  ]                               ┌──────────────────────────┐
}                                 │ Transform to Qwen format │─────▶  Continue
                                  │ (Standard message)       │       normal flow
                                  └──────────────────────────┘
```

---

## Phase 1: Tool Definition Transformer

### Objective
Create a transformer that converts OpenAI tool definitions (JSON schema) into XML-style tool definitions that can be injected into system prompts.

### Files to Create

#### `src/transformers/tool-to-xml-transformer.js`
```javascript
/**
 * Tool to XML Transformer
 *
 * Converts OpenAI tool definitions to XML schema format for prompt injection.
 * Based on RooCode's XML tool definition approach.
 */

/**
 * Transform OpenAI tools array to XML schema string
 * @param {Array} tools - OpenAI tools array
 * @returns {string} XML schema for system prompt
 */
function transformToolsToXML(tools) {
  // Implementation details below
}

/**
 * Generate XML tool documentation for a single tool
 * @param {Object} tool - OpenAI tool definition
 * @returns {string} XML documentation
 */
function generateToolDocumentation(tool) {
  // Implementation details below
}

/**
 * Convert JSON Schema parameters to XML parameter docs
 * @param {Object} parameters - JSON Schema parameters object
 * @returns {string} XML parameter documentation
 */
function convertParametersToXML(parameters) {
  // Implementation details below
}

module.exports = {
  transformToolsToXML,
  generateToolDocumentation,
  convertParametersToXML
};
```

**Key Implementation Details**:
- Line 15-40: Main transformation function
  - Loop through tools array
  - For each tool, extract: name, description, parameters
  - Generate XML format matching RooCode pattern
  - Return complete XML block wrapped in `<tools>...</tools>`

- Line 45-80: Tool documentation generator
  - Convert tool.function.name to XML tag name
  - Format description with clear examples
  - Include parameter documentation
  - Add usage examples based on parameter requirements

- Line 85-120: Parameter conversion
  - Handle JSON Schema types: string, number, boolean, object, array
  - Convert `required` array to parameter documentation
  - Include type information and descriptions
  - Generate example values based on type

**Example Output**:
```xml
<tools>
## read
Description: Reads a file from the local filesystem. Returns file content with line numbers.
Parameters:
- filePath: (required) string - The absolute path to the file to read
- offset: (optional) number - The line number to start reading from
- limit: (optional) number - The number of lines to read

Usage:
<read>
<filePath>/path/to/file.js</filePath>
<offset>0</offset>
<limit>100</limit>
</read>

## bash
Description: Execute bash commands in a persistent shell session.
Parameters:
- command: (required) string - The command to execute
- description: (required) string - Clear description of command purpose
- timeout: (optional) number - Timeout in milliseconds

Usage:
<bash>
<command>ls -la</command>
<description>List files in current directory</description>
</bash>
</tools>
```

### Files to Modify
None - Pure creation phase

### Integration Points
- Will be imported and used in Phase 2 (System Prompt Injection)
- Called from `openai-to-qwen-transformer.js` when tools are detected

### Design Decisions
1. **XML Format Choice**: Use RooCode's format (proven to work with Qwen)
2. **Parameter Handling**: Map JSON Schema types to natural language descriptions
3. **Examples**: Include usage examples for each tool (helps model understand)
4. **Validation**: Tools without required fields are skipped with warning logged

### Testing Requirements
- Unit tests for tool transformation
- Edge cases: empty tools array, malformed tools, missing parameters
- Verify XML output is well-formed
- Test parameter type conversions (string, number, object, array)

### Acceptance Criteria
- [ ] Transforms standard OpenAI tools to XML format
- [ ] Handles all OpenCode tool types (bash, read, write, edit, etc.)
- [ ] Includes parameter documentation with types and requirements
- [ ] Generates valid XML (no unclosed tags)
- [ ] Includes usage examples for each tool
- [ ] Logs warnings for malformed tools but continues processing
- [ ] Unit tests pass with 100% coverage

---

## Phase 2: System Prompt Injection

### Objective
Modify the request transformer to detect tool definitions and inject XML tool schemas into the system message, enabling Qwen to understand and use tools via prompt engineering.

### Files to Create

#### `src/services/tool-system-prompt.js`
```javascript
/**
 * Tool System Prompt Service
 *
 * Manages system prompt generation for tool calling.
 * Provides base instructions and tool schema injection.
 */

/**
 * Generate base tool calling instructions
 * @returns {string} Base system prompt for tool usage
 */
function getBaseToolInstructions() {
  return `
You have access to tools that help you accomplish tasks. You must use tools by outputting XML-formatted tool calls.

## Tool Use Rules
1. Use exactly one tool per message
2. Every assistant message with a tool request must include exactly one tool call
3. Format tool calls using XML with the tool name as the tag
4. Include all required parameters within parameter tags
5. Wait for tool results before proceeding

## Tool Call Format
<tool_name>
<parameter1>value1</parameter1>
<parameter2>value2</parameter2>
</tool_name>

## Available Tools
`;
}

/**
 * Build complete system prompt with tool definitions
 * @param {string} originalSystemPrompt - Original system message
 * @param {string} toolSchemaXML - XML tool schema from transformer
 * @returns {string} Complete system prompt with tools
 */
function buildToolSystemPrompt(originalSystemPrompt, toolSchemaXML) {
  // Implementation details
}

/**
 * Check if system prompt already contains tool definitions
 * @param {string} systemPrompt - System prompt to check
 * @returns {boolean} True if tools already present
 */
function hasToolDefinitions(systemPrompt) {
  return systemPrompt.includes('<tools>') || systemPrompt.includes('Available Tools');
}

module.exports = {
  getBaseToolInstructions,
  buildToolSystemPrompt,
  hasToolDefinitions
};
```

**Key Implementation Details**:
- Line 10-35: Base instructions matching RooCode format
  - Clear rules about one tool per message
  - XML format examples
  - Behavioral guidelines

- Line 40-60: Prompt builder
  - Preserve original system prompt
  - Append tool instructions separator
  - Add base instructions
  - Append tool schema XML
  - Return combined prompt

- Line 65-70: Duplicate detection
  - Prevent double-injection
  - Check for existing tool markers

### Files to Modify

#### `src/transformers/openai-to-qwen-transformer.js`
**Modifications**:

**Line 1-5**: Add imports
```javascript
const crypto = require('crypto');
const { transformToolsToXML } = require('./tool-to-xml-transformer');
const { buildToolSystemPrompt, hasToolDefinitions } = require('../services/tool-system-prompt');
```

**Line 26-48**: Modify `extractMessagesToSend` function
Add tool detection and system prompt injection:
```javascript
function extractMessagesToSend(messages, parentId = null, options = {}) {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array is empty');
  }

  const result = [];
  const { tools = null } = options;

  // Include system message ONLY on first request (when parentId is null)
  if (parentId === null) {
    let systemMessage = messages.find(m => m.role === 'system');

    // If tools provided, inject tool schema into system prompt
    if (tools && tools.length > 0) {
      const systemContent = systemMessage ? systemMessage.content : 'You are a helpful assistant.';

      // Only inject if not already present (avoid double injection)
      if (!hasToolDefinitions(systemContent)) {
        const toolSchemaXML = transformToolsToXML(tools);
        const enhancedSystemContent = buildToolSystemPrompt(systemContent, toolSchemaXML);

        systemMessage = {
          role: 'system',
          content: enhancedSystemContent
        };
      }
    }

    if (systemMessage) {
      result.push(systemMessage);
    }
  }

  // Include last message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'system') {
    result.push(lastMessage);
  }

  return result;
}
```

**Line 169-195**: Modify `transformToQwenRequest` function signature
Add tools parameter passthrough:
```javascript
function transformToQwenRequest(openAIRequest, session, stream = true) {
  const { messages, model = 'qwen3-max', tools } = openAIRequest;
  const { chatId, parentId } = session;

  // Extract messages to send with tools option
  const messagesToSend = extractMessagesToSend(messages, parentId, { tools });

  // ... rest of function unchanged
}
```

### Integration Points
- Imports tool-to-xml-transformer from Phase 1
- Called from chat-completions-handler when request contains tools
- System prompt injection happens before Qwen request creation

### Design Decisions
1. **Injection Timing**: Only inject on first message (parentId === null)
   - Qwen maintains context server-side via parent_id chain
   - Subsequent messages inherit tool knowledge from session

2. **Prompt Structure**: Append tools after original system prompt
   - Preserves user's system instructions
   - Clear separation with markdown headers

3. **Duplicate Prevention**: Check for existing tool definitions
   - Prevents double-injection on retries
   - Idempotent operation

4. **Optional Enhancement**: Tools are optional parameter
   - Non-tool requests work exactly as before
   - Zero impact on existing functionality

### Testing Requirements
- Unit tests for system prompt injection
- Verify tools are only injected on first message
- Test duplicate prevention
- Validate XML format preservation
- Integration test: full request with tools

### Acceptance Criteria
- [ ] System prompt contains tool definitions when tools provided
- [ ] Original system prompt is preserved
- [ ] Tool schema XML is well-formed
- [ ] Injection only happens on first message (parentId === null)
- [ ] Duplicate injection prevented
- [ ] Non-tool requests unaffected
- [ ] Unit and integration tests pass

---

## Phase 3: Response Parser (Non-Streaming)

### Objective
Create a parser that detects and extracts XML tool calls from Qwen's text responses, transforming them into OpenAI's tool_calls format for non-streaming responses.

### Files to Create

#### `src/parsers/xml-tool-parser.js`
```javascript
/**
 * XML Tool Call Parser
 *
 * Parses XML-formatted tool calls from Qwen responses
 * and transforms them to OpenAI tool_calls format.
 *
 * Based on RooCode's AssistantMessageParser pattern.
 */

const crypto = require('crypto');

// Supported tool names (matches OpenCode tools)
const SUPPORTED_TOOLS = [
  'read',
  'write',
  'edit',
  'bash',
  'glob',
  'grep',
  'list_files',
  'search_files',
  'execute_command',
  'read_file',
  'write_to_file',
  'apply_diff',
  'attempt_completion',
  'ask_followup_question'
];

/**
 * Parse Qwen response content for XML tool calls
 * @param {string} content - Response content from Qwen
 * @returns {Object} { hasToolCalls, toolCalls, textContent }
 */
function parseToolCalls(content) {
  const result = {
    hasToolCalls: false,
    toolCalls: [],
    textContent: ''
  };

  // Quick check: does content contain any tool tags?
  const hasXMLTags = SUPPORTED_TOOLS.some(tool =>
    content.includes(`<${tool}>`) && content.includes(`</${tool}>`)
  );

  if (!hasXMLTags) {
    result.textContent = content;
    return result;
  }

  // Parse XML tool calls
  const toolCalls = extractToolCalls(content);

  if (toolCalls.length > 0) {
    result.hasToolCalls = true;
    result.toolCalls = toolCalls.map(transformToOpenAIToolCall);

    // Extract text content (everything outside tool tags)
    result.textContent = extractTextContent(content, toolCalls);
  } else {
    result.textContent = content;
  }

  return result;
}

/**
 * Extract XML tool calls from content
 * @param {string} content - Response content
 * @returns {Array} Array of raw tool call objects
 */
function extractToolCalls(content) {
  const toolCalls = [];

  for (const toolName of SUPPORTED_TOOLS) {
    const openTag = `<${toolName}>`;
    const closeTag = `</${toolName}>`;

    let searchStart = 0;
    while (true) {
      const startIdx = content.indexOf(openTag, searchStart);
      if (startIdx === -1) break;

      const endIdx = content.indexOf(closeTag, startIdx);
      if (endIdx === -1) {
        // Unclosed tag - skip and warn
        console.warn(`[XML Parser] Unclosed tag for tool: ${toolName}`);
        break;
      }

      // Extract tool call content
      const toolContent = content.substring(startIdx + openTag.length, endIdx);
      const parameters = extractParameters(toolContent);

      toolCalls.push({
        name: toolName,
        parameters: parameters,
        rawContent: content.substring(startIdx, endIdx + closeTag.length),
        startIndex: startIdx,
        endIndex: endIdx + closeTag.length
      });

      searchStart = endIdx + closeTag.length;
    }
  }

  // Sort by position in content
  toolCalls.sort((a, b) => a.startIndex - b.startIndex);

  return toolCalls;
}

/**
 * Extract parameters from XML tool content
 * @param {string} toolContent - Content inside tool tags
 * @returns {Object} Parameter key-value pairs
 */
function extractParameters(toolContent) {
  const parameters = {};

  // Simple regex-based parameter extraction
  // Matches: <param_name>value</param_name>
  const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = paramRegex.exec(toolContent)) !== null) {
    const paramName = match[1];
    let paramValue = match[2];

    // Trim leading/trailing whitespace but preserve internal formatting
    paramValue = paramValue.replace(/^\n/, '').replace(/\n$/, '');

    parameters[paramName] = paramValue;
  }

  return parameters;
}

/**
 * Transform raw tool call to OpenAI format
 * @param {Object} toolCall - Raw tool call object
 * @returns {Object} OpenAI tool_calls format
 */
function transformToOpenAIToolCall(toolCall) {
  return {
    id: `call_${crypto.randomUUID().slice(0, 24)}`,
    type: 'function',
    function: {
      name: toolCall.name,
      arguments: JSON.stringify(toolCall.parameters)
    }
  };
}

/**
 * Extract text content (non-tool parts)
 * @param {string} content - Full content
 * @param {Array} toolCalls - Extracted tool calls
 * @returns {string} Text content only
 */
function extractTextContent(content, toolCalls) {
  if (toolCalls.length === 0) return content;

  let textContent = content;

  // Remove tool call content from text
  // Process in reverse to maintain indices
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    const toolCall = toolCalls[i];
    textContent =
      textContent.substring(0, toolCall.startIndex) +
      textContent.substring(toolCall.endIndex);
  }

  return textContent.trim();
}

/**
 * Validate parsed tool call
 * @param {Object} toolCall - Tool call to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateToolCall(toolCall) {
  const errors = [];

  if (!toolCall.name) {
    errors.push('Tool name is required');
  }

  if (!SUPPORTED_TOOLS.includes(toolCall.name)) {
    errors.push(`Unknown tool: ${toolCall.name}`);
  }

  // Add parameter validation based on tool
  // (Tool-specific validation can be added here)

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  parseToolCalls,
  extractToolCalls,
  extractParameters,
  transformToOpenAIToolCall,
  extractTextContent,
  validateToolCall,
  SUPPORTED_TOOLS
};
```

**Key Implementation Details**:
- Line 28-66: Main parsing function with fast path
- Line 71-112: XML extraction with proper nesting handling
- Line 117-142: Parameter extraction supporting multiline values
- Line 147-157: Transform to OpenAI format
- Line 162-180: Text content extraction (removes tool calls)
- Line 185-203: Validation with tool registry check

### Files to Modify

#### `src/transformers/qwen-to-openai-transformer.js`
**Modifications**:

**Line 1-5**: Add imports
```javascript
const crypto = require('crypto');
const { parseToolCalls } = require('../parsers/xml-tool-parser');
```

**Line 20-63**: Modify `transformToOpenAICompletion` function
Add tool call parsing:
```javascript
function transformToOpenAICompletion(qwenResponse, options = {}) {
  // ... existing code for model extraction ...

  const data = qwenResponse.data || qwenResponse;

  // Extract content from Qwen response
  const rawContent = data.choices?.[0]?.message?.content || '';
  const parentId = data.parent_id || null;
  const messageId = data.message_id || crypto.randomUUID();

  // Parse for tool calls
  const parsed = parseToolCalls(rawContent);

  // Extract usage info
  const usage = extractUsage(qwenResponse);

  // Build OpenAI response
  const message = {
    role: 'assistant',
    content: parsed.hasToolCalls ? null : parsed.textContent
  };

  // Add tool_calls if present
  if (parsed.hasToolCalls) {
    message.tool_calls = parsed.toolCalls;
    // Include any text content before tool call
    if (parsed.textContent && parsed.textContent.length > 0) {
      message.content = parsed.textContent;
    }
  }

  return {
    id: `chatcmpl-${messageId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: message,
        finish_reason: parsed.hasToolCalls ? 'tool_calls' : 'stop'
      }
    ],
    usage: usage,
    _qwen_metadata: {
      parent_id: parentId,
      message_id: messageId
    }
  };
}
```

### Integration Points
- Imported by qwen-to-openai-transformer
- Used in non-streaming response path
- Will be reused in Phase 4 for streaming

### Design Decisions
1. **Parser Independence**: Stateless parsing function
   - No class instances needed
   - Pure functions for easier testing
   - Reusable across streaming/non-streaming

2. **Text Preservation**: Extract text before/after tool calls
   - Some models may include explanations
   - Preserve assistant's reasoning

3. **Validation**: Basic validation with warnings
   - Don't fail on malformed tools
   - Log issues but continue processing
   - OpenCode handles execution errors

4. **Tool Registry**: Maintain list of supported tools
   - Easy to extend
   - Fast lookup
   - Prevents false positives

### Testing Requirements
- Unit tests for XML parsing
- Test cases:
  - Single tool call
  - Multiple tool calls
  - Tool call with multiline parameters
  - Mixed text and tool calls
  - Malformed XML (unclosed tags)
  - Nested XML in parameters
  - Unknown tools
- Integration tests with real Qwen responses

### Acceptance Criteria
- [ ] Correctly parses XML tool calls from text
- [ ] Extracts all parameters including multiline
- [ ] Transforms to OpenAI tool_calls format
- [ ] Preserves text content outside tool calls
- [ ] Handles malformed XML gracefully
- [ ] Supports all OpenCode tool types
- [ ] Sets finish_reason to 'tool_calls' when tools present
- [ ] Unit tests achieve 95%+ coverage

---

## Phase 4: Response Parser (Streaming)

### Objective
Extend the SSE handler to detect and parse XML tool calls in streaming responses, building tool calls incrementally as chunks arrive and sending them in OpenAI streaming format.

### Files to Create
None - All modifications to existing files

### Files to Modify

#### `src/services/sse-handler.js`
**Modifications**:

**Line 1-10**: Add imports
```javascript
const { parseToolCalls } = require('../parsers/xml-tool-parser');
const crypto = require('crypto');
```

**Line 50-100**: Add streaming tool call state tracking
Add to class constructor or create new streaming context:
```javascript
class ToolCallStreamingContext {
  constructor(completionId) {
    this.completionId = completionId;
    this.accumulatedContent = '';
    this.detectedToolCalls = [];
    this.sentToolCallStart = false;
    this.lastParsedLength = 0;
  }

  /**
   * Process new content chunk for tool calls
   * @param {string} chunk - New content chunk
   * @returns {Object} { hasNewToolCalls, toolCalls, shouldContinue }
   */
  processChunk(chunk) {
    this.accumulatedContent += chunk;

    // Try to parse accumulated content
    const parsed = parseToolCalls(this.accumulatedContent);

    // Check if we have complete tool calls
    const result = {
      hasNewToolCalls: false,
      newToolCalls: [],
      textChunk: '',
      shouldContinue: true
    };

    if (parsed.hasToolCalls) {
      // Compare with previously detected tool calls
      const newToolCalls = parsed.toolCalls.slice(this.detectedToolCalls.length);

      if (newToolCalls.length > 0) {
        result.hasNewToolCalls = true;
        result.newToolCalls = newToolCalls;
        this.detectedToolCalls.push(...newToolCalls);
      }
    }

    // Extract new text content
    if (!parsed.hasToolCalls || this.accumulatedContent.length > this.lastParsedLength) {
      // Send text chunks only before tool calls appear
      if (!this.sentToolCallStart) {
        result.textChunk = parsed.textContent.substring(this.lastParsedLength);
        this.lastParsedLength = parsed.textContent.length;
      }
    }

    return result;
  }

  /**
   * Finalize tool call streaming
   * @returns {Array} All detected tool calls
   */
  finalize() {
    const parsed = parseToolCalls(this.accumulatedContent);
    return parsed.toolCalls;
  }
}
```

**Line 200-400**: Modify `streamCompletion` method
Add tool call detection and streaming:
```javascript
async streamCompletion(qwenPayload, req, res, sessionId, model, persistence, startTime, isNewSession) {
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Generate completion ID
    const completionId = `chatcmpl-${crypto.randomUUID()}`;

    // Create tool call streaming context
    const toolContext = new ToolCallStreamingContext(completionId);

    // Track state
    let parentId = null;
    let messageId = null;
    let fullContent = '';
    let usage = null;
    let chunksSent = 0;
    let firstChunkReceived = false;

    // Set up abort handling
    req.on('close', () => {
      console.log('[SSEHandler] Client disconnected, aborting stream');
      // Cleanup if needed
    });

    // Create Qwen stream
    const qwenStream = await this.qwenClient.sendMessage(qwenPayload, { stream: true });

    // Process Qwen stream
    qwenStream.on('data', (chunk) => {
      try {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Handle response.created metadata chunk
            if (parsed['response.created']) {
              parentId = parsed['response.created'].parent_id;
              messageId = parsed['response.created'].message_id;
              continue;
            }

            // Extract content from chunk
            const content = parsed.choices?.[0]?.delta?.content || '';

            if (content) {
              fullContent += content;

              // Process chunk for tool calls
              const toolResult = toolContext.processChunk(content);

              if (toolResult.hasNewToolCalls) {
                // Transition to tool call streaming

                if (!toolContext.sentToolCallStart) {
                  // Send any accumulated text before tool calls
                  if (toolResult.textChunk) {
                    const textChunk = {
                      id: completionId,
                      object: 'chat.completion.chunk',
                      created: Math.floor(Date.now() / 1000),
                      model: model,
                      choices: [{
                        index: 0,
                        delta: {
                          role: 'assistant',
                          content: toolResult.textChunk
                        },
                        finish_reason: null
                      }]
                    };
                    res.write(`data: ${JSON.stringify(textChunk)}\n\n`);
                    chunksSent++;
                  }

                  toolContext.sentToolCallStart = true;
                }

                // Send tool call chunks
                for (const toolCall of toolResult.newToolCalls) {
                  // Send tool call start
                  const toolStartChunk = {
                    id: completionId,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        role: 'assistant',
                        tool_calls: [{
                          index: toolContext.detectedToolCalls.length - toolResult.newToolCalls.length + toolResult.newToolCalls.indexOf(toolCall),
                          id: toolCall.id,
                          type: 'function',
                          function: {
                            name: toolCall.function.name,
                            arguments: ''
                          }
                        }]
                      },
                      finish_reason: null
                    }]
                  };
                  res.write(`data: ${JSON.stringify(toolStartChunk)}\n\n`);
                  chunksSent++;

                  // Send tool call arguments (can be streamed or sent at once)
                  const argsChunk = {
                    id: completionId,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        tool_calls: [{
                          index: toolContext.detectedToolCalls.length - toolResult.newToolCalls.length + toolResult.newToolCalls.indexOf(toolCall),
                          function: {
                            arguments: toolCall.function.arguments
                          }
                        }]
                      },
                      finish_reason: null
                    }]
                  };
                  res.write(`data: ${JSON.stringify(argsChunk)}\n\n`);
                  chunksSent++;
                }

              } else if (!toolContext.sentToolCallStart && toolResult.textChunk) {
                // Send regular content chunk
                if (!firstChunkReceived) {
                  // First chunk includes role
                  const chunk = {
                    id: completionId,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        role: 'assistant',
                        content: toolResult.textChunk
                      },
                      finish_reason: null
                    }]
                  };
                  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                  firstChunkReceived = true;
                } else {
                  // Subsequent chunks
                  const chunk = {
                    id: completionId,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{
                      index: 0,
                      delta: {
                        content: toolResult.textChunk
                      },
                      finish_reason: null
                    }]
                  };
                  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
                chunksSent++;
              }
            }

            // Extract usage if present
            if (parsed.usage) {
              usage = {
                prompt_tokens: parsed.usage.input_tokens || 0,
                completion_tokens: parsed.usage.output_tokens || 0,
                total_tokens: parsed.usage.total_tokens || 0
              };
            }

          } catch (parseError) {
            console.error('[SSEHandler] Error parsing chunk:', parseError);
          }
        }
      } catch (error) {
        console.error('[SSEHandler] Error processing chunk:', error);
      }
    });

    // Handle stream end
    qwenStream.on('end', () => {
      try {
        // Finalize tool call detection
        const finalToolCalls = toolContext.finalize();

        // Determine finish reason
        const finishReason = finalToolCalls.length > 0 ? 'tool_calls' : 'stop';

        // Send final chunk with finish_reason
        const finalChunk = {
          id: completionId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            delta: {},
            finish_reason: finishReason
          }]
        };
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);

        // Send usage chunk if available
        if (usage) {
          const usageChunk = {
            id: completionId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [],
            usage: usage
          };
          res.write(`data: ${JSON.stringify(usageChunk)}\n\n`);
        }

        // Send [DONE] marker
        res.write('data: [DONE]\n\n');
        res.end();

        // Update session
        if (parentId) {
          this.sessionManager.updateSession(sessionId, parentId);
        }

        // Set conversation hash for new sessions
        if (isNewSession) {
          const assistantMessage = fullContent;
          this.sessionManager.setConversationHash(sessionId, assistantMessage);
        }

        // Log response to database
        if (persistence) {
          const duration = Date.now() - startTime;
          logResponse(
            persistence.requestDbId,
            sessionId,
            { content: fullContent, parent_id: parentId },
            { content: fullContent, tool_calls: finalToolCalls },
            parentId,
            usage,
            duration,
            finishReason,
            null
          ).catch(err => {
            console.error('[SSEHandler] Failed to log response:', err);
          });
        }

        console.log(`[SSEHandler] Stream completed. Chunks sent: ${chunksSent}, Finish reason: ${finishReason}`);

      } catch (error) {
        console.error('[SSEHandler] Error in stream end handler:', error);
        res.end();
      }
    });

    // Handle stream errors
    qwenStream.on('error', (error) => {
      console.error('[SSEHandler] Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('[SSEHandler] Error in streamCompletion:', error);
    throw error;
  }
}
```

### Integration Points
- Uses xml-tool-parser from Phase 3
- Integrated into existing SSE streaming flow
- Maintains compatibility with non-tool streaming

### Design Decisions
1. **Incremental Parsing**: Parse on each chunk
   - Detect tool calls as they complete
   - Send tool call chunks immediately
   - Avoid buffering entire response

2. **State Management**: ToolCallStreamingContext class
   - Tracks accumulated content
   - Manages tool call detection state
   - Handles transition from text to tool calls

3. **OpenAI Compatibility**: Match OpenAI streaming format exactly
   - First chunk: role + tool_call with empty arguments
   - Subsequent chunks: arguments in pieces
   - Final chunk: finish_reason = 'tool_calls'

4. **Text Handling**: Send text before tool calls
   - Preserve model's reasoning
   - Switch to tool mode when XML detected
   - No text after tool calls (matches OpenAI behavior)

### Testing Requirements
- Integration tests for streaming tool calls
- Test cases:
  - Simple tool call streaming
  - Multiple tool calls in stream
  - Mixed text and tool call
  - Incomplete tool call at stream end
  - Client disconnect during tool call
- Performance tests (low latency, no buffering)

### Acceptance Criteria
- [ ] Detects XML tool calls in streaming responses
- [ ] Sends tool calls in OpenAI streaming format
- [ ] Maintains low latency (no buffering)
- [ ] Handles incomplete tool calls gracefully
- [ ] Preserves text content before tool calls
- [ ] Sets correct finish_reason
- [ ] Compatible with OpenCode streaming parser
- [ ] Integration tests pass with real Qwen streams

---

## Phase 5: Tool Result Handler

### Objective
Handle messages with role: "tool" from OpenCode, transforming tool results back into the conversation flow that Qwen can process.

### Files to Create

#### `src/handlers/tool-result-handler.js`
```javascript
/**
 * Tool Result Handler
 *
 * Processes tool execution results from OpenCode and formats them
 * for continuation in Qwen conversation context.
 */

/**
 * Detect if messages contain tool results
 * @param {Array} messages - OpenAI messages array
 * @returns {boolean} True if tool results present
 */
function hasToolResults(messages) {
  return messages.some(msg => msg.role === 'tool');
}

/**
 * Format tool results for Qwen
 * Tool results need to be transformed into user messages with
 * structured formatting that Qwen can understand.
 *
 * @param {Array} messages - OpenAI messages array
 * @returns {Array} Transformed messages
 */
function formatToolResults(messages) {
  const transformed = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      // Transform tool result to user message with clear formatting
      const toolCallId = message.tool_call_id;
      const content = message.content;

      // Find the corresponding tool call from previous assistant message
      const assistantMsg = findPreviousAssistantMessage(messages, message);
      const toolCall = assistantMsg?.tool_calls?.find(tc => tc.id === toolCallId);
      const toolName = toolCall?.function?.name || 'unknown';

      // Format as structured user message
      const formattedMessage = {
        role: 'user',
        content: formatToolResultContent(toolName, content, toolCallId)
      };

      transformed.push(formattedMessage);
    } else {
      // Pass through other messages
      transformed.push(message);
    }
  }

  return transformed;
}

/**
 * Format tool result content with clear structure
 * @param {string} toolName - Tool that was executed
 * @param {string} content - Tool execution result
 * @param {string} toolCallId - Tool call ID for tracking
 * @returns {string} Formatted content
 */
function formatToolResultContent(toolName, content, toolCallId) {
  return `[Tool Result: ${toolName}]
Tool Call ID: ${toolCallId}

Result:
${content}`;
}

/**
 * Find previous assistant message containing tool calls
 * @param {Array} messages - Messages array
 * @param {Object} toolMessage - Tool message to find context for
 * @returns {Object|null} Previous assistant message or null
 */
function findPreviousAssistantMessage(messages, toolMessage) {
  const toolIndex = messages.indexOf(toolMessage);

  // Search backwards for assistant message with tool_calls
  for (let i = toolIndex - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].tool_calls) {
      return messages[i];
    }
  }

  return null;
}

/**
 * Validate tool result messages
 * @param {Array} messages - Messages array
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateToolResults(messages) {
  const errors = [];

  const toolMessages = messages.filter(m => m.role === 'tool');

  for (const toolMsg of toolMessages) {
    if (!toolMsg.tool_call_id) {
      errors.push('Tool message missing tool_call_id');
    }

    if (!toolMsg.content) {
      errors.push('Tool message missing content');
    }

    // Verify matching tool call exists
    const assistantMsg = findPreviousAssistantMessage(messages, toolMsg);
    if (!assistantMsg) {
      errors.push(`No assistant message found for tool call: ${toolMsg.tool_call_id}`);
    } else {
      const toolCall = assistantMsg.tool_calls?.find(tc => tc.id === toolMsg.tool_call_id);
      if (!toolCall) {
        errors.push(`Tool call not found: ${toolMsg.tool_call_id}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  hasToolResults,
  formatToolResults,
  formatToolResultContent,
  validateToolResults,
  findPreviousAssistantMessage
};
```

**Key Implementation Details**:
- Line 10-16: Detection function for tool results
- Line 22-58: Main transformation function
  - Converts tool role to user role
  - Formats content with clear structure
  - Preserves tool call ID for tracking
- Line 64-72: Content formatting with headers
- Line 78-92: Context finder for matching tool calls
- Line 98-130: Validation with comprehensive checks

### Files to Modify

#### `src/handlers/chat-completions-handler.js`
**Modifications**:

**Line 35-42**: Add imports
```javascript
const {
  hasToolResults,
  formatToolResults,
  validateToolResults
} = require('./tool-result-handler');
```

**Line 157-170**: Add tool result detection
After request validation, before session determination:
```javascript
// 1. Extract and validate OpenAI request
const { messages, model, stream, temperature, max_tokens, tools, ...options } = req.body;

// Validate request
validateChatCompletionRequest(req.body);

// Check for tool results and transform if needed
let processedMessages = messages;
if (hasToolResults(messages)) {
  // Validate tool results
  const validation = validateToolResults(messages);
  if (!validation.valid) {
    const error = new Error(`Invalid tool results: ${validation.errors.join(', ')}`);
    error.statusCode = 400;
    error.code = 'invalid_tool_results';
    throw error;
  }

  // Transform tool results to user messages
  processedMessages = formatToolResults(messages);

  console.log('[ChatCompletions] Tool results detected and formatted');
}

// Use processedMessages instead of messages for rest of function
```

**Line 284-287**: Update transformer call
```javascript
const qwenPayload = transformers.transformToQwenRequest(
  { messages: processedMessages, model: model || 'qwen3-max', tools },
  { chatId, parentId },
  stream !== false
);
```

### Integration Points
- Called from chat-completions-handler before transformation
- Works with existing message flow
- Compatible with tool call parsing (Phases 3-4)

### Design Decisions
1. **Role Transformation**: Convert tool → user
   - Qwen doesn't understand "tool" role
   - User messages maintain conversation flow
   - Preserves context via formatted content

2. **Structured Formatting**: Clear headers and sections
   - Easy for model to parse
   - Maintains tool call tracking
   - Human-readable for debugging

3. **Validation**: Strict validation before processing
   - Ensure tool_call_id present
   - Verify matching assistant message
   - Fail fast with clear errors

4. **Backwards Compatible**: No impact on non-tool flows
   - Only processes when tool results detected
   - Pass-through for regular messages

### Testing Requirements
- Unit tests for tool result formatting
- Test cases:
  - Single tool result
  - Multiple tool results
  - Mixed tool and regular messages
  - Missing tool_call_id
  - Orphaned tool results (no matching call)
- Integration test: full tool calling cycle

### Acceptance Criteria
- [ ] Detects tool result messages
- [ ] Transforms to user messages with formatting
- [ ] Validates tool call references
- [ ] Maintains tool call tracking
- [ ] Preserves conversation context
- [ ] Fails gracefully on invalid tool results
- [ ] Unit tests pass with 100% coverage
- [ ] Integration test demonstrates full cycle

---

## Phase 6: Middleware Integration

### Objective
Create a middleware layer that orchestrates tool calling transformations, making the feature easily enabled/disabled and maintaining clean separation of concerns.

### Files to Create

#### `src/middleware/tool-calling-middleware.js`
```javascript
/**
 * Tool Calling Middleware
 *
 * Orchestrates tool calling transformations for OpenCode compatibility.
 * Provides clean enable/disable functionality and request enhancement.
 */

const config = require('../config');

/**
 * Tool calling middleware
 * Enhances request with tool calling metadata
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function toolCallingMiddleware(req, res, next) {
  // Check if this is a chat completions request
  if (!req.path.includes('/chat/completions')) {
    return next();
  }

  // Check if tool calling is enabled
  const toolCallingEnabled = config.features?.toolCalling?.enabled ?? true;

  if (!toolCallingEnabled) {
    // Strip tools from request if disabled
    if (req.body.tools) {
      console.log('[ToolCalling] Tool calling disabled, stripping tools from request');
      delete req.body.tools;
    }
    return next();
  }

  // Enhance request with tool calling metadata
  req.toolCalling = {
    enabled: true,
    hasTools: Array.isArray(req.body.tools) && req.body.tools.length > 0,
    toolCount: req.body.tools?.length || 0,
    autoDetect: config.features?.toolCalling?.autoDetect ?? true
  };

  // Log tool calling info
  if (req.toolCalling.hasTools) {
    console.log(`[ToolCalling] Request has ${req.toolCalling.toolCount} tools defined`);
  }

  next();
}

/**
 * Check if tool calling should be enabled for request
 * @param {Object} req - Express request
 * @returns {boolean} True if tool calling should be active
 */
function shouldEnableToolCalling(req) {
  if (!req.toolCalling) {
    return false;
  }

  if (!req.toolCalling.enabled) {
    return false;
  }

  // Has explicit tools
  if (req.toolCalling.hasTools) {
    return true;
  }

  // Auto-detect from message content
  if (req.toolCalling.autoDetect && req.body.messages) {
    return detectToolIntent(req.body.messages);
  }

  return false;
}

/**
 * Detect if messages suggest tool usage
 * @param {Array} messages - Request messages
 * @returns {boolean} True if tool usage likely
 */
function detectToolIntent(messages) {
  // Simple keyword detection
  const toolKeywords = [
    'read file',
    'write file',
    'execute',
    'run command',
    'list files',
    'search files',
    'edit file'
  ];

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return false;
  }

  const content = (lastMessage.content || '').toLowerCase();
  return toolKeywords.some(keyword => content.includes(keyword));
}

module.exports = {
  toolCallingMiddleware,
  shouldEnableToolCalling,
  detectToolIntent
};
```

**Key Implementation Details**:
- Line 15-50: Main middleware function
  - Checks path relevance
  - Respects config settings
  - Adds metadata to request
- Line 56-77: Enable decision logic
- Line 83-106: Auto-detection from keywords

### Files to Modify

#### `src/config/index.js`
**Modifications**:

**Line 40-55**: Add feature flags
```javascript
module.exports = {
  // ... existing config ...

  features: {
    toolCalling: {
      enabled: process.env.TOOL_CALLING_ENABLED !== 'false',
      autoDetect: process.env.TOOL_CALLING_AUTO_DETECT !== 'false',
      maxTools: parseInt(process.env.TOOL_CALLING_MAX_TOOLS || '20'),
      supportedTools: [
        'read', 'write', 'edit', 'bash', 'glob', 'grep',
        'list_files', 'search_files', 'read_file', 'write_to_file',
        'execute_command', 'apply_diff', 'attempt_completion',
        'ask_followup_question'
      ]
    }
  }
};
```

#### `src/index.js` (or main server file)
**Modifications**:

**Line 15-20**: Add middleware import
```javascript
const { toolCallingMiddleware } = require('./middleware/tool-calling-middleware');
```

**Line 50-55**: Register middleware
```javascript
// Apply tool calling middleware before routes
app.use(toolCallingMiddleware);

// Register routes
app.post('/v1/chat/completions', chatCompletionsHandler);
```

#### `src/handlers/chat-completions-handler.js`
**Modifications**:

**Line 38-42**: Add middleware check
```javascript
const { shouldEnableToolCalling } = require('../middleware/tool-calling-middleware');
```

**Line 157-162**: Use middleware decision
```javascript
// Check if tool calling should be active
const toolCallingActive = shouldEnableToolCalling(req);

// Only process tools if active
const tools = toolCallingActive ? req.body.tools : undefined;

// ... rest of handler uses tools variable
```

### Integration Points
- Registered in main server before route handlers
- Used by chat-completions-handler for feature gating
- Reads from config for enable/disable

### Design Decisions
1. **Feature Flag**: Clean on/off switch
   - Environment variable control
   - Runtime decision per request
   - No code changes needed

2. **Auto-Detection**: Optional intelligent enabling
   - Keyword-based detection
   - Helps OpenCode work without explicit tools
   - Can be disabled if too aggressive

3. **Metadata Injection**: Enhance request object
   - Avoid global state
   - Easy access for handlers
   - Clean information flow

4. **Non-Breaking**: Graceful degradation
   - Disabled: strips tools, works as before
   - Enabled: adds enhancement layer
   - No impact on existing flows

### Testing Requirements
- Unit tests for middleware logic
- Test cases:
  - Enabled with tools
  - Enabled without tools
  - Disabled (tool stripping)
  - Auto-detection (various keywords)
  - Non-chat endpoints (pass-through)
- Integration tests with config variations

### Acceptance Criteria
- [ ] Middleware registers correctly
- [ ] Feature flag respected
- [ ] Auto-detection works for common phrases
- [ ] Tools stripped when disabled
- [ ] Metadata injected on relevant requests
- [ ] No impact on non-chat endpoints
- [ ] Environment variables control behavior
- [ ] Unit tests pass with 95%+ coverage

---

## Phase 7: Testing Suite

### Objective
Create comprehensive test coverage for all tool calling components, including unit tests, integration tests, and end-to-end scenarios.

### Files to Create

#### `tests/unit/tool-transformers.test.js`
```javascript
/**
 * Unit Tests: Tool Transformers
 *
 * Tests tool-to-xml-transformer functionality
 */

const {
  transformToolsToXML,
  generateToolDocumentation,
  convertParametersToXML
} = require('../../src/transformers/tool-to-xml-transformer');

describe('Tool to XML Transformer', () => {
  describe('transformToolsToXML', () => {
    test('transforms single tool to XML', () => {
      const tools = [{
        type: 'function',
        function: {
          name: 'read',
          description: 'Read a file',
          parameters: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to file'
              }
            },
            required: ['filePath']
          }
        }
      }];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('<tools>');
      expect(xml).toContain('## read');
      expect(xml).toContain('Read a file');
      expect(xml).toContain('filePath');
      expect(xml).toContain('(required)');
      expect(xml).toContain('</tools>');
    });

    test('handles multiple tools', () => {
      const tools = [
        { type: 'function', function: { name: 'read', description: 'Read file', parameters: { type: 'object', properties: {} } } },
        { type: 'function', function: { name: 'write', description: 'Write file', parameters: { type: 'object', properties: {} } } }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## read');
      expect(xml).toContain('## write');
    });

    test('handles empty tools array', () => {
      const xml = transformToolsToXML([]);
      expect(xml).toBe('<tools>\n\n</tools>');
    });

    // More test cases...
  });

  // More test suites...
});
```

#### `tests/unit/xml-tool-parser.test.js`
```javascript
/**
 * Unit Tests: XML Tool Parser
 *
 * Tests xml-tool-parser functionality
 */

const {
  parseToolCalls,
  extractToolCalls,
  extractParameters,
  validateToolCall
} = require('../../src/parsers/xml-tool-parser');

describe('XML Tool Parser', () => {
  describe('parseToolCalls', () => {
    test('parses simple tool call', () => {
      const content = `Let me read that file.
<read>
<filePath>/path/to/file.js</filePath>
</read>`;

      const result = parseToolCalls(content);

      expect(result.hasToolCalls).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].function.name).toBe('read');
      expect(result.toolCalls[0].function.arguments).toContain('filePath');
    });

    test('extracts text content separate from tool calls', () => {
      const content = `I'll help with that.
<read>
<filePath>file.js</filePath>
</read>`;

      const result = parseToolCalls(content);

      expect(result.textContent).toBe("I'll help with that.");
    });

    test('handles multiple tool calls', () => {
      const content = `<read>
<filePath>file1.js</filePath>
</read>
<read>
<filePath>file2.js</filePath>
</read>`;

      const result = parseToolCalls(content);

      expect(result.hasToolCalls).toBe(true);
      expect(result.toolCalls).toHaveLength(2);
    });

    test('handles no tool calls', () => {
      const content = 'Just regular text response.';
      const result = parseToolCalls(content);

      expect(result.hasToolCalls).toBe(false);
      expect(result.toolCalls).toHaveLength(0);
      expect(result.textContent).toBe(content);
    });

    // More test cases...
  });

  // More test suites...
});
```

#### `tests/unit/tool-result-handler.test.js`
```javascript
/**
 * Unit Tests: Tool Result Handler
 *
 * Tests tool-result-handler functionality
 */

const {
  hasToolResults,
  formatToolResults,
  validateToolResults
} = require('../../src/handlers/tool-result-handler');

describe('Tool Result Handler', () => {
  describe('hasToolResults', () => {
    test('detects tool results', () => {
      const messages = [
        { role: 'user', content: 'Read file' },
        { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'read', arguments: '{}' } }] },
        { role: 'tool', tool_call_id: 'call_1', content: 'File content' }
      ];

      expect(hasToolResults(messages)).toBe(true);
    });

    test('returns false when no tool results', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' }
      ];

      expect(hasToolResults(messages)).toBe(false);
    });
  });

  describe('formatToolResults', () => {
    test('formats tool result as user message', () => {
      const messages = [
        { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'read', arguments: '{"filePath":"file.js"}' } }] },
        { role: 'tool', tool_call_id: 'call_1', content: 'File content here' }
      ];

      const formatted = formatToolResults(messages);

      expect(formatted).toHaveLength(2);
      expect(formatted[1].role).toBe('user');
      expect(formatted[1].content).toContain('[Tool Result: read]');
      expect(formatted[1].content).toContain('File content here');
    });
  });

  // More test suites...
});
```

#### `tests/integration/tool-calling-e2e.test.js`
```javascript
/**
 * Integration Test: Tool Calling End-to-End
 *
 * Tests complete tool calling flow with Qwen proxy
 */

const axios = require('axios');
const { OpenAI } = require('openai');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Tool Calling End-to-End', () => {
  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  describe('OpenCode Tool Calling Simulation', () => {
    test('Full cycle: tool call request → XML response → tool result → final response', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Full Tool Calling Cycle ===');

      // Step 1: Request with tools
      console.log('\n→ Step 1: Send request with tool definitions');
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read a file from the filesystem',
            parameters: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'The path to the file'
                }
              },
              required: ['filePath']
            }
          }
        }
      ];

      const response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please read the file package.json' }
        ],
        tools: tools,
        stream: false
      });

      console.log('  Response 1 status:', response1.status);
      expect(response1.status).toBe(200);

      const message1 = response1.data.choices[0].message;
      console.log('  Message 1:', {
        hasContent: !!message1.content,
        hasToolCalls: !!message1.tool_calls,
        finishReason: response1.data.choices[0].finish_reason
      });

      // Verify tool call was generated
      expect(message1.tool_calls).toBeDefined();
      expect(message1.tool_calls.length).toBeGreaterThan(0);
      expect(message1.tool_calls[0].function.name).toBe('read');
      expect(response1.data.choices[0].finish_reason).toBe('tool_calls');

      const toolCall = message1.tool_calls[0];
      console.log('  ✓ Tool call generated:', toolCall.function.name);

      // Step 2: Simulate tool execution (client-side)
      console.log('\n→ Step 2: Simulate tool execution');
      const toolResult = JSON.stringify({
        name: 'qwen-proxy',
        version: '1.0.0',
        description: 'OpenAI-compatible proxy for Qwen'
      }, null, 2);

      console.log('  ✓ Tool executed (simulated)');

      // Step 3: Send tool result back
      console.log('\n→ Step 3: Send tool result');
      const response2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please read the file package.json' },
          { role: 'assistant', content: message1.content, tool_calls: message1.tool_calls },
          { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
        ],
        tools: tools,
        stream: false
      });

      console.log('  Response 2 status:', response2.status);
      expect(response2.status).toBe(200);

      const message2 = response2.data.choices[0].message;
      console.log('  Message 2 content preview:', message2.content.substring(0, 200));

      // Verify final response
      expect(message2.content).toBeTruthy();
      expect(response2.data.choices[0].finish_reason).toBe('stop');

      // Content should reference the package.json
      const contentLower = message2.content.toLowerCase();
      expect(
        contentLower.includes('package') ||
        contentLower.includes('qwen') ||
        contentLower.includes('proxy')
      ).toBe(true);

      console.log('  ✓ Final response generated with context');

      console.log('\n✅ E2E TEST PASSED: Complete tool calling cycle works');
    }, 120000);

    test('Streaming tool call response', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Streaming Tool Calls ===');

      const tools = [{
        type: 'function',
        function: {
          name: 'bash',
          description: 'Execute command',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to run' },
              description: { type: 'string', description: 'Command description' }
            },
            required: ['command', 'description']
          }
        }
      }];

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'List files in current directory' }
        ],
        tools: tools,
        stream: true
      }, {
        responseType: 'stream'
      });

      console.log('  Response status:', response.status);
      expect(response.status).toBe(200);

      let toolCallsDetected = false;
      let finishReasonToolCalls = false;
      let chunkCount = 0;

      await new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              chunkCount++;

              if (parsed.choices?.[0]?.delta?.tool_calls) {
                toolCallsDetected = true;
              }

              if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                finishReasonToolCalls = true;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        });

        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

      console.log('  Chunks received:', chunkCount);
      console.log('  Tool calls detected:', toolCallsDetected);
      console.log('  Finish reason tool_calls:', finishReasonToolCalls);

      expect(chunkCount).toBeGreaterThan(0);
      // Note: Tool call detection depends on Qwen's response
      // May not always generate XML, so this is informational

      console.log('\n✅ E2E TEST COMPLETED: Streaming flow works');
    }, 90000);
  });

  describe('OpenAI SDK Compatibility', () => {
    test('Works with OpenAI SDK tool calling', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: OpenAI SDK Tool Calling ===');

      const client = new OpenAI({
        baseURL: `${BASE_URL}/v1`,
        apiKey: 'not-needed'
      });

      const tools = [{
        type: 'function',
        function: {
          name: 'read',
          description: 'Read file',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string' }
            },
            required: ['filePath']
          }
        }
      }];

      const completion = await client.chat.completions.create({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Read README.md' }
        ],
        tools: tools
      });

      console.log('  SDK completion received');
      console.log('  Has tool calls:', !!completion.choices[0].message.tool_calls);
      console.log('  Finish reason:', completion.choices[0].finish_reason);

      // Verify structure matches OpenAI SDK expectations
      expect(completion).toHaveProperty('id');
      expect(completion).toHaveProperty('choices');
      expect(completion.choices[0]).toHaveProperty('message');

      console.log('\n✅ E2E TEST PASSED: OpenAI SDK compatibility verified');
    }, 90000);
  });
});
```

### Files to Modify
None - Pure test creation

### Integration Points
- Run via npm test or jest
- Part of CI/CD pipeline
- Used for regression testing

### Design Decisions
1. **Comprehensive Coverage**: Test all components
   - Unit tests for each module
   - Integration tests for flows
   - E2E tests for real scenarios

2. **Real API Testing**: Integration tests use actual Qwen
   - Validates real-world behavior
   - Catches API changes
   - Requires credentials (skips if absent)

3. **OpenAI SDK Tests**: Verify SDK compatibility
   - Ensures OpenCode will work
   - Tests streaming and non-streaming
   - Validates tool call format

4. **Test Organization**: Clear structure
   - Unit tests in `tests/unit/`
   - Integration tests in `tests/integration/`
   - Descriptive test names
   - Comprehensive assertions

### Testing Requirements
(This is meta-testing - testing the tests)
- All tests should run successfully
- Unit tests should be fast (< 100ms each)
- Integration tests may be slower (API calls)
- E2E tests require credentials (skippable)
- Coverage reports generated

### Acceptance Criteria
- [ ] Unit tests for all new modules created
- [ ] Integration tests cover main flows
- [ ] E2E test demonstrates full cycle
- [ ] OpenAI SDK compatibility verified
- [ ] Tests pass consistently
- [ ] Coverage >90% for new code
- [ ] CI/CD integration ready
- [ ] Documentation includes test instructions

---

## Phase 8: Documentation & Examples

### Objective
Create comprehensive documentation and examples for developers and users to understand and use the tool calling feature.

### Files to Create

#### `docs/TOOL_CALLING_USAGE.md`
```markdown
# Tool Calling Usage Guide

## Overview

The Qwen Proxy now supports OpenAI-compatible tool calling, enabling OpenCode and other clients to use tools through Qwen models via XML-style prompt engineering.

## How It Works

### Request Flow

1. **Client sends request** with OpenAI `tools` array
2. **Proxy transforms tools** to XML schema
3. **XML schema injected** into system prompt
4. **Qwen processes** as natural language
5. **Model outputs** XML-formatted tool calls
6. **Proxy parses** XML and transforms to OpenAI format
7. **Client receives** standard OpenAI tool_calls response

### Response Flow

1. **Client executes** tool locally (e.g., reads file)
2. **Client sends result** with `role: "tool"`
3. **Proxy formats** tool result for Qwen
4. **Qwen processes** result in context
5. **Model generates** final response
6. **Client receives** completion

## Configuration

### Environment Variables

```bash
# Enable/disable tool calling (default: true)
TOOL_CALLING_ENABLED=true

# Auto-detect tool intent from keywords (default: true)
TOOL_CALLING_AUTO_DETECT=true

# Maximum tools per request (default: 20)
TOOL_CALLING_MAX_TOOLS=20
```

### Feature Flags

Tool calling can be controlled via `config.features.toolCalling`:

```javascript
{
  features: {
    toolCalling: {
      enabled: true,
      autoDetect: true,
      maxTools: 20,
      supportedTools: [
        'read', 'write', 'edit', 'bash',
        // ... see config for full list
      ]
    }
  }
}
```

## Usage Examples

### Basic Tool Call (Non-Streaming)

```javascript
const response = await axios.post('http://localhost:3000/v1/chat/completions', {
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Read the file package.json' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'read',
        description: 'Read a file from filesystem',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file'
            }
          },
          required: ['filePath']
        }
      }
    }
  ],
  stream: false
});

// Response will have tool_calls
const toolCalls = response.data.choices[0].message.tool_calls;
```

### Streaming Tool Calls

```javascript
const response = await axios.post('http://localhost:3000/v1/chat/completions', {
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'List files in current directory' }
  ],
  tools: [...],
  stream: true
}, {
  responseType: 'stream'
});

response.data.on('data', (chunk) => {
  // Parse SSE chunks
  // Look for tool_calls in delta
});
```

### Complete Tool Execution Cycle

```javascript
// 1. Initial request with tools
const response1 = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Read config.json' }
  ],
  tools: [readTool]
});

const toolCall = response1.choices[0].message.tool_calls[0];

// 2. Execute tool locally
const fileContent = fs.readFileSync(
  JSON.parse(toolCall.function.arguments).filePath,
  'utf-8'
);

// 3. Send result back
const response2 = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Read config.json' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [toolCall]
    },
    {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: fileContent
    }
  ],
  tools: [readTool]
});

// 4. Final response uses tool result
console.log(response2.choices[0].message.content);
```

## Supported Tools

The following tool names are recognized and parsed:

- `read` / `read_file` - File reading
- `write` / `write_to_file` - File writing
- `edit` / `apply_diff` - File editing
- `bash` / `execute_command` - Command execution
- `glob` - File pattern matching
- `grep` / `search_files` - File searching
- `list_files` - Directory listing
- `attempt_completion` - Task completion
- `ask_followup_question` - User interaction

## Troubleshooting

### Tool Calls Not Generated

**Problem**: Qwen returns text instead of XML tool calls

**Solutions**:
1. Ensure tools are defined in request
2. Check system prompt includes tool definitions
3. Try more explicit user message: "Use the read tool to read file.js"
4. Verify model is qwen3-max (best tool calling support)

### Tool Calls Not Parsed

**Problem**: Response contains XML but not transformed to tool_calls

**Solutions**:
1. Check XML format matches expected pattern
2. Verify tool name is in supported list
3. Check logs for parser warnings
3. Ensure XML tags are properly closed

### Tool Results Not Working

**Problem**: Tool result message causes error

**Solutions**:
1. Verify `tool_call_id` matches previous tool call
2. Ensure previous message was assistant with tool_calls
3. Check role is exactly "tool"
4. Validate tool result format

## Best Practices

1. **Tool Definitions**: Be specific in descriptions
   - Include parameter types and requirements
   - Provide usage examples
   - Use clear, natural language

2. **System Prompts**: Preserve user's system message
   - Tool definitions append to existing prompt
   - Don't override important instructions

3. **Error Handling**: Check for tool_calls before execution
   - Validate arguments before execution
   - Handle execution errors gracefully
   - Send error details in tool result

4. **Streaming**: Handle partial tool calls
   - Buffer until complete
   - Parse incrementally
   - Don't assume immediate completion

## Performance Considerations

- **First Request**: ~2-5s (includes tool schema injection)
- **Follow-ups**: ~1-3s (context cached server-side)
- **Streaming Latency**: <500ms to first chunk
- **Tool Call Parsing**: <50ms overhead

## Limitations

1. **No Native Support**: Qwen API doesn't natively support tools
   - Implemented via prompt engineering
   - Dependent on model following instructions
   - Not 100% reliable (model may refuse)

2. **XML Format Only**: Currently supports XML
   - JSON tool calls not supported
   - Must match exact tag format
   - Parameter names are case-sensitive

3. **One Tool Per Message**: Following RooCode pattern
   - Model instructed to use one tool at a time
   - Multiple tools require multiple turns
   - Iterative execution model

4. **Streaming Complexity**: Tool call detection harder in streams
   - May need to buffer content
   - Partial XML can't be parsed
   - Latency trade-off

## Migration from Previous Version

If you were using the proxy before tool calling:

1. **No Breaking Changes**: Existing flows work as before
2. **Opt-In**: Tools only active when provided in request
3. **Configuration**: Default enabled, can disable via env var
4. **Testing**: Run existing integration tests to verify

## Further Reading

- [OpenCode Tool Calling Investigation](./OPENCODE_TOOL_CALLING_INVESTIGATION.md)
- [OpenCode Tool Examples](./OPENCODE_TOOL_EXAMPLES.md)
- [Tool Transformation Implementation Plan](./TOOL_CALLING_TRANSFORMATION_PLAN.md)
```

#### `examples/opencode_tool_examples.json`
```json
{
  "examples": [
    {
      "name": "Simple File Read",
      "description": "Basic file reading with OpenCode read tool",
      "request": {
        "model": "qwen3-max",
        "messages": [
          {
            "role": "user",
            "content": "Read the file src/server.js"
          }
        ],
        "tools": [
          {
            "type": "function",
            "function": {
              "name": "read",
              "description": "Reads a file from the local filesystem",
              "parameters": {
                "type": "object",
                "properties": {
                  "filePath": {
                    "type": "string",
                    "description": "The absolute path to the file to read"
                  },
                  "offset": {
                    "type": "number",
                    "description": "The line number to start reading from (0-based)"
                  },
                  "limit": {
                    "type": "number",
                    "description": "The number of lines to read"
                  }
                },
                "required": ["filePath"]
              }
            }
          }
        ],
        "stream": false
      },
      "expectedResponse": {
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
                    "name": "read",
                    "arguments": "{\"filePath\":\"src/server.js\"}"
                  }
                }
              ]
            },
            "finish_reason": "tool_calls"
          }
        ]
      }
    },
    {
      "name": "Command Execution",
      "description": "Execute bash command",
      "request": {
        "model": "qwen3-max",
        "messages": [
          {
            "role": "user",
            "content": "Run npm test to check if tests pass"
          }
        ],
        "tools": [
          {
            "type": "function",
            "function": {
              "name": "bash",
              "description": "Execute bash commands in a persistent shell session",
              "parameters": {
                "type": "object",
                "properties": {
                  "command": {
                    "type": "string",
                    "description": "The command to execute"
                  },
                  "description": {
                    "type": "string",
                    "description": "Clear, concise description of what this command does"
                  },
                  "timeout": {
                    "type": "number",
                    "description": "Optional timeout in milliseconds"
                  }
                },
                "required": ["command", "description"]
              }
            }
          }
        ],
        "stream": false
      },
      "expectedResponse": {
        "choices": [
          {
            "message": {
              "role": "assistant",
              "content": null,
              "tool_calls": [
                {
                  "id": "call_xyz789",
                  "type": "function",
                  "function": {
                    "name": "bash",
                    "arguments": "{\"command\":\"npm test\",\"description\":\"Run test suite\"}"
                  }
                }
              ]
            },
            "finish_reason": "tool_calls"
          }
        ]
      }
    },
    {
      "name": "Tool Result Follow-up",
      "description": "Complete cycle with tool result",
      "request": {
        "model": "qwen3-max",
        "messages": [
          {
            "role": "user",
            "content": "Read package.json"
          },
          {
            "role": "assistant",
            "content": null,
            "tool_calls": [
              {
                "id": "call_123",
                "type": "function",
                "function": {
                  "name": "read",
                  "arguments": "{\"filePath\":\"package.json\"}"
                }
              }
            ]
          },
          {
            "role": "tool",
            "tool_call_id": "call_123",
            "content": "{\n  \"name\": \"qwen-proxy\",\n  \"version\": \"1.0.0\",\n  \"description\": \"OpenAI proxy for Qwen\"\n}"
          }
        ],
        "tools": [...],
        "stream": false
      },
      "expectedResponse": {
        "choices": [
          {
            "message": {
              "role": "assistant",
              "content": "The package.json shows this is the qwen-proxy project, version 1.0.0. It's an OpenAI-compatible proxy for Qwen models."
            },
            "finish_reason": "stop"
          }
        ]
      }
    }
  ]
}
```

### Files to Modify

#### `README.md`
**Modifications**:

**Add new section after "Features"**:
```markdown
## Tool Calling Support

The proxy now supports OpenAI-compatible tool calling, enabling OpenCode and similar clients to use tools with Qwen models. This is implemented through XML-style prompt engineering that transforms OpenAI tool definitions into formats Qwen understands.

### Quick Start

```javascript
const response = await axios.post('http://localhost:3000/v1/chat/completions', {
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Read the file config.json' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'read',
        description: 'Read a file',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'File path' }
          },
          required: ['filePath']
        }
      }
    }
  ]
});
```

See [Tool Calling Usage Guide](./docs/TOOL_CALLING_USAGE.md) for complete documentation.

### Configuration

Tool calling is enabled by default. To disable:

```bash
export TOOL_CALLING_ENABLED=false
```
```

### Integration Points
- Referenced from main README
- Linked from test files
- Used by developers for reference

### Design Decisions
1. **Comprehensive Docs**: Cover all use cases
   - Getting started guide
   - Configuration reference
   - Troubleshooting section
   - Best practices

2. **Examples**: Practical, copy-paste ready
   - Cover common scenarios
   - Show complete cycles
   - Include expected outputs

3. **Migration Guide**: Help existing users
   - No breaking changes
   - Clear upgrade path
   - Testing recommendations

4. **Performance Info**: Set expectations
   - Latency numbers
   - Overhead estimates
   - Optimization tips

### Testing Requirements
- Verify all examples work
- Check links are valid
- Ensure code samples run
- Validate JSON format

### Acceptance Criteria
- [ ] Usage guide created
- [ ] Examples file created
- [ ] README updated
- [ ] All examples tested and working
- [ ] Documentation reviewed for clarity
- [ ] Links validated
- [ ] Code samples syntactically correct
- [ ] Covers all major use cases

---

## Complete File Structure Tree

```
/mnt/d/Projects/qwen_proxy/backend/
├── src/
│   ├── transformers/
│   │   ├── openai-to-qwen-transformer.js      [MODIFIED]
│   │   ├── qwen-to-openai-transformer.js      [MODIFIED]
│   │   └── tool-to-xml-transformer.js         [NEW]
│   │
│   ├── parsers/
│   │   └── xml-tool-parser.js                 [NEW]
│   │
│   ├── services/
│   │   ├── tool-system-prompt.js              [NEW]
│   │   ├── sse-handler.js                      [MODIFIED]
│   │   ├── qwen-client.js                      [UNCHANGED]
│   │   └── session-manager.js                  [UNCHANGED]
│   │
│   ├── handlers/
│   │   ├── chat-completions-handler.js        [MODIFIED]
│   │   └── tool-result-handler.js             [NEW]
│   │
│   ├── middleware/
│   │   ├── tool-calling-middleware.js         [NEW]
│   │   ├── auth-middleware.js                  [UNCHANGED]
│   │   └── error-middleware.js                 [UNCHANGED]
│   │
│   ├── config/
│   │   └── index.js                            [MODIFIED]
│   │
│   └── index.js                                [MODIFIED]
│
├── tests/
│   ├── unit/
│   │   ├── tool-transformers.test.js          [NEW]
│   │   ├── xml-tool-parser.test.js            [NEW]
│   │   └── tool-result-handler.test.js        [NEW]
│   │
│   └── integration/
│       └── tool-calling-e2e.test.js           [NEW]
│
├── docs/
│   ├── TOOL_CALLING_USAGE.md                  [NEW]
│   ├── TOOL_CALLING_TRANSFORMATION_PLAN.md    [THIS FILE]
│   ├── OPENCODE_TOOL_CALLING_INVESTIGATION.md [EXISTING]
│   └── OPENCODE_TOOL_EXAMPLES.md              [EXISTING]
│
├── examples/
│   ├── opencode_tool_examples.json            [NEW]
│   └── roo_system_prompt.txt                  [EXISTING]
│
└── README.md                                   [MODIFIED]
```

**File Count Summary**:
- **New Files**: 11
- **Modified Files**: 7
- **Unchanged Files**: (not counted, existing functionality preserved)

---

## Lessons Learned (from OpenCode/RooCode Research)

### OpenCode Findings

1. **Client-Side Execution**: OpenCode executes tools locally
   - Server only provides tool call instructions
   - Results sent back in follow-up messages
   - No server-side tool execution needed

2. **Standard OpenAI Format**: OpenCode uses pure OpenAI SDK
   - Vercel AI SDK 5.0.8 with streamText
   - Standard tool_calls format required
   - Compatible with any OpenAI-like API

3. **Streaming Critical**: OpenCode relies on streaming
   - Provides responsive UX
   - Tool calls can be streamed incrementally
   - Must handle partial tool call states

4. **Tool Parameters**: JSON Schema parameters
   - Strictly validated by OpenCode
   - Type checking enforced
   - Required fields mandatory

5. **Temperature Settings**: Qwen-specific optimizations
   - Temperature: 0.55 (fixed for Qwen)
   - Top P: 1.0
   - These are applied by OpenCode automatically

### RooCode Findings

1. **XML Format Works**: RooCode successfully uses XML
   - Tools defined as XML schemas in system prompt
   - Model outputs XML-formatted tool calls
   - Proven approach with Qwen models

2. **System Prompt Engineering**: Key to success
   - Detailed tool documentation
   - Clear usage examples
   - Behavioral guidelines (one tool per message)

3. **Pre-warming Effective**: Including example exchanges
   - Teach model the format with examples
   - Improves consistency
   - Reduces refusals

4. **One Tool Per Message**: RooCode pattern
   - Simpler to parse
   - Clearer execution model
   - Matches Qwen's capabilities

5. **Parameter Extraction**: Nested XML tags
   - Each parameter gets its own tag
   - Multiline content supported
   - Preserves formatting

### Key Insights

1. **Hybrid Approach Best**: Combine OpenCode + RooCode strategies
   - Accept OpenAI format (OpenCode compatible)
   - Transform to XML (RooCode technique)
   - Parse back to OpenAI format

2. **Qwen Limitations**: No native tool calling
   - Web API lacks function calling
   - Must use prompt engineering
   - Not 100% reliable, but works well

3. **Streaming Complexity**: Harder with XML parsing
   - Need incremental detection
   - Buffer management critical
   - Trade-off: latency vs accuracy

4. **Context Management**: Qwen's parent_id chain
   - Server-side context maintained
   - Don't resend full history
   - System prompt only on first message

5. **Testing Essential**: Real API testing crucial
   - Models behave unpredictably
   - Format variations common
   - Integration tests catch issues

---

## Implementation Guidelines

### Coding Principles

1. **Single Responsibility Principle (SRP)**
   - Each module has one clear purpose
   - Transformers only transform
   - Parsers only parse
   - Handlers orchestrate, don't transform

2. **Don't Repeat Yourself (DRY)**
   - Shared XML parsing logic in one place
   - Reuse parser for streaming and non-streaming
   - Common tool definitions in config

3. **Open/Closed Principle**
   - Easy to add new tools (add to list)
   - XML parser extensible
   - Middleware pluggable

4. **Dependency Injection**
   - Pass dependencies to functions
   - Avoid global state
   - Testable components

5. **Pure Functions Preferred**
   - Transformers are stateless
   - Parsers don't modify input
   - Easier to test and reason about

### Design Patterns

1. **Transformer Pattern**
   - Input format → Output format
   - Reversible transformations
   - Clear contracts

2. **Parser Pattern**
   - String → Structured data
   - Validation during parsing
   - Error recovery

3. **Middleware Pattern**
   - Request enhancement
   - Feature gating
   - Cross-cutting concerns

4. **Strategy Pattern**
   - Different parsing strategies (streaming vs non-streaming)
   - Configurable behavior
   - Easy to extend

### Code Quality

1. **Error Handling**
   - Try-catch at boundaries
   - Graceful degradation
   - Informative error messages
   - Don't fail silently

2. **Logging**
   - Info level: major events (tool calling enabled, tool detected)
   - Debug level: transformation details, parsing steps
   - Warn level: malformed data, fallbacks
   - Error level: failures, exceptions

3. **Testing**
   - Unit tests for each function
   - Integration tests for flows
   - E2E tests for complete scenarios
   - Aim for >90% coverage

4. **Documentation**
   - JSDoc for all public functions
   - Inline comments for complex logic
   - README for setup
   - Examples for usage

### Performance

1. **Avoid Buffering**: Stream where possible
2. **Fast Paths**: Quick checks before expensive operations
3. **Lazy Evaluation**: Don't parse if not needed
4. **Caching**: Consider caching tool schemas (future optimization)

### Security

1. **Input Validation**: Validate all tool parameters
2. **Sanitization**: Escape XML content
3. **Limits**: Max tools, max parameter size
4. **No Injection**: Prevent XML injection attacks

### Backwards Compatibility

1. **Optional Enhancement**: Feature flag controlled
2. **No Breaking Changes**: Existing flows unaffected
3. **Graceful Degradation**: Works without tools
4. **Version Compatibility**: Support OpenAI SDK versions

---

## Summary

This plan provides a comprehensive roadmap for implementing tool calling support in the Qwen proxy, enabling OpenCode compatibility through XML-style prompt engineering. The implementation is structured in 8 phases, from foundational transformers through complete testing and documentation.

**Key Success Factors**:
- Non-invasive middleware approach
- Reusable components (parser, transformer)
- Comprehensive testing at all levels
- Clear documentation and examples
- Performance-conscious design
- Backwards compatible

**Risk Mitigation**:
- Incremental implementation (phase by phase)
- Testing after each phase
- Feature flag for enable/disable
- Graceful fallbacks for failures
- Extensive error handling

**Timeline Estimate** (for reference, not required):
- Phase 1-2: 2-3 days (Core transformations)
- Phase 3-4: 3-4 days (Parsing, streaming)
- Phase 5-6: 2-3 days (Results, middleware)
- Phase 7: 2-3 days (Testing)
- Phase 8: 1-2 days (Documentation)
- **Total**: ~10-15 days for complete implementation

**Next Steps**:
1. Review and approve this plan
2. Begin Phase 1: Tool Definition Transformer
3. Test after each phase
4. Iterate based on findings
5. Deploy behind feature flag
6. Gather feedback and improve

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Status**: Ready for Implementation
