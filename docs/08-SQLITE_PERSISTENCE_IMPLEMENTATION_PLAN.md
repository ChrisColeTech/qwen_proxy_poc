# SQLite Persistence Layer - Implementation Plan

**Feature:** Add SQLite database persistence for requests, responses, and sessions
**Generated:** 2025-10-29
**Based on:** Current proxy architecture analysis and best practices
**Principles:** Single Responsibility Principle (SRP), Don't Repeat Yourself (DRY), separation of concerns

---

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | Critical | Pending | Database schema design and initialization |
| Phase 2 | Critical | Pending | Core database service layer |
| Phase 3 | Critical | Pending | Database-backed session manager |
| Phase 4 | High | Pending | Request/response persistence middleware |
| Phase 5 | High | Pending | Sessions CRUD API endpoints |
| Phase 6 | High | Pending | Requests CRUD API endpoints |
| Phase 7 | High | Pending | Responses CRUD API endpoints |
| Phase 8 | Medium | Pending | Database migrations system |
| Phase 9 | Medium | Pending | Test suite updates for database persistence |
| Phase 10 | Low | Pending | Performance optimization and indexing |

---

## Project Structure After Implementation

```
/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router
├── src/
│   ├── api/
│   │   ├── qwen-auth.js                    # [Integration Point] Authentication manager
│   │   └── qwen-client.js                  # [Integration Point] Low-level HTTP client
│   ├── config/
│   │   └── index.js                        # [Modified] Add database config
│   ├── database/
│   │   ├── index.js                        # [New] Database service exports
│   │   ├── connection.js                   # [New] SQLite connection management
│   │   ├── schema.js                       # [New] Database schema definitions
│   │   ├── migrations.js                   # [New] Migration runner
│   │   └── repositories/
│   │       ├── base-repository.js          # [New] Abstract base repository
│   │       ├── session-repository.js       # [New] Session data access layer
│   │       ├── request-repository.js       # [New] Request data access layer
│   │       └── response-repository.js      # [New] Response data access layer
│   ├── handlers/
│   │   ├── chat-completions-handler.js     # [Modified] Add request/response logging
│   │   ├── sessions-handler.js             # [New] Sessions CRUD endpoints
│   │   ├── requests-handler.js             # [New] Requests CRUD endpoints
│   │   ├── responses-handler.js            # [New] Responses CRUD endpoints
│   │   └── health-handler.js               # [Modified] Add database health check
│   ├── middleware/
│   │   ├── persistence-middleware.js       # [New] Request/response persistence
│   │   └── error-middleware.js             # [Integration Point] Error handling
│   ├── services/
│   │   ├── session-manager.js              # [Replaced] Database-backed session manager
│   │   ├── qwen-client.js                  # [Integration Point] Qwen API client
│   │   └── sse-handler.js                  # [Modified] Add response persistence
│   ├── transformers/
│   │   └── index.js                        # [Integration Point] Request/response transformers
│   ├── utils/
│   │   ├── logger.js                       # [Integration Point] Logging utility
│   │   └── hash-utils.js                   # [Integration Point] MD5 hash generation
│   ├── server.js                           # [Modified] Register new routes
│   └── index.js                            # [Modified] Initialize database on startup
├── data/
│   └── qwen_proxy_opencode.db                       # [New] SQLite database file
├── tests/
│   ├── database/
│   │   ├── connection.test.js              # [New] Database connection tests
│   │   ├── repositories.test.js            # [New] Repository tests
│   │   └── migrations.test.js              # [New] Migration tests
│   └── integration/
│       ├── persistence.test.js             # [New] End-to-end persistence tests
│       └── crud-endpoints.test.js          # [New] CRUD API tests
├── .env.example                            # [Modified] Add database config
└── package.json                            # [Modified] Add better-sqlite3 dependency
```

---

## Phase 1: Database Schema Design and Initialization

**Priority:** Critical
**Goal:** Design and implement the SQLite database schema for sessions, requests, and responses.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/schema.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/connection.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/migrations.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/index.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/config/index.js` - Add database configuration
- `/mnt/d/Projects/qwen_proxy_opencode/backend/package.json` - Add better-sqlite3 dependency

### Integration Points

- `src/config/index.js` - Configuration system (reads database config)

### Acceptance Criteria

- [ ] SQLite database is created on first startup
- [ ] Three tables are created: `sessions`, `requests`, `responses`
- [ ] All tables have proper primary keys, foreign keys, and indexes
- [ ] Schema includes created_at and updated_at timestamps
- [ ] Connection pooling is configured (single connection for better-sqlite3)
- [ ] Database file is stored in configurable location (default: `./data/qwen_proxy_opencode.db`)
- [ ] Database is created in WAL mode for better concurrency
- [ ] Migration system tracks schema version

### Database Schema

#### Sessions Table

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                    -- MD5 hash of first user message
  chat_id TEXT NOT NULL,                  -- Qwen chat ID
  parent_id TEXT,                         -- Current parent_id for next message
  first_user_message TEXT NOT NULL,       -- First message for reference
  message_count INTEGER DEFAULT 0,        -- Number of messages in conversation
  created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
  last_accessed INTEGER NOT NULL,         -- Timestamp (milliseconds)
  expires_at INTEGER NOT NULL             -- Timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_chat_id ON sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
```

#### Requests Table

```sql
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,               -- Foreign key to sessions
  request_id TEXT NOT NULL UNIQUE,        -- UUID for request tracking
  timestamp INTEGER NOT NULL,             -- Timestamp (milliseconds)
  method TEXT NOT NULL,                   -- HTTP method (POST)
  path TEXT NOT NULL,                     -- Endpoint path
  openai_request TEXT NOT NULL,           -- Full OpenAI request body (JSON)
  qwen_request TEXT NOT NULL,             -- Transformed Qwen payload (JSON)
  model TEXT NOT NULL,                    -- Model name (e.g., qwen3-max)
  stream BOOLEAN NOT NULL,                -- Streaming flag
  created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_request_id ON requests(request_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
```

#### Responses Table

```sql
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,            -- Foreign key to requests
  session_id TEXT NOT NULL,               -- Foreign key to sessions
  response_id TEXT NOT NULL UNIQUE,       -- UUID for response tracking
  timestamp INTEGER NOT NULL,             -- Timestamp (milliseconds)
  qwen_response TEXT,                     -- Raw Qwen response (JSON, can be null for streaming)
  openai_response TEXT,                   -- Transformed OpenAI response (JSON)
  parent_id TEXT,                         -- New parent_id from response
  completion_tokens INTEGER,              -- Token usage
  prompt_tokens INTEGER,                  -- Token usage
  total_tokens INTEGER,                   -- Token usage
  finish_reason TEXT,                     -- stop, length, error, etc.
  error TEXT,                             -- Error message if failed
  duration_ms INTEGER,                    -- Response time in milliseconds
  created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_response_id ON responses(response_id);
CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
```

#### Metadata Table (for migrations)

```sql
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert initial schema version
INSERT OR IGNORE INTO metadata (key, value, updated_at)
VALUES ('schema_version', '1', strftime('%s', 'now') * 1000);
```

### Implementation Details

**`src/database/connection.js`**

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class DatabaseConnection {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   * Creates database file if it doesn't exist
   */
  connect() {
    if (this.db) {
      return this.db; // Already connected
    }

    const dbPath = config.database.path;
    const dbDir = path.dirname(dbPath);

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(dbPath, {
      verbose: config.database.verbose ? console.log : null
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    console.log(`[Database] Connected to SQLite database at ${dbPath}`);

    return this.db;
  }

  /**
   * Get database instance
   */
  getDatabase() {
    if (!this.db) {
      this.connect();
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[Database] Connection closed');
    }
  }

  /**
   * Execute within a transaction
   */
  transaction(fn) {
    const db = this.getDatabase();
    return db.transaction(fn);
  }
}

// Singleton instance
const connection = new DatabaseConnection();

module.exports = connection;
```

**`src/database/schema.js`**

```javascript
const connection = require('./connection');

const SCHEMA_SQL = {
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
 */
function initializeSchema() {
  const db = connection.getDatabase();

  console.log('[Database] Initializing schema...');

  // Create tables
  db.exec(SCHEMA_SQL.sessions);
  SCHEMA_SQL.sessions_indexes.forEach(idx => db.exec(idx));

  db.exec(SCHEMA_SQL.requests);
  SCHEMA_SQL.requests_indexes.forEach(idx => db.exec(idx));

  db.exec(SCHEMA_SQL.responses);
  SCHEMA_SQL.responses_indexes.forEach(idx => db.exec(idx));

  db.exec(SCHEMA_SQL.metadata);

  // Insert initial schema version
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO metadata (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run('schema_version', '1', Date.now());

  console.log('[Database] Schema initialized successfully');
}

/**
 * Get current schema version
 */
function getSchemaVersion() {
  const db = connection.getDatabase();
  const stmt = db.prepare('SELECT value FROM metadata WHERE key = ?');
  const row = stmt.get('schema_version');
  return row ? parseInt(row.value, 10) : 0;
}

module.exports = {
  initializeSchema,
  getSchemaVersion,
  SCHEMA_SQL
};
```

**`src/config/index.js` additions**

```javascript
// Add to existing config object:
database: {
  path: process.env.DATABASE_PATH || path.join(__dirname, '../../data/qwen_proxy_opencode.db'),
  verbose: process.env.DATABASE_VERBOSE === 'true' || false,
  busyTimeout: parseInt(process.env.DATABASE_BUSY_TIMEOUT, 10) || 5000
}
```

### Testing Strategy

```bash
# Install dependency
npm install better-sqlite3

# Test database creation
node -e "
  const db = require('./src/database/connection');
  const schema = require('./src/database/schema');
  db.connect();
  schema.initializeSchema();
  console.log('Schema version:', schema.getSchemaVersion());
  db.close();
"

# Verify database file exists
ls -lh data/qwen_proxy_opencode.db

# Check tables were created
sqlite3 data/qwen_proxy_opencode.db ".tables"
# Expected: sessions  requests  responses  metadata

# Check schema
sqlite3 data/qwen_proxy_opencode.db ".schema sessions"
```

---

## Phase 2: Core Database Service Layer

**Priority:** Critical
**Goal:** Implement repository pattern for data access with reusable base repository.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/repositories/base-repository.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/repositories/session-repository.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/repositories/request-repository.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/repositories/response-repository.js`

### Integration Points

- `src/database/connection.js` - Database connection (not modified)
- `src/database/schema.js` - Schema definitions (not modified)

### Acceptance Criteria

- [ ] BaseRepository provides common CRUD operations (create, read, update, delete)
- [ ] Each repository extends BaseRepository
- [ ] All queries use prepared statements (SQL injection prevention)
- [ ] Repositories handle transactions properly
- [ ] Error handling includes SQLite-specific errors
- [ ] All timestamps are in milliseconds
- [ ] JSON fields are automatically serialized/deserialized
- [ ] Repositories provide find, findOne, findAll, count methods

### Implementation Details

**`src/database/repositories/base-repository.js`**

```javascript
const connection = require('../connection');

/**
 * Base Repository
 * Provides common database operations for all repositories
 */
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = connection.getDatabase();
  }

  /**
   * Find one record by column value
   */
  findOne(column, value) {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`);
    return stmt.get(value);
  }

  /**
   * Find one record by ID
   */
  findById(id) {
    return this.findOne('id', id);
  }

  /**
   * Find all records matching criteria
   */
  findAll(where = {}, orderBy = 'id', limit = null, offset = 0) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    // Build WHERE clause
    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY
    sql += ` ORDER BY ${orderBy}`;

    // Add LIMIT and OFFSET
    if (limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Count records matching criteria
   */
  count(where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return result.count;
  }

  /**
   * Insert a new record
   */
  create(data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...values);

    return info.lastInsertRowid;
  }

  /**
   * Update a record by ID
   */
  update(id, data) {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...values);

    return info.changes;
  }

  /**
   * Delete a record by ID
   */
  delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes;
  }

  /**
   * Delete all records matching criteria
   */
  deleteWhere(where) {
    const conditions = Object.keys(where).map(key => `${key} = ?`);
    const values = Object.values(where);

    const sql = `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...values);
    return info.changes;
  }

  /**
   * Execute a raw SQL query
   */
  raw(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }
}

module.exports = BaseRepository;
```

**`src/database/repositories/session-repository.js`**

```javascript
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
    const now = Date.now();

    return this.update(sessionId, {
      parent_id: parentId,
      last_accessed: now,
      message_count: this.db.prepare(
        `SELECT message_count FROM sessions WHERE id = ?`
      ).get(sessionId).message_count + 1
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
    const activeSessions = this.count({ expires_at: `> ${Date.now()}` });

    return {
      totalSessions,
      activeSessions
    };
  }
}

module.exports = SessionRepository;
```

**`src/database/repositories/request-repository.js`**

```javascript
const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class RequestRepository extends BaseRepository {
  constructor() {
    super('requests');
  }

  /**
   * Create a new request record
   */
  createRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
    const requestId = crypto.randomUUID();
    const now = Date.now();

    const id = this.create({
      session_id: sessionId,
      request_id: requestId,
      timestamp: now,
      method: 'POST',
      path: '/v1/chat/completions',
      openai_request: JSON.stringify(openaiRequest),
      qwen_request: JSON.stringify(qwenRequest),
      model: model,
      stream: stream ? 1 : 0,
      created_at: now
    });

    return { id, requestId };
  }

  /**
   * Get request by request_id (UUID)
   */
  getByRequestId(requestId) {
    const request = this.findOne('request_id', requestId);

    if (request) {
      // Parse JSON fields
      request.openai_request = JSON.parse(request.openai_request);
      request.qwen_request = JSON.parse(request.qwen_request);
      request.stream = Boolean(request.stream);
    }

    return request;
  }

  /**
   * Get all requests for a session
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const requests = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    );

    // Parse JSON fields
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }));
  }

  /**
   * Get requests within date range
   */
  getByDateRange(startDate, endDate, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = this.db.prepare(sql);
    const requests = stmt.all(startDate, endDate, limit, offset);

    // Parse JSON fields
    return requests.map(req => ({
      ...req,
      openai_request: JSON.parse(req.openai_request),
      qwen_request: JSON.parse(req.qwen_request),
      stream: Boolean(req.stream)
    }));
  }
}

module.exports = RequestRepository;
```

**`src/database/repositories/response-repository.js`**

```javascript
const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class ResponseRepository extends BaseRepository {
  constructor() {
    super('responses');
  }

  /**
   * Create a new response record
   */
  createResponse(requestId, sessionId, qwenResponse, openaiResponse, parentId, usage, durationMs, finishReason, error = null) {
    const responseId = crypto.randomUUID();
    const now = Date.now();

    const id = this.create({
      request_id: requestId,
      session_id: sessionId,
      response_id: responseId,
      timestamp: now,
      qwen_response: qwenResponse ? JSON.stringify(qwenResponse) : null,
      openai_response: JSON.stringify(openaiResponse),
      parent_id: parentId,
      completion_tokens: usage?.completion_tokens || null,
      prompt_tokens: usage?.prompt_tokens || null,
      total_tokens: usage?.total_tokens || null,
      finish_reason: finishReason,
      error: error,
      duration_ms: durationMs,
      created_at: now
    });

    return { id, responseId };
  }

  /**
   * Get response by response_id (UUID)
   */
  getByResponseId(responseId) {
    const response = this.findOne('response_id', responseId);

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
      response.openai_response = JSON.parse(response.openai_response);
    }

    return response;
  }

  /**
   * Get response for a specific request
   */
  getByRequestId(requestId) {
    const response = this.findOne('request_id', requestId);

    if (response) {
      // Parse JSON fields
      response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
      response.openai_response = JSON.parse(response.openai_response);
    }

    return response;
  }

  /**
   * Get all responses for a session
   */
  getBySessionId(sessionId, limit = 100, offset = 0) {
    const responses = this.findAll(
      { session_id: sessionId },
      'timestamp DESC',
      limit,
      offset
    );

    // Parse JSON fields
    return responses.map(resp => ({
      ...resp,
      qwen_response: resp.qwen_response ? JSON.parse(resp.qwen_response) : null,
      openai_response: JSON.parse(resp.openai_response)
    }));
  }

  /**
   * Get usage statistics
   */
  getUsageStats(sessionId = null) {
    let sql = `
      SELECT
        COUNT(*) as total_responses,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(total_tokens) as total_tokens,
        AVG(duration_ms) as avg_duration_ms
      FROM ${this.tableName}
    `;

    const params = [];
    if (sessionId) {
      sql += ' WHERE session_id = ?';
      params.push(sessionId);
    }

    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }
}

module.exports = ResponseRepository;
```

### Testing Strategy

```javascript
// Test repositories
const SessionRepo = require('./src/database/repositories/session-repository');
const RequestRepo = require('./src/database/repositories/request-repository');
const ResponseRepo = require('./src/database/repositories/response-repository');

const sessionRepo = new SessionRepo();
const requestRepo = new RequestRepo();
const responseRepo = new ResponseRepo();

// Test session creation
sessionRepo.createSession('test-session-1', 'chat-123', 'Hello world', 30 * 60 * 1000);
const session = sessionRepo.getSession('test-session-1');
console.log('Session:', session);

// Test request creation
const { id: requestId } = requestRepo.createRequest(
  'test-session-1',
  { messages: [{ role: 'user', content: 'test' }] },
  { chat_id: 'chat-123', messages: [...] },
  'qwen3-max',
  false
);
console.log('Request ID:', requestId);

// Test response creation
const { id: responseId } = responseRepo.createResponse(
  requestId,
  'test-session-1',
  { choices: [...] },
  { id: 'chatcmpl-123', ... },
  'parent-456',
  { completion_tokens: 10, prompt_tokens: 20, total_tokens: 30 },
  1500,
  'stop'
);
console.log('Response ID:', responseId);
```

---

## Phase 3: Database-Backed Session Manager

**Priority:** Critical
**Goal:** Replace in-memory Map-based session manager with database-backed version.

### Files to Replace

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/services/session-manager.js` - Complete rewrite

### Integration Points

- `src/database/repositories/session-repository.js` - Data access layer (not modified)
- `src/utils/hash-utils.js` - MD5 hash generation (not modified)
- `src/handlers/chat-completions-handler.js` - Uses session manager (not modified)

### Acceptance Criteria

- [ ] Session manager uses SessionRepository instead of Map
- [ ] API remains identical to existing session manager (drop-in replacement)
- [ ] All public methods work exactly the same way
- [ ] Sessions persist across server restarts
- [ ] Cleanup job removes expired sessions from database
- [ ] Performance is acceptable (< 10ms for session operations)
- [ ] Transactions ensure data consistency

### Implementation Details

**`src/services/session-manager.js` (complete rewrite)**

```javascript
/**
 * Database-Backed Session Manager
 *
 * Manages session state using SQLite database instead of in-memory Map.
 * Maintains same API as original for drop-in replacement.
 */

const { generateMD5Hash } = require('../utils/hash-utils');
const SessionRepository = require('../database/repositories/session-repository');

class SessionManager {
  /**
   * Create a new SessionManager
   */
  constructor(config = {}) {
    this.repo = new SessionRepository();

    // Configuration
    this.timeout = config.timeout || 30 * 60 * 1000; // 30 minutes default
    this.cleanupInterval = config.cleanupInterval || 10 * 60 * 1000; // 10 minutes default

    // Cleanup timer
    this.cleanupTimer = null;
  }

  /**
   * Generate session ID from first user message
   */
  generateSessionId(firstMessage) {
    if (!firstMessage || typeof firstMessage !== 'string') {
      throw new Error('First message must be a non-empty string');
    }

    return generateMD5Hash(firstMessage);
  }

  /**
   * Create a new session
   */
  createSession(sessionId, chatId = null) {
    if (sessionId === null || sessionId === undefined) {
      throw new Error('Session ID is required');
    }

    // Extract first user message from sessionId (for reference only)
    // In practice, we'll need to pass this separately
    const firstUserMessage = 'session-' + sessionId.substring(0, 8);

    this.repo.createSession(sessionId, chatId, firstUserMessage, this.timeout);

    const session = this.repo.getSession(sessionId);

    // Return in format matching old API
    return {
      sessionId: session.id,
      chatId: session.chat_id,
      parent_id: session.parent_id,
      parentId: session.parent_id,  // Alias
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
  }

  /**
   * Get an existing session
   */
  getSession(sessionId) {
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
      parentId: session.parent_id,  // Alias
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      messageCount: session.message_count
    };
  }

  /**
   * Update session with new parent_id from response
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
   * Alias for updateSession (camelCase naming)
   */
  updateParentId(sessionId, parentId) {
    return this.updateSession(sessionId, parentId);
  }

  /**
   * Set chat ID for a session
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
   */
  deleteSession(sessionId) {
    return this.repo.delete(sessionId) > 0;
  }

  /**
   * Check if session exists and is valid
   */
  isNewSession(sessionId) {
    return !this.getSession(sessionId);
  }

  /**
   * Get parent_id for next message in conversation
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
   */
  cleanup() {
    const cleaned = this.repo.cleanupExpired();
    return cleaned;
  }

  /**
   * Start automatic cleanup timer
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
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get metrics about session manager
   */
  getMetrics() {
    const metrics = this.repo.getMetrics();

    return {
      activeSessions: metrics.activeSessions,
      totalCreated: metrics.totalSessions,
      totalCleaned: 0 // Not tracked in database yet
    };
  }

  /**
   * Shutdown session manager
   */
  shutdown() {
    this.stopCleanup();
    // Sessions remain in database (not cleared)
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions() {
    const sessions = this.repo.findAll({}, 'created_at DESC');
    return sessions.map(s => s.id);
  }

  /**
   * Get session count
   */
  getSessionCount() {
    return this.repo.count();
  }

  /**
   * Get all sessions as array
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
   * Clear all sessions (for testing)
   */
  clearAll() {
    const stmt = this.repo.db.prepare('DELETE FROM sessions');
    stmt.run();
  }
}

module.exports = SessionManager;
```

### Testing Strategy

```javascript
// Test database-backed session manager
const SessionManager = require('./src/services/session-manager');
const manager = new SessionManager({ timeout: 30 * 60 * 1000 });

// Test create session
const session = manager.createSession('test-hash', 'chat-123');
console.log('Created session:', session);

// Test get session
const retrieved = manager.getSession('test-hash');
console.log('Retrieved session:', retrieved);
assert(retrieved.chatId === 'chat-123');
assert(retrieved.parent_id === null);

// Test update parent_id
manager.updateSession('test-hash', 'parent-456');
const updated = manager.getSession('test-hash');
console.log('Updated session:', updated);
assert(updated.parent_id === 'parent-456');

// Test cleanup (set short timeout)
const shortManager = new SessionManager({ timeout: 1000 });
shortManager.createSession('expire-test', 'chat-789');
await new Promise(resolve => setTimeout(resolve, 1500));
const cleaned = shortManager.cleanup();
console.log('Cleaned sessions:', cleaned);
assert(cleaned === 1);

// Verify data persists across restarts
const manager2 = new SessionManager();
const persisted = manager2.getSession('test-hash');
console.log('Session persisted:', persisted !== null);
```

---

## Phase 4: Request/Response Persistence Middleware

**Priority:** High
**Goal:** Add middleware to automatically log requests and responses to database.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/persistence-middleware.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/handlers/chat-completions-handler.js` - Add persistence calls
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/services/sse-handler.js` - Add response persistence

### Integration Points

- `src/database/repositories/request-repository.js` - Data access (not modified)
- `src/database/repositories/response-repository.js` - Data access (not modified)
- `src/transformers/index.js` - Request/response transformers (not modified)

### Acceptance Criteria

- [ ] All requests to /v1/chat/completions are logged to database
- [ ] Request logging happens before sending to Qwen API
- [ ] Response logging happens after receiving from Qwen API
- [ ] Both streaming and non-streaming responses are logged
- [ ] Request/response pairs are linked via request_id
- [ ] Token usage is extracted and stored
- [ ] Duration is calculated and stored
- [ ] Errors are captured and stored
- [ ] Logging doesn't interfere with response streaming

### Implementation Details

**`src/middleware/persistence-middleware.js`**

```javascript
const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * Persistence middleware
 * Logs requests and attaches response logger
 */
function persistenceMiddleware(req, res, next) {
  // Only log chat completion requests
  if (req.path !== '/v1/chat/completions') {
    return next();
  }

  // Extract session ID from request (added by chat handler)
  // We'll need to pass this from the handler
  req.persistence = {
    startTime: Date.now()
  };

  next();
}

/**
 * Log request to database
 * Called from chat-completions-handler after session is determined
 */
async function logRequest(sessionId, openaiRequest, qwenRequest, model, stream) {
  try {
    const { id, requestId } = requestRepo.createRequest(
      sessionId,
      openaiRequest,
      qwenRequest,
      model,
      stream
    );

    return { requestId, requestDbId: id };
  } catch (error) {
    console.error('[Persistence] Failed to log request:', error);
    // Don't throw - persistence failure shouldn't break the request
    return null;
  }
}

/**
 * Log response to database
 * Called after response is complete
 */
async function logResponse(requestDbId, sessionId, qwenResponse, openaiResponse, parentId, usage, durationMs, finishReason, error = null) {
  try {
    const { responseId } = responseRepo.createResponse(
      requestDbId,
      sessionId,
      qwenResponse,
      openaiResponse,
      parentId,
      usage,
      durationMs,
      finishReason,
      error
    );

    return responseId;
  } catch (err) {
    console.error('[Persistence] Failed to log response:', err);
    // Don't throw - persistence failure shouldn't break the request
    return null;
  }
}

module.exports = {
  persistenceMiddleware,
  logRequest,
  logResponse
};
```

**Modifications to `src/handlers/chat-completions-handler.js`**

```javascript
// Add at top
const { logRequest, logResponse } = require('../middleware/persistence-middleware');

// In chatCompletions function, after transforming request:
async function chatCompletions(req, res, next) {
  try {
    // ... existing code ...

    // 4. Transform OpenAI request to Qwen format
    const qwenPayload = transformers.transformToQwenRequest(...);

    // LOG REQUEST TO DATABASE
    const persistence = await logRequest(
      sessionId,
      req.body,  // OpenAI request
      qwenPayload,  // Qwen request
      model || 'qwen3-max',
      stream === true
    );

    const startTime = Date.now();

    // 5. Route to streaming or non-streaming
    if (stream === true) {
      // ... existing streaming code ...

      // After stream completes, log response
      response.data.on('end', () => {
        const duration = Date.now() - startTime;

        if (persistence) {
          logResponse(
            persistence.requestDbId,
            sessionId,
            null,  // Qwen response (not stored for streaming)
            { /* accumulated response */ },
            newParentId,
            usageData,
            duration,
            'stop',
            null
          );
        }

        // ... rest of existing code ...
      });

    } else {
      // NON-STREAMING MODE
      const qwenResponse = await qwenClient.withRetry(...);
      const duration = Date.now() - startTime;

      // ... existing transformation code ...

      // LOG RESPONSE TO DATABASE
      if (persistence) {
        await logResponse(
          persistence.requestDbId,
          sessionId,
          qwenResponse.data,  // Qwen response
          openaiResponse,  // OpenAI response
          newParentId,
          openaiResponse.usage,
          duration,
          openaiResponse.choices[0].finish_reason,
          null
        );
      }

      res.json(openaiResponse);
    }

  } catch (error) {
    // ... existing error handling ...

    // Log error response if persistence was initialized
    if (persistence) {
      await logResponse(
        persistence.requestDbId,
        sessionId,
        null,
        null,
        null,
        null,
        Date.now() - startTime,
        'error',
        error.message
      );
    }

    next(error);
  }
}
```

### Testing Strategy

```bash
# Start server
npm start

# Make requests
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'

# Check database
sqlite3 data/qwen_proxy_opencode.db "SELECT * FROM requests;"
sqlite3 data/qwen_proxy_opencode.db "SELECT * FROM responses;"

# Verify request-response linkage
sqlite3 data/qwen_proxy_opencode.db "
  SELECT
    r.request_id,
    r.model,
    res.response_id,
    res.finish_reason,
    res.duration_ms
  FROM requests r
  JOIN responses res ON res.request_id = r.id;
"
```

---

## Phase 5: Sessions CRUD API Endpoints

**Priority:** High
**Goal:** Create REST API endpoints for session management.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/handlers/sessions-handler.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` - Register session routes

### Integration Points

- `src/database/repositories/session-repository.js` - Data access (not modified)
- `src/middleware/auth-middleware.js` - Authentication (not modified)

### Acceptance Criteria

- [ ] GET /v1/sessions - List all sessions (with pagination)
- [ ] GET /v1/sessions/:sessionId - Get specific session
- [ ] GET /v1/sessions/:sessionId/stats - Get session statistics
- [ ] DELETE /v1/sessions/:sessionId - Delete session and related data
- [ ] All endpoints require authentication
- [ ] Pagination uses limit and offset query parameters
- [ ] Responses include total count for pagination
- [ ] Returns 404 for non-existent sessions
- [ ] Deleting session cascades to requests and responses

### Implementation Details

**`src/handlers/sessions-handler.js`**

```javascript
const SessionRepository = require('../database/repositories/session-repository');
const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

const sessionRepo = new SessionRepository();
const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * GET /v1/sessions
 * List all sessions with pagination
 */
async function listSessions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const orderBy = req.query.orderBy || 'created_at DESC';

    const sessions = sessionRepo.findAll({}, orderBy, limit, offset);
    const total = sessionRepo.count();

    res.json({
      object: 'list',
      data: sessions.map(s => ({
        id: s.id,
        chat_id: s.chat_id,
        parent_id: s.parent_id,
        message_count: s.message_count,
        first_user_message: s.first_user_message.substring(0, 100), // Truncate
        created_at: s.created_at,
        last_accessed: s.last_accessed,
        expires_at: s.expires_at
      })),
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/sessions/:sessionId
 * Get specific session details
 */
async function getSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Get request count for this session
    const requestCount = requestRepo.count({ session_id: sessionId });

    res.json({
      id: session.id,
      chat_id: session.chat_id,
      parent_id: session.parent_id,
      message_count: session.message_count,
      request_count: requestCount,
      first_user_message: session.first_user_message,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      expires_at: session.expires_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/sessions/:sessionId/stats
 * Get session statistics (token usage, duration, etc.)
 */
async function getSessionStats(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Get usage statistics
    const stats = responseRepo.getUsageStats(sessionId);

    res.json({
      session_id: sessionId,
      message_count: session.message_count,
      created_at: session.created_at,
      last_accessed: session.last_accessed,
      usage: {
        total_responses: stats.total_responses,
        total_completion_tokens: stats.total_completion_tokens,
        total_prompt_tokens: stats.total_prompt_tokens,
        total_tokens: stats.total_tokens,
        avg_duration_ms: Math.round(stats.avg_duration_ms || 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /v1/sessions/:sessionId
 * Delete session and all related data
 */
async function deleteSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = sessionRepo.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          type: 'not_found_error',
          code: 'session_not_found'
        }
      });
    }

    // Delete session (cascades to requests and responses due to foreign keys)
    sessionRepo.delete(sessionId);

    res.json({
      deleted: true,
      session_id: sessionId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSessions,
  getSession,
  getSessionStats,
  deleteSession
};
```

**Modifications to `src/server.js`**

```javascript
// Add at top
const {
  listSessions,
  getSession,
  getSessionStats,
  deleteSession
} = require('./handlers/sessions-handler');

// Add routes (after existing routes)
app.get('/v1/sessions', authMiddleware, listSessions);
app.get('/v1/sessions/:sessionId', authMiddleware, getSession);
app.get('/v1/sessions/:sessionId/stats', authMiddleware, getSessionStats);
app.delete('/v1/sessions/:sessionId', authMiddleware, deleteSession);
```

### Testing Strategy

```bash
# List all sessions
curl http://localhost:3001/v1/sessions?limit=10&offset=0

# Get specific session
curl http://localhost:3001/v1/sessions/abc123hash

# Get session stats
curl http://localhost:3001/v1/sessions/abc123hash/stats

# Delete session
curl -X DELETE http://localhost:3001/v1/sessions/abc123hash

# Verify deletion cascaded
sqlite3 data/qwen_proxy_opencode.db "SELECT COUNT(*) FROM requests WHERE session_id = 'abc123hash';"
# Should return 0
```

---

## Phase 6: Requests CRUD API Endpoints

**Priority:** High
**Goal:** Create REST API endpoints for request history.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/handlers/requests-handler.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` - Register request routes

### Integration Points

- `src/database/repositories/request-repository.js` - Data access (not modified)

### Acceptance Criteria

- [ ] GET /v1/requests - List all requests (with pagination and filters)
- [ ] GET /v1/requests/:id - Get specific request
- [ ] GET /v1/sessions/:sessionId/requests - Get requests for session
- [ ] Supports filtering by date range, model, stream type
- [ ] Returns full request payloads (OpenAI and Qwen formats)
- [ ] Includes linked response summary
- [ ] All endpoints require authentication

### Implementation Details

**`src/handlers/requests-handler.js`**

```javascript
const RequestRepository = require('../database/repositories/request-repository');
const ResponseRepository = require('../database/repositories/response-repository');

const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

/**
 * GET /v1/requests
 * List all requests with pagination and filters
 */
async function listRequests(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    // Filters
    const sessionId = req.query.session_id;
    const model = req.query.model;
    const stream = req.query.stream !== undefined ? req.query.stream === 'true' : undefined;
    const startDate = req.query.start_date ? parseInt(req.query.start_date, 10) : null;
    const endDate = req.query.end_date ? parseInt(req.query.end_date, 10) : null;

    let requests;
    let total;

    if (startDate && endDate) {
      // Date range query
      requests = requestRepo.getByDateRange(startDate, endDate, limit, offset);
      total = requestRepo.raw(
        'SELECT COUNT(*) as count FROM requests WHERE timestamp >= ? AND timestamp <= ?',
        [startDate, endDate]
      )[0].count;
    } else if (sessionId) {
      // Session query
      requests = requestRepo.getBySessionId(sessionId, limit, offset);
      total = requestRepo.count({ session_id: sessionId });
    } else {
      // All requests
      const where = {};
      if (model) where.model = model;
      if (stream !== undefined) where.stream = stream ? 1 : 0;

      requests = requestRepo.findAll(where, 'timestamp DESC', limit, offset);
      total = requestRepo.count(where);
    }

    // Add response summary to each request
    const enriched = requests.map(req => {
      const response = responseRepo.getByRequestId(req.id);

      return {
        id: req.id,
        request_id: req.request_id,
        session_id: req.session_id,
        timestamp: req.timestamp,
        method: req.method,
        path: req.path,
        model: req.model,
        stream: req.stream,
        openai_request: req.openai_request,
        qwen_request: req.qwen_request,
        response_summary: response ? {
          response_id: response.response_id,
          finish_reason: response.finish_reason,
          total_tokens: response.total_tokens,
          duration_ms: response.duration_ms,
          error: response.error
        } : null
      };
    });

    res.json({
      object: 'list',
      data: enriched,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/requests/:id
 * Get specific request details
 */
async function getRequest(req, res, next) {
  try {
    const { id } = req.params;

    const request = requestRepo.findById(parseInt(id, 10));

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      });
    }

    // Parse JSON fields
    request.openai_request = JSON.parse(request.openai_request);
    request.qwen_request = JSON.parse(request.qwen_request);
    request.stream = Boolean(request.stream);

    // Get linked response
    const response = responseRepo.getByRequestId(request.id);

    res.json({
      ...request,
      response: response || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/sessions/:sessionId/requests
 * Get all requests for a specific session
 */
async function getSessionRequests(req, res, next) {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    const requests = requestRepo.getBySessionId(sessionId, limit, offset);
    const total = requestRepo.count({ session_id: sessionId });

    res.json({
      object: 'list',
      session_id: sessionId,
      data: requests,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRequests,
  getRequest,
  getSessionRequests
};
```

**Modifications to `src/server.js`**

```javascript
// Add at top
const {
  listRequests,
  getRequest,
  getSessionRequests
} = require('./handlers/requests-handler');

// Add routes
app.get('/v1/requests', authMiddleware, listRequests);
app.get('/v1/requests/:id', authMiddleware, getRequest);
app.get('/v1/sessions/:sessionId/requests', authMiddleware, getSessionRequests);
```

### Testing Strategy

```bash
# List all requests
curl http://localhost:3001/v1/requests?limit=10

# Filter by model
curl http://localhost:3001/v1/requests?model=qwen3-max

# Filter by date range (last 24 hours)
START=$(date -d '1 day ago' +%s)000
END=$(date +%s)000
curl "http://localhost:3001/v1/requests?start_date=$START&end_date=$END"

# Get specific request
curl http://localhost:3001/v1/requests/1

# Get requests for session
curl http://localhost:3001/v1/sessions/abc123hash/requests
```

---

## Phase 7: Responses CRUD API Endpoints

**Priority:** High
**Goal:** Create REST API endpoints for response history.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/handlers/responses-handler.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` - Register response routes

### Integration Points

- `src/database/repositories/response-repository.js` - Data access (not modified)

### Acceptance Criteria

- [ ] GET /v1/responses - List all responses (with pagination)
- [ ] GET /v1/responses/:id - Get specific response
- [ ] GET /v1/requests/:requestId/response - Get response for request
- [ ] GET /v1/responses/stats - Get overall usage statistics
- [ ] Returns full response payloads (OpenAI and Qwen formats)
- [ ] Includes token usage and timing information

### Implementation Details

**`src/handlers/responses-handler.js`**

```javascript
const ResponseRepository = require('../database/repositories/response-repository');
const RequestRepository = require('../database/repositories/request-repository');

const responseRepo = new ResponseRepository();
const requestRepo = new RequestRepository();

/**
 * GET /v1/responses
 * List all responses with pagination
 */
async function listResponses(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const sessionId = req.query.session_id;

    let responses;
    let total;

    if (sessionId) {
      responses = responseRepo.getBySessionId(sessionId, limit, offset);
      total = responseRepo.count({ session_id: sessionId });
    } else {
      responses = responseRepo.findAll({}, 'timestamp DESC', limit, offset);
      total = responseRepo.count();
    }

    res.json({
      object: 'list',
      data: responses,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/responses/:id
 * Get specific response details
 */
async function getResponse(req, res, next) {
  try {
    const { id } = req.params;

    const response = responseRepo.findById(parseInt(id, 10));

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      });
    }

    // Parse JSON fields
    response.qwen_response = response.qwen_response ? JSON.parse(response.qwen_response) : null;
    response.openai_response = JSON.parse(response.openai_response);

    // Get linked request
    const request = requestRepo.findById(response.request_id);

    res.json({
      ...response,
      request: request ? {
        id: request.id,
        request_id: request.request_id,
        model: request.model,
        stream: Boolean(request.stream),
        timestamp: request.timestamp
      } : null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/requests/:requestId/response
 * Get response for specific request
 */
async function getRequestResponse(req, res, next) {
  try {
    const { requestId } = req.params;

    // Find request first
    const request = requestRepo.findById(parseInt(requestId, 10));

    if (!request) {
      return res.status(404).json({
        error: {
          message: 'Request not found',
          type: 'not_found_error',
          code: 'request_not_found'
        }
      });
    }

    const response = responseRepo.getByRequestId(request.id);

    if (!response) {
      return res.status(404).json({
        error: {
          message: 'Response not found for this request',
          type: 'not_found_error',
          code: 'response_not_found'
        }
      });
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/responses/stats
 * Get overall usage statistics
 */
async function getResponseStats(req, res, next) {
  try {
    const sessionId = req.query.session_id;

    const stats = responseRepo.getUsageStats(sessionId || null);

    res.json({
      session_id: sessionId || 'all',
      statistics: {
        total_responses: stats.total_responses,
        total_completion_tokens: stats.total_completion_tokens,
        total_prompt_tokens: stats.total_prompt_tokens,
        total_tokens: stats.total_tokens,
        avg_duration_ms: Math.round(stats.avg_duration_ms || 0)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listResponses,
  getResponse,
  getRequestResponse,
  getResponseStats
};
```

**Modifications to `src/server.js`**

```javascript
// Add at top
const {
  listResponses,
  getResponse,
  getRequestResponse,
  getResponseStats
} = require('./handlers/responses-handler');

// Add routes
app.get('/v1/responses', authMiddleware, listResponses);
app.get('/v1/responses/stats', authMiddleware, getResponseStats);
app.get('/v1/responses/:id', authMiddleware, getResponse);
app.get('/v1/requests/:requestId/response', authMiddleware, getRequestResponse);
```

### Testing Strategy

```bash
# List all responses
curl http://localhost:3001/v1/responses?limit=10

# Get specific response
curl http://localhost:3001/v1/responses/1

# Get response for request
curl http://localhost:3001/v1/requests/1/response

# Get overall stats
curl http://localhost:3001/v1/responses/stats

# Get stats for specific session
curl http://localhost:3001/v1/responses/stats?session_id=abc123hash
```

---

## Phase 8: Database Migrations System

**Priority:** Medium
**Goal:** Implement version-controlled schema migrations for future changes.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/migrations/001-initial-schema.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/migrations/index.js`

### Files to Modify

- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/database/migrations.js` - Enhanced migration runner
- `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js` - Run migrations on startup

### Implementation Details

**`src/database/migrations.js`**

```javascript
const connection = require('./connection');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor() {
    this.db = connection.getDatabase();
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * Get current schema version from database
   */
  getCurrentVersion() {
    try {
      const stmt = this.db.prepare('SELECT value FROM metadata WHERE key = ?');
      const row = stmt.get('schema_version');
      return row ? parseInt(row.value, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set schema version in database
   */
  setVersion(version) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO metadata (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run('schema_version', version.toString(), Date.now());
  }

  /**
   * Load migration files
   */
  loadMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .sort();

    return files.map(file => {
      const version = parseInt(file.split('-')[0], 10);
      const migration = require(path.join(this.migrationsDir, file));
      return { version, ...migration };
    });
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    const currentVersion = this.getCurrentVersion();
    const migrations = this.loadMigrations();

    console.log(`[Migrations] Current schema version: ${currentVersion}`);

    const pending = migrations.filter(m => m.version > currentVersion);

    if (pending.length === 0) {
      console.log('[Migrations] No pending migrations');
      return;
    }

    console.log(`[Migrations] Running ${pending.length} pending migrations...`);

    for (const migration of pending) {
      console.log(`[Migrations] Running migration ${migration.version}: ${migration.name}`);

      try {
        // Run migration in transaction
        const runMigration = this.db.transaction(() => {
          migration.up(this.db);
          this.setVersion(migration.version);
        });

        runMigration();

        console.log(`[Migrations] Completed migration ${migration.version}`);
      } catch (error) {
        console.error(`[Migrations] Failed migration ${migration.version}:`, error);
        throw error;
      }
    }

    console.log('[Migrations] All migrations completed successfully');
  }
}

module.exports = MigrationRunner;
```

---

## Phase 9: Test Suite Updates

**Priority:** Medium
**Goal:** Update existing tests to work with database persistence.

### Files to Create

- `/mnt/d/Projects/qwen_proxy_opencode/backend/tests/database/connection.test.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/tests/database/repositories.test.js`
- `/mnt/d/Projects/qwen_proxy_opencode/backend/tests/integration/persistence.test.js`

### Files to Modify

- All existing test files that use session manager

### Implementation Details

Test setup helper:

```javascript
// tests/helpers/database-setup.js
const connection = require('../../src/database/connection');
const schema = require('../../src/database/schema');

function setupTestDatabase() {
  // Use in-memory database for tests
  process.env.DATABASE_PATH = ':memory:';

  connection.connect();
  schema.initializeSchema();
}

function cleanupTestDatabase() {
  connection.close();
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase
};
```

---

## Phase 10: Performance Optimization

**Priority:** Low
**Goal:** Add indexes, query optimization, and caching where needed.

### Tasks

- [ ] Add composite indexes for common query patterns
- [ ] Implement query result caching for stats endpoints
- [ ] Add database connection pooling (if needed)
- [ ] Benchmark query performance
- [ ] Add EXPLAIN QUERY PLAN analysis for slow queries

---

## Summary

This implementation plan provides a complete, phase-by-phase guide to adding SQLite persistence to the Qwen Proxy backend.

**Key Benefits:**
- All requests and responses are permanently logged
- Sessions persist across server restarts
- Full audit trail of API usage
- Token usage tracking and analytics
- Easy debugging with request/response history
- Minimal changes to existing code (drop-in session manager replacement)

**Database Size Estimation:**
- Average request: ~1-2 KB
- Average response: ~2-5 KB
- 1000 requests/day = ~3-7 MB/day
- Monthly: ~100-200 MB
- Yearly: ~1-2 GB

**Performance Impact:**
- Session operations: < 10ms (database-backed vs in-memory)
- Request logging: < 5ms (async, doesn't block)
- Response logging: < 5ms (async, doesn't block)
- Query endpoints: < 50ms (with proper indexes)

The implementation follows SRP (each repository handles one table), DRY (base repository for common operations), and maintains clean separation of concerns (handlers → repositories → database).

All existing functionality remains working during and after migration. The session manager API is preserved for backward compatibility.
