/**
 * Database Connection Manager
 * Singleton pattern for SQLite connection
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_DIR = join(__dirname, '../../data')
const DB_PATH = join(DB_DIR, 'provider-router.db')
const SCHEMA_PATH = join(__dirname, 'schema.sql')

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

    // Connect to database
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL') // Better concurrency
    db.pragma('foreign_keys = ON')  // Enforce foreign keys

    logger.info(`Database connected: ${DB_PATH}`)

    // Run schema
    const schema = readFileSync(SCHEMA_PATH, 'utf8')
    db.exec(schema)
    logger.info('Database schema initialized')

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
