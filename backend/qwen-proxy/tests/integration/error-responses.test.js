/**
 * Integration tests for error responses
 * Tests that errors return OpenAI-compatible format
 */

const express = require('express');
const request = require('supertest');
const {
  errorHandler,
  notFoundHandler,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  QwenAPIError
} = require('../../src/middleware/error-middleware');
const requestLogger = require('../../src/middleware/request-logger');

describe('Error Response Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(requestLogger);
  });

  describe('400 Validation Errors', () => {
    it('should return OpenAI-compatible validation error', async () => {
      app.get('/test-validation', (req, res, next) => {
        next(new ValidationError('messages field is required', 'messages'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-validation');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          message: 'messages field is required',
          type: 'invalid_request_error',
          param: 'messages',
          code: 'invalid_request'
        }
      });
    });

    it('should handle validation error without param', async () => {
      app.get('/test-validation', (req, res, next) => {
        next(new ValidationError('Invalid request body'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-validation');

      expect(response.status).toBe(400);
      expect(response.body.error.param).toBeNull();
    });
  });

  describe('401 Authentication Errors', () => {
    it('should return OpenAI-compatible auth error', async () => {
      app.get('/test-auth', (req, res, next) => {
        next(new AuthenticationError('Invalid API key'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-auth');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
          param: null,
          code: 'invalid_api_key'
        }
      });
    });
  });

  describe('404 Not Found Errors', () => {
    it('should return OpenAI-compatible not found error', async () => {
      app.get('/test-404', (req, res, next) => {
        next(new NotFoundError('Model not found'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-404');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          message: 'Model not found',
          type: 'invalid_request_error',
          param: null,
          code: 'not_found'
        }
      });
    });

    it('should handle unknown routes with notFoundHandler', async () => {
      app.use(notFoundHandler);
      app.use(errorHandler);

      const response = await request(app).get('/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toMatch(/Route not found/);
      expect(response.body.error.code).toBe('not_found');
    });
  });

  describe('500 Internal Errors', () => {
    it('should return OpenAI-compatible internal error', async () => {
      app.get('/test-500', (req, res, next) => {
        next(new Error('Internal server error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-500');

      expect(response.status).toBe(500);
      expect(response.body.error.type).toBe('api_error');
      expect(response.body.error.code).toBe('internal_error');
    });
  });

  describe('502 Qwen API Errors', () => {
    it('should return OpenAI-compatible Qwen API error', async () => {
      app.get('/test-qwen-error', (req, res, next) => {
        const originalError = new Error('Network timeout');
        next(new QwenAPIError('Failed to call Qwen API', originalError));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-qwen-error');

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: {
          message: 'Failed to call Qwen API',
          type: 'api_error',
          param: null,
          code: 'qwen_api_error'
        }
      });
    });
  });

  describe('Error Format Compliance', () => {
    it('should always return error in OpenAI format', async () => {
      const errors = [
        new ValidationError('Test validation'),
        new AuthenticationError(),
        new NotFoundError('Test not found'),
        new QwenAPIError('Test Qwen error'),
        new Error('Generic error')
      ];

      for (const error of errors) {
        const testApp = express();
        testApp.use(express.json());
        testApp.get('/test', (req, res, next) => next(error));
        testApp.use(errorHandler);

        const response = await request(testApp).get('/test');

        // Verify OpenAI error format
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error).toHaveProperty('type');
        expect(response.body.error).toHaveProperty('param');
        expect(response.body.error).toHaveProperty('code');

        // Verify no other fields at top level
        expect(Object.keys(response.body)).toEqual(['error']);
      }
    });

    it('should never leak stack traces to clients', async () => {
      app.get('/test-stack', (req, res, next) => {
        const error = new Error('Error with stack');
        error.stack = 'SENSITIVE STACK TRACE\n  at function1\n  at function2';
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test-stack');

      // Verify stack trace is not in the response body
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body.error).not.toHaveProperty('stack');

      // Verify the error follows OpenAI format
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toBe('Error with stack');

      // Verify stack trace details are not leaked
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('SENSITIVE STACK TRACE');
      expect(responseStr).not.toContain('function1');
      expect(responseStr).not.toContain('function2');
    });
  });
});
