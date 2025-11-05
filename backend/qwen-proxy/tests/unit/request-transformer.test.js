/**
 * Unit tests for Request Transformer
 * Tests OpenAI to Qwen format transformation
 */

const {
  transformToQwenRequest,
  transformToQwenRequestNonStreaming,
  extractLastMessage,
  formatQwenMessage
} = require('../../src/transform/request-transformer');

const fixtures = require('../fixtures/openai-requests');

describe('Request Transformer', () => {
  describe('extractLastMessage', () => {
    test('Extracts last message from array', () => {
      const messages = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second' }
      ];

      const last = extractLastMessage(messages);
      expect(last.content).toBe('Second');
      expect(last.role).toBe('user');
    });

    test('Extracts single message', () => {
      const messages = [{ role: 'user', content: 'Only message' }];

      const last = extractLastMessage(messages);
      expect(last.content).toBe('Only message');
    });

    test('Throws error on empty array', () => {
      expect(() => extractLastMessage([])).toThrow('Messages array is empty');
    });

    test('Throws error on undefined', () => {
      expect(() => extractLastMessage(undefined)).toThrow('Messages array is empty');
    });

    test('Works with fixtures - multiTurn', () => {
      const last = extractLastMessage(fixtures.multiTurn);
      expect(last.content).toBe('What is my color?');
      expect(last.role).toBe('user');
    });

    test('Works with fixtures - withSystem', () => {
      const last = extractLastMessage(fixtures.withSystem);
      expect(last.content).toBe('Hello');
      expect(last.role).toBe('user');
    });
  });

  describe('formatQwenMessage', () => {
    test('Formats Qwen message correctly with null parent', () => {
      const openAIMessage = { role: 'user', content: 'Hello' };
      const qwenMessage = formatQwenMessage(openAIMessage, null);

      expect(qwenMessage.role).toBe('user');
      expect(qwenMessage.content).toBe('Hello');
      expect(qwenMessage.parentId).toBe(null);
      expect(qwenMessage.parent_id).toBe(null);
      expect(qwenMessage.fid).toBeDefined();
      expect(qwenMessage.fid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(qwenMessage.chat_type).toBe('t2t');
      expect(qwenMessage.sub_chat_type).toBe('t2t');
      expect(qwenMessage.user_action).toBe('chat');
      expect(qwenMessage.models).toEqual(['qwen3-max']);
      expect(qwenMessage.childrenIds).toEqual([]);
      expect(qwenMessage.files).toEqual([]);
    });

    test('Formats Qwen message with parent_id', () => {
      const openAIMessage = { role: 'user', content: 'Follow up' };
      const parentId = 'parent-123';
      const qwenMessage = formatQwenMessage(openAIMessage, parentId);

      expect(qwenMessage.parentId).toBe('parent-123');
      expect(qwenMessage.parent_id).toBe('parent-123');
      expect(qwenMessage.content).toBe('Follow up');
    });

    test('Includes all required fields', () => {
      const openAIMessage = { role: 'user', content: 'Test' };
      const qwenMessage = formatQwenMessage(openAIMessage, null);

      // Required fields from DISCOVERIES.md
      expect(qwenMessage).toHaveProperty('fid');
      expect(qwenMessage).toHaveProperty('parentId');
      expect(qwenMessage).toHaveProperty('childrenIds');
      expect(qwenMessage).toHaveProperty('role');
      expect(qwenMessage).toHaveProperty('content');
      expect(qwenMessage).toHaveProperty('user_action');
      expect(qwenMessage).toHaveProperty('files');
      expect(qwenMessage).toHaveProperty('timestamp');
      expect(qwenMessage).toHaveProperty('models');
      expect(qwenMessage).toHaveProperty('chat_type');
      expect(qwenMessage).toHaveProperty('feature_config');
      expect(qwenMessage).toHaveProperty('extra');
      expect(qwenMessage).toHaveProperty('sub_chat_type');
      expect(qwenMessage).toHaveProperty('parent_id');
    });

    test('Includes feature_config structure', () => {
      const openAIMessage = { role: 'user', content: 'Test' };
      const qwenMessage = formatQwenMessage(openAIMessage, null);

      expect(qwenMessage.feature_config).toEqual({
        thinking_enabled: false,
        output_schema: 'phase'
      });
    });

    test('Includes extra.meta structure', () => {
      const openAIMessage = { role: 'user', content: 'Test' };
      const qwenMessage = formatQwenMessage(openAIMessage, null);

      expect(qwenMessage.extra).toEqual({
        meta: {
          subChatType: 't2t'
        }
      });
    });

    test('Timestamp is valid Unix timestamp', () => {
      const openAIMessage = { role: 'user', content: 'Test' };
      const qwenMessage = formatQwenMessage(openAIMessage, null);

      expect(qwenMessage.timestamp).toBeGreaterThan(1700000000); // After 2023
      expect(qwenMessage.timestamp).toBeLessThan(2000000000); // Before 2033
    });

    test('Works with assistant messages', () => {
      const openAIMessage = { role: 'assistant', content: 'Assistant reply' };
      const qwenMessage = formatQwenMessage(openAIMessage, 'parent-abc');

      expect(qwenMessage.role).toBe('assistant');
      expect(qwenMessage.content).toBe('Assistant reply');
      expect(qwenMessage.parentId).toBe('parent-abc');
    });
  });

  describe('transformToQwenRequest', () => {
    test('Builds complete Qwen request for first message', () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const session = { chatId: 'chat-123', parentId: null };

      const request = transformToQwenRequest(messages, session);

      expect(request.chat_id).toBe('chat-123');
      expect(request.parent_id).toBe(null);
      expect(request.messages).toHaveLength(1);
      expect(request.stream).toBe(true);
      expect(request.incremental_output).toBe(true);
      expect(request.chat_mode).toBe('guest');
      expect(request.model).toBe('qwen3-max');
    });

    test('Handles follow-up with parent_id', () => {
      const messages = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Follow up' }
      ];
      const session = { chatId: 'chat-123', parentId: 'parent-456' };

      const request = transformToQwenRequest(messages, session);

      expect(request.parent_id).toBe('parent-456');
      expect(request.messages[0].parentId).toBe('parent-456');
      expect(request.messages[0].parent_id).toBe('parent-456');
      expect(request.messages[0].content).toBe('Follow up');
    });

    test('Extracts only last message from history', () => {
      const messages = fixtures.multiTurn;
      const session = { chatId: 'chat-789', parentId: 'parent-xyz' };

      const request = transformToQwenRequest(messages, session);

      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].content).toBe('What is my color?');
    });

    test('Throws error if messages array is empty', () => {
      const session = { chatId: 'chat-123', parentId: null };

      expect(() => transformToQwenRequest([], session)).toThrow('Messages array is required');
    });

    test('Throws error if session is missing', () => {
      const messages = [{ role: 'user', content: 'Test' }];

      expect(() => transformToQwenRequest(messages, null)).toThrow('Session with chatId is required');
    });

    test('Throws error if chatId is missing', () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const session = { parentId: null };

      expect(() => transformToQwenRequest(messages, session)).toThrow('Session with chatId is required');
    });

    test('Includes timestamp at top level', () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const session = { chatId: 'chat-123', parentId: null };

      const request = transformToQwenRequest(messages, session);

      expect(request.timestamp).toBeDefined();
      expect(request.timestamp).toBeGreaterThan(1700000000);
    });

    test('Works with system message in history', () => {
      const messages = fixtures.withSystem;
      const session = { chatId: 'chat-123', parentId: null };

      const request = transformToQwenRequest(messages, session);

      // Should extract last message (user message), not system
      expect(request.messages[0].content).toBe('Hello');
      expect(request.messages[0].role).toBe('user');
    });

    test('Works with complex conversation', () => {
      const messages = fixtures.complexConversation;
      const session = { chatId: 'chat-456', parentId: 'parent-abc' };

      const request = transformToQwenRequest(messages, session);

      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].content).toBe('Show me an example');
      expect(request.parent_id).toBe('parent-abc');
    });
  });

  describe('transformToQwenRequestNonStreaming', () => {
    test('Sets stream to false', () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const session = { chatId: 'chat-123', parentId: null };

      const request = transformToQwenRequestNonStreaming(messages, session);

      expect(request.stream).toBe(false);
      expect(request.incremental_output).toBe(true);
    });

    test('Otherwise identical to streaming request', () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const session = { chatId: 'chat-123', parentId: 'parent-456' };

      const streamingRequest = transformToQwenRequest(messages, session);
      const nonStreamingRequest = transformToQwenRequestNonStreaming(messages, session);

      // Compare all fields except stream
      expect(nonStreamingRequest.chat_id).toBe(streamingRequest.chat_id);
      expect(nonStreamingRequest.parent_id).toBe(streamingRequest.parent_id);
      expect(nonStreamingRequest.model).toBe(streamingRequest.model);
      expect(nonStreamingRequest.chat_mode).toBe(streamingRequest.chat_mode);
      expect(nonStreamingRequest.incremental_output).toBe(streamingRequest.incremental_output);
      expect(nonStreamingRequest.messages[0].content).toBe(streamingRequest.messages[0].content);
    });
  });
});
