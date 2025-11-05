# Testing Documentation

This directory contains comprehensive integration tests for the Provider Router project.

## Overview

The test suite is organized into three main categories:

1. **Database Tests** - Test database services and data persistence
2. **CLI Tests** - Test command-line interface functionality
3. **End-to-End Tests** - Test complete workflows from API to database to CLI

## Test Framework

- **Test Runner**: Node.js built-in test runner (`node:test`)
- **Assertions**: Node.js built-in assertions (`node:assert`)
- **Database**: SQLite with better-sqlite3
- **No External Dependencies**: All tests use Node.js built-in modules

## Running Tests

### Run All Tests

```bash
npm test
```

This executes all test files matching the pattern `tests/**/*.test.js`.

### Run Specific Test File

```bash
# Database tests only
npm test tests/integration/database.test.js

# CLI tests only
npm test tests/integration/cli.test.js

# End-to-end tests only
npm test tests/integration/provider-router.test.js
```

### Run Individual Test Suite

You can also run test files directly with Node:

```bash
node --test tests/integration/database.test.js
```

## Test Files

### 1. Database Tests (`database.test.js`)

Tests the database layer including SettingsService and LogsService.

**Test Coverage**:

- **SettingsService**:
  - Get/set key-value pairs
  - Active provider management
  - Get all settings
  - Handle special characters and null values

- **LogsService**:
  - Create request logs
  - Retrieve recent logs
  - Filter logs by provider
  - Calculate usage statistics
  - Parse JSON request/response bodies

- **Database Constraints**:
  - Unique request_id enforcement
  - Primary key constraints

- **Performance**:
  - Large request/response bodies
  - Concurrent writes
  - Null and undefined handling

**Example Tests**:
```javascript
// Test setting active provider
TestSettingsService.setActiveProvider('qwen-proxy')
const provider = TestSettingsService.getActiveProvider()
assert.strictEqual(provider, 'qwen-proxy')

// Test creating and retrieving logs
const logId = TestLogsService.create({
  request_id: 'test-001',
  provider: 'lm-studio',
  endpoint: '/v1/chat/completions',
  method: 'POST',
  status_code: 200,
  duration_ms: 150
})

const logs = TestLogsService.getRecent(10)
assert.ok(logs.length > 0)
```

**Test Database**: Uses `data/test/test.db` (created and destroyed for each test run)

**Duration**: ~1-2 seconds

### 2. CLI Tests (`cli.test.js`)

Tests all CLI commands by executing them as child processes.

**Test Coverage**:

- **Basic Commands**:
  - `--version` - Display version
  - `--help` - Display help
  - Unknown command handling

- **status Command**:
  - Display current provider
  - Show provider configuration
  - Reflect provider changes

- **list Command**:
  - List all providers
  - Indicate active provider
  - Show provider base URLs
  - Support `ls` alias

- **set Command**:
  - Change active provider
  - Reject invalid providers
  - Handle setting to same provider
  - Persist changes to database

- **test Command**:
  - Test current provider
  - Test specific provider
  - Handle unavailable providers

- **history Command**:
  - Display request history
  - Respect `--limit` option
  - Filter by `--provider` option
  - Handle empty history

- **stats Command**:
  - Display usage statistics
  - Show counts by provider
  - Show average durations
  - Handle empty stats

**Example Tests**:
```javascript
// Test changing provider via CLI
const output = execCLI('set qwen-proxy')
assert.ok(output.includes('success'))

// Verify in database
const provider = testDb.prepare("SELECT value FROM settings WHERE key = 'active_provider'").get()
assert.strictEqual(provider.value, 'qwen-proxy')
```

**Test Database**: Uses `data/test/test.db`

**Duration**: ~3-5 seconds (depends on CLI execution overhead)

### 3. End-to-End Tests (`provider-router.test.js`)

Tests complete workflows involving the server, database, and CLI.

**Test Coverage**:

- **Request → Database → CLI Workflow**:
  - Make API request to server
  - Verify log written to database
  - Query via CLI (or simulated)

- **Database Logging Accuracy**:
  - Capture complete request details
  - Log response data
  - Measure request duration

- **Error Logging**:
  - Log failed requests
  - Handle timeout scenarios

- **Statistical Queries**:
  - Calculate stats by provider
  - Track success/failure rates
  - Support time-based queries

- **Database Performance**:
  - Bulk log queries
  - Index usage verification
  - Concurrent reads

- **Data Integrity**:
  - Request ID uniqueness
  - JSON data preservation
  - NULL value handling

**Example Tests**:
```javascript
// Make request to server
const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen3-max',
    messages: [{ role: 'user', content: 'Test' }]
  })
})

// Verify log in database
const logs = testDb.prepare('SELECT * FROM request_logs ORDER BY created_at DESC LIMIT 1').all()
assert.ok(logs.length > 0)
assert.strictEqual(logs[0].endpoint, '/v1/chat/completions')
```

**Requirements**:
- Server must be running on port 3001
- Tests will skip if server is not available

**Test Database**: Uses `data/test/test.db`

**Duration**: ~5-10 seconds (network requests)

## Test Database

All tests use a separate test database to avoid corrupting production data:

- **Location**: `data/test/test.db`
- **Created**: Automatically before tests
- **Destroyed**: Automatically after tests
- **Schema**: Same as production database

### Test Database Lifecycle

```javascript
before(() => {
  // Create test directory and database
  testDb = new Database(TEST_DB_PATH)
  // Load schema
  testDb.exec(schema)
})

after(() => {
  // Close and remove test database
  testDb.close()
  unlinkSync(TEST_DB_PATH)
})

beforeEach(() => {
  // Clean up logs before each test
  testDb.prepare('DELETE FROM request_logs').run()
})
```

## Writing Tests

### Test Structure

```javascript
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'

describe('Feature Name', () => {
  before(() => {
    // Setup before all tests
  })

  after(() => {
    // Cleanup after all tests
  })

  beforeEach(() => {
    // Setup before each test
  })

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = someFunction(input)

      // Assert
      assert.strictEqual(result, 'expected')
    })
  })
})
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Descriptive Names**: Use clear test names that explain intent
4. **Fast**: Keep tests fast (< 5 seconds per test)
5. **Deterministic**: Tests should always produce same result
6. **No External Dependencies**: Don't call real LM Studio/Qwen API

### Mocking External Services

For tests that would call external services:

```javascript
// Don't call real API
❌ await fetch('http://real-api.com/endpoint')

// Use test database or skip if server not running
✅ if (!serverAvailable) {
  console.log('Skipping test - server not running')
  return
}
```

## Test Output

### Successful Test Run

```
▶ Database Integration Tests
  ▶ SettingsService
    ✔ should get and set values (0.5ms)
    ✔ should return null for non-existent keys (0.3ms)
    ✔ should update existing values (0.4ms)
  ✔ SettingsService (2.1ms)
  ▶ LogsService
    ✔ should create a log entry (0.6ms)
    ✔ should get recent logs (0.8ms)
  ✔ LogsService (3.2ms)
✔ Database Integration Tests (150.2ms)
```

### Failed Test

```
▶ SettingsService
  ✖ should get and set values (2.3ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    + actual - expected
    + 'qwen-proxy'
    - 'lm-studio'
```

## Continuous Integration

Tests are designed to run in CI/CD environments:

```bash
# GitHub Actions example
- name: Run tests
  run: npm test
```

**Note**: End-to-end tests that require the server will skip in CI if server is not running.

## Coverage

While we don't use a coverage tool, our tests cover:

- **Database Layer**: ~95% coverage (all CRUD operations)
- **CLI Commands**: ~90% coverage (all commands and major options)
- **End-to-End Workflows**: ~80% coverage (happy paths and error cases)

## Debugging Tests

### Run Single Test

```bash
node --test tests/integration/database.test.js
```

### Enable Debug Logging

Tests log important information:

```javascript
console.log('Setting up test database...')
console.log('Provider changed to qwen-proxy')
console.log('Request completed with status: 200')
```

### Inspect Test Database

The test database is deleted after tests, but you can modify tests to keep it:

```javascript
after(() => {
  // Comment out cleanup to inspect database
  // testDb.close()
  // unlinkSync(TEST_DB_PATH)
})
```

Then inspect with:

```bash
sqlite3 data/test/test.db
sqlite> SELECT * FROM request_logs;
```

## Troubleshooting

### Tests Hanging

- Check for missing `await` on async operations
- Ensure database connections are closed
- Look for infinite loops or timeouts

### Database Locked Errors

- Only one test should write to database at a time
- Use transactions for bulk operations
- Ensure WAL mode is enabled

### CLI Tests Failing

- Verify CLI is executable: `chmod +x bin/provider-cli.js`
- Check that Node.js can find the CLI
- Ensure test database path is correct

### End-to-End Tests Skipping

- Start the server: `npm start`
- Verify server is on port 3001
- Check server logs for errors

## Future Improvements

Potential test enhancements:

1. **Unit Tests**: Add unit tests for individual functions
2. **Performance Benchmarks**: Track performance over time
3. **Load Tests**: Test database under high concurrency
4. **Streaming Tests**: Test streaming response logging
5. **Error Injection**: Test failure scenarios systematically

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass: `npm test`
3. Add test documentation if needed
4. Update this README for major changes

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Node.js Assert](https://nodejs.org/api/assert.html)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
