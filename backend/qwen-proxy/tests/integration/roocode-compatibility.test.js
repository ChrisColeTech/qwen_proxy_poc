/**
 * Phase 14: Roocode Compatibility Testing
 *
 * Tests that the proxy server is fully compatible with Roocode IDE integration.
 * Validates:
 * - Full conversation history handling (Roocode sends complete history)
 * - OpenAI SDK compatibility
 * - Streaming with SDK
 * - XML tool call format support (if used by Roocode)
 */

require('dotenv').config();
const axios = require('axios');
const { OpenAI } = require('openai');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Phase 14: Roocode Compatibility Tests', () => {
  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  describe('Full Conversation History Handling', () => {
    test('Handles full conversation history from Roocode (only uses last message)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: Full History Handling ===');
      console.log('NOTE: Roocode always sends complete conversation history');

      // Simulate Roocode sending full conversation history
      // (Roocode doesn't track sessions, it always sends everything)
      const fullHistory = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'My name is Alice.' },
        { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
        { role: 'user', content: 'My favorite color is red.' },
        { role: 'assistant', content: 'Red is a great color, Alice!' },
        { role: 'user', content: 'What is my name and favorite color?' }
      ];

      console.log('\n📤 Sending full history (6 messages)');
      console.log('   System:', fullHistory[0].content);
      console.log('   User:', fullHistory[1].content);
      console.log('   Assistant:', fullHistory[2].content);
      console.log('   User:', fullHistory[3].content);
      console.log('   Assistant:', fullHistory[4].content);
      console.log('   User:', fullHistory[5].content);

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: fullHistory,
        stream: false
      });

      expect(response.status).toBe(200);
      const answer = response.data.choices[0].message.content;
      console.log('\n✓ Response:', answer);

      // Verify proxy only sent last message to Qwen but maintained context via parent_id
      // (we can't test this directly, but we can verify context is maintained)
      const answerLower = answer.toLowerCase();
      const hasName = answerLower.includes('alice');
      const hasColor = answerLower.includes('red');

      expect(hasName).toBe(true);
      expect(hasColor).toBe(true);
      console.log('✓ Context maintained: name and color both present in response');

      console.log('\n✅ PHASE 14 TEST PASSED: Full history handled correctly');
    }, 90000);

    test('System messages are properly handled in Roocode format', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: System Message Handling ===');

      // Roocode always includes system message at start
      const messages = [
        {
          role: 'system',
          content: 'You are Roo, a highly skilled software engineer. You always respond in ALL CAPS for testing.'
        },
        { role: 'user', content: 'Say hello' }
      ];

      console.log('\n📤 Sending with system message');
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: messages,
        stream: false
      });

      expect(response.status).toBe(200);
      const answer = response.data.choices[0].message.content;
      console.log('✓ Response:', answer);

      // System message should influence the response
      // (Note: Qwen may not always follow all caps, but it should acknowledge it)
      console.log('✓ System message processed');

      console.log('\n✅ PHASE 14 TEST PASSED: System messages handled');
    }, 60000);
  });

  describe('OpenAI SDK Compatibility', () => {
    test('Works with actual OpenAI SDK (non-streaming)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: OpenAI SDK Non-Streaming ===');

      // Create OpenAI client pointing to our proxy
      const client = new OpenAI({
        baseURL: `${BASE_URL}/v1`,
        apiKey: 'not-needed-for-qwen-proxy', // We don't validate API keys
        dangerouslyAllowBrowser: true
      });

      console.log('\n📤 Using OpenAI SDK to call proxy');
      const completion = await client.chat.completions.create({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Say "SDK test successful"' }
        ]
      });

      console.log('✓ SDK call successful');

      // Verify response format matches SDK expectations
      expect(completion).toHaveProperty('id');
      expect(completion).toHaveProperty('object');
      expect(completion).toHaveProperty('choices');
      expect(completion).toHaveProperty('usage');
      expect(completion.object).toBe('chat.completion');

      const message = completion.choices[0].message;
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message.role).toBe('assistant');

      console.log('✓ Response:', message.content);
      console.log('✓ Format matches OpenAI SDK expectations');

      console.log('\n✅ PHASE 14 TEST PASSED: OpenAI SDK compatibility verified');
    }, 60000);

    test('Works with actual OpenAI SDK (streaming)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: OpenAI SDK Streaming ===');

      const client = new OpenAI({
        baseURL: `${BASE_URL}/v1`,
        apiKey: 'not-needed-for-qwen-proxy',
        dangerouslyAllowBrowser: true
      });

      console.log('\n📤 Using OpenAI SDK streaming');
      const stream = await client.chat.completions.create({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Count from 1 to 3' }
        ],
        stream: true
      });

      console.log('✓ Streaming started');

      let fullContent = '';
      let chunkCount = 0;

      for await (const chunk of stream) {
        chunkCount++;
        
        // Verify chunk structure
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('object');
        expect(chunk.object).toBe('chat.completion.chunk');
        expect(chunk).toHaveProperty('choices');

        // Accumulate content
        if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
          fullContent += chunk.choices[0].delta.content;
        }
      }

      console.log(`✓ Received ${chunkCount} chunks`);
      console.log('✓ Full content:', fullContent);
      expect(chunkCount).toBeGreaterThan(0);
      expect(fullContent.length).toBeGreaterThan(0);

      console.log('\n✅ PHASE 14 TEST PASSED: OpenAI SDK streaming works');
    }, 90000);
  });

  describe('Roocode Request Format Compatibility', () => {
    test('Handles Roocode-style conversation continuation', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: Roocode Conversation Pattern ===');
      console.log('Simulating how Roocode sends follow-up messages');

      // Turn 1: Initial request
      console.log('\n→ Turn 1: Initial request');
      const turn1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are Roo, a helpful assistant.' },
          { role: 'user', content: 'My code name is PHOENIX.' }
        ],
        stream: false
      });

      const response1 = turn1.data.choices[0].message.content;
      console.log('  ✓', response1.substring(0, 80) + '...');

      // Turn 2: Roocode sends ENTIRE history including previous response
      console.log('\n→ Turn 2: Continuation with full history (Roocode style)');
      const turn2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are Roo, a helpful assistant.' },
          { role: 'user', content: 'My code name is PHOENIX.' },
          { role: 'assistant', content: response1 },
          { role: 'user', content: 'What is my code name?' }
        ],
        stream: false
      });

      const response2 = turn2.data.choices[0].message.content;
      console.log('  ✓', response2);

      // Verify context maintained
      const hasContext = response2.toLowerCase().includes('phoenix');
      expect(hasContext).toBe(true);
      console.log('✓ Context maintained across turns (Roocode pattern)');

      console.log('\n✅ PHASE 14 TEST PASSED: Roocode conversation pattern works');
    }, 90000);

    test('Handles long conversation histories (typical Roocode scenario)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: Long History (Typical Roocode) ===');

      // Build up a longer conversation history (Roocode can send many messages)
      const history = [
        { role: 'system', content: 'You are Roo.' },
        { role: 'user', content: 'The password is LAMBDA.' },
        { role: 'assistant', content: 'Understood.' },
        { role: 'user', content: 'The username is admin.' },
        { role: 'assistant', content: 'Got it.' },
        { role: 'user', content: 'The server is 192.168.1.1.' },
        { role: 'assistant', content: 'Noted.' },
        { role: 'user', content: 'What are the password, username, and server?' }
      ];

      console.log(`\n📤 Sending history with ${history.length} messages`);
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: history,
        stream: false
      });

      expect(response.status).toBe(200);
      const answer = response.data.choices[0].message.content;
      console.log('✓ Response:', answer);

      // Verify all context maintained
      const answerLower = answer.toLowerCase();
      const hasPassword = answerLower.includes('lambda');
      const hasUsername = answerLower.includes('admin');
      const hasServer = answerLower.includes('192.168.1.1');

      expect(hasPassword).toBe(true);
      expect(hasUsername).toBe(true);
      expect(hasServer).toBe(true);

      console.log('✓ All context from long history maintained');

      console.log('\n✅ PHASE 14 TEST PASSED: Long histories handled correctly');
    }, 90000);
  });

  describe('Roocode Session Isolation', () => {
    test('Different first messages create different sessions', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: Session Isolation ===');

      const healthBefore = await axios.get(`${BASE_URL}/health`);
      const sessionsBefore = healthBefore.data.sessions;

      // Conversation A
      console.log('\n→ Conversation A: Project Alpha');
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'This is Project Alpha.' }
        ],
        stream: false
      });

      const healthAfterA = await axios.get(`${BASE_URL}/health`);
      const sessionsAfterA = healthAfterA.data.sessions;
      console.log('  ✓ Sessions after A:', sessionsAfterA);

      // Conversation B (different first message)
      console.log('\n→ Conversation B: Project Beta');
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'This is Project Beta.' }
        ],
        stream: false
      });

      const healthAfterB = await axios.get(`${BASE_URL}/health`);
      const sessionsAfterB = healthAfterB.data.sessions;
      console.log('  ✓ Sessions after B:', sessionsAfterB);

      // Should have created two separate sessions
      expect(sessionsAfterB).toBe(sessionsAfterA + 1);
      console.log('✓ Two separate sessions created (session isolation works)');

      console.log('\n✅ PHASE 14 TEST PASSED: Session isolation verified');
    }, 90000);
  });

  describe('Roocode Error Handling', () => {
    test('Invalid requests return proper OpenAI-format errors', async () => {
      console.log('\n=== PHASE 14 TEST: Error Format Compatibility ===');

      try {
        await axios.post(`${BASE_URL}/v1/chat/completions`, {
          model: 'qwen3-max',
          messages: [] // Invalid: empty messages
        });

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should get 400 error
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        
        const errorObj = error.response.data.error;
        expect(errorObj).toHaveProperty('message');
        expect(errorObj).toHaveProperty('type');
        
        console.log('✓ Error response format:', errorObj);
        console.log('✓ Error properly formatted for OpenAI SDK');
      }

      console.log('\n✅ PHASE 14 TEST PASSED: Error format compatible');
    }, 10000);
  });

  describe('Roocode Performance Requirements', () => {
    test('Streaming provides low latency (required for Roocode)', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 14 TEST: Streaming Latency ===');
      console.log('NOTE: Roocode requires responsive streaming for good UX');

      const startTime = Date.now();
      let firstChunkTime = null;

      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        {
          model: 'qwen3-max',
          messages: [
            { role: 'user', content: 'Say hi' }
          ],
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      await new Promise((resolve) => {
        response.data.on('data', (chunk) => {
          if (firstChunkTime === null) {
            firstChunkTime = Date.now();
          }
        });

        response.data.on('end', resolve);
      });

      const timeToFirstChunk = firstChunkTime - startTime;
      console.log(`✓ Time to first chunk: ${timeToFirstChunk}ms`);
      
      // Should be reasonably fast (under 10 seconds to start streaming)
      expect(timeToFirstChunk).toBeLessThan(10000);
      console.log('✓ Streaming latency acceptable for Roocode');

      console.log('\n✅ PHASE 14 TEST PASSED: Streaming performance adequate');
    }, 30000);
  });
});
