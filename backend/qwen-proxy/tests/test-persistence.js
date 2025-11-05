/**
 * Test script for Phase 4: Persistence Middleware
 *
 * This script tests that requests and responses are properly logged to the database.
 */

require('dotenv').config();
const { logRequest, logResponse } = require('./src/middleware/persistence-middleware');
const RequestRepository = require('./src/database/repositories/request-repository');
const ResponseRepository = require('./src/database/repositories/response-repository');
const SessionRepository = require('./src/database/repositories/session-repository');
const { initializeDatabase } = require('./src/database');

async function testPersistence() {
  console.log('===========================================');
  console.log('Phase 4: Persistence Middleware Test');
  console.log('===========================================\n');

  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized\n');

    // Create repositories
    const sessionRepo = new SessionRepository();
    const requestRepo = new RequestRepository();
    const responseRepo = new ResponseRepository();

    // 1. Create a test session
    console.log('1. Creating test session...');
    const sessionId = 'test-session-' + Date.now();
    const chatId = 'test-chat-123';
    sessionRepo.createSession(sessionId, chatId, 'Hello, test message', 30 * 60 * 1000);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Chat ID: ${chatId}\n`);

    // 2. Test logRequest
    console.log('2. Testing logRequest...');
    const openaiRequest = {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello, test message' }
      ],
      stream: false
    };

    const qwenRequest = {
      chat_id: chatId,
      parent_id: null,
      stream: false,
      messages: [
        { role: 'user', content: 'Hello, test message' }
      ]
    };

    const persistence = await logRequest(
      sessionId,
      openaiRequest,
      qwenRequest,
      'qwen3-max',
      false
    );

    if (!persistence) {
      throw new Error('logRequest returned null');
    }

    console.log(`   Request ID: ${persistence.requestId}`);
    console.log(`   Request DB ID: ${persistence.requestDbId}\n`);

    // 3. Verify request was saved
    console.log('3. Verifying request in database...');
    const savedRequest = requestRepo.findById(persistence.requestDbId);
    if (!savedRequest) {
      throw new Error('Request not found in database');
    }
    console.log(`   ✓ Request found in database`);
    console.log(`   Model: ${savedRequest.model}`);
    console.log(`   Stream: ${savedRequest.stream ? 'true' : 'false'}\n`);

    // 4. Test logResponse
    console.log('4. Testing logResponse...');
    const openaiResponse = {
      id: 'chatcmpl-test-123',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'qwen3-max',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello! This is a test response.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    };

    const qwenResponse = {
      choices: [
        {
          message: {
            content: 'Hello! This is a test response.',
            role: 'assistant'
          }
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    };

    const responseId = await logResponse(
      persistence.requestDbId,
      sessionId,
      qwenResponse,
      openaiResponse,
      'parent-456',
      openaiResponse.usage,
      1234, // duration in ms
      'stop',
      null
    );

    if (!responseId) {
      throw new Error('logResponse returned null');
    }

    console.log(`   Response ID: ${responseId}\n`);

    // 5. Verify response was saved
    console.log('5. Verifying response in database...');
    const savedResponse = responseRepo.getByResponseId(responseId);
    if (!savedResponse) {
      throw new Error('Response not found in database');
    }
    console.log(`   ✓ Response found in database`);
    console.log(`   Finish reason: ${savedResponse.finish_reason}`);
    console.log(`   Duration: ${savedResponse.duration_ms}ms`);
    console.log(`   Total tokens: ${savedResponse.total_tokens}\n`);

    // 6. Verify linkage
    console.log('6. Verifying request-response linkage...');
    const linkedResponse = responseRepo.getByRequestId(persistence.requestDbId);
    if (!linkedResponse) {
      throw new Error('Linked response not found');
    }
    console.log(`   ✓ Request-response linkage verified\n`);

    // 7. Test error logging
    console.log('7. Testing error response logging...');
    const errorPersistence = await logRequest(
      sessionId,
      openaiRequest,
      qwenRequest,
      'qwen3-max',
      false
    );

    const errorResponseId = await logResponse(
      errorPersistence.requestDbId,
      sessionId,
      null,
      null,
      null,
      null,
      500, // duration
      'error',
      'Test error message'
    );

    if (!errorResponseId) {
      throw new Error('Error response logging failed');
    }

    const errorResponse = responseRepo.getByResponseId(errorResponseId);
    console.log(`   ✓ Error response logged`);
    console.log(`   Error message: ${errorResponse.error}\n`);

    // 8. Show summary statistics
    console.log('8. Summary statistics:');
    const requestCount = requestRepo.count({ session_id: sessionId });
    const responseCount = responseRepo.count({ session_id: sessionId });
    const usageStats = responseRepo.getUsageStats(sessionId);

    console.log(`   Total requests: ${requestCount}`);
    console.log(`   Total responses: ${responseCount}`);
    console.log(`   Total tokens used: ${usageStats.total_tokens || 0}`);
    console.log(`   Average duration: ${Math.round(usageStats.avg_duration_ms || 0)}ms\n`);

    // 9. Clean up test data
    console.log('9. Cleaning up test data...');
    sessionRepo.delete(sessionId);
    console.log(`   ✓ Test session deleted (cascade deletes requests/responses)\n`);

    // Verify cleanup
    const remainingRequests = requestRepo.count({ session_id: sessionId });
    const remainingResponses = responseRepo.count({ session_id: sessionId });
    console.log(`   Remaining requests: ${remainingRequests}`);
    console.log(`   Remaining responses: ${remainingResponses}\n`);

    console.log('===========================================');
    console.log('✓ All tests passed successfully!');
    console.log('===========================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPersistence();
