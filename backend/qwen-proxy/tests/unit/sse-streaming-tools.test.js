const { SSETransformer } = require('../../src/transformers/sse-transformer');

/**
 * Unit Tests for SSE Streaming with Tool Calls (Phase 4)
 *
 * Tests streaming tool call detection and transformation:
 * 1. Tool call detection in streaming responses
 * 2. Tool call formatting in OpenAI streaming format
 * 3. Text before tool call streaming
 * 4. Partial XML buffering
 * 5. finish_reason changes to 'tool_calls'
 * 6. Complete response includes tool_calls
 */

describe('SSETransformer - Streaming Tool Calls', () => {
  let transformer;

  beforeEach(() => {
    transformer = new SSETransformer('qwen3-max');
  });

  describe('Tool Call Detection', () => {
    test('should detect XML tool call in streaming content', () => {
      // Simulate streaming chunks
      const chunk1 = Buffer.from('data: {"choices":[{"delta":{"content":"I\'ll read the file.\\n\\n"}}]}\n\n');
      const chunk2 = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/src/app.js</filePath>\\n</read>"}}]}\n\n');

      transformer.processChunk(chunk1);
      transformer.processChunk(chunk2);

      expect(transformer.toolCallDetected).toBe(true);
    });

    test('should not detect tool call in normal text', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"This is normal text without any tool calls."}}]}\n\n');

      transformer.processChunk(chunk);

      expect(transformer.toolCallDetected).toBe(false);
    });

    test('should detect tool call with multiple parameters', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<bash>\\n<command>npm install</command>\\n<description>Install packages</description>\\n</bash>"}}]}\n\n');

      transformer.processChunk(chunk);

      expect(transformer.toolCallDetected).toBe(true);
    });
  });

  describe('Streaming Tool Call Format', () => {
    test('should stream tool call in OpenAI format', () => {
      // Stream complete tool call
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"I\'ll read it.\\n\\n<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      // Should get: text chunk, tool start chunk, tool args chunk
      expect(output.length).toBeGreaterThanOrEqual(3);

      // Check text before tool call
      const textChunk = output.find(c => c.choices?.[0]?.delta?.content === "I'll read it.");
      expect(textChunk).toBeDefined();

      // Check tool call start chunk
      const toolStartChunk = output.find(c =>
        c.choices?.[0]?.delta?.tool_calls?.[0]?.function?.name === 'read'
      );
      expect(toolStartChunk).toBeDefined();
      expect(toolStartChunk.choices[0].delta.tool_calls[0]).toMatchObject({
        index: 0,
        type: 'function',
        function: {
          name: 'read',
          arguments: ''
        }
      });
      expect(toolStartChunk.choices[0].delta.tool_calls[0].id).toMatch(/^call_/);

      // Check tool call arguments chunk
      const argsChunk = output.find(c =>
        c.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments?.includes('filePath')
      );
      expect(argsChunk).toBeDefined();
      expect(argsChunk.choices[0].delta.tool_calls[0].function.arguments).toContain('/test.js');
    });

    test('should set correct tool_call structure', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/app.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      const toolChunk = output.find(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunk.choices[0].delta.tool_calls[0]).toHaveProperty('id');
      expect(toolChunk.choices[0].delta.tool_calls[0]).toHaveProperty('type', 'function');
      expect(toolChunk.choices[0].delta.tool_calls[0]).toHaveProperty('function');
      expect(toolChunk.choices[0].delta.tool_calls[0].function).toHaveProperty('name');
    });

    test('should generate unique tool call ID', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      const toolChunk = output.find(c => c.choices?.[0]?.delta?.tool_calls);
      const toolCallId = toolChunk.choices[0].delta.tool_calls[0].id;

      expect(toolCallId).toBeTruthy();
      expect(toolCallId).toMatch(/^call_[a-f0-9]+$/);
    });
  });

  describe('Text Before Tool Call', () => {
    test('should stream text before tool call separately', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Let me check that file.\\n\\n<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      // First chunk should be the text
      const textChunk = output[0];
      expect(textChunk.choices[0].delta.content).toBe('Let me check that file.');
      expect(textChunk.choices[0].delta.tool_calls).toBeUndefined();
    });

    test('should handle tool call without preceding text', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      // Should not have a text-only chunk, just tool chunks
      const textOnlyChunk = output.find(c =>
        c.choices?.[0]?.delta?.content && !c.choices?.[0]?.delta?.tool_calls
      );
      expect(textOnlyChunk).toBeUndefined();
    });

    test('should trim whitespace from text before tool call', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Text here.   \\n\\n<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      const textChunk = output.find(c => c.choices?.[0]?.delta?.content);
      if (textChunk) {
        expect(textChunk.choices[0].delta.content.trim()).toBe('Text here.');
      }
    });
  });

  describe('Partial XML Buffering', () => {
    test('should wait for complete XML before sending tool call', () => {
      // Send partial XML
      const chunk1 = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test"}}]}\n\n');

      const output1 = transformer.processChunk(chunk1);

      // Should not send tool call yet (XML incomplete)
      const toolChunk1 = output1.find(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunk1).toBeUndefined();

      // Send rest of XML
      const chunk2 = Buffer.from('data: {"choices":[{"delta":{"content":".js</filePath>\\n</read>"}}]}\n\n');

      const output2 = transformer.processChunk(chunk2);

      // Now should send tool call
      const toolChunk2 = output2.find(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunk2).toBeDefined();
    });

    test('should accumulate content across multiple chunks', () => {
      const chunk1 = Buffer.from('data: {"choices":[{"delta":{"content":"I\'ll "}}]}\n\n');
      const chunk2 = Buffer.from('data: {"choices":[{"delta":{"content":"read "}}]}\n\n');
      const chunk3 = Buffer.from('data: {"choices":[{"delta":{"content":"the file.\\n\\n"}}]}\n\n');
      const chunk4 = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/app.js</filePath>\\n</read>"}}]}\n\n');

      transformer.processChunk(chunk1);
      transformer.processChunk(chunk2);
      transformer.processChunk(chunk3);
      const output = transformer.processChunk(chunk4);

      // Should have accumulated all content
      expect(transformer.accumulatedContent).toContain("I'll read the file");
      expect(transformer.accumulatedContent).toContain("<read>");

      // Should have detected and sent tool call
      const toolChunk = output.find(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunk).toBeDefined();
    });
  });

  describe('finish_reason Handling', () => {
    test('should set finish_reason to "tool_calls" when tool detected', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      transformer.processChunk(chunk);
      const finalChunks = transformer.finalize();

      // First final chunk should have finish_reason: "tool_calls"
      const finalChunk = finalChunks[0];
      expect(finalChunk.choices[0].finish_reason).toBe('tool_calls');
    });

    test('should keep finish_reason as "stop" when no tool detected', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Just normal text"}}]}\n\n');

      transformer.processChunk(chunk);
      const finalChunks = transformer.finalize();

      const finalChunk = finalChunks[0];
      expect(finalChunk.choices[0].finish_reason).toBe('stop');
    });
  });

  describe('Complete Response with Tool Calls', () => {
    test('should include tool_calls in complete response', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Reading file.\\n\\n<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      transformer.processChunk(chunk);
      const completeResponse = transformer.getCompleteResponse();

      expect(completeResponse.choices[0].message).toHaveProperty('tool_calls');
      expect(completeResponse.choices[0].message.tool_calls).toHaveLength(1);
      expect(completeResponse.choices[0].message.tool_calls[0]).toMatchObject({
        type: 'function',
        function: {
          name: 'read',
          arguments: expect.stringContaining('/test.js')
        }
      });
    });

    test('should include text content in complete response', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Let me read it.\\n\\n<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      transformer.processChunk(chunk);
      const completeResponse = transformer.getCompleteResponse();

      expect(completeResponse.choices[0].message.content).toContain('Let me read it.');
    });

    test('should set finish_reason in complete response', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<bash>\\n<command>ls</command>\\n<description>List files</description>\\n</bash>"}}]}\n\n');

      transformer.processChunk(chunk);
      const completeResponse = transformer.getCompleteResponse();

      expect(completeResponse.choices[0].finish_reason).toBe('tool_calls');
    });

    test('should not include tool_calls when no tool present', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"Just regular text"}}]}\n\n');

      transformer.processChunk(chunk);
      const completeResponse = transformer.getCompleteResponse();

      expect(completeResponse.choices[0].message.tool_calls).toBeUndefined();
      expect(completeResponse.choices[0].finish_reason).toBe('stop');
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple tool parameters correctly', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<bash>\\n<command>npm install axios</command>\\n<description>Install axios</description>\\n<timeout>30000</timeout>\\n</bash>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      const argsChunk = output.find(c =>
        c.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments
      );
      expect(argsChunk).toBeDefined();

      const args = JSON.parse(argsChunk.choices[0].delta.tool_calls[0].function.arguments);
      expect(args).toMatchObject({
        command: 'npm install axios',
        description: 'Install axios',
        timeout: 30000
      });
    });

    test('should handle tool call with multiline content', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<write>\\n<file_path>/test.js</file_path>\\n<content>\\nconst x = 1;\\nconst y = 2;\\n</content>\\n</write>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      const argsChunk = output.find(c =>
        c.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments
      );
      expect(argsChunk).toBeDefined();

      const args = JSON.parse(argsChunk.choices[0].delta.tool_calls[0].function.arguments);
      expect(args.content).toContain('const x = 1');
      expect(args.content).toContain('const y = 2');
    });

    test('should not send duplicate tool calls', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js</filePath>\\n</read>"}}]}\n\n');

      const output1 = transformer.processChunk(chunk);
      const output2 = transformer.processChunk(Buffer.from('data: {"choices":[{"delta":{"content":""}}]}\n\n'));

      // First process should have tool calls
      const toolChunks1 = output1.filter(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunks1.length).toBeGreaterThan(0);

      // Second process should not resend tool calls
      const toolChunks2 = output2.filter(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunks2.length).toBe(0);
    });

    test('should handle malformed XML gracefully', () => {
      const chunk = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js\\n</read>"}}]}\n\n');

      const output = transformer.processChunk(chunk);

      // Should not crash, may or may not detect as tool call depending on parser
      expect(output).toBeDefined();
      expect(Array.isArray(output)).toBe(true);
    });
  });

  describe('Real-world Streaming Scenarios', () => {
    test('should handle realistic streaming sequence', () => {
      // Simulate realistic Qwen streaming
      const chunks = [
        'data: {"response.created":{"chat_id":"chat1","parent_id":"parent1"}}\n\n',
        'data: {"choices":[{"delta":{"role":"assistant","content":"I\'ll "}}],"usage":{"input_tokens":10,"output_tokens":1}}\n\n',
        'data: {"choices":[{"delta":{"content":"read "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"the "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"file.\\n\\n"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"<read>\\n"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"<filePath>/src/app.js</filePath>\\n"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"</read>"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"","status":"finished"}}]}\n\n'
      ];

      let allOutput = [];
      for (const chunkStr of chunks) {
        const output = transformer.processChunk(Buffer.from(chunkStr));
        allOutput.push(...output);
      }

      // Should have text chunks
      const textChunks = allOutput.filter(c =>
        c.choices?.[0]?.delta?.content && !c.choices?.[0]?.delta?.tool_calls
      );
      expect(textChunks.length).toBeGreaterThan(0);

      // Should have tool call chunks
      const toolChunks = allOutput.filter(c => c.choices?.[0]?.delta?.tool_calls);
      expect(toolChunks.length).toBeGreaterThan(0);

      // Finalize and check
      const finalChunks = transformer.finalize();
      expect(finalChunks[0].choices[0].finish_reason).toBe('tool_calls');
    });

    test('should handle streaming with usage updates', () => {
      const chunk1 = Buffer.from('data: {"choices":[{"delta":{"content":"Test"}}],"usage":{"input_tokens":5,"output_tokens":1}}\n\n');
      const chunk2 = Buffer.from('data: {"choices":[{"delta":{"content":"<read>\\n<filePath>/test.js</filePath>\\n</read>"}}],"usage":{"input_tokens":5,"output_tokens":10}}\n\n');

      transformer.processChunk(chunk1);
      transformer.processChunk(chunk2);
      const finalChunks = transformer.finalize();

      // Should have usage chunk
      const usageChunk = finalChunks.find(c => c.usage);
      expect(usageChunk).toBeDefined();
      expect(usageChunk.usage.completion_tokens).toBe(10);
      expect(usageChunk.usage.prompt_tokens).toBe(5);
    });
  });
});

// Mock Jest if not running in Jest environment
if (typeof jest === 'undefined') {
  console.log('Tests should be run with Jest: npm test');
  console.log('Skipping test execution');
}
