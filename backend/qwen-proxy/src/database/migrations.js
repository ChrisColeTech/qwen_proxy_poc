/**
 * Database Migration Runner
 *
 * Manages schema versioning and migrations
 * Part of Phase 1: Database Schema and Initialization
 */

const connection = require('./connection');
const { getSchemaVersion, setSchemaVersion } = require('./schema');
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
    return getSchemaVersion();
  }

  /**
   * Set schema version in database
   */
  setVersion(version) {
    setSchemaVersion(version);
  }

  /**
   * Load migration files from migrations directory
   */
  loadMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('[Migrations] No migrations directory found');
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .sort();

    return files.map(file => {
      const version = parseInt(file.split('-')[0], 10);
      const migration = require(path.join(this.migrationsDir, file));
      return { version, file, ...migration };
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

    console.log(`[Migrations] Running ${pending.length} pending migration(s)...`);

    for (const migration of pending) {
      console.log(`[Migrations] Running migration ${migration.version}: ${migration.name}`);

      try {
        // Run migration in transaction
        const runMigration = this.db.transaction(() => {
          migration.up(this.db);
          this.setVersion(migration.version);
        });

        runMigration();

        console.log(`[Migrations] ✓ Completed migration ${migration.version}`);
      } catch (error) {
        console.error(`[Migrations] ✗ Failed migration ${migration.version}:`, error);
        throw error;
      }
    }

    console.log('[Migrations] All migrations completed successfully');
  }

  /**
   * Rollback last migration
   * WARNING: This should only be used in development
   */
  async rollbackLastMigration() {
    const currentVersion = this.getCurrentVersion();

    if (currentVersion === 0) {
      console.log('[Migrations] No migrations to rollback');
      return;
    }

    const migrations = this.loadMigrations();
    const migration = migrations.find(m => m.version === currentVersion);

    if (!migration) {
      console.error(`[Migrations] Migration ${currentVersion} not found`);
      return;
    }

    if (!migration.down) {
      console.error(`[Migrations] Migration ${currentVersion} has no rollback`);
      return;
    }

    console.log(`[Migrations] Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      const rollback = this.db.transaction(() => {
        migration.down(this.db);
        this.setVersion(currentVersion - 1);
      });

      rollback();

      console.log(`[Migrations] ✓ Rolled back migration ${migration.version}`);
    } catch (error) {
      console.error(`[Migrations] ✗ Failed to rollback migration ${migration.version}:`, error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;
