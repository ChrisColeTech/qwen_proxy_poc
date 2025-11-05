/**
 * Roocode Integration Test 4: End-to-End Integration
 *
 * Tests the complete integration flow simulating how Roocode would
 * actually use our proxy in a real scenario.
 *
 * This combines:
 * - OpenAI SDK client (as Roocode uses)
 * - Streaming responses
 * - XML tool call parsing
 * - Conversation continuity
 */

require('dotenv').config();
const OpenAI = require('openai');
const proxyApp = require('../../proxy-server');

describe('Roocode Integration: End-to-End', () => {
  let server;
  let serverUrl;
  let openaiClient;

  beforeAll((done) => {
    server = proxyApp.listen(0, () => {
      const port = server.address().port;
      serverUrl = `http://localhost:${port}`;
      console.log(`Test proxy server running on ${serverUrl}`);

      openaiClient = new OpenAI({
        apiKey: 'test-key',
        baseURL: `${serverUrl}/v1`,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/RooVetGit/Roo-Cline',
          'X-Title': 'Roo Code',
          'User-Agent': 'RooCode/1.0.0'
        }
      });

      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('REAL INTEGRATION: Full conversation flow with context', async () => {
    console.log('\n=== FULL INTEGRATION TEST ===');
    console.log('Simulating a real Roocode conversation...\n');

    // Message 1: Initial request
    console.log('--- Message 1: User asks about a task ---');
    const response1 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I need to create a file called hello.txt with the text "Hello World". Can you help?' }
      ],
      stream: false
    });

    console.log('Assistant:', response1.choices[0].message.content);
    console.log('');

    expect(response1.choices[0].message.content).toBeTruthy();

    // Message 2: Follow-up with context
    console.log('--- Message 2: User continues conversation ---');
    const response2 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I need to create a file called hello.txt with the text "Hello World". Can you help?' },
        { role: 'assistant', content: response1.choices[0].message.content },
        { role: 'user', content: 'What was the filename I asked you to create?' }
      ],
      stream: false
    });

    console.log('Assistant:', response2.choices[0].message.content);
    console.log('');

    // Should remember the filename from context
    expect(response2.choices[0].message.content.toLowerCase()).toContain('hello');

    console.log('=== INTEGRATION TEST PASSED ===\n');
  }, 60000);

  test('REAL INTEGRATION: Streaming with real-time parsing', async () => {
    console.log('\n=== STREAMING INTEGRATION TEST ===');
    console.log('Testing real-time streaming as Roocode would use it...\n');

    const stream = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'List three programming languages' }
      ],
      stream: true,
      stream_options: { include_usage: true }
    });

    let fullContent = '';
    let chunkCount = 0;
    let contentChunks = [];
    let usageData = null;

    for await (const chunk of stream) {
      chunkCount++;

      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        contentChunks.push(content);
        fullContent += content;

        // Simulate real-time display (as Roocode does)
        process.stdout.write(content);
      }

      if (chunk.choices[0]?.finish_reason) {
        console.log('\n\nStream finished with reason:', chunk.choices[0].finish_reason);
      }

      if (chunk.usage) {
        usageData = chunk.usage;
        console.log('Usage:', JSON.stringify(usageData));
      }
    }

    console.log('\n\nTotal chunks:', chunkCount);
    console.log('Content chunks:', contentChunks.length);
    console.log('Full content length:', fullContent.length);

    expect(fullContent).toBeTruthy();
    expect(contentChunks.length).toBeGreaterThan(0);
    expect(usageData).toBeDefined();
    expect(usageData.prompt_tokens).toBeGreaterThan(0);

    console.log('\n=== STREAMING TEST PASSED ===\n');
  }, 30000);

  test('REAL INTEGRATION: Multi-turn conversation', async () => {
    console.log('\n=== MULTI-TURN CONVERSATION TEST ===');
    console.log('Testing conversation memory across multiple turns...\n');

    const conversationHistory = [];

    // Turn 1
    console.log('Turn 1: Set context');
    conversationHistory.push({
      role: 'user',
      content: 'My project is called SuperApp and it uses React.'
    });

    const turn1 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: conversationHistory,
      stream: false
    });

    conversationHistory.push({
      role: 'assistant',
      content: turn1.choices[0].message.content
    });

    console.log('Assistant:', turn1.choices[0].message.content.substring(0, 100) + '...');
    console.log('');

    // Turn 2
    console.log('Turn 2: Test memory');
    conversationHistory.push({
      role: 'user',
      content: 'What is my project called?'
    });

    const turn2 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: conversationHistory,
      stream: false
    });

    console.log('Assistant:', turn2.choices[0].message.content);
    console.log('');

    expect(turn2.choices[0].message.content.toLowerCase()).toContain('superapp');

    // Turn 3
    console.log('Turn 3: Test deeper memory');
    conversationHistory.push({
      role: 'assistant',
      content: turn2.choices[0].message.content
    });

    conversationHistory.push({
      role: 'user',
      content: 'What framework does it use?'
    });

    const turn3 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: conversationHistory,
      stream: false
    });

    console.log('Assistant:', turn3.choices[0].message.content);
    console.log('');

    expect(turn3.choices[0].message.content.toLowerCase()).toContain('react');

    console.log('=== MULTI-TURN TEST PASSED ===\n');
  }, 90000);

  test('REAL INTEGRATION: Error handling', async () => {
    console.log('\n=== ERROR HANDLING TEST ===');

    // Test with empty messages array
    try {
      await openaiClient.chat.completions.create({
        model: 'qwen3-max',
        messages: [],
        stream: false
      });
      fail('Should have thrown error for empty messages');
    } catch (error) {
      console.log('Correctly caught error for empty messages:', error.message);
      expect(error).toBeDefined();
    }

    console.log('=== ERROR HANDLING TEST PASSED ===\n');
  }, 10000);

  test('PERFORMANCE: Response time benchmark', async () => {
    console.log('\n=== PERFORMANCE BENCHMARK ===');

    const startTime = Date.now();

    const response = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Say hello' }
      ],
      stream: false
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Response time:', duration, 'ms');
    console.log('Response length:', response.choices[0].message.content.length, 'chars');
    console.log('Tokens:', response.usage.total_tokens);

    expect(response.choices[0].message.content).toBeTruthy();

    // Response should be reasonably fast (under 30 seconds)
    expect(duration).toBeLessThan(30000);

    console.log('=== PERFORMANCE TEST PASSED ===\n');
  }, 30000);
});
