require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// NO MOCKS - ONLY REAL API TESTS

describe('Qwen Real API Tests - Discovery Phase', () => {
  const QWEN_BASE_URL = 'https://chat.qwen.ai';
  const QWEN_COOKIES = process.env.QWEN_COOKIES;
  const QWEN_TOKEN = process.env.QWEN_TOKEN;

  test('REAL API: Create chat and send ONE message', async () => {
    console.log('\n=== TEST 1: Creating new chat and sending first message ===');

    // Validate we have required credentials
    if (!QWEN_TOKEN || QWEN_TOKEN === 'undefined') {
      throw new Error(`
        ❌ QWEN_TOKEN is missing or undefined!

        To get your bx-umidtoken:
        1. Go to https://chat.qwen.ai in your browser
        2. Open DevTools (F12)
        3. Go to Network tab
        4. Create a new chat or send a message
        5. Look for /api/v2/chats/new or /api/v2/chat/completions request
        6. Find 'bx-umidtoken' in Request Headers
        7. Copy the value and add to .env file:

        QWEN_TOKEN=<your-bx-umidtoken-value>

        See SETUP_INSTRUCTIONS.md for more details.
      `);
    }

    if (!QWEN_COOKIES) {
      throw new Error('QWEN_COOKIES is missing in .env file!');
    }

    console.log('Using token:', QWEN_TOKEN.substring(0, 20) + '...');

    // Step 1: Create new chat
    const newChatPayload = {
      title: 'Test Chat',
      models: ['qwen3-max'],
      chat_mode: 'guest',
      chat_type: 't2t',
      timestamp: Date.now()
    };

    console.log('Step 1: Creating new chat...');
    console.log('Payload:', JSON.stringify(newChatPayload, null, 2));

    const createChatResponse = await axios.post(
      `${QWEN_BASE_URL}/api/v2/chats/new`,
      newChatPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': QWEN_COOKIES,
          'bx-umidtoken': QWEN_TOKEN,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    console.log('Create chat response:', JSON.stringify(createChatResponse.data, null, 2));

    expect(createChatResponse.data.success).toBe(true);
    expect(createChatResponse.data.data).toHaveProperty('id');

    const chatId = createChatResponse.data.data.id;
    console.log('Chat created with ID:', chatId);

    // Step 2: Send first message to the chat
    const messageId = uuidv4();
    // DISCOVERY: For the FIRST message, parent_id must be null!
    const parentId = null;

    const completionPayload = {
      stream: false,
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: 'qwen3-max',
      parent_id: parentId,
      messages: [
        {
          fid: messageId,
          parentId: parentId,
          childrenIds: [],
          role: 'user',
          content: 'Say hello in exactly 3 words',
          user_action: 'chat',
          files: [],
          timestamp: Math.floor(Date.now() / 1000),
          models: ['qwen3-max'],
          chat_type: 't2t',
          feature_config: {
            thinking_enabled: false,
            output_schema: 'phase'
          },
          extra: {
            meta: {
              subChatType: 't2t'
            }
          },
          sub_chat_type: 't2t',
          parent_id: parentId
        }
      ],
      timestamp: Math.floor(Date.now() / 1000)
    };

    console.log('\nStep 2: Sending first message...');
    console.log('Message payload:', JSON.stringify(completionPayload, null, 2));

    const completionResponse = await axios.post(
      `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
      completionPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': QWEN_COOKIES,
          'bx-umidtoken': QWEN_TOKEN,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    console.log('\nCompletion response:', JSON.stringify(completionResponse.data, null, 2));

    // Verify response structure
    expect(completionResponse.data.success).toBe(true);
    expect(completionResponse.data.data).toHaveProperty('choices');
    expect(completionResponse.data.data.choices[0]).toHaveProperty('message');
    expect(completionResponse.data.data.choices[0].message.role).toBe('assistant');
    expect(completionResponse.data.data.choices[0].message.content).toBeTruthy();

    console.log('\nAssistant response:', completionResponse.data.data.choices[0].message.content);
    console.log('\n=== TEST 1 PASSED ===\n');

    // Save chat_id and message_id for next test
    global.testChatId = chatId;
    global.testMessageId = completionResponse.data.data.message_id;
  }, 30000); // 30 second timeout for API calls
});
