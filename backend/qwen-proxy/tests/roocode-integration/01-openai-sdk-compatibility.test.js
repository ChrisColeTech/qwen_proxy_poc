/**
 * Roocode Integration Test 1: OpenAI SDK Compatibility
 *
 * Tests that our proxy works with the REAL OpenAI SDK client
 * (the same SDK that Roocode uses)
 *
 * NO MOCKS - Uses actual OpenAI SDK with our proxy server
 */

require('dotenv').config();
const OpenAI = require('openai');
const request = require('supertest');
const proxyApp = require('../../proxy-server');

describe('Roocode Integration: OpenAI SDK Compatibility', () => {
  let server;
  let serverUrl;
  let openaiClient;

  beforeAll((done) => {
    // Start proxy server
    server = proxyApp.listen(0, () => {
      const port = server.address().port;
      serverUrl = `http://localhost:${port}`;
      console.log(`Test proxy server running on ${serverUrl}`);

      // Create OpenAI client pointing to our proxy
      openaiClient = new OpenAI({
        apiKey: 'dummy-key', // Our proxy doesn't check API keys yet
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

  test('OpenAI SDK can create non-streaming completion', async () => {
    console.log('\n=== TEST: Non-streaming completion with OpenAI SDK ===');

    const response = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Say hello in exactly 2 words' }
      ],
      stream: false
    });

    console.log('Response:', JSON.stringify(response, null, 2));

    // Verify OpenAI SDK response structure
    expect(response.id).toBeDefined();
    expect(response.object).toBe('chat.completion');
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.role).toBe('assistant');
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.usage).toBeDefined();
    expect(response.usage.prompt_tokens).toBeGreaterThan(0);
    expect(response.usage.completion_tokens).toBeGreaterThan(0);

    console.log('\nAssistant response:', response.choices[0].message.content);
    console.log('=== TEST PASSED ===\n');
  }, 30000);

  test('OpenAI SDK can create streaming completion', async () => {
    console.log('\n=== TEST: Streaming completion with OpenAI SDK ===');

    const stream = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Count from 1 to 3' }
      ],
      stream: true,
      stream_options: { include_usage: true }
    });

    let fullContent = '';
    let chunkCount = 0;
    let hasUsage = false;

    for await (const chunk of stream) {
      chunkCount++;
      console.log('Chunk:', JSON.stringify(chunk));

      // Verify chunk structure
      expect(chunk.object).toBe('chat.completion.chunk');
      expect(chunk.choices).toBeDefined();

      if (chunk.choices[0]?.delta?.content) {
        fullContent += chunk.choices[0].delta.content;
      }

      if (chunk.usage) {
        hasUsage = true;
        expect(chunk.usage.prompt_tokens).toBeGreaterThan(0);
        expect(chunk.usage.completion_tokens).toBeGreaterThan(0);
      }
    }

    console.log('\nFull response:', fullContent);
    console.log('Total chunks:', chunkCount);
    console.log('Has usage data:', hasUsage);

    expect(fullContent).toBeTruthy();
    expect(chunkCount).toBeGreaterThan(0);

    console.log('=== TEST PASSED ===\n');
  }, 30000);

  test('OpenAI SDK maintains conversation context', async () => {
    console.log('\n=== TEST: Conversation context with OpenAI SDK ===');

    // First message
    const response1 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is blue. Remember this.' }
      ],
      stream: false
    });

    console.log('First response:', response1.choices[0].message.content);

    // Second message - tests context preservation
    const response2 = await openaiClient.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is blue. Remember this.' },
        { role: 'assistant', content: response1.choices[0].message.content },
        { role: 'user', content: 'What is my favorite color?' }
      ],
      stream: false
    });

    console.log('Second response:', response2.choices[0].message.content);

    // Should mention "blue" in the response
    expect(response2.choices[0].message.content.toLowerCase()).toContain('blue');

    console.log('=== TEST PASSED ===\n');
  }, 60000);
});
