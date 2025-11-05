/**
 * Database Migration Runner
 *
 * Manages database schema migrations
 */

const path = require('path');
const fs = require('fs');
const { getSchemaVersion, setSchemaVersion } = require('../schema');
const connection = require('../connection');

class MigrationRunner {
  /**
   * Get all available migrations
   */
  getMigrations() {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir);

    const migrations = files
      .filter(file => file.match(/^\d{3}-.*\.js$/) && file !== 'index.js')
      .map(file => {
        const migration = require(path.join(migrationsDir, file));
        return {
          ...migration,
          filename: file
        };
      })
      .sort((a, b) => a.version - b.version);

    return migrations;
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    const db = connection.getDatabase();
    const currentVersion = getSchemaVersion();
    const migrations = this.getMigrations();

    console.log(`[Migrations] Current schema version: ${currentVersion}`);

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('[Migrations] No pending migrations');
      return;
    }

    console.log(`[Migrations] Running ${pendingMigrations.length} pending migration(s)...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`[Migrations] Running: ${migration.name} (v${migration.version})`);
        migration.up(db);
        setSchemaVersion(migration.version);
        console.log(`[Migrations] ✓ Completed: ${migration.name}`);
      } catch (error) {
        console.error(`[Migrations] ✗ Failed: ${migration.name}`, error);
        throw error;
      }
    }

    console.log('[Migrations] All migrations completed successfully');
  }

  /**
   * Rollback the last migration
   */
  async rollbackMigration() {
    const db = connection.getDatabase();
    const currentVersion = getSchemaVersion();

    if (currentVersion === 0) {
      console.log('[Migrations] No migrations to rollback');
      return;
    }

    const migrations = this.getMigrations();
    const migration = migrations.find(m => m.version === currentVersion);

    if (!migration) {
      console.error(`[Migrations] Migration version ${currentVersion} not found`);
      return;
    }

    try {
      console.log(`[Migrations] Rolling back: ${migration.name} (v${migration.version})`);
      migration.down(db);
      setSchemaVersion(currentVersion - 1);
      console.log(`[Migrations] ✓ Rolled back: ${migration.name}`);
    } catch (error) {
      console.error(`[Migrations] ✗ Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;
