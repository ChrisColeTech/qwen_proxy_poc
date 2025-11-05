/**
 * Roocode Integration Test 3: XML Tool Call Parsing
 *
 * Tests that XML-formatted tool calls in the response can be correctly
 * parsed by Roocode's AssistantMessageParser.
 *
 * This test simulates Roocode's actual parsing logic from:
 * /mnt/d/Projects/Roo-Cline/src/core/assistant-message/AssistantMessageParser.ts
 *
 * CRITICAL: Roocode expects tool calls as XML in the text response,
 * NOT as OpenAI's native tool_calls format!
 */

require('dotenv').config();

// Simulate Roocode's AssistantMessageParser
class RoocodeAssistantMessageParser {
  constructor() {
    this.contentBlocks = [];
    this.accumulator = '';
    this.currentTextContent = null;
    this.currentToolUse = null;
    this.currentParamName = null;
    this.currentParamValueStartIndex = 0;
    this.currentToolUseStartIndex = 0;

    // Roocode's supported tools (subset for testing)
    this.toolNames = [
      'read_file',
      'write_to_file',
      'execute_command',
      'search_files',
      'list_files',
      'attempt_completion'
    ];

    // Roocode's supported parameters
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

      // Check for tool use patterns
      if (this.currentToolUse && this.currentParamName) {
        const currentParamValue = this.accumulator.slice(this.currentParamValueStartIndex);
        const paramClosingTag = `</${this.currentParamName}>`;

        if (currentParamValue.endsWith(paramClosingTag)) {
          // End of param
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
          // End of tool use
          this.currentToolUse.partial = false;
          this.currentToolUse = null;
          continue;
        }

        // Check for param opening tags
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
        // Check for tool opening tags
        for (const toolName of this.toolNames) {
          const toolOpeningTag = `<${toolName}>`;
          if (this.accumulator.endsWith(toolOpeningTag)) {
            // Start new tool use
            this.currentToolUse = {
              type: 'tool_use',
              name: toolName,
              params: {},
              partial: true
            };
            this.currentToolUseStartIndex = this.accumulator.length;

            // End current text content
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

        // If no tool started, it's text content
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

describe('Roocode Integration: XML Tool Call Parsing', () => {
  describe('Parser Simulation Tests', () => {
    test('Parser can extract single tool call', () => {
      console.log('\n=== TEST: Single Tool Call Parsing ===');

      const parser = new RoocodeAssistantMessageParser();

      // Simulate streaming chunks
      const message = "I'll read that file for you.\n\n<read_file><path>src/index.js</path></read_file>";

      // Process character by character (simulate streaming)
      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

      expect(blocks.length).toBe(2);

      // First block should be text
      expect(blocks[0].type).toBe('text');
      expect(blocks[0].content).toContain("I'll read that file");

      // Second block should be tool use
      expect(blocks[1].type).toBe('tool_use');
      expect(blocks[1].name).toBe('read_file');
      expect(blocks[1].params.path).toBe('src/index.js');
      expect(blocks[1].partial).toBe(false);

      console.log('=== TEST PASSED ===\n');
    });

    test('Parser can extract tool call with multiple parameters', () => {
      console.log('\n=== TEST: Multi-parameter Tool Call ===');

      const parser = new RoocodeAssistantMessageParser();

      const message = `Let me write that file.

<write_to_file><path>test.js</path><content>
console.log("Hello World");
function test() {
  return 42;
}
</content><line_count>4</line_count></write_to_file>`;

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

      const toolUse = blocks.find(b => b.type === 'tool_use');
      expect(toolUse).toBeDefined();
      expect(toolUse.name).toBe('write_to_file');
      expect(toolUse.params.path).toBe('test.js');
      expect(toolUse.params.content).toContain('console.log("Hello World")');
      expect(toolUse.params.content).toContain('function test()');
      expect(toolUse.params.line_count).toBe('4');

      console.log('=== TEST PASSED ===\n');
    });

    test('Parser handles XML-like content in parameters', () => {
      console.log('\n=== TEST: XML-like Content in Parameters ===');

      const parser = new RoocodeAssistantMessageParser();

      const message = `<write_to_file><path>component.jsx</path><content>
function App() {
  return <div>Hello</div>;
}
</content><line_count>3</line_count></write_to_file>`;

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      const toolUse = blocks.find(b => b.type === 'tool_use');

      expect(toolUse).toBeDefined();
      expect(toolUse.params.content).toContain('<div>Hello</div>');

      console.log('Parsed content:', toolUse.params.content);
      console.log('=== TEST PASSED ===\n');
    });

    test('Parser handles consecutive tool calls', () => {
      console.log('\n=== TEST: Consecutive Tool Calls ===');

      const parser = new RoocodeAssistantMessageParser();

      const message = `<read_file><path>file1.js</path></read_file>

Now let me check the other file.

<read_file><path>file2.js</path></read_file>`;

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

      const toolCalls = blocks.filter(b => b.type === 'tool_use');
      expect(toolCalls.length).toBe(2);
      expect(toolCalls[0].params.path).toBe('file1.js');
      expect(toolCalls[1].params.path).toBe('file2.js');

      console.log('=== TEST PASSED ===\n');
    });

    test('Parser handles attempt_completion tool', () => {
      console.log('\n=== TEST: Attempt Completion Tool ===');

      const parser = new RoocodeAssistantMessageParser();

      const message = `I've completed the task successfully!

<attempt_completion><result>Created new file with hello world function</result></attempt_completion>`;

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

      const completion = blocks.find(b => b.type === 'tool_use' && b.name === 'attempt_completion');
      expect(completion).toBeDefined();
      expect(completion.params.result).toContain('Created new file');

      console.log('=== TEST PASSED ===\n');
    });

    test('Parser correctly strips first and last newline from content param', () => {
      console.log('\n=== TEST: Content Parameter Newline Handling ===');

      const parser = new RoocodeAssistantMessageParser();

      // Note: content should have newlines stripped from start and end only
      const message = `<write_to_file><path>test.txt</path><content>
First line
Second line
Third line
</content></write_to_file>`;

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      const toolUse = blocks.find(b => b.type === 'tool_use');

      // Should NOT start or end with newline
      expect(toolUse.params.content).not.toMatch(/^\n/);
      expect(toolUse.params.content).not.toMatch(/\n$/);

      // But should preserve internal newlines
      expect(toolUse.params.content).toContain('First line\nSecond line\nThird line');

      console.log('Content:', JSON.stringify(toolUse.params.content));
      console.log('=== TEST PASSED ===\n');
    });
  });

  describe('Format Specification', () => {
    test('Document exact XML format expected by Roocode', () => {
      console.log('\n=== XML Format Specification for Roocode ===\n');

      const examples = {
        'read_file': '<read_file><path>src/file.js</path></read_file>',

        'write_to_file': `<write_to_file><path>src/new.js</path><content>
const hello = "world";
console.log(hello);
</content><line_count>2</line_count></write_to_file>`,

        'execute_command': '<execute_command><command>npm test</command></execute_command>',

        'search_files': '<search_files><path>src</path><regex>function.*test</regex><file_pattern>*.js</file_pattern></search_files>',

        'list_files': '<list_files><path>src</path></list_files>',

        'attempt_completion': '<attempt_completion><result>Task completed successfully!</result></attempt_completion>'
      };

      console.log('Valid XML Tool Call Formats:\n');
      for (const [tool, example] of Object.entries(examples)) {
        console.log(`${tool}:`);
        console.log(example);
        console.log('');
      }

      console.log('Key Rules:');
      console.log('1. Tool calls are embedded in the text response as XML');
      console.log('2. Tool names must match Roocode\'s supported tools exactly');
      console.log('3. Parameter names must match exactly (path, content, command, etc.)');
      console.log('4. Content parameter: first and last newlines are stripped');
      console.log('5. Other parameters: trimmed of whitespace');
      console.log('6. XML can appear anywhere in the response (before, after, or between text)');
      console.log('7. Multiple tool calls in one response are supported');
      console.log('8. XML-like content in parameters is preserved (e.g., JSX code)');
      console.log('\n=== Specification Documented ===\n');

      // This test always passes - it's for documentation
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('Parser handles malformed XML gracefully', () => {
      console.log('\n=== TEST: Malformed XML Handling ===');

      const parser = new RoocodeAssistantMessageParser();

      // Unclosed tag
      const message = "Let me help you. <read_file><path>test.js";

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();

      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

      // Should have at least text content
      expect(blocks.length).toBeGreaterThan(0);

      // Tool use may or may not be present depending on parser state
      // The key is that it doesn't crash
      const toolUse = blocks.find(b => b.type === 'tool_use');
      if (toolUse) {
        // If tool use exists, params may be partial
        console.log('Tool use found with params:', toolUse.params);
      } else {
        // Or it may be treated as text
        console.log('Treated as text (no tool use detected)');
      }

      console.log('=== TEST PASSED ===\n');
    });

    test('Parser handles empty tool parameters', () => {
      console.log('\n=== TEST: Empty Tool Parameters ===');

      const parser = new RoocodeAssistantMessageParser();

      const message = "<list_files><path></path></list_files>";

      for (let i = 0; i < message.length; i++) {
        parser.processChunk(message[i]);
      }
      parser.finalize();

      const blocks = parser.getContentBlocks();
      const toolUse = blocks.find(b => b.type === 'tool_use');

      expect(toolUse).toBeDefined();
      expect(toolUse.params.path).toBe('');

      console.log('=== TEST PASSED ===\n');
    });
  });
});
