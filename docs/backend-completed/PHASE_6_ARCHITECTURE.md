# Phase 6 Architecture Diagram

## Request Flow

```
Client Request
      |
      v
┌─────────────────────────────────────────┐
│  Express Server (server.js)             │
│  - CORS middleware                       │
│  - JSON parser                           │
│  - Request logger                        │
│  - Database logger                       │
└─────────────────┬───────────────────────┘
                  |
                  v
┌─────────────────────────────────────────┐
│  Requests Router                         │
│  /v1/requests                            │
│                                          │
│  Routes:                                 │
│  - GET    /                              │
│  - GET    /:id                           │
│  - DELETE /:id                           │
└─────────────────┬───────────────────────┘
                  |
                  v
┌─────────────────────────────────────────┐
│  Requests Controller                     │
│  (requests-controller.js)                │
│                                          │
│  Functions:                              │
│  - listRequests()                        │
│  - getRequest()                          │
│  - deleteRequest()                       │
│  - getSessionRequests()                  │
└──────────┬──────────────┬───────────────┘
           |              |
           v              v
    ┌──────────────┐  ┌──────────────┐
    │  Request     │  │  Response    │
    │  Repository  │  │  Repository  │
    └──────┬───────┘  └──────┬───────┘
           |                 |
           v                 v
    ┌─────────────────────────────┐
    │  SQLite Database            │
    │  - requests table           │
    │  - responses table          │
    └─────────────────────────────┘
```

## Session Requests Flow

```
Client Request
      |
      v
┌─────────────────────────────────────────┐
│  Express Server (server.js)             │
│  /v1/sessions                            │
└─────────────────┬───────────────────────┘
                  |
                  v
┌─────────────────────────────────────────┐
│  Sessions Router                         │
│  /v1/sessions                            │
│                                          │
│  Routes:                                 │
│  - GET /:sessionId/requests              │
└─────────────────┬───────────────────────┘
                  |
                  v
┌─────────────────────────────────────────┐
│  Requests Controller                     │
│  getSessionRequests()                    │
└─────────────────┬───────────────────────┘
                  |
                  v
           ┌──────────────┐
           │  Request     │
           │  Repository  │
           └──────┬───────┘
                  |
                  v
           ┌─────────────────────────────┐
           │  SQLite Database            │
           │  - requests table           │
           │  WHERE session_id = ?       │
           └─────────────────────────────┘
```

## Component Responsibilities

### Routes Layer (`src/routes/requests.js`)
**Responsibility:** Define HTTP endpoints and route to controllers
- Maps URL paths to controller functions
- Defines HTTP methods (GET, DELETE)
- No business logic

### Controller Layer (`src/controllers/requests-controller.js`)
**Responsibility:** Handle HTTP requests and implement business logic
- Parse query parameters
- Validate input
- Call repository methods
- Format responses
- Handle errors
- Return HTTP status codes

### Repository Layer (`src/database/repositories/`)
**Responsibility:** Data access and database operations
- Execute SQL queries
- Handle database transactions
- Parse/serialize JSON
- Provide clean API to controllers

### Database Layer (`data/qwen_proxy_opencode.db`)
**Responsibility:** Persist data
- Store request records
- Maintain indexes
- Enforce foreign keys
- Handle cascading deletes

## Data Flow - List Requests

```
1. Client sends:
   GET /v1/requests?limit=10&model=qwen3-max

2. Server routes to:
   requestsController.listRequests()

3. Controller:
   - Parses limit=10, model=qwen3-max
   - Calls requestRepo.findAll({ model: 'qwen3-max' }, ...)

4. Repository:
   - Executes: SELECT * FROM requests WHERE model = ? LIMIT 10
   - Parses JSON fields
   - Returns array of request objects

5. Controller:
   - Calls responseRepo.getByRequestId() for each request
   - Builds response summaries
   - Counts total with requestRepo.count({ model: 'qwen3-max' })

6. Server sends:
   {
     requests: [...],
     total: 45,
     limit: 10,
     offset: 0,
     has_more: true
   }
```

## Data Flow - Get Request

```
1. Client sends:
   GET /v1/requests/123

2. Server routes to:
   requestsController.getRequest()

3. Controller:
   - Parses id=123 (numeric)
   - Calls requestRepo.findById(123)

4. Repository:
   - Executes: SELECT * FROM requests WHERE id = ?
   - Parses JSON fields
   - Returns request object

5. Controller:
   - Calls responseRepo.getByRequestId(123)
   - Merges response into request object

6. Server sends:
   {
     id: 123,
     request_id: "uuid",
     openai_request: { ... },
     qwen_request: { ... },
     response: { ... }
   }
```

## Data Flow - Delete Request

```
1. Client sends:
   DELETE /v1/requests/123

2. Server routes to:
   requestsController.deleteRequest()

3. Controller:
   - Parses id=123
   - Calls requestRepo.findById(123) to verify exists
   - Returns 404 if not found
   - Calls requestRepo.delete(123)

4. Repository:
   - Executes: DELETE FROM requests WHERE id = ?
   - Foreign key cascade deletes responses

5. Database:
   - Deletes request record (id=123)
   - Automatically deletes linked responses

6. Server sends:
   {
     success: true,
     message: "Request deleted"
   }
```

## Filter Strategy Selection

```
Controller receives query parameters
           |
           v
    Has start_date AND end_date?
           |
    YES ───┴─── NO
     |           |
     v           v
Date Range   Has session_id?
  Query         |
              YES ─┴─ NO
               |       |
               v       v
           Session  All Requests
            Query   with Filters
```

### Date Range Query
- Uses: `requestRepo.getByDateRange(start, end, limit, offset)`
- SQL: `WHERE timestamp >= ? AND timestamp <= ?`
- Optimized with `idx_requests_timestamp`

### Session Query
- Uses: `requestRepo.getBySessionId(sessionId, limit, offset)`
- SQL: `WHERE session_id = ?`
- Optimized with `idx_requests_session_id`

### All Requests Query
- Uses: `requestRepo.findAll(where, orderBy, limit, offset)`
- Builds WHERE clause from filters (model, stream)
- SQL: `WHERE model = ? AND stream = ?`

## Error Handling Flow

```
Controller throws/catches error
           |
           v
    Is it a known error?
           |
    YES ───┴─── NO
     |           |
     v           v
  Return     Pass to
  404/400    next(error)
     |           |
     v           v
  Client    Error Middleware
  receives    (server.js)
  error          |
                 v
              Client receives
              500 error
```

## Database Schema

```sql
-- Requests Table
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  timestamp INTEGER NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  openai_request TEXT NOT NULL,     -- JSON string
  qwen_request TEXT NOT NULL,       -- JSON string
  model TEXT NOT NULL,
  stream BOOLEAN NOT NULL,          -- 0 or 1
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_requests_session_id ON requests(session_id);
CREATE INDEX idx_requests_timestamp ON requests(timestamp);
CREATE INDEX idx_requests_request_id ON requests(request_id);
CREATE INDEX idx_requests_created_at ON requests(created_at);
```

## ID Resolution Logic

```
Controller receives :id parameter
           |
           v
     Parse as integer
           |
    Is valid integer?
           |
    YES ───┴─── NO
     |           |
     v           v
Database ID   Try as UUID
  (123)       (request_id)
     |           |
     v           v
findById(id)  getByRequestId(uuid)
     |           |
     └─────┬─────┘
           v
    Request object
     (or null)
           |
           v
    null? → 404 error
```

## Performance Characteristics

### List Requests
- **Without filters:** O(n) scan with LIMIT
- **With session_id:** O(log n) index lookup + LIMIT
- **With date range:** O(log n) index range scan + LIMIT
- **With model/stream:** O(n) scan with WHERE + LIMIT

### Get Request
- **By database ID:** O(log n) primary key lookup
- **By UUID:** O(log n) unique index lookup

### Delete Request
- **Delete operation:** O(log n) primary key lookup
- **Cascade delete:** O(m) where m = number of responses

### Response Summary Enrichment
- **Current:** N+1 queries (1 per request)
- **Potential optimization:** JOIN query or batch fetch

## Integration Points

### With Phase 2 (Repositories)
- Uses `RequestRepository` for data access
- Uses `ResponseRepository` for linked responses
- Relies on JSON parsing in repositories

### With Phase 5 (Sessions API)
- Shares sessions router for session requests endpoint
- Uses same error response format
- Follows same pagination pattern

### With Express Middleware
- Request logger logs all requests
- Database logger tracks database operations
- Error middleware handles uncaught errors
- CORS middleware enables cross-origin requests

## Security Considerations

### Authentication
- Delegated to middleware (not in Phase 6)
- All endpoints should be protected
- Future: Add auth middleware to routes

### Input Validation
- Query parameters validated and parsed
- Default values prevent invalid states
- Integer parsing with parseInt(x, 10)
- Boolean parsing with === 'true'

### SQL Injection Prevention
- All queries use prepared statements
- Parameters are properly escaped
- No string concatenation in SQL

### Cascade Deletion
- Foreign key constraints handle cascades
- No orphaned responses
- Database-level referential integrity

## Scalability

### Current Limitations
- N+1 queries for response summaries
- Full table scans for some filters
- No caching layer

### Optimization Opportunities
1. JOIN for response summaries (1 query instead of N+1)
2. Composite indexes for common filter combinations
3. Redis cache for frequently accessed requests
4. Query result caching for stats
5. Connection pooling (if needed)

### Expected Load
- Read-heavy workload
- Mostly list and get operations
- Deletes are rare
- Filters are common

## Monitoring

### Key Metrics to Track
- Request count by endpoint
- Response times (p50, p95, p99)
- Error rates (404, 500)
- Database query times
- Cache hit rates (if implemented)

### Log Points
- Request received (request logger)
- Database query executed (database logger)
- Error occurred (error middleware)
- Request completed (response logger)

## Testing Strategy

### Unit Tests (Future)
- Controller functions in isolation
- Mock repository responses
- Test error cases
- Validate response format

### Integration Tests (Current)
- End-to-end via HTTP
- Test with real database
- Verify all endpoints
- Check error responses

### Performance Tests (Future)
- Load test list endpoint
- Test with large datasets
- Measure query times
- Identify bottlenecks
