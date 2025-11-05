/**
 * Manual Integration Test for Chat Completions
 *
 * This script tests the chat completions endpoint with REAL API calls.
 * Requires valid QWEN_TOKEN and QWEN_COOKIES in .env file.
 *
 * Tests:
 * 1. First message (non-streaming) - parent_id should be null
 * 2. Follow-up message (non-streaming) - parent_id should be UUID
 * 3. Streaming message
 * 4. Multi-turn conversation context
 *
 * Usage:
 *   node tests/integration/manual-test-chat-completions.js
 */

const {
  chatCompletions,
  getSessionManager,
  getQwenClient
} = require('../../src/handlers/chat-completions-handler');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(colors.green, `✓ ${message}`);
}

function logError(message) {
  log(colors.red, `✗ ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ ${message}`);
}

function logSection(message) {
  console.log();
  log(colors.cyan, `${'='.repeat(60)}`);
  log(colors.cyan, message);
  log(colors.cyan, `${'='.repeat(60)}`);
}

/**
 * Create mock request/response for testing
 */
function createMockReqRes(body) {
  const chunks = [];

  const req = {
    body,
    on: (event, handler) => {
      // Mock event handlers
    }
  };

  const res = {
    json: (data) => {
      res.jsonData = data;
      logSuccess('Response received');
      console.log(JSON.stringify(data, null, 2));
    },
    write: (data) => {
      chunks.push(data);
      process.stdout.write('.');
    },
    writeHead: (status, headers) => {
      res.statusCode = status;
      res.headers = headers;
      logInfo(`Headers set: ${status}`);
    },
    end: () => {
      console.log(); // New line after streaming dots
      logSuccess('Stream ended');
      res.ended = true;
    },
    on: () => {},
    chunks,
    jsonData: null,
    statusCode: null,
    headers: null,
    ended: false
  };

  return { req, res };
}

/**
 * Test 1: First message (non-streaming)
 */
async function testFirstMessageNonStreaming() {
  logSection('TEST 1: First Message (Non-Streaming)');
  logInfo('Testing first message with parent_id = null');

  const { req, res } = createMockReqRes({
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'Hello! Please say hi back.' }
    ],
    stream: false
  });

  const next = (error) => {
    if (error) {
      logError(`Error: ${error.message}`);
      console.error(error);
    }
  };

  try {
    await chatCompletions(req, res, next);

    if (res.jsonData) {
      logSuccess('First message test passed');

      // Check session was created
      const sessionManager = getSessionManager();
      const sessionId = sessionManager.generateSessionId('Hello! Please say hi back.');
      const session = sessionManager.getSession(sessionId);

      if (session) {
        logSuccess(`Session created: ${sessionId.substring(0, 8)}...`);
        logInfo(`Chat ID: ${session.chatId}`);
        logInfo(`Parent ID: ${session.parent_id || 'null'}`);

        return { sessionId, session };
      } else {
        logError('Session not found');
      }
    } else {
      logError('No response data');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  }

  return null;
}

/**
 * Test 2: Follow-up message (non-streaming)
 */
async function testFollowUpMessageNonStreaming(sessionId) {
  logSection('TEST 2: Follow-Up Message (Non-Streaming)');
  logInfo('Testing follow-up message with parent_id from previous response');

  const sessionManager = getSessionManager();
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    logError('Session not found - cannot test follow-up');
    return;
  }

  logInfo(`Using session: ${sessionId.substring(0, 8)}...`);
  logInfo(`Current parent_id: ${session.parent_id}`);

  const { req, res } = createMockReqRes({
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'Hello! Please say hi back.' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'What did I just say to you?' }
    ],
    stream: false
  });

  const next = (error) => {
    if (error) {
      logError(`Error: ${error.message}`);
      console.error(error);
    }
  };

  try {
    await chatCompletions(req, res, next);

    if (res.jsonData) {
      logSuccess('Follow-up message test passed');

      // Check session was updated
      const updatedSession = sessionManager.getSession(sessionId);

      if (updatedSession) {
        logSuccess('Session updated');
        logInfo(`New parent_id: ${updatedSession.parent_id}`);
        logInfo(`Message count: ${updatedSession.messageCount}`);

        // Verify context was maintained (response should reference previous message)
        const content = res.jsonData.choices[0].message.content.toLowerCase();
        if (content.includes('hello') || content.includes('hi')) {
          logSuccess('Context maintained - AI remembers previous message!');
        } else {
          log(colors.yellow, '⚠ Context may not be maintained');
        }
      }
    } else {
      logError('No response data');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Test 3: Streaming message
 */
async function testStreamingMessage() {
  logSection('TEST 3: Streaming Message');
  logInfo('Testing streaming mode with SSE');

  const { req, res } = createMockReqRes({
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'Count from 1 to 5 slowly.' }
    ],
    stream: true
  });

  const next = (error) => {
    if (error) {
      logError(`Error: ${error.message}`);
      console.error(error);
    }
  };

  try {
    logInfo('Starting stream...');

    await chatCompletions(req, res, next);

    if (res.ended) {
      logSuccess('Streaming test passed');
      logInfo(`Total chunks received: ${res.chunks.length}`);

      // Check session was created and updated
      const sessionManager = getSessionManager();
      const sessionId = sessionManager.generateSessionId('Count from 1 to 5 slowly.');
      const session = sessionManager.getSession(sessionId);

      if (session && session.parent_id) {
        logSuccess(`Session updated with parent_id: ${session.parent_id.substring(0, 8)}...`);
      } else {
        log(colors.yellow, '⚠ Session may not have been updated');
      }
    } else {
      logError('Stream did not end properly');
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Test 4: Multi-turn conversation
 */
async function testMultiTurnConversation() {
  logSection('TEST 4: Multi-Turn Conversation');
  logInfo('Testing context preservation across multiple turns');

  // Turn 1: Tell AI your name
  logInfo('Turn 1: Introducing name...');

  const { req: req1, res: res1 } = createMockReqRes({
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'My name is Bob. Remember this.' }
    ],
    stream: false
  });

  try {
    await chatCompletions(req1, res1, () => {});

    if (!res1.jsonData) {
      logError('Turn 1 failed');
      return;
    }

    logSuccess('Turn 1 complete');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 2: Tell AI your favorite color
    logInfo('Turn 2: Adding favorite color...');

    const { req: req2, res: res2 } = createMockReqRes({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Bob. Remember this.' },
        { role: 'assistant', content: res1.jsonData.choices[0].message.content },
        { role: 'user', content: 'My favorite color is blue.' }
      ],
      stream: false
    });

    await chatCompletions(req2, res2, () => {});

    if (!res2.jsonData) {
      logError('Turn 2 failed');
      return;
    }

    logSuccess('Turn 2 complete');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 3: Ask about both pieces of information
    logInfo('Turn 3: Testing context preservation...');

    const { req: req3, res: res3 } = createMockReqRes({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Bob. Remember this.' },
        { role: 'assistant', content: res1.jsonData.choices[0].message.content },
        { role: 'user', content: 'My favorite color is blue.' },
        { role: 'assistant', content: res2.jsonData.choices[0].message.content },
        { role: 'user', content: 'What is my name and favorite color?' }
      ],
      stream: false
    });

    await chatCompletions(req3, res3, () => {});

    if (!res3.jsonData) {
      logError('Turn 3 failed');
      return;
    }

    logSuccess('Turn 3 complete');

    // Check if AI remembered both pieces of information
    const finalResponse = res3.jsonData.choices[0].message.content.toLowerCase();

    const remembersName = finalResponse.includes('bob');
    const remembersColor = finalResponse.includes('blue');

    if (remembersName && remembersColor) {
      logSuccess('✓ CONTEXT PRESERVED! AI remembers both name and color!');
      log(colors.green, `Response: "${res3.jsonData.choices[0].message.content}"`);
    } else if (remembersName || remembersColor) {
      log(colors.yellow, `⚠ Partial context: Name=${remembersName}, Color=${remembersColor}`);
      log(colors.yellow, `Response: "${res3.jsonData.choices[0].message.content}"`);
    } else {
      logError('✗ Context NOT preserved - AI forgot the information');
      log(colors.red, `Response: "${res3.jsonData.choices[0].message.content}"`);
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.clear();
  log(colors.cyan, '╔════════════════════════════════════════════════════════════╗');
  log(colors.cyan, '║  Chat Completions Handler - Manual Integration Tests      ║');
  log(colors.cyan, '╚════════════════════════════════════════════════════════════╝');

  logInfo('Checking configuration...');

  const config = require('../../src/config');

  if (!config.qwen.token || !config.qwen.cookies) {
    logError('Missing QWEN_TOKEN or QWEN_COOKIES in environment');
    logError('Please set these in your .env file');
    process.exit(1);
  }

  logSuccess('Configuration valid');

  try {
    // Test 1: First message (non-streaming)
    const result = await testFirstMessageNonStreaming();

    if (result) {
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Follow-up message
      await testFollowUpMessageNonStreaming(result.sessionId);
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Streaming
    await testStreamingMessage();

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Multi-turn conversation
    await testMultiTurnConversation();

    // Final summary
    logSection('TEST SUMMARY');

    const sessionManager = getSessionManager();
    const metrics = sessionManager.getMetrics();

    logInfo(`Total sessions created: ${metrics.totalCreated}`);
    logInfo(`Active sessions: ${metrics.activeSessions}`);

    log(colors.cyan, '\nAll tests completed!');

  } catch (error) {
    logError('Fatal error during tests:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError('Unhandled error:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testFirstMessageNonStreaming,
  testFollowUpMessageNonStreaming,
  testStreamingMessage,
  testMultiTurnConversation
};
