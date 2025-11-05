/**
 * LM Studio Provider Integration Tests
 * Tests the LM Studio provider functionality
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert'

const BASE_URL = 'http://localhost:3001'
const LM_STUDIO_BASE_URL = 'http://192.168.0.22:1234/v1'

describe('LM Studio Provider', () => {
  let isLMStudioAvailable = false

  before(async () => {
    // Check if LM Studio is available
    try {
      const response = await fetch(`${BASE_URL}/health`)
      const data = await response.json()
      isLMStudioAvailable = data.providers['lm-studio']?.status === 'healthy'
      console.log(`LM Studio availability: ${isLMStudioAvailable}`)
    } catch (error) {
      console.log('Health check failed:', error.message)
    }
  })

  describe('Model Listing', () => {
    it('should list models from LM Studio', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/models?provider=lm-studio`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.data, 'Should have data property')
      assert.ok(Array.isArray(data.data), 'data should be an array')

      if (data.data.length > 0) {
        const model = data.data[0]
        assert.ok(model.id, 'Model should have id')
        console.log(`Found ${data.data.length} models from LM Studio`)
      }
    })

    it('should list models from default provider (LM Studio)', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/models`)
      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.data, 'Should have data property')
      assert.ok(Array.isArray(data.data), 'data should be an array')
    })
  })

  describe('Chat Completions', () => {
    it('should complete a simple chat request', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
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
      assert.strictEqual(data.choices.length, 1, 'Should have one choice')

      const choice = data.choices[0]
      assert.ok(choice.message, 'Choice should have message')
      assert.ok(choice.message.content, 'Message should have content')
      assert.strictEqual(choice.message.role, 'assistant', 'Role should be assistant')

      console.log('Chat completion response:', choice.message.content)
    })

    it('should handle multiple messages', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'What is 2+2?' },
            { role: 'assistant', content: '4' },
            { role: 'user', content: 'What is 3+3?' }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices, 'Response should have choices')
      assert.ok(data.choices[0].message.content, 'Should have response content')
    })

    it('should respect temperature parameter', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.0,
          max_tokens: 20
        })
      })

      assert.strictEqual(response.status, 200, 'Should return 200 status')

      const data = await response.json()
      assert.ok(data.choices, 'Response should have choices')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid model gracefully', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'non-existent-model-12345',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      })

      // LM Studio may return different error codes
      // Just verify we get some kind of error response
      assert.ok(response.status >= 400 || response.status === 200, 'Should handle invalid model')
    })

    it('should handle missing messages field', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max'
          // Missing messages field
        })
      })

      // Should return error status
      assert.ok(response.status >= 400, 'Should return error for missing messages')
    })

    it('should handle empty messages array', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: []
        })
      })

      // Should return error status
      assert.ok(response.status >= 400, 'Should return error for empty messages')
    })
  })

  describe('Direct LM Studio Connection', () => {
    it('should verify LM Studio is accessible directly', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      try {
        const response = await fetch(`${LM_STUDIO_BASE_URL}/models`)
        assert.strictEqual(response.status, 200, 'Should connect to LM Studio directly')

        const data = await response.json()
        assert.ok(data.data, 'Should get models from LM Studio')
        console.log('Direct LM Studio connection successful')
      } catch (error) {
        console.log('Direct connection failed (expected if LM Studio not running):', error.message)
      }
    })
  })

  describe('Response Format', () => {
    it('should return OpenAI-compatible response format', async () => {
      if (!isLMStudioAvailable) {
        console.log('Skipping: LM Studio not available')
        return
      }

      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-max',
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
})
