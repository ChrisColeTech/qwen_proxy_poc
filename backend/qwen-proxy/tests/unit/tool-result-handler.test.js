/**
 * Unit Tests for Tool Result Handler
 *
 * Tests the transformation of OpenAI tool result messages (role: "tool")
 * into Qwen-compatible user messages with formatted content.
 */

const {
  isToolResult,
  extractToolNameFromAssistant,
  transformToolResult,
  stripToolCalls,
  transformMessagesWithToolResults,
  hasToolResults,
  hasToolCalls
} = require('../../src/handlers/tool-result-handler');

describe('Tool Result Handler', () => {
  describe('isToolResult', () => {
    test('returns true for tool message', () => {
      const message = { role: 'tool', content: 'result' };
      expect(isToolResult(message)).toBe(true);
    });

    test('returns false for user message', () => {
      const message = { role: 'user', content: 'hello' };
      expect(isToolResult(message)).toBe(false);
    });

    test('returns false for assistant message', () => {
      const message = { role: 'assistant', content: 'hello' };
      expect(isToolResult(message)).toBe(false);
    });

    test('returns false for null message', () => {
      expect(isToolResult(null)).toBe(false);
    });

    test('returns false for undefined message', () => {
      expect(isToolResult(undefined)).toBe(false);
    });
  });

  describe('extractToolNameFromAssistant', () => {
    test('extracts tool name from matching tool_call_id', () => {
      const assistantMessage = {
        role: 'assistant',
        content: 'I will read the file',
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'read',
              arguments: '{"filePath":"/path/to/file"}'
            }
          }
        ]
      };

      const toolName = extractToolNameFromAssistant(assistantMessage, 'call_1');
      expect(toolName).toBe('read');
    });

    test('returns null when tool_call_id not found', () => {
      const assistantMessage = {
        role: 'assistant',
        tool_calls: [
          {
            id: 'call_1',
            function: { name: 'read' }
          }
        ]
      };

      const toolName = extractToolNameFromAssistant(assistantMessage, 'call_2');
      expect(toolName).toBe(null);
    });

    test('returns null when no tool_calls present', () => {
      const assistantMessage = {
        role: 'assistant',
        content: 'Hello'
      };

      const toolName = extractToolNameFromAssistant(assistantMessage, 'call_1');
      expect(toolName).toBe(null);
    });

    test('returns null when assistant message is null', () => {
      const toolName = extractToolNameFromAssistant(null, 'call_1');
      expect(toolName).toBe(null);
    });

    test('handles multiple tool calls and finds correct one', () => {
      const assistantMessage = {
        role: 'assistant',
        tool_calls: [
          { id: 'call_1', function: { name: 'read' } },
          { id: 'call_2', function: { name: 'write' } },
          { id: 'call_3', function: { name: 'bash' } }
        ]
      };

      expect(extractToolNameFromAssistant(assistantMessage, 'call_2')).toBe('write');
    });

    test('handles malformed tool_call without function.name', () => {
      const assistantMessage = {
        role: 'assistant',
        tool_calls: [
          { id: 'call_1', function: {} }
        ]
      };

      const toolName = extractToolNameFromAssistant(assistantMessage, 'call_1');
      expect(toolName).toBe(null);
    });
  });

  describe('transformToolResult', () => {
    test('transforms tool result with tool name', () => {
      const toolMessage = {
        role: 'tool',
        tool_call_id: 'call_1',
        content: '{"dependencies":{"express":"^4.18.0"}}'
      };

      const result = transformToolResult(toolMessage, 'read');

      expect(result.role).toBe('user');
      expect(result.content).toBe('Tool Result from read:\n{"dependencies":{"express":"^4.18.0"}}');
    });

    test('transforms tool result without tool name', () => {
      const toolMessage = {
        role: 'tool',
        tool_call_id: 'call_1',
        content: 'file contents'
      };

      const result = transformToolResult(toolMessage, null);

      expect(result.role).toBe('user');
      expect(result.content).toBe('Tool Result:\nfile contents');
    });

    test('handles empty content with success message', () => {
      const toolMessage = {
        role: 'tool',
        tool_call_id: 'call_1',
        content: ''
      };

      const result = transformToolResult(toolMessage, 'bash');

      expect(result.role).toBe('user');
      expect(result.content).toBe('Tool Result from bash:\n(Command completed successfully with no output)');
    });

    test('handles missing content field with success message', () => {
      const toolMessage = {
        role: 'tool',
        tool_call_id: 'call_1'
      };

      const result = transformToolResult(toolMessage, 'write');

      expect(result.role).toBe('user');
      expect(result.content).toBe('Tool Result from write:\n(Command completed successfully with no output)');
    });

    test('preserves multiline content', () => {
      const toolMessage = {
        role: 'tool',
        content: 'line 1\nline 2\nline 3'
      };

      const result = transformToolResult(toolMessage, 'read');

      expect(result.content).toBe('Tool Result from read:\nline 1\nline 2\nline 3');
    });
  });

  describe('stripToolCalls', () => {
    test('removes tool_calls from assistant message', () => {
      const message = {
        role: 'assistant',
        content: 'I will read the file',
        tool_calls: [
          { id: 'call_1', function: { name: 'read' } }
        ]
      };

      const result = stripToolCalls(message);

      expect(result.role).toBe('assistant');
      expect(result.content).toBe('I will read the file');
      expect(result.tool_calls).toBeUndefined();
    });

    test('returns non-assistant messages unchanged', () => {
      const message = {
        role: 'user',
        content: 'hello'
      };

      const result = stripToolCalls(message);

      expect(result).toEqual(message);
    });

    test('handles assistant message without tool_calls', () => {
      const message = {
        role: 'assistant',
        content: 'hello'
      };

      const result = stripToolCalls(message);

      expect(result).toEqual(message);
    });
  });

  describe('transformMessagesWithToolResults', () => {
    test('transforms simple conversation with tool result', () => {
      const messages = [
        { role: 'user', content: 'Read package.json' },
        {
          role: 'assistant',
          content: 'I will read it',
          tool_calls: [
            {
              id: 'call_1',
              function: {
                name: 'read',
                arguments: '{"filePath":"/package.json"}'
              }
            }
          ]
        },
        {
          role: 'tool',
          tool_call_id: 'call_1',
          content: '{"name":"my-app"}'
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ role: 'user', content: 'Read package.json' });
      expect(result[1]).toEqual({ role: 'assistant', content: 'I will read it' });
      expect(result[2]).toEqual({
        role: 'user',
        content: 'Tool Result from read:\n{"name":"my-app"}'
      });
    });

    test('handles multiple tool results in sequence', () => {
      const messages = [
        { role: 'user', content: 'Read two files' },
        {
          role: 'assistant',
          content: 'Reading first file',
          tool_calls: [{ id: 'call_1', function: { name: 'read' } }]
        },
        {
          role: 'tool',
          tool_call_id: 'call_1',
          content: 'content1'
        },
        {
          role: 'assistant',
          content: 'Reading second file',
          tool_calls: [{ id: 'call_2', function: { name: 'read' } }]
        },
        {
          role: 'tool',
          tool_call_id: 'call_2',
          content: 'content2'
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result).toHaveLength(5);
      expect(result[2].content).toBe('Tool Result from read:\ncontent1');
      expect(result[4].content).toBe('Tool Result from read:\ncontent2');
    });

    test('handles messages without tool results', () => {
      const messages = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result).toEqual(messages);
    });

    test('handles empty messages array', () => {
      const result = transformMessagesWithToolResults([]);
      expect(result).toEqual([]);
    });

    test('handles non-array input', () => {
      const result = transformMessagesWithToolResults(null);
      expect(result).toBe(null);
    });

    test('strips tool_calls from assistant messages', () => {
      const messages = [
        { role: 'user', content: 'test' },
        {
          role: 'assistant',
          content: 'response',
          tool_calls: [{ id: 'call_1', function: { name: 'read' } }]
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result[1].tool_calls).toBeUndefined();
      expect(result[1].content).toBe('response');
    });

    test('handles tool result without matching assistant message', () => {
      const messages = [
        { role: 'user', content: 'test' },
        {
          role: 'tool',
          tool_call_id: 'call_1',
          content: 'result'
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result[1]).toEqual({
        role: 'user',
        content: 'Tool Result:\nresult'
      });
    });

    test('handles complete multi-turn conversation from docs example', () => {
      const messages = [
        { role: 'user', content: "What's in the package.json file?" },
        {
          role: 'assistant',
          content: "I'll read the package.json file.",
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: {
              name: 'read',
              arguments: '{"filePath":"/home/user/package.json"}'
            }
          }]
        },
        {
          role: 'tool',
          tool_call_id: 'call_1',
          content: '{"dependencies":{"express":"^4.18.0","axios":"^1.4.0"}}'
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(result[1].tool_calls).toBeUndefined();
      expect(result[2]).toEqual({
        role: 'user',
        content: 'Tool Result from read:\n{"dependencies":{"express":"^4.18.0","axios":"^1.4.0"}}'
      });
    });

    test('handles bash command tool result', () => {
      const messages = [
        { role: 'user', content: 'Install lodash' },
        {
          role: 'assistant',
          content: "I'll install lodash using npm.",
          tool_calls: [{
            id: 'call_5',
            function: {
              name: 'bash',
              arguments: '{"command":"npm install lodash","description":"Install lodash utility library"}'
            }
          }]
        },
        {
          role: 'tool',
          tool_call_id: 'call_5',
          content: 'added 1 package in 2.3s'
        }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result[2]).toEqual({
        role: 'user',
        content: 'Tool Result from bash:\nadded 1 package in 2.3s'
      });
    });

    test('preserves system messages', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'hello' }
      ];

      const result = transformMessagesWithToolResults(messages);

      expect(result[0]).toEqual({ role: 'system', content: 'You are a helpful assistant' });
    });
  });

  describe('hasToolResults', () => {
    test('returns true when tool results present', () => {
      const messages = [
        { role: 'user', content: 'test' },
        { role: 'tool', content: 'result' }
      ];

      expect(hasToolResults(messages)).toBe(true);
    });

    test('returns false when no tool results', () => {
      const messages = [
        { role: 'user', content: 'test' },
        { role: 'assistant', content: 'response' }
      ];

      expect(hasToolResults(messages)).toBe(false);
    });

    test('returns false for empty array', () => {
      expect(hasToolResults([])).toBe(false);
    });

    test('returns false for non-array', () => {
      expect(hasToolResults(null)).toBe(false);
      expect(hasToolResults(undefined)).toBe(false);
    });
  });

  describe('hasToolCalls', () => {
    test('returns true when assistant has tool_calls', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'test',
          tool_calls: [{ id: 'call_1', function: { name: 'read' } }]
        }
      ];

      expect(hasToolCalls(messages)).toBe(true);
    });

    test('returns false when no tool_calls', () => {
      const messages = [
        { role: 'assistant', content: 'test' }
      ];

      expect(hasToolCalls(messages)).toBe(false);
    });

    test('returns false when tool_calls is empty array', () => {
      const messages = [
        { role: 'assistant', content: 'test', tool_calls: [] }
      ];

      expect(hasToolCalls(messages)).toBe(false);
    });

    test('returns false for non-array', () => {
      expect(hasToolCalls(null)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles tool result with special characters', () => {
      const toolMessage = {
        role: 'tool',
        content: 'Error: file not found\n\tat line 42'
      };

      const result = transformToolResult(toolMessage, 'read');

      expect(result.content).toBe('Tool Result from read:\nError: file not found\n\tat line 42');
    });

    test('handles tool result with JSON content', () => {
      const toolMessage = {
        role: 'tool',
        content: '{"status":"success","data":{"count":5}}'
      };

      const result = transformToolResult(toolMessage, 'api_call');

      expect(result.content).toContain('Tool Result from api_call:');
      expect(result.content).toContain('{"status":"success","data":{"count":5}}');
    });

    test('handles very long tool result content', () => {
      const longContent = 'x'.repeat(10000);
      const toolMessage = {
        role: 'tool',
        content: longContent
      };

      const result = transformToolResult(toolMessage, 'read');

      expect(result.content.length).toBe(longContent.length + 'Tool Result from read:\n'.length);
    });

    test('handles unicode in tool results', () => {
      const toolMessage = {
        role: 'tool',
        content: '{"message":"Hello 世界 🌍"}'
      };

      const result = transformToolResult(toolMessage, 'test');

      expect(result.content).toBe('Tool Result from test:\n{"message":"Hello 世界 🌍"}');
    });
  });
});
