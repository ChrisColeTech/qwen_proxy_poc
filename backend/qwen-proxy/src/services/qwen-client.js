/**
 * QwenClient - Low-level HTTP client for Qwen API
 * Part of Phase 5: Qwen API Client with Real Endpoint Calls
 *
 * Provides direct access to Qwen API endpoints:
 * - GET /api/models - List available models
 * - POST /api/v2/chats/new - Create new chat session
 * - POST /api/v2/chat/completions - Send messages (streaming/non-streaming)
 *
 * Based on payload documentation in /docs/payloads/
 */

const axios = require('axios');
const config = require('../config');
const auth = require('../api/qwen-auth');
const errorLogger = require('./error-logger');

/**
 * Custom error for Qwen API failures
 */
class QwenAPIError extends Error {
  constructor(message, statusCode = null, originalError = null) {
    super(message);
    this.name = 'QwenAPIError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * QwenClient class for making HTTP requests to Qwen API
 * Handles authentication, error handling, and retry logic
 */
class QwenClient {
  constructor(authService = auth, clientConfig = config) {
    this.auth = authService;
    this.config = clientConfig;
    this.baseURL = clientConfig.qwen.baseURL;
    this.timeout = clientConfig.qwen.timeout;

    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': this.auth.getUserAgent(),
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (requestConfig) => {
        if (this.config.logging.level === 'debug') {
          console.log(`[QwenClient] ${requestConfig.method.toUpperCase()} ${requestConfig.url}`);
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(this._handleError(error));
      }
    );
  }

  /**
   * GET /api/models - Retrieve list of available models
   * CRITICAL: This MUST call the REAL API, NOT return hardcoded data
   *
   * Based on: /docs/payloads/models/request.sh and response.json
   *
   * @returns {Promise<Object>} Response with models list
   * @example
   * const response = await client.getModels();
   * // Returns: { data: [{ id: "qwen3-max", name: "Qwen3-Max", ... }] }
   */
  async getModels() {
    try {
      const headers = this._getHeaders();
      // Models endpoint only needs Cookie header, not bx-umidtoken
      delete headers['bx-umidtoken'];

      const response = await this.axiosInstance.get('/api/models', {
        headers,
      });

      // Response format: { data: [ { id, name, object, owned_by, info: {...} } ] }
      return response.data;
    } catch (error) {
      // Log API error
      const transformedError = this._handleError(error, 'Failed to fetch models from Qwen API');
      errorLogger.logApiError(transformedError, '/api/models', {}, {
        error_type: 'api_error',
        severity: this._determineSeverity(transformedError),
      });

      throw transformedError;
    }
  }

  /**
   * POST /api/v2/chats/new - Create a new chat session
   *
   * Based on: /docs/payloads/new_chat/request.sh and response.json
   *
   * @param {string} title - Chat title (default: "New Chat")
   * @param {string[]} models - Model IDs to use (default: ["qwen3-max"])
   * @param {string} chatMode - Chat mode (default: "guest")
   * @param {string} chatType - Chat type (default: "t2t")
   * @returns {Promise<string>} The created chat_id
   * @example
   * const chatId = await client.createNewChat("My Chat", ["qwen3-max"]);
   */
  async createNewChat(
    title = 'New Chat',
    models = ['qwen3-max'],
    chatMode = 'guest',
    chatType = 't2t'
  ) {
    try {
      const headers = this._getHeaders();

      // Payload must match /docs/payloads/new_chat/request.sh exactly
      const payload = {
        title,
        models,
        chat_mode: chatMode,
        chat_type: chatType,
        timestamp: Date.now(), // MILLISECONDS (not seconds)
      };

      const response = await this.axiosInstance.post('/api/v2/chats/new', payload, {
        headers,
      });

      // DEBUG: Log the actual response
      console.log('[DEBUG] Qwen API response type:', typeof response.data);
      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response data (first 500 chars):',
        typeof response.data === 'string'
          ? response.data.substring(0, 500)
          : JSON.stringify(response.data).substring(0, 500)
      );

      // Response format: { success: true, request_id: "...", data: { id: "chat-id" } }
      if (!response.data.success || !response.data.data?.id) {
        console.log('[DEBUG] Full response.data:', response.data);
        throw new QwenAPIError(
          'Invalid response from create chat endpoint: missing chat ID',
          response.status
        );
      }

      return response.data.data.id;
    } catch (error) {
      // Log API error
      const transformedError = this._handleError(error, 'Failed to create new chat');
      errorLogger.logApiError(transformedError, '/api/v2/chats/new', { title, models, chat_mode: chatMode, chat_type: chatType }, {
        error_type: 'api_error',
        severity: this._determineSeverity(transformedError),
      });

      throw transformedError;
    }
  }

  /**
   * POST /api/v2/chat/completions - Send message and receive completion
   *
   * Based on: /docs/payloads/completion/request.sh and response.json
   * Streaming: /docs/payloads/completion/streaming_request.sh and streaming_response.md
   *
   * @param {Object} qwenPayload - Complete Qwen request payload (already transformed)
   * @param {Object} options - Request options
   * @param {boolean} options.stream - Whether to stream the response (default: true)
   * @returns {Promise<Object>} Response object (or Stream if streaming)
   * @example
   * // Non-streaming
   * const response = await client.sendMessage(qwenPayload, { stream: false });
   *
   * // Streaming
   * const stream = await client.sendMessage(qwenPayload, { stream: true });
   * stream.data.on('data', (chunk) => { ... });
   */
  async sendMessage(qwenPayload, options = {}) {
    const { stream = true } = options;

    try {
      const headers = this._getHeaders();
      const chatId = qwenPayload.chat_id;

      if (!chatId) {
        throw new QwenAPIError('Missing chat_id in payload', 400);
      }

      // URL includes chat_id as query parameter
      const url = `/api/v2/chat/completions?chat_id=${chatId}`;

      const requestConfig = {
        headers,
      };

      // Qwen returns different formats for streaming vs non-streaming:
      // - Streaming: SSE format (Server-Sent Events)
      // - Non-streaming: Plain JSON with format: {success, request_id, data: {...}}
      if (stream) {
        requestConfig.responseType = 'stream';
        const response = await this.axiosInstance.post(url, qwenPayload, requestConfig);
        return response;
      } else {
        // For non-streaming, extract the 'data' field from the JSON response
        const response = await this.axiosInstance.post(url, qwenPayload, requestConfig);

        // Qwen returns: {success: bool, request_id: string, data: {actual response}}
        // We need to extract and return just the 'data' field
        if (response.data && response.data.success && response.data.data) {
          return {
            ...response,
            data: response.data.data
          };
        }

        // If format is unexpected, log warning and return as-is
        console.warn('[QwenClient] Unexpected response format:', JSON.stringify(response.data).substring(0, 200));
        return response;
      }
    } catch (error) {
      // Log API error
      const transformedError = this._handleError(error, 'Failed to send message to Qwen API');
      errorLogger.logApiError(transformedError, '/api/v2/chat/completions', qwenPayload, {
        error_type: 'api_error',
        severity: this._determineSeverity(transformedError),
      });

      throw transformedError;
    }
  }

  /**
   * Parse SSE (Server-Sent Events) response data into structured format
   * Qwen returns SSE format even for non-streaming requests
   *
   * @param {string} sseData - Raw SSE data string
   * @returns {Object} Parsed response with choices, parent_id, message_id, and usage
   * @private
   */
  _parseSSEResponse(sseData) {
    const lines = sseData.split('\n');
    let content = '';
    let parentId = null;
    let messageId = null;
    let usage = null;

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const dataStr = line.substring(6).trim();
      if (!dataStr) continue;

      try {
        const data = JSON.parse(dataStr);

        // Extract parent_id and message_id from response.created
        if (data['response.created']) {
          parentId = data['response.created'].parent_id;
          messageId = data['response.created'].response_id;
        }

        // Extract content from choices
        if (data.choices && data.choices[0] && data.choices[0].delta) {
          const delta = data.choices[0].delta;
          if (delta.content) {
            content += delta.content;
          }

          // Update usage info (take the latest one)
          if (data.usage) {
            usage = data.usage;
          }
        }
      } catch (e) {
        // Skip lines that aren't valid JSON
        continue;
      }
    }

    // Return in Qwen's expected response format
    return {
      parent_id: parentId,
      message_id: messageId,
      choices: [
        {
          message: {
            role: 'assistant',
            content: content
          }
        }
      ],
      usage: usage
    };
  }

  /**
   * Get headers for Qwen API requests
   * Includes authentication credentials from auth service
   *
   * @returns {Object} Headers object
   * @private
   */
  _getHeaders() {
    return this.auth.getHeaders();
  }

  /**
   * Handle and transform errors from Qwen API
   * Converts axios errors to QwenAPIError with friendly messages
   *
   * @param {Error} error - Original error
   * @param {string} context - Additional context for error message
   * @returns {QwenAPIError} Transformed error
   * @private
   */
  _handleError(error, context = 'Qwen API request failed') {
    // If already a QwenAPIError, return as-is
    if (error instanceof QwenAPIError) {
      return error;
    }

    // Network errors (no response)
    if (error.code === 'ECONNREFUSED') {
      return new QwenAPIError(
        `${context}: Unable to connect to Qwen API at ${this.baseURL}. Please check your network connection.`,
        null,
        error
      );
    }

    if (error.code === 'ENOTFOUND') {
      return new QwenAPIError(
        `${context}: Cannot resolve Qwen API hostname. Please check your internet connection.`,
        null,
        error
      );
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return new QwenAPIError(
        `${context}: Request timed out after ${this.timeout}ms.`,
        null,
        error
      );
    }

    // HTTP errors (with response)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return new QwenAPIError(
            `${context}: Authentication failed. Please check your QWEN_TOKEN and QWEN_COOKIES.`,
            401,
            error
          );

        case 403:
          return new QwenAPIError(
            `${context}: Access forbidden. Your credentials may be invalid or expired.`,
            403,
            error
          );

        case 404:
          return new QwenAPIError(
            `${context}: Endpoint not found. The API may have changed.`,
            404,
            error
          );

        case 429:
          return new QwenAPIError(
            `${context}: Rate limit exceeded. Please try again later.`,
            429,
            error
          );

        case 500:
        case 502:
        case 503:
        case 504:
          return new QwenAPIError(
            `${context}: Qwen API server error (${status}). Please try again later.`,
            status,
            error
          );

        default:
          const errorMsg = data?.message || data?.error || error.message;
          return new QwenAPIError(
            `${context}: HTTP ${status} - ${errorMsg}`,
            status,
            error
          );
      }
    }

    // Generic error
    return new QwenAPIError(
      `${context}: ${error.message}`,
      null,
      error
    );
  }

  /**
   * Determine error severity for logging
   * Used by error logger to classify errors
   *
   * @param {Error} error - Error to classify
   * @returns {string} Severity level: 'critical', 'error', or 'warning'
   * @private
   */
  _determineSeverity(error) {
    if (!(error instanceof QwenAPIError)) {
      return 'error';
    }

    // Auth errors are critical (config issue)
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'critical';
    }

    // Rate limiting is a warning (expected, will retry)
    if (error.statusCode === 429) {
      return 'warning';
    }

    // Server errors are errors
    if (error.statusCode >= 500) {
      return 'error';
    }

    // Network errors (timeouts, connection issues) are errors
    if (!error.statusCode) {
      return 'error';
    }

    // Default to error
    return 'error';
  }

  /**
   * Check if an error should be retried
   * Don't retry auth errors (401, 403) or client errors (4xx)
   * Retry network errors and server errors (5xx)
   *
   * @param {Error} error - Error to check
   * @returns {boolean} True if error should be retried
   */
  static shouldRetry(error) {
    // Don't retry non-QwenAPIError
    if (!(error instanceof QwenAPIError)) {
      return false;
    }

    // Don't retry auth errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      return false;
    }

    // Don't retry client errors (4xx except 429)
    if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      return false;
    }

    // Retry network errors (no status code)
    if (!error.statusCode) {
      return true;
    }

    // Retry rate limiting and server errors (429, 5xx)
    if (error.statusCode === 429 || error.statusCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Execute a function with retry logic
   * Uses exponential backoff from config
   *
   * @param {Function} fn - Async function to execute
   * @param {Object} retryConfig - Retry configuration (optional)
   * @returns {Promise<any>} Result of function
   */
  async withRetry(fn, retryConfig = null) {
    const cfg = retryConfig || this.config.retry;
    const { maxRetries, baseDelay, maxDelay } = cfg;

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (!QwenClient.shouldRetry(error)) {
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt >= maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        if (this.config.logging.level === 'debug' || this.config.logging.level === 'info') {
          console.log(
            `[QwenClient] Retry ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${error.message}`
          );
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }

    // All retries exhausted - log final failure
    errorLogger.logApiError(lastError, 'retry-exhausted', {}, {
      error_type: 'api_error',
      severity: 'error',
      notes: `Failed after ${maxRetries} retries`,
    });

    throw lastError;
  }
}

// Export class and error
module.exports = QwenClient;
module.exports.QwenAPIError = QwenAPIError;
