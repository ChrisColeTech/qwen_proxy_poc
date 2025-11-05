/**
 * Database-Backed Session Manager
 *
 * Manages session state using SQLite database instead of in-memory Map.
 * Maintains same API as original for drop-in replacement.
 */

import { generateMD5Hash } from '../utils/hash-utils.js'
import { SessionRepository } from '../database/repositories/index.js'

class SessionManager {
  /**
   * Create a new SessionManager
   */
  constructor(config = {}) {
    this.repo = new SessionRepository()

    // Configuration
    this.timeout = config.timeout || 30 * 60 * 1000 // 30 minutes default
    this.cleanupInterval = config.cleanupInterval || 10 * 60 * 1000 // 10 minutes default

    // Cleanup timer
    this.cleanupTimer = null
  }

  /**
   * Generate session ID from first user message
   */
  generateSessionId(firstMessage) {
    if (!firstMessage || typeof firstMessage !== 'string') {
      throw new Error('First message must be a non-empty string')
    }

    return generateMD5Hash(firstMessage)
  }

  /**
   * Create a new session
   */
  createSession(sessionId, chatId = null) {
    if (sessionId === null || sessionId === undefined) {
      throw new Error('Session ID is required')
    }

    // Extract first user message from sessionId (for reference only)
    // In practice, we'll need to pass this separately
    const firstUserMessage = 'session-' + sessionId.substring(0, 8)

    this.repo.createSession(sessionId, chatId, firstUserMessage, this.timeout)

    const session = this.repo.getSession(sessionId)

    // Return in format matching old API
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      parentId: session.parent_id, // Alias
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    }
  }

  /**
   * Get an existing session
   */
  getSession(sessionId) {
    if (sessionId === null || sessionId === undefined) {
      return null
    }

    const session = this.repo.getSession(sessionId)

    if (!session) {
      return null
    }

    // Update last accessed time (keep-alive)
    this.repo.touchSession(sessionId, this.timeout)

    // Return in format matching old API
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      parentId: session.parent_id, // Alias
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    }
  }

  /**
   * Update session with new parent_id from response
   */
  updateSession(sessionId, parent_id) {
    const session = this.repo.getSession(sessionId)

    if (!session) {
      return false
    }

    this.repo.updateParentId(sessionId, parent_id)
    return true
  }

  /**
   * Alias for updateSession (camelCase naming)
   */
  updateParentId(sessionId, parentId) {
    return this.updateSession(sessionId, parentId)
  }

  /**
   * Set chat ID for a session
   */
  setChatId(sessionId, chatId) {
    const session = this.repo.getSession(sessionId)

    if (!session) {
      return false
    }

    this.repo.update(sessionId, { chat_id: chatId })
    return true
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId) {
    return this.repo.delete(sessionId) > 0
  }

  /**
   * Check if session exists and is valid
   */
  isNewSession(sessionId) {
    return !this.getSession(sessionId)
  }

  /**
   * Get parent_id for next message in conversation
   */
  getParentId(sessionId) {
    const session = this.repo.getSession(sessionId)

    if (!session) {
      return null
    }

    return session.parent_id
  }

  /**
   * Clean up expired sessions
   */
  cleanup() {
    const cleaned = this.repo.cleanupExpired()
    return cleaned
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanup() {
    if (this.cleanupTimer) {
      return // Already running
    }

    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanup()
      if (cleaned > 0) {
        console.log(`[SessionManager] Cleaned up ${cleaned} expired sessions`)
      }
    }, this.cleanupInterval)

    // Don't keep process alive just for cleanup timer
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * Stop automatic cleanup timer
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * Get metrics about session manager
   */
  getMetrics() {
    const metrics = this.repo.getMetrics()

    return {
      activeSessions: metrics.activeSessions,
      totalCreated: metrics.totalSessions,
      totalCleaned: 0 // Not tracked in database yet
    }
  }

  /**
   * Shutdown session manager
   */
  shutdown() {
    this.stopCleanup()
    // Sessions remain in database (not cleared)
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions() {
    const sessions = this.repo.findAll({}, 'created_at DESC')
    return sessions.map(s => s.id)
  }

  /**
   * Get session count
   */
  getSessionCount() {
    return this.repo.count()
  }

  /**
   * Get all sessions as array
   */
  getAllSessions() {
    const sessions = this.repo.findAll({}, 'created_at DESC')

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
    ])
  }

  /**
   * Clear all sessions (for testing)
   */
  clearAll() {
    const stmt = this.repo.db.prepare('DELETE FROM sessions')
    stmt.run()
  }
}

export default SessionManager
