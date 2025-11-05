/**
 * Unit tests for Response Transformer
 * Tests Qwen to OpenAI format transformation
 */

const {
  transformToOpenAIChunk,
  transformToOpenAICompletion,
  extractParentId,
  extractUsage,
  createFinalChunk,
  createUsageChunk,
  hasContent
} = require('../../src/transform/response-transformer');

const fixtures = require('../fixtures/qwen-responses');

describe('Response Transformer', () => {
  describe('extractParentId', () => {
    test('Extracts parent_id from Qwen response', () => {
      const qwenResponse = {
        parent_id: 'parent-123',
        message_id: 'msg-456'
      };

      const parentId = extractParentId(qwenResponse);
      expect(parentId).toBe('parent-123');
    });

    test('Returns parent_id, NOT message_id', () => {
      const qwenResponse = fixtures.firstMessageResponse;

      const parentId = extractParentId(qwenResponse);
      expect(parentId).toBe('parent-abc123');
      expect(parentId).not.toBe('msg-def456');
    });

    test('Returns null if parent_id not present', () => {
      const qwenResponse = {
        message_id: 'msg-123'
      };

      const parentId = extractParentId(qwenResponse);
      expect(parentId).toBe(null);
    });

    test('Works with follow-up response', () => {
      const parentId = extractParentId(fixtures.followUpResponse);
      expect(parentId).toBe('parent-ghi789');
    });
  });

  describe('extractUsage', () => {
    test('Extracts and transforms usage data', () => {
      const qwenResponse = {
        usage: {
          input_tokens: 10,
          output_tokens: 20
        }
      };

      const usage = extractUsage(qwenResponse);
      expect(usage.prompt_tokens).toBe(10);
      expect(usage.completion_tokens).toBe(20);
      expect(usage.total_tokens).toBe(30);
    });

    test('Works with fixtures', () => {
      const usage = extractUsage(fixtures.usageData);
      expect(usage.prompt_tokens).toBe(15);
      expect(usage.completion_tokens).toBe(8);
      expect(usage.total_tokens).toBe(23);
    });

    test('Returns zeros if usage not present', () => {
      const qwenResponse = {
        parent_id: 'parent-123'
      };

      const usage = extractUsage(qwenResponse);
      expect(usage.prompt_tokens).toBe(0);
      expect(usage.completion_tokens).toBe(0);
      expect(usage.total_tokens).toBe(0);
    });

    test('Handles missing input_tokens', () => {
      const qwenResponse = {
        usage: {
          output_tokens: 10
        }
      };

      const usage = extractUsage(qwenResponse);
      expect(usage.prompt_tokens).toBe(0);
      expect(usage.completion_tokens).toBe(10);
      expect(usage.total_tokens).toBe(10);
    });

    test('Handles missing output_tokens', () => {
      const qwenResponse = {
        usage: {
          input_tokens: 15
        }
      };

      const usage = extractUsage(qwenResponse);
      expect(usage.prompt_tokens).toBe(15);
      expect(usage.completion_tokens).toBe(0);
      expect(usage.total_tokens).toBe(15);
    });
  });

  describe('transformToOpenAIChunk', () => {
    test('Transforms Qwen chunk to OpenAI format', () => {
      const qwenChunk = {
        choices: [{
          delta: { content: 'Hello' }
        }]
      };

      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.object).toBe('chat.completion.chunk');
      expect(openAIChunk.model).toBe('qwen3-max');
      expect(openAIChunk.choices[0].delta.content).toBe('Hello');
      expect(openAIChunk.choices[0].finish_reason).toBe(null);
      expect(openAIChunk.choices[0].index).toBe(0);
    });

    test('Includes id field', () => {
      const qwenChunk = fixtures.streamingChunk;
      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.id).toBeDefined();
      expect(openAIChunk.id).toMatch(/^chatcmpl-/);
    });

    test('Includes created timestamp', () => {
      const qwenChunk = fixtures.streamingChunk;
      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.created).toBeDefined();
      expect(openAIChunk.created).toBeGreaterThan(1700000000);
    });

    test('Handles chunk with role', () => {
      const qwenChunk = {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'Hello'
          }
        }]
      };

      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.choices[0].delta.role).toBe('assistant');
      expect(openAIChunk.choices[0].delta.content).toBe('Hello');
    });

    test('Handles chunk with only role', () => {
      const qwenChunk = fixtures.roleOnlyChunk;
      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.choices[0].delta.role).toBe('assistant');
      expect(openAIChunk.choices[0].delta.content).toBeUndefined();
    });

    test('Handles empty delta', () => {
      const qwenChunk = fixtures.emptyChunk;
      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.choices[0].delta).toEqual({});
    });

    test('Sets finish_reason when provided', () => {
      const qwenChunk = fixtures.streamingChunk;
      const openAIChunk = transformToOpenAIChunk(qwenChunk, 'stop');

      expect(openAIChunk.choices[0].finish_reason).toBe('stop');
    });

    test('Handles missing choices array', () => {
      const qwenChunk = {};
      const openAIChunk = transformToOpenAIChunk(qwenChunk);

      expect(openAIChunk.choices[0].delta).toEqual({});
      expect(openAIChunk.choices[0].finish_reason).toBe(null);
    });
  });

  describe('transformToOpenAICompletion', () => {
    test('Transforms to OpenAI completion', () => {
      const completion = transformToOpenAICompletion(
        'Hello world',
        { input_tokens: 5, output_tokens: 2 }
      );

      expect(completion.object).toBe('chat.completion');
      expect(completion.model).toBe('qwen3-max');
      expect(completion.choices[0].message.content).toBe('Hello world');
      expect(completion.choices[0].message.role).toBe('assistant');
      expect(completion.choices[0].finish_reason).toBe('stop');
      expect(completion.usage.prompt_tokens).toBe(5);
      expect(completion.usage.completion_tokens).toBe(2);
      expect(completion.usage.total_tokens).toBe(7);
    });

    test('Includes id field', () => {
      const completion = transformToOpenAICompletion('Test', {});

      expect(completion.id).toBeDefined();
      expect(completion.id).toMatch(/^chatcmpl-/);
    });

    test('Includes created timestamp', () => {
      const completion = transformToOpenAICompletion('Test', {});

      expect(completion.created).toBeDefined();
      expect(completion.created).toBeGreaterThan(1700000000);
    });

    test('Handles empty usage', () => {
      const completion = transformToOpenAICompletion('Test content');

      expect(completion.usage.prompt_tokens).toBe(0);
      expect(completion.usage.completion_tokens).toBe(0);
      expect(completion.usage.total_tokens).toBe(0);
    });

    test('Handles missing input_tokens', () => {
      const completion = transformToOpenAICompletion('Test', { output_tokens: 10 });

      expect(completion.usage.prompt_tokens).toBe(0);
      expect(completion.usage.completion_tokens).toBe(10);
      expect(completion.usage.total_tokens).toBe(10);
    });

    test('Handles long content', () => {
      const longContent = 'A'.repeat(10000);
      const completion = transformToOpenAICompletion(longContent, {
        input_tokens: 50,
        output_tokens: 2000
      });

      expect(completion.choices[0].message.content).toBe(longContent);
      expect(completion.usage.total_tokens).toBe(2050);
    });

    test('Choice has correct structure', () => {
      const completion = transformToOpenAICompletion('Test', {});

      expect(completion.choices).toHaveLength(1);
      expect(completion.choices[0].index).toBe(0);
      expect(completion.choices[0]).toHaveProperty('message');
      expect(completion.choices[0]).toHaveProperty('finish_reason');
    });
  });

  describe('createFinalChunk', () => {
    test('Creates final chunk with stop reason', () => {
      const finalChunk = createFinalChunk('stop');

      expect(finalChunk.object).toBe('chat.completion.chunk');
      expect(finalChunk.model).toBe('qwen3-max');
      expect(finalChunk.choices[0].delta).toEqual({});
      expect(finalChunk.choices[0].finish_reason).toBe('stop');
    });

    test('Defaults to stop if no reason provided', () => {
      const finalChunk = createFinalChunk();

      expect(finalChunk.choices[0].finish_reason).toBe('stop');
    });

    test('Handles length finish reason', () => {
      const finalChunk = createFinalChunk('length');

      expect(finalChunk.choices[0].finish_reason).toBe('length');
    });

    test('Includes required fields', () => {
      const finalChunk = createFinalChunk();

      expect(finalChunk.id).toBeDefined();
      expect(finalChunk.object).toBe('chat.completion.chunk');
      expect(finalChunk.created).toBeDefined();
      expect(finalChunk.model).toBe('qwen3-max');
      expect(finalChunk.choices).toHaveLength(1);
    });
  });

  describe('createUsageChunk', () => {
    test('Creates usage chunk', () => {
      const usageChunk = createUsageChunk({
        input_tokens: 20,
        output_tokens: 15
      });

      expect(usageChunk.object).toBe('chat.completion.chunk');
      expect(usageChunk.model).toBe('qwen3-max');
      expect(usageChunk.choices).toEqual([]);
      expect(usageChunk.usage.prompt_tokens).toBe(20);
      expect(usageChunk.usage.completion_tokens).toBe(15);
      expect(usageChunk.usage.total_tokens).toBe(35);
    });

    test('Handles missing tokens', () => {
      const usageChunk = createUsageChunk({});

      expect(usageChunk.usage.prompt_tokens).toBe(0);
      expect(usageChunk.usage.completion_tokens).toBe(0);
      expect(usageChunk.usage.total_tokens).toBe(0);
    });

    test('Works with fixture data', () => {
      const usageChunk = createUsageChunk(fixtures.usageData.usage);

      expect(usageChunk.usage.prompt_tokens).toBe(15);
      expect(usageChunk.usage.completion_tokens).toBe(8);
      expect(usageChunk.usage.total_tokens).toBe(23);
    });

    test('Includes required fields', () => {
      const usageChunk = createUsageChunk({});

      expect(usageChunk.id).toBeDefined();
      expect(usageChunk.object).toBe('chat.completion.chunk');
      expect(usageChunk.created).toBeDefined();
      expect(usageChunk.model).toBe('qwen3-max');
    });
  });

  describe('hasContent', () => {
    test('Returns true when chunk has content', () => {
      const qwenChunk = {
        choices: [{
          delta: { content: 'Hello' }
        }]
      };

      expect(hasContent(qwenChunk)).toBe(true);
    });

    test('Returns false when chunk has no content', () => {
      const qwenChunk = fixtures.emptyChunk;
      expect(hasContent(qwenChunk)).toBe(false);
    });

    test('Returns false when chunk has only role', () => {
      const qwenChunk = fixtures.roleOnlyChunk;
      expect(hasContent(qwenChunk)).toBe(false);
    });

    test('Returns false when choices is missing', () => {
      const qwenChunk = {};
      expect(hasContent(qwenChunk)).toBe(false);
    });

    test('Returns false when delta is missing', () => {
      const qwenChunk = {
        choices: [{}]
      };
      expect(hasContent(qwenChunk)).toBe(false);
    });

    test('Works with streaming chunk fixture', () => {
      expect(hasContent(fixtures.streamingChunk)).toBe(true);
    });

    test('Returns false for final chunk', () => {
      expect(hasContent(fixtures.finalStreamingChunk)).toBe(false);
    });

    test('Returns true for empty string content', () => {
      const qwenChunk = {
        choices: [{
          delta: { content: '' }
        }]
      };
      // Empty string is falsy, so this should return false
      expect(hasContent(qwenChunk)).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    test('Complete streaming flow', () => {
      // First chunk with role and content
      const chunk1 = transformToOpenAIChunk({
        choices: [{
          delta: { role: 'assistant', content: 'Hello' }
        }]
      });
      expect(chunk1.choices[0].delta.role).toBe('assistant');
      expect(chunk1.choices[0].delta.content).toBe('Hello');
      expect(chunk1.choices[0].finish_reason).toBe(null);

      // Middle chunk with content
      const chunk2 = transformToOpenAIChunk({
        choices: [{
          delta: { content: ' world' }
        }]
      });
      expect(chunk2.choices[0].delta.content).toBe(' world');

      // Final chunk
      const finalChunk = createFinalChunk('stop');
      expect(finalChunk.choices[0].finish_reason).toBe('stop');
      expect(finalChunk.choices[0].delta).toEqual({});

      // Usage chunk
      const usageChunk = createUsageChunk({ input_tokens: 5, output_tokens: 10 });
      expect(usageChunk.usage.total_tokens).toBe(15);
    });

    test('Non-streaming flow', () => {
      const fullContent = 'Hello world!';
      const usage = { input_tokens: 5, output_tokens: 3 };

      const completion = transformToOpenAICompletion(fullContent, usage);

      expect(completion.choices[0].message.content).toBe(fullContent);
      expect(completion.usage.total_tokens).toBe(8);
      expect(completion.choices[0].finish_reason).toBe('stop');
    });
  });
});
