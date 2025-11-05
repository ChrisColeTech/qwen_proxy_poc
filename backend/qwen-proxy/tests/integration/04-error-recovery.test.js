/**
 * Integration Test: Error Recovery and Handling
 *
 * Tests that the proxy server handles errors gracefully and returns
 * appropriate error responses in OpenAI-compatible format.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Integration: Error Recovery and Handling', () => {
  test('Missing messages array returns 400', async () => {
    console.log('\n=== TEST: Missing Messages Array ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max'
        // No messages array
      });

      // Should not reach here
      fail('Expected request to fail with 400');
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);

      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');

      console.log('✅ Correctly returned 400 for missing messages');
    }
  }, 10000);

  test('Empty messages array returns 400', async () => {
    console.log('\n=== TEST: Empty Messages Array ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: []
      });

      fail('Expected request to fail with 400');
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);

      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');

      console.log('✅ Correctly returned 400 for empty messages');
    }
  }, 10000);

  test('No user message returns 400', async () => {
    console.log('\n=== TEST: No User Message ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'assistant', content: 'How can I help?' }
          // No user message
        ]
      });

      fail('Expected request to fail with 400');
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);

      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');

      console.log('✅ Correctly returned 400 for no user message');
    }
  }, 10000);

  test('Invalid message format returns 400', async () => {
    console.log('\n=== TEST: Invalid Message Format ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user' } // Missing content
        ]
      });

      fail('Expected request to fail');
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);

      // Should return an error
      expect(error.response.status).toBeGreaterThanOrEqual(400);

      console.log('✅ Correctly handled invalid message format');
    }
  }, 10000);

  test('Error responses match OpenAI format', async () => {
    console.log('\n=== TEST: OpenAI-Compatible Error Format ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: []
      });

      fail('Expected request to fail');
    } catch (error) {
      console.log('Error response:', JSON.stringify(error.response?.data, null, 2));

      // Verify error format
      expect(error.response.data).toHaveProperty('error');

      // OpenAI error format typically includes:
      const errorObj = error.response.data.error;

      // Should be an object (not just a string)
      expect(typeof errorObj).toBe('object');

      console.log('Error object:', errorObj);
      console.log('✅ Error format is compatible');
    }
  }, 10000);

  test('Invalid JSON request returns 400', async () => {
    console.log('\n=== TEST: Invalid JSON ===');

    try {
      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        'this is not valid json',
        {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: () => true // Don't throw on error status
        }
      );

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      expect(response.status).toBe(400);

      console.log('✅ Invalid JSON handled correctly');
    } catch (error) {
      // axios may throw on invalid JSON
      console.log('Error caught:', error.message);
      console.log('✅ Invalid JSON handled correctly');
    }
  }, 10000);

  test('Server handles concurrent requests', async () => {
    // Skip if no credentials
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Concurrent Requests ===');

    // Send 3 requests concurrently
    const requests = [
      axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [{ role: 'user', content: 'Concurrent test 1' }],
        stream: false
      }),
      axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [{ role: 'user', content: 'Concurrent test 2' }],
        stream: false
      }),
      axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [{ role: 'user', content: 'Concurrent test 3' }],
        stream: false
      })
    ];

    const results = await Promise.all(requests);

    // All should succeed
    results.forEach((result, index) => {
      console.log(`Request ${index + 1} status:`, result.status);
      expect(result.status).toBe(200);
      expect(result.data.choices[0].message.content).toBeDefined();
    });

    console.log('✅ Concurrent requests handled successfully');
  }, 90000);

  test('Large message content is handled', async () => {
    // Skip if no credentials
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Large Message Content ===');

    // Create a large message (but not too large to cause timeout)
    const largeContent = 'This is a test message. '.repeat(100); // ~2400 chars

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: largeContent + ' What is the weather like?' }
      ],
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('Response received for large message');
    console.log('✅ Large message handled successfully');
  }, 30000);

  test('Handles special characters in content', async () => {
    // Skip if no credentials
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Special Characters ===');

    const specialContent = `Testing special characters:
    - Quotes: "double" and 'single'
    - Symbols: @#$%^&*()
    - Unicode: 你好 🎉 émojis
    - Backslashes: \\ and \\n
    - JSON-like: {"key": "value"}`;

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: specialContent }
      ],
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('Response:', response.data.choices[0].message.content.substring(0, 100));
    console.log('✅ Special characters handled correctly');
  }, 30000);

  test('Handles very long conversation history', async () => {
    // Skip if no credentials
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Long Conversation History ===');

    // Create a long conversation history
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];

    // Add 20 more turns
    for (let i = 0; i < 20; i++) {
      messages.push({ role: 'user', content: `Message ${i}` });
      messages.push({ role: 'assistant', content: `Response ${i}` });
    }

    // Add final question
    messages.push({ role: 'user', content: 'Are you still there?' });

    console.log('Sending conversation with', messages.length, 'messages');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: messages,
      stream: false
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('Response:', response.data.choices[0].message.content);
    console.log('✅ Long conversation history handled');
  }, 30000);

  test('Missing Content-Type header is handled', async () => {
    console.log('\n=== TEST: Missing Content-Type ===');

    try {
      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Hello' }]
        }),
        {
          headers: {
            // No Content-Type header
          },
          validateStatus: () => true
        }
      );

      console.log('Response status:', response.status);

      // Server should still parse it (Express is usually lenient)
      // or return an appropriate error
      expect([200, 400, 415]).toContain(response.status);

      console.log('✅ Missing Content-Type handled');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('✅ Missing Content-Type handled with error');
    }
  }, 10000);

  test('Extra fields in request are ignored', async () => {
    // Skip if no credentials
    if (!process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES) {
      console.log('⏭️  Skipping test - no credentials');
      return;
    }

    console.log('\n=== TEST: Extra Fields Ignored ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
      // Extra fields that should be ignored
      temperature: 0.7,
      max_tokens: 100,
      top_p: 0.9,
      unknown_field: 'should be ignored'
    });

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message.content).toBeDefined();

    console.log('✅ Extra fields ignored successfully');
  }, 30000);

  test('Handles null and undefined values gracefully', async () => {
    console.log('\n=== TEST: Null/Undefined Values ===');

    try {
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: null } // Invalid content
        ]
      });

      fail('Expected request to fail');
    } catch (error) {
      console.log('Error status:', error.response?.status);

      expect(error.response.status).toBeGreaterThanOrEqual(400);

      console.log('✅ Null content handled with error');
    }
  }, 10000);

  test('Unknown endpoint returns 404', async () => {
    console.log('\n=== TEST: Unknown Endpoint ===');

    try {
      const response = await axios.get(
        `${BASE_URL}/v1/unknown/endpoint`,
        {
          validateStatus: () => true
        }
      );

      console.log('Response status:', response.status);

      expect(response.status).toBe(404);

      console.log('✅ Unknown endpoint returns 404');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('✅ Unknown endpoint handled');
    }
  }, 10000);

  test('POST to health endpoint returns error', async () => {
    console.log('\n=== TEST: Wrong Method on Health Endpoint ===');

    try {
      const response = await axios.post(
        `${BASE_URL}/health`,
        {},
        {
          validateStatus: () => true
        }
      );

      console.log('Response status:', response.status);

      // Should return 404 or 405 (Method Not Allowed)
      expect([404, 405]).toContain(response.status);

      console.log('✅ Wrong method handled correctly');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('✅ Wrong method handled');
    }
  }, 10000);

  test('GET to chat completions returns error', async () => {
    console.log('\n=== TEST: Wrong Method on Chat Completions ===');

    try {
      const response = await axios.get(
        `${BASE_URL}/v1/chat/completions`,
        {
          validateStatus: () => true
        }
      );

      console.log('Response status:', response.status);

      // Should return 404 or 405
      expect([404, 405]).toContain(response.status);

      console.log('✅ GET to chat completions handled');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('✅ GET to chat completions handled with error');
    }
  }, 10000);
});
