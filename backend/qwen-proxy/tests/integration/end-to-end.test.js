/**
 * Phase 13: End-to-End Integration Tests
 *
 * Tests that all endpoints work together as a complete system.
 * Validates the proxy server provides complete OpenAI-compatible API.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Phase 13: End-to-End System Integration', () => {
  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  describe('Health and Monitoring Endpoints', () => {
    test('GET /health returns service status', async () => {
      console.log('\n=== E2E TEST: Health Endpoint ===');

      const response = await axios.get(`${BASE_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('ok');
      expect(response.data).toHaveProperty('sessions');
      expect(typeof response.data.sessions).toBe('number');
      expect(response.data.sessions).toBeGreaterThanOrEqual(0);

      console.log('✓ Health check:', response.data);
      console.log('✅ E2E TEST PASSED: Health endpoint');
    }, 10000);

    test('GET /metrics returns Prometheus metrics', async () => {
      console.log('\n=== E2E TEST: Metrics Endpoint ===');

      const response = await axios.get(`${BASE_URL}/metrics`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      const metrics = response.data;
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);

      // Verify it contains expected metric types
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');

      console.log('✓ Metrics available (length:', metrics.length, 'bytes)');
      console.log('✅ E2E TEST PASSED: Metrics endpoint');
    }, 10000);
  });

  describe('Models Endpoints', () => {
    test('GET /v1/models lists all available models', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Models List ===');

      const response = await axios.get(`${BASE_URL}/v1/models`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('object');
      expect(response.data.object).toBe('list');
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Verify model structure
      const model = response.data.data[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('object');
      expect(model.object).toBe('model');

      console.log(`✓ Found ${response.data.data.length} models`);
      console.log('✓ Model IDs:', response.data.data.map(m => m.id).join(', '));
      console.log('✅ E2E TEST PASSED: Models list');
    }, 30000);

    test('GET /v1/models/:model retrieves specific model', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Specific Model ===');

      const response = await axios.get(`${BASE_URL}/v1/models/qwen3-max`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe('qwen3-max');
      expect(response.data).toHaveProperty('object');
      expect(response.data.object).toBe('model');

      console.log('✓ Retrieved model:', response.data.id);
      console.log('✅ E2E TEST PASSED: Specific model');
    }, 30000);
  });

  describe('Chat Completions Endpoints', () => {
    test('POST /v1/chat/completions (non-streaming) works end-to-end', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Non-Streaming Chat Completions ===');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Say "test successful" and nothing else.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('object');
      expect(response.data.object).toBe('chat.completion');
      expect(response.data).toHaveProperty('model');
      expect(response.data).toHaveProperty('choices');
      expect(response.data).toHaveProperty('usage');

      const message = response.data.choices[0].message;
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message.role).toBe('assistant');

      console.log('✓ Response:', message.content);
      console.log('✅ E2E TEST PASSED: Non-streaming chat completions');
    }, 60000);

    test('POST /v1/chat/completions (streaming) works end-to-end', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Streaming Chat Completions ===');

      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        {
          model: 'qwen3-max',
          messages: [
            { role: 'user', content: 'Count from 1 to 3.' }
          ],
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');

      const chunks = [];
      let fullContent = '';
      let hasDone = false;

      await new Promise((resolve, reject) => {
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

                if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        });

        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(fullContent.length).toBeGreaterThan(0);
      expect(hasDone).toBe(true);

      console.log(`✓ Received ${chunks.length} chunks`);
      console.log('✓ Full content:', fullContent);
      console.log('✅ E2E TEST PASSED: Streaming chat completions');
    }, 60000);
  });

  describe('Legacy Completions Endpoint', () => {
    test('POST /v1/completions works end-to-end', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Legacy Completions ===');

      const response = await axios.post(`${BASE_URL}/v1/completions`, {
        model: 'qwen3-max',
        prompt: 'Say "legacy endpoint works"',
        stream: false
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('object');
      expect(response.data.object).toBe('text_completion');
      expect(response.data).toHaveProperty('choices');

      const choice = response.data.choices[0];
      expect(choice).toHaveProperty('text');
      expect(choice.text.length).toBeGreaterThan(0);

      console.log('✓ Response:', choice.text);
      console.log('✅ E2E TEST PASSED: Legacy completions');
    }, 60000);
  });

  describe('Complete System Integration', () => {
    test('All endpoints work together in sequence', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== E2E TEST: Complete System Integration ===');

      // 1. Health check
      console.log('\n→ Step 1: Health check');
      const health1 = await axios.get(`${BASE_URL}/health`);
      expect(health1.status).toBe(200);
      const sessionsBefore = health1.data.sessions;
      console.log('  ✓ Service healthy, sessions:', sessionsBefore);

      // 2. List models
      console.log('\n→ Step 2: List models');
      const models = await axios.get(`${BASE_URL}/v1/models`);
      expect(models.status).toBe(200);
      expect(models.data.data.length).toBeGreaterThan(0);
      console.log('  ✓ Found', models.data.data.length, 'models');

      // 3. Get specific model
      console.log('\n→ Step 3: Get specific model');
      const model = await axios.get(`${BASE_URL}/v1/models/qwen3-max`);
      expect(model.status).toBe(200);
      expect(model.data.id).toBe('qwen3-max');
      console.log('  ✓ Retrieved qwen3-max');

      // 4. Send first chat message
      console.log('\n→ Step 4: First chat message');
      const chat1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My lucky number is 888.' }
        ],
        stream: false
      });
      expect(chat1.status).toBe(200);
      const response1 = chat1.data.choices[0].message.content;
      console.log('  ✓ Response:', response1.substring(0, 80) + '...');

      // 5. Check sessions increased
      console.log('\n→ Step 5: Verify session created');
      const health2 = await axios.get(`${BASE_URL}/health`);
      expect(health2.data.sessions).toBeGreaterThan(sessionsBefore);
      console.log('  ✓ Sessions increased:', sessionsBefore, '→', health2.data.sessions);

      // 6. Send follow-up message
      console.log('\n→ Step 6: Follow-up message');
      const chat2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My lucky number is 888.' },
          { role: 'assistant', content: response1 },
          { role: 'user', content: 'What is my lucky number?' }
        ],
        stream: false
      });
      expect(chat2.status).toBe(200);
      const response2 = chat2.data.choices[0].message.content;
      console.log('  ✓ Response:', response2);

      // 7. Verify context maintained
      console.log('\n→ Step 7: Verify context');
      const hasContext = response2.toLowerCase().includes('888');
      expect(hasContext).toBe(true);
      console.log('  ✓ Context preserved');

      // 8. Check metrics
      console.log('\n→ Step 8: Check metrics');
      const metrics = await axios.get(`${BASE_URL}/metrics`);
      expect(metrics.status).toBe(200);
      expect(metrics.data.length).toBeGreaterThan(0);
      console.log('  ✓ Metrics available');

      // 9. Test streaming
      console.log('\n→ Step 9: Streaming request');
      const stream = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        {
          model: 'qwen3-max',
          messages: [
            { role: 'user', content: 'Say hi.' }
          ],
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      let streamChunks = 0;
      await new Promise((resolve) => {
        stream.data.on('data', () => streamChunks++);
        stream.data.on('end', resolve);
      });

      expect(streamChunks).toBeGreaterThan(0);
      console.log('  ✓ Streaming works, received', streamChunks, 'chunks');

      console.log('\n✅ E2E TEST PASSED: Complete system integration verified');
    }, 180000);
  });
});
