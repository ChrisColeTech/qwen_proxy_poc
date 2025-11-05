/**
 * Unit Tests: XML Tool Converter
 *
 * Tests JSON to XML tool call conversion functionality.
 */

const {
  containsXMLToolCalls,
  containsJSONToolCalls,
  convertToolCallToXML,
  convertJSONToXML,
  convertToolCallsToXML,
  escapeXMLContent
} = require('../../src/utils/xml-tool-converter');

describe('XML Tool Converter', () => {
  describe('containsXMLToolCalls', () => {
    test('detects XML tool calls', () => {
      const content = "Let me help you.\n\n<read_file><path>test.js</path></read_file>";
      expect(containsXMLToolCalls(content)).toBe(true);
    });

    test('detects write_to_file XML', () => {
      const content = '<write_to_file><path>test.js</path><content>code</content></write_to_file>';
      expect(containsXMLToolCalls(content)).toBe(true);
    });

    test('detects execute_command XML', () => {
      const content = '<execute_command><command>npm test</command></execute_command>';
      expect(containsXMLToolCalls(content)).toBe(true);
    });

    test('returns false for plain text', () => {
      const content = "This is just plain text without tool calls.";
      expect(containsXMLToolCalls(content)).toBe(false);
    });

    test('returns false for empty content', () => {
      expect(containsXMLToolCalls('')).toBe(false);
      expect(containsXMLToolCalls(null)).toBe(false);
      expect(containsXMLToolCalls(undefined)).toBe(false);
    });

    test('does not detect partial XML', () => {
      const content = "Let me <read the file";
      expect(containsXMLToolCalls(content)).toBe(false);
    });
  });

  describe('containsJSONToolCalls', () => {
    test('detects tool_calls array in response', () => {
      const response = {
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'read_file',
              arguments: '{"path":"test.js"}'
            }
          }
        ]
      };
      expect(containsJSONToolCalls(response)).toBe(true);
    });

    test('detects tool_calls in message object', () => {
      const response = {
        message: {
          content: 'Let me help',
          tool_calls: [
            {
              function: {
                name: 'read_file',
                arguments: '{"path":"test.js"}'
              }
            }
          ]
        }
      };
      expect(containsJSONToolCalls(response)).toBe(true);
    });

    test('returns false for empty tool_calls', () => {
      const response = {
        tool_calls: []
      };
      expect(containsJSONToolCalls(response)).toBe(false);
    });

    test('returns false for missing tool_calls', () => {
      const response = {
        message: {
          content: 'Just text'
        }
      };
      expect(containsJSONToolCalls(response)).toBe(false);
    });

    test('returns false for null response', () => {
      expect(containsJSONToolCalls(null)).toBe(false);
      expect(containsJSONToolCalls(undefined)).toBe(false);
    });
  });

  describe('convertToolCallToXML', () => {
    test('converts read_file tool call', () => {
      const toolCall = {
        function: {
          name: 'read_file',
          arguments: JSON.stringify({ path: 'src/index.js' })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('<read_file><path>src/index.js</path></read_file>');
    });

    test('converts write_to_file with content', () => {
      const toolCall = {
        function: {
          name: 'write_to_file',
          arguments: JSON.stringify({
            path: 'test.js',
            content: 'console.log("hello");',
            line_count: 1
          })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toContain('<write_to_file>');
      expect(xml).toContain('<path>test.js</path>');
      expect(xml).toContain('<content>\nconsole.log("hello");\n</content>');
      expect(xml).toContain('<line_count>1</line_count>');
      expect(xml).toContain('</write_to_file>');
    });

    test('converts execute_command', () => {
      const toolCall = {
        function: {
          name: 'execute_command',
          arguments: JSON.stringify({ command: 'npm test' })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('<execute_command><command>npm test</command></execute_command>');
    });

    test('converts search_files with multiple params', () => {
      const toolCall = {
        function: {
          name: 'search_files',
          arguments: JSON.stringify({
            path: 'src',
            regex: 'function.*test',
            file_pattern: '*.js'
          })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toContain('<search_files>');
      expect(xml).toContain('<path>src</path>');
      expect(xml).toContain('<regex>function.*test</regex>');
      expect(xml).toContain('<file_pattern>*.js</file_pattern>');
      expect(xml).toContain('</search_files>');
    });

    test('converts list_files', () => {
      const toolCall = {
        function: {
          name: 'list_files',
          arguments: JSON.stringify({ path: 'src' })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('<list_files><path>src</path></list_files>');
    });

    test('converts attempt_completion', () => {
      const toolCall = {
        function: {
          name: 'attempt_completion',
          arguments: JSON.stringify({ result: 'Task completed!' })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('<attempt_completion><result>Task completed!</result></attempt_completion>');
    });

    test('handles arguments as object (not string)', () => {
      const toolCall = {
        function: {
          name: 'read_file',
          arguments: { path: 'test.js' }
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('<read_file><path>test.js</path></read_file>');
    });

    test('handles JSX content without escaping', () => {
      const toolCall = {
        function: {
          name: 'write_to_file',
          arguments: JSON.stringify({
            path: 'App.jsx',
            content: 'function App() {\n  return <div>Hello</div>;\n}',
            line_count: 3
          })
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toContain('<div>Hello</div>');
      expect(xml).toContain('function App()');
    });

    test('returns empty string for invalid tool call', () => {
      expect(convertToolCallToXML(null)).toBe('');
      expect(convertToolCallToXML({})).toBe('');
      expect(convertToolCallToXML({ function: null })).toBe('');
    });

    test('returns empty string for invalid JSON arguments', () => {
      const toolCall = {
        function: {
          name: 'read_file',
          arguments: '{invalid json'
        }
      };

      const xml = convertToolCallToXML(toolCall);
      expect(xml).toBe('');
    });
  });

  describe('convertJSONToXML', () => {
    test('converts multiple tool calls', () => {
      const response = {
        tool_calls: [
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'file1.js' })
            }
          },
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'file2.js' })
            }
          }
        ]
      };

      const xml = convertJSONToXML(response);
      expect(xml).toContain('<read_file><path>file1.js</path></read_file>');
      expect(xml).toContain('<read_file><path>file2.js</path></read_file>');
    });

    test('handles tool_calls in message object', () => {
      const response = {
        message: {
          tool_calls: [
            {
              function: {
                name: 'list_files',
                arguments: JSON.stringify({ path: 'src' })
              }
            }
          ]
        }
      };

      const xml = convertJSONToXML(response);
      expect(xml).toBe('<list_files><path>src</path></list_files>');
    });

    test('returns empty string for no tool calls', () => {
      expect(convertJSONToXML({})).toBe('');
      expect(convertJSONToXML({ tool_calls: [] })).toBe('');
      expect(convertJSONToXML(null)).toBe('');
    });

    test('filters out invalid tool calls', () => {
      const response = {
        tool_calls: [
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'test.js' })
            }
          },
          null,
          {
            function: null
          }
        ]
      };

      const xml = convertJSONToXML(response);
      expect(xml).toBe('<read_file><path>test.js</path></read_file>');
    });
  });

  describe('convertToolCallsToXML', () => {
    test('returns content unchanged if already contains XML', () => {
      const content = 'Text before\n\n<read_file><path>test.js</path></read_file>';
      const response = {};

      const result = convertToolCallsToXML(content, response);
      expect(result).toBe(content);
    });

    test('converts JSON tool calls and appends to content', () => {
      const content = 'Let me help you with that.';
      const response = {
        tool_calls: [
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'test.js' })
            }
          }
        ]
      };

      const result = convertToolCallsToXML(content, response);
      expect(result).toContain('Let me help you with that.');
      expect(result).toContain('<read_file><path>test.js</path></read_file>');
    });

    test('returns only XML if content is empty', () => {
      const content = '';
      const response = {
        tool_calls: [
          {
            function: {
              name: 'list_files',
              arguments: JSON.stringify({ path: 'src' })
            }
          }
        ]
      };

      const result = convertToolCallsToXML(content, response);
      expect(result).toBe('<list_files><path>src</path></list_files>');
    });

    test('returns content unchanged if no tool calls', () => {
      const content = 'Just plain text';
      const response = {};

      const result = convertToolCallsToXML(content, response);
      expect(result).toBe(content);
    });

    test('handles multiple tool calls with content', () => {
      const content = 'Processing your request...';
      const response = {
        tool_calls: [
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'file1.js' })
            }
          },
          {
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'file2.js' })
            }
          }
        ]
      };

      const result = convertToolCallsToXML(content, response);
      expect(result).toContain('Processing your request...');
      expect(result).toContain('<read_file><path>file1.js</path></read_file>');
      expect(result).toContain('<read_file><path>file2.js</path></read_file>');
    });
  });

  describe('escapeXMLContent', () => {
    test('returns content unchanged (no escaping)', () => {
      // Our implementation doesn't escape XML content to preserve JSX
      const content = '<div>Hello</div>';
      expect(escapeXMLContent(content)).toBe(content);
    });

    test('handles null/undefined', () => {
      expect(escapeXMLContent(null)).toBe(null);
      expect(escapeXMLContent(undefined)).toBe(undefined);
    });
  });
});
