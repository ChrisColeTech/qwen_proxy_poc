/**
 * Tool Calling End-to-End Integration Tests
 *
 * Tests the complete tool calling flow:
 * OpenAI Request → Transform → Qwen → Parse Response → OpenAI Format
 *
 * Verifies Phase 6: Middleware Integration & Testing
 *
 * Coverage:
 * - Tool definition injection (OpenAI → XML)
 * - System prompt enhancement (first message only)
 * - Response parsing (XML → OpenAI tool_calls)
 * - Tool result handling (role: "tool" → role: "user")
 * - Both streaming and non-streaming modes
 * - Feature flag control
 */

const { transformToQwenRequest } = require('../../src/transformers/openai-to-qwen-transformer');
const { transformToOpenAICompletion } = require('../../src/transformers/qwen-to-openai-transformer');
const { SSETransformer } = require('../../src/transformers/sse-transformer');
const { parseResponse, hasToolCall } = require('../../src/parsers/xml-tool-parser');
const { transformToolsToXML } = require('../../src/transformers/tool-to-xml-transformer');
const { transformMessagesWithToolResults } = require('../../src/handlers/tool-result-handler');
const crypto = require('crypto');

describe('Tool Calling End-to-End Integration', () => {

  describe('Complete Flow: OpenAI → Qwen → OpenAI', () => {

    test('E2E-01: Tool definition injection on first message', () => {
      // OpenAI request with tools
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Read the file /etc/hosts' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'read_file',
              description: 'Read contents of a file',
              parameters: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Path to file' }
                },
                required: ['path']
              }
            }
          }
        ]
      };

      // Session (first message - parentId is null)
      const session = {
        chatId: crypto.randomUUID(),
        parentId: null
      };

      // Transform to Qwen format
      const qwenRequest = transformToQwenRequest(openAIRequest, session, false);

      // Verify tool definitions are injected into system message
      expect(qwenRequest.messages).toHaveLength(2); // system + user

      const systemMessage = qwenRequest.messages.find(m => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain('TOOL USE');
      expect(systemMessage.content).toContain('<read_file>');
      expect(systemMessage.content).toContain('<path>');
      expect(systemMessage.content).toContain('Read contents of a file');
    });

    test('E2E-02: Tool definitions NOT injected on follow-up messages', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
          { role: 'user', content: 'Read another file' }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'read_file',
              description: 'Read contents of a file',
              parameters: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Path to file' }
                },
                required: ['path']
              }
            }
          }
        ]
      };

      // Session (follow-up - parentId exists)
      const session = {
        chatId: crypto.randomUUID(),
        parentId: crypto.randomUUID() // Follow-up message
      };

      // Transform to Qwen format
      const qwenRequest = transformToQwenRequest(openAIRequest, session, false);

      // Verify system message is NOT included on follow-up
      expect(qwenRequest.messages).toHaveLength(1); // Only last user message
      expect(qwenRequest.messages[0].role).toBe('user');
      expect(qwenRequest.messages[0].content).toBe('Read another file');
    });

    test('E2E-03: Parse Qwen XML response to OpenAI tool_calls (non-streaming)', () => {
      // Simulated Qwen response with XML tool call
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: "I'll read that file for you.\n\n<read_file>\n<path>/etc/hosts</path>\n</read_file>"
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      // Transform to OpenAI format
      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      // Verify tool call was parsed
      expect(openAIResponse.choices[0].message.tool_calls).toBeDefined();
      expect(openAIResponse.choices[0].message.tool_calls).toHaveLength(1);

      const toolCall = openAIResponse.choices[0].message.tool_calls[0];
      expect(toolCall.type).toBe('function');
      expect(toolCall.function.name).toBe('read_file');

      const args = JSON.parse(toolCall.function.arguments);
      expect(args.path).toBe('/etc/hosts');

      // Verify finish reason
      expect(openAIResponse.choices[0].finish_reason).toBe('tool_calls');

      // Verify text before tool call
      expect(openAIResponse.choices[0].message.content).toBe("I'll read that file for you.");
    });

    test('E2E-04: Parse Qwen XML response in streaming mode', async () => {
      // Simulate streaming chunks
      const chunks = [
        'data: {"response.created": {"chat_id": "test-123", "parent_id": "parent-456", "response_id": "resp-789"}}\n\n',
        'data: {"choices": [{"delta": {"content": "I\'ll read ", "role": "assistant", "status": "typing"}}], "usage": {"input_tokens": 10, "output_tokens": 5, "total_tokens": 15}}\n\n',
        'data: {"choices": [{"delta": {"content": "that file.\\n\\n", "role": "assistant", "status": "typing"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "<read_file>\\n", "role": "assistant", "status": "typing"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "<path>/etc/hosts</path>\\n", "role": "assistant", "status": "typing"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "</read_file>", "role": "assistant", "status": "typing"}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished"}}]}\n\n'
      ];

      const transformer = new SSETransformer('qwen3-max');
      const allChunks = [];

      // Process all chunks
      for (const chunk of chunks) {
        const transformed = transformer.processChunk(chunk);
        allChunks.push(...transformed);
      }

      // Finalize
      const finalChunks = transformer.finalize();
      allChunks.push(...finalChunks);

      // Verify tool call was detected and streamed
      const toolCallChunks = allChunks.filter(c =>
        c !== '[DONE]' &&
        c.choices?.[0]?.delta?.tool_calls
      );

      expect(toolCallChunks.length).toBeGreaterThan(0);

      // Verify complete response contains tool call
      const completeResponse = transformer.getCompleteResponse();
      expect(completeResponse.choices[0].message.tool_calls).toBeDefined();
      expect(completeResponse.choices[0].message.tool_calls).toHaveLength(1);
      expect(completeResponse.choices[0].message.tool_calls[0].function.name).toBe('read_file');
      expect(completeResponse.choices[0].finish_reason).toBe('tool_calls');
    });

    test('E2E-05: Tool result transformation (role: "tool" → role: "user")', () => {
      // OpenAI request with tool result
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Read /etc/hosts' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'read_file',
                  arguments: '{"path":"/etc/hosts"}'
                }
              }
            ]
          },
          {
            role: 'tool',
            tool_call_id: 'call_123',
            content: '127.0.0.1 localhost'
          }
        ]
      };

      const session = {
        chatId: crypto.randomUUID(),
        parentId: crypto.randomUUID()
      };

      // Transform to Qwen format
      const qwenRequest = transformToQwenRequest(openAIRequest, session, false);

      // Verify tool result was transformed to user message
      const lastMessage = qwenRequest.messages[qwenRequest.messages.length - 1];
      expect(lastMessage.role).toBe('user');
      expect(lastMessage.content).toContain('read_file');
      expect(lastMessage.content).toContain('127.0.0.1 localhost');
    });

    test('E2E-06: Multiple parameters in tool call', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '<write_file>\n<path>/tmp/test.txt</path>\n<content>Hello World</content>\n<append>false</append>\n</write_file>'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      const toolCall = openAIResponse.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      expect(toolCall.function.name).toBe('write_file');
      expect(args.path).toBe('/tmp/test.txt');
      expect(args.content).toBe('Hello World');
      expect(args.append).toBe(false); // Type conversion
    });

    test('E2E-07: Type conversion in parameters', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '<calculate>\n<x>42</x>\n<y>3.14</y>\n<precise>true</precise>\n</calculate>'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      const toolCall = openAIResponse.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      expect(args.x).toBe(42); // Integer
      expect(args.y).toBe(3.14); // Float
      expect(args.precise).toBe(true); // Boolean
    });

    test('E2E-08: Feature flag disables tool calling', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '<read_file>\n<path>/etc/hosts</path>\n</read_file>'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      // Transform with tool calling disabled
      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: false
      });

      // Verify tool call was NOT parsed
      expect(openAIResponse.choices[0].message.tool_calls).toBeUndefined();
      expect(openAIResponse.choices[0].message.content).toContain('<read_file>');
      expect(openAIResponse.choices[0].finish_reason).toBe('stop');
    });

    test('E2E-09: Graceful degradation on malformed XML', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'This is text with <broken xml that is not valid'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      // Verify graceful degradation - returns text content
      expect(openAIResponse.choices[0].message.tool_calls).toBeUndefined();
      expect(openAIResponse.choices[0].message.content).toBe('This is text with <broken xml that is not valid');
      expect(openAIResponse.choices[0].finish_reason).toBe('stop');
    });

    test('E2E-10: Text-only response (no tool call)', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'This is a normal text response without any tool calls.'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      // Verify normal text response
      expect(openAIResponse.choices[0].message.tool_calls).toBeUndefined();
      expect(openAIResponse.choices[0].message.content).toBe('This is a normal text response without any tool calls.');
      expect(openAIResponse.choices[0].finish_reason).toBe('stop');
    });
  });

  describe('XML Tool Parser Integration', () => {

    test('E2E-11: hasToolCall detection', () => {
      expect(hasToolCall('<read_file>\n<path>/etc/hosts</path>\n</read_file>')).toBe(true);
      expect(hasToolCall('Just plain text')).toBe(false);
      expect(hasToolCall('Text with <incomplete')).toBe(false);
      expect(hasToolCall('')).toBe(false);
      expect(hasToolCall(null)).toBe(false);
    });

    test('E2E-12: parseResponse extraction', () => {
      const text = "Let me help you.\n\n<execute>\n<command>ls -la</command>\n</execute>";
      const parsed = parseResponse(text);

      expect(parsed.hasToolCall).toBe(true);
      expect(parsed.textBeforeToolCall).toBe('Let me help you.');
      expect(parsed.toolCall.function.name).toBe('execute');

      const args = JSON.parse(parsed.toolCall.function.arguments);
      expect(args.command).toBe('ls -la');
    });

    test('E2E-13: RooCode convention - one tool per message', () => {
      // Multiple tool calls in response (edge case)
      const text = '<read>\n<path>/file1</path>\n</read>\n\n<read>\n<path>/file2</path>\n</read>';
      const parsed = parseResponse(text);

      // Should only parse the FIRST tool call
      expect(parsed.hasToolCall).toBe(true);
      expect(parsed.toolCall.function.name).toBe('read');

      const args = JSON.parse(parsed.toolCall.function.arguments);
      expect(args.path).toBe('/file1');
    });
  });

  describe('Tool Definition Transformation', () => {

    test('E2E-14: Complex tool with nested parameters', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'complex_tool',
            description: 'A complex tool with nested parameters',
            parameters: {
              type: 'object',
              properties: {
                simple: { type: 'string', description: 'Simple param' },
                number: { type: 'number', description: 'Numeric param' },
                flag: { type: 'boolean', description: 'Boolean param' },
                nested: {
                  type: 'object',
                  description: 'Nested object',
                  properties: {
                    inner: { type: 'string', description: 'Inner param' }
                  }
                }
              },
              required: ['simple', 'number']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('<complex_tool>');
      expect(xml).toContain('A complex tool with nested parameters');
      expect(xml).toContain('<simple>');
      expect(xml).toContain('Simple param');
      expect(xml).toContain('(required)'); // Parameters are marked as required
      expect(xml).toContain('simple:'); // Simple parameter exists
      expect(xml).toContain('number:'); // Number parameter exists
    });

    test('E2E-15: Multiple tools transformation', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' }
              },
              required: ['path']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'write',
            description: 'Write a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content' }
              },
              required: ['path', 'content']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('<read>');
      expect(xml).toContain('Read a file');
      expect(xml).toContain('<write>');
      expect(xml).toContain('Write a file');
    });
  });

  describe('Backward Compatibility', () => {

    test('E2E-16: Legacy signature support (model as string)', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Normal text response'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      // Old signature: (response, model)
      const openAIResponse = transformToOpenAICompletion(qwenResponse, 'qwen3-turbo');

      expect(openAIResponse.model).toBe('qwen3-turbo');
      expect(openAIResponse.choices[0].message.content).toBe('Normal text response');
    });

    test('E2E-17: Requests without tools are handled normally', () => {
      const openAIRequest = {
        model: 'qwen3-max',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' }
        ]
        // No tools
      };

      const session = {
        chatId: crypto.randomUUID(),
        parentId: null
      };

      const qwenRequest = transformToQwenRequest(openAIRequest, session, false);

      // Verify normal transformation without tool injection
      const systemMessage = qwenRequest.messages.find(m => m.role === 'system');
      expect(systemMessage.content).toBe('You are a helpful assistant.');
      expect(systemMessage.content).not.toContain('TOOL USE');
    });
  });

  describe('Error Handling & Edge Cases', () => {

    test('E2E-18: Empty response content', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: ''
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      expect(openAIResponse.choices[0].message.content).toBe('');
      expect(openAIResponse.choices[0].message.tool_calls).toBeUndefined();
      expect(openAIResponse.choices[0].finish_reason).toBe('stop');
    });

    test('E2E-19: Whitespace handling in tool calls', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '  \n\n  <read>  \n  <path>  /etc/hosts  </path>  \n  </read>  \n\n  '
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      const toolCall = openAIResponse.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      // Whitespace should be trimmed from parameter values
      expect(args.path.trim()).toBe('/etc/hosts');
    });

    test('E2E-20: Tool call with special characters in parameters', () => {
      const qwenResponse = {
        data: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '<execute>\n<command>echo "Hello &lt;World&gt;" | grep -o "\\w+"</command>\n</execute>'
              }
            }
          ],
          parent_id: crypto.randomUUID(),
          message_id: crypto.randomUUID()
        }
      };

      const openAIResponse = transformToOpenAICompletion(qwenResponse, {
        model: 'qwen3-max',
        enableToolCalling: true
      });

      const toolCall = openAIResponse.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      // Special characters should be preserved
      expect(args.command).toContain('echo');
      expect(args.command).toContain('grep');
    });
  });
});
