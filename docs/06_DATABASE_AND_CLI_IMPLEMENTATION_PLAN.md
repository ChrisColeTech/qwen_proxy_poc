# Database and CLI Implementation Plan

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | HIGH | ✅ Complete | Database setup and schema design |
| Phase 2 | HIGH | ✅ Complete | Database service layer and connection management |
| Phase 3 | HIGH | ✅ Complete | Provider settings persistence |
| Phase 4 | HIGH | ✅ Complete | Request/Response logging to database |
| Phase 5 | MEDIUM | ✅ Complete | CLI tool foundation and command structure |
| Phase 6 | MEDIUM | ✅ Complete | CLI provider management commands |
| Phase 7 | LOW | ✅ Complete | CLI query and reporting commands |
| Phase 8 | LOW | Not Started | Testing and validation |

---

## Overview

This plan extends the Provider Router with persistent storage and CLI management capabilities.

**Key Requirements:**
- SQLite database for all persistent data
- Store current provider selection in database
- Log all API requests and responses to database
- CLI tool to manage provider settings without editing .env
- Query capabilities for request/response history
- No server restarts required to change providers

**Why This Matters:**
- Provider selection persists across server restarts
- Complete audit trail of all requests/responses
- Easy provider switching via CLI without editing files
- Historical analysis of provider usage and performance
- Foundation for future analytics and monitoring features

---

## Architecture Decisions

### Database Choice

**Technology:** SQLite with better-sqlite3 driver

**Why:**
- Zero configuration - no separate database server
- Fast and reliable for single-server deployment
- Supports concurrent reads, serialized writes
- Perfect for logging and configuration data
- Native JSON support for request/response storage
- ACID compliant

**Alternatives Considered:**
- PostgreSQL: Overkill for this use case, requires separate server
- JSON file storage: Not transactional, slower queries, no concurrency
- In-memory only: Loses data on restart

### Data Model Design

**Schema Strategy:**
- Separate tables for configuration vs. logs (SRP)
- Use indexes on frequently queried columns (timestamp, provider)
- Store full JSON payloads for requests/responses (flexibility)
- Immutable logging (append-only, no updates to logs)

**Why:**
- Configuration changes are rare, logs are frequent
- Full JSON preserves all details for debugging
- Indexes optimize common queries
- Append-only prevents data tampering

### CLI Architecture

**Pattern:** Command-based CLI with subcommands

**Structure:**
```
provider-cli <command> [options]
  status              Show current provider
  set <provider>      Set active provider
  list                List available providers
  test [provider]     Test provider connectivity
  history             Show request history
  stats               Show usage statistics
```

**Why:**
- Industry standard pattern (git, docker, npm style)
- Easy to extend with new commands
- Self-documenting with --help flags
- Works well for both interactive and scripted use

---

## Project Structure

```
backend/provider-router/
├── src/
│   ├── database/
│   │   ├── schema.sql               # Database schema definition
│   │   ├── connection.js            # Database connection manager
│   │   ├── migrations.js            # Schema migrations
│   │   └── services/
│   │       ├── settings-service.js  # Provider settings CRUD
│   │       └── logs-service.js      # Request/response logging
│   ├── cli/
│   │   ├── index.js                 # CLI entry point
│   │   ├── commands/
│   │   │   ├── status.js            # Show current provider
│   │   │   ├── set.js               # Set provider
│   │   │   ├── list.js              # List providers
│   │   │   ├── test.js              # Test provider
│   │   │   ├── history.js           # Request history
│   │   │   └── stats.js             # Usage stats
│   │   └── utils/
│   │       ├── table-formatter.js   # Format output as tables
│   │       └── colors.js            # Terminal colors
│   ├── middleware/
│   │   └── database-logger.js       # Log requests to DB
│   ├── router/
│   │   └── provider-router.js       # Modified to read from DB
│   └── config.js                    # Modified for DB integration
├── data/
│   └── provider-router.db           # SQLite database file
├── bin/
│   └── provider-cli.js              # CLI executable
├── package.json                     # Updated with CLI bin
└── README.md                        # Updated documentation
```

---

## Phase 1: Database Setup and Schema Design

**Priority:** HIGH

**Goal:** Establish database foundation with schema, migrations, and connection management.

### Files to Create

1. **`src/database/schema.sql`** - Database schema definition
2. **`src/database/connection.js`** - Database connection manager
3. **`src/database/migrations.js`** - Migration system
4. **`data/.gitkeep`** - Ensure data directory exists

### Files to Modify

- `.gitignore` - Add `data/*.db` to ignore database files
- `package.json` - Add `better-sqlite3` dependency

### Integration Points

None (foundational phase)

### Implementation Details

#### Database Schema (schema.sql)

```sql
-- Settings table: stores key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Request logs table: stores all API requests
CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_body TEXT,  -- JSON
    response_body TEXT, -- JSON
    status_code INTEGER,
    duration_ms INTEGER,
    error TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_request_logs_provider ON request_logs(provider);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);

-- Initialize default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('active_provider', 'lm-studio');
```

#### Connection Manager (connection.js)

```javascript
/**
 * Database Connection Manager
 * Singleton pattern for SQLite connection
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_DIR = join(__dirname, '../../data')
const DB_PATH = join(DB_DIR, 'provider-router.db')
const SCHEMA_PATH = join(__dirname, 'schema.sql')

let db = null

/**
 * Initialize database connection
 */
export function initDatabase() {
  if (db) return db

  try {
    // Ensure data directory exists
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true })
      logger.info('Created data directory')
    }

    // Connect to database
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL') // Better concurrency
    db.pragma('foreign_keys = ON')  // Enforce foreign keys

    logger.info(`Database connected: ${DB_PATH}`)

    // Run schema
    const schema = readFileSync(SCHEMA_PATH, 'utf8')
    db.exec(schema)
    logger.info('Database schema initialized')

    return db
  } catch (error) {
    logger.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * Get database connection
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    logger.info('Database connection closed')
  }
}

export default { initDatabase, getDatabase, closeDatabase }
```

### Validation

- Database file created in `data/` directory
- Schema tables created successfully
- Default setting for `active_provider` inserted
- Connection manager throws error if used before initialization
- WAL mode enabled for better concurrency
- Foreign keys enabled

---

## Phase 2: Database Service Layer

**Priority:** HIGH

**Goal:** Create service classes for settings and logs with clean CRUD APIs.

### Files to Create

1. **`src/database/services/settings-service.js`** - Provider settings management
2. **`src/database/services/logs-service.js`** - Request/response logging
3. **`src/database/services/index.js`** - Service exports

### Files to Modify

None

### Integration Points

- `src/database/connection.js` - Uses database connection

### Implementation Details

#### Settings Service

```javascript
/**
 * Settings Service
 * Manages key-value configuration in database
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class SettingsService {
  /**
   * Get setting by key
   */
  static get(key) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key)
    return row ? row.value : null
  }

  /**
   * Set setting value
   */
  static set(key, value) {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    stmt.run(key, value)
    logger.info(`Setting updated: ${key} = ${value}`)
  }

  /**
   * Get active provider
   */
  static getActiveProvider() {
    return this.get('active_provider') || 'lm-studio'
  }

  /**
   * Set active provider
   */
  static setActiveProvider(provider) {
    this.set('active_provider', provider)
  }

  /**
   * Get all settings
   */
  static getAll() {
    const db = getDatabase()
    const stmt = db.prepare('SELECT key, value, updated_at FROM settings')
    const rows = stmt.all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }
}
```

#### Logs Service

```javascript
/**
 * Logs Service
 * Manages request/response logging
 */

import { getDatabase } from '../connection.js'
import { logger } from '../../utils/logger.js'

export class LogsService {
  /**
   * Create new request log
   */
  static create(logData) {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO request_logs (
        request_id, provider, endpoint, method,
        request_body, response_body, status_code,
        duration_ms, error, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `)

    const info = stmt.run(
      logData.request_id,
      logData.provider,
      logData.endpoint,
      logData.method,
      logData.request_body ? JSON.stringify(logData.request_body) : null,
      logData.response_body ? JSON.stringify(logData.response_body) : null,
      logData.status_code || null,
      logData.duration_ms || null,
      logData.error || null
    )

    return info.lastInsertRowid
  }

  /**
   * Get recent logs
   */
  static getRecent(limit = 50) {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM request_logs
      ORDER BY created_at DESC
      LIMIT ?
    `)
    return stmt.all(limit).map(this.parseLog)
  }

  /**
   * Get logs by provider
   */
  static getByProvider(provider, limit = 50) {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM request_logs
      WHERE provider = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)
    return stmt.all(provider, limit).map(this.parseLog)
  }

  /**
   * Get statistics
   */
  static getStats() {
    const db = getDatabase()
    return {
      total: db.prepare('SELECT COUNT(*) as count FROM request_logs').get().count,
      byProvider: db.prepare(`
        SELECT provider, COUNT(*) as count
        FROM request_logs
        GROUP BY provider
      `).all(),
      avgDuration: db.prepare(`
        SELECT provider, AVG(duration_ms) as avg_ms
        FROM request_logs
        WHERE duration_ms IS NOT NULL
        GROUP BY provider
      `).all()
    }
  }

  /**
   * Parse log row (convert JSON strings back to objects)
   */
  static parseLog(row) {
    return {
      ...row,
      request_body: row.request_body ? JSON.parse(row.request_body) : null,
      response_body: row.response_body ? JSON.parse(row.response_body) : null,
    }
  }
}
```

### Validation

- SettingsService can get/set values
- Active provider can be retrieved and updated
- LogsService can create logs and retrieve them
- Stats calculation works correctly
- JSON parsing/serialization works for request/response bodies

---

## Phase 3: Provider Settings Persistence

**Priority:** HIGH

**Goal:** Modify router to read active provider from database instead of config file.

### Files to Create

None

### Files to Modify

1. **`src/router/provider-router.js`** - Read provider from database
2. **`src/config.js`** - Remove MODEL_MAPPINGS, keep DEFAULT_PROVIDER as fallback
3. **`src/index.js`** - Initialize database on startup

### Integration Points

- `src/database/services/settings-service.js` - Read active provider
- `src/providers/index.js` - Get provider by name

### Implementation Details

#### Modified provider-router.js

```javascript
import { SettingsService } from '../database/services/settings-service.js'

export class ProviderRouter {
  async route(request, stream = false) {
    // Get active provider from database
    const providerName = SettingsService.getActiveProvider()
    logger.info(`Routing request to provider: ${providerName}`)

    const provider = getProvider(providerName)
    const transformedRequest = provider.transformRequest(request)
    const response = await provider.chatCompletion(transformedRequest, stream)

    if (!stream) {
      return provider.transformResponse(response)
    }
    return response
  }

  async listModels(providerName = null) {
    // Use specified provider or active provider
    const activeProvider = providerName || SettingsService.getActiveProvider()
    const provider = getProvider(activeProvider)
    return provider.listModels()
  }
}
```

#### Modified config.js

Remove `modelMappings` and `getProviderForModel()` - no longer needed.

Keep `DEFAULT_PROVIDER` as a fallback if database value is missing.

### Validation

- Server reads active provider from database on each request
- Changing database value changes routing immediately (no restart)
- Falls back to DEFAULT_PROVIDER if database read fails
- Logs show provider selection from database

---

## Phase 4: Request/Response Logging to Database

**Priority:** HIGH

**Goal:** Log all API requests and responses to database for audit trail.

### Files to Create

1. **`src/middleware/database-logger.js`** - Middleware to log requests to DB

### Files to Modify

1. **`src/server.js`** - Add database logger middleware
2. **`src/middleware/request-logger.js`** - Generate and attach request ID

### Integration Points

- `src/database/services/logs-service.js` - Save logs
- Existing request-logger middleware - Generates request IDs

### Implementation Details

#### Database Logger Middleware

```javascript
/**
 * Database Logger Middleware
 * Logs all requests and responses to database
 */

import { LogsService } from '../database/services/logs-service.js'
import { SettingsService } from '../database/services/settings-service.js'
import { logger } from '../utils/logger.js'

export default function databaseLogger(req, res, next) {
  const startTime = Date.now()

  // Capture request details
  const logData = {
    request_id: req.requestId, // Set by request-logger middleware
    provider: SettingsService.getActiveProvider(),
    endpoint: req.path,
    method: req.method,
    request_body: req.body,
  }

  // Capture original res.json and res.send
  const originalJson = res.json.bind(res)
  const originalSend = res.send.bind(res)

  // Override res.json
  res.json = function(body) {
    logData.response_body = body
    logData.status_code = res.statusCode
    logData.duration_ms = Date.now() - startTime
    saveLog(logData)
    return originalJson(body)
  }

  // Override res.send
  res.send = function(body) {
    if (typeof body === 'object') {
      logData.response_body = body
    }
    logData.status_code = res.statusCode
    logData.duration_ms = Date.now() - startTime
    saveLog(logData)
    return originalSend(body)
  }

  // Handle errors
  res.on('finish', () => {
    if (!logData.status_code) {
      logData.status_code = res.statusCode
      logData.duration_ms = Date.now() - startTime
      saveLog(logData)
    }
  })

  next()
}

function saveLog(logData) {
  try {
    LogsService.create(logData)
  } catch (error) {
    logger.error('Failed to save request log to database:', error)
  }
}
```

### Validation

- All requests logged to database
- Request and response bodies captured
- Duration and status code recorded
- Works with both JSON and streaming responses
- Errors don't crash the server

---

## Phase 5: CLI Tool Foundation

**Priority:** MEDIUM

**Goal:** Create CLI executable with argument parsing and command structure.

### Files to Create

1. **`src/cli/index.js`** - CLI entry point
2. **`src/cli/utils/table-formatter.js`** - Format output as tables
3. **`src/cli/utils/colors.js`** - Terminal colors
4. **`bin/provider-cli.js`** - Executable wrapper

### Files to Modify

1. **`package.json`** - Add bin entry, add commander dependency

### Integration Points

None (CLI foundation)

### Implementation Details

#### CLI Entry Point

```javascript
#!/usr/bin/env node
/**
 * Provider CLI
 * Command-line interface for managing provider settings
 */

import { Command } from 'commander'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
)

const program = new Command()

program
  .name('provider-cli')
  .description('CLI tool for managing LLM provider settings')
  .version(packageJson.version)

// Commands will be added in Phase 6

program.parse()
```

#### Package.json bin entry

```json
{
  "bin": {
    "provider-cli": "./bin/provider-cli.js"
  },
  "dependencies": {
    "commander": "^11.0.0"
  }
}
```

### Validation

- `provider-cli --version` shows version
- `provider-cli --help` shows help
- CLI executable installed with `npm install`
- Command structure ready for subcommands

---

## Phase 6: CLI Provider Management Commands

**Priority:** MEDIUM

**Goal:** Implement CLI commands for viewing and changing provider settings.

### Files to Create

1. **`src/cli/commands/status.js`** - Show current provider
2. **`src/cli/commands/set.js`** - Set active provider
3. **`src/cli/commands/list.js`** - List available providers
4. **`src/cli/commands/test.js`** - Test provider connectivity

### Files to Modify

1. **`src/cli/index.js`** - Register commands

### Integration Points

- `src/database/services/settings-service.js` - Read/write settings
- `src/providers/index.js` - Get providers
- `src/database/connection.js` - Database access

### Implementation Details

Commands will use database services to read/write settings and interact with providers.

### Validation

- `provider-cli status` shows current provider
- `provider-cli set lm-studio` changes provider
- `provider-cli list` shows all providers
- `provider-cli test` checks provider health

---

## Phase 7: CLI Query and Reporting Commands

**Priority:** LOW

**Goal:** Add commands for querying request history and statistics.

### Files to Create

1. **`src/cli/commands/history.js`** - Show request history
2. **`src/cli/commands/stats.js`** - Show usage statistics

### Files to Modify

1. **`src/cli/index.js`** - Register commands

### Integration Points

- `src/database/services/logs-service.js` - Query logs

### Validation

- `provider-cli history` shows recent requests
- `provider-cli stats` shows usage statistics

---

## Phase 8: Testing and Validation

**Priority:** LOW

**Goal:** Comprehensive testing of database and CLI functionality.

### Files to Create

- `tests/integration/database.test.js`
- `tests/integration/cli.test.js`

### Validation

- All database operations tested
- All CLI commands tested
- Integration tests pass
- Documentation updated

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-30
- **Status:** APPROVED - Ready for Implementation

---

**This implementation plan provides complete specifications for adding persistent storage and CLI management to the Provider Router.**
