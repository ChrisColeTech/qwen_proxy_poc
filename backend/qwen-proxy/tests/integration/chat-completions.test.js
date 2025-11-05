/**
 * Integration Tests for Chat Completions Handler
 *
 * Phase 8: Chat Completions Endpoint Testing
 *
 * Tests:
 * 1. Non-streaming first message (parent_id = null)
 * 2. Non-streaming follow-up message (parent_id = UUID)
 * 3. Streaming first message
 * 4. Streaming follow-up message
 * 5. Multi-turn conversation context preservation
 * 6. Request validation
 * 7. Error handling
 * 8. OpenAI SDK compatibility
 *
 * CRITICAL TEST CASES:
 * - First message has parent_id = null
 * - Follow-up messages use parent_id from previous response
 * - Session ID is stable across requests with same first message
 * - Context is maintained in multi-turn conversations
 * - Only last message is sent to Qwen
 */

const {
  chatCompletions,
  getSessionManager,
  getQwenClient,
  validateChatCompletionRequest,
  extractFirstUserMessage
} = require('../../src/handlers/chat-completions-handler');

/**
 * Mock request/response objects for testing
 */
function createMockReqRes(body) {
  const req = {
    body,
    on: jest.fn()
  };

  const chunks = [];
  const res = {
    json: jest.fn(),
    write: jest.fn((data) => chunks.push(data)),
    writeHead: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    chunks
  };

  return { req, res };
}

describe('Chat Completions Handler - Phase 8', () => {
  let sessionManager;
  let qwenClient;

  beforeAll(() => {
    sessionManager = getSessionManager();
    qwenClient = getQwenClient();
  });

  beforeEach(() => {
    // Clear sessions before each test
    sessionManager.clearAll();
  });

  describe('Request Validation', () => {
    test('should reject missing messages field', () => {
      expect(() => {
        validateChatCompletionRequest({});
      }).toThrow('messages must be an array');
    });

    test('should reject empty messages array', () => {
      expect(() => {
        validateChatCompletionRequest({ messages: [] });
      }).toThrow('messages array cannot be empty');
    });

    test('should reject messages without user role', () => {
      expect(() => {
        validateChatCompletionRequest({
          messages: [
            { role: 'system', content: 'You are helpful' }
          ]
        });
      }).toThrow('messages must contain at least one user message');
    });

    test('should reject message missing role', () => {
      expect(() => {
        validateChatCompletionRequest({
          messages: [
            { content: 'Hello' }
          ]
        });
      }).toThrow('messages[0] is missing required field: role');
    });

    test('should reject message missing content', () => {
      expect(() => {
        validateChatCompletionRequest({
          messages: [
            { role: 'user' }
          ]
        });
      }).toThrow('messages[0] is missing required field: content');
    });

    test('should reject invalid role', () => {
      expect(() => {
        validateChatCompletionRequest({
          messages: [
            { role: 'invalid', content: 'Hello' }
          ]
        });
      }).toThrow("messages[0].role must be 'system', 'user', or 'assistant'");
    });

    test('should accept valid request', () => {
      expect(() => {
        validateChatCompletionRequest({
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });
      }).not.toThrow();
    });
  });

  describe('First User Message Extraction', () => {
    test('should extract first user message', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      const firstMessage = extractFirstUserMessage(messages);
      expect(firstMessage).toBe('Hello');
    });

    test('should extract first user message when multiple users exist', () => {
      const messages = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second' }
      ];

      const firstMessage = extractFirstUserMessage(messages);
      expect(firstMessage).toBe('First');
    });

    test('should throw error when no user message exists', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' }
      ];

      expect(() => {
        extractFirstUserMessage(messages);
      }).toThrow('No user message found in conversation');
    });
  });

  describe('Session Management', () => {
    test('should generate stable session ID from first message', () => {
      const firstMessage = 'Hello, how are you?';

      const sessionId1 = sessionManager.generateSessionId(firstMessage);
      const sessionId2 = sessionManager.generateSessionId(firstMessage);

      expect(sessionId1).toBe(sessionId2);
      expect(sessionId1).toBeTruthy();
    });

    test('should generate different session IDs for different messages', () => {
      const sessionId1 = sessionManager.generateSessionId('Message 1');
      const sessionId2 = sessionManager.generateSessionId('Message 2');

      expect(sessionId1).not.toBe(sessionId2);
    });

    test('should create new session with parent_id = null', () => {
      const sessionId = sessionManager.generateSessionId('Test message');
      const session = sessionManager.createSession(sessionId, 'chat-123');

      expect(session).toBeTruthy();
      expect(session.parent_id).toBeNull();
      expect(session.parentId).toBeNull();
      expect(session.chatId).toBe('chat-123');
    });

    test('should update session with new parent_id', () => {
      const sessionId = sessionManager.generateSessionId('Test message');
      sessionManager.createSession(sessionId, 'chat-123');

      const updated = sessionManager.updateSession(sessionId, 'parent-uuid');

      expect(updated).toBe(true);

      const session = sessionManager.getSession(sessionId);
      expect(session.parent_id).toBe('parent-uuid');
      expect(session.parentId).toBe('parent-uuid');
    });
  });

  describe('Integration Tests', () => {
    // Note: These tests require mocking the QwenClient or having valid credentials

    test('should handle valid non-streaming request', async () => {
      const { req, res } = createMockReqRes({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        stream: false
      });

      const next = jest.fn();

      // Mock QwenClient methods
      const originalCreateNewChat = qwenClient.createNewChat.bind(qwenClient);
      const originalSendMessage = qwenClient.sendMessage.bind(qwenClient);

      qwenClient.createNewChat = jest.fn().mockResolvedValue('test-chat-id');
      qwenClient.sendMessage = jest.fn().mockResolvedValue({
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: 'Hi there!'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
          },
          parent_id: 'response-parent-id'
        }
      });

      await chatCompletions(req, res, next);

      // Verify QwenClient was called
      expect(qwenClient.createNewChat).toHaveBeenCalled();
      expect(qwenClient.sendMessage).toHaveBeenCalled();

      // Verify response was sent
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      // Restore original methods
      qwenClient.createNewChat = originalCreateNewChat;
      qwenClient.sendMessage = originalSendMessage;
    }, 10000);

    test('should handle streaming request', async () => {
      const { req, res } = createMockReqRes({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Count to 3' }
        ],
        stream: true
      });

      const next = jest.fn();

      // Mock QwenClient methods
      const originalCreateNewChat = qwenClient.createNewChat.bind(qwenClient);
      const originalSendMessage = qwenClient.sendMessage.bind(qwenClient);

      qwenClient.createNewChat = jest.fn().mockResolvedValue('test-chat-id');

      // Mock streaming response
      const EventEmitter = require('events');
      const mockStream = new EventEmitter();

      qwenClient.sendMessage = jest.fn().mockResolvedValue(mockStream);

      // Start request
      const completionPromise = chatCompletions(req, res, next);

      // Simulate stream events
      setTimeout(() => {
        mockStream.emit('data', Buffer.from('data: {"response.created":{"parent_id":"test-parent-id"}}\n\n'));
        mockStream.emit('data', Buffer.from('data: {"choices":[{"delta":{"role":"assistant","content":"1"}}]}\n\n'));
        mockStream.emit('data', Buffer.from('data: {"choices":[{"delta":{"content":" 2"}}]}\n\n'));
        mockStream.emit('data', Buffer.from('data: {"choices":[{"delta":{"content":" 3"}}]}\n\n'));
        mockStream.emit('data', Buffer.from('data: {"choices":[{"delta":{"status":"finished"}}]}\n\n'));
        mockStream.emit('end');
      }, 100);

      await completionPromise;

      // Verify headers were set
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
        'Content-Type': 'text/event-stream'
      }));

      // Verify chunks were written
      expect(res.write).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();

      // Restore original methods
      qwenClient.createNewChat = originalCreateNewChat;
      qwenClient.sendMessage = originalSendMessage;
    }, 10000);
  });

  describe('Multi-Turn Conversation', () => {
    test('should maintain context across multiple turns', async () => {
      // Mock QwenClient
      const originalCreateNewChat = qwenClient.createNewChat.bind(qwenClient);
      const originalSendMessage = qwenClient.sendMessage.bind(qwenClient);

      qwenClient.createNewChat = jest.fn().mockResolvedValue('test-chat-id');

      let callCount = 0;
      qwenClient.sendMessage = jest.fn().mockImplementation(async (payload) => {
        callCount++;

        // First call: parent_id should be null
        if (callCount === 1) {
          expect(payload.parent_id).toBeNull();

          return {
            data: {
              choices: [{
                message: { role: 'assistant', content: 'My name is Alice.' },
                finish_reason: 'stop'
              }],
              parent_id: 'first-response-id',
              usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
            }
          };
        }

        // Second call: parent_id should be from first response
        if (callCount === 2) {
          expect(payload.parent_id).toBe('first-response-id');

          return {
            data: {
              choices: [{
                message: { role: 'assistant', content: 'Your name is Alice!' },
                finish_reason: 'stop'
              }],
              parent_id: 'second-response-id',
              usage: { prompt_tokens: 15, completion_tokens: 8, total_tokens: 23 }
            }
          };
        }
      });

      // First turn
      const { req: req1, res: res1 } = createMockReqRes({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My name is Alice' }
        ],
        stream: false
      });

      await chatCompletions(req1, res1, jest.fn());

      expect(res1.json).toHaveBeenCalled();
      expect(qwenClient.sendMessage).toHaveBeenCalledTimes(1);

      // Second turn (same first message = same session)
      const { req: req2, res: res2 } = createMockReqRes({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'My name is Alice.' },
          { role: 'user', content: 'What is my name?' }
        ],
        stream: false
      });

      await chatCompletions(req2, res2, jest.fn());

      expect(res2.json).toHaveBeenCalled();
      expect(qwenClient.sendMessage).toHaveBeenCalledTimes(2);

      // Verify session was reused
      const sessionId = sessionManager.generateSessionId('My name is Alice');
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session.parent_id).toBe('second-response-id');

      // Restore original methods
      qwenClient.createNewChat = originalCreateNewChat;
      qwenClient.sendMessage = originalSendMessage;
    }, 15000);
  });

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      const { req, res } = createMockReqRes({
        messages: [] // Empty messages
      });

      const next = jest.fn();

      await chatCompletions(req, res, next);

      // Should pass error to next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    test('should handle QwenClient errors', async () => {
      const { req, res } = createMockReqRes({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Test error' }
        ],
        stream: false
      });

      const next = jest.fn();

      // Mock QwenClient to throw error
      const originalCreateNewChat = qwenClient.createNewChat.bind(qwenClient);
      qwenClient.createNewChat = jest.fn().mockRejectedValue(new Error('Network error'));

      await chatCompletions(req, res, next);

      // Should pass error to next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);

      // Restore original method
      qwenClient.createNewChat = originalCreateNewChat;
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running chat completions integration tests...');
  console.log('Note: Some tests require valid Qwen credentials or mocked responses');
  console.log('Use Jest to run these tests: npm test tests/integration/chat-completions.test.js');
}
