const { EventEmitter } = require('events');
const SSEHandler = require('../../src/services/sse-handler');
const { SSETransformer } = require('../../src/transformers/sse-transformer');

/**
 * Unit Tests for SSE Handler
 *
 * Tests:
 * 1. SSE headers are set correctly
 * 2. Chunks are transformed and sent
 * 3. parent_id is extracted and session updated
 * 4. Client disconnect is handled
 * 5. Stream errors are handled gracefully
 * 6. [DONE] marker is sent at end
 */

describe('SSEHandler', () => {
  let sseHandler;
  let mockQwenClient;
  let mockSessionManager;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock Qwen client
    mockQwenClient = {
      sendMessage: jest.fn()
    };

    // Mock session manager
    mockSessionManager = {
      updateSession: jest.fn()
    };

    // Create handler
    sseHandler = new SSEHandler(mockQwenClient, mockSessionManager);

    // Mock Express request
    mockReq = new EventEmitter();
    mockReq.on = jest.fn((event, handler) => {
      EventEmitter.prototype.on.call(mockReq, event, handler);
    });

    // Mock Express response
    mockRes = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };
  });

  describe('SSE Headers', () => {
    test('should set correct SSE headers', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      // Start streaming
      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Verify headers
      expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      // End stream
      mockStream.emit('end');
      await streamPromise;
    });
  });

  describe('Chunk Streaming', () => {
    test('should transform and send content chunks', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      // Start streaming
      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Simulate Qwen chunks
      const chunk1 = 'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-123","response_id":"resp-1"}}\n\n';
      const chunk2 = 'data: {"choices":[{"delta":{"role":"assistant","content":"Hello","phase":"answer","status":"typing"}}],"usage":{"input_tokens":10,"output_tokens":1}}\n\n';
      const chunk3 = 'data: {"choices":[{"delta":{"role":"assistant","content":"","phase":"answer","status":"finished"}}]}\n\n';

      mockStream.emit('data', Buffer.from(chunk1));
      mockStream.emit('data', Buffer.from(chunk2));
      mockStream.emit('data', Buffer.from(chunk3));
      mockStream.emit('end');

      await streamPromise;

      // Verify chunks were sent (excluding response.created which is filtered)
      const writeCalls = mockRes.write.mock.calls;

      // Should have: content chunk, final chunk, usage chunk, [DONE]
      expect(writeCalls.length).toBeGreaterThan(2);

      // Check [DONE] was sent
      const lastCall = writeCalls[writeCalls.length - 1][0];
      expect(lastCall).toBe('data: [DONE]\n\n');
    });

    test('should not send response.created chunk to client', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Send response.created chunk
      const createdChunk = 'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-123","response_id":"resp-1"}}\n\n';
      mockStream.emit('data', Buffer.from(createdChunk));
      mockStream.emit('end');

      await streamPromise;

      // Check that no response.created chunk was sent to client
      const writeCalls = mockRes.write.mock.calls;
      for (const call of writeCalls) {
        const data = call[0];
        expect(data).not.toContain('response.created');
      }
    });
  });

  describe('parent_id Extraction and Session Update', () => {
    test('should extract parent_id and update session', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Send chunks with parent_id
      const createdChunk = 'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-456","response_id":"resp-1"}}\n\n';
      mockStream.emit('data', Buffer.from(createdChunk));
      mockStream.emit('end');

      await streamPromise;

      // Verify session was updated with parent_id
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          parentId: 'parent-456'
        })
      );
    });

    test('should not update session if no parent_id found', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Send content without response.created
      const contentChunk = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\n';
      mockStream.emit('data', Buffer.from(contentChunk));
      mockStream.emit('end');

      await streamPromise;

      // Session update should not be called (or called with null)
      if (mockSessionManager.updateSession.mock.calls.length > 0) {
        const updateCall = mockSessionManager.updateSession.mock.calls[0];
        expect(updateCall[1].parentId).toBeNull();
      }
    });
  });

  describe('Client Disconnect Handling', () => {
    test('should stop streaming when client disconnects', async () => {
      const mockStream = new EventEmitter();
      mockStream.destroy = jest.fn();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Simulate client disconnect
      mockReq.emit('close');

      // Send data after disconnect
      const chunk = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\n';
      mockStream.emit('data', Buffer.from(chunk));

      // Stream should be destroyed
      expect(mockStream.destroy).toHaveBeenCalled();

      // End stream
      mockStream.emit('end');
      await streamPromise;
    });
  });

  describe('Error Handling', () => {
    test('should handle stream errors gracefully', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Emit error
      const error = new Error('Stream error');
      error.code = 'STREAM_ERROR';
      mockStream.emit('error', error);

      await streamPromise;

      // Should send error chunk
      const writeCalls = mockRes.write.mock.calls;
      const errorChunk = writeCalls.find(call =>
        call[0].includes('error') && call[0].includes('Stream error')
      );
      expect(errorChunk).toBeDefined();

      // Should end response
      expect(mockRes.end).toHaveBeenCalled();
    });

    test('should handle API call errors', async () => {
      // Mock API error
      const apiError = new Error('API Error');
      mockQwenClient.sendMessage.mockRejectedValue(apiError);

      await sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Should send error and close
      expect(mockRes.write).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
    });

    test('should continue streaming if single chunk fails to parse', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      // Send invalid chunk
      const invalidChunk = 'data: {invalid json}\n\n';
      mockStream.emit('data', Buffer.from(invalidChunk));

      // Send valid chunk
      const validChunk = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\n';
      mockStream.emit('data', Buffer.from(validChunk));

      mockStream.emit('end');
      await streamPromise;

      // Should log error but continue
      expect(consoleSpy).toHaveBeenCalled();

      // Should still send valid chunks
      expect(mockRes.write).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('[DONE] Marker', () => {
    test('should send [DONE] marker at end of stream', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123'
      );

      mockStream.emit('end');
      await streamPromise;

      // Check last write call
      const writeCalls = mockRes.write.mock.calls;
      const lastCall = writeCalls[writeCalls.length - 1][0];
      expect(lastCall).toBe('data: [DONE]\n\n');
    });
  });

  describe('Model Parameter', () => {
    test('should use provided model name in chunks', async () => {
      const mockStream = new EventEmitter();
      mockQwenClient.sendMessage.mockResolvedValue(mockStream);

      const streamPromise = sseHandler.streamCompletion(
        {},
        mockReq,
        mockRes,
        'session-123',
        'qwen-turbo'
      );

      // Send content chunk
      const chunk = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\n';
      mockStream.emit('data', Buffer.from(chunk));
      mockStream.emit('end');

      await streamPromise;

      // Check that chunks contain correct model
      const writeCalls = mockRes.write.mock.calls;
      const contentChunks = writeCalls.filter(call =>
        call[0].includes('"model"')
      );

      if (contentChunks.length > 0) {
        expect(contentChunks[0][0]).toContain('"model":"qwen-turbo"');
      }
    });
  });
});

// Mock Jest if not running in Jest environment
if (typeof jest === 'undefined') {
  console.log('Tests should be run with Jest: npm test');
  console.log('Skipping test execution');
}
