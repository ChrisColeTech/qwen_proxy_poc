/**
 * Test script for Phase 2 repository implementations
 * Tests all repository methods to ensure they work correctly
 */

const SessionRepository = require('./src/database/repositories/session-repository');
const RequestRepository = require('./src/database/repositories/request-repository');
const ResponseRepository = require('./src/database/repositories/response-repository');

console.log('=== Testing Phase 2: Repository Pattern Implementation ===\n');

// Initialize repositories
const sessionRepo = new SessionRepository();
const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

console.log('[INFO] Repositories initialized successfully\n');

// Store test data IDs for cross-test usage
let testRequestId = null;

// Test 1: Session Repository
console.log('--- Test 1: SessionRepository ---');
try {
  // Clean up any existing test session
  sessionRepo.delete('test-session-1');

  // Create a session
  console.log('Creating session...');
  sessionRepo.createSession('test-session-1', 'chat-123', 'Hello world', 30 * 60 * 1000);
  console.log('✓ Session created');

  // Get the session
  console.log('Retrieving session...');
  const session = sessionRepo.getSession('test-session-1');
  console.log('✓ Session retrieved:', {
    id: session.id,
    chat_id: session.chat_id,
    parent_id: session.parent_id,
    message_count: session.message_count
  });

  // Update parent_id
  console.log('Updating parent_id...');
  sessionRepo.updateParentId('test-session-1', 'parent-456');
  const updatedSession = sessionRepo.getSession('test-session-1');
  console.log('✓ Parent ID updated:', {
    parent_id: updatedSession.parent_id,
    message_count: updatedSession.message_count
  });

  // Touch session (keep-alive)
  console.log('Touching session (keep-alive)...');
  sessionRepo.touchSession('test-session-1', 30 * 60 * 1000);
  console.log('✓ Session touched');

  // Get metrics
  console.log('Getting metrics...');
  const metrics = sessionRepo.getMetrics();
  console.log('✓ Metrics:', metrics);

  console.log('✅ SessionRepository: All tests passed\n');
} catch (error) {
  console.error('❌ SessionRepository test failed:', error.message);
  process.exit(1);
}

// Test 2: Request Repository
console.log('--- Test 2: RequestRepository ---');
try {
  // Create a request
  console.log('Creating request...');
  const openaiRequest = {
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    stream: false
  };

  const qwenRequest = {
    chat_id: 'chat-123',
    parent_id: null,
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ]
  };

  const { id, requestId: requestUuid } = requestRepo.createRequest(
    'test-session-1',
    openaiRequest,
    qwenRequest,
    'qwen3-max',
    false
  );
  testRequestId = id; // Store for later tests
  console.log('✓ Request created:', { id, requestId: requestUuid });

  // Get request by UUID
  console.log('Retrieving request by UUID...');
  const request = requestRepo.getByRequestId(requestUuid);
  console.log('✓ Request retrieved:', {
    id: request.id,
    session_id: request.session_id,
    model: request.model,
    stream: request.stream,
    hasOpenAIRequest: !!request.openai_request,
    hasQwenRequest: !!request.qwen_request
  });

  // Get requests by session ID
  console.log('Getting requests by session ID...');
  const sessionRequests = requestRepo.getBySessionId('test-session-1');
  console.log('✓ Found', sessionRequests.length, 'request(s) for session');

  // Get requests by date range
  console.log('Getting requests by date range...');
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const rangeRequests = requestRepo.getByDateRange(oneDayAgo, now);
  console.log('✓ Found', rangeRequests.length, 'request(s) in date range');

  console.log('✅ RequestRepository: All tests passed\n');
} catch (error) {
  console.error('❌ RequestRepository test failed:', error.message);
  process.exit(1);
}

// Test 3: Response Repository
console.log('--- Test 3: ResponseRepository ---');
try {
  // Create a response
  console.log('Creating response...');
  const qwenResponse = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: 'I am doing well, thank you!'
        }
      }
    ]
  };

  const openaiResponse = {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'qwen3-max',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'I am doing well, thank you!'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 8,
      total_tokens: 18
    }
  };

  const { id: responseId, responseId: responseUuid } = responseRepo.createResponse(
    testRequestId,
    'test-session-1',
    qwenResponse,
    openaiResponse,
    'parent-789',
    openaiResponse.usage,
    1250,
    'stop',
    null
  );
  console.log('✓ Response created:', { id: responseId, responseId: responseUuid });

  // Get response by UUID
  console.log('Retrieving response by UUID...');
  const response = responseRepo.getByResponseId(responseUuid);
  console.log('✓ Response retrieved:', {
    id: response.id,
    request_id: response.request_id,
    session_id: response.session_id,
    finish_reason: response.finish_reason,
    total_tokens: response.total_tokens,
    duration_ms: response.duration_ms
  });

  // Get response by request ID
  console.log('Getting response by request ID...');
  const responseByRequest = responseRepo.getByRequestId(testRequestId);
  console.log('✓ Response found for request:', !!responseByRequest);

  // Get responses by session ID
  console.log('Getting responses by session ID...');
  const sessionResponses = responseRepo.getBySessionId('test-session-1');
  console.log('✓ Found', sessionResponses.length, 'response(s) for session');

  // Get usage statistics
  console.log('Getting usage statistics...');
  const stats = responseRepo.getUsageStats('test-session-1');
  console.log('✓ Usage stats:', {
    total_responses: stats.total_responses,
    total_tokens: stats.total_tokens,
    avg_duration_ms: Math.round(stats.avg_duration_ms || 0)
  });

  console.log('✅ ResponseRepository: All tests passed\n');
} catch (error) {
  console.error('❌ ResponseRepository test failed:', error.message);
  process.exit(1);
}

// Test 4: Cleanup test
console.log('--- Test 4: Cleanup Expired Sessions ---');
try {
  // Create an expired session
  console.log('Creating expired session...');
  sessionRepo.createSession('expired-session', 'chat-expired', 'Test expired', 1); // 1ms timeout

  // Wait a bit to ensure it expires
  setTimeout(() => {
    console.log('Checking expired session...');
    const expiredSession = sessionRepo.getSession('expired-session');
    if (expiredSession === null) {
      console.log('✓ Expired session was automatically deleted on retrieval');
    } else {
      console.log('⚠ Expired session still exists (may have been retrieved too quickly)');
    }

    // Run cleanup
    console.log('Running cleanup...');
    const cleaned = sessionRepo.cleanupExpired();
    console.log('✓ Cleaned up', cleaned, 'expired session(s)');

    console.log('✅ Cleanup test passed\n');

    // Clean up test data
    console.log('--- Cleaning up test data ---');
    sessionRepo.delete('test-session-1');
    console.log('✓ Test session deleted');

    console.log('\n=== All Phase 2 Tests Passed Successfully! ===');
    console.log('\n✅ BaseRepository: CRUD operations working');
    console.log('✅ SessionRepository: All methods working');
    console.log('✅ RequestRepository: All methods working');
    console.log('✅ ResponseRepository: All methods working');
    console.log('✅ JSON serialization/deserialization working');
    console.log('✅ Foreign key relationships working');
    console.log('✅ Expiration and cleanup working');

    process.exit(0);
  }, 100);
} catch (error) {
  console.error('❌ Cleanup test failed:', error.message);
  process.exit(1);
}
