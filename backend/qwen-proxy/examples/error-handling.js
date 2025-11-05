/**
 * Error Handling Example
 *
 * Demonstrates how the Qwen Proxy Backend handles various error scenarios.
 * Shows different types of errors and how to handle them.
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - OpenAI SDK installed: npm install openai
 *
 * Usage:
 *   node examples/error-handling.js
 */

const OpenAI = require('openai');

// Initialize OpenAI client pointing to Qwen Proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key'
});

async function testError(description, testFn) {
  console.log(`\nTest: ${description}`);
  console.log('─'.repeat(60));
  try {
    await testFn();
    console.log('❌ Expected error but got success');
  } catch (error) {
    if (error.status) {
      console.log(`✓ Got expected error (HTTP ${error.status})`);
      console.log(`  Type: ${error.error?.type || 'unknown'}`);
      console.log(`  Message: ${error.message}`);
    } else {
      console.log('❌ Unexpected error type:', error.message);
    }
  }
}

async function main() {
  console.log('=== Qwen Proxy - Error Handling Example ===');
  console.log('\nThis example demonstrates various error scenarios.\n');

  // Test 1: Missing messages
  await testError(
    'Missing messages parameter',
    async () => {
      await client.chat.completions.create({
        model: 'qwen3-max'
        // messages missing
      });
    }
  );

  // Test 2: Empty messages array
  await testError(
    'Empty messages array',
    async () => {
      await client.chat.completions.create({
        model: 'qwen3-max',
        messages: []
      });
    }
  );

  // Test 3: Invalid message role
  await testError(
    'Invalid message role',
    async () => {
      await client.chat.completions.create({
        model: 'qwen3-max',
        messages: [
          { role: 'invalid_role', content: 'test' }
        ]
      });
    }
  );

  // Test 4: Message without content
  await testError(
    'Message without content',
    async () => {
      await client.chat.completions.create({
        model: 'qwen3-max',
        messages: [
          { role: 'user' } // missing content
        ]
      });
    }
  );

  // Test 5: Successful request (should NOT error)
  console.log('\nTest: Valid request (should succeed)');
  console.log('─'.repeat(60));
  try {
    const response = await client.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Say hello' }
      ],
      stream: false
    });
    console.log('✓ Request succeeded');
    console.log(`  Response: "${response.choices[0].message.content.substring(0, 50)}..."`);
  } catch (error) {
    console.log('❌ Valid request failed:', error.message);
  }

  // Test 6: Network timeout (with short timeout)
  console.log('\nTest: Request timeout');
  console.log('─'.repeat(60));
  const clientWithTimeout = new OpenAI({
    baseURL: 'http://localhost:3000/v1',
    apiKey: 'dummy-key',
    timeout: 100 // Very short timeout
  });
  try {
    await clientWithTimeout.chat.completions.create({
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'test' }
      ],
      stream: false
    });
    console.log('❌ Expected timeout but got success');
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('✓ Got expected timeout error');
    } else {
      console.log('❓ Got error but not timeout:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Error handling demonstration complete!');
  console.log('\nKey takeaways:');
  console.log('  1. All validation errors return HTTP 400');
  console.log('  2. Error responses follow OpenAI format');
  console.log('  3. Error messages are descriptive');
  console.log('  4. Network errors are handled gracefully');
}

main();
