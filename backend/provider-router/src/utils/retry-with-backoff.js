/**
 * Retry with Exponential Backoff
 *
 * Phase 10 of Qwen Implementation Plan
 * Provides retry logic with exponential backoff and jitter for handling
 * transient failures such as network errors, rate limits, and server errors.
 */

import { logger } from './logger.js';

/**
 * Retry function with exponential backoff
 *
 * Retries a function on failure using exponential backoff with optional jitter.
 * Supports custom retry predicates and callbacks.
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
 * @param {number} [options.maxDelay=10000] - Maximum delay in milliseconds
 * @param {number} [options.backoffFactor=2] - Exponential backoff multiplier
 * @param {boolean} [options.jitter=true] - Add randomness to delay (0.5-1.0x)
 * @param {Function} [options.shouldRetry] - Custom retry predicate function
 * @param {Function} [options.onRetry] - Callback invoked on each retry
 * @returns {Promise} Result of fn
 * @throws {Error} Last error if all retries exhausted
 *
 * @example
 * const result = await retryWithBackoff(async () => {
 *   return await someApiCall();
 * }, {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 *   shouldRetry: (error) => error.response?.status === 429
 * });
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    jitter = true,
    shouldRetry = defaultShouldRetry,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with jitter
      // Jitter adds randomness between 0.5x and 1.0x of the delay
      const actualDelay = jitter
        ? delay * (0.5 + Math.random() * 0.5)
        : delay;

      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay: Math.round(actualDelay),
        error: error.message,
        status: error.response?.status,
        code: error.code
      });

      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, actualDelay);
      }

      // Wait before retry
      await sleep(actualDelay);

      // Increase delay for next attempt (exponential backoff)
      // Cap at maxDelay to prevent excessive wait times
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Default retry predicate
 *
 * Determines whether to retry based on the error type:
 * - Retries on network errors (ECONNREFUSED, ETIMEDOUT)
 * - Retries on rate limits (429) and server errors (503, 504)
 * - Does NOT retry on client errors (4xx except 429)
 * - Retries on other server errors (5xx)
 *
 * @param {Error} error - Error to check
 * @returns {boolean} True if should retry
 */
function defaultShouldRetry(error) {
  // Retry on network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on rate limits and server errors
  const status = error.response?.status;
  if (status === 429 || status === 503 || status === 504) {
    return true;
  }

  // Don't retry on client errors (except 429)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry on server errors
  if (status >= 500) {
    return true;
  }

  return false;
}

/**
 * Sleep helper
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after ms milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
