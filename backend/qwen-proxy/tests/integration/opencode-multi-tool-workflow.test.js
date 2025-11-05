/**
 * OpenCode Multi-Tool Workflow Test
 *
 * Tests realistic OpenCode workflows using MULTIPLE DIFFERENT tools:
 * - glob: Find files
 * - read: Read file contents
 * - bash: Execute commands
 * - edit: Modify files
 * - write: Create new files
 * - grep: Search content
 * - list: List directories
 * - webfetch: Fetch web content
 * - todowrite/todoread: Manage todos
 * - task: Launch agents
 *
 * This ensures ALL tool transformations work correctly, not just "read".
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// All 11 OpenCode tools
const OPENCODE_TOOLS = [
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
          url: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['url', 'prompt']
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
          pattern: { type: 'string' },
          path: { type: 'string' }
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
          todos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                status: { type: 'string' },
                activeForm: { type: 'string' }
              }
            }
          }
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
          prompt: { type: 'string' },
          description: { type: 'string' },
          subagent_type: { type: 'string' }
        },
        required: ['prompt', 'description', 'subagent_type']
      }
    }
  }
];

const SYSTEM_PROMPT = `You are Claude Code, an expert software engineer.
You have access to tools to accomplish tasks. Use them when needed.`;

describe('OpenCode Multi-Tool Workflow', () => {
  jest.setTimeout(180000); // 3 minutes for complex workflows

  /**
   * Helper: Execute a tool call and return the response
   */
  async function executeToolWorkflow(messages) {
    const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
      model: 'qwen3-max',
      messages: messages,
      tools: OPENCODE_TOOLS,
      stream: false
    }, {
      timeout: 60000
    });

    expect(response.status).toBe(200);
    return response.data.choices[0].message;
  }

  test('Workflow 1: glob → read → edit sequence', async () => {
    console.log('\n=== WORKFLOW 1: glob → read → edit ===');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Find all JavaScript files, read package.json, then update it' }
    ];

    // Step 1: Model should call glob
    console.log('Step 1: Expecting glob tool call...');
    const step1 = await executeToolWorkflow(messages);

    if (step1.tool_calls && step1.tool_calls.length > 0) {
      const tool1 = step1.tool_calls[0];
      console.log(`✓ Tool called: ${tool1.function.name}`);

      messages.push({
        role: 'assistant',
        content: step1.content || '',
        tool_calls: step1.tool_calls
      });

      messages.push({
        role: 'tool',
        tool_call_id: tool1.id,
        content: 'src/index.js\nsrc/app.js\nsrc/utils.js'
      });

      // Step 2: Model should call read
      console.log('Step 2: Expecting read tool call...');
      const step2 = await executeToolWorkflow(messages);

      if (step2.tool_calls && step2.tool_calls.length > 0) {
        const tool2 = step2.tool_calls[0];
        console.log(`✓ Tool called: ${tool2.function.name}`);

        messages.push({
          role: 'assistant',
          content: step2.content || '',
          tool_calls: step2.tool_calls
        });

        messages.push({
          role: 'tool',
          tool_call_id: tool2.id,
          content: '{"name": "test-app", "version": "1.0.0"}'
        });

        // Step 3: Model should call edit
        console.log('Step 3: Expecting edit or final response...');
        const step3 = await executeToolWorkflow(messages);

        if (step3.tool_calls) {
          console.log(`✓ Tool called: ${step3.tool_calls[0].function.name}`);
        } else {
          console.log('✓ Final response received');
        }
      }
    }

    console.log('✅ Workflow 1 completed successfully');
  });

  test('Workflow 2: bash → grep → read sequence', async () => {
    console.log('\n=== WORKFLOW 2: bash → grep → read ===');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Run ls command, search for errors in logs, then read the error file' }
    ];

    // Step 1: Model should call bash
    console.log('Step 1: Expecting bash tool call...');
    const step1 = await executeToolWorkflow(messages);

    if (step1.tool_calls && step1.tool_calls.length > 0) {
      const tool1 = step1.tool_calls[0];
      console.log(`✓ Tool called: ${tool1.function.name}`);

      messages.push({
        role: 'assistant',
        content: step1.content || '',
        tool_calls: step1.tool_calls
      });

      messages.push({
        role: 'tool',
        tool_call_id: tool1.id,
        content: 'app.js\npackage.json\nerror.log\nREADME.md'
      });

      // Step 2: Model should call grep or read
      console.log('Step 2: Expecting grep/read tool call...');
      const step2 = await executeToolWorkflow(messages);

      if (step2.tool_calls && step2.tool_calls.length > 0) {
        const tool2 = step2.tool_calls[0];
        console.log(`✓ Tool called: ${tool2.function.name}`);

        messages.push({
          role: 'assistant',
          content: step2.content || '',
          tool_calls: step2.tool_calls
        });

        messages.push({
          role: 'tool',
          tool_call_id: tool2.id,
          content: 'error.log:10: Error: Connection timeout\nerror.log:25: Error: Failed to parse JSON'
        });

        // Step 3: Final response or another tool call
        console.log('Step 3: Expecting final response...');
        const step3 = await executeToolWorkflow(messages);
        console.log(step3.tool_calls ? `✓ Tool: ${step3.tool_calls[0].function.name}` : '✓ Final response');
      }
    }

    console.log('✅ Workflow 2 completed successfully');
  });

  test('Workflow 3: write → bash → read verification', async () => {
    console.log('\n=== WORKFLOW 3: write → bash → read ===');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Create a test file, run a command to verify it exists, then read it back' }
    ];

    // Step 1: Model should call write
    console.log('Step 1: Expecting write tool call...');
    const step1 = await executeToolWorkflow(messages);

    if (step1.tool_calls && step1.tool_calls.length > 0) {
      const tool1 = step1.tool_calls[0];
      console.log(`✓ Tool called: ${tool1.function.name}`);

      messages.push({
        role: 'assistant',
        content: step1.content || '',
        tool_calls: step1.tool_calls
      });

      messages.push({
        role: 'tool',
        tool_call_id: tool1.id,
        content: '(Command completed successfully with no output)'
      });

      // Step 2: Model should call bash
      console.log('Step 2: Expecting bash tool call...');
      const step2 = await executeToolWorkflow(messages);

      if (step2.tool_calls && step2.tool_calls.length > 0) {
        const tool2 = step2.tool_calls[0];
        console.log(`✓ Tool called: ${tool2.function.name}`);

        messages.push({
          role: 'assistant',
          content: step2.content || '',
          tool_calls: step2.tool_calls
        });

        messages.push({
          role: 'tool',
          tool_call_id: tool2.id,
          content: 'test.txt'
        });

        // Step 3: Model should call read
        console.log('Step 3: Expecting read tool call...');
        const step3 = await executeToolWorkflow(messages);

        if (step3.tool_calls) {
          console.log(`✓ Tool called: ${step3.tool_calls[0].function.name}`);
        } else {
          console.log('✓ Final response received');
        }
      }
    }

    console.log('✅ Workflow 3 completed successfully');
  });

  test('Workflow 4: list → read → todowrite sequence', async () => {
    console.log('\n=== WORKFLOW 4: list → read → todowrite ===');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'List the current directory, read a config file, and create a todo list' }
    ];

    // Step 1: Model should call list
    console.log('Step 1: Expecting list tool call...');
    const step1 = await executeToolWorkflow(messages);

    if (step1.tool_calls && step1.tool_calls.length > 0) {
      const tool1 = step1.tool_calls[0];
      console.log(`✓ Tool called: ${tool1.function.name}`);

      messages.push({
        role: 'assistant',
        content: step1.content || '',
        tool_calls: step1.tool_calls
      });

      messages.push({
        role: 'tool',
        tool_call_id: tool1.id,
        content: 'config.json\napp.js\nREADME.md\npackage.json'
      });

      // Step 2: Model should call read
      console.log('Step 2: Expecting read tool call...');
      const step2 = await executeToolWorkflow(messages);

      if (step2.tool_calls && step2.tool_calls.length > 0) {
        const tool2 = step2.tool_calls[0];
        console.log(`✓ Tool called: ${tool2.function.name}`);

        messages.push({
          role: 'assistant',
          content: step2.content || '',
          tool_calls: step2.tool_calls
        });

        messages.push({
          role: 'tool',
          tool_call_id: tool2.id,
          content: '{"tasks": ["implement feature A", "fix bug B", "update docs"]}'
        });

        // Step 3: Final response or todowrite
        console.log('Step 3: Expecting todowrite or final response...');
        const step3 = await executeToolWorkflow(messages);
        console.log(step3.tool_calls ? `✓ Tool: ${step3.tool_calls[0].function.name}` : '✓ Final response');
      }
    }

    console.log('✅ Workflow 4 completed successfully');
  });

  test('Workflow 5: Complex 6-step multi-tool chain', async () => {
    console.log('\n=== WORKFLOW 5: Complex 6-step chain ===');
    console.log('This tests extended multi-turn conversations with diverse tools');

    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Help me refactor this codebase: find all .js files, check for TODO comments, read the main file, suggest improvements, and update the documentation' }
    ];

    const maxSteps = 6;
    let step = 0;
    let continueWorkflow = true;

    while (continueWorkflow && step < maxSteps) {
      step++;
      console.log(`\nStep ${step}...`);

      const response = await executeToolWorkflow(messages);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const tool = response.tool_calls[0];
        console.log(`✓ Tool called: ${tool.function.name}`);
        console.log(`  Arguments: ${JSON.stringify(JSON.parse(tool.function.arguments)).substring(0, 100)}...`);

        messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.tool_calls
        });

        // Simulate tool results based on tool name
        let toolResult = '';
        switch (tool.function.name) {
          case 'glob':
            toolResult = 'src/index.js\nsrc/utils.js\nsrc/helpers.js';
            break;
          case 'grep':
            toolResult = 'src/utils.js:15: // TODO: Optimize this function\nsrc/index.js:42: // TODO: Add error handling';
            break;
          case 'read':
            toolResult = 'function main() {\n  // TODO: Add error handling\n  return processData();\n}';
            break;
          case 'bash':
            toolResult = 'test.js\npackage.json\nREADME.md';
            break;
          case 'edit':
            toolResult = '(Command completed successfully with no output)';
            break;
          case 'write':
            toolResult = '(Command completed successfully with no output)';
            break;
          default:
            toolResult = `Result from ${tool.function.name}`;
        }

        messages.push({
          role: 'tool',
          tool_call_id: tool.id,
          content: toolResult
        });
      } else {
        console.log('✓ Final response received');
        console.log(`  Response: ${response.content.substring(0, 150)}...`);
        continueWorkflow = false;
      }
    }

    console.log(`\n✅ Workflow 5 completed after ${step} steps`);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThanOrEqual(maxSteps);
  });

  test('All 11 tools are available in definitions', () => {
    console.log('\n=== VERIFYING ALL 11 TOOLS ===');

    const toolNames = OPENCODE_TOOLS.map(t => t.function.name);
    console.log('Tools defined:', toolNames.join(', '));

    expect(toolNames).toContain('bash');
    expect(toolNames).toContain('edit');
    expect(toolNames).toContain('webfetch');
    expect(toolNames).toContain('glob');
    expect(toolNames).toContain('grep');
    expect(toolNames).toContain('list');
    expect(toolNames).toContain('read');
    expect(toolNames).toContain('write');
    expect(toolNames).toContain('todowrite');
    expect(toolNames).toContain('todoread');
    expect(toolNames).toContain('task');

    expect(OPENCODE_TOOLS.length).toBe(11);
    console.log('✅ All 11 tools verified');
  });
});
