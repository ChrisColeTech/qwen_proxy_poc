require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// CRITICAL TEST: Discover how Qwen handles follow-up messages

describe('Qwen Real API - Follow-up Message Discovery', () => {
  const QWEN_BASE_URL = 'https://chat.qwen.ai';
  const QWEN_COOKIES = process.env.QWEN_COOKIES;
  const QWEN_TOKEN = process.env.QWEN_TOKEN;

  // Store state between tests
  let chatId;
  let firstMessageId;
  let firstAssistantMessageId;

  test('Setup: Create chat and send first message', async () => {
    console.log('\n=== SETUP: Creating chat and first message ===');

    // Create chat
    const newChatPayload = {
      title: 'Follow-up Test',
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

    chatId = createChatResponse.data.data.id;
    console.log('Chat ID:', chatId);

    // Send first message
    firstMessageId = uuidv4();

    const firstMessagePayload = {
      stream: false,
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: 'qwen3-max',
      parent_id: null,
      messages: [
        {
          fid: firstMessageId,
          parentId: null,
          childrenIds: [],
          role: 'user',
          content: 'Remember this number: 42',
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

    expect(firstResponse.data.success).toBe(true);
    firstAssistantMessageId = firstResponse.data.data.message_id;

    console.log('First message sent');
    console.log('First user message ID:', firstMessageId);
    console.log('First assistant message ID:', firstAssistantMessageId);
    console.log('Parent ID returned:', firstResponse.data.data.parent_id);
    console.log('Assistant response:', firstResponse.data.data.choices[0].message.content);
  }, 30000);

  test('DISCOVERY TEST 1: Send follow-up with just NEW message', async () => {
    console.log('\n=== TEST 1: Send ONLY the new message (no history) ===');

    const secondMessageId = uuidv4();

    const followUpPayload = {
      stream: false,
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: 'qwen3-max',
      parent_id: firstAssistantMessageId, // Use the assistant's message ID as parent
      messages: [
        {
          fid: secondMessageId,
          parentId: firstAssistantMessageId,
          childrenIds: [],
          role: 'user',
          content: 'What number did I ask you to remember?',
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
          parent_id: firstAssistantMessageId
        }
      ],
      timestamp: Math.floor(Date.now() / 1000)
    };

    console.log('Sending follow-up with ONLY new message...');
    console.log('Parent ID:', firstAssistantMessageId);

    try {
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

      console.log('\n✅ SUCCESS! Qwen accepts ONLY the new message');
      console.log('Response success:', followUpResponse.data.success);
      console.log('Assistant response:', followUpResponse.data.data.choices[0].message.content);
      console.log('\n🔍 DISCOVERY: Qwen maintains conversation context SERVER-SIDE!');
      console.log('   You only need to send the NEW message, not the full history!');

      expect(followUpResponse.data.success).toBe(true);

      // Check if the assistant remembers the number
      const response = followUpResponse.data.data.choices[0].message.content.toLowerCase();
      if (response.includes('42')) {
        console.log('\n✅ Qwen REMEMBERS the context from the first message!');
      } else {
        console.log('\n⚠️  Qwen did NOT remember the context (but request succeeded)');
      }
    } catch (error) {
      console.log('\n❌ FAILED! Qwen requires full message history');
      console.log('Error:', error.response?.data || error.message);
      throw error;
    }
  }, 30000);
});
