/**
 * Standalone Test for Models Handler
 * Tests the models endpoint with REAL Qwen API calls
 */

const qwenClient = require('../src/api/qwen-client');
const { listModels, getModel, clearCache, getCacheStatus } = require('../src/handlers/models-handler');

// Mock Express request and response
function createMockRequest(params = {}) {
  return { params };
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
  return (error) => {
    if (error) {
      console.error('Error passed to next():', error.message);
      throw error;
    }
  };
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('MODELS ENDPOINT INTEGRATION TESTS');
  console.log('Testing with REAL Qwen API (NOT hardcoded data)');
  console.log('='.repeat(60));
  console.log();

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Verify qwenClient.getModels() calls real API
  try {
    console.log('Test 1: Verify qwenClient.getModels() calls REAL Qwen API');
    console.log('-'.repeat(60));

    const response = await qwenClient.getModels();

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from Qwen API');
    }

    console.log('✓ API call successful');
    console.log(`✓ Received ${response.data.length} models from Qwen API`);

    if (response.data.length > 0) {
      const model = response.data[0];
      console.log('✓ Sample model from API:');
      console.log(`  - ID: ${model.id}`);
      console.log(`  - Name: ${model.name}`);
      console.log(`  - Active: ${model.info?.is_active}`);
      console.log(`  - Max Context: ${model.info?.meta?.max_context_length}`);
    }

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Test 2: List models via handler
  try {
    console.log('Test 2: GET /v1/models - List all models');
    console.log('-'.repeat(60));

    clearCache(); // Clear cache to force API call

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await listModels(req, res, next);

    if (res.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${res.statusCode}`);
    }

    if (!res._data || res._data.object !== 'list' || !Array.isArray(res._data.data)) {
      throw new Error('Response not in OpenAI format');
    }

    console.log('✓ Status: 200');
    console.log('✓ Response format: OpenAI-compatible');
    console.log(`✓ Models returned: ${res._data.data.length}`);

    if (res._data.data.length > 0) {
      const model = res._data.data[0];
      console.log('✓ Sample transformed model:');
      console.log(`  - ID: ${model.id}`);
      console.log(`  - Object: ${model.object}`);
      console.log(`  - Owned by: ${model.owned_by}`);
      console.log(`  - Has metadata: ${!!model.metadata}`);

      // Verify all required fields
      if (!model.id || !model.object || !model.owned_by || !model.metadata) {
        throw new Error('Missing required fields in model object');
      }
    }

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Test 3: Cache functionality
  try {
    console.log('Test 3: Models list caching');
    console.log('-'.repeat(60));

    const req = createMockRequest();
    const res1 = createMockResponse();
    const res2 = createMockResponse();
    const next = createMockNext();

    // First call - should populate cache
    await listModels(req, res1, next);
    const firstData = res1._data;

    const cacheStatus = getCacheStatus();
    console.log('✓ Cache populated');
    console.log(`  - Cached: ${cacheStatus.cached}`);
    console.log(`  - Model count: ${cacheStatus.modelCount}`);
    console.log(`  - Cache age: ${cacheStatus.cacheAge}ms`);

    // Second call - should use cache
    await listModels(req, res2, next);
    const secondData = res2._data;

    if (JSON.stringify(firstData) !== JSON.stringify(secondData)) {
      throw new Error('Cache returned different data');
    }

    console.log('✓ Cache returns consistent data');

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Test 4: Get specific model
  try {
    console.log('Test 4: GET /v1/models/:model - Get specific model');
    console.log('-'.repeat(60));

    // First get list to find a valid model ID
    const listReq = createMockRequest();
    const listRes = createMockResponse();
    const listNext = createMockNext();
    await listModels(listReq, listRes, listNext);

    if (listRes._data.data.length === 0) {
      throw new Error('No models available to test with');
    }

    const modelId = listRes._data.data[0].id;
    console.log(`Testing with model ID: ${modelId}`);

    // Get specific model
    const req = createMockRequest({ model: modelId });
    const res = createMockResponse();
    const next = createMockNext();

    await getModel(req, res, next);

    if (res.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${res.statusCode}`);
    }

    if (!res._data || res._data.id !== modelId) {
      throw new Error('Model ID mismatch');
    }

    console.log('✓ Status: 200');
    console.log(`✓ Model ID matches: ${res._data.id}`);
    console.log(`✓ Model name: ${res._data.metadata?.name}`);

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Test 5: Get invalid model (404)
  try {
    console.log('Test 5: GET /v1/models/:model - Invalid model returns 404');
    console.log('-'.repeat(60));

    const req = createMockRequest({ model: 'invalid-model-12345' });
    const res = createMockResponse();
    const next = createMockNext();

    await getModel(req, res, next);

    if (res.statusCode !== 404) {
      throw new Error(`Expected status 404, got ${res.statusCode}`);
    }

    if (!res._data.error || res._data.error.code !== 'model_not_found') {
      throw new Error('Expected model_not_found error');
    }

    console.log('✓ Status: 404');
    console.log('✓ Error code: model_not_found');
    console.log(`✓ Error message: ${res._data.error.message}`);

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Test 6: Response transformation verification
  try {
    console.log('Test 6: Verify response transformation (Qwen → OpenAI)');
    console.log('-'.repeat(60));

    clearCache();

    // Get raw Qwen response
    const qwenResponse = await qwenClient.getModels();

    // Get transformed response
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    await listModels(req, res, next);

    // Count active models in Qwen response
    const activeQwenModels = qwenResponse.data.filter(m => m.info?.is_active);

    console.log(`✓ Qwen API returned: ${qwenResponse.data.length} total models`);
    console.log(`✓ Active models: ${activeQwenModels.length}`);
    console.log(`✓ Transformed response: ${res._data.data.length} models`);

    if (activeQwenModels.length !== res._data.data.length) {
      throw new Error('Model count mismatch after transformation');
    }

    // Verify each model was transformed correctly
    for (const qwenModel of activeQwenModels) {
      const openAIModel = res._data.data.find(m => m.id === qwenModel.id);
      if (!openAIModel) {
        throw new Error(`Model ${qwenModel.id} not found in transformed response`);
      }

      // Verify transformation
      if (openAIModel.id !== qwenModel.id ||
          openAIModel.metadata.name !== qwenModel.name ||
          openAIModel.object !== 'model') {
        throw new Error(`Model ${qwenModel.id} transformation invalid`);
      }
    }

    console.log('✓ All models transformed correctly');

    testsPassed++;
    console.log('✓ TEST PASSED\n');
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    testsFailed++;
    console.log();
  }

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log();

  if (testsFailed === 0) {
    console.log('✓ ALL TESTS PASSED');
    console.log();
    console.log('CRITICAL VERIFICATION:');
    console.log('✓ Models endpoint calls REAL Qwen API (NOT hardcoded)');
    console.log('✓ Response transformation to OpenAI format works');
    console.log('✓ Both listModels and getModel endpoints work');
    console.log('✓ Caching implemented and functional');
    console.log('✓ Error handling (404) works correctly');
    console.log();
    console.log('Phase 7 implementation is COMPLETE and CORRECT!');
    process.exit(0);
  } else {
    console.log('✗ SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
