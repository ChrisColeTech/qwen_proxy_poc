import { BaseRepository } from './base-repository.js'

export class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions')
  }

  /**
   * Create a new session
   */
  createSession(sessionId, chatId, firstUserMessage, timeout) {
    const now = Date.now()
    const expiresAt = now + timeout

    return this.create({
      id: sessionId,
      chat_id: chatId,
      parent_id: null,
      first_user_message: firstUserMessage,
      message_count: 0,
      created_at: now,
      last_accessed: now,
      expires_at: expiresAt
    })
  }

  /**
   * Get session by ID
   * Returns null if expired
   */
  getSession(sessionId) {
    const session = this.findById(sessionId)

    if (!session) {
      return null
    }

    // Check if expired
    if (Date.now() > session.expires_at) {
      this.delete(sessionId)
      return null
    }

    return session
  }

  /**
   * Update parent_id and last_accessed
   */
  updateParentId(sessionId, parentId) {
    const now = Date.now()

    return this.update(sessionId, {
      parent_id: parentId,
      last_accessed: now,
      message_count: this.db.prepare(
        `SELECT message_count FROM sessions WHERE id = ?`
      ).get(sessionId).message_count + 1
    })
  }

  /**
   * Update last_accessed timestamp (keep-alive)
   */
  touchSession(sessionId, timeout) {
    const now = Date.now()

    return this.update(sessionId, {
      last_accessed: now,
      expires_at: now + timeout
    })
  }

  /**
   * Get all expired sessions
   */
  getExpiredSessions() {
    const now = Date.now()
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE expires_at < ?')
    return stmt.all(now)
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpired() {
    const now = Date.now()
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at < ?')
    const info = stmt.run(now)
    return info.changes
  }

  /**
   * Get session metrics
   */
  getMetrics() {
    const totalSessions = this.count()
    const activeSessions = this.count({ expires_at: `> ${Date.now()}` })

    return {
      totalSessions,
      activeSessions
    }
  }
}

export default SessionRepository
