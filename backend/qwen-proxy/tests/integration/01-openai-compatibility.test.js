/**
 * Integration Test: OpenAI API Compatibility
 *
 * Tests that the proxy server provides OpenAI-compatible API responses
 * for basic chat completion requests.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Integration: OpenAI API Compatibility', () => {
  // Skip if no API credentials
  beforeAll(() => {
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.warn('⚠️  Skipping integration tests - no API credentials');
      console.warn('   Set QWEN_TOKEN and QWEN_COOKIES in .env to run these tests');
    }
  });

  // Skip tests if no credentials
  const skipIfNoCredentials = () => {
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      return true;
    }
    return false;
  };

  test('Non-streaming completion returns valid OpenAI format', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Non-streaming OpenAI Compatibility ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Say "Hello World" and nothing else.' }
      ],
      stream: false
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Verify HTTP status
    expect(response.status).toBe(200);

    // Verify OpenAI response structure
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('object');
    expect(response.data).toHaveProperty('created');
    expect(response.data).toHaveProperty('model');
    expect(response.data).toHaveProperty('choices');
    expect(response.data).toHaveProperty('usage');

    // Verify object type
    expect(response.data.object).toBe('chat.completion');

    // Verify model
    expect(response.data.model).toBe('qwen3-max');

    // Verify choices array
    expect(Array.isArray(response.data.choices)).toBe(true);
    expect(response.data.choices.length).toBe(1);

    // Verify choice structure
    const choice = response.data.choices[0];
    expect(choice).toHaveProperty('index');
    expect(choice).toHaveProperty('message');
    expect(choice).toHaveProperty('finish_reason');

    // Verify message structure
    expect(choice.message).toHaveProperty('role');
    expect(choice.message).toHaveProperty('content');
    expect(choice.message.role).toBe('assistant');
    expect(typeof choice.message.content).toBe('string');
    expect(choice.message.content.length).toBeGreaterThan(0);

    // Verify finish_reason
    expect(choice.finish_reason).toBe('stop');

    // Verify usage
    expect(response.data.usage).toHaveProperty('prompt_tokens');
    expect(response.data.usage).toHaveProperty('completion_tokens');
    expect(response.data.usage).toHaveProperty('total_tokens');
    expect(typeof response.data.usage.prompt_tokens).toBe('number');
    expect(typeof response.data.usage.completion_tokens).toBe('number');
    expect(response.data.usage.total_tokens).toBe(
      response.data.usage.prompt_tokens + response.data.usage.completion_tokens
    );

    console.log('✅ Response matches OpenAI format');
  }, 30000);

  test('Streaming completion follows SSE format', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Streaming SSE Format ===');

    const response = await axios.post(
      `${BASE_URL}/v1/chat/completions`,
      {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Count from 1 to 3, one number per line.' }
        ],
        stream: true
      },
      {
        responseType: 'stream'
      }
    );

    expect(response.status).toBe(200);

    // Verify SSE headers
    expect(response.headers['content-type']).toContain('text/event-stream');

    const chunks = [];
    let fullContent = '';
    let hasUsage = false;
    let hasDone = false;

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();

            if (dataStr === '[DONE]') {
              hasDone = true;
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              chunks.push(data);

              console.log('Chunk:', JSON.stringify(data, null, 2));

              // Verify chunk structure
              expect(data).toHaveProperty('id');
              expect(data).toHaveProperty('object');
              expect(data).toHaveProperty('created');
              expect(data).toHaveProperty('model');
              expect(data).toHaveProperty('choices');

              // Verify object type
              expect(data.object).toBe('chat.completion.chunk');

              // Verify model
              expect(data.model).toBe('qwen3-max');

              // Verify choices
              expect(Array.isArray(data.choices)).toBe(true);

              if (data.choices.length > 0) {
                const choice = data.choices[0];
                expect(choice).toHaveProperty('index');
                expect(choice).toHaveProperty('delta');
                expect(choice).toHaveProperty('finish_reason');

                // Accumulate content
                if (choice.delta && choice.delta.content) {
                  fullContent += choice.delta.content;
                }
              }

              // Check for usage chunk
              if (data.usage) {
                hasUsage = true;
                expect(data.usage).toHaveProperty('prompt_tokens');
                expect(data.usage).toHaveProperty('completion_tokens');
                expect(data.usage).toHaveProperty('total_tokens');
              }
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log('\nStream ended');
        console.log('Total chunks received:', chunks.length);
        console.log('Full content:', fullContent);
        console.log('Has usage data:', hasUsage);
        console.log('Has [DONE] marker:', hasDone);

        // Verify we received content
        expect(fullContent.length).toBeGreaterThan(0);

        // Verify we received usage data
        expect(hasUsage).toBe(true);

        // Verify [DONE] marker
        expect(hasDone).toBe(true);

        // Verify we received multiple chunks
        expect(chunks.length).toBeGreaterThan(1);

        console.log('✅ Streaming format is valid');
        resolve();
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });
    });
  }, 30000);

  test('Response includes token usage information', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Token Usage Reporting ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'What is 2+2?' }
      ],
      stream: false
    });

    expect(response.status).toBe(200);

    // Verify usage data exists
    expect(response.data.usage).toBeDefined();
    expect(response.data.usage.prompt_tokens).toBeDefined();
    expect(response.data.usage.completion_tokens).toBeDefined();
    expect(response.data.usage.total_tokens).toBeDefined();

    // Verify usage data is reasonable
    expect(response.data.usage.prompt_tokens).toBeGreaterThan(0);
    expect(response.data.usage.completion_tokens).toBeGreaterThan(0);
    expect(response.data.usage.total_tokens).toBeGreaterThan(0);

    // Verify total = prompt + completion
    expect(response.data.usage.total_tokens).toBe(
      response.data.usage.prompt_tokens + response.data.usage.completion_tokens
    );

    console.log('Usage data:', response.data.usage);
    console.log('✅ Token usage correctly reported');
  }, 30000);

  test('Model parameter is preserved in response', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Model Parameter Preservation ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.model).toBe('qwen3-max');

    console.log('Model in response:', response.data.model);
    console.log('✅ Model parameter preserved');
  }, 30000);

  test('Health endpoint returns service status', async () => {
    console.log('\n=== TEST: Health Endpoint ===');

    const response = await axios.get(`${BASE_URL}/health`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('ok');
    expect(response.data).toHaveProperty('sessions');
    expect(typeof response.data.sessions).toBe('number');

    console.log('Health status:', response.data);
    console.log('✅ Health endpoint working');
  }, 10000);

  test('Handles system messages correctly', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: System Message Handling ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that always responds in uppercase.' },
        { role: 'user', content: 'say hello' }
      ],
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('Response:', response.data.choices[0].message.content);
    console.log('✅ System message processed');
  }, 30000);

  test('Response format matches OpenAI SDK expectations', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: OpenAI SDK Format Compatibility ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      stream: false
    });

    // This is what the OpenAI SDK expects
    const expectedKeys = ['id', 'object', 'created', 'model', 'choices', 'usage'];
    for (const key of expectedKeys) {
      expect(response.data).toHaveProperty(key);
      console.log(`✓ Has ${key}:`, response.data[key] !== undefined);
    }

    // Choice structure
    const choice = response.data.choices[0];
    const expectedChoiceKeys = ['index', 'message', 'finish_reason'];
    for (const key of expectedChoiceKeys) {
      expect(choice).toHaveProperty(key);
      console.log(`✓ Choice has ${key}:`, choice[key] !== undefined);
    }

    // Message structure
    const message = choice.message;
    const expectedMessageKeys = ['role', 'content'];
    for (const key of expectedMessageKeys) {
      expect(message).toHaveProperty(key);
      console.log(`✓ Message has ${key}:`, message[key] !== undefined);
    }

    console.log('✅ All expected fields present');
  }, 30000);
});
