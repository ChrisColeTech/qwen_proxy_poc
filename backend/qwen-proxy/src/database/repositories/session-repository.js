const BaseRepository = require('./base-repository');

class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions');
  }

  /**
   * Create a new session
   */
  createSession(sessionId, chatId, firstUserMessage, timeout) {
    const now = Date.now();
    const expiresAt = now + timeout;

    return this.create({
      id: sessionId,
      chat_id: chatId,
      parent_id: null,
      first_user_message: firstUserMessage,
      message_count: 0,
      created_at: now,
      last_accessed: now,
      expires_at: expiresAt
    });
  }

  /**
   * Get session by ID
   * Returns null if expired
   */
  getSession(sessionId) {
    const session = this.findById(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (Date.now() > session.expires_at) {
      this.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update parent_id and last_accessed
   */
  updateParentId(sessionId, parentId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return 0;
    }

    const now = Date.now();

    return this.update(sessionId, {
      parent_id: parentId,
      last_accessed: now,
      message_count: session.message_count + 1
    });
  }

  /**
   * Update last_accessed timestamp (keep-alive)
   */
  touchSession(sessionId, timeout) {
    const now = Date.now();

    return this.update(sessionId, {
      last_accessed: now,
      expires_at: now + timeout
    });
  }

  /**
   * Get all expired sessions
   */
  getExpiredSessions() {
    const now = Date.now();
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE expires_at < ?');
    return stmt.all(now);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpired() {
    const now = Date.now();
    const stmt = this.db.prepare('DELETE FROM sessions WHERE expires_at < ?');
    const info = stmt.run(now);
    return info.changes;
  }

  /**
   * Get session metrics
   */
  getMetrics() {
    const totalSessions = this.count();
    const now = Date.now();

    // Count active (non-expired) sessions
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?');
    const result = stmt.get(now);
    const activeSessions = result.count;

    return {
      totalSessions,
      activeSessions
    };
  }

  /**
   * Find session by conversation hash
   * Used for conversation continuations
   *
   * CRITICAL FIX: Returns MOST RECENT session when hash collisions occur
   * This handles the case where multiple conversations have identical first exchanges
   */
  findByConversationHash(conversationHash) {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE conversation_hash = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const session = stmt.get(conversationHash);

    if (!session) {
      return null;
    }

    // Check if expired
    if (Date.now() > session.expires_at) {
      this.delete(session.id);
      return null;
    }

    return session;
  }

  /**
   * Set conversation hash for a session
   * Called after first assistant response
   */
  setConversationHash(sessionId, conversationHash) {
    return this.update(sessionId, {
      conversation_hash: conversationHash
    });
  }

  /**
   * Store first assistant message
   * Used to compute conversation hash
   */
  setFirstAssistantMessage(sessionId, firstAssistantMessage) {
    return this.update(sessionId, {
      first_assistant_message: firstAssistantMessage
    });
  }
}

module.exports = SessionRepository;
