/**
 * QwenAuth - Authentication Manager
 * Part of Phase 2: Authentication Module
 *
 * Manages Qwen API credentials and generates request headers
 * Based on payload documentation in /docs/payloads/
 *
 * UPDATED: Now reads credentials from centralized database instead of .env
 * This allows credentials to be configured through the dashboard UI
 */

const config = require('../config');
const QwenCredentialsService = require('../services/qwen-credentials-service');

/**
 * Custom error for authentication failures
 */
class QwenAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QwenAuthError';
  }
}

/**
 * QwenAuth class for managing authentication credentials
 * Provides headers for Qwen API requests
 *
 * NOTE: Credentials are read from database on-demand, not cached
 * This allows credentials to be updated through the dashboard without server restart
 */
class QwenAuth {
  constructor() {
    this.userAgent = process.env.USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // No longer validate credentials on construction
    // Server should start successfully even without credentials
    // Credentials will be checked when needed (on API requests)
    console.log('[QwenAuth] Initialized (credentials will be loaded from database on-demand)');
  }

  /**
   * Get current credentials from database or .env fallback
   * @returns {Object|null} { token, cookies } or null if not available
   * @private
   */
  _getCredentials() {
    // Try database first
    const dbCredentials = QwenCredentialsService.getCredentials();
    if (dbCredentials && dbCredentials.token && dbCredentials.cookies) {
      return {
        token: dbCredentials.token,
        cookies: dbCredentials.cookies,
        source: 'database'
      };
    }

    // Fallback to .env if set
    if (config.qwen.token && config.qwen.cookies) {
      return {
        token: config.qwen.token,
        cookies: config.qwen.cookies,
        source: 'environment'
      };
    }

    return null;
  }

  /**
   * Check if credentials are valid (both token and cookies present)
   * @returns {boolean} True if credentials are valid
   */
  isValid() {
    const credentials = this._getCredentials();
    return !!credentials;
  }

  /**
   * Get authentication headers for Qwen API requests
   * Based on requirements from:
   * - /docs/payloads/models/request.sh (needs Cookie)
   * - /docs/payloads/new_chat/request.sh (needs bx-umidtoken, Cookie)
   * - /docs/payloads/completion/request.sh (needs bx-umidtoken, Cookie)
   *
   * @returns {Object} Headers object for axios/fetch requests
   * @throws {QwenAuthError} If credentials are not configured
   */
  getHeaders() {
    const credentials = this._getCredentials();

    if (!credentials) {
      throw new QwenAuthError(
        'Qwen credentials not configured. Please configure credentials through the Electron app Settings.'
      );
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };
  }

  /**
   * Get safe preview of token for logging (first 20 chars only)
   * Never log full credentials
   * @returns {string} Safe token preview
   */
  getTokenPreview() {
    const credentials = this._getCredentials();
    if (!credentials) return '[NOT SET]';
    return credentials.token.substring(0, 20) + '...';
  }

  /**
   * Get safe preview of cookies for logging
   * @returns {string} Safe cookie preview
   */
  getCookiePreview() {
    const credentials = this._getCredentials();
    if (!credentials) return '[NOT SET]';
    // Show only first cookie name
    const firstCookie = credentials.cookies.split(';')[0].split('=')[0];
    return `${firstCookie}=...`;
  }

  /**
   * Get credentials info for debugging (safe for logging)
   * @returns {Object} Safe credential info
   */
  getInfo() {
    const credentials = this._getCredentials();
    return {
      tokenPreview: this.getTokenPreview(),
      cookiePreview: this.getCookiePreview(),
      isValid: this.isValid(),
      userAgent: this.userAgent,
      source: credentials ? credentials.source : 'none',
    };
  }

  /**
   * Get the raw token (use with caution)
   * @returns {string|null} The bx-umidtoken value or null if not set
   */
  getToken() {
    const credentials = this._getCredentials();
    return credentials ? credentials.token : null;
  }

  /**
   * Get the raw cookies (use with caution)
   * @returns {string|null} The Cookie header value or null if not set
   */
  getCookies() {
    const credentials = this._getCredentials();
    return credentials ? credentials.cookies : null;
  }

  /**
   * Get the User-Agent string
   * @returns {string} The User-Agent header value
   */
  getUserAgent() {
    return this.userAgent;
  }
}

// Export singleton instance
const authInstance = new QwenAuth();

module.exports = authInstance;
module.exports.QwenAuth = QwenAuth;
module.exports.QwenAuthError = QwenAuthError;
