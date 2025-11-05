/**
 * Unit tests for request-validator middleware
 *
 * Tests:
 * - Valid requests pass validation
 * - Invalid requests are rejected with 400
 * - Error messages are clear and specific
 */

const validateChatRequest = require('../../src/middleware/request-validator');
const { ValidationError } = require('../../src/utils/retry-handler');

describe('request-validator', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Valid Requests', () => {
    test('accepts valid request with messages', () => {
      req.body = {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next.mock.calls[0]).toHaveLength(0); // No error
    });

    test('accepts request with multiple messages', () => {
      req.body = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next.mock.calls[0]).toHaveLength(0);
    });

    test('accepts request with optional parameters', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'qwen3-max',
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next.mock.calls[0]).toHaveLength(0);
    });

    test('accepts empty content string', () => {
      req.body = {
        messages: [{ role: 'user', content: '' }]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next.mock.calls[0]).toHaveLength(0);
    });
  });

  describe('Invalid Requests', () => {
    test('rejects missing messages field', () => {
      req.body = {};

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages field is required');
    });

    test('rejects non-array messages', () => {
      req.body = {
        messages: 'not an array'
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages must be an array');
    });

    test('rejects empty messages array', () => {
      req.body = {
        messages: []
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages array must not be empty');
    });

    test('rejects message without role', () => {
      req.body = {
        messages: [{ content: 'Hello' }]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages[0].role is required');
    });

    test('rejects message without content', () => {
      req.body = {
        messages: [{ role: 'user' }]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages[0].content is required');
    });

    test('rejects invalid role', () => {
      req.body = {
        messages: [{ role: 'invalid', content: 'Hello' }]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toContain('must be one of');
    });

    test('rejects non-string content', () => {
      req.body = {
        messages: [{ role: 'user', content: 123 }]
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages[0].content must be a string');
    });

    test('rejects non-object message', () => {
      req.body = {
        messages: ['invalid']
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('messages[0] must be an object');
    });
  });

  describe('Optional Parameter Validation', () => {
    test('rejects non-string model', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 123
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('model must be a string');
    });

    test('rejects non-number temperature', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 'hot'
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('temperature must be a number');
    });

    test('rejects temperature out of range', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 3
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('temperature must be between 0 and 2');
    });

    test('rejects non-integer max_tokens', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100.5
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('max_tokens must be an integer');
    });

    test('rejects negative max_tokens', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: -1
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('max_tokens must be greater than 0');
    });

    test('rejects non-boolean stream', () => {
      req.body = {
        messages: [{ role: 'user', content: 'Hello' }],
        stream: 'yes'
      };

      validateChatRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('stream must be a boolean');
    });
  });
});
