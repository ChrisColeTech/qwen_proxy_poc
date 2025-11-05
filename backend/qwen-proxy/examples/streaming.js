/**
 * Streaming Example
 *
 * Demonstrates streaming responses from the Qwen Proxy Backend.
 * Shows how to handle real-time token streaming.
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - OpenAI SDK installed: npm install openai
 *
 * Usage:
 *   node examples/streaming.js
 */

const OpenAI = require('openai');

// Initialize OpenAI client pointing to Qwen Proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key'
});

async function main() {
  console.log('=== Qwen Proxy - Streaming Example ===\n');

  try {
    console.log('User: Write a short poem about coding\n');
    console.log('Assistant: ');

    // Create streaming completion
    const stream = await client.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        {
          role: 'user',
          content: 'Write a short poem about coding'
        }
      ],
      stream: true
    });

    // Process stream
    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        fullContent += content;
      }
    }

    console.log('\n');
    console.log('─'.repeat(60));
    console.log(`\nTotal characters: ${fullContent.length}`);

  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

main();
