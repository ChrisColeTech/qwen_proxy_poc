require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// CRITICAL TEST: Understand parent_id vs message_id

describe('Qwen Real API - Parent ID Discovery', () => {
  const QWEN_BASE_URL = 'https://chat.qwen.ai';
  const QWEN_COOKIES = process.env.QWEN_COOKIES;
  const QWEN_TOKEN = process.env.QWEN_TOKEN;

  test('Understand the parent_id relationship', async () => {
    console.log('\n=== DISCOVERY: Understanding parent_id vs message_id ===');

    // Step 1: Create chat
    const newChatPayload = {
      title: 'Parent ID Test',
      models: ['qwen3-max'],
      chat_mode: 'guest',
      chat_type: 't2t',
      timestamp: Date.now()
    };

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

    const chatId = createChatResponse.data.data.id;
    console.log('Chat ID:', chatId);

    // Step 2: Send first message
    const firstUserMessageId = uuidv4();

    const firstMessagePayload = {
      stream: false,
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: 'qwen3-max',
      parent_id: null,
      messages: [
        {
          fid: firstUserMessageId,
          parentId: null,
          childrenIds: [],
          role: 'user',
          content: 'My favorite color is blue',
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
          parent_id: null
        }
      ],
      timestamp: Math.floor(Date.now() / 1000)
    };

    const firstResponse = await axios.post(
      `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
      firstMessagePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': QWEN_COOKIES,
          'bx-umidtoken': QWEN_TOKEN,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    console.log('\nFirst message response:');
    console.log('  User message fid:', firstUserMessageId);
    console.log('  Response parent_id:', firstResponse.data.data.parent_id);
    console.log('  Response message_id:', firstResponse.data.data.message_id);
    console.log('  Assistant content:', firstResponse.data.data.choices[0].message.content);

    const returnedParentId = firstResponse.data.data.parent_id;
    const assistantMessageId = firstResponse.data.data.message_id;

    console.log('\n🔍 KEY INSIGHT:');
    console.log('  The response includes both parent_id and message_id');
    console.log('  parent_id:', returnedParentId);
    console.log('  message_id (assistant):', assistantMessageId);

    // Step 3: Try using the returned parent_id for follow-up
    console.log('\n=== Sending follow-up using returned parent_id ===');

    const secondUserMessageId = uuidv4();

    const followUpPayload = {
      stream: false,
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: 'qwen3-max',
      parent_id: returnedParentId, // Use the parent_id from response
      messages: [
        {
          fid: secondUserMessageId,
          parentId: returnedParentId,
          childrenIds: [],
          role: 'user',
          content: 'What is my favorite color?',
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
          parent_id: returnedParentId
        }
      ],
      timestamp: Math.floor(Date.now() / 1000)
    };

    const followUpResponse = await axios.post(
      `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
      followUpPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': QWEN_COOKIES,
          'bx-umidtoken': QWEN_TOKEN,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    console.log('\nFollow-up response using parent_id from first response:');
    console.log('  Success:', followUpResponse.data.success);
    console.log('  Assistant response:', followUpResponse.data.data.choices[0].message.content);

    const response = followUpResponse.data.data.choices[0].message.content.toLowerCase();

    if (response.includes('blue')) {
      console.log('\n✅ SUCCESS! Using returned parent_id preserves context!');
      console.log('🔍 DISCOVERY: Use the parent_id from the previous response, not message_id!');
    } else {
      console.log('\n❌ Context not preserved even with parent_id');
      console.log('   Response:', response);
    }

    expect(followUpResponse.data.success).toBe(true);
  }, 60000);
});
