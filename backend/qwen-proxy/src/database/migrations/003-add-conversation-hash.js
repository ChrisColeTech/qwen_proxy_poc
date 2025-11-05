/**
 * Migration 003: Add conversation_hash field
 *
 * Adds conversation_hash field to sessions table to enable lookup by
 * MD5 hash of (firstUser + firstAssistant) for conversation continuations.
 */

const migration = {
  version: 3,
  name: 'add-conversation-hash',

  up: (db) => {
    console.log('[Migration 003] Adding conversation_hash field...');

    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(sessions)").all();
    const columnExists = tableInfo.some(col => col.name === 'conversation_hash');

    if (!columnExists) {
      // Add conversation_hash column
      db.exec(`
        ALTER TABLE sessions
        ADD COLUMN conversation_hash TEXT
      `);
      console.log('[Migration 003] Added conversation_hash column');
    } else {
      console.log('[Migration 003] conversation_hash column already exists, skipping');
    }

    // Create index for fast lookup
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_conversation_hash
      ON sessions(conversation_hash)
    `);

    console.log('[Migration 003] ✓ Added conversation_hash field and index');
  },

  down: (db) => {
    console.log('[Migration 003] Removing conversation_hash field...');

    // Drop index
    db.exec(`DROP INDEX IF EXISTS idx_sessions_conversation_hash`);

    console.log('[Migration 003] ✓ Removed conversation_hash index');
    console.log('[Migration 003] Note: Column remains (SQLite limitation)');
  }
};

module.exports = migration;
