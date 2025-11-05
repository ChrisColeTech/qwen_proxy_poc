# Phase 6: Requests CRUD API Endpoints

**Status:** ✅ Complete
**Implementation Date:** 2025-10-31
**Specification:** Document 08, Lines 1958-2231

## Overview

This phase implements REST API endpoints for managing and querying request history. All requests to `/v1/chat/completions` are logged to the database and can be retrieved, filtered, and analyzed through these endpoints.

## Files Created

### 1. `/src/routes/requests.js`
Express Router that defines the request history endpoints and maps them to controller functions.

**Routes:**
- `GET /v1/requests` - List all requests with pagination and filtering
- `GET /v1/requests/:id` - Get single request details (by ID or UUID)
- `DELETE /v1/requests/:id` - Delete a request and related responses

### 2. `/src/controllers/requests-controller.js`
Controller with business logic for request history management.

**Functions:**
- `listRequests(req, res, next)` - List requests with filters
- `getRequest(req, res, next)` - Get single request
- `getSessionRequests(req, res, next)` - Get requests for a session
- `deleteRequest(req, res, next)` - Delete request

### 3. `/src/routes/sessions.js` (Modified)
Added route: `GET /v1/sessions/:sessionId/requests`

### 4. `/src/server.js` (Modified)
Registered the requests router at `/v1/requests`

## API Endpoints

### 1. List All Requests

**Endpoint:** `GET /v1/requests`

**Query Parameters:**
- `limit` (optional, default: 50) - Number of requests to return
- `offset` (optional, default: 0) - Number of requests to skip
- `session_id` (optional) - Filter by session ID
- `model` (optional) - Filter by model name (e.g., "qwen3-max")
- `stream` (optional) - Filter by stream flag ("true" or "false")
- `start_date` (optional) - Filter by start date (timestamp in milliseconds)
- `end_date` (optional) - Filter by end date (timestamp in milliseconds)

**Response:**
```json
{
  "requests": [
    {
      "id": 123,
      "request_id": "550e8400-e29b-41d4-a716-446655440000",
      "session_id": "abc123def456",
      "timestamp": 1698765432000,
      "method": "POST",
      "path": "/v1/chat/completions",
      "model": "qwen3-max",
      "stream": false,
      "openai_request": { "messages": [...], "model": "qwen3-max" },
      "qwen_request": { "chat_id": "...", "messages": [...] },
      "response_summary": {
        "response_id": "uuid-here",
        "finish_reason": "stop",
        "total_tokens": 150,
        "duration_ms": 1250,
        "error": null
      }
    }
  ],
  "total": 1234,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

**Example Usage:**
```bash
# List recent requests
curl http://localhost:3001/v1/requests?limit=10

# Filter by model
curl http://localhost:3001/v1/requests?model=qwen3-max

# Filter by session
curl http://localhost:3001/v1/requests?session_id=abc123def456

# Filter by date range (last 24 hours)
START=$(date -d '1 day ago' +%s)000
END=$(date +%s)000
curl "http://localhost:3001/v1/requests?start_date=$START&end_date=$END"

# Filter by stream type
curl http://localhost:3001/v1/requests?stream=false

# Pagination
curl http://localhost:3001/v1/requests?limit=20&offset=40
```

### 2. Get Single Request

**Endpoint:** `GET /v1/requests/:id`

**Parameters:**
- `id` - Request database ID (integer) OR request_id (UUID)

**Response:**
```json
{
  "id": 123,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "abc123def456",
  "timestamp": 1698765432000,
  "method": "POST",
  "path": "/v1/chat/completions",
  "model": "qwen3-max",
  "stream": false,
  "created_at": 1698765432000,
  "openai_request": {
    "model": "qwen3-max",
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "stream": false
  },
  "qwen_request": {
    "chat_id": "chat-123",
    "parent_id": null,
    "messages": [...]
  },
  "response": {
    "id": 456,
    "response_id": "uuid-response",
    "finish_reason": "stop",
    "completion_tokens": 50,
    "prompt_tokens": 100,
    "total_tokens": 150,
    "duration_ms": 1250,
    "openai_response": { ... },
    "qwen_response": { ... }
  }
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Request not found",
    "type": "not_found_error",
    "code": "request_not_found"
  }
}
```

**Example Usage:**
```bash
# Get by database ID
curl http://localhost:3001/v1/requests/123

# Get by UUID
curl http://localhost:3001/v1/requests/550e8400-e29b-41d4-a716-446655440000
```

### 3. Get Requests for Session

**Endpoint:** `GET /v1/sessions/:sessionId/requests`

**Parameters:**
- `sessionId` - Session ID (from sessions table)

**Query Parameters:**
- `limit` (optional, default: 100) - Number of requests to return
- `offset` (optional, default: 0) - Number of requests to skip

**Response:**
```json
{
  "session_id": "abc123def456",
  "requests": [
    {
      "id": 123,
      "request_id": "uuid",
      "session_id": "abc123def456",
      "timestamp": 1698765432000,
      "model": "qwen3-max",
      "stream": false,
      "openai_request": { ... },
      "qwen_request": { ... }
    }
  ],
  "total": 15,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

**Example Usage:**
```bash
# Get all requests for a session
curl http://localhost:3001/v1/sessions/abc123def456/requests

# With pagination
curl http://localhost:3001/v1/sessions/abc123def456/requests?limit=10&offset=0
```

### 4. Delete Request

**Endpoint:** `DELETE /v1/requests/:id`

**Parameters:**
- `id` - Request database ID (integer) OR request_id (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Request deleted"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Request not found",
    "type": "not_found_error",
    "code": "request_not_found"
  }
}
```

**Behavior:**
- Deletes the request record
- Cascades to delete related response (due to foreign key constraint)
- Returns 404 if request doesn't exist

**Example Usage:**
```bash
# Delete by database ID
curl -X DELETE http://localhost:3001/v1/requests/123

# Delete by UUID
curl -X DELETE http://localhost:3001/v1/requests/550e8400-e29b-41d4-a716-446655440000
```

## Implementation Details

### Data Flow

1. **List Requests:**
   - Parse query parameters (limit, offset, filters)
   - Determine query strategy (date range, session, or all)
   - Fetch requests from RequestRepository
   - Enrich with response summaries
   - Return paginated results

2. **Get Request:**
   - Parse ID (integer or UUID)
   - Fetch request from repository
   - Parse JSON fields (openai_request, qwen_request)
   - Fetch linked response
   - Return complete request object

3. **Delete Request:**
   - Parse ID (integer or UUID)
   - Verify request exists (404 if not)
   - Delete from database (cascades to responses)
   - Return success message

### Repository Integration

The controller uses two repositories:
- **RequestRepository** - For request data access
  - `findAll(where, orderBy, limit, offset)`
  - `findById(id)`
  - `getByRequestId(uuid)`
  - `getBySessionId(sessionId, limit, offset)`
  - `getByDateRange(start, end, limit, offset)`
  - `count(where)`
  - `delete(id)`
  - `raw(sql, params)`

- **ResponseRepository** - For linked responses
  - `getByRequestId(requestId)`

### JSON Parsing

All request records store JSON data as strings in the database. The controller:
1. Parses `openai_request` (original OpenAI format)
2. Parses `qwen_request` (transformed Qwen format)
3. Converts `stream` from integer (0/1) to boolean

### ID Resolution

The `getRequest` and `deleteRequest` endpoints support two ID formats:
- **Numeric ID** - Database auto-increment ID (e.g., 123)
- **UUID** - The `request_id` field (e.g., "550e8400-...")

This provides flexibility for clients to reference requests by either identifier.

### Filtering Logic

**Date Range Filtering:**
- When `start_date` AND `end_date` are provided
- Uses custom SQL query for timestamp range
- Timestamps must be in milliseconds

**Session Filtering:**
- When `session_id` is provided
- Uses repository's `getBySessionId` method
- Efficient with index on `session_id`

**Model and Stream Filtering:**
- When `model` or `stream` parameters are provided
- Uses repository's `findAll` with WHERE conditions
- Can be combined (both filters applied)

### Error Handling

All endpoints use Express's `next(error)` pattern:
- Errors are caught and passed to error middleware
- 404 errors are explicitly handled with proper error objects
- Database errors are logged and returned as 500

### Response Summaries

The `listRequests` endpoint enriches each request with a response summary:
- Avoids sending full response payloads in list view
- Includes key metrics (tokens, duration, finish_reason)
- Shows if response has an error
- `null` if no response exists yet

## Testing

### Test Script

Run the comprehensive test suite:
```bash
cd tests
./test-requests-api.sh
```

### Test Coverage

The test script covers:
1. ✅ List all requests (basic pagination)
2. ✅ Filter by model
3. ✅ Filter by stream flag
4. ✅ Get specific request by database ID
5. ✅ Get request by UUID
6. ✅ Get requests for a session
7. ✅ Date range filtering
8. ✅ Pagination parameters
9. ✅ 404 for non-existent request
10. ✅ Delete request (with DESTRUCTIVE_TESTS=1)

### Manual Testing Examples

```bash
# 1. List recent requests
curl http://localhost:3001/v1/requests?limit=5 | jq

# 2. Filter by model
curl http://localhost:3001/v1/requests?model=qwen3-max | jq '.requests | length'

# 3. Get specific request
REQUEST_ID=$(curl -s http://localhost:3001/v1/requests?limit=1 | jq -r '.requests[0].id')
curl http://localhost:3001/v1/requests/$REQUEST_ID | jq

# 4. Get requests for a session
SESSION_ID=$(curl -s http://localhost:3001/v1/sessions?limit=1 | jq -r '.sessions[0].id')
curl http://localhost:3001/v1/sessions/$SESSION_ID/requests | jq

# 5. Test date range (last hour)
END=$(date +%s)000
START=$((END - 3600000))
curl "http://localhost:3001/v1/requests?start_date=$START&end_date=$END" | jq

# 6. Test 404
curl http://localhost:3001/v1/requests/999999 | jq

# 7. Test pagination
curl http://localhost:3001/v1/requests?limit=2&offset=0 | jq
curl http://localhost:3001/v1/requests?limit=2&offset=2 | jq
```

## Integration with Server

The requests router is registered in `server.js`:

```javascript
import requestsRouter from './routes/requests.js'

// Request History Routes
app.use('/v1/requests', requestsRouter)
```

The session requests endpoint is integrated into the sessions router:

```javascript
import { getSessionRequests } from '../controllers/requests-controller.js'

router.get('/:sessionId/requests', getSessionRequests)
```

## Performance Considerations

### Database Indexes

The requests table has indexes on:
- `session_id` - Fast session filtering
- `timestamp` - Fast date range queries
- `request_id` - Fast UUID lookups
- `created_at` - Efficient ordering

### Query Optimization

- **List queries** use LIMIT and OFFSET for pagination
- **Count queries** are separate from data queries
- **Date range queries** use indexed timestamp column
- **Response summaries** fetch responses one-by-one (could be optimized with JOIN)

### Potential Optimizations

For high-volume scenarios:
1. Add composite indexes (e.g., `session_id, timestamp`)
2. Use JOINs for response summaries instead of N+1 queries
3. Implement caching for frequently accessed requests
4. Add query result caching for stats

## Acceptance Criteria

✅ **All 4 endpoints implemented**
- GET /v1/requests - List with pagination ✓
- GET /v1/requests/:id - Get single request ✓
- GET /v1/sessions/:sessionId/requests - Session requests ✓
- DELETE /v1/requests/:id - Delete request ✓

✅ **Proper error handling**
- 404 for non-existent requests ✓
- Error objects with type and code ✓
- Express error middleware integration ✓

✅ **Input validation**
- Query parameter parsing with defaults ✓
- ID format validation (numeric vs UUID) ✓
- Filter parameter validation ✓

✅ **Pagination and filtering work**
- Limit/offset pagination ✓
- Session ID filtering ✓
- Model filtering ✓
- Stream flag filtering ✓
- Date range filtering ✓

✅ **JSON fields properly parsed**
- openai_request parsed from JSON string ✓
- qwen_request parsed from JSON string ✓
- stream converted from integer to boolean ✓

✅ **Integration with server.js**
- Router registered at /v1/requests ✓
- Session requests endpoint added ✓
- Documentation updated ✓

✅ **Test suite provided**
- Comprehensive bash test script ✓
- 10 test cases covering all endpoints ✓
- Manual testing examples ✓

✅ **Documentation provided**
- API endpoint documentation ✓
- Request/response examples ✓
- Implementation details ✓
- Testing guide ✓

## Next Steps

Phase 6 is complete! The next phase is:

**Phase 7: Responses CRUD API Endpoints**
- GET /v1/responses - List all responses
- GET /v1/responses/:id - Get specific response
- GET /v1/requests/:requestId/response - Get response for request
- GET /v1/responses/stats - Usage statistics

## Related Documentation

- [Phase 5: Sessions CRUD API](./PHASE_5_SESSIONS_API.md)
- [Phase 2: Request Repository](./PHASE_2_REPOSITORIES.md)
- [SQLite Implementation Plan](../../docs/08-SQLITE_PERSISTENCE_IMPLEMENTATION_PLAN.md)
- [Test Results](../tests/README.md)
