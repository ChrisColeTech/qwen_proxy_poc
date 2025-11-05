/**
 * Models List Example
 *
 * Demonstrates how to retrieve the list of available models
 * from the Qwen API via the proxy.
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - OpenAI SDK installed: npm install openai
 *
 * Usage:
 *   node examples/models-list.js
 */

const OpenAI = require('openai');

// Initialize OpenAI client pointing to Qwen Proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key'
});

async function main() {
  console.log('=== Qwen Proxy - Models List Example ===\n');

  try {
    // List all available models
    console.log('Fetching available models...\n');
    const models = await client.models.list();

    console.log(`Found ${models.data.length} models:\n`);

    // Display each model
    models.data.forEach((model, index) => {
      console.log(`${index + 1}. ${model.id}`);
      console.log(`   Name: ${model.metadata?.name || 'N/A'}`);
      console.log(`   Owner: ${model.owned_by}`);

      // Display capabilities if available
      if (model.metadata?.capabilities) {
        const caps = model.metadata.capabilities;
        const capList = [];
        if (caps.vision) capList.push('vision');
        if (caps.document) capList.push('documents');
        if (caps.audio) capList.push('audio');
        if (caps.video) capList.push('video');
        if (caps.citations) capList.push('citations');

        if (capList.length > 0) {
          console.log(`   Capabilities: ${capList.join(', ')}`);
        }
      }

      // Display context length
      if (model.metadata?.max_context_length) {
        console.log(`   Context: ${model.metadata.max_context_length.toLocaleString()} tokens`);
      }

      console.log('');
    });

    // Get specific model details
    console.log('─'.repeat(60));
    console.log('\nFetching details for qwen3-max...\n');

    const specificModel = await client.models.retrieve('qwen3-max');

    console.log('Model Details:');
    console.log(`  ID: ${specificModel.id}`);
    console.log(`  Name: ${specificModel.metadata?.name}`);
    console.log(`  Description: ${specificModel.metadata?.description?.substring(0, 100)}...`);
    console.log(`  Max Context: ${specificModel.metadata?.max_context_length?.toLocaleString()} tokens`);
    console.log(`  Max Output: ${specificModel.metadata?.max_generation_length?.toLocaleString()} tokens`);

    if (specificModel.metadata?.capabilities) {
      console.log('\n  Capabilities:');
      const caps = specificModel.metadata.capabilities;
      Object.entries(caps).forEach(([key, value]) => {
        console.log(`    ${key}: ${value ? '✓' : '✗'}`);
      });
    }

    if (specificModel.metadata?.chat_types) {
      console.log('\n  Supported Chat Types:');
      specificModel.metadata.chat_types.forEach(type => {
        console.log(`    - ${type}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

main();
