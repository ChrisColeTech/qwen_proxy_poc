/**
 * Tool Result Handler
 *
 * Transforms tool execution results from OpenCode (role: "tool") into
 * Qwen-compatible user messages. This enables continuation of tool-calling
 * conversations by formatting tool results in a way Qwen understands.
 *
 * Flow:
 * 1. OpenCode sends assistant message with tool_calls
 * 2. OpenCode executes tools locally
 * 3. OpenCode sends role: "tool" messages with results
 * 4. This handler transforms tool messages to role: "user" with formatted content
 * 5. Qwen processes as natural continuation
 */

const { parseResponse } = require('../parsers/xml-tool-parser');

/**
 * Check if a message is a tool result
 * @param {Object} message - OpenAI message object
 * @returns {boolean} True if role === "tool"
 */
function isToolResult(message) {
  if (!message) {
    return false;
  }
  return message.role === 'tool';
}

/**
 * Extract tool name from assistant message using tool_call_id
 * @param {Object} assistantMessage - Previous assistant message with tool_calls
 * @param {string} toolCallId - ID to match (e.g., "call_1")
 * @returns {string|null} Tool name or null if not found
 */
function extractToolNameFromAssistant(assistantMessage, toolCallId) {
  if (!assistantMessage || !assistantMessage.tool_calls) {
    return null;
  }

  const toolCall = assistantMessage.tool_calls.find(
    tc => tc.id === toolCallId
  );

  return toolCall?.function?.name || null;
}

/**
 * Transform a single tool result message to user message for Qwen
 *
 * Format: "Tool Result from {toolName}:\n{content}"
 * Example: "Tool Result from read:\n{\"dependencies\":{...}}"
 *
 * IMPORTANT: For empty results (especially bash commands), we add an explicit
 * success message to prevent Qwen from thinking the command failed and retrying.
 *
 * @param {Object} toolMessage - OpenAI tool message
 * @param {string|null} toolName - Name of the tool (from previous tool_call)
 * @returns {Object} Transformed message with role: "user"
 */
function transformToolResult(toolMessage, toolName = null) {
  let content = toolMessage.content || '';

  // For empty results, add explicit success message
  // This is critical for bash commands that succeed silently (mkdir, touch, etc.)
  if (content === '' || content.trim() === '') {
    content = '(Command completed successfully with no output)';
  }

  // Format with tool name if available, otherwise generic format
  const formattedContent = toolName
    ? `Tool Result from ${toolName}:\n${content}`
    : `Tool Result:\n${content}`;

  return {
    role: 'user',
    content: formattedContent
  };
}

/**
 * Strip tool_calls field from assistant messages
 * Qwen doesn't understand tool_calls, so we remove it while preserving content
 *
 * IMPORTANT FIX: OpenCode sometimes sends continuation requests with malformed
 * tool_calls that have empty arguments {}. This function detects this case and
 * tries to regenerate tool_calls from the XML content before stripping.
 *
 * @param {Object} message - Assistant message potentially with tool_calls
 * @returns {Object} Message without tool_calls field
 */
function stripToolCalls(message) {
  if (message.role !== 'assistant') {
    return message;
  }

  // Check if tool_calls exist with empty/invalid arguments
  if (message.tool_calls && message.tool_calls.length > 0) {
    const hasEmptyArgs = message.tool_calls.some(tc => {
      try {
        const args = JSON.parse(tc.function.arguments);
        return Object.keys(args).length === 0;
      } catch (e) {
        return true; // Invalid JSON = treat as empty
      }
    });

    if (hasEmptyArgs && message.content) {
      console.log('[ToolResultHandler] Detected empty tool arguments');
      console.log('[ToolResultHandler] Content:', message.content.substring(0, 200));

      // Try to parse XML from content to regenerate tool_calls
      const { hasToolCall, toolCall } = parseResponse(message.content);

      if (hasToolCall && toolCall) {
        console.log('[ToolResultHandler] Successfully regenerated tool_call from XML');
        console.log('[ToolResultHandler] Regenerated:', JSON.stringify(toolCall));

        // Update message with regenerated tool_calls
        message = {
          ...message,
          tool_calls: [toolCall]
        };
      } else {
        console.warn('[ToolResultHandler] Could not parse XML from content, keeping malformed tool_calls');
      }
    }
  }

  // Create a copy without tool_calls
  const { tool_calls, ...cleanMessage } = message;
  return cleanMessage;
}

/**
 * Transform messages array handling tool results
 *
 * Processes OpenAI conversation with tool results:
 * 1. Converts role: "tool" → role: "user" with formatted content
 * 2. Extracts tool names from previous assistant messages
 * 3. Strips tool_calls from assistant messages (Qwen doesn't understand them)
 * 4. Preserves message order and content
 *
 * Example transformation:
 * INPUT:
 * [
 *   {role: "user", content: "Read package.json"},
 *   {role: "assistant", content: "I'll read it", tool_calls: [...]},
 *   {role: "tool", tool_call_id: "call_1", content: "{...}"}
 * ]
 *
 * OUTPUT:
 * [
 *   {role: "user", content: "Read package.json"},
 *   {role: "assistant", content: "I'll read it"},
 *   {role: "user", content: "Tool Result from read:\n{...}"}
 * ]
 *
 * @param {Array} messages - OpenAI messages array
 * @returns {Array} Transformed messages
 */
function transformMessagesWithToolResults(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const transformed = [];
  let lastAssistantMessage = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (isToolResult(message)) {
      // Transform tool result to user message
      const toolName = extractToolNameFromAssistant(
        lastAssistantMessage,
        message.tool_call_id
      );
      const transformedMessage = transformToolResult(message, toolName);
      transformed.push(transformedMessage);
    } else {
      // Regular message - strip tool_calls if assistant
      const cleanMessage = stripToolCalls(message);
      transformed.push(cleanMessage);

      // Track last assistant message for tool name extraction
      if (message.role === 'assistant') {
        lastAssistantMessage = message;
      }
    }
  }

  return transformed;
}

/**
 * Check if messages array contains any tool results
 * Useful for conditional transformation logic
 *
 * @param {Array} messages - OpenAI messages array
 * @returns {boolean} True if any message has role: "tool"
 */
function hasToolResults(messages) {
  if (!Array.isArray(messages)) {
    return false;
  }
  return messages.some(msg => isToolResult(msg));
}

/**
 * Check if messages array contains any tool calls
 * Useful for detecting if we need to strip tool_calls
 *
 * @param {Array} messages - OpenAI messages array
 * @returns {boolean} True if any assistant message has tool_calls
 */
function hasToolCalls(messages) {
  if (!Array.isArray(messages)) {
    return false;
  }
  return messages.some(msg =>
    msg.role === 'assistant' &&
    msg.tool_calls &&
    Array.isArray(msg.tool_calls) &&
    msg.tool_calls.length > 0
  );
}

module.exports = {
  isToolResult,
  extractToolNameFromAssistant,
  transformToolResult,
  stripToolCalls,
  transformMessagesWithToolResults,
  hasToolResults,
  hasToolCalls
};
