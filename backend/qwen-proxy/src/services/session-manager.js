/**
 * Database-Backed Session Manager
 *
 * Manages session state using SQLite database instead of in-memory Map.
 * Maintains same API as original for drop-in replacement.
 *
 * CRITICAL DESIGN:
 * - Session ID = MD5 hash of first user message content
 * - parent_id starts as null for first message
 * - parent_id updated from response.parent_id after each message
 * - Sessions expire after configurable timeout
 * - Automatic cleanup of expired sessions
 * - Data persists across server restarts
 */

const { generateMD5Hash } = require('../utils/hash-utils');
const SessionRepository = require('../database/repositories/session-repository');

class SessionManager {
  /**
   * Create a new SessionManager
   *
   * @param {Object} config - Configuration options
   * @param {number} config.timeout - Session inactivity timeout in milliseconds (default: 30 min)
   * @param {number} config.cleanupInterval - Cleanup interval in milliseconds (default: 10 min)
   */
  constructor(config = {}) {
    // Database repository for session persistence
    this.repo = new SessionRepository();

    // Configuration
    this.timeout = config.timeout || 30 * 60 * 1000; // 30 minutes default
    this.cleanupInterval = config.cleanupInterval || 10 * 60 * 1000; // 10 minutes default

    // Cleanup timer
    this.cleanupTimer = null;

    // Track cleanup count in memory (for metrics)
    this.totalCleaned = 0;
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
   * @param {string} firstUserMessage - First user message content (for conversation hash)
   * @returns {Object} Created session object
   *
   * @example
   * const session = manager.createSession('abc123', 'chat-uuid', 'Hello!');
   * // session = { chatId: 'chat-uuid', parent_id: null, parentId: null, ... }
   */
  createSession(sessionId, chatId = null, firstUserMessage = null) {
    // Allow any truthy value or empty string
    if (sessionId === null || sessionId === undefined) {
      throw new Error('Session ID is required');
    }

    // Use provided message or create placeholder
    const userMessage = firstUserMessage || 'session-' + sessionId.substring(0, 8);

    // Create session in database
    this.repo.createSession(sessionId, chatId, userMessage, this.timeout);

    // Get the created session
    const session = this.repo.getSession(sessionId);

    // Return in format matching old API
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      parentId: session.parent_id,  // Alias for compatibility
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
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

    const session = this.repo.getSession(sessionId);

    if (!session) {
      return null;
    }

    // Update last accessed time (keep-alive)
    this.repo.touchSession(sessionId, this.timeout);

    // Return in format matching old API
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      parentId: session.parent_id,  // Alias for compatibility
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
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
    const session = this.repo.getSession(sessionId);

    if (!session) {
      return false;
    }

    this.repo.updateParentId(sessionId, parent_id);
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
    const session = this.repo.getSession(sessionId);

    if (!session) {
      return false;
    }

    this.repo.update(sessionId, { chat_id: chatId });
    return true;
  }

  /**
   * Delete a session
   *
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if deleted
   */
  deleteSession(sessionId) {
    return this.repo.delete(sessionId) > 0;
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
    const session = this.repo.getSession(sessionId);

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
    const cleaned = this.repo.cleanupExpired();
    this.totalCleaned += cleaned;
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
    const metrics = this.repo.getMetrics();

    return {
      activeSessions: metrics.activeSessions,
      totalCreated: metrics.totalSessions,
      totalCleaned: this.totalCleaned
    };
  }

  /**
   * Shutdown session manager
   * Stops cleanup timer (sessions remain in database)
   */
  shutdown() {
    this.stopCleanup();
    // Sessions remain in database (not cleared)
  }

  /**
   * Get all active session IDs (for debugging)
   *
   * @returns {string[]} Array of session IDs
   */
  getActiveSessions() {
    const sessions = this.repo.findAll({}, 'created_at DESC');
    return sessions.map(s => s.id);
  }

  /**
   * Get session count (for debugging)
   *
   * @returns {number} Number of active sessions
   */
  getSessionCount() {
    return this.repo.count();
  }

  /**
   * Get all sessions as array of [sessionId, session] tuples
   * Used for iteration and debugging
   *
   * @returns {Array} Array of [sessionId, session] tuples
   */
  getAllSessions() {
    const sessions = this.repo.findAll({}, 'created_at DESC');

    return sessions.map(session => [
      session.id,
      {
        sessionId: session.id,
        chatId: session.chat_id,
        parent_id: session.parent_id,
        parentId: session.parent_id,
        createdAt: session.created_at,
        lastAccessed: session.last_accessed,
        messageCount: session.message_count
      }
    ]);
  }

  /**
   * Clear all sessions
   * Used for cleanup and testing
   */
  clearAll() {
    const stmt = this.repo.db.prepare('DELETE FROM sessions');
    stmt.run();
  }

  /**
   * Find session by conversation hash
   * Used for conversation continuations
   *
   * @param {string} conversationHash - MD5 hash of (firstUser + firstAssistant)
   * @returns {Object|null} Session object or null
   */
  findSessionByConversationHash(conversationHash) {
    console.log('[SessionManager] findSessionByConversationHash called with hash:', conversationHash);

    try {
      const session = this.repo.findByConversationHash(conversationHash);
      console.log('[SessionManager] repo.findByConversationHash returned:', session ? 'session found' : 'null');

      if (!session) {
        return null;
      }

      // Update last accessed time (keep-alive)
      this.repo.touchSession(session.id, this.timeout);

      // Return in format matching old API
      const result = {
        sessionId: session.id,
        chatId: session.chat_id,
        parent_id: session.parent_id,
        parentId: session.parent_id,
        createdAt: session.created_at,
        lastAccessed: session.last_accessed,
        messageCount: session.message_count
      };

      console.log('[SessionManager] Returning session:', result.sessionId);
      return result;
    } catch (error) {
      console.error('[SessionManager] Error in findSessionByConversationHash:', error);
      throw error;
    }
  }

  /**
   * Set conversation hash for a session
   * Called after first assistant response is received
   *
   * @param {string} sessionId - Session identifier
   * @param {string} firstAssistantMessage - First assistant response content
   * @returns {boolean} True if updated successfully
   */
  setConversationHash(sessionId, firstAssistantMessage) {
    const session = this.repo.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Compute conversation hash: MD5(firstUser + firstAssistant)
    const conversationKey = session.first_user_message + firstAssistantMessage;
    const conversationHash = generateMD5Hash(conversationKey);

    // Store the hash
    this.repo.setConversationHash(sessionId, conversationHash);

    console.log(`[SessionManager] Set conversation hash for session ${sessionId}: ${conversationHash}`);

    return true;
  }
}

module.exports = SessionManager;
