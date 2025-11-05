/**
 * Migration 002: Add User Field (Example)
 * Demonstrates how to add a new column to sessions table
 *
 * This is an example migration for future use.
 * It shows how to add a user_id field to track which user owns each session.
 */

module.exports = {
  name: 'Add user field to sessions',
  version: 2,

  /**
   * Apply migration
   * Adds user_id column and index to sessions table
   */
  up(db) {
    console.log('[Migration 002] Adding user_id column to sessions');

    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(sessions)").all();
    const columnExists = tableInfo.some(col => col.name === 'user_id');

    if (!columnExists) {
      // Add user_id column (nullable for backward compatibility)
      db.exec('ALTER TABLE sessions ADD COLUMN user_id TEXT');
      console.log('[Migration 002] Added user_id column');
    } else {
      console.log('[Migration 002] user_id column already exists, skipping');
    }

    // Create index for faster user-based queries
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');

    console.log('[Migration 002] Successfully added user_id field');
  },

  /**
   * Rollback migration
   * Note: SQLite has limited ALTER TABLE support
   * Cannot easily drop columns without recreating the table
   */
  down(db) {
    console.log('[Migration 002] Rolling back user_id column from sessions');
    console.warn('[Migration 002] WARNING: SQLite does not support DROP COLUMN easily');
    console.warn('[Migration 002] Manual intervention may be needed');

    // SQLite doesn't support DROP COLUMN directly
    // Would need to:
    // 1. Create new table without user_id
    // 2. Copy data from old table
    // 3. Drop old table
    // 4. Rename new table
    //
    // For simplicity, we'll just drop the index
    // and leave the column (it will be ignored)

    db.exec('DROP INDEX IF EXISTS idx_sessions_user_id');

    console.log('[Migration 002] Dropped user_id index (column remains but unused)');
    console.log('[Migration 002] To fully remove column, recreate sessions table manually');
  }
};
