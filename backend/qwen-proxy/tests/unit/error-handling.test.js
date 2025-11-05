/**
 * Unit tests for error handling infrastructure
 * Tests error classes and middleware functionality
 */

const {
  APIError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  QwenAPIError,
  NotFoundError,
  asyncHandler,
  errorHandler
} = require('../../src/middleware/error-middleware');

describe('Error Classes', () => {
  describe('APIError', () => {
    it('should create an APIError with default values', () => {
      const error = new APIError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('APIError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('api_error');
      expect(error.code).toBeNull();
    });

    it('should create an APIError with custom values', () => {
      const error = new APIError('Custom error', 400, 'custom_type', 'custom_code');

      expect(error.statusCode).toBe(400);
      expect(error.type).toBe('custom_type');
      expect(error.code).toBe('custom_code');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with correct defaults', () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(APIError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Invalid authentication');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe('invalid_request_error');
      expect(error.code).toBe('invalid_api_key');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const error = new ValidationError('Invalid input', 'field_name');

      expect(error).toBeInstanceOf(APIError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe('invalid_request_error');
      expect(error.code).toBe('invalid_request');
      expect(error.param).toBe('field_name');
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError', () => {
      const error = new RateLimitError();

      expect(error).toBeInstanceOf(APIError);
      expect(error.name).toBe('RateLimitError');
      expect(error.statusCode).toBe(429);
      expect(error.type).toBe('rate_limit_error');
      expect(error.code).toBe('rate_limit_exceeded');
    });
  });

  describe('QwenAPIError', () => {
    it('should create a QwenAPIError', () => {
      const originalError = new Error('Network timeout');
      const error = new QwenAPIError('Failed to call Qwen API', originalError);

      expect(error).toBeInstanceOf(APIError);
      expect(error.name).toBe('QwenAPIError');
      expect(error.statusCode).toBe(502);
      expect(error.type).toBe('api_error');
      expect(error.code).toBe('qwen_api_error');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(APIError);
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe('invalid_request_error');
      expect(error.code).toBe('not_found');
    });
  });
});

describe('asyncHandler', () => {
  it('should wrap async function and catch errors', async () => {
    const mockNext = jest.fn();
    const handler = asyncHandler(async (req, res, next) => {
      throw new Error('Test error');
    });

    await handler({}, {}, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Test error'
    }));
  });

  it('should handle successful async function', async () => {
    const mockNext = jest.fn();
    const mockRes = { json: jest.fn() };
    const handler = asyncHandler(async (req, res, next) => {
      res.json({ success: true });
    });

    await handler({}, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('errorHandler', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      path: '/v1/chat/completions',
      url: '/v1/chat/completions',
      body: { test: 'data' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  it('should handle APIError correctly', () => {
    const error = new ValidationError('Invalid request', 'messages');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid request',
        type: 'invalid_request_error',
        param: 'messages',
        code: 'invalid_request'
      }
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Something went wrong',
        type: 'api_error',
        param: null,
        code: 'internal_error'
      }
    });
  });

  it('should handle error without message', () => {
    const error = new Error();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'An unexpected error occurred'
      })
    });
  });

  it('should use custom statusCode if present', () => {
    const error = new Error('Custom error');
    error.statusCode = 503;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(503);
  });
});
