/**
 * Unit Tests: OpenAI to Qwen Transformer
 *
 * Tests the complete transformation chain from OpenAI format to Qwen format,
 * including tool injection into system prompts.
 */

const {
  extractMessagesToSend,
  createQwenMessage,
  transformToQwenRequest,
  transformToQwenRequestNonStreaming,
  validateQwenMessage,
  injectToolDefinitions
} = require('../../src/transformers/openai-to-qwen-transformer');

describe('OpenAI to Qwen Transformer', () => {
  describe('extractMessagesToSend', () => {
    test('includes system message on first request (parentId null)', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' }
      ];

      const result = extractMessagesToSend(messages, null);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe('You are a helpful assistant.');
      expect(result[1].role).toBe('user');
    });

    test('excludes system message on continuation (parentId present)', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Follow-up question' }
      ];

      const result = extractMessagesToSend(messages, 'some-parent-id');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('Follow-up question');
    });

    test('combines multiple system messages with newline separator', () => {
      const messages = [
        { role: 'system', content: 'You are OpenCode assistant.' },
        { role: 'system', content: 'Working directory: /home/user' },
        { role: 'user', content: 'Help me' }
      ];

      const result = extractMessagesToSend(messages, null);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe('You are OpenCode assistant.\n\nWorking directory: /home/user');
      expect(result[1].role).toBe('user');
    });

    test('injects tools into combined system messages', () => {
      const messages = [
        { role: 'system', content: 'You are OpenCode.' },
        { role: 'system', content: 'Environment: development' },
        { role: 'user', content: 'Read file.txt' }
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
                file_path: { type: 'string', description: 'File path' }
              },
              required: ['file_path']
            }
          }
        }
      ];

      const result = extractMessagesToSend(messages, null, tools);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toContain('You are OpenCode.');
      expect(result[0].content).toContain('Environment: development');
      expect(result[0].content).toContain('TOOL USE');
      expect(result[0].content).toContain('<tools>');
      expect(result[0].content).toContain('## read');
      expect(result[0].content).toContain('</tools>');
    });

    test('creates system message with tools if none exists', () => {
      const messages = [
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
                file_path: { type: 'string' }
              },
              required: ['file_path']
            }
          }
        }
      ];

      const result = extractMessagesToSend(messages, null, tools);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toContain('You are a helpful AI assistant.');
      expect(result[0].content).toContain('TOOL USE');
      expect(result[0].content).toContain('## read');
    });

    test('does not inject tools on continuation request', () => {
      const messages = [
        { role: 'system', content: 'You are OpenCode.' },
        { role: 'user', content: 'Follow-up' }
      ];

      const tools = [
        {
          type: 'function',
          function: { name: 'read', description: 'Read file' }
        }
      ];

      const result = extractMessagesToSend(messages, 'parent-id', tools);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      expect(result[0].content).not.toContain('TOOL USE');
    });

    test('handles OpenCode-style multiple system messages with tools', () => {
      const messages = [
        {
          role: 'system',
          content: 'You are opencode, an interactive CLI tool that helps users with software engineering tasks.'
        },
        {
          role: 'system',
          content: 'Here is some useful information about the environment you are running in:\n<env>\n  Working directory: /mnt/d/Projects/qwen_proxy\n  Is directory a git repo: Yes\n  Platform: linux\n</env>'
        },
        { role: 'user', content: 'help me debug this' }
      ];

      const tools = [
        {
          type: 'function',
          function: {
            name: 'bash',
            description: 'Execute bash command',
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
            name: 'read',
            description: 'Read file',
            parameters: {
              type: 'object',
              properties: {
                file_path: { type: 'string', description: 'File path' }
              },
              required: ['file_path']
            }
          }
        }
      ];

      const result = extractMessagesToSend(messages, null, tools);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');

      // Check both system messages are combined
      expect(result[0].content).toContain('You are opencode');
      expect(result[0].content).toContain('Working directory: /mnt/d/Projects/qwen_proxy');

      // Check tools are injected
      expect(result[0].content).toContain('TOOL USE');
      expect(result[0].content).toContain('<tools>');
      expect(result[0].content).toContain('## bash');
      expect(result[0].content).toContain('## read');
      expect(result[0].content).toContain('</tools>');

      // Check user message preserved
      expect(result[1].role).toBe('user');
      expect(result[1].content).toBe('help me debug this');
    });

    test('throws error for empty messages array', () => {
      expect(() => extractMessagesToSend([], null)).toThrow('Messages array is empty');
    });

    test('throws error for null messages', () => {
      expect(() => extractMessagesToSend(null, null)).toThrow('Messages array is empty');
    });
  });

  describe('injectToolDefinitions', () => {
    test('injects tool definitions into system prompt', () => {
      const systemContent = 'You are a helpful assistant.';
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read a file',
            parameters: {
              type: 'object',
              properties: {
                file_path: { type: 'string', description: 'File path' }
              },
              required: ['file_path']
            }
          }
        }
      ];

      const result = injectToolDefinitions(systemContent, tools);

      expect(result).toContain('You are a helpful assistant.');
      expect(result).toContain('TOOL USE');
      expect(result).toContain('## Tool Use Rules');
      expect(result).toContain('Use exactly one tool per message');
      expect(result).toContain('## Available Tools');
      expect(result).toContain('<tools>');
      expect(result).toContain('## read');
      expect(result).toContain('</tools>');
    });

    test('returns original content if no tools provided', () => {
      const systemContent = 'You are a helpful assistant.';
      const result = injectToolDefinitions(systemContent, null);
      expect(result).toBe(systemContent);
    });

    test('returns original content if tools array is empty', () => {
      const systemContent = 'You are a helpful assistant.';
      const result = injectToolDefinitions(systemContent, []);
      expect(result).toBe(systemContent);
    });

    test('returns original content if tools are invalid', () => {
      const systemContent = 'You are a helpful assistant.';
      const tools = [
        { type: 'function', function: {} } // No name
      ];
      const result = injectToolDefinitions(systemContent, tools);
      expect(result).toBe(systemContent);
    });

    test('injects multiple tools correctly', () => {
      const systemContent = 'You are OpenCode.';
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read file',
            parameters: {
              type: 'object',
              properties: { file_path: { type: 'string' } },
              required: ['file_path']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'write',
            description: 'Write file',
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
            name: 'bash',
            description: 'Execute command',
            parameters: {
              type: 'object',
              properties: { command: { type: 'string' } },
              required: ['command']
            }
          }
        }
      ];

      const result = injectToolDefinitions(systemContent, tools);

      expect(result).toContain('You are OpenCode.');
      expect(result).toContain('## read');
      expect(result).toContain('## write');
      expect(result).toContain('## bash');
      expect(result).toContain('<read>');
      expect(result).toContain('<write>');
      expect(result).toContain('<bash>');
    });
  });

  describe('createQwenMessage', () => {
    test('creates message with all 18 required fields', () => {
      const message = { role: 'user', content: 'Hello' };
      const result = createQwenMessage(message, null, 'qwen3-max');

      // Validate all 18 fields exist
      expect(result.fid).toBeDefined();
      expect(result.parentId).toBeNull();
      expect(result.parent_id).toBeNull();
      expect(result.childrenIds).toEqual([]);
      expect(result.role).toBe('user');
      expect(result.content).toBe('Hello');
      expect(result.user_action).toBe('chat');
      expect(result.files).toEqual([]);
      expect(result.timestamp).toBeDefined();
      expect(result.models).toEqual(['qwen3-max']);
      expect(result.chat_type).toBe('t2t');
      expect(result.sub_chat_type).toBe('t2t');
      expect(result.feature_config).toBeDefined();
      expect(result.feature_config.thinking_enabled).toBe(false);
      expect(result.feature_config.output_schema).toBe('phase');
      expect(result.extra).toBeDefined();
      expect(result.extra.meta).toBeDefined();
      expect(result.extra.meta.subChatType).toBe('t2t');
    });

    test('validates message has all required fields', () => {
      const message = { role: 'user', content: 'Test' };
      const result = createQwenMessage(message);
      const validation = validateQwenMessage(result);

      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toEqual([]);
    });

    test('uses Unix seconds for timestamp', () => {
      const message = { role: 'user', content: 'Test' };
      const result = createQwenMessage(message);

      // Unix seconds should be ~10 digits, milliseconds would be ~13 digits
      expect(String(result.timestamp).length).toBeLessThanOrEqual(10);
      expect(result.timestamp).toBeGreaterThan(1600000000); // After 2020
      expect(result.timestamp).toBeLessThan(2000000000); // Before 2033
    });

    test('sets parent_id correctly for child messages', () => {
      const message = { role: 'user', content: 'Follow-up' };
      const parentId = 'parent-uuid-123';
      const result = createQwenMessage(message, parentId);

      expect(result.parentId).toBe(parentId);
      expect(result.parent_id).toBe(parentId);
    });

    test('normalizes multimodal content to string', () => {
      const message = {
        role: 'user',
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' }
        ]
      };

      const result = createQwenMessage(message);

      expect(result.content).toBe('First part\nSecond part');
    });
  });

  describe('transformToQwenRequest - Tool Calling Flow', () => {
    test('transforms first request with tools correctly', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are OpenCode.' },
          { role: 'system', content: 'Environment: development' },
          { role: 'user', content: 'Read file.txt' }
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
                  file_path: { type: 'string', description: 'File path' }
                },
                required: ['file_path']
              }
            }
          }
        ]
      };

      const session = {
        chatId: 'chat-123',
        parentId: null // First message
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Check request structure
      expect(result.stream).toBe(true);
      expect(result.incremental_output).toBe(true);
      expect(result.chat_id).toBe('chat-123');
      expect(result.chat_mode).toBe('guest');
      expect(result.model).toBe('qwen3-max');
      expect(result.parent_id).toBeNull();

      // Check messages
      expect(result.messages).toHaveLength(2);

      // Check system message has combined content + tools
      const systemMsg = result.messages[0];
      expect(systemMsg.role).toBe('system');
      expect(systemMsg.content).toContain('You are OpenCode.');
      expect(systemMsg.content).toContain('Environment: development');
      expect(systemMsg.content).toContain('TOOL USE');
      expect(systemMsg.content).toContain('## read');
      expect(systemMsg.parent_id).toBeNull();

      // Check user message
      const userMsg = result.messages[1];
      expect(userMsg.role).toBe('user');
      expect(userMsg.content).toBe('Read file.txt');
      expect(userMsg.parent_id).toBeNull();
    });

    test('transforms continuation request without tools', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are OpenCode.' },
          { role: 'user', content: 'Follow-up question' }
        ],
        tools: [
          {
            type: 'function',
            function: { name: 'read', description: 'Read file' }
          }
        ]
      };

      const session = {
        chatId: 'chat-123',
        parentId: 'parent-uuid-456' // Continuation
      };

      const result = transformToQwenRequest(openAIRequest, session);

      // Should only have user message, no system message
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).not.toContain('TOOL USE');
      expect(result.messages[0].parent_id).toBe('parent-uuid-456');
      expect(result.parent_id).toBe('parent-uuid-456');
    });

    test('transforms request with multiple OpenCode-style tools', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are OpenCode assistant.' },
          { role: 'user', content: 'Help me' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'bash',
              description: 'Execute bash command',
              parameters: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'Command' },
                  description: { type: 'string', description: 'Description' }
                },
                required: ['command', 'description']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'read',
              description: 'Read file',
              parameters: {
                type: 'object',
                properties: {
                  file_path: { type: 'string', description: 'Path' }
                },
                required: ['file_path']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'write',
              description: 'Write file',
              parameters: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  content: { type: 'string' }
                },
                required: ['file_path', 'content']
              }
            }
          }
        ]
      };

      const session = { chatId: 'chat-123', parentId: null };
      const result = transformToQwenRequest(openAIRequest, session);

      const systemMsg = result.messages[0];
      expect(systemMsg.content).toContain('## bash');
      expect(systemMsg.content).toContain('## read');
      expect(systemMsg.content).toContain('## write');
      expect(systemMsg.content).toContain('<bash>');
      expect(systemMsg.content).toContain('<read>');
      expect(systemMsg.content).toContain('<write>');
    });

    test('transforms non-streaming request', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'Assistant' },
          { role: 'user', content: 'Hello' }
        ]
      };

      const session = { chatId: 'chat-123', parentId: null };
      const result = transformToQwenRequestNonStreaming(openAIRequest, session);

      expect(result.stream).toBe(false);
      expect(result.incremental_output).toBe(true);
    });
  });

  describe('validateQwenMessage', () => {
    test('validates complete message', () => {
      const message = createQwenMessage({ role: 'user', content: 'Test' });
      const validation = validateQwenMessage(message);

      expect(validation.valid).toBe(true);
      expect(validation.missingFields).toEqual([]);
    });

    test('detects missing top-level fields', () => {
      const message = {
        fid: 'test',
        role: 'user',
        content: 'Test'
        // Missing many required fields
      };

      const validation = validateQwenMessage(message);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields.length).toBeGreaterThan(0);
    });

    test('detects missing nested fields', () => {
      const message = createQwenMessage({ role: 'user', content: 'Test' });
      delete message.feature_config.thinking_enabled;

      const validation = validateQwenMessage(message);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields).toContain('feature_config.thinking_enabled');
    });
  });
});
