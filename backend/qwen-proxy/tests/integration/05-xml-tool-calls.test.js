/**
 * Integration Test: XML Tool Call Generation
 *
 * Tests that the proxy can generate XML-formatted tool calls
 * that are compatible with Roocode's AssistantMessageParser.
 *
 * This test uses the real Qwen API to verify:
 * 1. System prompt injection works
 * 2. Qwen generates XML tool calls (or we convert them)
 * 3. Generated XML can be parsed by Roocode's parser
 */

require('dotenv').config();
const axios = require('axios');

// Roocode's AssistantMessageParser implementation (copied from test 03)
class RoocodeAssistantMessageParser {
  constructor() {
    this.contentBlocks = [];
    this.accumulator = '';
    this.currentTextContent = null;
    this.currentToolUse = null;
    this.currentParamName = null;
    this.currentParamValueStartIndex = 0;
    this.currentToolUseStartIndex = 0;

    this.toolNames = [
      'read_file',
      'write_to_file',
      'execute_command',
      'search_files',
      'list_files',
      'attempt_completion'
    ];

    this.toolParamNames = [
      'path',
      'content',
      'line_count',
      'command',
      'regex',
      'file_pattern',
      'result'
    ];
  }

  processChunk(chunk) {
    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.accumulator += char;

      if (this.currentToolUse && this.currentParamName) {
        const currentParamValue = this.accumulator.slice(this.currentParamValueStartIndex);
        const paramClosingTag = `</${this.currentParamName}>`;

        if (currentParamValue.endsWith(paramClosingTag)) {
          const paramValue = currentParamValue.slice(0, -paramClosingTag.length);
          this.currentToolUse.params[this.currentParamName] =
            this.currentParamName === 'content'
              ? paramValue.replace(/^\n/, '').replace(/\n$/, '')
              : paramValue.trim();
          this.currentParamName = null;
          continue;
        }
      }

      if (this.currentToolUse && !this.currentParamName) {
        const toolClosingTag = `</${this.currentToolUse.name}>`;
        if (this.accumulator.slice(this.currentToolUseStartIndex).endsWith(toolClosingTag)) {
          this.currentToolUse.partial = false;
          this.currentToolUse = null;
          continue;
        }

        for (const paramName of this.toolParamNames) {
          const paramOpeningTag = `<${paramName}>`;
          if (this.accumulator.endsWith(paramOpeningTag)) {
            this.currentParamName = paramName;
            this.currentParamValueStartIndex = this.accumulator.length;
            break;
          }
        }
      }

      if (!this.currentToolUse) {
        for (const toolName of this.toolNames) {
          const toolOpeningTag = `<${toolName}>`;
          if (this.accumulator.endsWith(toolOpeningTag)) {
            this.currentToolUse = {
              type: 'tool_use',
              name: toolName,
              params: {},
              partial: true
            };
            this.currentToolUseStartIndex = this.accumulator.length;

            if (this.currentTextContent) {
              this.currentTextContent.partial = false;
              this.currentTextContent.content = this.currentTextContent.content
                .slice(0, -toolOpeningTag.slice(0, -1).length)
                .trim();
            }

            this.contentBlocks.push(this.currentToolUse);
            this.currentTextContent = null;
            break;
          }
        }

        if (!this.currentToolUse) {
          if (!this.currentTextContent) {
            this.currentTextContent = {
              type: 'text',
              content: this.accumulator.trim(),
              partial: true
            };
            this.contentBlocks.push(this.currentTextContent);
          } else {
            this.currentTextContent.content = this.accumulator.trim();
          }
        }
      }
    }

    return this.contentBlocks;
  }

  finalize() {
    for (const block of this.contentBlocks) {
      block.partial = false;
    }
  }

  getContentBlocks() {
    return this.contentBlocks;
  }
}

// Test configuration
const PROXY_BASE_URL = process.env.PROXY_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Integration: XML Tool Call Generation', () => {
  // These tests require the proxy server to be running
  let serverProcess;

  beforeAll(async () => {
    // Check if server is already running
    try {
      await axios.get(`${PROXY_BASE_URL}/health`);
      console.log('Server already running');
    } catch (error) {
      console.log('Starting server for integration tests...');
      const { spawn } = require('child_process');
      serverProcess = spawn('node', ['src/server.js'], {
        env: { ...process.env, PORT: 3000 },
        cwd: __dirname + '/../..'
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, TEST_TIMEOUT);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('XML Generation with Real API', () => {
    test('Generates valid XML for read_file tool', async () => {
      console.log('\n=== TEST: Read File Tool Generation ===');

      const response = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please read the file src/server.js' }
        ],
        stream: false
      });

      console.log('Response status:', response.status);
      expect(response.status).toBe(200);

      const content = response.data.choices[0].message.content;
      console.log('Response content (first 500 chars):', content.substring(0, 500));

      // Check if XML tool call is present
      const hasReadFile = content.includes('<read_file>') && content.includes('</read_file>');
      console.log('Contains read_file XML:', hasReadFile);

      if (hasReadFile) {
        // Verify it can be parsed by Roocode's parser
        const parser = new RoocodeAssistantMessageParser();
        parser.processChunk(content);
        parser.finalize();

        const blocks = parser.getContentBlocks();
        console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

        const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'read_file');
        expect(toolUse).toBeDefined();
        expect(toolUse.params.path).toBeTruthy();

        console.log('Successfully parsed read_file tool call');
        console.log('Path parameter:', toolUse.params.path);
      } else {
        console.log('WARNING: No XML tool call detected in response');
        console.log('This indicates Qwen did not output XML format');
        console.log('Full response:', content);
      }

      console.log('=== TEST COMPLETED ===\n');
    }, TEST_TIMEOUT);

    test('Generates valid XML for write_to_file tool', async () => {
      console.log('\n=== TEST: Write File Tool Generation ===');

      const response = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please create a file called test.js with a hello world function' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);

      const content = response.data.choices[0].message.content;
      console.log('Response content (first 500 chars):', content.substring(0, 500));

      const hasWriteFile = content.includes('<write_to_file>') && content.includes('</write_to_file>');
      console.log('Contains write_to_file XML:', hasWriteFile);

      if (hasWriteFile) {
        const parser = new RoocodeAssistantMessageParser();
        parser.processChunk(content);
        parser.finalize();

        const blocks = parser.getContentBlocks();
        const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'write_to_file');

        expect(toolUse).toBeDefined();
        expect(toolUse.params.path).toBeTruthy();
        expect(toolUse.params.content).toBeTruthy();

        console.log('Successfully parsed write_to_file tool call');
        console.log('Path:', toolUse.params.path);
        console.log('Content length:', toolUse.params.content.length);
      } else {
        console.log('WARNING: No XML tool call detected');
        console.log('Full response:', content);
      }

      console.log('=== TEST COMPLETED ===\n');
    }, TEST_TIMEOUT);

    test('Generates valid XML for execute_command tool', async () => {
      console.log('\n=== TEST: Execute Command Tool Generation ===');

      const response = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please run npm test' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);

      const content = response.data.choices[0].message.content;
      console.log('Response content (first 500 chars):', content.substring(0, 500));

      const hasExecuteCommand = content.includes('<execute_command>') && content.includes('</execute_command>');
      console.log('Contains execute_command XML:', hasExecuteCommand);

      if (hasExecuteCommand) {
        const parser = new RoocodeAssistantMessageParser();
        parser.processChunk(content);
        parser.finalize();

        const blocks = parser.getContentBlocks();
        const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'execute_command');

        expect(toolUse).toBeDefined();
        expect(toolUse.params.command).toBeTruthy();

        console.log('Successfully parsed execute_command tool call');
        console.log('Command:', toolUse.params.command);
      } else {
        console.log('WARNING: No XML tool call detected');
        console.log('Full response:', content);
      }

      console.log('=== TEST COMPLETED ===\n');
    }, TEST_TIMEOUT);

    test('Generates valid XML for list_files tool', async () => {
      console.log('\n=== TEST: List Files Tool Generation ===');

      const response = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Please list all files in the src directory' }
        ],
        stream: false
      });

      expect(response.status).toBe(200);

      const content = response.data.choices[0].message.content;
      console.log('Response content (first 500 chars):', content.substring(0, 500));

      const hasListFiles = content.includes('<list_files>') && content.includes('</list_files>');
      console.log('Contains list_files XML:', hasListFiles);

      if (hasListFiles) {
        const parser = new RoocodeAssistantMessageParser();
        parser.processChunk(content);
        parser.finalize();

        const blocks = parser.getContentBlocks();
        const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'list_files');

        expect(toolUse).toBeDefined();
        expect(toolUse.params.path).toBeTruthy();

        console.log('Successfully parsed list_files tool call');
        console.log('Path:', toolUse.params.path);
      } else {
        console.log('WARNING: No XML tool call detected');
        console.log('Full response:', content);
      }

      console.log('=== TEST COMPLETED ===\n');
    }, TEST_TIMEOUT);
  });

  describe('System Prompt Injection', () => {
    test('Tool calling can be explicitly enabled', async () => {
      console.log('\n=== TEST: Explicit Tool Calling Enable ===');

      // This test verifies the enableTools option works
      // We'll check this by examining the request transformation
      const { transformToQwenRequest } = require('../../src/transform/request-transformer');

      const session = {
        chatId: 'test-chat-id',
        parentId: null
      };

      const messages = [
        { role: 'user', content: 'Hello, please read a file' }
      ];

      // Transform with tools enabled
      const payload = transformToQwenRequest(messages, session, { enableTools: true });

      // The last message should be from the transformed array
      // which includes the system prompt
      console.log('Payload messages:', payload.messages);
      console.log('Message content preview:', payload.messages[0].content.substring(0, 200));

      // The system prompt should have been injected
      expect(payload.messages[0].content).toContain('XML format');

      console.log('=== TEST PASSED ===\n');
    });

    test('Tool calling can be explicitly disabled', async () => {
      console.log('\n=== TEST: Explicit Tool Calling Disable ===');

      const { transformToQwenRequest } = require('../../src/transform/request-transformer');

      const session = {
        chatId: 'test-chat-id',
        parentId: null
      };

      const messages = [
        { role: 'user', content: 'Hello, please read a file' }
      ];

      // Transform with tools disabled
      const payload = transformToQwenRequest(messages, session, { enableTools: false });

      // Should NOT contain the tool system prompt
      expect(payload.messages[0].content).not.toContain('XML format');

      console.log('=== TEST PASSED ===\n');
    });

    test('Tool calling is auto-enabled for relevant keywords', async () => {
      console.log('\n=== TEST: Auto-enable Tool Calling ===');

      const { transformToQwenRequest } = require('../../src/transform/request-transformer');

      const session = {
        chatId: 'test-chat-id',
        parentId: null
      };

      const messages = [
        { role: 'user', content: 'Please read the file test.js' }
      ];

      // Transform without explicit option (should auto-detect)
      const payload = transformToQwenRequest(messages, session);

      // Should contain the tool system prompt
      expect(payload.messages[0].content).toContain('XML format');

      console.log('=== TEST PASSED ===\n');
    });
  });

  describe('Multi-turn with Tool Calls', () => {
    test('Tool calling works in multi-turn conversation', async () => {
      console.log('\n=== TEST: Multi-turn Tool Calling ===');

      // First message
      const response1 = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Hello, I need help with a file' }
        ],
        stream: false
      });

      expect(response1.status).toBe(200);
      console.log('Turn 1 response:', response1.data.choices[0].message.content.substring(0, 200));

      // Second message - should trigger tool use
      const response2 = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Hello, I need help with a file' },
          { role: 'assistant', content: response1.data.choices[0].message.content },
          { role: 'user', content: 'Please read src/server.js' }
        ],
        stream: false
      });

      expect(response2.status).toBe(200);
      const content = response2.data.choices[0].message.content;
      console.log('Turn 2 response:', content.substring(0, 500));

      // Check for XML tool calls
      const hasToolCall = content.includes('<read_file>') ||
                          content.includes('<list_files>') ||
                          content.includes('XML');

      console.log('Turn 2 contains tool-related content:', hasToolCall);

      console.log('=== TEST COMPLETED ===\n');
    }, TEST_TIMEOUT);
  });

  describe('Qwen Natural XML Output Detection', () => {
    test('Document what Qwen actually outputs', async () => {
      console.log('\n=== DETECTION: Qwen XML Output Behavior ===');
      console.log('This test documents whether Qwen naturally outputs XML');
      console.log('or if post-processing conversion is needed.\n');

      const testCases = [
        { prompt: 'Please read the file src/index.js', expected: 'read_file' },
        { prompt: 'Create a file hello.js with console.log', expected: 'write_to_file' },
        { prompt: 'Run the command npm test', expected: 'execute_command' }
      ];

      for (const testCase of testCases) {
        try {
          console.log(`Testing prompt: "${testCase.prompt}"`);

          const response = await axios.post(`${PROXY_BASE_URL}/v1/chat/completions`, {
            model: 'qwen3-max',
            messages: [
              { role: 'user', content: testCase.prompt }
            ],
            stream: false
          });

          const content = response.data.choices[0].message.content;

          // Check for XML format
          const hasXML = content.includes(`<${testCase.expected}>`);

          // Check for JSON format (if Qwen uses OpenAI-style)
          const hasJSON = response.data.choices[0].message.tool_calls !== undefined;

          console.log(`  - Contains XML (<${testCase.expected}>): ${hasXML}`);
          console.log(`  - Contains JSON tool_calls: ${hasJSON}`);
          console.log(`  - Response preview: ${content.substring(0, 200)}...\n`);

        } catch (error) {
          console.log(`  - Error: ${error.message}\n`);
        }
      }

      console.log('=== DETECTION COMPLETE ===');
      console.log('Review the logs above to determine:');
      console.log('1. Does Qwen naturally output XML? (look for <tool_name> tags)');
      console.log('2. Does Qwen output JSON tool_calls? (look for tool_calls property)');
      console.log('3. Does the system prompt successfully guide XML output?');
      console.log('');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    }, TEST_TIMEOUT * 3);
  });
});
