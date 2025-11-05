/**
 * Multi-Turn Conversation Example
 *
 * Demonstrates multi-turn conversations with context retention.
 * Shows how the proxy maintains conversation history via parent_id chain.
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - OpenAI SDK installed: npm install openai
 *
 * Usage:
 *   node examples/multi-turn.js
 */

const OpenAI = require('openai');

// Initialize OpenAI client pointing to Qwen Proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key'
});

async function chat(messages, userMessage) {
  // Add user message to history
  messages.push({
    role: 'user',
    content: userMessage
  });

  console.log(`\nUser: ${userMessage}`);

  // Get response
  const response = await client.chat.completions.create({
    model: 'qwen3-max',
    messages: messages,
    stream: false
  });

  const assistantMessage = response.choices[0].message.content;

  // Add assistant response to history
  messages.push({
    role: 'assistant',
    content: assistantMessage
  });

  console.log(`\nAssistant: ${assistantMessage}`);

  return messages;
}

async function main() {
  console.log('=== Qwen Proxy - Multi-Turn Conversation Example ===');
  console.log('\nThis example demonstrates context retention across multiple turns.\n');
  console.log('─'.repeat(60));

  try {
    let conversation = [];

    // Turn 1: Introduce information
    conversation = await chat(
      conversation,
      "My name is Alice and I'm learning JavaScript."
    );

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 2: Reference previous information
    conversation = await chat(
      conversation,
      "What programming language am I learning?"
    );

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 3: Reference even earlier information
    conversation = await chat(
      conversation,
      "What is my name?"
    );

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Multi-turn conversation completed successfully!');
    console.log('The AI correctly remembered:');
    console.log('  1. Your name (Alice)');
    console.log('  2. Your programming language (JavaScript)');
    console.log('\nThis proves the parent_id chain is working correctly.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

main();
