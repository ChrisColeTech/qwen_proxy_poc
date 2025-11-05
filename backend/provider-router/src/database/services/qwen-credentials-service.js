/**
 * Qwen Credentials Service
 * Manages Qwen API credentials in database
 */

import { getDatabase } from '../connection.js';
import { logger } from '../../utils/logger.js';

class QwenCredentialsService {
  /**
   * Get current valid credentials
   * @returns {Object|null} { id, token, cookies, expires_at, created_at, updated_at }
   */
  static getCredentials() {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    try {
      const stmt = db.prepare(`
        SELECT * FROM qwen_credentials
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const credentials = stmt.get(now);

      if (credentials) {
        logger.debug('Retrieved Qwen credentials from database', {
          id: credentials.id,
          hasToken: !!credentials.token,
          hasCookies: !!credentials.cookies,
          expiresAt: credentials.expires_at
        });
      }

      return credentials;
    } catch (error) {
      logger.error('Failed to get Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Set new credentials (replaces existing)
   * @param {string} token - bx-umidtoken value
   * @param {string} cookies - Cookie header value
   * @param {number} [expiresAt] - Optional expiry timestamp
   * @returns {number} The ID of the inserted credentials
   */
  static setCredentials(token, cookies, expiresAt = null) {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    try {
      // Delete old credentials first
      const deleteStmt = db.prepare('DELETE FROM qwen_credentials');
      deleteStmt.run();

      // Insert new credentials
      const insertStmt = db.prepare(`
        INSERT INTO qwen_credentials (token, cookies, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(token, cookies, expiresAt, now, now);

      logger.info('Qwen credentials stored in database', {
        id: result.lastInsertRowid,
        expiresAt
      });

      return result.lastInsertRowid;
    } catch (error) {
      logger.error('Failed to set Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Update existing credentials
   * @param {string} token - bx-umidtoken value
   * @param {string} cookies - Cookie header value
   * @param {number} [expiresAt] - Optional expiry timestamp
   */
  static updateCredentials(token, cookies, expiresAt = null) {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    try {
      const stmt = db.prepare(`
        UPDATE qwen_credentials
        SET token = ?, cookies = ?, expires_at = ?, updated_at = ?
        WHERE id = (SELECT id FROM qwen_credentials ORDER BY created_at DESC LIMIT 1)
      `);

      const result = stmt.run(token, cookies, expiresAt, now);

      logger.info('Qwen credentials updated', {
        changes: result.changes,
        expiresAt
      });

      return result.changes > 0;
    } catch (error) {
      logger.error('Failed to update Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if valid credentials exist
   * @returns {boolean}
   */
  static isValid() {
    const credentials = this.getCredentials();
    return credentials && credentials.token && credentials.cookies;
  }

  /**
   * Delete all credentials
   */
  static deleteCredentials() {
    const db = getDatabase();

    try {
      const stmt = db.prepare('DELETE FROM qwen_credentials');
      const result = stmt.run();

      logger.info('Qwen credentials deleted', {
        deleted: result.changes
      });

      return result.changes;
    } catch (error) {
      logger.error('Failed to delete Qwen credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Get headers for Qwen API requests
   * @returns {Object} Headers object with token and cookies
   * @throws {Error} If credentials are not valid
   */
  static getHeaders() {
    const credentials = this.getCredentials();

    if (!credentials || !credentials.token || !credentials.cookies) {
      throw new Error('Qwen credentials not found or expired');
    }

    return {
      'bx-umidtoken': credentials.token,
      'Cookie': credentials.cookies,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }
}

export { QwenCredentialsService };
