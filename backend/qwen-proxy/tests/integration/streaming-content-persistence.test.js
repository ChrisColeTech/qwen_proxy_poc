/**
 * Integration Test: Streaming Content Persistence
 *
 * Verifies that streaming responses save full content to database
 */

const { initializeDatabase, getDatabase, shutdownDatabase } = require('../../src/database');
const { SSETransformer } = require('../../src/transformers/sse-transformer');
const ResponseRepository = require('../../src/database/repositories/response-repository');
const RequestRepository = require('../../src/database/repositories/request-repository');
const SessionRepository = require('../../src/database/repositories/session-repository');

describe('Streaming Content Persistence Integration', () => {
  let requestRepo;
  let responseRepo;
  let sessionRepo;

  beforeAll(async () => {
    // Use in-memory database for testing
    process.env.DATABASE_PATH = ':memory:';
    await initializeDatabase();

    requestRepo = new RequestRepository();
    responseRepo = new ResponseRepository();
    sessionRepo = new SessionRepository();
  });

  afterAll(async () => {
    await shutdownDatabase();
  });

  test('should save full accumulated content from streaming response', async () => {
    // 1. Create a session
    const sessionId = 'test-session-123';
    const chatId = 'test-chat-456';
    sessionRepo.createSession(sessionId, chatId, 'Test message', 30000);

    // 2. Create a request
    const openaiRequest = {
      messages: [
        { role: 'user', content: 'Tell me a story' }
      ],
      model: 'qwen-turbo',
      stream: true
    };

    const qwenRequest = {
      chat_id: chatId,
      parent_id: null,
      messages: [{ content: 'Tell me a story' }],
      stream: true
    };

    const { id: requestDbId } = requestRepo.createRequest(
      sessionId,
      openaiRequest,
      qwenRequest,
      'qwen-turbo',
      true
    );

    // 3. Simulate streaming response chunks
    const transformer = new SSETransformer('qwen-turbo');

    // Simulate chunks from Qwen API
    const chunks = [
      {
        'response.created': {
          chat_id: chatId,
          parent_id: 'parent-789',
          response_id: 'resp-001'
        }
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'Once upon ',
            status: 'typing'
          }
        }],
        usage: { input_tokens: 10, output_tokens: 2 }
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'a time, ',
            status: 'typing'
          }
        }],
        usage: { input_tokens: 10, output_tokens: 4 }
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'there was a brave knight.',
            status: 'typing'
          }
        }],
        usage: { input_tokens: 10, output_tokens: 10 }
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: '',
            status: 'finished'
          }
        }]
      }
    ];

    // Process all chunks
    for (const chunk of chunks) {
      transformer.transformChunk(chunk);
    }

    // 4. Get accumulated data
    const parentId = transformer.getParentId();
    const usage = transformer.getUsage();
    const completeResponse = transformer.getCompleteResponse();

    // 5. Save response to database (simulating what sse-handler does)
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      null,  // Qwen raw response not stored for streaming
      completeResponse,
      parentId,
      usage,
      1234,  // duration_ms
      'stop',
      null
    );

    // 6. Verify content was saved correctly
    const savedResponse = responseRepo.getByResponseId(responseId);

    expect(savedResponse).toBeDefined();
    expect(savedResponse.openai_response).toBeDefined();
    expect(savedResponse.openai_response.choices[0].message.content).toBe(
      'Once upon a time, there was a brave knight.'
    );
    expect(savedResponse.openai_response.usage.completion_tokens).toBe(10);
    expect(savedResponse.parent_id).toBe('parent-789');

    console.log('\n✅ VERIFICATION:');
    console.log('================');
    console.log('Accumulated content:', savedResponse.openai_response.choices[0].message.content);
    console.log('Tokens used:', savedResponse.openai_response.usage);
    console.log('Parent ID:', savedResponse.parent_id);
    console.log('Duration:', savedResponse.duration_ms, 'ms');
    console.log('================\n');
  });

  test('should handle empty chunks gracefully', async () => {
    const sessionId = 'test-session-456';
    const chatId = 'test-chat-789';
    sessionRepo.createSession(sessionId, chatId, 'Test', 30000);

    const { id: requestDbId } = requestRepo.createRequest(
      sessionId,
      { messages: [] },
      { chat_id: chatId },
      'qwen-turbo',
      true
    );

    const transformer = new SSETransformer('qwen-turbo');

    // Only finish chunk, no content
    transformer.transformChunk({
      choices: [{
        delta: {
          role: 'assistant',
          content: '',
          status: 'finished'
        }
      }]
    });

    const completeResponse = transformer.getCompleteResponse();
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      null,
      completeResponse,
      null,
      null,
      100,
      'stop',
      null
    );

    const savedResponse = responseRepo.getByResponseId(responseId);
    expect(savedResponse.openai_response.choices[0].message.content).toBe('');
  });

  test('should preserve special characters and formatting', async () => {
    const sessionId = 'test-session-789';
    const chatId = 'test-chat-abc';
    sessionRepo.createSession(sessionId, chatId, 'Test', 30000);

    const { id: requestDbId } = requestRepo.createRequest(
      sessionId,
      { messages: [] },
      { chat_id: chatId },
      'qwen-turbo',
      true
    );

    const transformer = new SSETransformer('qwen-turbo');

    // Chunks with special characters
    const chunks = [
      { choices: [{ delta: { content: 'Here is code:\n\n```javascript\n' } }] },
      { choices: [{ delta: { content: 'function hello() {\n' } }] },
      { choices: [{ delta: { content: '  return "Hello! 👋";\n' } }] },
      { choices: [{ delta: { content: '}\n```' } }] }
    ];

    chunks.forEach(chunk => transformer.transformChunk(chunk));

    const completeResponse = transformer.getCompleteResponse();
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      null,
      completeResponse,
      null,
      null,
      100,
      'stop',
      null
    );

    const savedResponse = responseRepo.getByResponseId(responseId);
    const expectedContent = 'Here is code:\n\n```javascript\nfunction hello() {\n  return "Hello! 👋";\n}\n```';
    expect(savedResponse.openai_response.choices[0].message.content).toBe(expectedContent);

    console.log('\n✅ Special characters preserved:');
    console.log(savedResponse.openai_response.choices[0].message.content);
    console.log('');
  });
});
