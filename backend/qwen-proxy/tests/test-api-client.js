/**
 * Manual test script for the new Qwen API client
 *
 * This script demonstrates how to use the new API client modules.
 * Run with: node test-api-client.js
 */

require('dotenv').config();
const { QwenAuth, QwenClient } = require('./src/api');

async function testAPIClient() {
  console.log('='.repeat(60));
  console.log('Testing Qwen API Client Implementation');
  console.log('='.repeat(60));

  try {
    // Step 1: Initialize authentication
    console.log('\n[1] Initializing authentication...');
    const auth = new QwenAuth();
    console.log('✓ Auth initialized');
    console.log('  - Token valid:', auth.isValid());
    console.log('  - Token preview:', auth.getTokenPreview());

    // Step 2: Create client
    console.log('\n[2] Creating Qwen client...');
    const client = new QwenClient(auth);
    console.log('✓ Client created');

    // Step 3: Create a new chat
    console.log('\n[3] Creating new chat...');
    const chatId = await client.createChat('API Client Test Chat', 'qwen3-max');
    console.log('✓ Chat created');
    console.log('  - Chat ID:', chatId);

    // Step 4: Send first message (non-streaming)
    console.log('\n[4] Sending first message (non-streaming)...');
    const firstResponse = await client.sendMessageSync({
      chatId: chatId,
      parentId: null,
      message: {
        role: 'user',
        content: 'Remember this secret code: ALPHA-7'
      }
    });
    console.log('✓ First message sent');
    console.log('  - Content:', firstResponse.content);
    console.log('  - Parent ID:', firstResponse.parentId);
    console.log('  - Message ID:', firstResponse.messageId);
    console.log('  - Usage:', firstResponse.usage);

    // Step 5: Send follow-up message (streaming)
    console.log('\n[5] Sending follow-up message (streaming)...');
    const streamResponse = await client.sendMessage({
      chatId: chatId,
      parentId: firstResponse.parentId,
      message: {
        role: 'user',
        content: 'What secret code did I tell you?'
      },
      stream: true
    });

    console.log('✓ Stream started');
    console.log('  - Processing stream chunks...');

    const result = await client.processStream(
      streamResponse,
      (chunk) => {
        // Print each chunk as it arrives
        process.stdout.write(chunk);
      },
      (parentId, usage) => {
        console.log('\n  - Stream completed');
        console.log('  - New Parent ID:', parentId);
        console.log('  - Usage:', usage);
      }
    );

    console.log('\n✓ Full response received');
    console.log('  - Total content length:', result.content.length);

    // Step 6: Verify context was preserved
    if (result.content.toLowerCase().includes('alpha') || result.content.toLowerCase().includes('7')) {
      console.log('\n✓ Context was preserved! AI remembered the secret code.');
    } else {
      console.log('\n⚠ Context may not be preserved.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testAPIClient().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
