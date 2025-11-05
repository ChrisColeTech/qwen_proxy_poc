const crypto = require('crypto');
const { transformToolsToXML, hasValidTools } = require('./tool-to-xml-transformer');
const { transformMessagesWithToolResults, hasToolResults } = require('../handlers/tool-result-handler');

/**
 * OpenAI to Qwen Request Transformer
 *
 * Transforms OpenAI chat completion requests to Qwen message format.
 *
 * CRITICAL REQUIREMENTS:
 * - ALL 18 required Qwen fields must be present
 * - Extract ONLY the last message from OpenAI messages array
 * - Timestamp must be Unix SECONDS (not milliseconds)
 * - parent_id comes from session (null for first message)
 * - Tool definitions injected into system prompt ONLY on first message (parentId === null)
 */

/**
 * Inject tool definitions into system prompt
 * Only called on first message (parentId === null)
 *
 * @param {string} systemContent - Original system message content
 * @param {Array} tools - OpenAI tools array
 * @returns {string} System content with tool definitions appended
 */
function injectToolDefinitions(systemContent, tools) {
  console.log('[ToolInjection] Called with', tools ? tools.length : 0, 'tools');

  if (!tools || !hasValidTools(tools)) {
    console.log('[ToolInjection] No valid tools, returning original content');
    return systemContent;
  }

  console.log('[ToolInjection] Injecting tools:', tools.map(t => t.function?.name));
  const toolXml = transformToolsToXML(tools);
  console.log('[ToolInjection] Generated XML length:', toolXml.length);

  // Base tool usage instructions
  const toolInstructions = `

====

TOOL USE

You have access to tools that help you accomplish tasks. You must use tools by outputting XML-formatted tool calls.

## Tool Use Rules
1. Use exactly one tool per message
2. Format tool calls using XML with the tool name as the tag
3. Include all required parameters within parameter tags
4. Wait for tool results before proceeding

## Tool Call Format
<tool_name>
<parameter1>value1</parameter1>
<parameter2>value2</parameter2>
</tool_name>

## Available Tools

${toolXml}

## Tool Use Guidelines

1. Choose the most appropriate tool based on the task
2. Use one tool at a time per message to accomplish the task iteratively
3. Each tool use should be informed by the result of the previous tool use
4. Format your tool use using the XML format specified for each tool
5. Wait for user confirmation after each tool use before proceeding
`;

  return systemContent + toolInstructions;
}

/**
 * Extract messages to send to Qwen
 * - System message is ONLY included on FIRST request (parentId === null)
 * - Last user/assistant message is always included
 * - Tool definitions are injected into system message on first request
 * Qwen maintains context (including system prompt) server-side via parent_id chain.
 * Sending system message in continuations may cause empty responses.
 *
 * @param {Array} messages - OpenAI format messages
 * @param {string|null} parentId - Parent ID from session (null = first request)
 * @param {Array} tools - Optional OpenAI tools array for transformation
 * @returns {Array} Messages to send ([system, lastMessage] or [lastMessage])
 */
function extractMessagesToSend(messages, parentId = null, tools = null) {
  console.log('[extractMessagesToSend] Called with:', {
    messageCount: messages?.length,
    parentId,
    toolsCount: tools?.length
  });

  if (!messages || messages.length === 0) {
    throw new Error('Messages array is empty');
  }

  const result = [];

  // Include system message ONLY on first request (when parentId is null)
  if (parentId === null) {
    // Collect ALL system messages and combine them
    const systemMessages = messages.filter(m => m.role === 'system');

    if (systemMessages.length > 0) {
      // Combine all system messages with newline separator
      const combinedSystemContent = systemMessages
        .map(m => m.content)
        .join('\n\n');

      // Inject tool definitions if tools are provided
      const enhancedContent = tools
        ? injectToolDefinitions(combinedSystemContent, tools)
        : combinedSystemContent;

      result.push({
        role: 'system',
        content: enhancedContent
      });
    } else if (tools && hasValidTools(tools)) {
      // No system message exists, but tools provided - create one
      result.push({
        role: 'system',
        content: injectToolDefinitions('You are a helpful AI assistant.', tools)
      });
    }
  }

  // Include last message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'system') {
    result.push(lastMessage);
  }

  return result;
}

/**
 * Normalize message content to string format for Qwen
 * OpenAI supports multimodal array format, but Qwen expects strings
 *
 * @param {string|Array} content - Message content (string or multimodal array)
 * @returns {string} Normalized content string
 */
function normalizeContent(content) {
  // If already a string, return as-is
  if (typeof content === 'string') {
    return content;
  }

  // If array (multimodal format), extract and concatenate text
  if (Array.isArray(content)) {
    return content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
  }

  // Fallback: convert to string
  return String(content);
}

/**
 * Create a Qwen message object with ALL 18 required fields
 *
 * Based on: /docs/payloads/completion/request.sh
 *
 * Required fields:
 * 1. fid - UUID v4 for this message
 * 2. parentId - UUID from session or null
 * 3. parent_id - Duplicate of parentId (required by Qwen)
 * 4. childrenIds - Empty array
 * 5. role - "user" or "assistant"
 * 6. content - Message text
 * 7. user_action - Always "chat"
 * 8. files - Empty array (no file support yet)
 * 9. timestamp - Unix seconds (NOT milliseconds)
 * 10. models - Array with model name
 * 11. chat_type - "t2t" for text-to-text
 * 12. sub_chat_type - Duplicate of chat_type
 * 13. feature_config - Object with thinking_enabled and output_schema
 * 14. feature_config.thinking_enabled - Boolean, false
 * 15. feature_config.output_schema - String, "phase"
 * 16. extra - Object with meta
 * 17. extra.meta - Object with subChatType
 * 18. extra.meta.subChatType - String, matches chat_type
 *
 * @param {Object} message - OpenAI message object
 * @param {string|null} parentId - Parent message ID from session
 * @param {string} model - Model name (default: qwen3-max)
 * @returns {Object} Complete Qwen message with all 18 fields
 */
function createQwenMessage(message, parentId = null, model = 'qwen3-max') {
  const messageId = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000); // CRITICAL: Unix SECONDS not milliseconds

  return {
    // Field 1: Message UUID
    fid: messageId,

    // Field 2: Parent ID (camelCase)
    parentId: parentId,

    // Field 3: Parent ID (snake_case) - duplicate required by Qwen
    parent_id: parentId,

    // Field 4: Children IDs (empty for new messages)
    childrenIds: [],

    // Field 5: Role
    role: message.role,

    // Field 6: Content - CRITICAL: Normalize multimodal arrays to strings
    content: normalizeContent(message.content),

    // Field 7: User action
    user_action: 'chat',

    // Field 8: Files (empty for now)
    files: [],

    // Field 9: Timestamp in Unix SECONDS
    timestamp: timestamp,

    // Field 10: Models array
    models: [model],

    // Field 11: Chat type
    chat_type: 't2t',

    // Field 12: Sub chat type (duplicate)
    sub_chat_type: 't2t',

    // Fields 13-15: Feature config
    feature_config: {
      thinking_enabled: false,
      output_schema: 'phase'
    },

    // Fields 16-18: Extra metadata
    extra: {
      meta: {
        subChatType: 't2t'
      }
    }
  };
}

/**
 * Transform OpenAI chat completion request to Qwen format
 *
 * @param {Object} openAIRequest - OpenAI format request
 * @param {Object} session - Session object with chatId and parentId
 * @param {boolean} stream - Whether to stream response (default: true)
 * @returns {Object} Complete Qwen API request payload
 */
function transformToQwenRequest(openAIRequest, session, stream = true) {
  const { messages, model = 'qwen3-max', tools } = openAIRequest;
  const { chatId, parentId } = session;

  // Transform tool result messages (role: "tool" → role: "user")
  // This handles OpenCode's tool execution results
  const processedMessages = hasToolResults(messages)
    ? transformMessagesWithToolResults(messages)
    : messages;

  // Extract messages to send (system only on first request, always last message)
  // Tool definitions are injected into system message on first request (parentId === null)
  const messagesToSend = extractMessagesToSend(processedMessages, parentId, tools);

  // Create Qwen messages with all 18 required fields
  // CRITICAL: System messages always have parent_id: null
  // Only user/assistant messages get parent_id from session
  const qwenMessages = messagesToSend.map(msg => {
    const msgParentId = (msg.role === 'system') ? null : parentId;
    return createQwenMessage(msg, msgParentId, model);
  });

  // Build complete request payload
  return {
    stream: stream,
    incremental_output: true, // Required for streaming
    chat_id: chatId,
    chat_mode: 'guest',
    model: model,
    parent_id: parentId, // null for first message, UUID for follow-ups
    messages: qwenMessages, // Array with system + last message
    timestamp: Math.floor(Date.now() / 1000) // Request timestamp in seconds
  };
}

/**
 * Transform OpenAI request to Qwen format (non-streaming)
 *
 * @param {Object} openAIRequest - OpenAI format request
 * @param {Object} session - Session object with chatId and parentId
 * @returns {Object} Complete Qwen API request payload with stream: false
 */
function transformToQwenRequestNonStreaming(openAIRequest, session) {
  return transformToQwenRequest(openAIRequest, session, false);
}

/**
 * Validate that a Qwen message has all required fields
 * Useful for testing and debugging
 *
 * @param {Object} message - Qwen message to validate
 * @returns {Object} { valid: boolean, missingFields: Array }
 */
function validateQwenMessage(message) {
  const requiredFields = [
    'fid',
    'parentId',
    'parent_id',
    'childrenIds',
    'role',
    'content',
    'user_action',
    'files',
    'timestamp',
    'models',
    'chat_type',
    'sub_chat_type',
    'feature_config',
    'extra'
  ];

  const missingFields = [];

  for (const field of requiredFields) {
    if (!(field in message)) {
      missingFields.push(field);
    }
  }

  // Validate nested fields
  if (message.feature_config) {
    if (!('thinking_enabled' in message.feature_config)) {
      missingFields.push('feature_config.thinking_enabled');
    }
    if (!('output_schema' in message.feature_config)) {
      missingFields.push('feature_config.output_schema');
    }
  } else {
    missingFields.push('feature_config.thinking_enabled');
    missingFields.push('feature_config.output_schema');
  }

  if (message.extra && message.extra.meta) {
    if (!('subChatType' in message.extra.meta)) {
      missingFields.push('extra.meta.subChatType');
    }
  } else {
    missingFields.push('extra.meta.subChatType');
  }

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields
  };
}

module.exports = {
  extractMessagesToSend,
  createQwenMessage,
  transformToQwenRequest,
  transformToQwenRequestNonStreaming,
  validateQwenMessage,
  injectToolDefinitions
};
