/**
 * Debug script to test chat completions and see what's being sent
 */

const axios = require('axios');

async function testChatCompletion() {
  console.log('='.repeat(60));
  console.log('Testing Chat Completions Endpoint');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Normal message
  console.log('Test 1: Normal string message');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ],
      stream: false
    });
    console.log('✓ Success!');
    console.log('Response:', response.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  // Test 2: Empty string
  console.log('Test 2: Empty string message');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: '' }
      ],
      stream: false
    });
    console.log('✓ Success (unexpected)');
  } catch (error) {
    console.log('✗ Expected failure:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  // Test 3: Whitespace only
  console.log('Test 3: Whitespace-only message');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'user', content: '   ' }
      ],
      stream: false
    });
    console.log('✓ Success (unexpected)');
  } catch (error) {
    console.log('✗ Expected failure:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  // Test 4: Multimodal message (array content)
  console.log('Test 4: Multimodal message (array content)');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' }
          ]
        }
      ],
      stream: false
    });
    console.log('✓ Success!');
    console.log('Response:', response.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  // Test 5: System message first, then user
  console.log('Test 5: System message + user message');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ],
      stream: false
    });
    console.log('✓ Success!');
    console.log('Response:', response.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  // Test 6: No user message (only system)
  console.log('Test 6: No user message (only system)');
  try {
    const response = await axios.post('http://localhost:3000/v1/chat/completions', {
      model: 'qwen3-max',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' }
      ],
      stream: false
    });
    console.log('✓ Success (unexpected)');
  } catch (error) {
    console.log('✗ Expected failure:', error.response?.data?.error?.message || error.message);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('Debug tests complete');
  console.log('='.repeat(60));
}

testChatCompletion().catch(console.error);
