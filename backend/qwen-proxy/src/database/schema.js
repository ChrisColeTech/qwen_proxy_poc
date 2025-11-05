/**
 * Database Schema Definitions
 *
 * Defines table schemas for sessions, requests, and responses
 * Part of Phase 1: Database Schema and Initialization
 */

const connection = require('./connection');

const SCHEMA_SQL = {
  // Qwen Credentials table - stores Qwen API credentials
  // NOTE: This table is shared with provider-router in the centralized database
  qwen_credentials: `
    CREATE TABLE IF NOT EXISTS qwen_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      cookies TEXT NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,

  qwen_credentials_indexes: [
    'CREATE INDEX IF NOT EXISTS idx_qwen_credentials_expires ON qwen_credentials(expires_at)'
  ],

  // Sessions table - tracks conversations
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      parent_id TEXT,
      first_user_message TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_accessed INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `,

  sessions_indexes: [
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_chat_id ON sessions(chat_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)'
  ],

  // Requests table - stores all incoming requests
  requests: `
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      request_id TEXT NOT NULL UNIQUE,
      timestamp INTEGER NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      openai_request TEXT NOT NULL,
      qwen_request TEXT NOT NULL,
      model TEXT NOT NULL,
      stream BOOLEAN NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `,

  requests_indexes: [
    'CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_requests_request_id ON requests(request_id)',
    'CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)'
  ],

  // Responses table - stores all responses
  responses: `
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      response_id TEXT NOT NULL UNIQUE,
      timestamp INTEGER NOT NULL,
      qwen_response TEXT,
      openai_response TEXT,
      parent_id TEXT,
      completion_tokens INTEGER,
      prompt_tokens INTEGER,
      total_tokens INTEGER,
      finish_reason TEXT,
      error TEXT,
      duration_ms INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `,

  responses_indexes: [
    'CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id)',
    'CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_responses_response_id ON responses(response_id)',
    'CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON responses(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at)'
  ],

  // Metadata table - for migrations and system info
  metadata: `
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `
};

/**
 * Initialize database schema
 * Creates all tables and indexes if they don't exist
 */
function initializeSchema() {
  const db = connection.getDatabase();

  console.log('[Database] Initializing schema...');

  try {
    // Create qwen_credentials table (shared with provider-router)
    db.exec(SCHEMA_SQL.qwen_credentials);
    SCHEMA_SQL.qwen_credentials_indexes.forEach(idx => db.exec(idx));
    console.log('[Database] ✓ Qwen credentials table created');

    // Create tables
    db.exec(SCHEMA_SQL.sessions);
    SCHEMA_SQL.sessions_indexes.forEach(idx => db.exec(idx));
    console.log('[Database] ✓ Sessions table created');

    db.exec(SCHEMA_SQL.requests);
    SCHEMA_SQL.requests_indexes.forEach(idx => db.exec(idx));
    console.log('[Database] ✓ Requests table created');

    db.exec(SCHEMA_SQL.responses);
    SCHEMA_SQL.responses_indexes.forEach(idx => db.exec(idx));
    console.log('[Database] ✓ Responses table created');

    db.exec(SCHEMA_SQL.metadata);
    console.log('[Database] ✓ Metadata table created');

    // Insert initial schema version
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO metadata (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run('schema_version', '1', Date.now());

    console.log('[Database] Schema initialized successfully');
  } catch (error) {
    console.error('[Database] Schema initialization failed:', error);
    throw error;
  }
}

/**
 * Get current schema version
 */
function getSchemaVersion() {
  const db = connection.getDatabase();

  try {
    const stmt = db.prepare('SELECT value FROM metadata WHERE key = ?');
    const row = stmt.get('schema_version');
    return row ? parseInt(row.value, 10) : 0;
  } catch (error) {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Update schema version
 */
function setSchemaVersion(version) {
  const db = connection.getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO metadata (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run('schema_version', version.toString(), Date.now());
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  const db = connection.getDatabase();

  try {
    const stats = {
      sessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
      requests: db.prepare('SELECT COUNT(*) as count FROM requests').get().count,
      responses: db.prepare('SELECT COUNT(*) as count FROM responses').get().count,
      schema_version: getSchemaVersion()
    };

    return stats;
  } catch (error) {
    console.error('[Database] Failed to get stats:', error);
    return null;
  }
}

/**
 * Clear all sessions from database
 * Called on server restart to prevent stale session issues
 *
 * This prevents the bug where:
 * - Client has conversation history from before server restart
 * - Client tries to continue conversation
 * - Server looks up session by hash
 * - Session doesn't exist → error
 *
 * By clearing sessions on startup, we force clients to start fresh.
 */
function clearAllSessions() {
  const db = connection.getDatabase();

  try {
    const stmt = db.prepare('DELETE FROM sessions');
    const result = stmt.run();
    console.log(`[Database] ✓ Cleared ${result.changes} session(s) on startup`);
    return result.changes;
  } catch (error) {
    console.error('[Database] Failed to clear sessions:', error);
    // Don't throw - this is not critical enough to prevent startup
    return 0;
  }
}

module.exports = {
  initializeSchema,
  getSchemaVersion,
  setSchemaVersion,
  getDatabaseStats,
  clearAllSessions,
  SCHEMA_SQL
};
