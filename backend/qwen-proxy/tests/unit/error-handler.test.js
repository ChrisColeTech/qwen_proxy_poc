/**
 * Unit tests for error-handler middleware
 *
 * Tests:
 * - Maps custom errors to OpenAI-compatible format
 * - Sets correct HTTP status codes
 * - Handles different error types
 */

const errorHandler = require('../../src/middleware/error-handler');
const { mapErrorToResponse } = errorHandler;
const {
  QwenAuthError,
  QwenAPIError,
  SessionError,
  ValidationError
} = require('../../src/utils/retry-handler');

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

const logger = require('../../src/utils/logger');

describe('error-handler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/v1/chat/completions',
      url: '/v1/chat/completions',
      body: { messages: [] }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear mock calls
    logger.error.mockClear();
  });

  afterEach(() => {
    // No need to restore console.error anymore
  });

  describe('mapErrorToResponse', () => {
    test('maps ValidationError to 400', () => {
      const error = new ValidationError('Invalid request');
      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(400);
      expect(errorResponse).toEqual({
        error: {
          message: 'Invalid request',
          type: 'invalid_request_error',
          code: 'invalid_request'
        }
      });
    });

    test('maps QwenAuthError to 401', () => {
      const error = new QwenAuthError('Invalid credentials');
      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(401);
      expect(errorResponse).toEqual({
        error: {
          message: 'Invalid credentials',
          type: 'authentication_error',
          code: 'invalid_credentials'
        }
      });
    });

    test('maps SessionError to 500', () => {
      const error = new SessionError('Invalid parent_id');
      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(500);
      expect(errorResponse).toEqual({
        error: {
          message: 'Invalid parent_id',
          type: 'server_error',
          code: 'session_error'
        }
      });
    });

    test('maps QwenAPIError to correct status', () => {
      const error = new QwenAPIError('API error', 502);
      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(502);
      expect(errorResponse).toEqual({
        error: {
          message: 'API error',
          type: 'api_error',
          code: 'qwen_api_error'
        }
      });
    });

    test('maps network error (no response) to 503', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNRESET',
        message: 'Connection reset'
      };

      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(503);
      expect(errorResponse).toEqual({
        error: {
          message: 'Network error: Unable to reach Qwen API',
          type: 'api_error',
          code: 'ECONNRESET'
        }
      });
    });

    test('maps 401 HTTP error to authentication_error', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {}
        }
      };

      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(401);
      expect(errorResponse.error.type).toBe('authentication_error');
    });

    test('maps 429 HTTP error to rate_limit_exceeded', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {}
        }
      };

      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(429);
      expect(errorResponse).toEqual({
        error: {
          message: 'Rate limit exceeded',
          type: 'api_error',
          code: 'rate_limit_exceeded'
        }
      });
    });

    test('maps 5xx HTTP error to qwen_unavailable', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {}
        }
      };

      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(502);
      expect(errorResponse).toEqual({
        error: {
          message: 'Qwen API is temporarily unavailable',
          type: 'api_error',
          code: 'qwen_unavailable'
        }
      });
    });

    test('maps generic error to 500', () => {
      const error = new Error('Something went wrong');
      const { statusCode, errorResponse } = mapErrorToResponse(error);

      expect(statusCode).toBe(500);
      expect(errorResponse).toEqual({
        error: {
          message: 'Something went wrong',
          type: 'server_error',
          code: 'internal_error'
        }
      });
    });
  });

  describe('errorHandler middleware', () => {
    test('handles ValidationError correctly', () => {
      const error = new ValidationError('messages is required');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'messages is required',
          type: 'invalid_request_error',
          code: 'invalid_request'
        }
      });
    });

    test('handles QwenAuthError correctly', () => {
      const error = new QwenAuthError('Invalid credentials');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid credentials',
          type: 'authentication_error',
          code: 'invalid_credentials'
        }
      });
    });

    test('handles SessionError correctly', () => {
      const error = new SessionError('Invalid parent_id');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid parent_id',
          type: 'server_error',
          code: 'session_error'
        }
      });
    });

    test('handles network errors correctly', () => {
      const error = {
        isAxiosError: true,
        code: 'ETIMEDOUT',
        message: 'Timeout'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Network error: Unable to reach Qwen API',
          type: 'api_error',
          code: 'ETIMEDOUT'
        }
      });
    });

    test('logs error details', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Request error',
        expect.objectContaining({
          error: 'Test error',
          type: 'Error',
          method: 'POST',
          url: '/v1/chat/completions'
        })
      );
    });
  });
});
