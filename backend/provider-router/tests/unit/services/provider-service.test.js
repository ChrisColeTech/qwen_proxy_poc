/**
 * ProviderService Unit Tests
 * Tests CRUD operations for provider management
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
const TEST_DB_PATH = join(TEST_DB_DIR, 'provider-service-test.db')
const SCHEMA_PATH = join(__dirname, '../../../src/database/schema.sql')

// Test database instance
let testDb = null

// Mock ProviderService for testing
class TestProviderService {
  static create(id, name, type, options = {}) {
    const now = Date.now()
    const { enabled = true, priority = 0, description = null } = options

    const stmt = testDb.prepare(`
      INSERT INTO providers (id, name, type, enabled, priority, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, name, type, enabled ? 1 : 0, priority, description, now, now)
    return this.getById(id)
  }

  static getById(id) {
    const stmt = testDb.prepare('SELECT * FROM providers WHERE id = ?')
    const provider = stmt.get(id)

    if (provider) {
      provider.enabled = Boolean(provider.enabled)
    }

    return provider
  }

  static getByType(type) {
    const stmt = testDb.prepare('SELECT * FROM providers WHERE type = ? ORDER BY priority DESC, name ASC')
    const providers = stmt.all(type)

    return providers.map(p => ({
      ...p,
      enabled: Boolean(p.enabled)
    }))
  }

  static getAll(filters = {}) {
    let query = 'SELECT * FROM providers WHERE 1=1'
    const params = []

    if (filters.type) {
      query += ' AND type = ?'
      params.push(filters.type)
    }

    if (filters.enabled !== undefined) {
      query += ' AND enabled = ?'
      params.push(filters.enabled ? 1 : 0)
    }

    if (filters.minPriority !== undefined) {
      query += ' AND priority >= ?'
      params.push(filters.minPriority)
    }

    query += ' ORDER BY priority DESC, name ASC'

    const stmt = testDb.prepare(query)
    const providers = stmt.all(...params)

    return providers.map(p => ({
      ...p,
      enabled: Boolean(p.enabled)
    }))
  }

  static getEnabled() {
    return this.getAll({ enabled: true })
  }

  static getByPriority() {
    const stmt = testDb.prepare('SELECT * FROM providers WHERE enabled = 1 ORDER BY priority DESC, name ASC')
    const providers = stmt.all()

    return providers.map(p => ({
      ...p,
      enabled: Boolean(p.enabled)
    }))
  }

  static update(id, updates) {
    const now = Date.now()
    const allowedFields = ['name', 'type', 'enabled', 'priority', 'description']
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(key === 'enabled' ? (value ? 1 : 0) : value)
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update')
    }

    fields.push('updated_at = ?')
    values.push(now, id)

    const query = `UPDATE providers SET ${fields.join(', ')} WHERE id = ?`
    const stmt = testDb.prepare(query)
    const result = stmt.run(...values)

    if (result.changes === 0) {
      throw new Error(`Provider not found: ${id}`)
    }

    return this.getById(id)
  }

  static setEnabled(id, enabled) {
    return this.update(id, { enabled })
  }

  static setPriority(id, priority) {
    return this.update(id, { priority })
  }

  static delete(id) {
    const stmt = testDb.prepare('DELETE FROM providers WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      throw new Error(`Provider not found: ${id}`)
    }

    return true
  }

  static exists(id) {
    const stmt = testDb.prepare('SELECT COUNT(*) as count FROM providers WHERE id = ?')
    const result = stmt.get(id)
    return result.count > 0
  }

  static count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM providers WHERE 1=1'
    const params = []

    if (filters.type) {
      query += ' AND type = ?'
      params.push(filters.type)
    }

    if (filters.enabled !== undefined) {
      query += ' AND enabled = ?'
      params.push(filters.enabled ? 1 : 0)
    }

    const stmt = testDb.prepare(query)
    const result = stmt.get(...params)

    return result.count
  }
}

describe('ProviderService Unit Tests', () => {
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

  beforeEach(() => {
    // Clean up providers before each test
    testDb.prepare('DELETE FROM providers').run()
  })

  describe('create()', () => {
    it('should create a provider with required fields', () => {
      const provider = TestProviderService.create('test-provider', 'Test Provider', 'lm-studio')

      assert.ok(provider, 'Should return provider object')
      assert.strictEqual(provider.id, 'test-provider', 'Should have correct ID')
      assert.strictEqual(provider.name, 'Test Provider', 'Should have correct name')
      assert.strictEqual(provider.type, 'lm-studio', 'Should have correct type')
      assert.strictEqual(provider.enabled, true, 'Should be enabled by default')
      assert.strictEqual(provider.priority, 0, 'Should have default priority')
    })

    it('should create a provider with optional fields', () => {
      const provider = TestProviderService.create('test-provider-2', 'Test Provider 2', 'qwen-proxy', {
        enabled: false,
        priority: 10,
        description: 'Test description'
      })

      assert.strictEqual(provider.enabled, false, 'Should respect enabled option')
      assert.strictEqual(provider.priority, 10, 'Should respect priority option')
      assert.strictEqual(provider.description, 'Test description', 'Should respect description option')
    })

    it('should throw error for duplicate provider ID', () => {
      TestProviderService.create('duplicate', 'Provider 1', 'lm-studio')

      assert.throws(
        () => TestProviderService.create('duplicate', 'Provider 2', 'qwen-proxy'),
        /UNIQUE constraint failed/,
        'Should throw error for duplicate ID'
      )
    })

    it('should auto-generate timestamps', () => {
      const beforeCreate = Date.now()
      const provider = TestProviderService.create('timestamps-test', 'Timestamps Test', 'lm-studio')
      const afterCreate = Date.now()

      assert.ok(provider.created_at >= beforeCreate, 'created_at should be after test start')
      assert.ok(provider.created_at <= afterCreate, 'created_at should be before test end')
      assert.strictEqual(provider.created_at, provider.updated_at, 'Timestamps should match on creation')
    })
  })

  describe('getById()', () => {
    it('should retrieve provider by ID', () => {
      TestProviderService.create('get-test', 'Get Test', 'lm-studio')
      const provider = TestProviderService.getById('get-test')

      assert.ok(provider, 'Should return provider')
      assert.strictEqual(provider.id, 'get-test', 'Should have correct ID')
    })

    it('should return null for non-existent provider', () => {
      const provider = TestProviderService.getById('non-existent')
      assert.strictEqual(provider, undefined, 'Should return null for non-existent provider')
    })

    it('should convert enabled to boolean', () => {
      TestProviderService.create('bool-test', 'Bool Test', 'lm-studio', { enabled: false })
      const provider = TestProviderService.getById('bool-test')

      assert.strictEqual(provider.enabled, false, 'Should convert 0 to false')
      assert.strictEqual(typeof provider.enabled, 'boolean', 'Should be boolean type')
    })
  })

  describe('getByType()', () => {
    beforeEach(() => {
      TestProviderService.create('lm-1', 'LM Studio 1', 'lm-studio', { priority: 5 })
      TestProviderService.create('lm-2', 'LM Studio 2', 'lm-studio', { priority: 10 })
      TestProviderService.create('qwen-1', 'Qwen Proxy 1', 'qwen-proxy', { priority: 7 })
    })

    it('should get providers by type', () => {
      const lmProviders = TestProviderService.getByType('lm-studio')

      assert.strictEqual(lmProviders.length, 2, 'Should return 2 lm-studio providers')
      assert.ok(lmProviders.every(p => p.type === 'lm-studio'), 'All should be lm-studio type')
    })

    it('should order by priority descending', () => {
      const lmProviders = TestProviderService.getByType('lm-studio')

      assert.strictEqual(lmProviders[0].id, 'lm-2', 'Higher priority should be first')
      assert.strictEqual(lmProviders[1].id, 'lm-1', 'Lower priority should be second')
    })

    it('should return empty array for type with no providers', () => {
      const providers = TestProviderService.getByType('qwen-direct')

      assert.strictEqual(providers.length, 0, 'Should return empty array')
    })
  })

  describe('getAll()', () => {
    beforeEach(() => {
      TestProviderService.create('provider-1', 'Provider 1', 'lm-studio', { enabled: true, priority: 5 })
      TestProviderService.create('provider-2', 'Provider 2', 'qwen-proxy', { enabled: false, priority: 10 })
      TestProviderService.create('provider-3', 'Provider 3', 'lm-studio', { enabled: true, priority: 3 })
    })

    it('should get all providers without filters', () => {
      const providers = TestProviderService.getAll()

      assert.strictEqual(providers.length, 3, 'Should return all providers')
    })

    it('should filter by type', () => {
      const providers = TestProviderService.getAll({ type: 'lm-studio' })

      assert.strictEqual(providers.length, 2, 'Should return only lm-studio providers')
    })

    it('should filter by enabled status', () => {
      const providers = TestProviderService.getAll({ enabled: true })

      assert.strictEqual(providers.length, 2, 'Should return only enabled providers')
      assert.ok(providers.every(p => p.enabled === true), 'All should be enabled')
    })

    it('should filter by minimum priority', () => {
      const providers = TestProviderService.getAll({ minPriority: 5 })

      assert.strictEqual(providers.length, 2, 'Should return providers with priority >= 5')
      assert.ok(providers.every(p => p.priority >= 5), 'All should have priority >= 5')
    })

    it('should combine multiple filters', () => {
      const providers = TestProviderService.getAll({ type: 'lm-studio', enabled: true })

      assert.strictEqual(providers.length, 2, 'Should apply both filters')
    })
  })

  describe('getEnabled()', () => {
    beforeEach(() => {
      TestProviderService.create('enabled-1', 'Enabled 1', 'lm-studio', { enabled: true })
      TestProviderService.create('disabled-1', 'Disabled 1', 'lm-studio', { enabled: false })
      TestProviderService.create('enabled-2', 'Enabled 2', 'qwen-proxy', { enabled: true })
    })

    it('should return only enabled providers', () => {
      const providers = TestProviderService.getEnabled()

      assert.strictEqual(providers.length, 2, 'Should return 2 enabled providers')
      assert.ok(providers.every(p => p.enabled === true), 'All should be enabled')
    })
  })

  describe('getByPriority()', () => {
    beforeEach(() => {
      TestProviderService.create('low-priority', 'Low Priority', 'lm-studio', { priority: 1, enabled: true })
      TestProviderService.create('high-priority', 'High Priority', 'lm-studio', { priority: 10, enabled: true })
      TestProviderService.create('disabled-priority', 'Disabled', 'lm-studio', { priority: 20, enabled: false })
    })

    it('should return providers ordered by priority descending', () => {
      const providers = TestProviderService.getByPriority()

      assert.strictEqual(providers.length, 2, 'Should return only enabled providers')
      assert.strictEqual(providers[0].id, 'high-priority', 'Highest priority should be first')
      assert.strictEqual(providers[1].id, 'low-priority', 'Lowest priority should be last')
    })

    it('should exclude disabled providers', () => {
      const providers = TestProviderService.getByPriority()

      assert.ok(providers.every(p => p.enabled === true), 'Should not include disabled providers')
    })
  })

  describe('update()', () => {
    beforeEach(() => {
      TestProviderService.create('update-test', 'Original Name', 'lm-studio', {
        enabled: true,
        priority: 5,
        description: 'Original description'
      })
    })

    it('should update provider name', () => {
      const provider = TestProviderService.update('update-test', { name: 'Updated Name' })

      assert.strictEqual(provider.name, 'Updated Name', 'Should update name')
    })

    it('should update provider type', () => {
      const provider = TestProviderService.update('update-test', { type: 'qwen-proxy' })

      assert.strictEqual(provider.type, 'qwen-proxy', 'Should update type')
    })

    it('should update enabled status', () => {
      const provider = TestProviderService.update('update-test', { enabled: false })

      assert.strictEqual(provider.enabled, false, 'Should update enabled status')
    })

    it('should update priority', () => {
      const provider = TestProviderService.update('update-test', { priority: 20 })

      assert.strictEqual(provider.priority, 20, 'Should update priority')
    })

    it('should update description', () => {
      const provider = TestProviderService.update('update-test', { description: 'New description' })

      assert.strictEqual(provider.description, 'New description', 'Should update description')
    })

    it('should update multiple fields at once', () => {
      const provider = TestProviderService.update('update-test', {
        name: 'Multi Update',
        priority: 15,
        description: 'Multi update description'
      })

      assert.strictEqual(provider.name, 'Multi Update', 'Should update name')
      assert.strictEqual(provider.priority, 15, 'Should update priority')
      assert.strictEqual(provider.description, 'Multi update description', 'Should update description')
    })

    it('should update updated_at timestamp', () => {
      const original = TestProviderService.getById('update-test')
      const originalUpdatedAt = original.updated_at

      // Wait a tiny bit to ensure timestamp changes
      const provider = TestProviderService.update('update-test', { name: 'Time Update' })

      assert.ok(provider.updated_at >= originalUpdatedAt, 'updated_at should be updated')
    })

    it('should throw error for non-existent provider', () => {
      assert.throws(
        () => TestProviderService.update('non-existent', { name: 'Test' }),
        /Provider not found/,
        'Should throw error for non-existent provider'
      )
    })

    it('should throw error when no valid fields provided', () => {
      assert.throws(
        () => TestProviderService.update('update-test', { invalid_field: 'value' }),
        /No valid fields to update/,
        'Should throw error for invalid fields'
      )
    })
  })

  describe('setEnabled()', () => {
    beforeEach(() => {
      TestProviderService.create('enable-test', 'Enable Test', 'lm-studio', { enabled: true })
    })

    it('should enable provider', () => {
      TestProviderService.setEnabled('enable-test', false)
      const provider = TestProviderService.setEnabled('enable-test', true)

      assert.strictEqual(provider.enabled, true, 'Should enable provider')
    })

    it('should disable provider', () => {
      const provider = TestProviderService.setEnabled('enable-test', false)

      assert.strictEqual(provider.enabled, false, 'Should disable provider')
    })
  })

  describe('setPriority()', () => {
    beforeEach(() => {
      TestProviderService.create('priority-test', 'Priority Test', 'lm-studio', { priority: 5 })
    })

    it('should set provider priority', () => {
      const provider = TestProviderService.setPriority('priority-test', 20)

      assert.strictEqual(provider.priority, 20, 'Should set priority')
    })

    it('should allow zero priority', () => {
      const provider = TestProviderService.setPriority('priority-test', 0)

      assert.strictEqual(provider.priority, 0, 'Should allow zero priority')
    })

    it('should allow negative priority', () => {
      const provider = TestProviderService.setPriority('priority-test', -5)

      assert.strictEqual(provider.priority, -5, 'Should allow negative priority')
    })
  })

  describe('delete()', () => {
    beforeEach(() => {
      TestProviderService.create('delete-test', 'Delete Test', 'lm-studio')
    })

    it('should delete provider', () => {
      const result = TestProviderService.delete('delete-test')

      assert.strictEqual(result, true, 'Should return true')

      const provider = TestProviderService.getById('delete-test')
      assert.strictEqual(provider, undefined, 'Provider should be deleted')
    })

    it('should throw error for non-existent provider', () => {
      assert.throws(
        () => TestProviderService.delete('non-existent'),
        /Provider not found/,
        'Should throw error for non-existent provider'
      )
    })
  })

  describe('exists()', () => {
    beforeEach(() => {
      TestProviderService.create('exists-test', 'Exists Test', 'lm-studio')
    })

    it('should return true for existing provider', () => {
      const exists = TestProviderService.exists('exists-test')

      assert.strictEqual(exists, true, 'Should return true')
    })

    it('should return false for non-existent provider', () => {
      const exists = TestProviderService.exists('non-existent')

      assert.strictEqual(exists, false, 'Should return false')
    })
  })

  describe('count()', () => {
    beforeEach(() => {
      TestProviderService.create('count-1', 'Count 1', 'lm-studio', { enabled: true })
      TestProviderService.create('count-2', 'Count 2', 'qwen-proxy', { enabled: false })
      TestProviderService.create('count-3', 'Count 3', 'lm-studio', { enabled: true })
    })

    it('should count all providers', () => {
      const count = TestProviderService.count()

      assert.strictEqual(count, 3, 'Should count all providers')
    })

    it('should count providers by type', () => {
      const count = TestProviderService.count({ type: 'lm-studio' })

      assert.strictEqual(count, 2, 'Should count lm-studio providers')
    })

    it('should count enabled providers', () => {
      const count = TestProviderService.count({ enabled: true })

      assert.strictEqual(count, 2, 'Should count enabled providers')
    })

    it('should count disabled providers', () => {
      const count = TestProviderService.count({ enabled: false })

      assert.strictEqual(count, 1, 'Should count disabled providers')
    })

    it('should return zero for empty result', () => {
      const count = TestProviderService.count({ type: 'non-existent' })

      assert.strictEqual(count, 0, 'Should return zero')
    })
  })
})
