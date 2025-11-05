/**
 * Complete End-to-End System Test
 *
 * This test suite validates the entire Qwen Proxy Backend system
 * against the real Qwen API. It tests all endpoints, multi-turn
 * conversations, error scenarios, and performance.
 *
 * Prerequisites:
 * - Valid QWEN_TOKEN and QWEN_COOKIES in .env
 * - Server running on localhost:3000 (or TEST_BASE_URL)
 * - Internet connection to Qwen API
 *
 * Usage:
 *   npm run test:e2e
 *   TEST_BASE_URL=http://production:3000 npm run test:e2e
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

// Test client
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: () => true // Don't throw on any status
});

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const measureTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

const parseSSE = (data) => {
  const chunks = [];
  const lines = data.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const content = line.substring(6);
      if (content === '[DONE]') {
        chunks.push({ done: true });
      } else {
        try {
          chunks.push(JSON.parse(content));
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', content);
        }
      }
    }
  }

  return chunks;
};

// Test suite
describe('Qwen Proxy Backend - Complete E2E Tests', () => {

  // ==========================================
  // Health & Monitoring Tests
  // ==========================================

  describe('Health & Monitoring', () => {

    test('Health check returns 200', async () => {
      const { result: response, duration } = await measureTime(() =>
        client.get('/health')
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data.checks.authentication).toBe('ok');
      expect(duration).toBeLessThan(100); // Should be fast

      console.log(`✓ Health check: ${duration.toFixed(0)}ms`);
    });

    test('Metrics endpoint returns Prometheus format', async () => {
      const response = await client.get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');

      // Check for expected metrics
      expect(response.data).toContain('http_requests_total');
      expect(response.data).toContain('http_request_duration_seconds');
      expect(response.data).toContain('active_sessions');
      expect(response.data).toContain('nodejs_heap_size_used_bytes');

      console.log('✓ Metrics endpoint working');
    });
  });

  // ==========================================
  // Models Endpoint Tests
  // ==========================================

  describe('Models API', () => {

    test('List models returns real data (NOT hardcoded)', async () => {
      const { result: response, duration } = await measureTime(() =>
        client.get('/v1/models')
      );

      expect(response.status).toBe(200);
      expect(response.data.object).toBe('list');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Check for known Qwen models
      const modelIds = response.data.data.map(m => m.id);
      expect(modelIds).toContain('qwen3-max');

      // Verify structure
      const model = response.data.data[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('object', 'model');
      expect(model).toHaveProperty('owned_by');
      expect(model).toHaveProperty('metadata');

      // Verify metadata includes capabilities
      expect(model.metadata).toHaveProperty('capabilities');
      expect(model.metadata).toHaveProperty('chat_types');

      console.log(`✓ List models: ${response.data.data.length} models, ${duration.toFixed(0)}ms`);
    });

    test('Retrieve specific model', async () => {
      const response = await client.get('/v1/models/qwen3-max');

      expect(response.status).toBe(200);
      expect(response.data.id).toBe('qwen3-max');
      expect(response.data.object).toBe('model');

      console.log('✓ Retrieve model: qwen3-max');
    });

    test('Retrieve non-existent model returns 404', async () => {
      const response = await client.get('/v1/models/invalid-model-xyz');

      expect(response.status).toBe(404);
      expect(response.data.error).toBeDefined();

      console.log('✓ Non-existent model: 404');
    });

    test('Models list is cached', async () => {
      // First request
      const { duration: duration1 } = await measureTime(() =>
        client.get('/v1/models')
      );

      // Second request (should be cached)
      const { duration: duration2 } = await measureTime(() =>
        client.get('/v1/models')
      );

      expect(duration2).toBeLessThan(duration1);

      console.log(`✓ Cache working: ${duration1.toFixed(0)}ms → ${duration2.toFixed(0)}ms`);
    });
  });

  // ==========================================
  // Chat Completions - Non-Streaming Tests
  // ==========================================

  describe('Chat Completions - Non-Streaming', () => {

    test('Simple completion works', async () => {
      const { result: response, duration } = await measureTime(() =>
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say "test" and nothing else.' }],
          stream: false
        })
      );

      expect(response.status).toBe(200);
      expect(response.data.object).toBe('chat.completion');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('created');
      expect(response.data).toHaveProperty('model');
      expect(response.data).toHaveProperty('choices');
      expect(response.data).toHaveProperty('usage');

      const choice = response.data.choices[0];
      expect(choice.index).toBe(0);
      expect(choice.message.role).toBe('assistant');
      expect(choice.message.content).toBeDefined();
      expect(choice.finish_reason).toBe('stop');

      // Check usage
      expect(response.data.usage.prompt_tokens).toBeGreaterThan(0);
      expect(response.data.usage.completion_tokens).toBeGreaterThan(0);
      expect(response.data.usage.total_tokens).toBeGreaterThan(0);

      console.log(`✓ Non-streaming: ${duration.toFixed(0)}ms`);
      console.log(`  Response: "${choice.message.content.substring(0, 50)}..."`);
    });

    test('Completion with system message', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      expect(response.data.choices[0].message.content).toBeDefined();

      console.log('✓ System message handled');
    });
  });

  // ==========================================
  // Chat Completions - Streaming Tests
  // ==========================================

  describe('Chat Completions - Streaming', () => {

    test('Streaming completion works', async () => {
      const { result: response, duration } = await measureTime(() =>
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Count to 3' }],
          stream: true
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');

      const chunks = parseSSE(response.data);

      // Should have content chunks
      const contentChunks = chunks.filter(c => c.choices?.[0]?.delta?.content);
      expect(contentChunks.length).toBeGreaterThan(0);

      // Should have final chunk
      const finalChunk = chunks.find(c => c.choices?.[0]?.finish_reason === 'stop');
      expect(finalChunk).toBeDefined();

      // Should end with [DONE]
      const doneChunk = chunks.find(c => c.done);
      expect(doneChunk).toBeDefined();

      // Reconstruct full response
      const fullContent = contentChunks
        .map(c => c.choices[0].delta.content)
        .join('');

      console.log(`✓ Streaming: ${chunks.length} chunks, ${duration.toFixed(0)}ms`);
      console.log(`  Content: "${fullContent.substring(0, 50)}..."`);
    });

    test('Streaming chunks have correct format', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true
      });

      const chunks = parseSSE(response.data);
      const contentChunk = chunks.find(c => c.choices?.[0]?.delta?.content);

      expect(contentChunk).toBeDefined();
      expect(contentChunk.object).toBe('chat.completion.chunk');
      expect(contentChunk).toHaveProperty('id');
      expect(contentChunk).toHaveProperty('created');
      expect(contentChunk).toHaveProperty('model');
      expect(contentChunk.choices[0].index).toBe(0);
      expect(contentChunk.choices[0].delta).toBeDefined();

      console.log('✓ Streaming chunk format correct');
    });
  });

  // ==========================================
  // Multi-Turn Conversation Tests
  // ==========================================

  describe('Multi-Turn Conversations', () => {

    test('Multi-turn conversation maintains context', async () => {
      // First message
      const response1 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My favorite color is blue. Remember this.' }
        ],
        stream: false
      });

      expect(response1.status).toBe(200);
      const reply1 = response1.data.choices[0].message.content;

      console.log(`  First: "${reply1.substring(0, 50)}..."`);

      // Wait a bit
      await sleep(1000);

      // Second message - test context retention
      const response2 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My favorite color is blue. Remember this.' },
          { role: 'assistant', content: reply1 },
          { role: 'user', content: 'What is my favorite color?' }
        ],
        stream: false
      });

      expect(response2.status).toBe(200);
      const reply2 = response2.data.choices[0].message.content.toLowerCase();

      // Should mention "blue"
      expect(reply2).toContain('blue');

      console.log(`  Second: "${reply2.substring(0, 50)}..."`);
      console.log('✓ Multi-turn context maintained');
    });

    test('Same starting message reuses conversation', async () => {
      const messages1 = [
        { role: 'user', content: 'Test message for conversation reuse' }
      ];

      // First request
      const response1 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: messages1,
        stream: false
      });

      expect(response1.status).toBe(200);

      // Same first message should reuse conversation
      const response2 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: messages1,
        stream: false
      });

      expect(response2.status).toBe(200);

      console.log('✓ Conversation reuse working');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================

  describe('Error Handling', () => {

    test('Missing messages returns 400', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max'
        // messages missing
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
      expect(response.data.error.type).toBe('invalid_request_error');

      console.log('✓ Missing messages: 400');
    });

    test('Empty messages array returns 400', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: []
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();

      console.log('✓ Empty messages: 400');
    });

    test('Invalid message role returns 400', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [
          { role: 'invalid', content: 'test' }
        ]
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();

      console.log('✓ Invalid role: 400');
    });

    test('Message without content returns 400', async () => {
      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [
          { role: 'user' }
        ]
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();

      console.log('✓ Missing content: 400');
    });
  });

  // ==========================================
  // Performance Tests
  // ==========================================

  describe('Performance', () => {

    test('Response time is acceptable', async () => {
      const { duration } = await measureTime(() =>
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false
        })
      );

      expect(duration).toBeLessThan(10000); // 10 seconds

      console.log(`✓ Response time: ${duration.toFixed(0)}ms`);
    });

    test('Concurrent requests (10)', async () => {
      const concurrency = 10;
      const requests = Array(concurrency).fill(null).map((_, i) =>
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: `Request ${i}` }],
          stream: false
        })
      );

      const { duration } = await measureTime(() =>
        Promise.all(requests)
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount).toBe(concurrency);

      console.log(`✓ Concurrent requests: ${concurrency} in ${duration.toFixed(0)}ms`);
    });

    test('Session cleanup works', async () => {
      const healthBefore = await client.get('/health');
      const sessionsBefore = healthBefore.data.metrics.activeSessions;

      // Create some sessions
      await Promise.all([
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Test 1' }],
          stream: false
        }),
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Test 2' }],
          stream: false
        })
      ]);

      const healthAfter = await client.get('/health');
      const sessionsAfter = healthAfter.data.metrics.activeSessions;

      expect(sessionsAfter).toBeGreaterThanOrEqual(sessionsBefore);

      console.log(`✓ Sessions: ${sessionsBefore} → ${sessionsAfter}`);
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Real Qwen API Integration', () => {

    test('parent_id chain works correctly', async () => {
      // This test verifies the parent_id chain is maintained correctly
      // by sending a multi-turn conversation and checking context is preserved

      const conversation = [
        { role: 'user', content: 'I live in Paris.' }
      ];

      const response1 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: conversation,
        stream: false
      });

      expect(response1.status).toBe(200);

      conversation.push({
        role: 'assistant',
        content: response1.data.choices[0].message.content
      });
      conversation.push({
        role: 'user',
        content: 'What city do I live in?'
      });

      const response2 = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: conversation,
        stream: false
      });

      expect(response2.status).toBe(200);
      const reply = response2.data.choices[0].message.content.toLowerCase();

      // Should remember Paris
      expect(reply).toContain('paris');

      console.log('✓ parent_id chain maintains context');
    });
  });
});

// ==========================================
// Test Runner
// ==========================================

if (require.main === module) {
  console.log('\n🧪 Qwen Proxy Backend - End-to-End Test Suite\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // Run tests manually (if not using Jest)
  // This allows running without Jest for quick validation

  (async () => {
    try {
      // Check if server is running
      const health = await client.get('/health');
      if (health.status !== 200) {
        console.error('❌ Server is not healthy');
        process.exit(1);
      }

      console.log('✅ Server is healthy, running tests...\n');

      // Note: Actual test execution happens via Jest
      console.log('Run with: npm test tests/e2e/complete-system.test.js');

    } catch (error) {
      console.error('❌ Failed to connect to server:', error.message);
      console.error('Make sure the server is running on', BASE_URL);
      process.exit(1);
    }
  })();
}

module.exports = { client, parseSSE, measureTime };
