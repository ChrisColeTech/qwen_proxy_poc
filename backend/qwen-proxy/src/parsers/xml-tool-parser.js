/**
 * XML Tool Parser
 *
 * Converts XML-formatted tool calls from Qwen responses back to OpenAI's tool_calls format.
 * This is Phase 3 of the tool calling transformation system.
 *
 * Transformation Flow:
 * Qwen XML Response → Parse XML → OpenAI tool_calls Format
 *
 * Example Input:
 * "I'll read the file.\n\n<read>\n<filePath>/path/to/file</filePath>\n</read>"
 *
 * Example Output:
 * {
 *   hasToolCall: true,
 *   toolCall: {
 *     id: "call_1",
 *     type: "function",
 *     function: {
 *       name: "read",
 *       arguments: "{\"filePath\":\"/path/to/file\"}"
 *     }
 *   },
 *   textBeforeToolCall: "I'll read the file."
 * }
 */

const crypto = require('crypto');

/**
 * Detect if text contains XML tool call
 * Looks for XML-like tags that could represent tool calls
 *
 * @param {string} text - Response text from Qwen
 * @returns {boolean} True if contains potential tool call
 */
function hasToolCall(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Fast path: check for basic XML tag pattern
  // Looking for: <tagname>...</tagname> where tagname is alphanumeric
  const toolCallPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)\s*>[\s\S]*?<\/\1\s*>/;
  return toolCallPattern.test(text);
}

/**
 * Detect if text has PARTIAL tool call (opening tag detected)
 * This is used during streaming to detect tool calls early
 * before we have the complete XML with closing tag
 *
 * @param {string} text - Response text from Qwen
 * @returns {boolean} True if contains opening XML tag that looks like a tool call
 */
function hasPartialToolCall(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for opening XML tag: <toolname>
  // This detects tool calls BEFORE we receive the closing tag
  const openingTagPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)\s*>/;
  return openingTagPattern.test(text);
}

/**
 * Extract tool name from XML
 * Finds the first XML tag that looks like a tool call
 *
 * @param {string} xml - XML tool call string or full text
 * @returns {string|null} Tool name or null if not found
 */
function extractToolName(xml) {
  if (!xml || typeof xml !== 'string') {
    return null;
  }

  // Match opening tag: <tool_name> or <tool_name>
  const tagMatch = xml.match(/<([a-zA-Z_][a-zA-Z0-9_]*)\s*>/);
  if (tagMatch) {
    return tagMatch[1];
  }

  return null;
}

/**
 * Extract parameters from XML tool call
 * Parses nested XML tags into key-value pairs with proper type conversion
 *
 * @param {string} xml - XML tool call string
 * @param {string} toolName - Name of the tool (for validation)
 * @returns {Object} Parameters as key-value pairs
 */
function extractParameters(xml, toolName) {
  const parameters = {};

  if (!xml || !toolName) {
    return parameters;
  }

  // Extract content between opening and closing tool tags
  const toolTagPattern = new RegExp(
    `<${toolName}\\s*>([\\s\\S]*?)<\\/${toolName}\\s*>`,
    'i'
  );
  const toolMatch = xml.match(toolTagPattern);

  if (!toolMatch) {
    return parameters;
  }

  const toolContent = toolMatch[1];

  // Extract all parameter tags
  // Match: <param_name>value</param_name>
  // This regex handles nested content and multiline values
  const paramPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)\s*>([\s\S]*?)<\/\1\s*>/g;
  let match;

  while ((match = paramPattern.exec(toolContent)) !== null) {
    const paramName = match[1];
    let paramValue = match[2];

    // Clean up the value
    // Remove leading/trailing newlines but preserve internal formatting
    paramValue = paramValue.replace(/^\n+/, '').replace(/\n+$/, '');

    // Type conversion
    parameters[paramName] = convertParameterType(paramValue);
  }

  return parameters;
}

/**
 * Convert parameter value to appropriate type
 * Handles string, number, boolean conversions
 *
 * @param {string} value - Raw string value from XML
 * @returns {string|number|boolean} Converted value
 */
function convertParameterType(value) {
  if (value === null || value === undefined) {
    return value;
  }

  // Try boolean conversion first
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  // Try number conversion
  // Only convert if it's clearly a number (not mixed with text)
  const trimmedValue = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    const numValue = Number(trimmedValue);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }

  // Default to string
  return value;
}

/**
 * Generate unique tool call ID
 * Creates IDs in format: call_XXXXXXXX
 *
 * @returns {string} Unique call ID
 */
function generateCallId() {
  // Use crypto for better randomness
  const randomBytes = crypto.randomBytes(4);
  const hexString = randomBytes.toString('hex');
  return `call_${hexString}`;
}

/**
 * Parse XML tool call to OpenAI tool_calls format
 * Main parsing function that coordinates extraction and transformation
 *
 * @param {string} text - Full response text with potential tool call
 * @param {string|null} callId - Optional ID for tool call (default: auto-generate)
 * @returns {Object|null} OpenAI tool_call object or null if no valid tool call found
 */
function parseToolCall(text, callId = null) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  try {
    // Extract tool name
    const toolName = extractToolName(text);
    if (!toolName) {
      return null;
    }

    // Extract parameters
    const parameters = extractParameters(text, toolName);

    // Generate call ID if not provided
    const id = callId || generateCallId();

    // Transform to OpenAI format
    return {
      id: id,
      type: 'function',
      function: {
        name: toolName,
        arguments: JSON.stringify(parameters)
      }
    };
  } catch (error) {
    // Log warning but don't throw - graceful degradation
    console.warn('[XMLToolParser] Failed to parse tool call:', error.message);
    return null;
  }
}

/**
 * Parse complete Qwen response and transform to OpenAI format
 * Extracts both tool calls and text content
 *
 * @param {string} text - Qwen response text
 * @returns {Object} Parsed response with tool call info
 *   - hasToolCall: boolean - Whether tool call was found
 *   - toolCall: Object|null - Parsed tool call in OpenAI format
 *   - textBeforeToolCall: string - Text content before tool call
 *   - toolCalls: Array - Array of tool calls (for consistency with OpenAI API)
 */
function parseResponse(text) {
  const result = {
    hasToolCall: false,
    toolCall: null,
    textBeforeToolCall: '',
    toolCalls: []
  };

  if (!text || typeof text !== 'string') {
    return result;
  }

  // Check if there's a tool call
  if (!hasToolCall(text)) {
    result.textBeforeToolCall = text;
    return result;
  }

  try {
    // Find the position of the first tool call
    const toolName = extractToolName(text);
    if (!toolName) {
      result.textBeforeToolCall = text;
      return result;
    }

    // Find the opening tag position
    const openTagPattern = new RegExp(`<${toolName}\\s*>`);
    const openTagMatch = text.match(openTagPattern);
    if (!openTagMatch) {
      result.textBeforeToolCall = text;
      return result;
    }

    const toolCallStartIndex = openTagMatch.index;

    // Extract text before tool call
    const textBefore = text.substring(0, toolCallStartIndex).trim();

    // Parse the tool call
    // Only parse the FIRST tool call (RooCode rule: one tool per message)
    const toolCallText = text.substring(toolCallStartIndex);
    const toolCall = parseToolCall(toolCallText);

    if (toolCall) {
      result.hasToolCall = true;
      result.toolCall = toolCall;
      result.toolCalls = [toolCall]; // Array format for OpenAI API compatibility
      result.textBeforeToolCall = textBefore;
    } else {
      // Failed to parse, treat as normal text
      result.textBeforeToolCall = text;
    }
  } catch (error) {
    // Log warning and return text content
    console.warn('[XMLToolParser] Error parsing response:', error.message);
    result.textBeforeToolCall = text;
  }

  return result;
}

/**
 * Extract complete tool call XML from text
 * Finds the full XML block including opening and closing tags
 *
 * @param {string} text - Text containing tool call
 * @param {string} toolName - Tool name to extract
 * @returns {string|null} Complete XML string or null
 */
function extractToolCallXML(text, toolName) {
  if (!text || !toolName) {
    return null;
  }

  const pattern = new RegExp(
    `<${toolName}\\s*>([\\s\\S]*?)<\\/${toolName}\\s*>`,
    'i'
  );
  const match = text.match(pattern);

  return match ? match[0] : null;
}

/**
 * Validate parsed tool call structure
 * Checks for required fields and proper format
 *
 * @param {Object} toolCall - Tool call object to validate
 * @returns {boolean} True if valid
 */
function isValidToolCall(toolCall) {
  if (!toolCall || typeof toolCall !== 'object') {
    return false;
  }

  // Check required fields
  if (!toolCall.id || typeof toolCall.id !== 'string') {
    return false;
  }

  if (toolCall.type !== 'function') {
    return false;
  }

  if (!toolCall.function || typeof toolCall.function !== 'object') {
    return false;
  }

  if (!toolCall.function.name || typeof toolCall.function.name !== 'string') {
    return false;
  }

  if (!toolCall.function.arguments || typeof toolCall.function.arguments !== 'string') {
    return false;
  }

  // Try to parse arguments to ensure it's valid JSON
  try {
    JSON.parse(toolCall.function.arguments);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Parse multiple tool calls from text
 * Note: RooCode rule is one tool per message, but this handles edge cases
 *
 * @param {string} text - Text that may contain multiple tool calls
 * @returns {Array} Array of parsed tool calls
 */
function parseMultipleToolCalls(text) {
  const toolCalls = [];

  if (!text || typeof text !== 'string') {
    return toolCalls;
  }

  // Find all potential tool call tags
  const tagPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)\s*>[\s\S]*?<\/\1\s*>/g;
  let match;
  let lastIndex = 0;

  while ((match = tagPattern.exec(text)) !== null) {
    const toolName = match[1];
    const startIndex = match.index;

    // Only process if this is after the last processed tool
    if (startIndex >= lastIndex) {
      const toolCallText = text.substring(startIndex);
      const toolCall = parseToolCall(toolCallText);

      if (toolCall && isValidToolCall(toolCall)) {
        toolCalls.push(toolCall);
        lastIndex = startIndex + match[0].length;
      }
    }
  }

  return toolCalls;
}

module.exports = {
  hasToolCall,
  hasPartialToolCall,
  extractToolName,
  extractParameters,
  convertParameterType,
  parseToolCall,
  parseResponse,
  extractToolCallXML,
  isValidToolCall,
  parseMultipleToolCalls,
  generateCallId
};
