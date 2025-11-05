/**
 * Session Manager
 *
 * Manages session state for multi-turn conversations with Qwen API.
 * Implements parent_id chain logic for context preservation.
 *
 * Part of Phase 4: Session Manager with parent_id Chain Logic
 *
 * CRITICAL DESIGN:
 * - Session ID = MD5 hash of first user message content
 * - parent_id starts as null for first message
 * - parent_id updated from response.parent_id after each message
 * - Sessions expire after configurable timeout
 * - Automatic cleanup of expired sessions
 */

const crypto = require('crypto');
const { generateMD5Hash } = require('../utils/hash-utils');

class SessionManager {
  /**
   * Create a new SessionManager
   *
   * @param {Object} config - Configuration options
   * @param {number} config.timeout - Session inactivity timeout in milliseconds (default: 30 min)
   * @param {number} config.cleanupInterval - Cleanup interval in milliseconds (default: 10 min)
   */
  constructor(config = {}) {
    // Session storage: Map<sessionId, sessionData>
    this.sessions = new Map();

    // Configuration
    this.timeout = config.timeout || 30 * 60 * 1000; // 30 minutes default
    this.cleanupInterval = config.cleanupInterval || 10 * 60 * 1000; // 10 minutes default

    // Metrics
    this.metrics = {
      totalCreated: 0,
      totalCleaned: 0
    };

    // Cleanup timer
    this.cleanupTimer = null;

    // Thread safety: use locks for concurrent access
    this.locks = new Map();
  }

  /**
   * Generate session ID from first user message
   * Uses MD5 hash to create stable ID across requests
   *
   * @param {string} firstMessage - Content of first user message
   * @returns {string} Session ID (MD5 hash)
   *
   * @example
   * generateSessionId("Hello, how are you?")
   * // Returns: "abc123..." (MD5 hash)
   */
  generateSessionId(firstMessage) {
    if (!firstMessage || typeof firstMessage !== 'string') {
      throw new Error('First message must be a non-empty string');
    }

    return generateMD5Hash(firstMessage);
  }

  /**
   * Create a new session
   *
   * @param {string} sessionId - Session identifier (conversationId)
   * @param {string} chatId - Qwen chat ID (optional, can be set later)
   * @returns {Object} Created session object
   *
   * @example
   * const session = manager.createSession('abc123', 'chat-uuid');
   * // session = { chatId: 'chat-uuid', parent_id: null, parentId: null, ... }
   */
  createSession(sessionId, chatId = null) {
    // Allow any truthy value or empty string
    if (sessionId === null || sessionId === undefined) {
      throw new Error('Session ID is required');
    }

    const now = Date.now();

    const session = {
      sessionId,
      chatId,
      parent_id: null, // CRITICAL: First message has null parent_id (Qwen format)
      parentId: null,  // Also provide camelCase for compatibility
      createdAt: now,
      lastAccessed: now,
      messageCount: 0
    };

    this.sessions.set(sessionId, session);
    this.metrics.totalCreated++;

    return session;
  }

  /**
   * Get an existing session
   *
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session object or null if not found
   */
  getSession(sessionId) {
    // Allow empty string, but not null/undefined
    if (sessionId === null || sessionId === undefined) {
      return null;
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Date.now();
    const age = now - session.lastAccessed;

    if (age > this.timeout) {
      // Session expired, remove it
      this.deleteSession(sessionId);
      return null;
    }

    // Update last accessed time (keep-alive)
    session.lastAccessed = now;

    return session;
  }

  /**
   * Update session with new parent_id from response
   * CRITICAL: This must be called after each message to maintain context chain
   *
   * @param {string} sessionId - Session identifier (conversationId)
   * @param {string} parent_id - Parent ID from Qwen response
   * @returns {boolean} True if updated successfully
   *
   * @example
   * // After receiving response from Qwen
   * const parent_id = response.data.parent_id;
   * manager.updateSession(sessionId, parent_id);
   */
  updateSession(sessionId, parent_id) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Update parent_id for next message in conversation (both formats)
    session.parent_id = parent_id;
    session.parentId = parent_id;

    // Increment message count
    session.messageCount++;

    // Update last accessed timestamp
    session.lastAccessed = Date.now();

    return true;
  }

  /**
   * Update parent_id using camelCase naming (for compatibility)
   * Alias for updateSession
   *
   * @param {string} sessionId - Session identifier
   * @param {string} parentId - Parent ID from Qwen response
   * @returns {boolean} True if updated successfully
   */
  updateParentId(sessionId, parentId) {
    return this.updateSession(sessionId, parentId);
  }

  /**
   * Set chat ID for a session
   * Used after creating Qwen chat for a new conversation
   *
   * @param {string} sessionId - Session identifier
   * @param {string} chatId - Qwen chat ID
   * @returns {boolean} True if set successfully
   */
  setChatId(sessionId, chatId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.chatId = chatId;
    return true;
  }

  /**
   * Delete a session
   *
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if deleted
   */
  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if session exists and is valid
   *
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if session exists and is not expired
   */
  isNewSession(sessionId) {
    return !this.getSession(sessionId);
  }

  /**
   * Get parent_id for next message in conversation
   * Returns null for first message, UUID for follow-ups
   *
   * @param {string} sessionId - Session identifier
   * @returns {string|null} Parent ID or null
   *
   * @example
   * const parent_id = manager.getParentId(sessionId);
   * // First message: null
   * // Follow-up messages: "uuid-here"
   */
  getParentId(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    return session.parent_id;
  }

  /**
   * Clean up expired sessions
   * Called periodically by cleanup timer
   *
   * @returns {number} Number of sessions cleaned up
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastAccessed;

      if (age > this.timeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    this.metrics.totalCleaned += cleaned;

    return cleaned;
  }

  /**
   * Start automatic cleanup timer
   * Runs cleanup at configured interval
   */
  startCleanup() {
    if (this.cleanupTimer) {
      return; // Already running
    }

    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`);
      }
    }, this.cleanupInterval);

    // Don't keep process alive just for cleanup timer
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop automatic cleanup timer
   * Called during graceful shutdown
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get metrics about session manager
   *
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      activeSessions: this.sessions.size,
      totalCreated: this.metrics.totalCreated,
      totalCleaned: this.metrics.totalCleaned
    };
  }

  /**
   * Shutdown session manager
   * Stops cleanup timer and clears all sessions
   */
  shutdown() {
    this.stopCleanup();
    this.sessions.clear();
  }

  /**
   * Get all active session IDs (for debugging)
   *
   * @returns {string[]} Array of session IDs
   */
  getActiveSessions() {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session count (for debugging)
   *
   * @returns {number} Number of active sessions
   */
  getSessionCount() {
    return this.sessions.size;
  }

  /**
   * Get all sessions as array of [sessionId, session] tuples
   * Used for iteration and debugging
   *
   * @returns {Array} Array of [sessionId, session] tuples
   */
  getAllSessions() {
    return Array.from(this.sessions.entries());
  }

  /**
   * Clear all sessions
   * Used for cleanup and testing
   */
  clearAll() {
    this.sessions.clear();
  }
}

module.exports = SessionManager;
