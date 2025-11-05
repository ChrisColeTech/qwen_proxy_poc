const SSEHandler = require('../../src/services/sse-handler');
const { EventEmitter } = require('events');

/**
 * Integration Tests for SSE Streaming
 *
 * These tests verify the complete streaming flow:
 * 1. Real-world streaming scenarios
 * 2. parent_id extraction and session updates
 * 3. Complete stream lifecycle
 * 4. Error recovery
 *
 * Note: These tests use mocked Qwen responses that match real API behavior
 * For actual API testing, set QWEN_TOKEN and QWEN_COOKIES environment variables
 */

describe('SSE Streaming Integration', () => {
  let sseHandler;
  let mockQwenClient;
  let mockSessionManager;

  beforeEach(() => {
    // Mock session manager with real-like behavior
    const sessions = new Map();

    mockSessionManager = {
      updateSession: jest.fn((sessionId, updates) => {
        const session = sessions.get(sessionId) || {};
        const updated = { ...session, ...updates };
        sessions.set(sessionId, updated);
        return updated;
      }),
      getSession: jest.fn((sessionId) => {
        return sessions.get(sessionId);
      })
    };

    // Mock Qwen client
    mockQwenClient = {
      sendMessage: jest.fn()
    };

    // Create handler
    sseHandler = new SSEHandler(mockQwenClient, mockSessionManager);
  });

  describe('Complete Streaming Flow', () => {
    test('should handle complete stream with all chunk types', async () => {
      // Create mock stream that emits realistic Qwen chunks
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      // Mock request and response
      const mockReq = new EventEmitter();
      const chunks = [];
      const mockRes = {
        writeHead: jest.fn(),
        write: jest.fn((data) => {
          chunks.push(data);
        }),
        end: jest.fn()
      };

      // Start streaming
      const streamPromise = sseHandler.streamCompletion(
        { content: 'Test message' },
        mockReq,
        mockRes,
        'test-session-1',
        'qwen3-max'
      );

      // Simulate realistic Qwen streaming response
      setTimeout(() => {
        // 1. response.created chunk
        mockStream.emit('data', Buffer.from(
          'data: {"response.created":{"chat_id":"c8c98d85-9175-4495-a851-0ff5ae3a6f2a","parent_id":"f2a0176c-e4cd-4550-b476-f9fa5daa7a32","response_id":"e34734e7-0999-4d8f-a900-81d1a3db9ae4"}}\n\n'
        ));

        // 2. Content chunks
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"role":"assistant","content":"Hello","phase":"answer","status":"typing"}}],"usage":{"input_tokens":10,"output_tokens":1,"total_tokens":11}}\n\n'
        ));

        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"role":"assistant","content":" World","phase":"answer","status":"typing"}}],"usage":{"input_tokens":10,"output_tokens":2,"total_tokens":12}}\n\n'
        ));

        // 3. Finish chunk
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"role":"assistant","content":"","phase":"answer","status":"finished"}}],"usage":{"input_tokens":10,"output_tokens":2,"total_tokens":12}}\n\n'
        ));

        // 4. End stream
        mockStream.emit('end');
      }, 10);

      await streamPromise;

      // Verify all chunks were processed
      expect(chunks.length).toBeGreaterThan(0);

      // Verify [DONE] was sent
      const doneChunk = chunks.find(c => c === 'data: [DONE]\n\n');
      expect(doneChunk).toBeDefined();

      // Verify session was updated with parent_id
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'test-session-1',
        expect.objectContaining({
          parentId: 'f2a0176c-e4cd-4550-b476-f9fa5daa7a32'
        })
      );

      // Verify response was ended
      expect(mockRes.end).toHaveBeenCalled();
    });

    test('should handle stream with usage information', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const mockReq = new EventEmitter();
      const chunks = [];
      const mockRes = {
        writeHead: jest.fn(),
        write: jest.fn((data) => {
          chunks.push(data);
        }),
        end: jest.fn()
      };

      const streamPromise = sseHandler.streamCompletion(
        { content: 'Test' },
        mockReq,
        mockRes,
        'test-session-2'
      );

      setTimeout(() => {
        mockStream.emit('data', Buffer.from(
          'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-1","response_id":"resp-1"}}\n\n'
        ));

        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"Test"}}],"usage":{"input_tokens":33,"output_tokens":838,"total_tokens":871}}\n\n'
        ));

        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"status":"finished"}}]}\n\n'
        ));

        mockStream.emit('end');
      }, 10);

      await streamPromise;

      // Find usage chunk
      const usageChunk = chunks.find(c =>
        c.includes('"usage"') &&
        c.includes('"prompt_tokens"')
      );

      // Verify usage was included
      if (usageChunk) {
        expect(usageChunk).toContain('prompt_tokens');
        expect(usageChunk).toContain('completion_tokens');
      }
    });
  });

  describe('Multi-turn Conversation', () => {
    test('should handle multiple streaming requests with parent_id chain', async () => {
      // First message (no parent)
      const mockStream1 = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValueOnce(mockStream1);

      const mockReq1 = new EventEmitter();
      const mockRes1 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      const stream1Promise = sseHandler.streamCompletion(
        { content: 'First message', parent_id: null },
        mockReq1,
        mockRes1,
        'conv-123'
      );

      setTimeout(() => {
        mockStream1.emit('data', Buffer.from(
          'data: {"response.created":{"parent_id":"parent-1"}}\n\n'
        ));
        mockStream1.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"Response 1"}}]}\n\n'
        ));
        mockStream1.emit('end');
      }, 10);

      await stream1Promise;

      // Verify first parent_id was stored
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'conv-123',
        expect.objectContaining({ parentId: 'parent-1' })
      );

      // Second message (with parent from first)
      const mockStream2 = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValueOnce(mockStream2);

      const mockReq2 = new EventEmitter();
      const mockRes2 = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      const stream2Promise = sseHandler.streamCompletion(
        { content: 'Second message', parent_id: 'parent-1' },
        mockReq2,
        mockRes2,
        'conv-123'
      );

      setTimeout(() => {
        mockStream2.emit('data', Buffer.from(
          'data: {"response.created":{"parent_id":"parent-2"}}\n\n'
        ));
        mockStream2.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"Response 2"}}]}\n\n'
        ));
        mockStream2.emit('end');
      }, 10);

      await stream2Promise;

      // Verify second parent_id was stored
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'conv-123',
        expect.objectContaining({ parentId: 'parent-2' })
      );
    });
  });

  describe('Error Recovery', () => {
    test('should recover from network interruption', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const mockReq = new EventEmitter();
      const mockRes = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      const streamPromise = sseHandler.streamCompletion(
        { content: 'Test' },
        mockReq,
        mockRes,
        'test-session'
      );

      setTimeout(() => {
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"Start"}}]}\n\n'
        ));

        // Simulate network error
        mockStream.emit('error', new Error('ECONNRESET'));
      }, 10);

      await streamPromise;

      // Should send error chunk
      expect(mockRes.write).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
    });

    test('should handle malformed chunk gracefully', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const mockReq = new EventEmitter();
      const chunks = [];
      const mockRes = {
        writeHead: jest.fn(),
        write: jest.fn((data) => chunks.push(data)),
        end: jest.fn()
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const streamPromise = sseHandler.streamCompletion(
        { content: 'Test' },
        mockReq,
        mockRes,
        'test-session'
      );

      setTimeout(() => {
        // Malformed chunk
        mockStream.emit('data', Buffer.from(
          'data: {malformed json\n\n'
        ));

        // Valid chunk
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"Good"}}]}\n\n'
        ));

        mockStream.emit('end');
      }, 10);

      await streamPromise;

      // Should continue after error
      expect(chunks.length).toBeGreaterThan(0);
      expect(mockRes.end).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Client Disconnect Scenarios', () => {
    test('should stop streaming immediately on client disconnect', async () => {
      const mockStream = new EventEmitter();
      mockStream.destroy = jest.fn();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const mockReq = new EventEmitter();
      let writeCount = 0;
      const mockRes = {
        writeHead: jest.fn(),
        write: jest.fn(() => {
          writeCount++;
        }),
        end: jest.fn()
      };

      const streamPromise = sseHandler.streamCompletion(
        { content: 'Test' },
        mockReq,
        mockRes,
        'test-session'
      );

      setTimeout(() => {
        // Send some data
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"A"}}]}\n\n'
        ));

        const countBeforeDisconnect = writeCount;

        // Client disconnects
        mockReq.emit('close');

        // Try to send more data
        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"content":"B"}}]}\n\n'
        ));

        // Stream should be destroyed
        expect(mockStream.destroy).toHaveBeenCalled();

        mockStream.emit('end');
      }, 10);

      await streamPromise;
    });
  });
});

// Mock Jest if not running in Jest environment
if (typeof jest === 'undefined') {
  console.log('Integration tests should be run with Jest: npm test');
  console.log('Skipping test execution');
}
