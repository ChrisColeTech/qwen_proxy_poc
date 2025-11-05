/**
 * Integration Tests for Tool Result Handler with OpenAI-to-Qwen Transformer
 *
 * Tests that tool result messages are properly transformed when going through
 * the full transformation pipeline.
 */

const {
  transformToQwenRequest,
  extractMessagesToSend
} = require('../../src/transformers/openai-to-qwen-transformer');

describe('Tool Result Transformer Integration', () => {
  describe('transformToQwenRequest with tool results', () => {
    test('transforms complete tool calling conversation', () => {
      const openAIRequest = {
        messages: [
          { role: 'user', content: 'Read package.json' },
          {
            role: 'assistant',
            content: "I'll read the package.json file.",
            tool_calls: [{
              id: 'call_1',
              type: 'function',
              function: {
                name: 'read',
                arguments: '{"filePath":"/package.json"}'
              }
            }]
          },
          {
            role: 'tool',
            tool_call_id: 'call_1',
            content: '{"dependencies":{"express":"^4.18.0"}}'
          }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-456'
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Should extract only the last message (tool result transformed to user)
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe(
        'Tool Result from read:\n{"dependencies":{"express":"^4.18.0"}}'
      );
      expect(result.messages[0].parentId).toBe('parent-456');
    });

    test('strips tool_calls from assistant messages in first request', () => {
      const openAIRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Read package.json' },
          {
            role: 'assistant',
            content: "I'll read the file.",
            tool_calls: [{
              id: 'call_1',
              function: { name: 'read' }
            }]
          }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: null // First request
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // First request includes system message and last message
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].role).toBe('assistant');
      expect(result.messages[1].content).toBe("I'll read the file.");
      expect(result.messages[1].tool_calls).toBeUndefined();
    });

    test('handles multiple sequential tool calls', () => {
      const openAIRequest = {
        messages: [
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
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-789'
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Should extract only last message (second tool result)
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe('Tool Result from read:\ncontent2');
    });

    test('handles tool result without matching tool call', () => {
      const openAIRequest = {
        messages: [
          { role: 'user', content: 'test' },
          {
            role: 'tool',
            tool_call_id: 'call_unknown',
            content: 'result'
          }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-456'
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Should use generic format when tool name not found
      expect(result.messages[0].content).toBe('Tool Result:\nresult');
    });

    test('handles bash command tool result', () => {
      const openAIRequest = {
        messages: [
          { role: 'user', content: 'Install lodash' },
          {
            role: 'assistant',
            content: "I'll install lodash",
            tool_calls: [{
              id: 'call_5',
              function: {
                name: 'bash',
                arguments: '{"command":"npm install lodash"}'
              }
            }]
          },
          {
            role: 'tool',
            tool_call_id: 'call_5',
            content: 'added 1 package in 2.3s'
          }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-abc'
      };

      const result = transformToQwenRequest(openAIRequest, session);

      expect(result.messages[0].content).toBe(
        'Tool Result from bash:\nadded 1 package in 2.3s'
      );
    });

    test('preserves non-tool messages correctly', () => {
      const openAIRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-456'
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Should extract last message unchanged
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe('How are you?');
    });
  });

  describe('extractMessagesToSend basic functionality', () => {
    test('extracts system message on first request', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];

      const result = extractMessagesToSend(messages, null, null);

      // First request: system + last message
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe('You are helpful');
      expect(result[1].role).toBe('user');
      expect(result[1].content).toBe('Hello');
    });

    test('extracts only last message on continuation request', () => {
      const messages = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second' }
      ];

      const result = extractMessagesToSend(messages, 'parent-123', null);

      // Continuation: only last message
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('Second');
    });

    test('injects tool definitions into system message', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];

      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read a file',
            parameters: {
              type: 'object',
              properties: {
                filePath: { type: 'string' }
              },
              required: ['filePath']
            }
          }
        }
      ];

      const result = extractMessagesToSend(messages, null, tools);

      expect(result[0].content).toContain('You are helpful');
      expect(result[0].content).toContain('TOOL USE');
      expect(result[0].content).toContain('## read');
    });
  });

  describe('Tool results with tool definitions', () => {
    test('combines tool definitions with tool results correctly', () => {
      const openAIRequest = {
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Read file' },
          {
            role: 'assistant',
            content: 'Reading',
            tool_calls: [{ id: 'call_1', function: { name: 'read' } }]
          },
          {
            role: 'tool',
            tool_call_id: 'call_1',
            content: 'file contents'
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'read',
              description: 'Read a file',
              parameters: {
                type: 'object',
                properties: {
                  filePath: { type: 'string' }
                },
                required: ['filePath']
              }
            }
          }
        ],
        model: 'qwen3-max'
      };

      const session = {
        chatId: 'chat-123',
        parentId: null // First request
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // First request with tools: system message should have tool definitions
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toContain('TOOL USE');
      expect(result.messages[0].content).toContain('## read');

      // Last message should be transformed tool result
      expect(result.messages[1].role).toBe('user');
      expect(result.messages[1].content).toBe('Tool Result from read:\nfile contents');
    });
  });
});
