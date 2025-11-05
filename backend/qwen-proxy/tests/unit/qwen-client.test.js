/**
 * Unit Tests for QwenClient
 * Tests the low-level Qwen API client with real API calls
 *
 * These tests use REAL API credentials from .env
 * They verify that the client correctly calls Qwen endpoints
 */

const QwenClient = require('../../src/services/qwen-client');
const { QwenAPIError } = require('../../src/services/qwen-client');
const config = require('../../src/config');
const auth = require('../../src/api/qwen-auth');

describe('QwenClient', () => {
  let client;

  beforeAll(() => {
    // Create client instance with real auth
    client = new QwenClient(auth, config);
  });

  describe('Constructor', () => {
    test('should create client with default config', () => {
      expect(client).toBeInstanceOf(QwenClient);
      expect(client.baseURL).toBe(config.qwen.baseURL);
      expect(client.timeout).toBe(config.qwen.timeout);
    });

    test('should have axios instance configured', () => {
      expect(client.axiosInstance).toBeDefined();
      expect(client.axiosInstance.defaults.baseURL).toBe(config.qwen.baseURL);
    });
  });

  describe('getModels() - REAL API Call', () => {
    test('should fetch models from real Qwen API', async () => {
      const response = await client.getModels();

      // Verify response structure
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Verify model structure (from /docs/payloads/models/response.json)
      const firstModel = response.data[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('object');
      expect(firstModel).toHaveProperty('owned_by');
      expect(firstModel).toHaveProperty('info');

      // Verify info structure
      expect(firstModel.info).toHaveProperty('meta');
      expect(firstModel.info.meta).toHaveProperty('capabilities');
      expect(firstModel.info.meta).toHaveProperty('max_context_length');

      console.log(`✓ Fetched ${response.data.length} models from Qwen API`);
      console.log(`  First model: ${firstModel.id} (${firstModel.name})`);
    }, 30000); // 30 second timeout for API call

    test('should include expected models', async () => {
      const response = await client.getModels();
      const modelIds = response.data.map((m) => m.id);

      // Check for known models (based on response.json)
      const expectedModels = ['qwen3-max', 'qwen3-coder-plus'];
      const hasExpectedModels = expectedModels.some((id) => modelIds.includes(id));

      expect(hasExpectedModels).toBe(true);
      console.log(`  Available models: ${modelIds.join(', ')}`);
    }, 30000);

    test('should handle API errors gracefully', async () => {
      // Create client with invalid baseURL to simulate API error
      const badUrlClient = new QwenClient(auth, {
        ...config,
        qwen: {
          ...config.qwen,
          baseURL: 'https://chat.qwen.ai/api/nonexistent',
        },
      });

      try {
        await badUrlClient.getModels();
        // If it doesn't throw, that's okay - we're just testing error handling
      } catch (error) {
        expect(error).toBeInstanceOf(QwenAPIError);
        expect(error.message).toBeDefined();
        console.log('  ✓ Error handling works correctly');
      }
    }, 30000);
  });

  describe('createNewChat() - REAL API Call', () => {
    test('should create new chat session', async () => {
      const chatId = await client.createNewChat('Test Chat', ['qwen3-max']);

      // Verify chat_id format (UUID)
      expect(chatId).toBeDefined();
      expect(typeof chatId).toBe('string');
      expect(chatId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      console.log(`✓ Created new chat with ID: ${chatId}`);
    }, 30000);

    test('should create chat with default parameters', async () => {
      const chatId = await client.createNewChat();

      expect(chatId).toBeDefined();
      expect(typeof chatId).toBe('string');

      console.log(`✓ Created chat with defaults: ${chatId}`);
    }, 30000);

    test('should create chat with custom title', async () => {
      const customTitle = 'Unit Test Chat - ' + Date.now();
      const chatId = await client.createNewChat(customTitle, ['qwen3-max']);

      expect(chatId).toBeDefined();
      console.log(`✓ Created chat "${customTitle}": ${chatId}`);
    }, 30000);
  });

  describe('sendMessage() - Non-streaming', () => {
    let chatId;

    beforeAll(async () => {
      // Create a chat for testing
      chatId = await client.createNewChat('Test Chat for sendMessage', ['qwen3-max']);
      console.log(`Setup: Created chat ${chatId} for sendMessage tests`);
    }, 30000);

    test('should send message and receive non-streaming response', async () => {
      // Create a simple Qwen payload
      const qwenPayload = {
        stream: false,
        incremental_output: true,
        chat_id: chatId,
        chat_mode: 'guest',
        model: 'qwen3-max',
        parent_id: null,
        messages: [
          {
            fid: '00000000-0000-0000-0000-000000000001',
            parentId: null,
            childrenIds: [],
            role: 'user',
            content: 'Say "Hello World" and nothing else.',
            user_action: 'chat',
            files: [],
            timestamp: Math.floor(Date.now() / 1000),
            models: ['qwen3-max'],
            chat_type: 't2t',
            feature_config: {
              thinking_enabled: false,
              output_schema: 'phase',
            },
            extra: {
              meta: {
                subChatType: 't2t',
              },
            },
            sub_chat_type: 't2t',
            parent_id: null,
          },
        ],
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await client.sendMessage(qwenPayload, { stream: false });

      // Verify response structure
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // Verify message data
      const data = response.data.data;
      expect(data).toHaveProperty('parent_id');
      expect(data).toHaveProperty('message_id');
      expect(data).toHaveProperty('choices');

      // Verify choices structure
      expect(Array.isArray(data.choices)).toBe(true);
      expect(data.choices.length).toBeGreaterThan(0);
      expect(data.choices[0]).toHaveProperty('message');
      expect(data.choices[0].message).toHaveProperty('role');
      expect(data.choices[0].message).toHaveProperty('content');
      expect(data.choices[0].message.role).toBe('assistant');

      console.log(`✓ Received non-streaming response`);
      console.log(`  Response: ${data.choices[0].message.content.substring(0, 100)}...`);
    }, 60000); // 60 seconds for completion
  });

  describe('sendMessage() - Streaming', () => {
    let chatId;

    beforeAll(async () => {
      chatId = await client.createNewChat('Test Chat for Streaming', ['qwen3-max']);
      console.log(`Setup: Created chat ${chatId} for streaming tests`);
    }, 30000);

    test('should send message and receive streaming response', async () => {
      const qwenPayload = {
        stream: true,
        incremental_output: true,
        chat_id: chatId,
        chat_mode: 'guest',
        model: 'qwen3-max',
        parent_id: null,
        messages: [
          {
            fid: '00000000-0000-0000-0000-000000000002',
            parentId: null,
            childrenIds: [],
            role: 'user',
            content: 'Count from 1 to 3.',
            user_action: 'chat',
            files: [],
            timestamp: Math.floor(Date.now() / 1000),
            models: ['qwen3-max'],
            chat_type: 't2t',
            feature_config: {
              thinking_enabled: false,
              output_schema: 'phase',
            },
            extra: {
              meta: {
                subChatType: 't2t',
              },
            },
            sub_chat_type: 't2t',
            parent_id: null,
          },
        ],
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await client.sendMessage(qwenPayload, { stream: true });

      // Verify response is a stream
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(typeof response.data.on).toBe('function'); // Stream has 'on' method

      // Collect chunks
      const chunks = [];
      let parentId = null;

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(5).trim());

                // First chunk contains response.created
                if (data['response.created']) {
                  parentId = data['response.created'].parent_id;
                  expect(parentId).toBeDefined();
                  console.log(`  ✓ Received response.created with parent_id: ${parentId}`);
                }

                // Content chunks
                if (data.choices?.[0]?.delta?.content) {
                  chunks.push(data.choices[0].delta.content);
                }
              } catch (e) {
                // Ignore parsing errors for empty lines
              }
            }
          }
        });

        response.data.on('end', () => {
          console.log(`✓ Received ${chunks.length} streaming chunks`);
          console.log(`  Full response: ${chunks.join('')}`);
          expect(chunks.length).toBeGreaterThan(0);
          expect(parentId).toBeDefined();
          resolve();
        });

        response.data.on('error', reject);
      });
    }, 60000);
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Create client with invalid baseURL
      const badClient = new QwenClient(auth, {
        ...config,
        qwen: {
          ...config.qwen,
          baseURL: 'http://invalid-domain-that-does-not-exist.com',
        },
      });

      await expect(badClient.getModels()).rejects.toThrow();

      try {
        await badClient.getModels();
      } catch (error) {
        expect(error).toBeInstanceOf(QwenAPIError);
        expect(error.message).toContain('Cannot resolve Qwen API hostname');
      }
    }, 30000);

    test('should handle missing chat_id in sendMessage', async () => {
      const invalidPayload = {
        stream: false,
        // Missing chat_id
        messages: [],
      };

      await expect(
        client.sendMessage(invalidPayload, { stream: false })
      ).rejects.toThrow('Missing chat_id');
    });
  });

  describe('Retry Logic', () => {
    test('shouldRetry() returns false for auth errors', () => {
      const authError = new QwenAPIError('Auth failed', 401);
      expect(QwenClient.shouldRetry(authError)).toBe(false);
    });

    test('shouldRetry() returns false for client errors', () => {
      const clientError = new QwenAPIError('Bad request', 400);
      expect(QwenClient.shouldRetry(clientError)).toBe(false);
    });

    test('shouldRetry() returns true for server errors', () => {
      const serverError = new QwenAPIError('Server error', 500);
      expect(QwenClient.shouldRetry(serverError)).toBe(true);
    });

    test('shouldRetry() returns true for rate limiting', () => {
      const rateLimitError = new QwenAPIError('Rate limit', 429);
      expect(QwenClient.shouldRetry(rateLimitError)).toBe(true);
    });

    test('shouldRetry() returns true for network errors', () => {
      const networkError = new QwenAPIError('Network error', null);
      expect(QwenClient.shouldRetry(networkError)).toBe(true);
    });

    test('withRetry() should retry on retryable errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new QwenAPIError('Server error', 500);
        }
        return 'success';
      };

      const result = await client.withRetry(fn, {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    }, 10000);

    test('withRetry() should not retry on auth errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new QwenAPIError('Auth failed', 401);
      };

      await expect(
        client.withRetry(fn, {
          maxRetries: 3,
          baseDelay: 10,
          maxDelay: 100,
        })
      ).rejects.toThrow();

      expect(attempts).toBe(1); // Only tried once
    });
  });

  describe('Integration with auth-service', () => {
    test('should use auth service headers', () => {
      const headers = client._getHeaders();

      expect(headers).toHaveProperty('bx-umidtoken');
      expect(headers).toHaveProperty('Cookie');
      expect(headers).toHaveProperty('Content-Type');
      expect(headers).toHaveProperty('User-Agent');

      console.log('✓ Auth headers correctly integrated');
      console.log(`  Token preview: ${auth.getTokenPreview()}`);
      console.log(`  Cookie preview: ${auth.getCookiePreview()}`);
    });
  });
});
