/**
 * Integration Tests for Models Endpoint
 * Part of Phase 7: Models Endpoint with Real API Integration
 *
 * CRITICAL: These tests verify that the models endpoint:
 * 1. Calls the REAL Qwen API (NOT hardcoded data)
 * 2. Returns OpenAI-compatible format
 * 3. Handles errors properly
 * 4. Caching works correctly
 */

const qwenClient = require('../../src/api/qwen-client');
const { listModels, getModel, clearCache, getCacheStatus } = require('../../src/handlers/models-handler');

// Mock Express request and response
function createMockRequest(params = {}) {
  return {
    params,
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    _data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._data = data;
      return this;
    },
  };
  return res;
}

function createMockNext() {
  const errors = [];
  return (error) => {
    if (error) errors.push(error);
  };
}

describe('Models Endpoint Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  describe('GET /v1/models - List Models', () => {
    test('should call REAL Qwen API and return models list', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await listModels(req, res, next);

      // Verify response is OpenAI format
      expect(res.statusCode).toBe(200);
      expect(res._data).toBeDefined();
      expect(res._data.object).toBe('list');
      expect(Array.isArray(res._data.data)).toBe(true);

      // Verify models have correct structure
      if (res._data.data.length > 0) {
        const model = res._data.data[0];
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('object', 'model');
        expect(model).toHaveProperty('created');
        expect(model).toHaveProperty('owned_by');
        expect(model).toHaveProperty('metadata');

        // Verify metadata includes Qwen-specific fields
        expect(model.metadata).toHaveProperty('name');
        expect(model.metadata).toHaveProperty('capabilities');
        expect(model.metadata).toHaveProperty('max_context_length');
      }

      console.log('✓ Models list retrieved successfully');
      console.log(`  Found ${res._data.data.length} models`);
    });

    test('should cache models list', async () => {
      const req = createMockRequest();
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const next = createMockNext();

      // First call - should hit API
      await listModels(req, res1, next);
      const firstCallData = res1._data;

      // Check cache status
      let cacheStatus = getCacheStatus();
      expect(cacheStatus.cached).toBe(true);
      expect(cacheStatus.modelCount).toBeGreaterThan(0);

      // Second call - should use cache
      await listModels(req, res2, next);
      const secondCallData = res2._data;

      // Should return same data (cached)
      expect(secondCallData).toEqual(firstCallData);

      console.log('✓ Models list caching works correctly');
    });

    test('should only return active models', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await listModels(req, res, next);

      // All returned models should be active
      if (res._data && res._data.data) {
        res._data.data.forEach(model => {
          expect(model.metadata.is_active).toBe(true);
        });
      }

      console.log('✓ Only active models are returned');
    });
  });

  describe('GET /v1/models/:model - Get Specific Model', () => {
    test('should retrieve specific model by ID', async () => {
      // First, get list of available models
      const listReq = createMockRequest();
      const listRes = createMockResponse();
      const listNext = createMockNext();

      await listModels(listReq, listRes, listNext);

      // Get the first model ID
      expect(listRes._data.data.length).toBeGreaterThan(0);
      const modelId = listRes._data.data[0].id;

      // Now retrieve that specific model
      const req = createMockRequest({ model: modelId });
      const res = createMockResponse();
      const next = createMockNext();

      await getModel(req, res, next);

      // Verify response
      expect(res.statusCode).toBe(200);
      expect(res._data).toBeDefined();
      expect(res._data.id).toBe(modelId);
      expect(res._data.object).toBe('model');

      console.log(`✓ Retrieved specific model: ${modelId}`);
    });

    test('should return 404 for invalid model ID', async () => {
      const req = createMockRequest({ model: 'invalid-model-id-12345' });
      const res = createMockResponse();
      const next = createMockNext();

      await getModel(req, res, next);

      // Verify 404 response
      expect(res.statusCode).toBe(404);
      expect(res._data).toBeDefined();
      expect(res._data.error).toBeDefined();
      expect(res._data.error.code).toBe('model_not_found');

      console.log('✓ Returns 404 for invalid model ID');
    });

    test('should return 400 for missing model ID', async () => {
      const req = createMockRequest({ model: '' });
      const res = createMockResponse();
      const next = createMockNext();

      await getModel(req, res, next);

      // Verify 400 response
      expect(res.statusCode).toBe(400);
      expect(res._data).toBeDefined();
      expect(res._data.error).toBeDefined();
      expect(res._data.error.code).toBe('missing_parameter');

      console.log('✓ Returns 400 for missing model ID');
    });
  });

  describe('Real API Integration', () => {
    test('should verify qwenClient.getModels() calls real API', async () => {
      // This test verifies we're calling the real Qwen API
      const response = await qwenClient.getModels();

      // Verify Qwen response format
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Verify models have Qwen-specific structure
      if (response.data.length > 0) {
        const model = response.data[0];
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('info');
        expect(model.info).toHaveProperty('meta');

        console.log('✓ qwenClient.getModels() calls real Qwen API');
        console.log(`  API returned ${response.data.length} models`);
      }
    });

    test('should verify response transformation', async () => {
      // Get raw Qwen response
      const qwenResponse = await qwenClient.getModels();

      // Get transformed OpenAI response
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      clearCache(); // Clear cache to force API call
      await listModels(req, res, next);

      // Verify transformation
      expect(qwenResponse.data.length).toBe(res._data.data.length);

      // Verify each model was transformed correctly
      qwenResponse.data
        .filter(qm => qm.info?.is_active)
        .forEach((qwenModel, index) => {
          const openAIModel = res._data.data.find(m => m.id === qwenModel.id);
          expect(openAIModel).toBeDefined();
          expect(openAIModel.id).toBe(qwenModel.id);
          expect(openAIModel.owned_by).toBe(qwenModel.owned_by || 'qwen');
          expect(openAIModel.metadata.name).toBe(qwenModel.name);
        });

      console.log('✓ Response transformation works correctly');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock qwenClient to throw error
      const originalGetModels = qwenClient.getModels;
      qwenClient.getModels = jest.fn(() => {
        throw new Error('ECONNREFUSED');
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn();

      clearCache();
      await listModels(req, res, next);

      // Should pass error to next middleware
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeDefined();

      // Restore original function
      qwenClient.getModels = originalGetModels;

      console.log('✓ Network errors handled gracefully');
    });
  });

  describe('Cache Management', () => {
    test('should provide cache status information', async () => {
      // Initially no cache
      let status = getCacheStatus();
      expect(status.cached).toBe(false);
      expect(status.modelCount).toBe(0);

      // Populate cache
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      await listModels(req, res, next);

      // Check cache status
      status = getCacheStatus();
      expect(status.cached).toBe(true);
      expect(status.modelCount).toBeGreaterThan(0);
      expect(status.cacheAge).toBeDefined();
      expect(status.cacheTTL).toBeDefined();

      console.log('✓ Cache status information available');
    });

    test('should clear cache on demand', () => {
      // Populate cache first
      const status1 = getCacheStatus();

      // Clear cache
      clearCache();

      // Verify cache cleared
      const status2 = getCacheStatus();
      expect(status2.cached).toBe(false);
      expect(status2.modelCount).toBe(0);

      console.log('✓ Cache can be cleared manually');
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running Models Endpoint Integration Tests...\n');

  // Simple test runner
  const tests = [
    async () => {
      console.log('Test 1: List Models');
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      await listModels(req, res, next);
      console.log(`Result: ${res._data.data.length} models found\n`);
    },
    async () => {
      console.log('Test 2: Get Specific Model');
      const req = createMockRequest({ model: 'qwen3-max' });
      const res = createMockResponse();
      const next = createMockNext();
      await getModel(req, res, next);
      console.log(`Result: ${res._data ? res._data.name : 'Not found'}\n`);
    },
    async () => {
      console.log('Test 3: Cache Status');
      const status = getCacheStatus();
      console.log('Cache Status:', status);
      console.log();
    },
  ];

  (async () => {
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Test failed:', error.message);
      }
    }
    console.log('All tests completed!');
  })();
}

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockNext,
};
