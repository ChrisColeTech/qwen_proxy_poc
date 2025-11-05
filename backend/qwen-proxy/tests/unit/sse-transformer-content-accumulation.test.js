/**
 * Unit Test for SSE Transformer Content Accumulation
 *
 * Verifies that streaming responses accumulate full content for database persistence
 */

const { SSETransformer } = require('../../src/transformers/sse-transformer');

describe('SSETransformer Content Accumulation', () => {
  let transformer;

  beforeEach(() => {
    transformer = new SSETransformer('qwen3-max');
  });

  test('should accumulate content from multiple chunks', () => {
    // Simulate Qwen streaming response chunks
    const chunk1 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'Hello ',
          status: 'typing'
        }
      }],
      usage: { input_tokens: 10, output_tokens: 1 }
    };

    const chunk2 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'world! ',
          status: 'typing'
        }
      }],
      usage: { input_tokens: 10, output_tokens: 3 }
    };

    const chunk3 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'How can I help?',
          status: 'typing'
        }
      }],
      usage: { input_tokens: 10, output_tokens: 7 }
    };

    // Process chunks
    transformer.transformChunk(chunk1);
    transformer.transformChunk(chunk2);
    transformer.transformChunk(chunk3);

    // Get complete response
    const completeResponse = transformer.getCompleteResponse();

    // Verify content was accumulated
    expect(completeResponse.choices[0].message.content).toBe('Hello world! How can I help?');
  });

  test('should handle empty content chunks', () => {
    const chunk1 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'Hello',
          status: 'typing'
        }
      }]
    };

    const chunk2 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: '',  // Empty content
          status: 'finished'
        }
      }]
    };

    transformer.transformChunk(chunk1);
    transformer.transformChunk(chunk2);

    const completeResponse = transformer.getCompleteResponse();
    expect(completeResponse.choices[0].message.content).toBe('Hello');
  });

  test('should ignore chunks without content field', () => {
    const chunk1 = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'Valid content',
          status: 'typing'
        }
      }]
    };

    const chunk2 = {
      choices: [{
        delta: {
          role: 'assistant',
          status: 'typing'
          // No content field
        }
      }]
    };

    transformer.transformChunk(chunk1);
    transformer.transformChunk(chunk2);

    const completeResponse = transformer.getCompleteResponse();
    expect(completeResponse.choices[0].message.content).toBe('Valid content');
  });

  test('should preserve special characters and formatting', () => {
    const chunks = [
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'Here is some code:\n\n```javascript\n',
            status: 'typing'
          }
        }]
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: 'function hello() {\n  console.log("Hello!");\n',
            status: 'typing'
          }
        }]
      },
      {
        choices: [{
          delta: {
            role: 'assistant',
            content: '}\n```',
            status: 'typing'
          }
        }]
      }
    ];

    chunks.forEach(chunk => transformer.transformChunk(chunk));

    const completeResponse = transformer.getCompleteResponse();
    const expected = 'Here is some code:\n\n```javascript\nfunction hello() {\n  console.log("Hello!");\n}\n```';
    expect(completeResponse.choices[0].message.content).toBe(expected);
  });

  test('should start with empty content', () => {
    const completeResponse = transformer.getCompleteResponse();
    expect(completeResponse.choices[0].message.content).toBe('');
  });

  test('should preserve usage data along with content', () => {
    const chunk = {
      choices: [{
        delta: {
          role: 'assistant',
          content: 'Test response',
          status: 'typing'
        }
      }],
      usage: {
        input_tokens: 50,
        output_tokens: 25
      }
    };

    transformer.transformChunk(chunk);

    const completeResponse = transformer.getCompleteResponse();

    // Verify both content and usage are present
    expect(completeResponse.choices[0].message.content).toBe('Test response');
    expect(completeResponse.usage.prompt_tokens).toBe(50);
    expect(completeResponse.usage.completion_tokens).toBe(25);
  });

  test('should handle Unicode and emojis', () => {
    const chunks = [
      {
        choices: [{
          delta: {
            content: 'Hello! 👋 ',
            status: 'typing'
          }
        }]
      },
      {
        choices: [{
          delta: {
            content: 'Welcome to 中文 testing! ',
            status: 'typing'
          }
        }]
      },
      {
        choices: [{
          delta: {
            content: '🎉🎊',
            status: 'typing'
          }
        }]
      }
    ];

    chunks.forEach(chunk => transformer.transformChunk(chunk));

    const completeResponse = transformer.getCompleteResponse();
    expect(completeResponse.choices[0].message.content).toBe('Hello! 👋 Welcome to 中文 testing! 🎉🎊');
  });
});
