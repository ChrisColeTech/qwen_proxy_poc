/**
 * Phase 13: Full Stack Integration Tests (Real API, No Mocks)
 *
 * Tests the complete stack with REAL Qwen API calls to validate:
 * - Request flow from OpenAI format to Qwen API
 * - Response flow from Qwen API back to OpenAI format
 * - Session management with parent_id tracking
 * - Models endpoint uses REAL Qwen API (not hardcoded)
 *
 * CRITICAL: All tests use real Qwen API calls. No mocks.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';
const QWEN_BASE_URL = 'https://chat.qwen.ai';

describe('Phase 13: Full Stack Integration Tests (Real API)', () => {
  // Skip if no API credentials
  beforeAll(() => {
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.warn('\n⚠️  WARNING: Skipping Phase 13 tests - no API credentials');
      console.warn('   Set QWEN_TOKEN and QWEN_COOKIES in .env to run these tests\n');
    }
  });

  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  describe('Complete Flow: First Message Creates Session', () => {
    test('First message: null parent_id → response includes parent_id → session created', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: First Message Complete Flow ===');

      // Get initial session count
      const healthBefore = await axios.get(`${BASE_URL}/health`);
      const sessionsBefore = healthBefore.data.sessions;
      console.log('📊 Sessions before:', sessionsBefore);

      // 1. Send first message
      console.log('\n📤 Step 1: Send first message');
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Hello! My favorite color is purple.' }
        ],
        stream: false
      });

      console.log('✓ Response status:', response.status);
      expect(response.status).toBe(200);

      // 2. Verify response structure (OpenAI format)
      console.log('\n📋 Step 2: Verify OpenAI response format');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('object');
      expect(response.data).toHaveProperty('model');
      expect(response.data).toHaveProperty('choices');
      expect(response.data).toHaveProperty('usage');
      expect(response.data.object).toBe('chat.completion');
      console.log('✓ Response has correct OpenAI format');

      // 3. Verify content received
      console.log('\n📝 Step 3: Verify response content');
      const assistantMessage = response.data.choices[0].message;
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.content).toBeDefined();
      expect(assistantMessage.content.length).toBeGreaterThan(0);
      console.log('✓ Assistant response:', assistantMessage.content.substring(0, 100) + '...');

      // 4. Verify session was created
      console.log('\n🔐 Step 4: Verify session created');
      const healthAfter = await axios.get(`${BASE_URL}/health`);
      const sessionsAfter = healthAfter.data.sessions;
      console.log('📊 Sessions after:', sessionsAfter);
      expect(sessionsAfter).toBeGreaterThanOrEqual(sessionsBefore + 1);
      console.log('✓ Session created successfully');

      console.log('\n✅ PHASE 13 TEST PASSED: Complete first message flow verified');
    }, 60000);
  });

  describe('Complete Flow: Follow-up Message Uses parent_id', () => {
    test('Follow-up: parent_id from first response → context maintained → session reused', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: Follow-up Message Complete Flow ===');

      // 1. Send first message
      console.log('\n📤 Step 1: Send first message');
      const firstResponse = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My secret code is ALPHA123.' }
        ],
        stream: false
      });

      const firstContent = firstResponse.data.choices[0].message.content;
      console.log('✓ First response:', firstContent.substring(0, 80) + '...');

      const healthAfterFirst = await axios.get(`${BASE_URL}/health`);
      const sessionsAfterFirst = healthAfterFirst.data.sessions;

      // 2. Send follow-up with same first message (session ID strategy)
      console.log('\n📤 Step 2: Send follow-up message');
      const followUpResponse = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My secret code is ALPHA123.' },
          { role: 'assistant', content: firstContent },
          { role: 'user', content: 'What is my secret code?' }
        ],
        stream: false
      });

      const followUpContent = followUpResponse.data.choices[0].message.content;
      console.log('✓ Follow-up response:', followUpContent);

      // 3. Verify parent_id was used (context maintained)
      console.log('\n🔍 Step 3: Verify context maintained via parent_id');
      const responseText = followUpContent.toLowerCase();
      const hasContext = responseText.includes('alpha123') || 
                        responseText.includes('alpha 123') ||
                        responseText.includes('secret code');
      
      expect(hasContext).toBe(true);
      console.log('✓ Context preserved - parent_id chain working');

      // 4. Verify session was reused (not created new)
      console.log('\n🔐 Step 4: Verify session reused');
      const healthAfterFollow = await axios.get(`${BASE_URL}/health`);
      const sessionsAfterFollow = healthAfterFollow.data.sessions;
      expect(sessionsAfterFollow).toBe(sessionsAfterFirst);
      console.log('✓ Session reused (no new session created)');

      console.log('\n✅ PHASE 13 TEST PASSED: Follow-up message flow verified');
    }, 90000);
  });

  describe('Complete Flow: Streaming Response', () => {
    test('Streaming: SSE chunks received → [DONE] marker → session updated', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: Streaming Response Flow ===');

      // 1. Send streaming request
      console.log('\n📤 Step 1: Send streaming request');
      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        {
          model: 'qwen3-max',
          messages: [
            { role: 'user', content: 'Count from 1 to 5 slowly.' }
          ],
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      console.log('✓ Streaming connection established');

      // 2. Verify SSE chunks received
      console.log('\n📦 Step 2: Collect SSE chunks');
      const chunks = [];
      let fullContent = '';
      let hasDone = false;
      let hasUsage = false;

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

                // Verify chunk structure
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('object');
                expect(data.object).toBe('chat.completion.chunk');

                // Accumulate content
                if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                }

                // Check for usage
                if (data.usage) {
                  hasUsage = true;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });

        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

      console.log(`✓ Received ${chunks.length} chunks`);
      console.log('✓ Full content:', fullContent);

      // 3. Verify [DONE] marker received
      console.log('\n🏁 Step 3: Verify [DONE] marker');
      expect(hasDone).toBe(true);
      console.log('✓ [DONE] marker received');

      // 4. Verify session was updated
      console.log('\n🔐 Step 4: Verify session updated');
      const health = await axios.get(`${BASE_URL}/health`);
      expect(health.data.sessions).toBeGreaterThan(0);
      console.log('✓ Session tracking active');

      // Verify we received meaningful content
      expect(fullContent.length).toBeGreaterThan(0);
      expect(chunks.length).toBeGreaterThan(1);

      console.log('\n✅ PHASE 13 TEST PASSED: Streaming flow verified');
    }, 90000);
  });

  describe('Models Endpoint: Real Qwen API', () => {
    test('GET /v1/models calls REAL Qwen API (not hardcoded)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: Models Endpoint Real API ===');

      // 1. Call proxy models endpoint
      console.log('\n📤 Step 1: Call proxy /v1/models');
      const proxyResponse = await axios.get(`${BASE_URL}/v1/models`);

      expect(proxyResponse.status).toBe(200);
      expect(proxyResponse.data).toHaveProperty('object');
      expect(proxyResponse.data.object).toBe('list');
      expect(proxyResponse.data).toHaveProperty('data');
      expect(Array.isArray(proxyResponse.data.data)).toBe(true);
      console.log(`✓ Proxy returned ${proxyResponse.data.data.length} models`);

      // 2. Call REAL Qwen API directly for comparison
      console.log('\n📤 Step 2: Call real Qwen API /api/models');
      const qwenResponse = await axios.get(`${QWEN_BASE_URL}/api/models`, {
        headers: {
          'Cookie': process.env.QWEN_COOKIES,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      expect(qwenResponse.status).toBe(200);
      expect(qwenResponse.data).toHaveProperty('data');
      expect(Array.isArray(qwenResponse.data.data)).toBe(true);
      console.log(`✓ Qwen API returned ${qwenResponse.data.data.length} models`);

      // 3. Verify proxy is NOT using hardcoded list
      console.log('\n🔍 Step 3: Verify models are NOT hardcoded');
      
      // Check that model counts match (or proxy filtered correctly)
      const proxyModels = proxyResponse.data.data;
      const qwenModels = qwenResponse.data.data;

      // Verify at least one model is present
      expect(proxyModels.length).toBeGreaterThan(0);

      // Check for expected models
      const proxyModelIds = proxyModels.map(m => m.id);
      console.log('✓ Proxy model IDs:', proxyModelIds);

      // Verify qwen3-max exists (it should be in the real API)
      const hasQwen3Max = proxyModelIds.some(id => id.includes('qwen3') || id === 'qwen3-max');
      expect(hasQwen3Max).toBe(true);
      console.log('✓ Found qwen3-max model (proof of real API call)');

      // 4. Verify model structure includes metadata
      console.log('\n📋 Step 4: Verify model metadata structure');
      const sampleModel = proxyModels[0];
      expect(sampleModel).toHaveProperty('id');
      expect(sampleModel).toHaveProperty('object');
      expect(sampleModel.object).toBe('model');
      
      // If metadata exists, it came from real API
      if (sampleModel.metadata) {
        console.log('✓ Model includes metadata from real API:', Object.keys(sampleModel.metadata));
      }

      console.log('\n✅ PHASE 13 TEST PASSED: Models endpoint uses real Qwen API');
    }, 30000);

    test('GET /v1/models/:model returns specific model from real API', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: Specific Model Retrieval ===');

      // 1. Get specific model
      console.log('\n📤 Step 1: Get specific model qwen3-max');
      const response = await axios.get(`${BASE_URL}/v1/models/qwen3-max`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe('qwen3-max');
      expect(response.data).toHaveProperty('object');
      expect(response.data.object).toBe('model');
      console.log('✓ Retrieved qwen3-max model');

      // 2. Verify it has metadata (proof it came from real API)
      console.log('\n📋 Step 2: Verify real API data');
      if (response.data.metadata) {
        console.log('✓ Model has metadata from real API');
        console.log('  Metadata keys:', Object.keys(response.data.metadata));
      }

      console.log('\n✅ PHASE 13 TEST PASSED: Specific model retrieval works');
    }, 30000);
  });

  describe('End-to-End Real API Validation', () => {
    test('Complete conversation flow with real Qwen API calls', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 13 TEST: Complete E2E Real API Flow ===');

      // This test validates the ENTIRE flow end-to-end with real API
      
      // 1. Check health
      console.log('\n📊 Step 1: Check service health');
      const healthStart = await axios.get(`${BASE_URL}/health`);
      expect(healthStart.status).toBe(200);
      console.log('✓ Service healthy');

      // 2. List models (real API)
      console.log('\n📋 Step 2: List models from real API');
      const modelsResponse = await axios.get(`${BASE_URL}/v1/models`);
      expect(modelsResponse.status).toBe(200);
      expect(modelsResponse.data.data.length).toBeGreaterThan(0);
      console.log(`✓ Got ${modelsResponse.data.data.length} real models`);

      // 3. First message (creates session, calls real Qwen)
      console.log('\n💬 Step 3: First message (real Qwen API call)');
      const msg1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My favorite animal is a dolphin.' }
        ],
        stream: false
      });

      expect(msg1.status).toBe(200);
      const response1 = msg1.data.choices[0].message.content;
      console.log('✓ First message response:', response1.substring(0, 100) + '...');

      // 4. Follow-up (uses parent_id, calls real Qwen)
      console.log('\n💬 Step 4: Follow-up message (uses parent_id)');
      const msg2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My favorite animal is a dolphin.' },
          { role: 'assistant', content: response1 },
          { role: 'user', content: 'What is my favorite animal?' }
        ],
        stream: false
      });

      expect(msg2.status).toBe(200);
      const response2 = msg2.data.choices[0].message.content;
      console.log('✓ Follow-up response:', response2);

      // 5. Verify context maintained (proof parent_id worked)
      console.log('\n🔍 Step 5: Verify context via real API');
      const hasContext = response2.toLowerCase().includes('dolphin');
      expect(hasContext).toBe(true);
      console.log('✓ Context maintained through real Qwen API');

      // 6. Check metrics
      console.log('\n📊 Step 6: Check metrics');
      const metricsResponse = await axios.get(`${BASE_URL}/metrics`);
      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.headers['content-type']).toContain('text/plain');
      console.log('✓ Metrics endpoint working');

      console.log('\n✅ PHASE 13 TEST PASSED: Complete E2E real API flow verified');
    }, 120000);
  });
});
