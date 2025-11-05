/**
 * Database Connection Manager
 *
 * Manages SQLite database connection using better-sqlite3
 * Part of Phase 1: Database Schema and Initialization
 */

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
      console.log(`[Database] Created data directory: ${dbDir}`);
    }

    // Open database connection
    this.db = new Database(dbPath, {
      verbose: config.database.verbose ? console.log : null
    });

    // Set busy timeout
    this.db.pragma(`busy_timeout = ${config.database.busyTimeout}`);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    console.log(`[Database] Connected to SQLite database at ${dbPath}`);
    console.log(`[Database] WAL mode: ${this.db.pragma('journal_mode', { simple: true })}`);
    console.log(`[Database] Foreign keys: ${this.db.pragma('foreign_keys', { simple: true })}`);

    return this.db;
  }

  /**
   * Get database instance
   * Connects if not already connected
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
   *
   * @param {Function} fn - Function to execute in transaction
   * @returns {*} Result of function
   */
  transaction(fn) {
    const db = this.getDatabase();
    return db.transaction(fn);
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.db !== null;
  }
}

// Singleton instance
const connection = new DatabaseConnection();

module.exports = connection;
