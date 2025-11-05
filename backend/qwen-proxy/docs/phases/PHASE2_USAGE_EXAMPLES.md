# Phase 2: Repository Usage Examples

This document demonstrates how to use the repository pattern implemented in Phase 2.

## Overview

Phase 2 implements the repository pattern for data access with four main repositories:
- **BaseRepository**: Abstract base class with common CRUD operations
- **SessionRepository**: Manages session data
- **RequestRepository**: Manages request data with JSON serialization
- **ResponseRepository**: Manages response data and usage statistics

## File Locations

```
/mnt/d/Projects/qwen_proxy/backend/src/database/repositories/
├── base-repository.js      - Abstract base class
├── session-repository.js   - Session-specific operations
├── request-repository.js   - Request-specific operations
└── response-repository.js  - Response-specific operations
```

## Basic Usage

### 1. SessionRepository

```javascript
const SessionRepository = require('./src/database/repositories/session-repository');
const sessionRepo = new SessionRepository();

// Create a new session
sessionRepo.createSession(
  'session-hash-123',      // Session ID (MD5 hash)
  'chat-abc',              // Qwen chat ID
  'Hello world',           // First user message
  30 * 60 * 1000          // Timeout (30 minutes)
);

// Get a session (returns null if expired)
const session = sessionRepo.getSession('session-hash-123');
console.log(session);
// {
//   id: 'session-hash-123',
//   chat_id: 'chat-abc',
//   parent_id: null,
//   first_user_message: 'Hello world',
//   message_count: 0,
//   created_at: 1698581234567,
//   last_accessed: 1698581234567,
//   expires_at: 1698583034567
// }

// Update parent_id and increment message count
sessionRepo.updateParentId('session-hash-123', 'parent-456');

// Touch session to extend expiration (keep-alive)
sessionRepo.touchSession('session-hash-123', 30 * 60 * 1000);

// Get metrics
const metrics = sessionRepo.getMetrics();
console.log(metrics);
// { totalSessions: 5, activeSessions: 3, expiredSessions: 2 }

// Cleanup expired sessions
const cleaned = sessionRepo.cleanupExpired();
console.log(`Cleaned up ${cleaned} expired sessions`);
```

### 2. RequestRepository

```javascript
const RequestRepository = require('./src/database/repositories/request-repository');
const requestRepo = new RequestRepository();

// Create a request (JSON is automatically serialized)
const { id, requestId } = requestRepo.createRequest(
  'session-hash-123',           // Session ID
  {                             // OpenAI request object
    model: 'qwen3-max',
    messages: [
      { role: 'user', content: 'Hello' }
    ]
  },
  {                             // Qwen request object
    chat_id: 'chat-abc',
    messages: [
      { role: 'user', content: 'Hello' }
    ]
  },
  'qwen3-max',                  // Model name
  false                         // Stream flag
);
console.log({ id, requestId }); // { id: 1, requestId: 'uuid-here' }

// Get request by UUID (JSON is automatically parsed)
const request = requestRepo.getByRequestId(requestId);
console.log(request.openai_request); // Parsed JavaScript object

// Get all requests for a session
const requests = requestRepo.getBySessionId('session-hash-123', 10, 0);

// Get requests by date range
const startDate = Date.now() - (24 * 60 * 60 * 1000);
const endDate = Date.now();
const rangeRequests = requestRepo.getByDateRange(startDate, endDate, 50, 0);
```

### 3. ResponseRepository

```javascript
const ResponseRepository = require('./src/database/repositories/response-repository');
const responseRepo = new ResponseRepository();

// Create a response (JSON is automatically serialized)
const { id, responseId } = responseRepo.createResponse(
  1,                            // Request database ID (from requestRepo.createRequest)
  'session-hash-123',           // Session ID
  {                             // Qwen response object (null for streaming)
    choices: [
      { message: { role: 'assistant', content: 'Hello!' } }
    ]
  },
  {                             // OpenAI response object
    id: 'chatcmpl-123',
    choices: [
      {
        message: { role: 'assistant', content: 'Hello!' },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15
    }
  },
  'parent-789',                 // New parent_id from response
  {                             // Usage object
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15
  },
  1234,                         // Duration in milliseconds
  'stop',                       // Finish reason
  null                          // Error (null if successful)
);

// Get response by UUID (JSON is automatically parsed)
const response = responseRepo.getByResponseId(responseId);

// Get response by request ID
const responseForRequest = responseRepo.getByRequestId(1);

// Get all responses for a session
const responses = responseRepo.getBySessionId('session-hash-123', 10, 0);

// Get usage statistics
const stats = responseRepo.getUsageStats('session-hash-123');
console.log(stats);
// {
//   total_responses: 5,
//   total_completion_tokens: 25,
//   total_prompt_tokens: 50,
//   total_tokens: 75,
//   avg_duration_ms: 1234.5
// }

// Get global usage statistics (all sessions)
const globalStats = responseRepo.getUsageStats(null);
```

## BaseRepository Methods

All repositories inherit these methods from BaseRepository:

```javascript
// Find one record by column
const record = repo.findOne('column_name', 'value');

// Find by ID
const record = repo.findById(1);

// Find all with filters, ordering, pagination
const records = repo.findAll(
  { column: 'value' },    // WHERE clause (optional)
  'created_at DESC',      // ORDER BY (default: 'id')
  50,                     // LIMIT (optional)
  0                       // OFFSET (default: 0)
);

// Count records
const count = repo.count({ column: 'value' });

// Create record
const id = repo.create({ column1: 'value1', column2: 'value2' });

// Update by ID
const changes = repo.update(1, { column: 'new_value' });

// Delete by ID
const deleted = repo.delete(1);

// Delete with WHERE clause
const deleted = repo.deleteWhere({ column: 'value' });

// Execute raw SQL
const results = repo.raw('SELECT * FROM table WHERE column = ?', ['value']);
```

## Key Features

### 1. Automatic JSON Serialization/Deserialization

Request and Response repositories automatically handle JSON conversion:

```javascript
// Creating - objects are serialized to JSON strings
const { id } = requestRepo.createRequest(
  sessionId,
  { messages: [...] },  // Automatically stringified
  { chat_id: '...' },   // Automatically stringified
  model,
  stream
);

// Retrieving - JSON strings are parsed to objects
const request = requestRepo.getByRequestId(requestId);
console.log(request.openai_request); // JavaScript object, not string
```

### 2. Prepared Statements

All queries use prepared statements for SQL injection prevention:

```javascript
// Safe - uses prepared statement
const session = sessionRepo.findOne('id', userProvidedId);

// All BaseRepository methods use parameterized queries
```

### 3. Automatic Expiration

Sessions are automatically deleted when retrieved after expiration:

```javascript
// Session created with 30-minute timeout
sessionRepo.createSession(id, chatId, message, 30 * 60 * 1000);

// After 30 minutes...
const session = sessionRepo.getSession(id);
// Returns null and deletes the expired session from database
```

### 4. Foreign Key Cascade

Deleting a session automatically deletes related requests and responses:

```javascript
// Delete session
sessionRepo.delete('session-hash-123');

// All requests and responses for this session are automatically deleted
// due to ON DELETE CASCADE foreign key constraints
```

## Testing

Run the test suite to verify all repositories work correctly:

```bash
node test-repositories.js
```

Expected output:
```
=== Testing Phase 2: Repository Pattern Implementation ===

--- Test 1: SessionRepository ---
✓ Session created
✓ Session retrieved
✓ Parent ID updated
✓ Session touched
✓ Metrics retrieved
✅ SessionRepository: All tests passed

--- Test 2: RequestRepository ---
✓ Request created
✓ Request retrieved
✓ Requests by session ID
✓ Requests by date range
✅ RequestRepository: All tests passed

--- Test 3: ResponseRepository ---
✓ Response created
✓ Response retrieved
✓ Response by request ID
✓ Responses by session ID
✓ Usage statistics
✅ ResponseRepository: All tests passed

--- Test 4: Cleanup Expired Sessions ---
✓ Expired session automatically deleted
✓ Cleanup successful
✅ Cleanup test passed

=== All Phase 2 Tests Passed Successfully! ===
```

## Integration with Phase 1

Phase 2 repositories use the database connection and schema from Phase 1:

```javascript
const connection = require('../connection');  // From Phase 1

class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions');  // Uses 'sessions' table from Phase 1 schema
    // this.db is automatically initialized by BaseRepository
  }
}
```

## Next Steps: Phase 3

Phase 3 will replace the in-memory session manager with a database-backed version using SessionRepository:

```javascript
// Phase 3 will create:
// src/services/session-manager.js (rewritten to use SessionRepository)
```

## Troubleshooting

### Database not found
```bash
# Initialize the database first
node -e "require('./src/database').initializeDatabase()"
```

### Foreign key constraint failed
Ensure you're creating sessions before creating requests/responses:
```javascript
// 1. Create session first
sessionRepo.createSession(...);

// 2. Then create request
const { id } = requestRepo.createRequest(...);

// 3. Then create response
responseRepo.createResponse(id, ...);
```

### JSON parse errors
Ensure you're passing objects, not strings, to create methods:
```javascript
// ✅ Correct
requestRepo.createRequest(sessionId, { messages: [...] }, ...);

// ❌ Wrong
requestRepo.createRequest(sessionId, JSON.stringify({ messages: [...] }), ...);
```
