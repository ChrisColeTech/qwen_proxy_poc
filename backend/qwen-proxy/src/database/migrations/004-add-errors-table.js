/**
 * Migration 004: Add errors table
 *
 * Creates errors table for comprehensive error logging and tracking.
 * Captures all types of errors (HTTP, streaming, API, database) with full context.
 */

const migration = {
  version: 4,
  name: 'add-errors-table',

  up: (db) => {
    console.log('[Migration 004] Creating errors table...');

    // Create errors table
    db.exec(`
      CREATE TABLE IF NOT EXISTS errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_id TEXT NOT NULL UNIQUE,
        timestamp INTEGER NOT NULL,
        error_type TEXT NOT NULL,
        error_code TEXT,
        error_message TEXT NOT NULL,
        stack_trace TEXT,

        session_id TEXT,
        request_id INTEGER,
        endpoint TEXT,
        method TEXT,
        user_agent TEXT,

        request_payload TEXT,
        response_payload TEXT,

        severity TEXT NOT NULL,
        resolved BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,

        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
      )
    `);
    console.log('[Migration 004] ✓ Errors table created');

    // Create indexes for efficient querying
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_errors_error_type ON errors(error_type)',
      'CREATE INDEX IF NOT EXISTS idx_errors_session_id ON errors(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_errors_request_id ON errors(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_errors_severity ON errors(severity)',
      'CREATE INDEX IF NOT EXISTS idx_errors_resolved ON errors(resolved)',
      'CREATE INDEX IF NOT EXISTS idx_errors_error_id ON errors(error_id)'
    ];

    indexes.forEach(indexSql => {
      db.exec(indexSql);
    });
    console.log('[Migration 004] ✓ Created 7 indexes for errors table');

    console.log('[Migration 004] ✓ Migration completed successfully');
  },

  down: (db) => {
    console.log('[Migration 004] Removing errors table...');

    // Drop indexes
    const indexes = [
      'DROP INDEX IF EXISTS idx_errors_timestamp',
      'DROP INDEX IF EXISTS idx_errors_error_type',
      'DROP INDEX IF EXISTS idx_errors_session_id',
      'DROP INDEX IF EXISTS idx_errors_request_id',
      'DROP INDEX IF EXISTS idx_errors_severity',
      'DROP INDEX IF EXISTS idx_errors_resolved',
      'DROP INDEX IF EXISTS idx_errors_error_id'
    ];

    indexes.forEach(indexSql => {
      db.exec(indexSql);
    });

    // Drop table
    db.exec('DROP TABLE IF EXISTS errors');

    console.log('[Migration 004] ✓ Errors table and indexes removed');
  }
};

module.exports = migration;
