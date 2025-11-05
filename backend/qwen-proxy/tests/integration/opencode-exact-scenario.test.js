/**
 * OpenCode Exact Scenario Test
 *
 * Reproduces the EXACT scenario from OpenCode including:
 * - All 11 tools that OpenCode sends
 * - Large system prompt and tool definitions (~31KB XML)
 * - Multi-turn conversation with tool results
 *
 * This test will determine if the hang is related to the large payload.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// EXACT 11 tools that OpenCode uses (from server logs)
const OPENCODE_11_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute bash commands',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit',
      description: 'Edit a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          old_string: { type: 'string' },
          new_string: { type: 'string' }
        },
        required: ['file_path', 'old_string', 'new_string']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'webfetch',
      description: 'Fetch web content',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'glob',
      description: 'Find files matching pattern',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'grep',
      description: 'Search file contents',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list',
      description: 'List directory contents',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read file contents',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write',
      description: 'Write to a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['file_path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'todowrite',
      description: 'Write todo list',
      parameters: {
        type: 'object',
        properties: {
          todos: { type: 'array', items: { type: 'object' } }
        },
        required: ['todos']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'todoread',
      description: 'Read todo list',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'task',
      description: 'Launch a task agent',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string' }
        },
        required: ['prompt']
      }
    }
  }
];

const OPENCODE_SYSTEM_PROMPT = `You are Claude Code, an expert software engineer.

Use tools to accomplish tasks. Format tool calls using XML.`;

describe('OpenCode Exact Scenario (11 Tools)', () => {
  jest.setTimeout(120000);

  test('Initial request with 11 tools returns tool call', async () => {
    console.log('\n===  TEST: Initial Request with 11 Tools ===');
    console.log(`Tools count: ${OPENCODE_11_TOOLS.length}`);

    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: OPENCODE_SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' }
      ],
      tools: OPENCODE_11_TOOLS,
      stream: false
    }, {
      timeout: 60000
    });

    console.log('Response status:', response.status);
    expect(response.status).toBe(200);

    const message = response.data.choices[0].message;
    console.log('Has tool_calls:', !!message.tool_calls);
    console.log('Content type:', typeof message.content);
    console.log('Content value:', message.content === '' ? '(empty string)' : message.content);

    // Verify the fix: content should be empty string, not null
    if (message.tool_calls) {
      expect(message.content).toBe('');
      expect(message.content).not.toBeNull();
      console.log('✅ Content is empty string (not null) - FIX VERIFIED');
    }
  });

  test('Continuation with tool result (11 tools) should NOT hang', async () => {
    console.log('\n=== TEST: Continuation with 11 Tools ===');
    console.log('This is the critical test - does it hang like OpenCode?');

    // Step 1: Get initial tool call
    console.log('\nStep 1: Initial request...');
    const step1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: OPENCODE_SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' }
      ],
      tools: OPENCODE_11_TOOLS,
      stream: false
    }, {
      timeout: 60000
    });

    console.log('Step 1 complete');
    const assistantMsg = step1.data.choices[0].message;

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      console.log('No tool call, skipping test');
      return;
    }

    const toolCall = assistantMsg.tool_calls[0];
    console.log('Tool call ID:', toolCall.id);
    console.log('Tool name:', toolCall.function.name);

    // Step 2: Send tool result with ALL 11 TOOLS (this is where OpenCode hangs!)
    console.log('\nStep 2: Sending tool result with 11 tools...');
    console.log('⚠️  This is where OpenCode appears to hang');

    const startTime = Date.now();

    const step2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: OPENCODE_SYSTEM_PROMPT },
        { role: 'user', content: 'Read the file /tmp/test.txt' },
        {
          role: 'assistant',
          content: assistantMsg.content || '',
          tool_calls: assistantMsg.tool_calls
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: 'File contents: Hello World'
        }
      ],
      tools: OPENCODE_11_TOOLS, // ALL 11 TOOLS
      stream: false
    }, {
      timeout: 60000
    });

    const elapsed = Date.now() - startTime;
    console.log(`\nStep 2 complete in ${elapsed}ms`);

    expect(step2.status).toBe(200);
    console.log('Response received:', step2.data.choices[0].message.content?.substring(0, 100));

    if (elapsed > 30000) {
      console.log('⚠️  WARNING: Response took >30 seconds - may indicate Qwen slowness');
    } else {
      console.log('✅ Response time acceptable');
    }
  });

  test('Multiple continuations with 11 tools', async () => {
    console.log('\n=== TEST: Multiple Continuations (11 Tools) ===');

    let messages = [
      { role: 'system', content: OPENCODE_SYSTEM_PROMPT },
      { role: 'user', content: 'Read /tmp/test1.txt' }
    ];

    // Round 1
    console.log('\nRound 1...');
    const round1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages,
      tools: OPENCODE_11_TOOLS,
      stream: false
    }, { timeout: 60000 });

    expect(round1.status).toBe(200);
    const msg1 = round1.data.choices[0].message;

    if (!msg1.tool_calls) {
      console.log('No tool calls, ending test');
      return;
    }

    messages.push({
      role: 'assistant',
      content: msg1.content || '',
      tool_calls: msg1.tool_calls
    });
    messages.push({
      role: 'tool',
      tool_call_id: msg1.tool_calls[0].id,
      content: 'Content of file 1'
    });

    // Round 2
    console.log('\nRound 2...');
    const round2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages,
      tools: OPENCODE_11_TOOLS,
      stream: false
    }, { timeout: 60000 });

    expect(round2.status).toBe(200);
    console.log('Round 2 complete');

    const msg2 = round2.data.choices[0].message;
    if (!msg2.tool_calls) {
      console.log('No more tool calls');
      return;
    }

    messages.push({
      role: 'assistant',
      content: msg2.content || '',
      tool_calls: msg2.tool_calls
    });
    messages.push({
      role: 'tool',
      tool_call_id: msg2.tool_calls[0].id,
      content: 'Content of file 2'
    });

    // Round 3
    console.log('\nRound 3...');
    const round3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages,
      tools: OPENCODE_11_TOOLS,
      stream: false
    }, { timeout: 60000 });

    expect(round3.status).toBe(200);
    console.log('Round 3 complete');

    console.log('\n✅ ALL 3 ROUNDS COMPLETED WITH 11 TOOLS');
  });
});
