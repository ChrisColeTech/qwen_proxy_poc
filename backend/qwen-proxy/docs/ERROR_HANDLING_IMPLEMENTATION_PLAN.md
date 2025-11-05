# Error Handling System Implementation Plan

## Overview
Comprehensive error handling, logging, and tracking system for the Qwen Proxy Backend.

**Goals:**
- Capture all errors (HTTP, streaming, API, database) in a centralized errors table
- Provide detailed error context for debugging
- Enable error analysis and monitoring
- Follow Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY)

---

## Work Progression Tracking

| Phase | Status | Description | Files Created | Files Modified |
|-------|--------|-------------|---------------|----------------|
| Phase 1 | ⬜ Not Started | Database Schema & Migration | 1 | 0 |
| Phase 2 | ⬜ Not Started | Error Repository | 1 | 0 |
| Phase 3 | ⬜ Not Started | Error Logging Service | 1 | 0 |
| Phase 4 | ⬜ Not Started | Error Middleware | 1 | 1 |
| Phase 5 | ⬜ Not Started | SSE Handler Integration | 0 | 1 |
| Phase 6 | ⬜ Not Started | Chat Completions Integration | 0 | 1 |
| Phase 7 | ⬜ Not Started | QwenClient Integration | 0 | 1 |
| Phase 8 | ⬜ Not Started | Health Check Integration | 0 | 1 |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001-initial-schema.js
│   │   │   ├── 002-add-user-id.js
│   │   │   ├── 003-add-conversation-hash.js
│   │   │   └── 004-add-errors-table.js          [NEW - Phase 1]
│   │   │
│   │   ├── repositories/
│   │   │   ├── base-repository.js
│   │   │   ├── session-repository.js
│   │   │   ├── request-repository.js
│   │   │   ├── response-repository.js
│   │   │   └── error-repository.js               [NEW - Phase 2]
│   │   │
│   │   ├── connection.js
│   │   ├── index.js
│   │   ├── migrations.js
│   │   └── schema.js
│   │
│   ├── services/
│   │   ├── qwen-client.js                        [MODIFIED - Phase 7]
│   │   ├── session-manager.js
│   │   ├── sse-handler.js                        [MODIFIED - Phase 5]
│   │   └── error-logger.js                       [NEW - Phase 3]
│   │
│   ├── middleware/
│   │   ├── auth-middleware.js
│   │   ├── logging-middleware.js
│   │   ├── persistence-middleware.js
│   │   ├── request-validator.js
│   │   └── error-middleware.js                   [NEW - Phase 4]
│   │
│   ├── handlers/
│   │   ├── chat-completions-handler.js           [MODIFIED - Phase 6]
│   │   ├── completions-handler.js
│   │   ├── health-handler.js                     [MODIFIED - Phase 8]
│   │   ├── metrics-handler.js
│   │   ├── models-handler.js
│   │   └── sessions-handler.js
│   │
│   ├── routes/
│   │   └── index.js                              [MODIFIED - Phase 4]
│   │
│   ├── config/
│   │   └── index.js
│   │
│   └── index.js
│
└── docs/
    ├── ERROR_HANDLING_IMPLEMENTATION_PLAN.md     [THIS FILE]
    └── ...
```

---

## Phase 1: Database Schema & Migration

**Priority:** HIGHEST (Foundation for all other phases)

**Objective:** Create errors table to store all application errors with rich context.

### Files Created
1. **`src/database/migrations/004-add-errors-table.js`**
   - Migration to create `errors` table
   - Indexes for efficient querying

### Database Schema

```sql
CREATE TABLE errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_id TEXT NOT NULL UNIQUE,           -- UUID for error tracking
  timestamp INTEGER NOT NULL,              -- When error occurred
  error_type TEXT NOT NULL,                -- Type: http_error, stream_error, api_error, database_error, validation_error
  error_code TEXT,                         -- Error code (e.g., ECONNREFUSED, 404)
  error_message TEXT NOT NULL,             -- Error message
  stack_trace TEXT,                        -- Full stack trace

  -- Context
  session_id TEXT,                         -- Associated session (if any)
  request_id INTEGER,                      -- Associated request (if any)
  endpoint TEXT,                           -- API endpoint where error occurred
  method TEXT,                             -- HTTP method
  user_agent TEXT,                         -- Client user agent

  -- Request/Response context
  request_payload TEXT,                    -- Request body (JSON)
  response_payload TEXT,                   -- Response (if partial)

  -- Metadata
  severity TEXT NOT NULL,                  -- critical, error, warning
  resolved BOOLEAN DEFAULT 0,              -- For tracking if error was resolved
  notes TEXT,                              -- Admin notes
  created_at INTEGER NOT NULL,

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_errors_timestamp ON errors(timestamp);
CREATE INDEX idx_errors_error_type ON errors(error_type);
CREATE INDEX idx_errors_session_id ON errors(session_id);
CREATE INDEX idx_errors_request_id ON errors(request_id);
CREATE INDEX idx_errors_severity ON errors(severity);
CREATE INDEX idx_errors_resolved ON errors(resolved);
CREATE INDEX idx_errors_error_id ON errors(error_id);
```

### Integration Points
- **`src/database/migrations.js`** - Will automatically detect and run this migration
- **`src/database/schema.js`** - Schema definitions (read-only reference)

### Testing
```bash
# Run migration
npm start
# Check in logs: [Migrations] Applied migration 004-add-errors-table
# Verify table exists
sqlite3 data/qwen_proxy.db ".schema errors"
```

---

## Phase 2: Error Repository

**Priority:** HIGH (Required before error logging service)

**Objective:** Create repository for error database operations following existing repository pattern.

### Files Created
1. **`src/database/repositories/error-repository.js`**
   - CRUD operations for errors table
   - Query methods for error analysis
   - Extends BaseRepository

### Implementation Details

**Methods:**
- `createError(errorData)` - Insert new error
- `getErrorById(errorId)` - Get error by UUID
- `getErrorsBySession(sessionId)` - Get all errors for a session
- `getErrorsByType(errorType)` - Get errors by type
- `getErrorsBySeverity(severity)` - Get errors by severity
- `getRecentErrors(limit)` - Get most recent errors
- `getUnresolvedErrors()` - Get unresolved errors
- `markAsResolved(errorId, notes)` - Mark error as resolved
- `getErrorStats()` - Get error statistics (count by type, severity)
- `cleanupOldErrors(olderThan)` - Delete old errors (for maintenance)

### Integration Points
- **`src/database/repositories/base-repository.js`** - Extends this class
- **`src/database/connection.js`** - Uses database connection
- **`src/database/index.js`** - Will export this repository

### Code Structure
```javascript
const BaseRepository = require('./base-repository');
const crypto = require('crypto');

class ErrorRepository extends BaseRepository {
  constructor() {
    super('errors');
  }

  createError(errorData) {
    // Generate error_id, timestamp, validate data, insert
  }

  getErrorsBySession(sessionId) {
    // Query with session_id filter
  }

  getErrorStats() {
    // Aggregate queries for statistics
  }

  // ... other methods
}

module.exports = ErrorRepository;
```

### Testing
```javascript
// Manual test in index.js temporarily
const ErrorRepository = require('./database/repositories/error-repository');
const repo = new ErrorRepository();

// Test insert
const errorId = repo.createError({
  error_type: 'test_error',
  error_message: 'Test error',
  severity: 'error'
});

// Test query
const error = repo.getErrorById(errorId);
console.log('Test error:', error);
```

---

## Phase 3: Error Logging Service

**Priority:** HIGH (Core service used by all handlers)

**Objective:** Create centralized error logging service following SRP.

### Files Created
1. **`src/services/error-logger.js`**
   - High-level error logging API
   - Error classification
   - Context extraction

### Implementation Details

**Service Methods:**
```javascript
class ErrorLogger {
  // Main logging method
  logError(error, context = {})

  // Specialized methods for different error types
  logHttpError(error, req, res, context = {})
  logStreamError(error, sessionId, context = {})
  logApiError(error, endpoint, payload, context = {})
  logDatabaseError(error, operation, context = {})
  logValidationError(error, payload, context = {})

  // Utility methods
  classifyError(error)           // Determine error_type
  determineSeverity(error)       // critical/error/warning
  extractStackTrace(error)
  sanitizePayload(payload)       // Remove sensitive data
}
```

**Error Classification Logic:**
- HTTP errors (4xx, 5xx) → `http_error`
- Stream errors → `stream_error`
- Axios/API errors → `api_error`
- SQLite errors → `database_error`
- Validation errors → `validation_error`
- Unknown → `unknown_error`

**Severity Classification:**
- `critical` - System-breaking errors (DB connection, auth failures)
- `error` - Request failures, API errors
- `warning` - Validation errors, client errors

### Integration Points
- **`src/database/repositories/error-repository.js`** - Uses for database operations
- **`src/config/index.js`** - May read error logging configuration

### Code Structure
```javascript
const ErrorRepository = require('../database/repositories/error-repository');
const crypto = require('crypto');

class ErrorLogger {
  constructor() {
    this.repo = new ErrorRepository();
  }

  logError(error, context = {}) {
    try {
      const errorData = {
        error_id: crypto.randomUUID(),
        timestamp: Date.now(),
        error_type: this.classifyError(error),
        error_code: error.code || error.statusCode || null,
        error_message: error.message || 'Unknown error',
        stack_trace: this.extractStackTrace(error),
        severity: this.determineSeverity(error),
        ...context
      };

      return this.repo.createError(errorData);
    } catch (loggingError) {
      // Fallback: log to console if DB logging fails
      console.error('[ErrorLogger] Failed to log error:', loggingError);
      console.error('[ErrorLogger] Original error:', error);
    }
  }

  logHttpError(error, req, res, context = {}) {
    return this.logError(error, {
      endpoint: req.path,
      method: req.method,
      user_agent: req.get('user-agent'),
      request_payload: JSON.stringify(req.body),
      ...context
    });
  }

  // ... other methods
}

// Export singleton
module.exports = new ErrorLogger();
```

### Testing
```javascript
// Test in index.js
const errorLogger = require('./services/error-logger');

// Test basic error
errorLogger.logError(new Error('Test error'));

// Test HTTP error
errorLogger.logHttpError(
  new Error('Not found'),
  { path: '/test', method: 'GET', get: () => 'test-agent', body: {} },
  {},
  { session_id: 'test-session' }
);
```

---

## Phase 4: Error Middleware

**Priority:** HIGH (Catches all unhandled HTTP errors)

**Objective:** Create Express middleware to catch and log all HTTP errors.

### Files Created
1. **`src/middleware/error-middleware.js`**
   - Express error middleware
   - Formats error responses
   - Logs errors via ErrorLogger

### Files Modified
1. **`src/routes/index.js`**
   - Add error middleware as last middleware

### Implementation Details

**Middleware Function:**
```javascript
function errorMiddleware(err, req, res, next) {
  // 1. Log error via ErrorLogger
  // 2. Determine status code
  // 3. Format error response
  // 4. Send to client
}
```

**Error Response Format:**
```json
{
  "error": {
    "type": "api_error",
    "message": "Error message",
    "code": "error_code",
    "error_id": "uuid-for-tracking"
  }
}
```

### Integration Points
- **`src/services/error-logger.js`** - Uses for error logging
- **`src/routes/index.js`** - Registered as Express middleware
- **All handlers** - Errors thrown/passed to `next(error)` will be caught

### Code Structure
```javascript
const errorLogger = require('../services/error-logger');

/**
 * Express error handling middleware
 * Catches all errors and logs them to database
 * Must be registered LAST in middleware chain
 */
function errorMiddleware(err, req, res, next) {
  // Log error with full context
  const errorId = errorLogger.logHttpError(err, req, res, {
    session_id: req.session_id, // If available from previous middleware
    request_id: req.request_id   // If available
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Format response
  const errorResponse = {
    error: {
      type: err.code || 'api_error',
      message: err.message || 'Internal server error',
      code: err.code,
      error_id: errorId // For tracking
    }
  };

  // Send response
  res.status(statusCode).json(errorResponse);
}

module.exports = errorMiddleware;
```

**Integration in routes/index.js:**
```javascript
const errorMiddleware = require('../middleware/error-middleware');

// ... existing routes ...

// ERROR MIDDLEWARE MUST BE LAST
router.use(errorMiddleware);

module.exports = router;
```

### Testing
```bash
# Test by hitting non-existent endpoint
curl http://localhost:3000/v1/nonexistent

# Check errors table
sqlite3 data/qwen_proxy.db "SELECT * FROM errors ORDER BY timestamp DESC LIMIT 1;"
```

---

## Phase 5: SSE Handler Integration

**Priority:** MEDIUM (Fixes streaming error logging)

**Objective:** Integrate ErrorLogger into SSE handler for streaming errors.

### Files Modified
1. **`src/services/sse-handler.js`**
   - Import ErrorLogger
   - Log streaming errors to database
   - Add error_id to error chunks sent to client

### Implementation Details

**Changes in `_handleStreamError` method:**
```javascript
_handleStreamError(res, error, sessionId) {
  // NEW: Log error to database
  const errorLogger = require('./error-logger');
  const errorId = errorLogger.logStreamError(error, sessionId, {
    endpoint: '/v1/chat/completions',
    error_type: 'stream_error'
  });

  console.error('Stream error:', {
    error: error.message,
    sessionId: sessionId,
    errorId: errorId,  // NEW: Log error_id
    stack: error.stack
  });

  try {
    // Try to send error in SSE format
    const errorChunk = {
      error: {
        message: error.message || 'Stream error occurred',
        type: 'stream_error',
        code: error.code || 'unknown_error',
        error_id: errorId  // NEW: Include error_id for tracking
      }
    };

    res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (writeError) {
    console.error('Could not write error to stream:', writeError);
    try {
      res.end();
    } catch (endError) {
      // Stream already closed
    }
  }
}
```

**Changes in `qwenStream.on('error')` handler:**
```javascript
qwenStream.on('error', (err) => {
  if (!clientDisconnected) {
    this._handleStreamError(res, err, sessionId);
  }
  reject(err);
});
```

### Integration Points
- **`src/services/error-logger.js`** - Uses logStreamError method
- **`src/handlers/chat-completions-handler.js`** - Calls this handler

### Testing
```bash
# Simulate stream error by disconnecting during generation
# Check errors table for stream_error entries
sqlite3 data/qwen_proxy.db "SELECT * FROM errors WHERE error_type='stream_error';"
```

---

## Phase 6: Chat Completions Integration

**Priority:** MEDIUM (Main endpoint error handling)

**Objective:** Ensure all chat completions errors are logged.

### Files Modified
1. **`src/handlers/chat-completions-handler.js`**
   - Import ErrorLogger
   - Log errors in catch block
   - Log validation errors

### Implementation Details

**Changes in main catch block:**
```javascript
} catch (error) {
  // Log error with full context
  const errorLogger = require('../services/error-logger');
  const errorId = errorLogger.logHttpError(error, req, res, {
    session_id: typeof sessionId !== 'undefined' ? sessionId : null,
    request_id: typeof persistence !== 'undefined' && persistence ? persistence.requestDbId : null,
    endpoint: '/v1/chat/completions'
  });

  console.error('[ChatCompletions] Error:', {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    errorId: errorId,  // NEW: Include error_id
    stack: config.logging.level === 'debug' ? error.stack : undefined
  });

  // Existing error response logging to database...

  // Pass to error middleware
  next(error);
}
```

**Changes in validation (optional - validation errors are less critical):**
```javascript
function validateChatCompletionRequest(body) {
  if (!body.messages || !Array.isArray(body.messages)) {
    const error = new Error('messages must be an array');
    error.statusCode = 400;
    error.code = 'invalid_request';

    // Could log validation error here if desired
    // errorLogger.logValidationError(error, body);

    throw error;
  }
  // ... rest of validation
}
```

### Integration Points
- **`src/services/error-logger.js`** - Uses logHttpError method
- **`src/middleware/error-middleware.js`** - Errors passed to via `next(error)`

### Testing
```bash
# Test validation error
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Check errors table
sqlite3 data/qwen_proxy.db "SELECT * FROM errors WHERE endpoint='/v1/chat/completions';"
```

---

## Phase 7: QwenClient Integration

**Priority:** MEDIUM (Captures API errors)

**Objective:** Log Qwen API errors (rate limits, auth failures, timeouts).

### Files Modified
1. **`src/services/qwen-client.js`**
   - Import ErrorLogger
   - Log API errors in catch blocks
   - Log retry attempts

### Implementation Details

**Changes in API call methods:**
```javascript
async sendMessage(message, options = {}) {
  try {
    // ... existing code ...
  } catch (error) {
    // NEW: Log API error
    const errorLogger = require('./error-logger');
    errorLogger.logApiError(error, '/openapi/v1/chat/completions', message, {
      error_type: 'api_error',
      severity: error.response?.status === 429 ? 'warning' : 'error'
    });

    console.error('[QwenClient] API error:', error.message);
    throw error;
  }
}
```

**Changes in retry logic (withRetry method):**
```javascript
async withRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        // Final attempt failed - log
        const errorLogger = require('./error-logger');
        errorLogger.logApiError(error, 'retry-exhausted', {}, {
          error_type: 'api_error',
          notes: `Failed after ${maxRetries} retries`
        });

        throw error;
      }

      // Log retry attempt
      console.warn(`[QwenClient] Retry ${attempt}/${maxRetries} after error:`, error.message);
      await this.delay(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### Integration Points
- **`src/services/error-logger.js`** - Uses logApiError method
- **`src/handlers/chat-completions-handler.js`** - Calls QwenClient methods

### Testing
```bash
# Simulate API error by using invalid credentials
# Check errors table for api_error entries
sqlite3 data/qwen_proxy.db "SELECT * FROM errors WHERE error_type='api_error';"
```

---

## Phase 8: Health Check Integration

**Priority:** LOW (Nice to have for monitoring)

**Objective:** Add error logging to health checks.

### Files Modified
1. **`src/handlers/health-handler.js`**
   - Import ErrorLogger
   - Log health check failures

### Implementation Details

**Changes in detailed health check:**
```javascript
async function detailedHealth(req, res) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      // ... existing checks ...
    };

    // Check for recent errors
    const ErrorRepository = require('../database/repositories/error-repository');
    const errorRepo = new ErrorRepository();
    const recentErrors = errorRepo.getRecentErrors(10);
    const unresolved = errorRepo.getUnresolvedErrors();

    health.errors = {
      recent_count: recentErrors.length,
      unresolved_count: unresolved.length,
      last_error: recentErrors[0] || null
    };

    res.json(health);
  } catch (error) {
    // Log health check error
    const errorLogger = require('../services/error-logger');
    errorLogger.logError(error, {
      endpoint: '/health/detailed',
      error_type: 'health_check_error',
      severity: 'warning'
    });

    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

### Integration Points
- **`src/services/error-logger.js`** - Uses logError method
- **`src/database/repositories/error-repository.js`** - Queries for error stats

### Testing
```bash
# Check health endpoint
curl http://localhost:3000/health/detailed

# Should include error statistics in response
```

---

## Error Types Reference

| Error Type | Description | Example |
|------------|-------------|---------|
| `http_error` | HTTP request/response errors | 404, 500 errors |
| `stream_error` | SSE streaming errors | Connection timeouts, stream interruptions |
| `api_error` | Qwen API errors | 429 rate limits, auth failures |
| `database_error` | Database operation errors | SQLite errors, constraint violations |
| `validation_error` | Request validation errors | Missing fields, invalid format |
| `unknown_error` | Unclassified errors | Unexpected exceptions |

## Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| `critical` | System-breaking | Immediate attention |
| `error` | Request failures | Investigation needed |
| `warning` | Client errors | Monitor, may be normal |

---

## Benefits

1. **Debugging** - Full error context with stack traces
2. **Monitoring** - Track error patterns and trends
3. **Client Support** - Error IDs for user support tickets
4. **Analysis** - Query errors by type, endpoint, session
5. **Resolution Tracking** - Mark errors as resolved with notes

---

## Future Enhancements (Out of Scope)

- Error notification system (email/Slack alerts)
- Error dashboard/UI
- Automatic error resolution detection
- Error aggregation and deduplication
- Error rate limiting (prevent log flooding)
- Error export (CSV, JSON)

---

## Notes

- All error logging is **non-blocking** - failures in error logging should not break the application
- Sensitive data (passwords, tokens) must be sanitized before logging
- Old errors should be periodically cleaned up to manage database size
- Error IDs allow users to reference specific errors when reporting issues
