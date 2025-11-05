/**
 * Integration Test: Session Management
 *
 * Tests that the proxy server correctly manages sessions, isolates
 * different conversations, and tracks parent_id correctly.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Integration: Session Management', () => {
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

  test('Parallel conversations use different sessions', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Parallel Conversation Isolation ===');

    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;
    console.log('Sessions before:', sessionsBefore);

    // Start conversation A
    console.log('\n--- Conversation A: About cats ---');
    const convAResponse = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I love cats. My favorite animal is a cat.' }
      ],
      stream: false
    });

    const convAContent = convAResponse.data.choices[0].message.content;
    console.log('Conversation A response:', convAContent);

    const healthAfterA = await axios.get(`${BASE_URL}/health`);
    const sessionsAfterA = healthAfterA.data.sessions;
    console.log('Sessions after A:', sessionsAfterA);

    // Start conversation B (different first message = different session)
    console.log('\n--- Conversation B: About dogs ---');
    const convBResponse = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I love dogs. My favorite animal is a dog.' }
      ],
      stream: false
    });

    const convBContent = convBResponse.data.choices[0].message.content;
    console.log('Conversation B response:', convBContent);

    const healthAfterB = await axios.get(`${BASE_URL}/health`);
    const sessionsAfterB = healthAfterB.data.sessions;
    console.log('Sessions after B:', sessionsAfterB);

    // Should have created two different sessions
    expect(sessionsAfterB).toBe(sessionsAfterA + 1);

    // Continue conversation A
    console.log('\n--- Continuing Conversation A ---');
    const convA2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I love cats. My favorite animal is a cat.' },
        { role: 'assistant', content: convAContent },
        { role: 'user', content: 'What is my favorite animal?' }
      ],
      stream: false
    });

    const convA2Content = convA2Response.data.choices[0].message.content;
    console.log('Conversation A follow-up:', convA2Content);

    // Verify context is maintained (should say cat, not dog)
    const convA2Text = convA2Content.toLowerCase();
    expect(convA2Text.includes('cat')).toBe(true);

    // Continue conversation B
    console.log('\n--- Continuing Conversation B ---');
    const convB2Response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'I love dogs. My favorite animal is a dog.' },
        { role: 'assistant', content: convBContent },
        { role: 'user', content: 'What is my favorite animal?' }
      ],
      stream: false
    });

    const convB2Content = convB2Response.data.choices[0].message.content;
    console.log('Conversation B follow-up:', convB2Content);

    // Verify context is maintained (should say dog, not cat)
    const convB2Text = convB2Content.toLowerCase();
    expect(convB2Text.includes('dog')).toBe(true);

    // Final health check - should still be 2 sessions
    const healthFinal = await axios.get(`${BASE_URL}/health`);
    const sessionsFinal = healthFinal.data.sessions;
    console.log('Sessions at end:', sessionsFinal);

    expect(sessionsFinal).toBe(sessionsAfterB);

    console.log('✅ Parallel conversations correctly isolated');
  }, 120000); // 2 minutes for 4 API calls

  test('Same conversation uses same session', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Same Conversation Session Reuse ===');

    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;

    // Send first message
    const response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Testing session reuse with unique message 12345.' }
      ],
      stream: false
    });

    const assistant1 = response1.data.choices[0].message.content;

    const healthAfter1 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter1 = healthAfter1.data.sessions;

    // Should create 1 new session
    expect(sessionsAfter1).toBe(sessionsBefore + 1);

    // Send follow-up 1
    await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Testing session reuse with unique message 12345.' },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'Follow-up 1' }
      ],
      stream: false
    });

    const healthAfter2 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter2 = healthAfter2.data.sessions;

    // Should NOT create new session
    expect(sessionsAfter2).toBe(sessionsAfter1);

    // Send follow-up 2
    await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Testing session reuse with unique message 12345.' },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'Follow-up 1' },
        { role: 'assistant', content: 'Response...' },
        { role: 'user', content: 'Follow-up 2' }
      ],
      stream: false
    });

    const healthAfter3 = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter3 = healthAfter3.data.sessions;

    // Should STILL be using same session
    expect(sessionsAfter3).toBe(sessionsAfter1);

    console.log('✅ Same conversation reuses session correctly');
  }, 90000);

  test('Sessions are isolated from each other', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Session Isolation ===');

    // Conversation 1: Set favorite color to RED
    console.log('\n--- Conversation 1: RED ---');
    const conv1Response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is RED.' }
      ],
      stream: false
    });

    const conv1Assistant1 = conv1Response1.data.choices[0].message.content;

    const conv1Response2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is RED.' },
        { role: 'assistant', content: conv1Assistant1 },
        { role: 'user', content: 'What is my favorite color?' }
      ],
      stream: false
    });

    const conv1Answer = conv1Response2.data.choices[0].message.content;
    console.log('Conversation 1 answer:', conv1Answer);

    // Should say RED
    expect(conv1Answer.toLowerCase().includes('red')).toBe(true);

    // Conversation 2: Set favorite color to BLUE
    console.log('\n--- Conversation 2: BLUE ---');
    const conv2Response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is BLUE.' }
      ],
      stream: false
    });

    const conv2Assistant1 = conv2Response1.data.choices[0].message.content;

    const conv2Response2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is BLUE.' },
        { role: 'assistant', content: conv2Assistant1 },
        { role: 'user', content: 'What is my favorite color?' }
      ],
      stream: false
    });

    const conv2Answer = conv2Response2.data.choices[0].message.content;
    console.log('Conversation 2 answer:', conv2Answer);

    // Should say BLUE (not RED)
    expect(conv2Answer.toLowerCase().includes('blue')).toBe(true);

    // Go back to conversation 1 and verify it still remembers RED
    console.log('\n--- Back to Conversation 1 ---');
    const conv1Response3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'My favorite color is RED.' },
        { role: 'assistant', content: conv1Assistant1 },
        { role: 'user', content: 'What is my favorite color?' },
        { role: 'assistant', content: conv1Answer },
        { role: 'user', content: 'Confirm: what is my favorite color again?' }
      ],
      stream: false
    });

    const conv1FinalAnswer = conv1Response3.data.choices[0].message.content;
    console.log('Conversation 1 final answer:', conv1FinalAnswer);

    // Should still say RED (not contaminated by BLUE conversation)
    expect(conv1FinalAnswer.toLowerCase().includes('red')).toBe(true);

    console.log('✅ Sessions are properly isolated');
  }, 180000); // 3 minutes for 6 API calls

  test('Parent ID tracked correctly per session', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Parent ID Tracking ===');

    // This test verifies that parent_id is correctly tracked by:
    // 1. Starting a conversation
    // 2. Making follow-up requests
    // 3. Verifying context is maintained (which proves parent_id is working)

    // Start conversation with unique identifier
    const uniqueId = Date.now();
    const response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `My secret code is ${uniqueId}. Remember this code.` }
      ],
      stream: false
    });

    const assistant1 = response1.data.choices[0].message.content;
    console.log('Turn 1 response:', assistant1);

    // Follow-up - if parent_id is not tracked, this will fail to recall the code
    const response2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `My secret code is ${uniqueId}. Remember this code.` },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'What is my secret code?' }
      ],
      stream: false
    });

    const assistant2 = response2.data.choices[0].message.content;
    console.log('Turn 2 response:', assistant2);

    // If parent_id is correct, the assistant should recall the code
    expect(assistant2.includes(uniqueId.toString())).toBe(true);

    // Third turn - further verification
    const response3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `My secret code is ${uniqueId}. Remember this code.` },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'What is my secret code?' },
        { role: 'assistant', content: assistant2 },
        { role: 'user', content: 'Is that correct? Repeat the code.' }
      ],
      stream: false
    });

    const assistant3 = response3.data.choices[0].message.content;
    console.log('Turn 3 response:', assistant3);

    // Should still have the code
    expect(assistant3.includes(uniqueId.toString())).toBe(true);

    console.log('✅ Parent ID correctly tracked across turns');
  }, 90000);

  test('Multiple sessions can coexist', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Multiple Sessions Coexistence ===');

    const healthBefore = await axios.get(`${BASE_URL}/health`);
    const sessionsBefore = healthBefore.data.sessions;
    console.log('Sessions at start:', sessionsBefore);

    // Create 3 different sessions
    const sessions = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Creating Session ${i} ---`);
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: `This is conversation number ${i}.` }
        ],
        stream: false
      });

      sessions.push({
        firstMessage: `This is conversation number ${i}.`,
        firstResponse: response.data.choices[0].message.content
      });

      console.log(`Session ${i} created`);
    }

    const healthAfter = await axios.get(`${BASE_URL}/health`);
    const sessionsAfter = healthAfter.data.sessions;
    console.log('Sessions after creation:', sessionsAfter);

    // Should have created 3 new sessions
    expect(sessionsAfter).toBe(sessionsBefore + 3);

    // Verify each session can be used independently
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Testing Session ${i + 1} ---`);
      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: sessions[i].firstMessage },
          { role: 'assistant', content: sessions[i].firstResponse },
          { role: 'user', content: 'What conversation number is this?' }
        ],
        stream: false
      });

      const answer = response.data.choices[0].message.content;
      console.log(`Session ${i + 1} answer:`, answer);

      // Should remember its own number
      expect(answer.includes((i + 1).toString())).toBe(true);
    }

    // Session count should remain the same (reusing existing sessions)
    const healthFinal = await axios.get(`${BASE_URL}/health`);
    const sessionsFinal = healthFinal.data.sessions;
    console.log('Sessions at end:', sessionsFinal);

    expect(sessionsFinal).toBe(sessionsAfter);

    console.log('✅ Multiple sessions coexist correctly');
  }, 180000); // 3 minutes for 6 API calls

  test('Session persists across requests', async () => {
    if (skipIfNoCredentials()) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Session Persistence ===');

    const timestamp = Date.now();

    // Make first request
    console.log('\n--- First request ---');
    const response1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `Session persistence test ${timestamp}` }
      ],
      stream: false
    });

    expect(response1.status).toBe(200);
    const assistant1 = response1.data.choices[0].message.content;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Make second request - session should still exist
    console.log('\n--- Second request (after 2 seconds) ---');
    const response2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `Session persistence test ${timestamp}` },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'Still here?' }
      ],
      stream: false
    });

    expect(response2.status).toBe(200);
    const assistant2 = response2.data.choices[0].message.content;

    // Wait longer
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Make third request - session should STILL exist
    console.log('\n--- Third request (after 5 more seconds) ---');
    const response3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: `Session persistence test ${timestamp}` },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'Still here?' },
        { role: 'assistant', content: assistant2 },
        { role: 'user', content: 'And now?' }
      ],
      stream: false
    });

    expect(response3.status).toBe(200);

    console.log('✅ Session persisted across timed requests');
  }, 60000);
});
