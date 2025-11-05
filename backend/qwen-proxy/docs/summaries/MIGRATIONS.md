# Database Migrations Guide

**Version:** 1.0
**Last Updated:** 2025-10-29

This guide explains how to create, run, and manage database migrations for the Qwen Proxy backend SQLite database.

---

## Table of Contents

1. [Overview](#overview)
2. [Migration System Architecture](#migration-system-architecture)
3. [Running Migrations](#running-migrations)
4. [Creating New Migrations](#creating-new-migrations)
5. [Migration Naming Conventions](#migration-naming-conventions)
6. [Testing Migrations](#testing-migrations)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The migration system provides version-controlled database schema changes. It tracks which migrations have been applied and ensures migrations run in the correct order.

**Key Features:**
- Version-controlled schema changes
- Automatic migration tracking
- Transaction-based migrations (atomic)
- Forward (up) and backward (down) migrations
- CLI tool for easy management
- Automatic execution on server startup

---

## Migration System Architecture

### Components

```
backend/
├── src/
│   └── database/
│       ├── migrations.js              # Migration runner
│       ├── schema.js                  # Initial schema
│       └── migrations/                # Migration files
│           ├── 001-initial-schema.js
│           └── 002-add-user-field.js
└── scripts/
    └── migrate.js                     # CLI tool
```

### How It Works

1. **Schema Version Tracking**: Current version stored in `metadata` table
2. **Migration Discovery**: Loads migration files from `src/database/migrations/`
3. **Sequential Execution**: Runs migrations in numerical order
4. **Atomic Transactions**: Each migration runs in a transaction
5. **Version Updates**: Updates schema version after each successful migration

---

## Running Migrations

### Check Migration Status

```bash
node scripts/migrate.js status
```

**Output:**
```
=================================
Database Migration Status
=================================

Current schema version: 1

Available migrations:

  ✓ Applied v1: Initial Schema (current)
  ○ Pending v2: Add user field to sessions

---------------------------------
Applied: 1
Pending: 1
=================================
```

### Run Pending Migrations

```bash
node scripts/migrate.js up
```

This will:
1. Connect to the database
2. Check current schema version
3. Find all pending migrations
4. Run each migration in order
5. Update schema version after each one
6. Display summary

### Rollback Last Migration (Development Only!)

```bash
node scripts/migrate.js down
```

**⚠️ WARNING:** Only use this in development! Rolling back in production can cause data loss.

### Automatic Migrations on Startup

Migrations run automatically when the server starts:

```javascript
// src/index.js
await initializeDatabase(); // Runs migrations automatically
```

---

## Creating New Migrations

### Step 1: Create Migration File

Create a new file in `src/database/migrations/` with the naming pattern:

```
<version>-<description>.js
```

Example: `003-add-api-keys-table.js`

### Step 2: Define Migration Structure

```javascript
/**
 * Migration 003: Add API Keys Table
 * Adds a table to store API keys for authentication
 */

module.exports = {
  name: 'Add API keys table',
  version: 3,

  /**
   * Apply migration (forward)
   */
  up(db) {
    console.log('[Migration 003] Creating api_keys table');

    // Create table
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        name TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        last_used INTEGER
      )
    `);

    // Create indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at)');

    console.log('[Migration 003] Successfully created api_keys table');
  },

  /**
   * Rollback migration (backward)
   */
  down(db) {
    console.log('[Migration 003] Dropping api_keys table');

    db.exec('DROP TABLE IF EXISTS api_keys');

    console.log('[Migration 003] Successfully dropped api_keys table');
  }
};
```

### Step 3: Test Migration

```bash
# Check status
node scripts/migrate.js status

# Run migration
node scripts/migrate.js up

# Verify database schema
sqlite3 data/qwen_proxy.db ".schema api_keys"
```

### Step 4: Commit Migration File

```bash
git add src/database/migrations/003-add-api-keys-table.js
git commit -m "Add migration: API keys table"
```

---

## Migration Naming Conventions

### File Naming

**Format:** `<version>-<description>.js`

**Rules:**
- Version must be a 3-digit number (001, 002, 003, etc.)
- Use kebab-case for description
- Keep description concise but descriptive
- Extension must be `.js`

**Examples:**
- ✅ `001-initial-schema.js`
- ✅ `002-add-user-field.js`
- ✅ `003-add-api-keys-table.js`
- ✅ `004-add-usage-tracking.js`
- ❌ `1-initial.js` (version too short)
- ❌ `002-AddUserField.js` (PascalCase instead of kebab-case)
- ❌ `003_add_api_keys.js` (underscore instead of hyphen)

### Migration Module Structure

**Required exports:**
- `name` (string): Human-readable name
- `version` (number): Migration version
- `up(db)` (function): Forward migration
- `down(db)` (function): Backward migration (optional but recommended)

---

## Testing Migrations

### Local Testing

1. **Backup Database:**
   ```bash
   cp data/qwen_proxy.db data/qwen_proxy.db.backup
   ```

2. **Run Migration:**
   ```bash
   node scripts/migrate.js up
   ```

3. **Verify Schema:**
   ```bash
   sqlite3 data/qwen_proxy.db ".schema"
   ```

4. **Test Rollback:**
   ```bash
   node scripts/migrate.js down
   ```

5. **Restore if Needed:**
   ```bash
   cp data/qwen_proxy.db.backup data/qwen_proxy.db
   ```

### Test Migration with Code

```javascript
// test-migration.js
const { initializeDatabase, MigrationRunner } = require('./src/database');

async function testMigration() {
  // Use test database
  process.env.DATABASE_PATH = './data/test.db';

  await initializeDatabase();

  const runner = new MigrationRunner();
  await runner.runMigrations();

  console.log('Current version:', runner.getCurrentVersion());
}

testMigration();
```

### Automated Tests

```javascript
// tests/database/migrations.test.js
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { initializeDatabase, MigrationRunner } = require('../../src/database');

describe('Migrations', () => {
  before(async () => {
    process.env.DATABASE_PATH = ':memory:';
    await initializeDatabase();
  });

  it('should run all migrations successfully', async () => {
    const runner = new MigrationRunner();
    await runner.runMigrations();

    const version = runner.getCurrentVersion();
    expect(version).to.be.greaterThan(0);
  });

  it('should track schema version correctly', async () => {
    const runner = new MigrationRunner();
    const migrations = runner.loadMigrations();
    const lastVersion = migrations[migrations.length - 1].version;

    expect(runner.getCurrentVersion()).to.equal(lastVersion);
  });
});
```

---

## Rollback Procedures

### Development Rollback

```bash
# Rollback last migration
node scripts/migrate.js down

# Verify
node scripts/migrate.js status
```

### Production Rollback

**⚠️ CAUTION:** Production rollbacks can cause data loss!

**Steps:**

1. **Create Database Backup:**
   ```bash
   cp data/qwen_proxy.db data/qwen_proxy.db.pre-rollback
   ```

2. **Stop Application:**
   ```bash
   pm2 stop qwen-proxy
   ```

3. **Rollback Migration:**
   ```bash
   node scripts/migrate.js down
   ```

4. **Verify Database:**
   ```bash
   sqlite3 data/qwen_proxy.db ".schema"
   ```

5. **Restart Application:**
   ```bash
   pm2 start qwen-proxy
   ```

6. **Monitor Logs:**
   ```bash
   pm2 logs qwen-proxy
   ```

### SQLite Rollback Limitations

SQLite has limited `ALTER TABLE` support:

**Supported:**
- ✅ ADD COLUMN
- ✅ RENAME TABLE
- ✅ RENAME COLUMN (SQLite 3.25.0+)

**Not Supported:**
- ❌ DROP COLUMN
- ❌ MODIFY COLUMN TYPE
- ❌ ADD/DROP CONSTRAINTS

**Workaround for DROP COLUMN:**

```javascript
down(db) {
  // 1. Create new table without the column
  db.exec(`CREATE TABLE sessions_new AS SELECT
    id, chat_id, parent_id, first_user_message,
    message_count, created_at, last_accessed, expires_at
    FROM sessions`);

  // 2. Drop old table
  db.exec('DROP TABLE sessions');

  // 3. Rename new table
  db.exec('ALTER TABLE sessions_new RENAME TO sessions');

  // 4. Recreate indexes
  db.exec('CREATE INDEX idx_sessions_expires_at ON sessions(expires_at)');
}
```

---

## Best Practices

### 1. Keep Migrations Small and Focused

**✅ Good:**
```javascript
// 005-add-rate-limiting.js
module.exports = {
  name: 'Add rate limiting fields',
  up(db) {
    db.exec('ALTER TABLE sessions ADD COLUMN request_count INTEGER DEFAULT 0');
    db.exec('ALTER TABLE sessions ADD COLUMN last_request INTEGER');
  }
};
```

**❌ Bad:**
```javascript
// 005-multiple-changes.js
module.exports = {
  name: 'Add many things',
  up(db) {
    // Creates 5 tables, adds 10 columns, changes indexes
    // Too many changes in one migration!
  }
};
```

### 2. Always Provide Down Migration

Even if rollback is complex, document what needs to be done:

```javascript
down(db) {
  console.log('[Migration] To rollback this migration:');
  console.log('1. Backup database: cp db.sqlite db.backup');
  console.log('2. Drop new_table: DROP TABLE new_table');
  console.log('3. Recreate old schema manually');
  throw new Error('Manual rollback required');
}
```

### 3. Use Transactions

The migration runner automatically wraps each migration in a transaction, but you can use nested transactions if needed:

```javascript
up(db) {
  const createTable = db.transaction(() => {
    db.exec('CREATE TABLE foo (...)');
    db.exec('CREATE INDEX ...');
  });

  createTable();
}
```

### 4. Test with Real Data

Before deploying:

1. Copy production database (anonymized)
2. Run migration locally
3. Verify data integrity
4. Test application functionality

### 5. Make Migrations Idempotent

Use `IF NOT EXISTS` / `IF EXISTS`:

```javascript
up(db) {
  db.exec('CREATE TABLE IF NOT EXISTS api_keys (...)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ...');
}

down(db) {
  db.exec('DROP INDEX IF EXISTS idx_api_keys_user_id');
  db.exec('DROP TABLE IF EXISTS api_keys');
}
```

### 6. Add Data Migrations Carefully

When migrating data:

```javascript
up(db) {
  // 1. Add new column
  db.exec('ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT "active"');

  // 2. Update existing rows (with WHERE clause for safety)
  const stmt = db.prepare('UPDATE sessions SET status = ? WHERE expires_at > ?');
  stmt.run('active', Date.now());

  // 3. Log results
  console.log(`Updated ${stmt.changes} rows`);
}
```

### 7. Document Complex Migrations

```javascript
/**
 * Migration 010: Restructure Sessions Table
 *
 * Changes:
 * - Splits sessions table into sessions and session_metadata
 * - Moves first_user_message to metadata table
 * - Adds session_type field (chat, embedding, etc.)
 *
 * Data Migration:
 * - Copies existing sessions to new structure
 * - Preserves all existing data
 *
 * Rollback:
 * - Requires manual intervention
 * - Backup recommended before rollback
 *
 * Breaking Changes:
 * - Session queries must join metadata table
 * - Update SessionRepository accordingly
 */
```

---

## Common Patterns

### Adding a Column

```javascript
module.exports = {
  name: 'Add email to sessions',
  version: 4,

  up(db) {
    db.exec('ALTER TABLE sessions ADD COLUMN email TEXT');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email)');
  },

  down(db) {
    // SQLite limitation: Can't drop column easily
    db.exec('DROP INDEX IF EXISTS idx_sessions_email');
    console.log('Column remains (SQLite limitation)');
  }
};
```

### Creating a New Table

```javascript
module.exports = {
  name: 'Add audit log table',
  version: 5,

  up(db) {
    db.exec(`
      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        details TEXT
      )
    `);

    db.exec('CREATE INDEX idx_audit_user_id ON audit_logs(user_id)');
    db.exec('CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp)');
  },

  down(db) {
    db.exec('DROP TABLE IF EXISTS audit_logs');
  }
};
```

### Modifying Indexes

```javascript
module.exports = {
  name: 'Optimize session queries',
  version: 6,

  up(db) {
    // Add composite index for common query
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at)');
  },

  down(db) {
    db.exec('DROP INDEX IF EXISTS idx_sessions_user_expires');
  }
};
```

### Data Migration

```javascript
module.exports = {
  name: 'Normalize model names',
  version: 7,

  up(db) {
    const stmt = db.prepare('UPDATE requests SET model = ? WHERE model = ?');

    // Normalize model names
    stmt.run('qwen-turbo', 'qwen3-turbo');
    stmt.run('qwen-plus', 'qwen3-plus');
    stmt.run('qwen-max', 'qwen3-max');

    console.log(`Updated ${stmt.changes} records`);
  },

  down(db) {
    // Reverse normalization
    const stmt = db.prepare('UPDATE requests SET model = ? WHERE model = ?');
    stmt.run('qwen3-turbo', 'qwen-turbo');
    stmt.run('qwen3-plus', 'qwen-plus');
    stmt.run('qwen3-max', 'qwen-max');
  }
};
```

---

## Troubleshooting

### Migration Version Conflicts

**Problem:** Schema version is ahead of migration files

```
Current schema version: 5
Latest migration file: 003-...
```

**Solution:**
1. Check if migration files are missing
2. Verify correct migrations directory
3. Reset version if needed (development only):
   ```javascript
   const { getDatabase } = require('./src/database');
   const db = getDatabase();
   db.prepare('UPDATE metadata SET value = ? WHERE key = ?').run('3', 'schema_version');
   ```

### Migration File Not Found

**Problem:** `Migration X not found` during rollback

**Solution:**
- Ensure migration file exists in `src/database/migrations/`
- Check file naming convention
- Verify file is not corrupted

### Transaction Failed

**Problem:** Migration fails mid-transaction

**Solution:**
- Check SQL syntax
- Verify table/column names
- Test migration on copy of database
- Transaction automatically rolls back on error

### SQLite Busy/Locked

**Problem:** `database is locked` error

**Solution:**
```javascript
// Increase busy timeout
const db = connection.getDatabase();
db.pragma('busy_timeout = 5000'); // 5 seconds
```

### Permission Denied

**Problem:** Cannot write to database file

**Solution:**
```bash
# Check permissions
ls -l data/qwen_proxy.db

# Fix permissions
chmod 644 data/qwen_proxy.db
chown <user>:<group> data/qwen_proxy.db
```

---

## Summary

The migration system provides safe, version-controlled database schema changes. Key points:

- ✅ Migrations run automatically on startup
- ✅ Use CLI tool for manual control
- ✅ Always test migrations before production
- ✅ Keep migrations small and focused
- ✅ Always provide down migrations
- ✅ Be aware of SQLite limitations
- ⚠️ Backup before production rollbacks

For questions or issues, refer to the implementation plan or contact the development team.

---

**Related Documentation:**
- [SQLite Persistence Implementation Plan](/mnt/d/Projects/qwen_proxy/docs/SQLITE_PERSISTENCE_IMPLEMENTATION_PLAN.md)
- [Database Schema Documentation](/mnt/d/Projects/qwen_proxy/backend/src/database/schema.js)
- [Persistence Quick Start](/mnt/d/Projects/qwen_proxy/backend/docs/PERSISTENCE_QUICK_START.md)
