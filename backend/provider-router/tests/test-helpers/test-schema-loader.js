/**
 * Test Schema Loader
 * Utility to load combined schemas for testing
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load and combine all schemas for testing
 * @param {Database} db - better-sqlite3 database instance
 */
export function loadTestSchema(db) {
  const schemaDir = join(__dirname, '../../src/database')

  // Load base schema (v2)
  const baseSchema = readFileSync(join(schemaDir, 'schema.sql'), 'utf8')

  // Load provider configuration schema (v3)
  const v3Schema = readFileSync(join(schemaDir, 'schema-v3.sql'), 'utf8')

  // Execute base schema
  db.exec(baseSchema)

  // Execute v3 schema
  db.exec(v3Schema)

  // Update schema version to 3
  db.prepare(`
    INSERT OR REPLACE INTO metadata (key, value, updated_at)
    VALUES ('schema_version', '3', strftime('%s', 'now') * 1000)
  `).run()
}

/**
 * Get combined schema as string
 * @returns {string} Combined schema SQL
 */
export function getCombinedSchema() {
  const schemaDir = join(__dirname, '../../src/database')

  const baseSchema = readFileSync(join(schemaDir, 'schema.sql'), 'utf8')
  const v3Schema = readFileSync(join(schemaDir, 'schema-v3.sql'), 'utf8')

  return `${baseSchema}\n\n${v3Schema}\n\n-- Update schema version\nUPDATE metadata SET value = '3', updated_at = strftime('%s', 'now') * 1000 WHERE key = 'schema_version';`
}

/**
 * Setup test database with full schema
 * @param {Database} db - better-sqlite3 database instance
 */
export function setupTestDatabase(db) {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Load combined schema
  loadTestSchema(db)

  return db
}
