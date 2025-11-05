/**
 * Database Module Entry Point
 *
 * Exports database connection, schema, and migration utilities
 * Part of Phase 1: Database Schema and Initialization
 */

const connection = require('./connection');
const schema = require('./schema');
const MigrationRunner = require('./migrations');

/**
 * Initialize database
 * - Connects to database
 * - Creates schema if needed
 * - Runs pending migrations
 * - Clears all sessions (prevents stale session bugs)
 */
async function initializeDatabase() {
  console.log('[Database] Initializing database...');

  try {
    // Connect to database
    connection.connect();

    // Initialize schema (creates tables if they don't exist)
    schema.initializeSchema();

    // Run migrations
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();

    // Clear all sessions on startup to prevent stale session issues
    // This fixes the bug where clients try to continue conversations
    // from before server restart
    schema.clearAllSessions();

    // Get and display stats
    const stats = schema.getDatabaseStats();
    console.log('[Database] Database ready:', stats);

    return true;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    throw error;
  }
}

/**
 * Shutdown database
 * Closes connection gracefully
 */
function shutdownDatabase() {
  console.log('[Database] Shutting down...');
  connection.close();
}

module.exports = {
  // Connection
  connection,
  getDatabase: () => connection.getDatabase(),

  // Schema
  initializeSchema: schema.initializeSchema,
  getSchemaVersion: schema.getSchemaVersion,
  getDatabaseStats: schema.getDatabaseStats,
  clearAllSessions: schema.clearAllSessions,

  // Lifecycle
  initializeDatabase,
  shutdownDatabase,

  // Migrations
  MigrationRunner
};
