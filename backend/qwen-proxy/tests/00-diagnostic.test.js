require('dotenv').config();
const axios = require('axios');

// Diagnostic test to check token validity

describe('Qwen API - Diagnostic Tests', () => {
  const QWEN_BASE_URL = 'https://chat.qwen.ai';
  const QWEN_COOKIES = process.env.QWEN_COOKIES;
  const QWEN_TOKEN = process.env.QWEN_TOKEN;

  test('Check if credentials are properly configured', () => {
    console.log('\n=== DIAGNOSTIC TEST ===');
    console.log('QWEN_TOKEN exists:', !!QWEN_TOKEN);
    console.log('QWEN_TOKEN value (first 30 chars):', QWEN_TOKEN?.substring(0, 30));
    console.log('QWEN_TOKEN length:', QWEN_TOKEN?.length);
    console.log('QWEN_COOKIES exists:', !!QWEN_COOKIES);
    console.log('QWEN_COOKIES length:', QWEN_COOKIES?.length);

    expect(QWEN_TOKEN).toBeDefined();
    expect(QWEN_TOKEN).not.toBe('undefined');
    expect(QWEN_COOKIES).toBeDefined();
  });

  test('Try to fetch models list (no auth required)', async () => {
    console.log('\n=== TEST: Fetch Models (Simpler Endpoint) ===');

    try {
      const response = await axios.get(
        `${QWEN_BASE_URL}/api/models`,
        {
          headers: {
            'Cookie': QWEN_COOKIES
          }
        }
      );

      console.log('Models response status:', response.status);
      console.log('Models response type:', typeof response.data);

      if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
        console.log('❌ Got HTML/WAF challenge instead of JSON');
        console.log('This means the Cookies might be expired or invalid');
      } else {
        console.log('✅ Got JSON response!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data type:', typeof error.response.data);
      }
    }
  }, 30000);

  test('Try to create chat with full headers', async () => {
    console.log('\n=== TEST: Create Chat with Full Headers ===');

    const payload = {
      title: 'Diagnostic Test',
      models: ['qwen3-max'],
      chat_mode: 'guest',
      chat_type: 't2t',
      timestamp: Date.now()
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Using token:', QWEN_TOKEN.substring(0, 30) + '...');
    console.log('Using cookies length:', QWEN_COOKIES.length);

    try {
      const response = await axios.post(
        `${QWEN_BASE_URL}/api/v2/chats/new`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': QWEN_COOKIES,
            'bx-umidtoken': QWEN_TOKEN,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      console.log('Response status:', response.status);
      console.log('Response type:', typeof response.data);

      if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
        console.log('❌ STILL got HTML/WAF challenge');
        console.log('The bx-umidtoken might be expired or invalid');
        console.log('\n🔍 HOW TO GET A FRESH TOKEN:');
        console.log('1. Open https://chat.qwen.ai in browser');
        console.log('2. Open DevTools (F12)');
        console.log('3. Go to Network tab');
        console.log('4. Send a message in Qwen chat');
        console.log('5. Find the /api/v2/chat/completions request');
        console.log('6. Look for bx-umidtoken header');
        console.log('7. Copy that value to .env file');
      } else {
        console.log('✅ SUCCESS! Got JSON response');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        expect(response.data.success).toBe(true);
      }
    } catch (error) {
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        const dataType = typeof error.response.data;
        console.log('Response data type:', dataType);
        if (dataType === 'string') {
          console.log('Response preview:', error.response.data.substring(0, 200));
        }
      }
      throw error;
    }
  }, 30000);
});
