/**
 * Unit tests for retry-handler
 *
 * Tests:
 * - Retry logic with exponential backoff
 * - Error classification (retryable vs non-retryable)
 * - Custom error types
 */

const {
  withRetry,
  isRetryable,
  QwenAuthError,
  QwenAPIError,
  SessionError,
  ValidationError
} = require('../../src/utils/retry-handler');

describe('retry-handler', () => {
  describe('Custom Error Classes', () => {
    test('QwenAuthError has correct properties', () => {
      const error = new QwenAuthError('Invalid credentials');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('QwenAuthError');
      expect(error.message).toBe('Invalid credentials');
      expect(error.type).toBe('authentication_error');
      expect(error.statusCode).toBe(401);
    });

    test('QwenAPIError has correct properties', () => {
      const error = new QwenAPIError('API error', 502);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('QwenAPIError');
      expect(error.message).toBe('API error');
      expect(error.type).toBe('api_error');
      expect(error.statusCode).toBe(502);
    });

    test('SessionError has correct properties', () => {
      const error = new SessionError('Invalid parent_id');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SessionError');
      expect(error.message).toBe('Invalid parent_id');
      expect(error.type).toBe('session_error');
      expect(error.statusCode).toBe(500);
    });

    test('ValidationError has correct properties', () => {
      const error = new ValidationError('Invalid request');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid request');
      expect(error.type).toBe('invalid_request_error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('isRetryable', () => {
    test('network errors are retryable', () => {
      const networkErrors = [
        { code: 'ECONNRESET' },
        { code: 'ETIMEDOUT' },
        { code: 'ENOTFOUND' },
        { code: 'ECONNREFUSED' },
        { code: 'EHOSTUNREACH' }
      ];

      networkErrors.forEach(error => {
        expect(isRetryable(error)).toBe(true);
      });
    });

    test('5xx errors are retryable', () => {
      const error = {
        response: { status: 500 }
      };

      expect(isRetryable(error)).toBe(true);

      error.response.status = 502;
      expect(isRetryable(error)).toBe(true);

      error.response.status = 503;
      expect(isRetryable(error)).toBe(true);
    });

    test('408 and 429 are retryable', () => {
      expect(isRetryable({ response: { status: 408 } })).toBe(true);
      expect(isRetryable({ response: { status: 429 } })).toBe(true);
    });

    test('auth errors are not retryable', () => {
      const error = new QwenAuthError('Invalid credentials');
      expect(isRetryable(error)).toBe(false);
    });

    test('validation errors are not retryable', () => {
      const error = new ValidationError('Invalid request');
      expect(isRetryable(error)).toBe(false);
    });

    test('session errors are not retryable', () => {
      const error = new SessionError('Invalid parent_id');
      expect(isRetryable(error)).toBe(false);
    });

    test('4xx errors (except 408, 429) are not retryable', () => {
      expect(isRetryable({ response: { status: 400 } })).toBe(false);
      expect(isRetryable({ response: { status: 401 } })).toBe(false);
      expect(isRetryable({ response: { status: 404 } })).toBe(false);
    });
  });

  describe('withRetry', () => {
    test('succeeds on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries on retryable error and succeeds', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 3, initialDelay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('fails after max retries', async () => {
      const fn = jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' });

      await expect(
        withRetry(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toEqual({ code: 'ETIMEDOUT' });

      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    test('does not retry non-retryable errors', async () => {
      const error = new ValidationError('Invalid request');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow(ValidationError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('calls onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await withRetry(fn, {
        maxRetries: 2,
        initialDelay: 10,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        { code: 'ECONNRESET' },
        10
      );
    });

    test('uses exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await withRetry(fn, {
        maxRetries: 3,
        initialDelay: 100,
        onRetry
      });

      // First retry: 100ms, second retry: 200ms
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Object), 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Object), 200);
    });

    test('respects maxDelay', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await withRetry(fn, {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 2000,
        onRetry
      });

      // Delays: 1000, 2000 (capped), 2000 (capped)
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Object), 1000);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Object), 2000);
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Object), 2000);
    });
  });
});
