/**
 * Basic Usage Example
 *
 * Demonstrates basic usage of the Qwen Proxy Backend
 * with the OpenAI SDK.
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - OpenAI SDK installed: npm install openai
 *
 * Usage:
 *   node examples/basic-usage.js
 */

const OpenAI = require('openai');

// Initialize OpenAI client pointing to Qwen Proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key' // API key is not required but SDK needs something
});

async function main() {
  console.log('=== Qwen Proxy - Basic Usage Example ===\n');

  try {
    // Simple chat completion
    console.log('Sending message to Qwen...\n');

    const response = await client.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        {
          role: 'user',
          content: 'Explain what a neural network is in one sentence.'
        }
      ],
      stream: false
    });

    // Display response
    console.log('Response:');
    console.log('─'.repeat(60));
    console.log(response.choices[0].message.content);
    console.log('─'.repeat(60));

    // Display metadata
    console.log('\nMetadata:');
    console.log(`  Model: ${response.model}`);
    console.log(`  ID: ${response.id}`);
    console.log(`  Tokens: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ${response.usage.total_tokens} total`);
    console.log(`  Finish reason: ${response.choices[0].finish_reason}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

main();
