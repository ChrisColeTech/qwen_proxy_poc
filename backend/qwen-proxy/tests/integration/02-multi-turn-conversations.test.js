/**
 * Integration Test: Multi-Turn Conversations
 *
 * Tests that the proxy server correctly maintains context across
 * multiple turns of conversation by properly tracking parent_id.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Integration: Multi-Turn Conversations', () => {
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

  test('First message creates new session', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: First Message Session Creation ===');

    // Check health before
    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;
    console.log('Sessions before:', sessionsBefore);

    // Send first message
    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Alice and I like blue.' }
      ],
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('Response:', response.data.choices[0].message.content);

    // Check health after
    const healthAfter = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter = healthAfter.data.sessions;
    console.log('Sessions after:', sessionsAfter);

    // Should have created a new session
    expect(sessionsAfter).toBeGreaterThan(sessionsBefore);

    console.log('✅ First message created new session');
  }, 30000);

  test('Two-turn conversation maintains context', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Two-Turn Context Preservation ===');

    // Turn 1: Establish context
    console.log('\n--- Turn 1: Establish context ---');
    const turn1Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite number is 42. Please remember this.' }
      ],
      stream: false
    });

    expect(turn1Response.status).toBe(200);
    const response1 = turn1Response.data.choices[0].message.content;
    console.log('Turn 1 response:', response1);

    // Turn 2: Test context recall
    console.log('\n--- Turn 2: Test context recall ---');
    const turn2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite number is 42. Please remember this.' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: 'What is my favorite number?' }
      ],
      stream: false
    });

    expect(turn2Response.status).toBe(200);
    const response2 = turn2Response.data.choices[0].message.content;
    console.log('Turn 2 response:', response2);

    // Verify context was maintained
    const responseText = response2.toLowerCase();
    expect(
      responseText.includes('42') ||
      responseText.includes('forty-two') ||
      responseText.includes('forty two')
    ).toBe(true);

    console.log('✅ Context maintained across two turns');
  }, 60000);

  test('Three-turn conversation maintains context', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Three-Turn Context Preservation ===');

    // Turn 1: Set name
    console.log('\n--- Turn 1: Set name ---');
    const turn1Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Bob.' }
      ],
      stream: false
    });

    const response1 = turn1Response.data.choices[0].message.content;
    console.log('Turn 1 response:', response1);

    // Turn 2: Set favorite color
    console.log('\n--- Turn 2: Set favorite color ---');
    const turn2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Bob.' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: 'My favorite color is green.' }
      ],
      stream: false
    });

    const response2 = turn2Response.data.choices[0].message.content;
    console.log('Turn 2 response:', response2);

    // Turn 3: Ask about both
    console.log('\n--- Turn 3: Ask about both ---');
    const turn3Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My name is Bob.' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: 'My favorite color is green.' },
        { role: 'assistant', content: response2 },
        { role: 'user', content: 'What is my name and favorite color?' }
      ],
      stream: false
    });

    const response3 = turn3Response.data.choices[0].message.content;
    console.log('Turn 3 response:', response3);

    // Verify both pieces of context were maintained
    const responseText = response3.toLowerCase();
    expect(responseText.includes('bob')).toBe(true);
    expect(responseText.includes('green')).toBe(true);

    console.log('✅ Context maintained across three turns');
  }, 90000);

  test('Follow-up messages use same session', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Session Consistency ===');

    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;
    console.log('Sessions before:', sessionsBefore);

    // Turn 1
    const turn1Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello, I am starting a new conversation.' }
      ],
      stream: false
    });

    const response1 = turn1Response.data.choices[0].message.content;

    const healthAfterTurn1 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfterTurn1 = healthAfterTurn1.data.sessions;
    console.log('Sessions after turn 1:', sessionsAfterTurn1);

    // Should have created one new session
    expect(sessionsAfterTurn1).toBe(sessionsBefore + 1);

    // Turn 2 - should use same session
    await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello, I am starting a new conversation.' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: 'How are you?' }
      ],
      stream: false
    });

    const healthAfterTurn2 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfterTurn2 = healthAfterTurn2.data.sessions;
    console.log('Sessions after turn 2:', sessionsAfterTurn2);

    // Should NOT have created another session
    expect(sessionsAfterTurn2).toBe(sessionsAfterTurn1);

    console.log('✅ Follow-up messages use same session');
  }, 60000);

  test('Full history can be sent (only last message used)', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Full History Sent (Roocode Style) ===');

    // Turn 1
    const turn1Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I like pizza.' }
      ],
      stream: false
    });

    const response1 = turn1Response.data.choices[0].message.content;
    console.log('Turn 1 response:', response1);

    // Turn 2 - Send full history (Roocode always sends complete conversation)
    const turn2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I like pizza.' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: 'What food do I like?' }
      ],
      stream: false
    });

    const response2 = turn2Response.data.choices[0].message.content;
    console.log('Turn 2 response:', response2);

    // Verify context maintained (even though we send full history,
    // proxy only sends last message to Qwen and uses parent_id for context)
    const responseText = response2.toLowerCase();
    expect(responseText.includes('pizza')).toBe(true);

    console.log('✅ Full history works correctly');
  }, 60000);

  test('Session identified by first user message', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Session Identification Strategy ===');

    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;

    // Send same first message multiple times with different follow-ups
    // Should all use the SAME session

    // First sequence
    const response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'The secret word is BANANA.' }
      ],
      stream: false
    });

    const assistant1 = response1.data.choices[0].message.content;

    const healthAfter1 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter1 = healthAfter1.data.sessions;
    console.log('Sessions after first request:', sessionsAfter1);

    // Second sequence - same first message, different follow-up
    await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'The secret word is BANANA.' },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'What is the secret word?' }
      ],
      stream: false
    });

    const healthAfter2 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter2 = healthAfter2.data.sessions;
    console.log('Sessions after second request:', sessionsAfter2);

    // Should use same session (identified by first user message)
    expect(sessionsAfter2).toBe(sessionsAfter1);

    console.log('✅ Session correctly identified by first user message');
  }, 60000);

  test('Streaming mode maintains context across turns', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Streaming Multi-Turn Context ===');

    // Turn 1: Streaming
    console.log('\n--- Turn 1: Streaming request ---');
    const turn1Response = await axios.post(
      `${BASE_URL}/v1/chat/completions`,
      {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My lucky number is 777.' }
        ],
        stream: true
      },
      {
        responseType: 'stream'
      }
    );

    let response1Content = '';

    await new Promise((resolve, reject) => {
      turn1Response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                response1Content += data.choices[0].delta.content;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      });

      turn1Response.data.on('end', resolve);
      turn1Response.data.on('error', reject);
    });

    console.log('Turn 1 response:', response1Content);

    // Turn 2: Non-streaming follow-up
    console.log('\n--- Turn 2: Non-streaming follow-up ---');
    const turn2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My lucky number is 777.' },
        { role: 'assistant', content: response1Content },
        { role: 'user', content: 'What is my lucky number?' }
      ],
      stream: false
    });

    const response2 = turn2Response.data.choices[0].message.content;
    console.log('Turn 2 response:', response2);

    // Verify context maintained
    const responseText = response2.toLowerCase();
    expect(responseText.includes('777')).toBe(true);

    console.log('✅ Context maintained with streaming');
  }, 90000);

  test('Five-turn conversation maintains context', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Five-Turn Context Preservation ===');

    const conversationHistory = [];

    // Turn 1
    console.log('\n--- Turn 1 ---');
    conversationHistory.push({ role: 'user', content: 'I have a cat named Whiskers.' });

    let response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [...conversationHistory],
      stream: false
    });

    const response1 = response.data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: response1 });
    console.log('Response 1:', response1);

    // Turn 2
    console.log('\n--- Turn 2 ---');
    conversationHistory.push({ role: 'user', content: 'Whiskers is 3 years old.' });

    response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [...conversationHistory],
      stream: false
    });

    const response2 = response.data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: response2 });
    console.log('Response 2:', response2);

    // Turn 3
    console.log('\n--- Turn 3 ---');
    conversationHistory.push({ role: 'user', content: 'Whiskers likes to play with yarn.' });

    response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [...conversationHistory],
      stream: false
    });

    const response3 = response.data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: response3 });
    console.log('Response 3:', response3);

    // Turn 4
    console.log('\n--- Turn 4 ---');
    conversationHistory.push({ role: 'user', content: 'She is an orange tabby.' });

    response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [...conversationHistory],
      stream: false
    });

    const response4 = response.data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: response4 });
    console.log('Response 4:', response4);

    // Turn 5: Test recall of all information
    console.log('\n--- Turn 5: Test recall ---');
    conversationHistory.push({
      role: 'user',
      content: 'Can you tell me everything about my cat? What is her name, age, color, and what she likes?'
    });

    response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [...conversationHistory],
      stream: false
    });

    const response5 = response.data.choices[0].message.content;
    console.log('Response 5 (final):', response5);

    // Verify all context maintained
    const responseText = response5.toLowerCase();
    expect(responseText.includes('whiskers')).toBe(true);
    expect(responseText.includes('3') || responseText.includes('three')).toBe(true);
    expect(responseText.includes('orange') || responseText.includes('tabby')).toBe(true);
    expect(responseText.includes('yarn')).toBe(true);

    console.log('✅ Context maintained across five turns');
  }, 150000); // 2.5 minutes for 5 turns
});
