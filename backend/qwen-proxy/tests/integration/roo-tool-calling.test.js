/**
 * Roo-Cline Tool Calling Integration Tests
 *
 * Tests tool calling functionality against the Qwen proxy API using the exact
 * system prompt and tool definitions that Roo-Cline uses. This validates that
 * Qwen models can properly handle Roo-Cline's XML-based tool calling format.
 *
 * Test Strategy:
 * - Use REAL API calls (no mocks)
 * - Test against multiple Qwen models (qwen3-max, qwen3-turbo, qwen-turbo)
 * - Include full Roo-Cline system prompt
 * - Validate XML tool call format
 * - Identify edge cases requiring response transformation
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

// Load the actual Roo-Cline system prompt
const systemPromptPath = path.join(__dirname, '../../../../../../docs/roo/system_prompt.json');
let ROO_SYSTEM_PROMPT = null;

try {
  const systemPromptData = JSON.parse(fs.readFileSync(systemPromptPath, 'utf8'));
  ROO_SYSTEM_PROMPT = systemPromptData.content;
} catch (error) {
  console.warn('⚠️  Could not load Roo-Cline system prompt from:', systemPromptPath);
  console.warn('   Tests will use a simplified fallback prompt');
  // Fallback simplified prompt
  ROO_SYSTEM_PROMPT = `You are Roo, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.

====

TOOL USE

You have access to a set of tools that are executed upon the user's approval. You must use exactly one tool per message, and every assistant message must include a tool call. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

# Tool Use Formatting

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

Always use the actual tool name as the XML tag name for proper parsing and execution.

# Tools

## read_file
Description: Request to read the contents of a file.
Parameters:
- path: (required) File path

Usage:
<read_file>
<path>path/to/file</path>
</read_file>

## list_files
Description: Request to list files and directories within the specified directory.
Parameters:
- path: (required) The path of the directory to list contents for
- recursive: (optional) Whether to list files recursively.

Usage:
<list_files>
<path>Directory path here</path>
<recursive>true or false (optional)</recursive>
</list_files>

## search_files
Description: Request to perform a regex search across files in a specified directory.
Parameters:
- path: (required) The path of the directory to search in
- regex: (required) The regular expression pattern to search for.
- file_pattern: (optional) Glob pattern to filter files

Usage:
<search_files>
<path>Directory path here</path>
<regex>Your regex pattern here</regex>
<file_pattern>file pattern here (optional)</file_pattern>
</search_files>

## execute_command
Description: Request to execute a CLI command on the system.
Parameters:
- command: (required) The CLI command to execute.

Usage:
<execute_command>
<command>Your command here</command>
</execute_command>

## write_to_file
Description: Request to write content to a file.
Parameters:
- path: (required) The path of the file to write to
- content: (required) The content to write to the file.

Usage:
<write_to_file>
<path>File path here</path>
<content>
Your file content here
</content>
</write_to_file>

## attempt_completion
Description: After each tool use, once you've confirmed that the task is complete, use this tool to present the result of your work to the user.
Parameters:
- result: (required) The result of the task.

Usage:
<attempt_completion>
<result>
Your final result description here
</result>
</attempt_completion>

# Tool Use Guidelines

1. Choose the most appropriate tool based on the task
2. Use one tool at a time per message to accomplish the task iteratively
3. Wait for user confirmation after each tool use before proceeding
`;
}

// Test models
const TEST_MODELS = [
  { id: 'qwen3-max', name: 'Qwen3-Max (Most Capable)' },
  { id: 'qwen3-turbo', name: 'Qwen3-Turbo (Fast)' },
  { id: 'qwen-turbo', name: 'Qwen-Turbo (Legacy)' }
];

// Helper function to parse XML tool calls from response
function parseXmlToolCall(text) {
  const tools = ['read_file', 'list_files', 'search_files', 'execute_command', 'write_to_file', 'attempt_completion'];

  for (const tool of tools) {
    const openTag = `<${tool}>`;
    const closeTag = `</${tool}>`;

    if (text.includes(openTag) && text.includes(closeTag)) {
      const startIdx = text.indexOf(openTag);
      const endIdx = text.indexOf(closeTag) + closeTag.length;
      const toolXml = text.substring(startIdx, endIdx);

      // Extract parameters
      const params = {};
      const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
      let match;

      while ((match = paramRegex.exec(toolXml)) !== null) {
        const paramName = match[1];
        if (paramName !== tool) {
          params[paramName] = match[2].trim();
        }
      }

      return {
        tool,
        params,
        rawXml: toolXml
      };
    }
  }

  return null;
}

// Helper to check if response contains valid XML tool call
function hasValidToolCall(text) {
  const toolCall = parseXmlToolCall(text);
  return toolCall !== null;
}

describe('Roo-Cline Tool Calling Integration Tests', () => {
  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  beforeAll(() => {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 ROO-CLINE TOOL CALLING TESTS');
    console.log('='.repeat(80));
    console.log(`📍 Proxy URL: ${BASE_URL}`);
    console.log(`📋 System Prompt: ${ROO_SYSTEM_PROMPT ? 'Loaded from file' : 'Using fallback'}`);
    console.log(`🎯 Testing ${TEST_MODELS.length} models`);
    console.log('='.repeat(80) + '\n');
  });

  describe('Basic Tool Calling - Single Tool Per Task', () => {
    test.each(TEST_MODELS)('[$id] Should call read_file tool', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Read a file');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Read the README.md file in the current directory.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool detected: ${toolCall.tool}`);
        console.log(`   📦 Parameters:`, JSON.stringify(toolCall.params, null, 2));

        expect(toolCall.tool).toBe('read_file');
        expect(toolCall.params).toHaveProperty('path');
        expect(toolCall.params.path.toLowerCase()).toContain('readme');
      } else {
        console.log(`   ❌ No valid tool call found in response`);
        console.log(`   📄 Response preview:`, content.substring(0, 200));

        // This model needs transformation
        expect(toolCall).not.toBeNull();
      }
    }, 60000);

    test.each(TEST_MODELS)('[$id] Should call list_files tool', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: List files in directory');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'List all files in the docs directory.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool detected: ${toolCall.tool}`);
        console.log(`   📦 Parameters:`, JSON.stringify(toolCall.params, null, 2));

        expect(toolCall.tool).toBe('list_files');
        expect(toolCall.params).toHaveProperty('path');
        expect(toolCall.params.path.toLowerCase()).toContain('docs');
      } else {
        console.log(`   ❌ No valid tool call found in response`);
        console.log(`   📄 Response preview:`, content.substring(0, 200));
        expect(toolCall).not.toBeNull();
      }
    }, 60000);

    test.each(TEST_MODELS)('[$id] Should call search_files tool', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Search for pattern in codebase');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Search for the word "session" in all JavaScript files in the src directory.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool detected: ${toolCall.tool}`);
        console.log(`   📦 Parameters:`, JSON.stringify(toolCall.params, null, 2));

        expect(toolCall.tool).toBe('search_files');
        expect(toolCall.params).toHaveProperty('path');
        expect(toolCall.params).toHaveProperty('regex');
        expect(toolCall.params.regex.toLowerCase()).toContain('session');
      } else {
        console.log(`   ❌ No valid tool call found in response`);
        console.log(`   📄 Response preview:`, content.substring(0, 200));
        expect(toolCall).not.toBeNull();
      }
    }, 60000);

    test.each(TEST_MODELS)('[$id] Should call execute_command tool', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Execute a command');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Run the command "npm test" to execute tests.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool detected: ${toolCall.tool}`);
        console.log(`   📦 Parameters:`, JSON.stringify(toolCall.params, null, 2));

        expect(toolCall.tool).toBe('execute_command');
        expect(toolCall.params).toHaveProperty('command');
        expect(toolCall.params.command.toLowerCase()).toContain('npm');
      } else {
        console.log(`   ❌ No valid tool call found in response`);
        console.log(`   📄 Response preview:`, content.substring(0, 200));
        expect(toolCall).not.toBeNull();
      }
    }, 60000);
  });

  describe('Multi-Step Tool Usage', () => {
    test.each(TEST_MODELS)('[$id] Should handle sequential tool calls', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Multi-step workflow');

      // Step 1: List files
      console.log('   Step 1: Requesting to list files...');
      const step1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'List all files in the tests directory.' }
        ],
        stream: false
      });

      const content1 = step1.data.choices[0].message.content;
      const tool1 = parseXmlToolCall(content1);

      if (tool1) {
        console.log(`   ✅ Step 1 tool: ${tool1.tool}`);
        expect(tool1.tool).toBe('list_files');
      } else {
        console.log(`   ⚠️  Step 1: No tool call detected`);
      }

      // Step 2: Simulate tool result and ask for next action
      console.log('   Step 2: Providing result and requesting search...');
      const step2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'List all files in the tests directory.' },
          { role: 'assistant', content: content1 },
          { role: 'user', content: 'Found: test1.js, test2.js, integration.test.js. Now search for "TODO" in test1.js.' }
        ],
        stream: false
      });

      const content2 = step2.data.choices[0].message.content;
      const tool2 = parseXmlToolCall(content2);

      if (tool2) {
        console.log(`   ✅ Step 2 tool: ${tool2.tool}`);
        // Could be search_files or read_file depending on interpretation
        expect(['search_files', 'read_file']).toContain(tool2.tool);
      } else {
        console.log(`   ⚠️  Step 2: No tool call detected`);
      }

      // At least one step should have a valid tool call
      expect(tool1 !== null || tool2 !== null).toBe(true);
    }, 90000);
  });

  describe('Edge Cases and Error Handling', () => {
    test.each(TEST_MODELS)('[$id] Should handle ambiguous requests', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Ambiguous request');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Show me the config file.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool detected: ${toolCall.tool}`);
        console.log(`   📦 Interpretation: Model chose ${toolCall.tool}`);

        // Should choose either list_files (to find it) or read_file (if assuming location)
        expect(['list_files', 'read_file', 'search_files']).toContain(toolCall.tool);
      } else {
        console.log(`   ⚠️  No tool call - model may need clarification`);
      }
    }, 60000);

    test.each(TEST_MODELS)('[$id] Should handle completion signal', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Task: Completion signal');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Tell me what 2+2 equals. This is a simple math question, no tools needed.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      console.log(`   📝 Response length: ${content.length} chars`);

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   📌 Tool detected: ${toolCall.tool}`);
        // System prompt says "every assistant message must include a tool call"
        // So it should use attempt_completion
        expect(toolCall.tool).toBe('attempt_completion');
      } else {
        console.log(`   ⚠️  No tool call - model may have provided direct answer`);
        // This is acceptable behavior for some interpretations
      }
    }, 60000);
  });

  describe('Response Format Validation', () => {
    test.each(TEST_MODELS)('[$id] Response structure validation', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Validating response structure');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'List files in the src directory.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('object');
      expect(response.data).toHaveProperty('choices');
      expect(response.data).toHaveProperty('usage');

      const message = response.data.choices[0].message;
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message.role).toBe('assistant');
      expect(typeof message.content).toBe('string');

      console.log('   ✅ Response structure is valid');
    }, 60000);

    test.each(TEST_MODELS)('[$id] Streaming response validation', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Validating streaming response');

      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        {
          model: id,
          messages: [
            { role: 'system', content: ROO_SYSTEM_PROMPT },
            { role: 'user', content: 'Read the package.json file.' }
          ],
          stream: true
        },
        {
          responseType: 'stream'
        }
      );

      let fullContent = '';
      let chunkCount = 0;

      await new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          chunkCount++;
          const lines = chunk.toString().split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  fullContent += parsed.choices[0].delta.content;
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

      console.log(`   📊 Received ${chunkCount} chunks`);
      console.log(`   📝 Total content length: ${fullContent.length} chars`);

      expect(chunkCount).toBeGreaterThan(0);
      expect(fullContent.length).toBeGreaterThan(0);

      const toolCall = parseXmlToolCall(fullContent);
      if (toolCall) {
        console.log(`   ✅ Tool call in stream: ${toolCall.tool}`);
      } else {
        console.log(`   ⚠️  No tool call detected in streamed content`);
      }
    }, 60000);
  });

  describe('Tool Parameter Extraction', () => {
    test.each(TEST_MODELS)('[$id] Should extract parameters correctly', async ({ id, name }) => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log(`\n📊 Testing: ${name}`);
      console.log('   Validating parameter extraction');

      const response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: id,
        messages: [
          { role: 'system', content: ROO_SYSTEM_PROMPT },
          { role: 'user', content: 'Search for "TODO" comments in all TypeScript files in the src/api directory.' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);
      const content = response.data.choices[0].message.content;

      const toolCall = parseXmlToolCall(content);

      if (toolCall) {
        console.log(`   ✅ Tool: ${toolCall.tool}`);
        console.log(`   📦 Parameters extracted:`, JSON.stringify(toolCall.params, null, 2));

        expect(toolCall.tool).toBe('search_files');
        expect(toolCall.params).toHaveProperty('path');
        expect(toolCall.params).toHaveProperty('regex');

        // Check that values make sense
        const pathLower = toolCall.params.path.toLowerCase();
        const regexLower = toolCall.params.regex.toLowerCase();

        expect(pathLower).toContain('src');
        expect(regexLower).toContain('todo');

        if (toolCall.params.file_pattern) {
          console.log(`   📄 File pattern: ${toolCall.params.file_pattern}`);
          expect(toolCall.params.file_pattern.toLowerCase()).toContain('ts');
        }
      } else {
        console.log(`   ❌ Failed to extract tool call`);
        expect(toolCall).not.toBeNull();
      }
    }, 60000);
  });

  describe('Summary and Analysis', () => {
    test('Generate test results summary', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 TEST RESULTS SUMMARY');
      console.log('='.repeat(80));
      console.log('\nThis test run evaluated tool calling capabilities across Qwen models.');
      console.log('Review the test output above to identify:');
      console.log('  1. Which models successfully generate XML tool calls');
      console.log('  2. Which models need response transformation');
      console.log('  3. Common failure patterns');
      console.log('  4. Edge cases requiring special handling');
      console.log('\n' + '='.repeat(80) + '\n');

      expect(true).toBe(true);
    });
  });
});
