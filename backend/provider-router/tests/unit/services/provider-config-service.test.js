/**
 * ProviderConfigService Unit Tests
 * Tests configuration management for providers
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
const TEST_DB_DIR = join(__dirname, '../../../data/test')
const TEST_DB_PATH = join(TEST_DB_DIR, 'provider-config-service-test.db')
const SCHEMA_PATH = join(__dirname, '../../../src/database/schema.sql')

// Test database instance
let testDb = null

// Mock ProviderConfigService for testing
class TestProviderConfigService {
  static set(providerId, key, value, isSensitive = false) {
    const now = Date.now()
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    const stmt = testDb.prepare(`
      INSERT INTO provider_configs (provider_id, key, value, is_sensitive, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider_id, key) DO UPDATE SET
        value = excluded.value,
        is_sensitive = excluded.is_sensitive,
        updated_at = excluded.updated_at
    `)

    stmt.run(providerId, key, serializedValue, isSensitive ? 1 : 0, now, now)
    return { provider_id: providerId, key, value, is_sensitive: isSensitive }
  }

  static setMultiple(providerId, configs) {
    let count = 0

    for (const [key, value] of Object.entries(configs)) {
      const isSensitive = key.toLowerCase().includes('key') ||
                         key.toLowerCase().includes('secret') ||
                         key.toLowerCase().includes('password') ||
                         key.toLowerCase().includes('token')

      this.set(providerId, key, value, isSensitive)
      count++
    }

    return count
  }

  static get(providerId, key, defaultValue = null) {
    const stmt = testDb.prepare('SELECT * FROM provider_configs WHERE provider_id = ? AND key = ?')
    const config = stmt.get(providerId, key)

    if (!config) {
      return defaultValue
    }

    try {
      return JSON.parse(config.value)
    } catch {
      return config.value
    }
  }

  static getAll(providerId, maskSensitive = true) {
    const stmt = testDb.prepare('SELECT * FROM provider_configs WHERE provider_id = ?')
    const configs = stmt.all(providerId)

    const result = {}

    for (const config of configs) {
      let value = config.value

      if (maskSensitive && config.is_sensitive) {
        value = '***MASKED***'
      } else {
        try {
          value = JSON.parse(value)
        } catch {
          // Keep as string
        }
      }

      result[config.key] = value
    }

    return result
  }

  static getMultiple(providerId, keys) {
    const result = {}

    for (const key of keys) {
      result[key] = this.get(providerId, key)
    }

    return result
  }

  static delete(providerId, key) {
    const stmt = testDb.prepare('DELETE FROM provider_configs WHERE provider_id = ? AND key = ?')
    const result = stmt.run(providerId, key)

    if (result.changes === 0) {
      throw new Error(`Config not found: ${providerId}.${key}`)
    }

    return true
  }

  static deleteAll(providerId) {
    const stmt = testDb.prepare('DELETE FROM provider_configs WHERE provider_id = ?')
    const result = stmt.run(providerId)
    return result.changes
  }

  static exists(providerId, key) {
    const stmt = testDb.prepare('SELECT COUNT(*) as count FROM provider_configs WHERE provider_id = ? AND key = ?')
    const result = stmt.get(providerId, key)
    return result.count > 0
  }

  static buildConfig(providerId) {
    const stmt = testDb.prepare('SELECT key, value, is_sensitive FROM provider_configs WHERE provider_id = ?')
    const configs = stmt.all(providerId)

    const config = {}

    for (const row of configs) {
      let value = row.value

      try {
        value = JSON.parse(value)
      } catch {
        // Keep as string
      }

      config[row.key] = value
    }

    return config
  }

  static getAllWithMetadata(providerId) {
    const stmt = testDb.prepare('SELECT * FROM provider_configs WHERE provider_id = ? ORDER BY key ASC')
    const configs = stmt.all(providerId)

    return configs.map(config => ({
      id: config.id,
      provider_id: config.provider_id,
      key: config.key,
      value: config.value,
      is_sensitive: Boolean(config.is_sensitive),
      created_at: config.created_at,
      updated_at: config.updated_at
    }))
  }
}

describe('ProviderConfigService Unit Tests', () => {
  before(() => {
    console.log('Setting up test database...')

    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true })
    }

    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    testDb = new Database(TEST_DB_PATH)
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('foreign_keys = ON')

    const schema = readFileSync(SCHEMA_PATH, 'utf8')
    testDb.exec(schema)

    // Create a test provider
    testDb.prepare(`
      INSERT INTO providers (id, name, type, enabled, priority, created_at, updated_at)
      VALUES ('test-provider', 'Test Provider', 'lm-studio', 1, 0, ${Date.now()}, ${Date.now()})
    `).run()

    console.log('Test database initialized')
  })

  after(() => {
    console.log('Cleaning up test database...')

    if (testDb) {
      testDb.close()
      testDb = null
    }

    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    console.log('Test database cleaned up')
  })

  beforeEach(() => {
    // Clean up configs before each test
    testDb.prepare('DELETE FROM provider_configs').run()
  })

  describe('set()', () => {
    it('should set a string config value', () => {
      const result = TestProviderConfigService.set('test-provider', 'baseURL', 'http://localhost:1234')

      assert.strictEqual(result.key, 'baseURL', 'Should return correct key')
      assert.strictEqual(result.value, 'http://localhost:1234', 'Should return correct value')
      assert.strictEqual(result.is_sensitive, false, 'Should not be sensitive by default')
    })

    it('should set a number config value', () => {
      TestProviderConfigService.set('test-provider', 'timeout', 5000)
      const value = TestProviderConfigService.get('test-provider', 'timeout')

      assert.strictEqual(value, '5000', 'Should store number as string')
    })

    it('should set an object config value', () => {
      const configObj = { foo: 'bar', nested: { key: 'value' } }
      TestProviderConfigService.set('test-provider', 'complex', configObj)
      const value = TestProviderConfigService.get('test-provider', 'complex')

      assert.deepStrictEqual(value, configObj, 'Should serialize and deserialize object')
    })

    it('should set an array config value', () => {
      const configArray = ['model1', 'model2', 'model3']
      TestProviderConfigService.set('test-provider', 'models', configArray)
      const value = TestProviderConfigService.get('test-provider', 'models')

      assert.deepStrictEqual(value, configArray, 'Should serialize and deserialize array')
    })

    it('should mark config as sensitive', () => {
      TestProviderConfigService.set('test-provider', 'apiKey', 'secret-key', true)
      const stmt = testDb.prepare('SELECT is_sensitive FROM provider_configs WHERE provider_id = ? AND key = ?')
      const result = stmt.get('test-provider', 'apiKey')

      assert.strictEqual(result.is_sensitive, 1, 'Should mark as sensitive')
    })

    it('should update existing config value', () => {
      TestProviderConfigService.set('test-provider', 'baseURL', 'http://old-url')
      TestProviderConfigService.set('test-provider', 'baseURL', 'http://new-url')

      const value = TestProviderConfigService.get('test-provider', 'baseURL')
      assert.strictEqual(value, 'http://new-url', 'Should update existing value')
    })
  })

  describe('setMultiple()', () => {
    it('should set multiple configs at once', () => {
      const configs = {
        baseURL: 'http://localhost:1234',
        timeout: 5000,
        defaultModel: 'qwen3-max'
      }

      const count = TestProviderConfigService.setMultiple('test-provider', configs)

      assert.strictEqual(count, 3, 'Should return count of configs set')

      const baseURL = TestProviderConfigService.get('test-provider', 'baseURL')
      const timeout = TestProviderConfigService.get('test-provider', 'timeout')
      const defaultModel = TestProviderConfigService.get('test-provider', 'defaultModel')

      assert.strictEqual(baseURL, 'http://localhost:1234', 'Should set baseURL')
      assert.strictEqual(timeout, '5000', 'Should set timeout')
      assert.strictEqual(defaultModel, 'qwen3-max', 'Should set defaultModel')
    })

    it('should auto-detect sensitive configs', () => {
      const configs = {
        baseURL: 'http://localhost:1234',
        apiKey: 'secret-key',
        token: 'secret-token',
        password: 'secret-pass'
      }

      TestProviderConfigService.setMultiple('test-provider', configs)

      const apiKey = TestProviderConfigService.get('test-provider', 'apiKey')
      const token = TestProviderConfigService.get('test-provider', 'token')
      const password = TestProviderConfigService.get('test-provider', 'password')

      // Check they're marked as sensitive
      const stmt = testDb.prepare('SELECT is_sensitive FROM provider_configs WHERE provider_id = ? AND key = ?')

      assert.strictEqual(stmt.get('test-provider', 'apiKey').is_sensitive, 1, 'apiKey should be sensitive')
      assert.strictEqual(stmt.get('test-provider', 'token').is_sensitive, 1, 'token should be sensitive')
      assert.strictEqual(stmt.get('test-provider', 'password').is_sensitive, 1, 'password should be sensitive')
      assert.strictEqual(stmt.get('test-provider', 'baseURL').is_sensitive, 0, 'baseURL should not be sensitive')
    })
  })

  describe('get()', () => {
    it('should get existing config value', () => {
      TestProviderConfigService.set('test-provider', 'test-key', 'test-value')
      const value = TestProviderConfigService.get('test-provider', 'test-key')

      assert.strictEqual(value, 'test-value', 'Should return correct value')
    })

    it('should return default value for non-existent config', () => {
      const value = TestProviderConfigService.get('test-provider', 'non-existent', 'default-value')

      assert.strictEqual(value, 'default-value', 'Should return default value')
    })

    it('should return null by default for non-existent config', () => {
      const value = TestProviderConfigService.get('test-provider', 'non-existent')

      assert.strictEqual(value, null, 'Should return null')
    })

    it('should parse JSON values', () => {
      TestProviderConfigService.set('test-provider', 'json-config', { key: 'value' })
      const value = TestProviderConfigService.get('test-provider', 'json-config')

      assert.deepStrictEqual(value, { key: 'value' }, 'Should parse JSON')
    })

    it('should return strings for non-JSON values', () => {
      TestProviderConfigService.set('test-provider', 'string-config', 'plain-string')
      const value = TestProviderConfigService.get('test-provider', 'string-config')

      assert.strictEqual(value, 'plain-string', 'Should return string')
    })
  })

  describe('getAll()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'baseURL', 'http://localhost:1234', false)
      TestProviderConfigService.set('test-provider', 'apiKey', 'secret-key', true)
      TestProviderConfigService.set('test-provider', 'timeout', 5000, false)
    })

    it('should get all configs', () => {
      const configs = TestProviderConfigService.getAll('test-provider', false)

      assert.ok(configs.baseURL, 'Should have baseURL')
      assert.ok(configs.apiKey, 'Should have apiKey')
      assert.ok(configs.timeout, 'Should have timeout')
    })

    it('should mask sensitive values by default', () => {
      const configs = TestProviderConfigService.getAll('test-provider', true)

      assert.strictEqual(configs.apiKey, '***MASKED***', 'Should mask sensitive value')
      assert.strictEqual(configs.baseURL, 'http://localhost:1234', 'Should not mask non-sensitive value')
    })

    it('should not mask sensitive values when maskSensitive is false', () => {
      const configs = TestProviderConfigService.getAll('test-provider', false)

      assert.strictEqual(configs.apiKey, 'secret-key', 'Should not mask when maskSensitive is false')
    })

    it('should return empty object for provider with no configs', () => {
      const configs = TestProviderConfigService.getAll('non-existent-provider')

      assert.deepStrictEqual(configs, {}, 'Should return empty object')
    })
  })

  describe('getMultiple()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'key1', 'value1')
      TestProviderConfigService.set('test-provider', 'key2', 'value2')
      TestProviderConfigService.set('test-provider', 'key3', 'value3')
    })

    it('should get multiple configs by keys', () => {
      const configs = TestProviderConfigService.getMultiple('test-provider', ['key1', 'key3'])

      assert.strictEqual(configs.key1, 'value1', 'Should have key1')
      assert.strictEqual(configs.key3, 'value3', 'Should have key3')
      assert.strictEqual(configs.key2, undefined, 'Should not have key2')
    })

    it('should return null for non-existent keys', () => {
      const configs = TestProviderConfigService.getMultiple('test-provider', ['key1', 'non-existent'])

      assert.strictEqual(configs.key1, 'value1', 'Should have existing key')
      assert.strictEqual(configs['non-existent'], null, 'Should have null for non-existent key')
    })
  })

  describe('delete()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'delete-test', 'value')
    })

    it('should delete config', () => {
      const result = TestProviderConfigService.delete('test-provider', 'delete-test')

      assert.strictEqual(result, true, 'Should return true')

      const value = TestProviderConfigService.get('test-provider', 'delete-test')
      assert.strictEqual(value, null, 'Config should be deleted')
    })

    it('should throw error for non-existent config', () => {
      assert.throws(
        () => TestProviderConfigService.delete('test-provider', 'non-existent'),
        /Config not found/,
        'Should throw error'
      )
    })
  })

  describe('deleteAll()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'key1', 'value1')
      TestProviderConfigService.set('test-provider', 'key2', 'value2')
      TestProviderConfigService.set('test-provider', 'key3', 'value3')
    })

    it('should delete all configs for provider', () => {
      const count = TestProviderConfigService.deleteAll('test-provider')

      assert.strictEqual(count, 3, 'Should return count of deleted configs')

      const configs = TestProviderConfigService.getAll('test-provider')
      assert.deepStrictEqual(configs, {}, 'All configs should be deleted')
    })

    it('should return 0 for provider with no configs', () => {
      const count = TestProviderConfigService.deleteAll('non-existent-provider')

      assert.strictEqual(count, 0, 'Should return 0')
    })
  })

  describe('exists()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'exists-test', 'value')
    })

    it('should return true for existing config', () => {
      const exists = TestProviderConfigService.exists('test-provider', 'exists-test')

      assert.strictEqual(exists, true, 'Should return true')
    })

    it('should return false for non-existent config', () => {
      const exists = TestProviderConfigService.exists('test-provider', 'non-existent')

      assert.strictEqual(exists, false, 'Should return false')
    })
  })

  describe('buildConfig()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'baseURL', 'http://localhost:1234')
      TestProviderConfigService.set('test-provider', 'timeout', 5000)
      TestProviderConfigService.set('test-provider', 'options', { retry: true, maxRetries: 3 })
    })

    it('should build complete config object', () => {
      const config = TestProviderConfigService.buildConfig('test-provider')

      assert.strictEqual(config.baseURL, 'http://localhost:1234', 'Should have baseURL')
      assert.strictEqual(config.timeout, '5000', 'Should have timeout')
      assert.deepStrictEqual(config.options, { retry: true, maxRetries: 3 }, 'Should have options')
    })

    it('should not mask sensitive values', () => {
      TestProviderConfigService.set('test-provider', 'apiKey', 'secret-key', true)
      const config = TestProviderConfigService.buildConfig('test-provider')

      assert.strictEqual(config.apiKey, 'secret-key', 'Should not mask sensitive values')
    })

    it('should return empty object for provider with no configs', () => {
      const config = TestProviderConfigService.buildConfig('non-existent-provider')

      assert.deepStrictEqual(config, {}, 'Should return empty object')
    })
  })

  describe('getAllWithMetadata()', () => {
    beforeEach(() => {
      TestProviderConfigService.set('test-provider', 'config1', 'value1', false)
      TestProviderConfigService.set('test-provider', 'config2', 'value2', true)
    })

    it('should return configs with metadata', () => {
      const configs = TestProviderConfigService.getAllWithMetadata('test-provider')

      assert.strictEqual(configs.length, 2, 'Should return 2 configs')
      assert.ok(configs[0].id, 'Should have id')
      assert.ok(configs[0].provider_id, 'Should have provider_id')
      assert.ok(configs[0].key, 'Should have key')
      assert.ok(configs[0].value, 'Should have value')
      assert.ok(typeof configs[0].is_sensitive === 'boolean', 'Should have is_sensitive as boolean')
      assert.ok(configs[0].created_at, 'Should have created_at')
      assert.ok(configs[0].updated_at, 'Should have updated_at')
    })

    it('should order by key ascending', () => {
      const configs = TestProviderConfigService.getAllWithMetadata('test-provider')

      assert.strictEqual(configs[0].key, 'config1', 'First should be config1')
      assert.strictEqual(configs[1].key, 'config2', 'Second should be config2')
    })

    it('should return empty array for provider with no configs', () => {
      const configs = TestProviderConfigService.getAllWithMetadata('non-existent-provider')

      assert.deepStrictEqual(configs, [], 'Should return empty array')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in values', () => {
      const specialValue = 'Value with "quotes" and \'apostrophes\' and \n newlines'
      TestProviderConfigService.set('test-provider', 'special', specialValue)
      const value = TestProviderConfigService.get('test-provider', 'special')

      assert.strictEqual(value, specialValue, 'Should handle special characters')
    })

    it('should handle empty string values', () => {
      TestProviderConfigService.set('test-provider', 'empty', '')
      const value = TestProviderConfigService.get('test-provider', 'empty')

      assert.strictEqual(value, '', 'Should handle empty strings')
    })

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(10000)
      TestProviderConfigService.set('test-provider', 'long', longValue)
      const value = TestProviderConfigService.get('test-provider', 'long')

      assert.strictEqual(value, longValue, 'Should handle long values')
    })

    it('should handle unicode characters', () => {
      const unicodeValue = '日本語 Emoji: 🚀🎉'
      TestProviderConfigService.set('test-provider', 'unicode', unicodeValue)
      const value = TestProviderConfigService.get('test-provider', 'unicode')

      assert.strictEqual(value, unicodeValue, 'Should handle unicode')
    })
  })
})
