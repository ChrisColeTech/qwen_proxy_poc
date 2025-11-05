# Phase 7 Integration Guide

## Overview

Phase 7 implements the `/v1/models` endpoint with **REAL API integration** (not hardcoded data). This guide shows how to integrate these handlers into the Express server in Phase 11.

## What Was Implemented

### Files Created

1. **`src/api/qwen-client.js`** - HTTP client for Qwen API
   - `getModels()` - Calls real Qwen API
   - `createChat()` - For chat creation (Phase 8)
   - `sendMessage()` - For completions (Phase 8)

2. **`src/handlers/models-handler.js`** - Route handlers
   - `listModels()` - GET /v1/models
   - `getModel()` - GET /v1/models/:model
   - Response transformation (Qwen → OpenAI)
   - 1-hour caching

3. **Tests** - Integration tests
   - `tests/test-models-handler.js` - Standalone tests (✓ All passing)
   - `tests/verify-phase7.js` - Phase verification
   - `tests/integration/models-endpoint.test.js` - Jest suite

## Phase 11 Integration

### In `src/server.js`:

```javascript
const express = require('express');
const { listModels, getModel } = require('./handlers/models-handler');

const app = express();

// ... other middleware ...

// Models endpoints
app.get('/v1/models', listModels);
app.get('/v1/models/:model', getModel);

// ... other routes ...

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

That's it! The handlers are ready to use.

## API Endpoints

### GET /v1/models

Lists all available models from Qwen API.

**Request:**
```bash
curl http://localhost:3000/v1/models
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "created": 1234567890,
      "owned_by": "qwen",
      "permission": [],
      "root": "qwen3-max",
      "parent": null,
      "metadata": {
        "name": "Qwen3-Max",
        "description": "The most powerful language model in the Qwen series.",
        "capabilities": {
          "vision": true,
          "document": true,
          "video": true,
          "audio": true,
          "citations": true
        },
        "max_context_length": 262144,
        "max_generation_length": 32768,
        "chat_types": ["t2t", "t2v", "t2i", ...],
        "is_active": true
      }
    },
    // ... more models ...
  ]
}
```

### GET /v1/models/:model

Retrieves a specific model by ID.

**Request:**
```bash
curl http://localhost:3000/v1/models/qwen3-max
```

**Response:**
```json
{
  "id": "qwen3-max",
  "object": "model",
  "created": 1234567890,
  "owned_by": "qwen",
  "permission": [],
  "root": "qwen3-max",
  "parent": null,
  "metadata": {
    "name": "Qwen3-Max",
    "description": "...",
    "capabilities": { ... },
    "max_context_length": 262144,
    "max_generation_length": 32768
  }
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Model 'invalid-model' not found",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

## Critical Implementation Details

### Why This is NOT Hardcoded

**WRONG (Previous implementation - DELETED):**
```javascript
function listModels(req, res) {
  const models = [
    { id: 'qwen3-max', ... }, // ✗ HARDCODED!
    { id: 'qwen-plus', ... }
  ];
  res.json({ data: models });
}
```

**CORRECT (Current implementation):**
```javascript
async function listModels(req, res, next) {
  try {
    // ✓ REAL API CALL to Qwen
    const response = await qwenClient.getModels();

    // ✓ Transform to OpenAI format
    const openAIModels = {
      object: 'list',
      data: response.data
        .filter(model => model.info?.is_active)
        .map(transformQwenModelToOpenAI)
    };

    res.json(openAIModels);
  } catch (error) {
    next(error);
  }
}
```

### Real API Call Chain

1. Client calls: `GET /v1/models`
2. Handler calls: `await qwenClient.getModels()`
3. Client makes HTTP: `GET https://chat.qwen.ai/api/models`
4. Qwen responds with: Native Qwen format
5. Handler transforms: Qwen → OpenAI format
6. Handler caches: Result for 1 hour
7. Client receives: OpenAI-compatible response

### Caching

- **Duration:** 1 hour (configurable via `config.cache.modelsCacheDuration`)
- **Strategy:** In-memory, time-based expiration
- **Benefits:** Reduces API calls, faster responses
- **Management:** `clearCache()` and `getCacheStatus()` utilities

## Dependencies

### Used By models-handler.js:
- ✓ `src/api/qwen-client.js` (Phase 5) - HTTP client
- ✓ `src/config/index.js` (Phase 1) - Configuration

### Will Be Used By:
- Phase 11: `src/server.js` - Route registration
- Phase 8: `src/handlers/chat-completion-handler.js` - Will use qwen-client

## Testing

### Run Integration Tests:
```bash
node tests/test-models-handler.js
```

### Run Verification:
```bash
node tests/verify-phase7.js
```

### Expected Output:
```
✓ ALL TESTS PASSED (6/6)
✓ Models endpoint calls REAL Qwen API (NOT hardcoded)
✓ Response transformation to OpenAI format works
✓ Both listModels and getModel endpoints work
✓ Caching implemented and functional
✓ Error handling (404) works correctly
```

## Error Handling

The handlers pass errors to Express error middleware via `next(error)`:

- **Network errors:** QwenAPIError with status code
- **Auth errors:** Caught at qwen-auth.js level
- **Not found:** 404 with OpenAI error format
- **Missing params:** 400 with clear message

In Phase 10 (Error Handling Middleware), these errors will be caught and transformed to OpenAI-compatible error responses.

## OpenAI Compatibility

The response format matches the OpenAI models endpoint exactly:

- ✓ Object type: "list"
- ✓ Data array: Contains model objects
- ✓ Model fields: id, object, created, owned_by, permission, root, parent
- ✓ Metadata: Qwen-specific info preserved

Existing OpenAI client libraries will work without modification.

## Next Steps (Phase 11)

1. Create `src/server.js`
2. Import handlers: `const { listModels, getModel } = require('./handlers/models-handler')`
3. Register routes:
   - `app.get('/v1/models', listModels)`
   - `app.get('/v1/models/:model', getModel)`
4. Start server
5. Test endpoints

## Verification Checklist

- [x] qwenClient.getModels() calls real Qwen API
- [x] Response transformation works correctly
- [x] listModels handler returns OpenAI format
- [x] getModel handler retrieves specific model
- [x] 404 error for invalid models
- [x] Caching implemented
- [x] All tests passing
- [x] Ready for Phase 11 integration

## Summary

Phase 7 is **COMPLETE** and **READY** for Phase 11 integration. The models endpoint:

- ✓ Calls the REAL Qwen API (NOT hardcoded)
- ✓ Transforms responses to OpenAI format
- ✓ Implements caching (1-hour TTL)
- ✓ Handles errors properly
- ✓ Is fully tested (6/6 tests passing)

The implementation resolves the "2% issue" that caused the previous backend to be deleted. All data comes from real-time API calls to Qwen, not hardcoded values.
