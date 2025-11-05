/**
 * Test fixtures for Qwen response formats
 */

module.exports = {
  // Response from first message in chat
  firstMessageResponse: {
    parent_id: 'parent-abc123',
    message_id: 'msg-def456',
    choices: [{
      delta: { content: 'Hello!' }
    }]
  },

  // Response from follow-up message
  followUpResponse: {
    parent_id: 'parent-ghi789',
    message_id: 'msg-jkl012',
    choices: [{
      delta: { content: 'Your color is blue!' }
    }]
  },

  // Response with usage data
  usageData: {
    usage: {
      input_tokens: 15,
      output_tokens: 8
    }
  },

  // Complete streaming chunk
  streamingChunk: {
    parent_id: 'parent-xyz789',
    message_id: 'msg-abc123',
    choices: [{
      delta: {
        content: 'Hello',
        role: 'assistant'
      },
      index: 0,
      finish_reason: null
    }],
    usage: null
  },

  // Final streaming chunk with usage
  finalStreamingChunk: {
    parent_id: 'parent-xyz789',
    message_id: 'msg-abc123',
    choices: [{
      delta: {},
      index: 0,
      finish_reason: 'stop'
    }],
    usage: {
      input_tokens: 20,
      output_tokens: 15
    }
  },

  // Non-streaming complete response
  nonStreamingResponse: {
    success: true,
    request_id: 'req-123',
    data: {
      chat_id: 'chat-uuid',
      parent_id: 'parent-uuid',
      message_id: 'msg-uuid',
      messages: null,
      choices: [{
        message: {
          role: 'assistant',
          content: 'This is a complete response.'
        }
      }]
    }
  },

  // Chunk with empty content (role only)
  roleOnlyChunk: {
    parent_id: 'parent-abc',
    message_id: 'msg-def',
    choices: [{
      delta: {
        role: 'assistant'
      },
      index: 0,
      finish_reason: null
    }]
  },

  // Chunk with no content (skip this)
  emptyChunk: {
    parent_id: 'parent-abc',
    message_id: 'msg-def',
    choices: [{
      delta: {},
      index: 0,
      finish_reason: null
    }]
  }
};
