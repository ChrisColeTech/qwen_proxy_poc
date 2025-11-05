/**
 * Database Connection Manager
 * Singleton pattern for SQLite connection to shared provider-router database
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Point to the provider-router database (stored in data/ directory)
const DB_DIR = join(__dirname, '../../../provider-router/data')
const DB_PATH = join(DB_DIR, 'provider-router.db')
const SCHEMA_PATH = join(__dirname, '../../../provider-router/src/database/schema.sql')

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

    const isNewDatabase = !existsSync(DB_PATH)

    // Connect to database
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL') // Better concurrency
    db.pragma('foreign_keys = ON')  // Enforce foreign keys

    // Initialize schema if new database
    if (isNewDatabase) {
      const schema = readFileSync(SCHEMA_PATH, 'utf8')
      db.exec(schema)
      logger.info('Database schema initialized')
    }

    logger.info(`API Server database connected: ${DB_PATH}`)

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
