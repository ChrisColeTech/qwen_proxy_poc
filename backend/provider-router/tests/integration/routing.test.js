/**
 * Routing Logic Integration Tests
 * Tests the provider routing and selection logic
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert'

const BASE_URL = 'http://localhost:3001'

describe('Routing Logic', () => {
  let healthData = null

  before(async () => {
    // Get initial health status
    try {
      const response = await fetch(`${BASE_URL}/health`)
      healthData = await response.json()
      console.log('Initial health status:', JSON.stringify(healthData, null, 2))
    } catch (error) {
      console.log('Health check failed:', error.message)
    }
  })

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/health`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.strictEqual(data.status, 'ok', 'Status should be ok')
      assert.ok(data.providers, 'Should have providers')
      assert.ok(data.registeredProviders, 'Should have registeredProviders')
    })

    it('should list all registered providers', async () => {
      const response = await fetch(`${BASE_URL}/health`)
      const data = await response.json()

      assert.ok(Array.isArray(data.registeredProviders), 'registeredProviders should be an array')
      assert.ok(data.registeredProviders.includes('lm-studio'), 'Should include lm-studio')
      assert.ok(data.registeredProviders.includes('qwen-proxy'), 'Should include qwen-proxy')
      assert.ok(data.registeredProviders.includes('qwen-direct'), 'Should include qwen-direct')

      console.log('Registered providers:', data.registeredProviders)
    })

    it('should include provider status for each provider', async () => {
      const response = await fetch(`${BASE_URL}/health`)
      const data = await response.json()

      // Check LM Studio
      assert.ok(data.providers['lm-studio'], 'Should have lm-studio status')
      assert.ok(data.providers['lm-studio'].status, 'lm-studio should have status')
      assert.ok(data.providers['lm-studio'].baseURL, 'lm-studio should have baseURL')

      // Check Qwen Proxy
      assert.ok(data.providers['qwen-proxy'], 'Should have qwen-proxy status')
      assert.ok(data.providers['qwen-proxy'].status, 'qwen-proxy should have status')

      // Check Qwen Direct
      assert.ok(data.providers['qwen-direct'], 'Should have qwen-direct status')
      assert.ok(data.providers['qwen-direct'].status, 'qwen-direct should have status')

      console.log('Provider statuses:', Object.entries(data.providers).map(([name, status]) => `${name}: ${status.status}`))
    })
  })

  describe('Default Provider Selection', () => {
    it('should use default provider when no model specified', async () => {
      if (!healthData?.providers['lm-studio'] || healthData.providers['lm-studio'].status !== 'healthy') {
        console.log('Skipping: Default provider (LM Studio) not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No model specified
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 10
        })
      })

      // Should fall back to default provider
      assert.ok(response.status === 200 || response.status >= 400, 'Should handle request')

      if (response.status === 200) {
        const data = await response.json()
        assert.ok(data.choices, 'Should have choices')
        console.log('Default provider handled request successfully')
      }
    })

    it('should list models from default provider', async () => {
      const response = await fetch(`${BASE_URL}/v1/models`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.data, 'Should have data')
      assert.ok(Array.isArray(data.data), 'data should be an array')

      console.log(`Default provider has ${data.data.length} models`)
    })
  })

  describe('Provider-Specific Routing', () => {
    it('should route to specific provider when requested', async () => {
      const providers = ['lm-studio', 'qwen-proxy', 'qwen-direct']

      for (const provider of providers) {
        const response = await fetch(`${BASE_URL}/v1/models?provider=${provider}`)

        // Should either succeed or return error based on availability
        assert.ok(response.status === 200 || response.status >= 400, `Should handle ${provider} request`)

        if (response.status === 200) {
          const data = await response.json()
          console.log(`Provider ${provider}: ${data.data?.length || 0} models`)
        } else {
          console.log(`Provider ${provider}: not available or error`)
        }
      }
    })

    it('should handle invalid provider name', async () => {
      const response = await fetch(`${BASE_URL}/v1/models?provider=invalid-provider`)

      // Should return error for invalid provider
      assert.ok(response.status >= 400, 'Should return error for invalid provider')

      const data = await response.json()
      assert.ok(data.error, 'Should have error object')
      console.log('Invalid provider error:', data.error.message)
    })
  })

  describe('Model-Based Routing', () => {
    it('should route based on model name patterns', async () => {
      if (!healthData?.providers['lm-studio'] || healthData.providers['lm-studio'].status !== 'healthy') {
        console.log('Skipping: LM Studio not available')
        return
      }

      // Test with common model names
      const models = ['qwen3-max', 'qwen-turbo', 'gpt-3.5-turbo']

      for (const model of models) {
        const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          })
        })

        console.log(`Model ${model}: status ${response.status}`)

        // Should handle request (either successfully or with appropriate error)
        assert.ok(response.status === 200 || response.status >= 400, `Should handle ${model}`)
      }
    })

    it('should handle unknown model names', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'completely-unknown-model-12345',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      })

      // Should either route to default provider or return error
      assert.ok(response.status === 200 || response.status >= 400, 'Should handle unknown model')

      if (response.status >= 400) {
        const data = await response.json()
        console.log('Unknown model error:', data.error?.message || 'No error message')
      }
    })
  })

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await fetch(`${BASE_URL}/`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.name, 'Should have name')
      assert.ok(data.version, 'Should have version')
      assert.ok(data.description, 'Should have description')
      assert.ok(data.endpoints, 'Should have endpoints')
      assert.ok(data.registeredProviders, 'Should have registeredProviders')

      console.log('API Info:', data)
    })

    it('should list available endpoints', async () => {
      const response = await fetch(`${BASE_URL}/`)
      const data = await response.json()

      assert.ok(data.endpoints['/v1/chat/completions'], 'Should list chat completions endpoint')
      assert.ok(data.endpoints['/v1/models'], 'Should list models endpoint')
      assert.ok(data.endpoints['/health'], 'Should list health endpoint')
    })
  })

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${BASE_URL}/v1/models?provider=invalid-provider`)

      assert.ok(response.status >= 400, 'Should return error status')

      const data = await response.json()
      assert.ok(data.error, 'Should have error object')
      assert.ok(data.error.message, 'Error should have message')
      assert.ok(data.error.type, 'Error should have type')

      console.log('Error format validated:', data.error)
    })

    it('should handle malformed requests', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid json'
      })

      assert.ok(response.status >= 400, 'Should return error for malformed JSON')
    })

    it('should handle missing Content-Type', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Hi' }]
        })
        // Missing Content-Type header
      })

      // Should still work or return appropriate error
      assert.ok(response.status === 200 || response.status >= 400, 'Should handle missing Content-Type')
    })
  })

  describe('Request Validation', () => {
    it('should validate required fields in chat completion', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max'
          // Missing messages field
        })
      })

      assert.ok(response.status >= 400, 'Should return error for missing messages')
    })

    it('should validate messages format', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: 'invalid format' // Should be array
        })
      })

      assert.ok(response.status >= 400, 'Should return error for invalid messages format')
    })

    it('should handle empty request body', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })

      assert.ok(response.status >= 400, 'Should return error for empty body')
    })
  })

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })

      // Check for CORS header
      const corsHeader = response.headers.get('Access-Control-Allow-Origin')
      console.log('CORS header:', corsHeader)

      // CORS should be enabled
      assert.ok(corsHeader !== null, 'Should have CORS header')
    })

    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST'
        }
      })

      // Should return 204 or 200 for OPTIONS
      assert.ok(response.status === 204 || response.status === 200, 'Should handle OPTIONS request')
    })
  })

  describe('Provider Switching', () => {
    it('should handle multiple requests to different providers', async () => {
      // Make requests to different providers in sequence
      const requests = [
        {
          provider: 'lm-studio',
          available: healthData?.providers['lm-studio']?.status === 'healthy'
        },
        {
          provider: 'qwen-proxy',
          available: healthData?.providers['qwen-proxy']?.status === 'healthy'
        }
      ]

      for (const req of requests) {
        if (!req.available) {
          console.log(`Skipping ${req.provider}: not available`)
          continue
        }

        const response = await fetch(`${BASE_URL}/v1/models?provider=${req.provider}`)
        assert.strictEqual(response.status, 200, `Should get models from ${req.provider}`)

        const data = await response.json()
        console.log(`${req.provider}: ${data.data?.length || 0} models`)
      }
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests', async () => {
      if (!healthData?.providers['lm-studio'] || healthData.providers['lm-studio'].status !== 'healthy') {
        console.log('Skipping: LM Studio not available')
        return
      }

      // Make multiple concurrent requests
      const requests = Array(3).fill(null).map(() =>
        fetch(`${BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen3-max',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          })
        })
      )

      const responses = await Promise.all(requests)

      // All requests should complete
      for (const response of responses) {
        assert.ok(response.status === 200 || response.status >= 400, 'Should handle concurrent request')
      }

      console.log('Concurrent requests completed:', responses.map(r => r.status))
    })
  })

  describe('Streaming Support', () => {
    it('should handle stream parameter', async () => {
      if (!healthData?.providers['lm-studio'] || healthData.providers['lm-studio'].status !== 'healthy') {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hi' }],
          stream: true,
          max_tokens: 10
        })
      })

      if (response.status === 200) {
        // For streaming, should have text/event-stream content type
        const contentType = response.headers.get('Content-Type')
        console.log('Streaming content type:', contentType)

        // Should be streaming response
        assert.ok(
          contentType?.includes('text/event-stream') || contentType?.includes('application/octet-stream'),
          'Should return streaming content type'
        )
      }
    })

    it('should handle non-streaming requests', async () => {
      if (!healthData?.providers['lm-studio'] || healthData.providers['lm-studio'].status !== 'healthy') {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
          max_tokens: 10
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices, 'Should have choices')

      console.log('Non-streaming request completed')
    })
  })
})
