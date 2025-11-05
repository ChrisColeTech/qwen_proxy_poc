# Request History API - Quick Reference

## Endpoints

### List Requests
```bash
GET /v1/requests?limit=50&offset=0&session_id=...&model=...&stream=true/false&start_date=...&end_date=...
```

**Parameters:**
- `limit` (50) - Page size
- `offset` (0) - Skip count
- `session_id` - Filter by session
- `model` - Filter by model name
- `stream` - Filter by stream flag
- `start_date` - Start timestamp (ms)
- `end_date` - End timestamp (ms)

**Response:** `{ requests: [...], total, limit, offset, has_more }`

---

### Get Request
```bash
GET /v1/requests/:id
```

**Parameters:**
- `id` - Database ID (integer) or UUID

**Response:** Full request object with linked response

---

### Get Session Requests
```bash
GET /v1/sessions/:sessionId/requests?limit=100&offset=0
```

**Parameters:**
- `sessionId` - Session ID
- `limit` (100) - Page size
- `offset` (0) - Skip count

**Response:** `{ session_id, requests: [...], total, limit, offset, has_more }`

---

### Delete Request
```bash
DELETE /v1/requests/:id
```

**Parameters:**
- `id` - Database ID (integer) or UUID

**Response:** `{ success: true, message: "Request deleted" }`

**Note:** Cascades to delete related responses

---

## Common Use Cases

### Recent Requests
```bash
curl http://localhost:3001/v1/requests?limit=10
```

### Filter by Model
```bash
curl http://localhost:3001/v1/requests?model=qwen3-max&limit=20
```

### Filter by Session
```bash
curl http://localhost:3001/v1/requests?session_id=abc123def456
```

### Last 24 Hours
```bash
START=$(date -d '1 day ago' +%s)000
END=$(date +%s)000
curl "http://localhost:3001/v1/requests?start_date=$START&end_date=$END"
```

### Non-Streaming Only
```bash
curl http://localhost:3001/v1/requests?stream=false
```

### Get Full Request Details
```bash
# By database ID
curl http://localhost:3001/v1/requests/123

# By UUID
curl http://localhost:3001/v1/requests/550e8400-e29b-41d4-a716-446655440000
```

### Session Timeline
```bash
curl http://localhost:3001/v1/sessions/abc123/requests?limit=50
```

### Delete Old Request
```bash
curl -X DELETE http://localhost:3001/v1/requests/123
```

---

## Error Codes

- **200** - Success
- **404** - Request not found
- **400** - Bad request (invalid parameters)
- **500** - Server error

---

## Response Fields

### Request Object
```javascript
{
  id: number,              // Database ID
  request_id: string,      // UUID
  session_id: string,      // Session hash
  timestamp: number,       // Unix timestamp (ms)
  method: string,          // "POST"
  path: string,            // "/v1/chat/completions"
  model: string,           // "qwen3-max"
  stream: boolean,         // true/false
  created_at: number,      // Unix timestamp (ms)
  openai_request: object,  // Original OpenAI format
  qwen_request: object,    // Transformed Qwen format
  response?: object        // Linked response (if exists)
}
```

### Response Summary (in lists)
```javascript
{
  response_id: string,
  finish_reason: string,
  total_tokens: number,
  duration_ms: number,
  error: string | null
}
```

---

## Testing

Run the test suite:
```bash
cd tests
./test-requests-api.sh
```

Run with destructive tests:
```bash
DESTRUCTIVE_TESTS=1 ./test-requests-api.sh
```
