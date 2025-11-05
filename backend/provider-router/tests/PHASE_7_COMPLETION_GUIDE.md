# Phase 7: Testing & Validation - Completion Guide

## Current Status

**Phase 7 Progress: 30% Complete**

### ✅ Completed Components
1. **Test Infrastructure**
   - Test directory structure created
   - Test helper utilities (`test-schema-loader.js`)
   - Test database isolation pattern established

2. **Unit Tests Created (2/6)**
   - ✅ `provider-service.test.js` - 45+ test cases
   - ✅ `provider-config-service.test.js` - 35+ test cases

3. **Documentation**
   - ✅ `PHASE_7_TEST_SUMMARY.md` - Comprehensive test coverage documentation
   - ✅ `PHASE_7_COMPLETION_GUIDE.md` - This guide

### ⚠️ Pending Components
- 4 Unit test files (model-service, provider-model-service, provider-factory, provider-registry)
- 2 Integration API test files
- 1 Migration test file
- 2 Existing test file updates

## Quick Fix: Run Existing Tests

### Step 1: Update Test Files to Use Schema Loader

Update the import section in both test files:

**File: `/tests/unit/services/provider-service.test.js`**
```javascript
// Add this import at the top
import { loadTestSchema } from '../../test-helpers/test-schema-loader.js'

// In the before() hook, replace these lines:
// const schema = readFileSync(SCHEMA_PATH, 'utf8')
// testDb.exec(schema)

// With this line:
loadTestSchema(testDb)
```

**File: `/tests/unit/services/provider-config-service.test.js`**
```javascript
// Add this import at the top
import { loadTestSchema } from '../../test-helpers/test-schema-loader.js'

// In the before() hook, replace these lines:
// const schema = readFileSync(SCHEMA_PATH, 'utf8')
// testDb.exec(schema)

// With this line:
loadTestSchema(testDb)
```

### Step 2: Run Tests
```bash
cd /mnt/d/Projects/qwen_proxy_opencode/backend/provider-router

# Run provider-service tests
node --test tests/unit/services/provider-service.test.js

# Run provider-config-service tests
node --test tests/unit/services/provider-config-service.test.js

# Run all unit tests
node --test tests/unit/
```

## Complete the Remaining Tests

### Priority 1: Critical Service Tests (4 files)

#### 1. Model Service Test
**File**: `/tests/unit/services/model-service.test.js`
**Template**:
```javascript
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { loadTestSchema } from '../../test-helpers/test-schema-loader.js'
// ... follow pattern from provider-service.test.js
```

**Test Coverage**:
- `create()` with capabilities array
- `getById()` with capabilities parsing
- `getAll()` with nameContains filter
- `getByCapability()` with JSON array search
- `update()` for all fields including capabilities
- `delete()`, `exists()`, `count()`
- `addCapability()`, `removeCapability()`

#### 2. Provider Model Service Test
**File**: `/tests/unit/services/provider-model-service.test.js`

**Test Coverage**:
- `link()` with default flag and config
- `getModelsForProvider()` with JOIN
- `getProvidersForModel()` with JOIN
- `getDefaultModel()` query
- `setDefaultModel()` with transaction (BEGIN/COMMIT)
- `updateConfig()` for provider-specific model settings
- `unlink()`, `unlinkAll()`, `isLinked()`, `getLink()`
- Test CASCADE delete behavior

#### 3. Provider Factory Test
**File**: `/tests/unit/providers/provider-factory.test.js`

**Test Coverage**:
- `createFromDatabase()` - full workflow
- `create()` - direct instantiation
- `getProviderClass()` - type mapping
- `validate()` - configuration validation
- `getSupportedTypes()`, `isSupported()`
- Test all three provider types (lm-studio, qwen-proxy, qwen-direct)
- Error handling for invalid configs
- Model assignment from database

#### 4. Provider Registry Test
**File**: `/tests/unit/providers/provider-registry.test.js`

**Test Coverage**:
- `loadProviders()` - load from database
- Health check execution during load
- `reloadProvider()`, `reloadAll()`
- `register()`, `unregister()` with cleanup
- `get()`, `getSafe()`, `has()`
- `getAll()`, `getAllIds()`, `getByType()`
- `count()`, `isLoaded()`, `clear()`
- `healthCheckAll()`, `getInfo()`

### Priority 2: API Integration Tests (2 files)

#### 5. Providers API Test
**File**: `/tests/integration/api/providers-api.test.js`

**Setup**:
```javascript
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'

// Start test server on different port
const TEST_PORT = 3099
const BASE_URL = `http://localhost:${TEST_PORT}`
```

**Test all endpoints**:
- GET /v1/providers
- GET /v1/providers/:id
- POST /v1/providers
- PUT /v1/providers/:id
- DELETE /v1/providers/:id
- POST /v1/providers/:id/enable
- POST /v1/providers/:id/disable
- POST /v1/providers/:id/test
- POST /v1/providers/:id/reload

#### 6. Models API Test
**File**: `/tests/integration/api/models-api.test.js`

**Test all endpoints**:
- GET /v1/models
- GET /v1/models/:id
- POST /v1/models
- PUT /v1/models/:id
- DELETE /v1/models/:id
- GET /v1/providers/:id/models
- POST /v1/providers/:id/models
- DELETE /v1/providers/:id/models/:modelId
- PUT /v1/providers/:id/models/:modelId/default

### Priority 3: Migration & System Tests (1 file)

#### 7. Migration Test
**File**: `/tests/integration/migration.test.js`

**Test Coverage**:
- Parse .env provider configurations
- Create provider records from .env
- Create provider_configs from .env
- Seed default models
- Link models to providers
- Set active_provider from DEFAULT_PROVIDER
- Test idempotence (run twice, same result)
- Test backward compatibility
- Test data integrity

### Priority 4: Update Existing Tests (2 files)

#### 8. Update Database Test
**File**: `/tests/integration/database.test.js`

**Add Section**:
```javascript
describe('Provider Configuration Tables (Schema v3)', () => {
  describe('providers table', () => {
    it('should enforce UNIQUE constraint on name', () => {})
    it('should have correct indexes', () => {})
    it('should default enabled to 1', () => {})
  })

  describe('provider_configs table', () => {
    it('should CASCADE delete on provider deletion', () => {})
    it('should enforce UNIQUE constraint on (provider_id, key)', () => {})
  })

  describe('models table', () => {
    it('should store capabilities as JSON', () => {})
  })

  describe('provider_models table', () => {
    it('should enforce UNIQUE constraint on (provider_id, model_id)', () => {})
    it('should CASCADE delete on provider deletion', () => {})
    it('should CASCADE delete on model deletion', () => {})
  })
})
```

#### 9. Update Provider Router Test
**File**: `/tests/integration/provider-router.test.js`

**Add Section**:
```javascript
describe('Database Provider Integration', () => {
  before(async () => {
    // Seed test providers in database
    // Use ProviderService to create test providers
  })

  it('should route to database-configured providers', () => {})
  it('should respect provider priority for fallback', () => {})
  it('should reload providers from database', () => {})
  it('should handle provider switching', () => {})
})
```

## Test Execution Workflow

### 1. Run Unit Tests First
```bash
# Run all unit tests
node --test tests/unit/**/*.test.js

# Or individually
node --test tests/unit/services/provider-service.test.js
node --test tests/unit/services/provider-config-service.test.js
node --test tests/unit/services/model-service.test.js
node --test tests/unit/services/provider-model-service.test.js
node --test tests/unit/providers/provider-factory.test.js
node --test tests/unit/providers/provider-registry.test.js
```

### 2. Run Integration Tests
```bash
# Run all integration tests
node --test tests/integration/**/*.test.js

# Or by category
node --test tests/integration/api/
node --test tests/integration/migration.test.js
node --test tests/integration/database.test.js
node --test tests/integration/provider-router.test.js
```

### 3. Run Full Test Suite
```bash
# Run everything
node --test tests/

# With coverage (if configured)
npm run test:coverage
```

## Code Coverage Goals

| Component | Target | Critical Paths |
|-----------|--------|---------------|
| ProviderService | 85%+ | 100% |
| ProviderConfigService | 85%+ | 100% |
| ModelService | 85%+ | 100% |
| ProviderModelService | 85%+ | 100% |
| ProviderFactory | 90%+ | 100% |
| ProviderRegistry | 90%+ | 100% |
| API Routes | 80%+ | 100% |
| Migration | 85%+ | 100% |

## Test Data Patterns

### Reusable Test Data
```javascript
// Test providers
const TEST_PROVIDERS = {
  lmStudio: {
    id: 'test-lm-studio',
    name: 'Test LM Studio',
    type: 'lm-studio',
    enabled: true,
    priority: 10
  },
  qwenProxy: {
    id: 'test-qwen-proxy',
    name: 'Test Qwen Proxy',
    type: 'qwen-proxy',
    enabled: true,
    priority: 5
  },
  qwenDirect: {
    id: 'test-qwen-direct',
    name: 'Test Qwen Direct',
    type: 'qwen-direct',
    enabled: true,
    priority: 7
  }
}

// Test models
const TEST_MODELS = {
  qwen3Max: {
    id: 'qwen3-max',
    name: 'Qwen 3 Max',
    description: 'Most capable Qwen model',
    capabilities: ['chat', 'completion', 'tool-calling']
  },
  qwen3Coder: {
    id: 'qwen3-coder',
    name: 'Qwen 3 Coder',
    description: 'Specialized for coding',
    capabilities: ['chat', 'completion', 'code-generation']
  }
}

// Test configs
const TEST_CONFIGS = {
  lmStudio: {
    baseURL: 'http://localhost:1234/v1',
    timeout: 30000,
    defaultModel: 'qwen3-max'
  },
  qwenProxy: {
    baseURL: 'http://localhost:3000',
    timeout: 60000
  }
}
```

## Common Test Patterns

### Pattern 1: Service CRUD Test
```javascript
describe('ServiceName', () => {
  beforeEach(() => {
    // Clean database
    testDb.prepare('DELETE FROM table_name').run()
  })

  it('should create record', () => {
    const result = TestService.create('id', 'name', { options })
    assert.ok(result.id)
    assert.strictEqual(result.name, 'name')
  })

  it('should retrieve record', () => {
    TestService.create('id', 'name')
    const result = TestService.getById('id')
    assert.ok(result)
  })

  it('should update record', () => {
    TestService.create('id', 'name')
    const result = TestService.update('id', { name: 'new-name' })
    assert.strictEqual(result.name, 'new-name')
  })

  it('should delete record', () => {
    TestService.create('id', 'name')
    TestService.delete('id')
    assert.strictEqual(TestService.getById('id'), undefined)
  })
})
```

### Pattern 2: API Endpoint Test
```javascript
describe('POST /v1/resource', () => {
  it('should create resource with valid data', async () => {
    const response = await fetch(`${BASE_URL}/v1/resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    })

    assert.strictEqual(response.status, 201)
    const data = await response.json()
    assert.ok(data.id)
  })

  it('should return 400 for invalid data', async () => {
    const response = await fetch(`${BASE_URL}/v1/resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing required fields
    })

    assert.strictEqual(response.status, 400)
  })
})
```

## Troubleshooting

### Issue: Tests failing with SQLITE_ERROR
**Cause**: Schema tables don't exist
**Solution**: Use `loadTestSchema()` helper instead of loading schema.sql directly

### Issue: Foreign key constraint failures
**Cause**: `foreign_keys` pragma not enabled
**Solution**: Ensure `db.pragma('foreign_keys = ON')` is called in before() hook

### Issue: Tests hanging or not completing
**Cause**: Database connections not closed
**Solution**: Ensure db.close() is called in after() hook

### Issue: Tests passing locally but failing in CI
**Cause**: Database file path issues or existing test databases
**Solution**:
- Use absolute paths for test databases
- Clean up databases in after() hooks
- Use unique database names per test file

## Success Criteria

Phase 7 is considered complete when:

- [ ] All 11 test files created/updated
- [ ] All tests passing (green)
- [ ] Code coverage >= 80% overall
- [ ] Critical paths have 100% coverage
- [ ] No test database files left in repository
- [ ] Test execution time < 30 seconds total
- [ ] Documentation updated with test results

## Estimated Time to Complete

| Task | Time Estimate |
|------|--------------|
| Fix existing test schema loading | 15 min |
| Create model-service.test.js | 1.5 hours |
| Create provider-model-service.test.js | 2 hours |
| Create provider-factory.test.js | 2 hours |
| Create provider-registry.test.js | 2 hours |
| Create providers-api.test.js | 2.5 hours |
| Create models-api.test.js | 2 hours |
| Create migration.test.js | 1.5 hours |
| Update database.test.js | 1 hour |
| Update provider-router.test.js | 1 hour |
| Run and fix failing tests | 2 hours |
| Generate and analyze coverage | 0.5 hours |
| **Total** | **18 hours** |

## Next Immediate Actions

1. **Fix Schema Loading** (15 min)
   - Update `provider-service.test.js`
   - Update `provider-config-service.test.js`
   - Run tests to verify they pass

2. **Create Remaining Service Tests** (5.5 hours)
   - model-service.test.js
   - provider-model-service.test.js

3. **Create Provider Tests** (4 hours)
   - provider-factory.test.js
   - provider-registry.test.js

4. **Create Integration Tests** (6 hours)
   - providers-api.test.js
   - models-api.test.js
   - migration.test.js

5. **Update Existing Tests** (2 hours)
   - database.test.js
   - provider-router.test.js

6. **Verify and Report** (0.5 hours)
   - Run full test suite
   - Generate coverage report
   - Document results

---

**Last Updated**: October 31, 2025
**Status**: In Progress - 30% Complete
**Next Milestone**: Complete service unit tests (Target: 60% overall completion)
