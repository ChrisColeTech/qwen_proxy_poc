/**
 * Integration Test: Hanging Continuation Requests
 *
 * This test reproduces the exact scenario from the logs where:
 * 1. Initial request works (tools injected, response returned)
 * 2. Continuation request with tool result hangs after extractMessagesToSend
 *
 * Evidence from logs:
 * - First request: messageCount: 3, tools: 11 → SUCCESS (Flushed buffered tool call: read)
 * - Second request: messageCount: 5, tools: 11 → HANGS (no flush, no response)
 * - Third request: messageCount: 6, tools: 11 → HANGS
 * - Fourth request: messageCount: 7, tools: 11 → HANGS
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Shortened system prompt for testing
const SYSTEM_PROMPT = `You are a helpful assistant with access to tools.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' }
        },
        required: ['file_path']
      }
    }
  }
];

describe('Hanging Continuation Requests', () => {
  test('Initial request should return tool call', async () => {
    console.log('\n=== TEST 1: Initial Request ===');

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' }
      ],
      tools: TOOLS,
      stream: false
    }, {
      timeout: 30000 // 30 second timeout
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    expect(response.status).toBe(200);
    expect(response.data.choices[0].message).toBeDefined();

    const message = response.data.choices[0].message;
    console.log('Message role:', message.role);
    console.log('Message content type:', typeof message.content);
    console.log('Message content value:', message.content);
    console.log('Has tool_calls:', !!message.tool_calls);

    // The fix: content should be empty string, not null
    if (message.tool_calls) {
      expect(message.content).toBe(''); // NOT null
      expect(Array.isArray(message.tool_calls)).toBe(true);
    }
  }, 35000);

  test('Continuation request with tool result should not hang', async () => {
    console.log('\n=== TEST 2: Continuation Request ===');

    // Step 1: Get initial tool call
    const step1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' }
      ],
      tools: TOOLS,
      stream: false
    }, {
      timeout: 30000
    });

    console.log('Step 1 complete');
    const assistantMsg = step1.data.choices[0].message;

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      console.log('No tool call in step 1, skipping test');
      return;
    }

    const toolCall = assistantMsg.tool_calls[0];
    console.log('Tool call ID:', toolCall.id);

    // Step 2: Send tool result (THIS IS WHERE IT HANGS)
    console.log('Sending continuation request with tool result...');
    const startTime = Date.now();

    const step2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' },
        { role: 'assistant', content: assistantMsg.content || '', tool_calls: assistantMsg.tool_calls },
        { role: 'tool', tool_call_id: toolCall.id, content: 'File contents: Hello World' }
      ],
      tools: TOOLS,
      stream: false
    }, {
      timeout: 30000 // 30 second timeout
    });

    const elapsed = Date.now() - startTime;
    console.log(`Step 2 complete in ${elapsed}ms`);
    console.log('Response status:', step2.status);
    console.log('Response data:', JSON.stringify(step2.data, null, 2));

    expect(step2.status).toBe(200);
    expect(step2.data.choices[0].message).toBeDefined();
  }, 65000);

  test('Multiple continuation requests should all complete', async () => {
    console.log('\n=== TEST 3: Multiple Continuations ===');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Read the file /tmp/test.txt' }
    ];

    // Round 1
    console.log('Round 1: Initial request');
    const round1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages,
      tools: TOOLS,
      stream: false
    }, { timeout: 30000 });

    const msg1 = round1.data.choices[0].message;
    messages.push({
      role: 'assistant',
      content: msg1.content || '',
      tool_calls: msg1.tool_calls
    });

    if (msg1.tool_calls && msg1.tool_calls.length > 0) {
      messages.push({
        role: 'tool',
        tool_call_id: msg1.tool_calls[0].id,
        content: 'File contents: Test data'
      });

      // Round 2
      console.log('Round 2: First continuation');
      const round2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages,
        tools: TOOLS,
        stream: false
      }, { timeout: 30000 });

      expect(round2.status).toBe(200);
      console.log('Round 2 complete');

      const msg2 = round2.data.choices[0].message;
      messages.push({
        role: 'assistant',
        content: msg2.content || '',
        tool_calls: msg2.tool_calls
      });

      if (msg2.tool_calls && msg2.tool_calls.length > 0) {
        messages.push({
          role: 'tool',
          tool_call_id: msg2.tool_calls[0].id,
          content: 'Another result'
        });

        // Round 3
        console.log('Round 3: Second continuation');
        const round3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
          model: 'qwen3-max',
          messages,
          tools: TOOLS,
          stream: false
        }, { timeout: 30000 });

        expect(round3.status).toBe(200);
        console.log('Round 3 complete');
      }
    }
  }, 95000);
});
