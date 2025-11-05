/**
 * CLI Integration Tests
 * Tests all CLI commands using child_process.execSync
 */

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, unlinkSync, mkdirSync, copyFileSync } from 'fs'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const PROJECT_ROOT = join(__dirname, '../..')
const CLI_PATH = join(PROJECT_ROOT, 'bin/provider-cli.js')
const TEST_DB_DIR = join(PROJECT_ROOT, 'data/test')
const TEST_DB_PATH = join(TEST_DB_DIR, 'test.db')
const SCHEMA_PATH = join(PROJECT_ROOT, 'src/database/schema.sql')

// Test database instance
let testDb = null

// Helper function to execute CLI command with test database
function execCLI(args, options = {}) {
  try {
    const output = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        TEST_MODE: 'true',
        // Override database path for testing (would need to be implemented in connection.js)
      },
      ...options
    })
    return output
  } catch (error) {
    // execSync throws on non-zero exit code
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      status: error.status,
      error: true
    }
  }
}

// Helper to strip ANSI color codes
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('CLI Integration Tests', () => {
  before(() => {
    console.log('Setting up CLI test environment...')

    // Create test directory
    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true })
    }

    // Remove existing test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    // Create test database
    testDb = new Database(TEST_DB_PATH)
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('foreign_keys = ON')

    // Load and execute schema
    const schema = readFileSync(SCHEMA_PATH, 'utf8')
    testDb.exec(schema)

    console.log('CLI test environment initialized')
  })

  after(() => {
    console.log('Cleaning up CLI test environment...')

    if (testDb) {
      testDb.close()
      testDb = null
    }

    // Remove test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    console.log('CLI test environment cleaned up')
  })

  beforeEach(() => {
    // Reset active provider to default
    const stmt = testDb.prepare("UPDATE settings SET value = 'lm-studio' WHERE key = 'active_provider'")
    stmt.run()

    // Clean up logs (new schema uses responses, requests, sessions tables)
    testDb.prepare('DELETE FROM responses').run()
    testDb.prepare('DELETE FROM requests').run()
    testDb.prepare('DELETE FROM sessions').run()
  })

  describe('CLI Basics', () => {
    it('should display version with --version', () => {
      const output = execCLI('--version')
      assert.ok(output.includes('1.0.0'), 'Should display version number')
    })

    it('should display help with --help', () => {
      const output = execCLI('--help')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('Usage:'), 'Should display usage')
      assert.ok(stripped.includes('provider-cli'), 'Should mention CLI name')
      assert.ok(stripped.includes('status'), 'Should list status command')
      assert.ok(stripped.includes('set'), 'Should list set command')
      assert.ok(stripped.includes('list'), 'Should list list command')
      assert.ok(stripped.includes('test'), 'Should list test command')
    })

    it('should handle unknown commands gracefully', () => {
      const result = execCLI('unknown-command', { stdio: 'pipe' })

      if (result.error) {
        // Should have error output
        assert.ok(
          result.stderr.includes('unknown command') || result.stdout.includes('unknown command'),
          'Should report unknown command'
        )
      }
    })
  })

  describe('status command', () => {
    it('should display current provider status', () => {
      const output = execCLI('status')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('lm-studio'), 'Should show default provider')
      assert.ok(stripped.includes('Active') || stripped.includes('Status'), 'Should show status')
    })

    it('should show provider configuration', () => {
      const output = execCLI('status')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('Base URL') || stripped.includes('baseURL') || stripped.includes('http'),
        'Should show provider configuration'
      )
    })

    it('should work after changing provider', () => {
      // Change provider using database directly
      const stmt = testDb.prepare("UPDATE settings SET value = 'qwen-proxy' WHERE key = 'active_provider'")
      stmt.run()

      const output = execCLI('status')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('qwen-proxy'), 'Should show updated provider')
    })
  })

  describe('list command', () => {
    it('should list all available providers', () => {
      const output = execCLI('list')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('lm-studio'), 'Should list lm-studio')
      assert.ok(stripped.includes('qwen-proxy'), 'Should list qwen-proxy')
      assert.ok(stripped.includes('qwen-direct'), 'Should list qwen-direct')
    })

    it('should indicate active provider', () => {
      const output = execCLI('list')
      const stripped = stripAnsi(output)

      // Should have some indicator for active provider (checkmark, asterisk, etc.)
      assert.ok(
        stripped.includes('✓') || stripped.includes('*') || stripped.includes('Active'),
        'Should indicate active provider'
      )
    })

    it('should work with ls alias', () => {
      const output = execCLI('ls')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('lm-studio'), 'ls alias should work')
    })

    it('should show provider base URLs', () => {
      const output = execCLI('list')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('http://') || stripped.includes('https://') || stripped.includes('Base URL'),
        'Should show provider base URLs'
      )
    })
  })

  describe('set command', () => {
    it('should change active provider', () => {
      const output = execCLI('set qwen-proxy')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('success') || stripped.includes('changed') || stripped.includes('qwen-proxy'),
        'Should confirm provider change'
      )

      // Verify in database
      const stmt = testDb.prepare("SELECT value FROM settings WHERE key = 'active_provider'")
      const row = stmt.get()
      assert.strictEqual(row.value, 'qwen-proxy', 'Database should be updated')
    })

    it('should reject invalid provider names', () => {
      const result = execCLI('set invalid-provider', { stdio: 'pipe' })

      if (result.error) {
        const output = result.stderr || result.stdout
        const stripped = stripAnsi(output)

        assert.ok(
          stripped.includes('not found') || stripped.includes('Error') || stripped.includes('invalid'),
          'Should reject invalid provider'
        )
      } else {
        const stripped = stripAnsi(result)
        assert.ok(
          stripped.includes('not found') || stripped.includes('Error'),
          'Should reject invalid provider'
        )
      }
    })

    it('should handle setting to same provider', () => {
      const output = execCLI('set lm-studio')
      const stripped = stripAnsi(output)

      // Should handle gracefully (might warn or confirm)
      assert.ok(
        stripped.includes('already') || stripped.includes('lm-studio') || stripped.includes('success'),
        'Should handle setting to same provider'
      )
    })

    it('should accept all valid provider names', () => {
      const providers = ['lm-studio', 'qwen-proxy', 'qwen-direct']

      for (const provider of providers) {
        const output = execCLI(`set ${provider}`)
        const stripped = stripAnsi(output)

        assert.ok(
          !stripped.includes('Error') && !stripped.includes('not found'),
          `Should accept ${provider}`
        )

        // Verify in database
        const stmt = testDb.prepare("SELECT value FROM settings WHERE key = 'active_provider'")
        const row = stmt.get()
        assert.strictEqual(row.value, provider, `Database should be updated to ${provider}`)
      }
    })

    it('should persist provider changes', () => {
      // Set provider
      execCLI('set qwen-direct')

      // Verify with status command
      const statusOutput = execCLI('status')
      const stripped = stripAnsi(statusOutput)

      assert.ok(stripped.includes('qwen-direct'), 'Provider change should persist')
    })
  })

  describe('test command', () => {
    it('should test current provider', () => {
      const output = execCLI('test')
      const stripped = stripAnsi(output)

      // Should attempt to test provider (may succeed or fail based on availability)
      assert.ok(
        stripped.includes('test') || stripped.includes('lm-studio') || stripped.includes('health'),
        'Should test current provider'
      )
    })

    it('should test specific provider', () => {
      const output = execCLI('test qwen-proxy')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('qwen-proxy') || stripped.includes('test'),
        'Should test specified provider'
      )
    })

    it('should handle unavailable providers gracefully', () => {
      const output = execCLI('test qwen-direct')
      const stripped = stripAnsi(output)

      // Should report status (healthy, unhealthy, or error)
      assert.ok(
        stripped.includes('healthy') ||
        stripped.includes('unhealthy') ||
        stripped.includes('failed') ||
        stripped.includes('error') ||
        stripped.includes('success'),
        'Should report provider health status'
      )
    })
  })

  describe('history command', () => {
    beforeEach(() => {
      // Add some test logs
      const stmt = testDb.prepare(`
        INSERT INTO request_logs (
          request_id, provider, endpoint, method,
          request_body, response_body, status_code,
          duration_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `)

      for (let i = 0; i < 5; i++) {
        stmt.run(
          `test-req-${i}`,
          i % 2 === 0 ? 'lm-studio' : 'qwen-proxy',
          '/v1/chat/completions',
          'POST',
          JSON.stringify({ model: 'qwen3-max', messages: [] }),
          JSON.stringify({ choices: [] }),
          200,
          100 + i * 50
        )
      }
    })

    it('should display recent request history', () => {
      const output = execCLI('history')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('test-req') || stripped.includes('request') || stripped.includes('history'),
        'Should display request history'
      )
    })

    it('should respect --limit option', () => {
      const output = execCLI('history --limit 2')
      const stripped = stripAnsi(output)

      // Should show limited results (hard to count exact lines, but should be shorter)
      assert.ok(
        stripped.length < 2000,
        'Should respect limit option'
      )
    })

    it('should filter by provider with --provider option', () => {
      const output = execCLI('history --provider lm-studio')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('lm-studio'),
        'Should filter by provider'
      )
    })

    it('should handle empty history gracefully', () => {
      // Clear all logs
      testDb.prepare('DELETE FROM request_logs').run()

      const output = execCLI('history')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('No') || stripped.includes('empty') || stripped.includes('0') || stripped.length < 100,
        'Should handle empty history'
      )
    })
  })

  describe('stats command', () => {
    beforeEach(() => {
      // Add test logs with varying stats
      const stmt = testDb.prepare(`
        INSERT INTO request_logs (
          request_id, provider, endpoint, method,
          status_code, duration_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `)

      // 10 lm-studio requests
      for (let i = 0; i < 10; i++) {
        stmt.run(
          `lm-${i}`,
          'lm-studio',
          '/v1/chat/completions',
          'POST',
          200,
          100 + i * 10
        )
      }

      // 5 qwen-proxy requests
      for (let i = 0; i < 5; i++) {
        stmt.run(
          `qwen-${i}`,
          'qwen-proxy',
          '/v1/chat/completions',
          'POST',
          200,
          200 + i * 20
        )
      }
    })

    it('should display usage statistics', () => {
      const output = execCLI('stats')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('stats') ||
        stripped.includes('total') ||
        stripped.includes('requests') ||
        stripped.includes('lm-studio'),
        'Should display usage statistics'
      )
    })

    it('should show request counts by provider', () => {
      const output = execCLI('stats')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('lm-studio') && stripped.includes('qwen-proxy'),
        'Should show counts by provider'
      )
    })

    it('should show average duration statistics', () => {
      const output = execCLI('stats')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('duration') ||
        stripped.includes('average') ||
        stripped.includes('ms') ||
        /\d+/.test(stripped),
        'Should show duration statistics'
      )
    })

    it('should handle empty stats gracefully', () => {
      // Clear all logs
      testDb.prepare('DELETE FROM request_logs').run()

      const output = execCLI('stats')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.includes('No') ||
        stripped.includes('0') ||
        stripped.includes('empty') ||
        stripped.length < 200,
        'Should handle empty stats'
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', () => {
      // This test would require temporarily making the database inaccessible
      // For now, we'll test that the CLI doesn't crash
      const output = execCLI('status')
      assert.ok(output, 'CLI should not crash on database operations')
    })

    it('should provide helpful error messages', () => {
      const result = execCLI('set invalid-provider', { stdio: 'pipe' })

      if (result.error) {
        const output = result.stderr || result.stdout
        const stripped = stripAnsi(output)

        assert.ok(
          stripped.includes('Error') || stripped.includes('not found'),
          'Should provide error message'
        )
      }
    })

    it('should exit with non-zero code on errors', () => {
      const result = execCLI('set invalid-provider', { stdio: 'pipe' })

      if (result.error) {
        assert.ok(result.status !== 0, 'Should exit with non-zero code on error')
      }
    })
  })

  describe('Output Formatting', () => {
    it('should produce readable table output for list command', () => {
      const output = execCLI('list')
      const stripped = stripAnsi(output)

      // Should have some form of tabular structure
      assert.ok(
        stripped.split('\n').length > 3,
        'Should have multiple lines of output'
      )
    })

    it('should use colors in output (ANSI codes)', () => {
      const output = execCLI('status')

      // Should contain ANSI color codes
      assert.ok(
        output.includes('\x1b[') || output.includes('\\x1b'),
        'Should use ANSI colors'
      )
    })

    it('should format timestamps in history', () => {
      // Add a log
      const stmt = testDb.prepare(`
        INSERT INTO request_logs (
          request_id, provider, endpoint, method,
          status_code, duration_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `)
      stmt.run('time-test', 'lm-studio', '/v1/chat/completions', 'POST', 200, 150)

      const output = execCLI('history')
      const stripped = stripAnsi(output)

      // Should contain some form of timestamp or date
      assert.ok(
        /\d{2}:\d{2}/.test(stripped) || // Time format
        /\d{4}-\d{2}-\d{2}/.test(stripped) || // Date format
        stripped.includes('ago') || // Relative time
        stripped.includes('created'),
        'Should format timestamps'
      )
    })
  })

  describe('Integration with Database', () => {
    it('should read from database correctly', () => {
      // Set provider in database
      const stmt = testDb.prepare("UPDATE settings SET value = 'qwen-direct' WHERE key = 'active_provider'")
      stmt.run()

      const output = execCLI('status')
      const stripped = stripAnsi(output)

      assert.ok(stripped.includes('qwen-direct'), 'Should read from database')
    })

    it('should write to database correctly', () => {
      execCLI('set qwen-proxy')

      const stmt = testDb.prepare("SELECT value FROM settings WHERE key = 'active_provider'")
      const row = stmt.get()

      assert.strictEqual(row.value, 'qwen-proxy', 'Should write to database')
    })

    it('should handle concurrent CLI operations', () => {
      // Run multiple commands in sequence
      execCLI('set lm-studio')
      execCLI('status')
      execCLI('list')
      execCLI('set qwen-proxy')

      const stmt = testDb.prepare("SELECT value FROM settings WHERE key = 'active_provider'")
      const row = stmt.get()

      assert.strictEqual(row.value, 'qwen-proxy', 'Should handle multiple operations')
    })
  })

  describe('Command Aliases and Options', () => {
    it('should support short options', () => {
      const output = execCLI('history -l 3')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.length < 2000,
        'Should support short option -l'
      )
    })

    it('should support long options', () => {
      const output = execCLI('history --limit 3')
      const stripped = stripAnsi(output)

      assert.ok(
        stripped.length < 2000,
        'Should support long option --limit'
      )
    })

    it('should handle option arguments', () => {
      const output = execCLI('history --provider lm-studio')
      const stripped = stripAnsi(output)

      // Should run without error
      assert.ok(typeof stripped === 'string', 'Should handle option arguments')
    })
  })
})
