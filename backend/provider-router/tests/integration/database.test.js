/**
 * Database Integration Tests
 * Tests SettingsService functionality (new schema with sessions/requests/responses)
 */

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, unlinkSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test database paths
const TEST_DB_DIR = join(__dirname, '../../data/test')
const TEST_DB_PATH = join(TEST_DB_DIR, 'test.db')
const SCHEMA_PATH = join(__dirname, '../../src/database/schema.sql')

// Test database instance
let testDb = null

// Mock SettingsService for testing
class TestSettingsService {
  static get(key) {
    const stmt = testDb.prepare('SELECT value FROM settings WHERE key = ?')
    const row = stmt.get(key)
    return row ? row.value : null
  }

  static set(key, value) {
    const stmt = testDb.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    stmt.run(key, value)
  }

  static getActiveProvider() {
    return this.get('active_provider') || 'lm-studio'
  }

  static setActiveProvider(provider) {
    this.set('active_provider', provider)
  }

  static getAll() {
    const stmt = testDb.prepare('SELECT key, value, updated_at FROM settings')
    const rows = stmt.all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  static delete(key) {
    const stmt = testDb.prepare('DELETE FROM settings WHERE key = ?')
    stmt.run(key)
  }
}

describe('Database Integration Tests', () => {
  before(() => {
    console.log('Setting up test database...')

    // Create test directory if it doesn't exist
    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true })
    }

    // Remove existing test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    // Create new test database
    testDb = new Database(TEST_DB_PATH)
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('foreign_keys = ON')

    // Load and execute schema
    const schema = readFileSync(SCHEMA_PATH, 'utf8')
    testDb.exec(schema)

    console.log('Test database initialized')
  })

  after(() => {
    console.log('Cleaning up test database...')

    if (testDb) {
      testDb.close()
      testDb = null
    }

    // Remove test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    console.log('Test database cleaned up')
  })

  describe('SettingsService', () => {
    beforeEach(() => {
      // Clean up settings except the default active_provider
      const stmt = testDb.prepare("DELETE FROM settings WHERE key != 'active_provider'")
      stmt.run()
    })

    describe('get() and set()', () => {
      it('should get and set values', () => {
        TestSettingsService.set('test_key', 'test_value')
        const value = TestSettingsService.get('test_key')
        assert.strictEqual(value, 'test_value', 'Should return the set value')
      })

      it('should return null for non-existent keys', () => {
        const value = TestSettingsService.get('non_existent_key')
        assert.strictEqual(value, null, 'Should return null for non-existent keys')
      })

      it('should update existing values', () => {
        TestSettingsService.set('test_key', 'value1')
        TestSettingsService.set('test_key', 'value2')
        const value = TestSettingsService.get('test_key')
        assert.strictEqual(value, 'value2', 'Should update to new value')
      })

      it('should handle special characters in values', () => {
        const specialValue = '{"key": "value", "unicode": "日本語", "emoji": "🚀"}'
        TestSettingsService.set('special_key', specialValue)
        const value = TestSettingsService.get('special_key')
        assert.strictEqual(value, specialValue, 'Should handle special characters')
      })
    })

    describe('getActiveProvider() and setActiveProvider()', () => {
      it('should get default active provider', () => {
        const provider = TestSettingsService.getActiveProvider()
        assert.strictEqual(provider, 'lm-studio', 'Should return default provider')
      })

      it('should set and get active provider', () => {
        TestSettingsService.setActiveProvider('qwen-proxy')
        const provider = TestSettingsService.getActiveProvider()
        assert.strictEqual(provider, 'qwen-proxy', 'Should return updated provider')
      })

      it('should persist active provider changes', () => {
        TestSettingsService.setActiveProvider('qwen-direct')
        const provider1 = TestSettingsService.getActiveProvider()
        assert.strictEqual(provider1, 'qwen-direct', 'Should return qwen-direct')

        TestSettingsService.setActiveProvider('lm-studio')
        const provider2 = TestSettingsService.getActiveProvider()
        assert.strictEqual(provider2, 'lm-studio', 'Should return lm-studio')
      })
    })

    describe('getAll()', () => {
      it('should return all settings', () => {
        TestSettingsService.set('key1', 'value1')
        TestSettingsService.set('key2', 'value2')
        TestSettingsService.set('key3', 'value3')

        const all = TestSettingsService.getAll()
        assert.ok(all.key1, 'Should have key1')
        assert.ok(all.key2, 'Should have key2')
        assert.ok(all.key3, 'Should have key3')
        assert.strictEqual(all.key1, 'value1', 'key1 should have correct value')
        assert.strictEqual(all.key2, 'value2', 'key2 should have correct value')
        assert.strictEqual(all.key3, 'value3', 'key3 should have correct value')
      })

      it('should return empty object when no settings', () => {
        // Delete all settings
        testDb.prepare('DELETE FROM settings').run()
        const all = TestSettingsService.getAll()
        assert.strictEqual(Object.keys(all).length, 0, 'Should return empty object')
      })
    })
  })

  // Note: LogsService tests removed - production now uses sessions/requests/responses tables
  // which are more complex than the old request_logs table.
  // See src/database/services/logs-service.js for production implementation.
  // Integration tests in routing.test.js cover the actual logging functionality.
})
