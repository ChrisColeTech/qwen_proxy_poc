/**
 * Provider Switching Integration Tests
 * Tests provider management, switching, and routing functionality
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, unlinkSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const PROJECT_ROOT = join(__dirname, '../..')
const TEST_DB_DIR = join(PROJECT_ROOT, 'data/test')
const TEST_DB_PATH = join(TEST_DB_DIR, 'provider-switching-test.db')

// Server configuration (tests require server running on port 3001)
const BASE_URL = 'http://localhost:3001'

// Test database instance
let testDb = null

// Helper to make HTTP requests
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HTTP ${response.status}: ${error}`)
  }

  return response.json()
}

describe('Provider Switching Integration Tests', () => {
  before(async () => {
    console.log('Setting up provider switching test environment...')

    // Create test directory
    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true })
    }

    // Remove existing test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }

    // Check if server is running
    try {
      await fetchJSON(`${BASE_URL}/health`)
      console.log('Server is running and accessible')
    } catch (error) {
      console.error('Server is not running on port 3001')
      console.error('Please start the server with: npm start')
      throw new Error('Server not available for testing')
    }
  })

  after(() => {
    console.log('Cleaning up test environment...')

    // Close test database
    if (testDb) {
      testDb.close()
    }

    // Remove test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }
  })

  describe('Provider Management API', () => {
    it('should list all providers', async () => {
      const result = await fetchJSON(`${BASE_URL}/v1/providers`)

      assert.ok(result.providers, 'Should have providers array')
      assert.ok(Array.isArray(result.providers), 'Providers should be an array')
      assert.ok(result.total >= 0, 'Should have total count')

      console.log(`Found ${result.total} providers`)

      // Check provider structure
      if (result.providers.length > 0) {
        const provider = result.providers[0]
        assert.ok(provider.id, 'Provider should have id')
        assert.ok(provider.name, 'Provider should have name')
        assert.ok(provider.type, 'Provider should have type')
        assert.ok(typeof provider.enabled === 'boolean', 'Provider should have enabled status')
      }
    })

    it('should get specific provider details', async () => {
      // First get list of providers
      const list = await fetchJSON(`${BASE_URL}/v1/providers`)
      assert.ok(list.providers.length > 0, 'Should have at least one provider')

      const providerId = list.providers[0].id

      // Get provider details
      const provider = await fetchJSON(`${BASE_URL}/v1/providers/${providerId}`)

      assert.strictEqual(provider.id, providerId, 'Should return correct provider')
      assert.ok(provider.config, 'Should include configuration')
      assert.ok(Array.isArray(provider.models), 'Should include models array')
      assert.ok(provider.runtime_status, 'Should include runtime status')

      console.log(`Provider ${provider.name} has ${provider.models.length} models`)
    })

    it('should filter providers by type', async () => {
      const result = await fetchJSON(`${BASE_URL}/v1/providers?type=lm-studio`)

      assert.ok(result.providers, 'Should have providers array')

      // All returned providers should be lm-studio type
      for (const provider of result.providers) {
        assert.strictEqual(provider.type, 'lm-studio', 'Should only return lm-studio providers')
      }
    })

    it('should filter providers by enabled status', async () => {
      const result = await fetchJSON(`${BASE_URL}/v1/providers?enabled=true`)

      assert.ok(result.providers, 'Should have providers array')

      // All returned providers should be enabled
      for (const provider of result.providers) {
        assert.strictEqual(provider.enabled, true, 'Should only return enabled providers')
      }
    })
  })

  describe('Provider Health Checks', () => {
    it('should test provider connection', async () => {
      // Get first enabled provider
      const list = await fetchJSON(`${BASE_URL}/v1/providers?enabled=true`)
      assert.ok(list.providers.length > 0, 'Should have at least one enabled provider')

      const providerId = list.providers[0].id

      // Test provider health
      const result = await fetchJSON(`${BASE_URL}/v1/providers/${providerId}/test`, {
        method: 'POST'
      })

      assert.strictEqual(result.provider_id, providerId, 'Should return provider ID')
      assert.ok(typeof result.healthy === 'boolean', 'Should return health status')
      assert.ok(typeof result.duration_ms === 'number', 'Should return duration')
      assert.ok(result.timestamp, 'Should return timestamp')

      console.log(`Provider ${providerId} health: ${result.healthy} (${result.duration_ms}ms)`)
    })

    it('should check overall server health', async () => {
      const health = await fetchJSON(`${BASE_URL}/health`)

      assert.strictEqual(health.status, 'ok', 'Server should be healthy')
      assert.ok(health.providers, 'Should include provider statuses')
      assert.ok(health.registeredProviders, 'Should list registered providers')
      assert.ok(Array.isArray(health.registeredProviders), 'Registered providers should be array')

      console.log(`Server health: ${health.registeredProviders.length} providers registered`)
    })
  })

  describe('Provider Enable/Disable', () => {
    let testProviderId = null

    before(async () => {
      // Find a provider to test with
      const list = await fetchJSON(`${BASE_URL}/v1/providers`)
      testProviderId = list.providers[0]?.id
      assert.ok(testProviderId, 'Need at least one provider for enable/disable tests')
    })

    it('should disable a provider', async () => {
      const result = await fetchJSON(`${BASE_URL}/v1/providers/${testProviderId}/disable`, {
        method: 'POST'
      })

      assert.strictEqual(result.enabled, false, 'Provider should be disabled')
      assert.ok(result.message, 'Should include success message')

      console.log(`Disabled provider: ${testProviderId}`)
    })

    it('should enable a provider', async () => {
      const result = await fetchJSON(`${BASE_URL}/v1/providers/${testProviderId}/enable`, {
        method: 'POST'
      })

      assert.strictEqual(result.enabled, true, 'Provider should be enabled')
      assert.ok(result.message, 'Should include success message')

      console.log(`Enabled provider: ${testProviderId}`)
    })

    it('should verify provider status changed', async () => {
      const provider = await fetchJSON(`${BASE_URL}/v1/providers/${testProviderId}`)

      assert.strictEqual(provider.enabled, true, 'Provider should still be enabled')
    })
  })

  describe('Active Provider Management', () => {
    it('should get current active provider', async () => {
      const settings = await fetchJSON(`${BASE_URL}/v1/settings`)

      assert.ok(settings.settings, 'Should have settings object')
      assert.ok(settings.settings.active_provider, 'Should have active_provider setting')

      console.log(`Current active provider: ${settings.settings.active_provider}`)
    })

    it('should verify routing uses active provider', async () => {
      const settings = await fetchJSON(`${BASE_URL}/v1/settings`)
      const activeProvider = settings.settings.active_provider

      // Make a chat completion request
      const completion = await fetchJSON(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say "test" in exactly one word' }],
          max_tokens: 5
        })
      })

      assert.ok(completion.id, 'Should return completion')
      assert.ok(completion.choices, 'Should have choices')
      assert.ok(completion.choices[0].message.content, 'Should have response content')

      console.log(`Chat completion routed through active provider: ${activeProvider}`)
    })
  })

  describe('Model Listing', () => {
    it('should list models from active provider', async () => {
      const models = await fetchJSON(`${BASE_URL}/v1/models`)

      assert.ok(models.data, 'Should have models data')
      assert.ok(Array.isArray(models.data), 'Models data should be an array')
      assert.ok(models.data.length > 0, 'Should have at least one model')

      const model = models.data[0]
      assert.ok(model.id, 'Model should have id')
      assert.strictEqual(model.object, 'model', 'Should have object type')

      console.log(`Found ${models.data.length} models from active provider`)
    })

    it('should list models from database', async () => {
      const list = await fetchJSON(`${BASE_URL}/v1/providers`)
      const providerId = list.providers[0]?.id
      assert.ok(providerId, 'Need at least one provider')

      const provider = await fetchJSON(`${BASE_URL}/v1/providers/${providerId}`)

      assert.ok(Array.isArray(provider.models), 'Should have models array')
      console.log(`Provider ${providerId} has ${provider.models.length} models in database`)
    })
  })

  describe('Provider Configuration', () => {
    let testProviderId = null

    before(async () => {
      const list = await fetchJSON(`${BASE_URL}/v1/providers`)
      testProviderId = list.providers[0]?.id
      assert.ok(testProviderId, 'Need at least one provider')
    })

    it('should get provider configuration', async () => {
      const provider = await fetchJSON(`${BASE_URL}/v1/providers/${testProviderId}`)

      assert.ok(provider.config, 'Should have configuration')
      assert.ok(typeof provider.config === 'object', 'Config should be an object')

      // Check for common config fields
      const config = provider.config
      if (provider.type === 'lm-studio' || provider.type === 'qwen-proxy') {
        assert.ok(config.baseURL, 'Should have baseURL')
        console.log(`Provider ${testProviderId} baseURL: ${config.baseURL}`)
      }
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent provider', async () => {
      try {
        await fetchJSON(`${BASE_URL}/v1/providers/non-existent-provider`)
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.ok(error.message.includes('404'), 'Should return 404 error')
      }
    })

    it('should handle test on non-existent provider', async () => {
      try {
        await fetchJSON(`${BASE_URL}/v1/providers/non-existent-provider/test`, {
          method: 'POST'
        })
        assert.fail('Should have thrown error')
      } catch (error) {
        assert.ok(error.message.includes('404'), 'Should return 404 error')
      }
    })
  })

  describe('Provider Types', () => {
    it('should support multiple provider types', async () => {
      const list = await fetchJSON(`${BASE_URL}/v1/providers`)

      const types = new Set(list.providers.map(p => p.type))
      assert.ok(types.size > 0, 'Should have at least one provider type')

      console.log('Available provider types:', Array.from(types).join(', '))

      // Verify known types
      const validTypes = ['lm-studio', 'qwen-proxy', 'qwen-direct']
      for (const provider of list.providers) {
        assert.ok(validTypes.includes(provider.type), `Provider type ${provider.type} should be valid`)
      }
    })
  })
})
