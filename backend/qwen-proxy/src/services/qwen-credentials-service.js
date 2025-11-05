/**
 * Qwen Credentials Service
 * Manages Qwen API credentials from centralized database
 *
 * This service reads credentials from the provider-router's centralized database
 * instead of environment variables, allowing credentials to be configured through
 * the dashboard UI without requiring .env files or server restarts.
 */

const { getDatabase } = require('../database');

class QwenCredentialsService {
  /**
   * Get current valid credentials from database
   * @returns {Object|null} { id, token, cookies, expires_at, created_at, updated_at }
   */
  static getCredentials() {
    try {
      const db = getDatabase();
      const now = Math.floor(Date.now() / 1000);

      const stmt = db.prepare(`
        SELECT * FROM qwen_credentials
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const credentials = stmt.get(now);

      if (credentials) {
        console.log('[QwenCredentials] Retrieved credentials from database', {
          id: credentials.id,
          hasToken: !!credentials.token,
          hasCookies: !!credentials.cookies,
          expiresAt: credentials.expires_at
        });
      } else {
        console.log('[QwenCredentials] No valid credentials found in database');
      }

      return credentials;
    } catch (error) {
      // If table doesn't exist yet, return null gracefully
      if (error.message.includes('no such table')) {
        console.log('[QwenCredentials] qwen_credentials table does not exist yet');
        return null;
      }
      console.error('[QwenCredentials] Failed to get credentials:', error.message);
      throw error;
    }
  }

  /**
   * Check if valid credentials exist
   * @returns {boolean}
   */
  static isValid() {
    try {
      const credentials = this.getCredentials();
      return credentials && credentials.token && credentials.cookies;
    } catch (error) {
      console.error('[QwenCredentials] Error checking validity:', error.message);
      return false;
    }
  }

  /**
   * Get headers for Qwen API requests
   * @returns {Object|null} Headers object with token and cookies, or null if not configured
   */
  static getHeaders() {
    const credentials = this.getCredentials();

    if (!credentials || !credentials.token || !credentials.cookies) {
      return null;
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }

  /**
   * Get safe preview of token for logging (first 20 chars only)
   * @returns {string} Safe token preview
   */
  static getTokenPreview() {
    const credentials = this.getCredentials();
    if (!credentials || !credentials.token) return '[NOT SET]';
    return credentials.token.substring(0, 20) + '...';
  }

  /**
   * Get safe preview of cookies for logging
   * @returns {string} Safe cookie preview
   */
  static getCookiePreview() {
    const credentials = this.getCredentials();
    if (!credentials || !credentials.cookies) return '[NOT SET]';
    // Show only first cookie name
    const firstCookie = credentials.cookies.split(';')[0].split('=')[0];
    return `${firstCookie}=...`;
  }

  /**
   * Get credentials info for debugging (safe for logging)
   * @returns {Object} Safe credential info
   */
  static getInfo() {
    return {
      tokenPreview: this.getTokenPreview(),
      cookiePreview: this.getCookiePreview(),
      isValid: this.isValid(),
      source: 'database'
    };
  }
}

module.exports = QwenCredentialsService;
