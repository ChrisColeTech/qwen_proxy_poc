/**
 * SSE Handler Test Runner
 *
 * Simple test runner for verifying SSE handler implementation
 * without requiring Jest installation
 */

const { EventEmitter } = require('events');
const SSEHandler = require('../src/services/sse-handler');
const { SSETransformer } = require('../src/transformers/sse-transformer');

console.log('=================================');
console.log('SSE Handler Verification Tests');
console.log('=================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name, testFn) {
  console.log(`\nTest: ${name}`);
  console.log('-'.repeat(50));
  try {
    await testFn();
    console.log('PASSED\n');
  } catch (error) {
    console.error('FAILED:', error.message, '\n');
  }
}

async function runAllTests() {
  // Test 1: SSE Headers
  await runTest('SSE Headers are set correctly', async () => {
  const mockQwenClient = {
    sendMessage: async () => {
      const stream = new EventEmitter();
      setTimeout(() => stream.emit('end'), 10);
      return stream;
    }
  };

  const mockSessionManager = {
    updateSession: () => {}
  };

  const handler = new SSEHandler(mockQwenClient, mockSessionManager);

  const mockReq = new EventEmitter();
  const mockRes = {
    writeHead: (status, headers) => {
      assertEqual(status, 200, 'Status code is 200');
      assertEqual(headers['Content-Type'], 'text/event-stream', 'Content-Type is text/event-stream');
      assertEqual(headers['Cache-Control'], 'no-cache', 'Cache-Control is no-cache');
      assertEqual(headers['Connection'], 'keep-alive', 'Connection is keep-alive');
      assertEqual(headers['X-Accel-Buffering'], 'no', 'X-Accel-Buffering is no');
    },
    write: () => {},
    end: () => {}
  };

  await handler.streamCompletion({}, mockReq, mockRes, 'test-session');
});

// Test 2: Chunk Streaming
await runTest('Content chunks are transformed and sent', async () => {
  const mockStream = new EventEmitter();

  const mockQwenClient = {
    sendMessage: async () => {
      // Emit chunks after a small delay
      setTimeout(() => {
        mockStream.emit('data', Buffer.from(
          'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-123","response_id":"resp-1"}}\n\n'
        ));

        mockStream.emit('data', Buffer.from(
          'data: {"choices":[{"delta":{"role":"assistant","content":"Hello","phase":"answer","status":"typing"}}]}\n\n'
        ));

        mockStream.emit('end');
      }, 50);

      return mockStream;
    }
  };

  const mockSessionManager = {
    updateSession: () => {}
  };

  const handler = new SSEHandler(mockQwenClient, mockSessionManager);

  const mockReq = new EventEmitter();
  const chunks = [];
  const mockRes = {
    writeHead: () => {},
    write: (data) => {
      chunks.push(data);
    },
    end: () => {}
  };

  await handler.streamCompletion({}, mockReq, mockRes, 'test-session');

  assert(chunks.length > 0, 'Chunks were sent');
  assert(chunks.some(c => c === 'data: [DONE]\n\n'), '[DONE] marker was sent');
  assert(!chunks.some(c => c.includes('response.created')), 'response.created was filtered out');
});

// Test 3: parent_id Extraction
await runTest('parent_id is extracted and session updated', async () => {
  const mockStream = new EventEmitter();

  let updatedParentId = null;
  const mockSessionManager = {
    updateSession: (sessionId, updates) => {
      updatedParentId = updates.parentId;
    }
  };

  const mockQwenClient = {
    sendMessage: async () => {
      setTimeout(() => {
        mockStream.emit('data', Buffer.from(
          'data: {"response.created":{"chat_id":"chat-1","parent_id":"parent-456","response_id":"resp-1"}}\n\n'
        ));
        mockStream.emit('end');
      }, 50);

      return mockStream;
    }
  };

  const handler = new SSEHandler(mockQwenClient, mockSessionManager);

  const mockReq = new EventEmitter();
  const mockRes = {
    writeHead: () => {},
    write: () => {},
    end: () => {}
  };

  await handler.streamCompletion({}, mockReq, mockRes, 'test-session');

  assertEqual(updatedParentId, 'parent-456', 'Session was updated with correct parent_id');
});

// Test 4: Client Disconnect
await runTest('Stream stops when client disconnects', async () => {
  const mockStream = new EventEmitter();
  mockStream.destroy = () => {
    mockStream.destroyed = true;
  };

  const mockQwenClient = {
    sendMessage: async () => mockStream
  };

  const mockSessionManager = {
    updateSession: () => {}
  };

  const handler = new SSEHandler(mockQwenClient, mockSessionManager);

  const mockReq = new EventEmitter();
  const mockRes = {
    writeHead: () => {},
    write: () => {},
    end: () => {}
  };

  const streamPromise = handler.streamCompletion({}, mockReq, mockRes, 'test-session');

  setTimeout(() => {
    mockReq.emit('close'); // Client disconnects

    mockStream.emit('data', Buffer.from(
      'data: {"choices":[{"delta":{"content":"test"}}]}\n\n'
    ));

    assert(mockStream.destroyed, 'Stream was destroyed after client disconnect');

    mockStream.emit('end');
  }, 10);

  await streamPromise;
});

// Test 5: Error Handling
await runTest('Stream errors are handled gracefully', async () => {
  const mockStream = new EventEmitter();

  const mockSessionManager = {
    updateSession: () => {}
  };

  const mockQwenClient = {
    sendMessage: async () => {
      setTimeout(() => {
        mockStream.emit('error', new Error('Test error'));
      }, 50);

      return mockStream;
    }
  };

  const handler = new SSEHandler(mockQwenClient, mockSessionManager);

  const mockReq = new EventEmitter();
  let errorSent = false;
  const mockRes = {
    writeHead: () => {},
    write: (data) => {
      if (data.includes('error')) {
        errorSent = true;
      }
    },
    end: () => {}
  };

  try {
    await handler.streamCompletion({}, mockReq, mockRes, 'test-session');
  } catch (err) {
    // Expected error
  }

  assert(errorSent, 'Error chunk was sent to client');
});

// Test 6: SSETransformer Integration
await runTest('SSETransformer integration works correctly', async () => {
  const transformer = new SSETransformer('qwen3-max');

  // Process response.created chunk
  const createdChunk = 'data: {"response.created":{"parent_id":"parent-789"}}\n\n';
  const result1 = transformer.processChunk(Buffer.from(createdChunk));

  assert(result1.length === 0, 'response.created chunk is filtered out');
  assertEqual(transformer.getParentId(), 'parent-789', 'parent_id is extracted');

  // Process content chunk with usage
  const contentChunk = 'data: {"choices":[{"delta":{"content":"Test","role":"assistant","status":"typing"}}],"usage":{"input_tokens":10,"output_tokens":5,"total_tokens":15}}\n\n';
  const result2 = transformer.processChunk(Buffer.from(contentChunk));

  assert(result2.length > 0, 'Content chunk is transformed');
  assert(result2[0].choices[0].delta.content === 'Test', 'Content is correct');

  // Finalize
  const finalChunks = transformer.finalize();
  assert(finalChunks.length === 3, 'Final chunks include finish, usage, and [DONE]');
  assert(finalChunks[finalChunks.length - 1] === '[DONE]', 'Last chunk is [DONE]');
});

  // Summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log(`Total Tests: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.log(`\n✗ ${testsFailed} test(s) failed`);
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
