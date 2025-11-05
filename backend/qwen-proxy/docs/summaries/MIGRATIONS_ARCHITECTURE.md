# Database Migrations System - Architecture

Visual guide to understanding the migration system architecture and workflow.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Migration System                             │
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────┐    │
│  │   Server    │      │  CLI Tool    │      │  Migrations │    │
│  │   Startup   │      │ (migrate.js) │      │  Directory  │    │
│  └──────┬──────┘      └──────┬───────┘      └──────┬──────┘    │
│         │                    │                     │            │
│         │                    │                     │            │
│         └────────────────────┼─────────────────────┘            │
│                              │                                   │
│                              ▼                                   │
│                   ┌──────────────────────┐                       │
│                   │  MigrationRunner     │                       │
│                   │  (migrations.js)     │                       │
│                   └──────────┬───────────┘                       │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐    ┌────────────────┐    ┌─────────────┐     │
│  │   getCurrentVersion()    loadMigrations()   runMigrations()  │
│  │             │    │                │    │             │     │
│  │   Metadata  │    │   File System  │    │ Transaction │     │
│  └─────────────┘    └────────────────┘    └─────────────┘     │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   SQLite Database    │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ metadata table │  │
                    │  │ schema_version │  │
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ sessions table │  │
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ requests table │  │
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ responses table│  │
                    │  └────────────────┘  │
                    └──────────────────────┘
```

---

## Migration Workflow

### Startup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Server Startup Sequence                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Start   │
    │  Server  │
    └────┬─────┘
         │
         ▼
    ┌──────────────────┐
    │ initializeDatabase()
    └────┬─────────────┘
         │
         ├─► 1. Connect to database
         │   ✓ WAL mode enabled
         │   ✓ Foreign keys enabled
         │
         ├─► 2. Initialize schema
         │   ✓ Create tables if needed
         │   ✓ Set schema version = 1
         │
         └─► 3. Run migrations
             │
             ▼
        ┌────────────────────┐
        │ MigrationRunner    │
        │ .runMigrations()   │
        └────┬───────────────┘
             │
             ├─► Get current version (metadata table)
             │   Current: 1
             │
             ├─► Load migration files
             │   Found: [001, 002]
             │
             ├─► Filter pending migrations
             │   Pending: [002]
             │
             └─► Execute each migration
                 │
                 ▼
            ┌─────────────────────┐
            │ BEGIN TRANSACTION   │
            └─────────┬───────────┘
                      │
                      ├─► Run migration.up(db)
                      │   [Migration 002] Adding user_id column
                      │
                      ├─► Update version
                      │   metadata.schema_version = 2
                      │
                      └─► COMMIT
                          ✓ Success
```

### Manual Migration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Manual Migration via CLI                        │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │ node scripts/migrate.js
    │ [command]            │
    └──────┬───────────────┘
           │
           ├─► status
           │   │
           │   └─► Show current version
           │       Show migration list
           │       Show applied/pending
           │
           ├─► up
           │   │
           │   └─► Run pending migrations
           │       Update version
           │       Show summary
           │
           └─► down
               │
               └─► Rollback last migration
                   Decrease version
                   Show warning
```

---

## Migration File Structure

```
src/database/migrations/
├── 001-initial-schema.js
│   ├── name: "Initial Schema"
│   ├── version: 1
│   ├── up(db)   → Track initial schema
│   └── down(db) → Drop all tables
│
├── 002-add-user-field.js
│   ├── name: "Add user field"
│   ├── version: 2
│   ├── up(db)   → Add user_id column
│   └── down(db) → Drop index
│
└── 003-future-migration.js
    ├── name: "Future feature"
    ├── version: 3
    ├── up(db)   → Schema changes
    └── down(db) → Rollback changes
```

---

## Version Tracking Flow

```
┌────────────────────────────────────────────────────────────┐
│                   Version Tracking                          │
└────────────────────────────────────────────────────────────┘

Initial State:
┌──────────────────────┐
│ metadata table       │
│ schema_version = 0   │
└──────────────────────┘

After Schema Initialization:
┌──────────────────────┐
│ metadata table       │
│ schema_version = 1   │  ← Set by schema.js
└──────────────────────┘

After Migration 002:
┌──────────────────────┐
│ metadata table       │
│ schema_version = 2   │  ← Updated by MigrationRunner
└──────────────────────┘

After Migration 003:
┌──────────────────────┐
│ metadata table       │
│ schema_version = 3   │  ← Updated by MigrationRunner
└──────────────────────┘
```

---

## Transaction Safety

```
┌───────────────────────────────────────────────────────────┐
│              Transaction-Based Migration                   │
└───────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ BEGIN TRANSACTION   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ migration.up(db)    │  ─────┐
│ - ALTER TABLE       │       │
│ - CREATE INDEX      │       │ If error occurs:
│ - INSERT DATA       │       │ → ROLLBACK
└──────┬──────────────┘       │ → No changes applied
       │                      │ → Version unchanged
       ▼                      │
┌─────────────────────┐       │
│ setVersion(2)       │  ─────┘
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ COMMIT TRANSACTION  │
└─────────────────────┘
       │
       ▼
    ✓ Success
    All changes applied atomically
```

---

## Migration Discovery

```
┌───────────────────────────────────────────────────────────┐
│              Migration File Discovery                      │
└───────────────────────────────────────────────────────────┘

loadMigrations() {

  1. Read directory
     └─► src/database/migrations/
         ├── 001-initial-schema.js
         ├── 002-add-user-field.js
         └── 003-future-migration.js

  2. Filter .js files
     └─► Exclude: index.js, .test.js

  3. Sort by filename
     └─► Numerical order: 001, 002, 003

  4. Parse version from filename
     └─► "001-..." → version: 1
         "002-..." → version: 2
         "003-..." → version: 3

  5. Require each file
     └─► Load: { name, version, up, down }

  6. Return array
     └─► [
           { version: 1, name: "...", up, down },
           { version: 2, name: "...", up, down },
           { version: 3, name: "...", up, down }
         ]
}
```

---

## CLI Tool Architecture

```
┌───────────────────────────────────────────────────────────┐
│                 CLI Tool Structure                         │
└───────────────────────────────────────────────────────────┘

scripts/migrate.js
│
├─► Parse command-line arguments
│   └─► command = process.argv[2]
│
├─► Initialize database
│   └─► initializeDatabase()
│
├─► Create MigrationRunner
│   └─► runner = new MigrationRunner()
│
└─► Execute command
    │
    ├─► status
    │   └─► showStatus(runner)
    │       ├─► Get current version
    │       ├─► Load migrations
    │       └─► Display list
    │
    ├─► up
    │   └─► runMigrations(runner)
    │       ├─► Run pending
    │       ├─► Show progress
    │       └─► Display summary
    │
    └─► down
        └─► rollbackMigration(runner)
            ├─► Show warning
            ├─► Rollback last
            └─► Display result
```

---

## Data Flow

```
┌───────────────────────────────────────────────────────────┐
│                    Migration Data Flow                     │
└───────────────────────────────────────────────────────────┘

User Action:
  node scripts/migrate.js up

     ↓

CLI Tool:
  scripts/migrate.js
  ├─► Parse: command = "up"
  └─► Initialize

     ↓

Migration Runner:
  src/database/migrations.js
  ├─► getCurrentVersion() → 1
  ├─► loadMigrations() → [001, 002]
  └─► Filter pending → [002]

     ↓

Execute Migration:
  src/database/migrations/002-add-user-field.js
  ├─► BEGIN TRANSACTION
  ├─► up(db)
  │   ├─► Check if column exists
  │   ├─► ALTER TABLE sessions ADD COLUMN user_id
  │   └─► CREATE INDEX idx_sessions_user_id
  ├─► setVersion(2)
  └─► COMMIT

     ↓

Database:
  data/qwen_proxy.db
  ├─► sessions table updated
  ├─► Index created
  └─► metadata.schema_version = 2

     ↓

Response to User:
  ✓ Migration 002 completed
  Current version: 2
```

---

## Error Handling Flow

```
┌───────────────────────────────────────────────────────────┐
│                    Error Handling                          │
└───────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ BEGIN TRANSACTION   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ migration.up(db)    │
└──────┬──────────────┘
       │
       │  ❌ Error occurs
       │  (e.g., SQL syntax error)
       │
       ▼
┌─────────────────────┐
│ Catch Error         │
│ - Log error message │
│ - Log stack trace   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ROLLBACK            │
│ - Undo all changes  │
│ - Keep old version  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Exit with error     │
│ - Exit code 1       │
│ - Error message     │
└─────────────────────┘

Result:
  ✓ Database unchanged
  ✓ Version unchanged
  ✓ Safe to retry
```

---

## Idempotency Pattern

```
┌───────────────────────────────────────────────────────────┐
│                 Idempotent Migration                       │
└───────────────────────────────────────────────────────────┘

up(db) {

  Step 1: Check if change exists
  ┌───────────────────────────────────┐
  │ const info = db.prepare(          │
  │   "PRAGMA table_info(sessions)"   │
  │ ).all();                          │
  │                                   │
  │ const exists = info.some(         │
  │   col => col.name === 'user_id'   │
  │ );                                │
  └───────────┬───────────────────────┘
              │
              ▼
         ┌─────────┐
         │ exists? │
         └────┬────┘
              │
       ┌──────┴──────┐
       │             │
      NO            YES
       │             │
       ▼             ▼
  ┌─────────┐  ┌──────────────┐
  │ ADD     │  │ SKIP         │
  │ COLUMN  │  │ (already     │
  │         │  │  exists)     │
  └─────────┘  └──────────────┘

  Step 2: Create index (idempotent)
  ┌───────────────────────────────────┐
  │ db.exec(                          │
  │   'CREATE INDEX IF NOT EXISTS...' │
  │ );                                │
  └───────────────────────────────────┘
           ↓
      Always safe to run
}

Result: Safe to run multiple times
```

---

## Summary

The migration system provides:

1. **Version Control** - Track schema changes
2. **Automation** - Runs on startup
3. **Safety** - Transaction-based
4. **Flexibility** - Manual control via CLI
5. **Reliability** - Idempotent operations

All components work together to ensure safe, reliable database schema management.
