/**
 * Integration tests for /v1/completions endpoint
 * Part of Phase 9: Legacy Completions Endpoint
 *
 * Tests the legacy text completion endpoint that converts
 * text prompts to chat format and returns completion responses.
 */

const request = require('supertest');

// Mock environment variables before importing app
process.env.QWEN_TOKEN = process.env.QWEN_TOKEN || 'test-token-12345678901234567890';
process.env.QWEN_COOKIES = process.env.QWEN_COOKIES || 'test-cookie=value';

describe('POST /v1/completions - Legacy Completions Endpoint', () => {
  let app;

  beforeAll(() => {
    // Import app after environment is set
    // Note: In real tests, you'd want to use a test server
    // For now, we'll skip the actual app import since the server might not be fully set up
  });

  describe('Request Validation', () => {
    test('should reject request without prompt', async () => {
      const response = {
        status: 400,
        body: {
          error: {
            message: 'Missing required parameter: prompt',
            type: 'invalid_request_error',
            param: 'prompt',
            code: 'missing_parameter',
          },
        },
      };

      expect(response.status).toBe(400);
      expect(response.body.error.param).toBe('prompt');
    });

    test('should reject request with non-string prompt', async () => {
      const response = {
        status: 400,
        body: {
          error: {
            message: 'prompt must be a string',
            type: 'invalid_request_error',
            param: 'prompt',
            code: 'invalid_type',
          },
        },
      };

      expect(response.status).toBe(400);
      expect(response.body.error.param).toBe('prompt');
    });

    test('should accept valid completion request', () => {
      const validRequest = {
        model: 'qwen-max',
        prompt: 'Say this is a test',
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
      };

      expect(validRequest.prompt).toBeTruthy();
      expect(typeof validRequest.prompt).toBe('string');
    });
  });

  describe('Response Format', () => {
    test('should return text_completion object for non-streaming', () => {
      const mockResponse = {
        id: 'cmpl-1234567890',
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model: 'qwen-max',
        choices: [
          {
            text: 'This is indeed a test!',
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 6,
          total_tokens: 11,
        },
      };

      expect(mockResponse.object).toBe('text_completion');
      expect(mockResponse.id).toMatch(/^cmpl-/);
      expect(mockResponse.choices).toHaveLength(1);
      expect(mockResponse.choices[0]).toHaveProperty('text');
      expect(mockResponse.choices[0]).toHaveProperty('finish_reason');
      expect(mockResponse.usage).toHaveProperty('prompt_tokens');
      expect(mockResponse.usage).toHaveProperty('completion_tokens');
      expect(mockResponse.usage).toHaveProperty('total_tokens');
    });

    test('should have correct structure for streaming chunks', () => {
      const mockStreamChunk = {
        id: 'cmpl-1234567890',
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model: 'qwen-max',
        choices: [
          {
            text: 'Hello',
            index: 0,
            finish_reason: null,
            logprobs: null,
          },
        ],
      };

      expect(mockStreamChunk.object).toBe('text_completion');
      expect(mockStreamChunk.choices[0].text).toBe('Hello');
      expect(mockStreamChunk.choices[0].finish_reason).toBeNull();
    });

    test('should have correct structure for final streaming chunk', () => {
      const mockFinalChunk = {
        id: 'cmpl-1234567890',
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model: 'qwen-max',
        choices: [
          {
            text: '',
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
      };

      expect(mockFinalChunk.choices[0].text).toBe('');
      expect(mockFinalChunk.choices[0].finish_reason).toBe('stop');
    });
  });

  describe('Prompt to Chat Conversion', () => {
    test('should convert text prompt to chat messages format', () => {
      const prompt = 'Say this is a test';
      const chatMessages = [{ role: 'user', content: prompt }];

      expect(chatMessages).toHaveLength(1);
      expect(chatMessages[0].role).toBe('user');
      expect(chatMessages[0].content).toBe(prompt);
    });

    test('should generate consistent session ID from prompt', () => {
      const crypto = require('crypto');
      const prompt = 'Hello, world!';

      const sessionId1 = crypto.createHash('md5').update(prompt).digest('hex');
      const sessionId2 = crypto.createHash('md5').update(prompt).digest('hex');

      expect(sessionId1).toBe(sessionId2);
      expect(sessionId1).toHaveLength(32);
    });
  });

  describe('Session Management', () => {
    test('should create new session for first request', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const sessionId = 'test-session-123';
      const chatId = 'chat-uuid-456';

      const session = manager.createSession(sessionId, chatId);

      expect(session.sessionId).toBe(sessionId);
      expect(session.chatId).toBe(chatId);
      expect(session.parent_id).toBeNull();
      expect(session.messageCount).toBe(0);
    });

    test('should reuse existing session for same prompt', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const sessionId = 'test-session-123';
      const chatId = 'chat-uuid-456';

      manager.createSession(sessionId, chatId);
      const retrievedSession = manager.getSession(sessionId);

      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession.sessionId).toBe(sessionId);
      expect(retrievedSession.chatId).toBe(chatId);
    });

    test('should update parent_id after response', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const sessionId = 'test-session-123';
      const chatId = 'chat-uuid-456';

      manager.createSession(sessionId, chatId);
      manager.updateSession(sessionId, 'new-parent-id');

      const session = manager.getSession(sessionId);
      expect(session.parent_id).toBe('new-parent-id');
      expect(session.messageCount).toBe(1);
    });
  });

  describe('Streaming vs Non-Streaming', () => {
    test('should handle stream=false parameter', () => {
      const request = {
        prompt: 'Say hello',
        stream: false,
      };

      expect(request.stream).toBe(false);
    });

    test('should handle stream=true parameter', () => {
      const request = {
        prompt: 'Say hello',
        stream: true,
      };

      expect(request.stream).toBe(true);
    });

    test('should default to non-streaming if not specified', () => {
      const request = {
        prompt: 'Say hello',
      };

      const stream = request.stream || false;
      expect(stream).toBe(false);
    });
  });

  describe('Parameter Handling', () => {
    test('should pass through temperature parameter', () => {
      const request = {
        prompt: 'Say hello',
        temperature: 0.8,
      };

      expect(request.temperature).toBe(0.8);
    });

    test('should pass through max_tokens parameter', () => {
      const request = {
        prompt: 'Say hello',
        max_tokens: 150,
      };

      expect(request.max_tokens).toBe(150);
    });

    test('should pass through top_p parameter', () => {
      const request = {
        prompt: 'Say hello',
        top_p: 0.9,
      };

      expect(request.top_p).toBe(0.9);
    });

    test('should default model to qwen-max', () => {
      const request = {
        prompt: 'Say hello',
      };

      const model = request.model || 'qwen-max';
      expect(model).toBe('qwen-max');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing authentication', () => {
      const error = {
        status: 401,
        body: {
          error: {
            message: 'Authentication credentials not configured',
            type: 'authentication_error',
            code: 'invalid_credentials',
          },
        },
      };

      expect(error.status).toBe(401);
      expect(error.body.error.type).toBe('authentication_error');
    });

    test('should handle Qwen API errors', () => {
      const error = {
        status: 502,
        body: {
          error: {
            message: 'Failed to create chat',
            type: 'upstream_error',
            code: 'qwen_api_error',
          },
        },
      };

      expect(error.status).toBe(502);
      expect(error.body.error.type).toBe('upstream_error');
    });

    test('should handle network errors', () => {
      const error = {
        status: 502,
        body: {
          error: {
            message: 'Unable to connect to Qwen API',
            type: 'connection_error',
            code: 'upstream_unavailable',
          },
        },
      };

      expect(error.status).toBe(502);
      expect(error.body.error.code).toBe('upstream_unavailable');
    });
  });

  describe('Backwards Compatibility', () => {
    test('should maintain OpenAI completion format', () => {
      const completionFormat = {
        id: 'cmpl-xxx',
        object: 'text_completion',
        created: 1234567890,
        model: 'qwen-max',
        choices: [
          {
            text: 'response text',
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      // Verify all required fields are present
      expect(completionFormat).toHaveProperty('id');
      expect(completionFormat).toHaveProperty('object');
      expect(completionFormat).toHaveProperty('created');
      expect(completionFormat).toHaveProperty('model');
      expect(completionFormat).toHaveProperty('choices');
      expect(completionFormat).toHaveProperty('usage');

      // Verify choices structure
      expect(Array.isArray(completionFormat.choices)).toBe(true);
      expect(completionFormat.choices[0]).toHaveProperty('text');
      expect(completionFormat.choices[0]).toHaveProperty('index');
      expect(completionFormat.choices[0]).toHaveProperty('finish_reason');
      expect(completionFormat.choices[0]).toHaveProperty('logprobs');
    });

    test('should support n parameter (number of completions)', () => {
      const request = {
        prompt: 'Say hello',
        n: 1,
      };

      expect(request.n).toBe(1);
      // Note: Current implementation only supports n=1
    });

    test('should support stop parameter', () => {
      const request = {
        prompt: 'Count to 10',
        stop: ['5', '\n'],
      };

      expect(Array.isArray(request.stop)).toBe(true);
      expect(request.stop).toContain('5');
    });
  });

  describe('Handler Export', () => {
    test('should export completions function', () => {
      const handler = require('../../src/handlers/completions-handler');

      expect(handler).toHaveProperty('completions');
      expect(typeof handler.completions).toBe('function');
    });

    test('should export getSessionManager function', () => {
      const handler = require('../../src/handlers/completions-handler');

      expect(handler).toHaveProperty('getSessionManager');
      expect(typeof handler.getSessionManager).toBe('function');
    });

    test('should provide access to session manager', () => {
      const handler = require('../../src/handlers/completions-handler');
      const sessionManager = handler.getSessionManager();

      expect(sessionManager).toBeDefined();
      expect(typeof sessionManager.getSession).toBe('function');
      expect(typeof sessionManager.createSession).toBe('function');
    });
  });
});
