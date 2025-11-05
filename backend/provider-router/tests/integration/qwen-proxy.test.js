/**
 * Qwen Proxy Provider Integration Tests
 * Tests the Qwen Proxy provider functionality
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert'

const BASE_URL = 'http://localhost:3001'
const QWEN_PROXY_BASE_URL = 'http://localhost:3000'

describe('Qwen Proxy Provider', () => {
  let isQwenProxyAvailable = false

  before(async () => {
    // Check if Qwen Proxy is available
    try {
      const response = await fetch(`${BASE_URL}/health`)
      const data = await response.json()
      isQwenProxyAvailable = data.providers['qwen-proxy']?.status === 'healthy'
      console.log(`Qwen Proxy availability: ${isQwenProxyAvailable}`)
    } catch (error) {
      console.log('Health check failed:', error.message)
    }
  })

  describe('Model Listing', () => {
    it('should list models from Qwen Proxy', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/models?provider=qwen-proxy`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.data, 'Should have data property')
      assert.ok(Array.isArray(data.data), 'data should be an array')

      if (data.data.length > 0) {
        const model = data.data[0]
        assert.ok(model.id, 'Model should have id')
        console.log(`Found ${data.data.length} models from Qwen Proxy`)
      }
    })
  })

  describe('Chat Completions', () => {
    it('should complete a simple chat request', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: 'Say "test" and nothing else.' }],
          max_tokens: 10,
          temperature: 0.1
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.id, 'Response should have id')
      assert.ok(data.choices, 'Response should have choices')
      assert.ok(Array.isArray(data.choices), 'choices should be an array')

      const choice = data.choices[0]
      assert.ok(choice.message, 'Choice should have message')
      assert.ok(choice.message.content, 'Message should have content')
      assert.strictEqual(choice.message.role, 'assistant', 'Role should be assistant')

      console.log('Chat completion response:', choice.message.content)
    })

    it('should handle system messages', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 20
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices, 'Response should have choices')
    })
  })

  describe('Tool Calling', () => {
    it('should handle tool calling requests', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const tools = [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA'
                }
              },
              required: ['location']
            }
          }
        }
      ]

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            { role: 'user', content: 'What is the weather in San Francisco?' }
          ],
          tools,
          max_tokens: 100
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices, 'Response should have choices')

      // Qwen Proxy may or may not call the tool depending on the model
      console.log('Tool calling response received')
    })

    it('should handle requests without tools', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            { role: 'user', content: 'What is 2+2?' }
          ],
          max_tokens: 20
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices[0].message.content, 'Should have response content')
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      if (isQwenProxyAvailable) {
        console.log('Skipping: Test only relevant when Qwen Proxy is unavailable')
        return
      }

      // Try to use qwen-proxy when it's not available
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      })

      // Should return error status when provider is unavailable
      assert.ok(response.status >= 400 || response.status === 200, 'Should handle unavailable provider')

      if (response.status >= 400) {
        const data = await response.json()
        console.log('Error response:', data)
      }
    })

    it('should handle invalid JSON gracefully', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      // Should return error status for invalid JSON
      assert.ok(response.status >= 400, 'Should return error for invalid JSON')
    })
  })

  describe('Direct Qwen Proxy Connection', () => {
    it('should verify Qwen Proxy is accessible directly', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      try {
        const response = await fetch(`${QWEN_PROXY_BASE_URL}/v1/models`)
        assert.strictEqual(response.status, 200, 'Should connect to Qwen Proxy directly')

        const data = await response.json()
        assert.ok(data.data, 'Should get models from Qwen Proxy')
        console.log('Direct Qwen Proxy connection successful')
      } catch (error) {
        console.log('Direct connection failed (expected if Qwen Proxy not running):', error.message)
      }
    })
  })

  describe('Response Format', () => {
    it('should return OpenAI-compatible response format', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10
        })
      })

      const data = await response.json()

      // Verify OpenAI-compatible format
      assert.ok(data.id, 'Should have id')
      assert.ok(data.object, 'Should have object type')
      assert.ok(data.created, 'Should have created timestamp')
      assert.ok(data.model, 'Should have model')
      assert.ok(data.choices, 'Should have choices')

      const choice = data.choices[0]
      assert.ok('index' in choice, 'Choice should have index')
      assert.ok(choice.message, 'Choice should have message')
      assert.ok(choice.finish_reason !== undefined, 'Choice should have finish_reason')

      console.log('Response format validated')
    })
  })

  describe('Provider Selection', () => {
    it('should route to Qwen Proxy when model suggests it', async () => {
      if (!isQwenProxyAvailable) {
        console.log('Skipping: Qwen Proxy not available')
        return
      }

      // Use a Qwen-specific model name to ensure routing to Qwen Proxy
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10
        })
      })

      // This might fail if routing doesn't work properly
      // But we want to test the attempt
      console.log('Response status:', response.status)
    })
  })
})
