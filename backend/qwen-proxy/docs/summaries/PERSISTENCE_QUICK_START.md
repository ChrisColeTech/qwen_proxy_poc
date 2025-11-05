# Persistence Middleware - Quick Start Guide

This guide shows you how to use the Phase 4 persistence middleware to automatically log all requests and responses to the SQLite database.

---

## How It Works

Every request to `/v1/chat/completions` is automatically logged to the database:

1. **Before** sending to Qwen API → Request is logged
2. **After** receiving response → Response is logged
3. Request and response are linked via database foreign key

---

## Automatic Logging

**No manual setup needed!** Persistence is automatic for all chat completion requests.

### What Gets Logged

#### Request Table:
- Session ID
- Request UUID
- OpenAI request (full JSON)
- Qwen request (transformed JSON)
- Model name
- Stream flag
- Timestamp

#### Response Table:
- Request ID (foreign key)
- Session ID
- Response UUID
- Qwen response (full JSON, null for streaming)
- OpenAI response (full JSON)
- Parent ID (for next message)
- Token usage (completion, prompt, total)
- Duration (milliseconds)
- Finish reason (stop, length, error)
- Error message (if failed)
- Timestamp

---

## Querying the Database

### View All Requests:
```bash
sqlite3 data/qwen_proxy.db "SELECT * FROM requests ORDER BY timestamp DESC LIMIT 10;"
```

### View All Responses:
```bash
sqlite3 data/qwen_proxy.db "SELECT * FROM responses ORDER BY timestamp DESC LIMIT 10;"
```

### View Request-Response Pairs:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    r.request_id,
    r.model,
    r.stream,
    res.finish_reason,
    res.duration_ms,
    res.total_tokens,
    res.error
  FROM requests r
  LEFT JOIN responses res ON res.request_id = r.id
  ORDER BY r.timestamp DESC
  LIMIT 10;
"
```

### Count Today's Requests:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT COUNT(*) as count
  FROM requests
  WHERE timestamp >= strftime('%s', 'now', 'start of day') * 1000;
"
```

### Get Usage Statistics:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    COUNT(*) as total_responses,
    SUM(completion_tokens) as completion_tokens,
    SUM(prompt_tokens) as prompt_tokens,
    SUM(total_tokens) as total_tokens,
    AVG(duration_ms) as avg_duration_ms
  FROM responses
  WHERE error IS NULL;
"
```

### Find Error Responses:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    r.request_id,
    r.model,
    res.error,
    res.duration_ms,
    res.timestamp
  FROM requests r
  JOIN responses res ON res.request_id = r.id
  WHERE res.error IS NOT NULL
  ORDER BY res.timestamp DESC;
"
```

### Get Session History:
```bash
SESSION_ID="your-session-id-here"
sqlite3 data/qwen_proxy.db "
  SELECT
    r.timestamp,
    r.model,
    res.finish_reason,
    res.total_tokens,
    res.duration_ms
  FROM requests r
  JOIN responses res ON res.request_id = r.id
  WHERE r.session_id = '$SESSION_ID'
  ORDER BY r.timestamp ASC;
"
```

---

## Programmatic Access

### Using Repositories:

```javascript
const RequestRepository = require('./src/database/repositories/request-repository');
const ResponseRepository = require('./src/database/repositories/response-repository');

const requestRepo = new RequestRepository();
const responseRepo = new ResponseRepository();

// Get all requests for a session
const requests = requestRepo.getBySessionId('session-id-here');

// Get all responses for a session
const responses = responseRepo.getBySessionId('session-id-here');

// Get usage statistics
const stats = responseRepo.getUsageStats('session-id-here');
console.log('Total tokens:', stats.total_tokens);
console.log('Avg duration:', stats.avg_duration_ms, 'ms');

// Get requests in date range
const startDate = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
const endDate = Date.now();
const recentRequests = requestRepo.getByDateRange(startDate, endDate);
```

---

## Manual Logging (Advanced)

If you need to log custom data:

```javascript
const { logRequest, logResponse } = require('./src/middleware/persistence-middleware');

// Log a request
const persistence = await logRequest(
  sessionId,
  openaiRequest,  // Original OpenAI request object
  qwenRequest,    // Transformed Qwen request object
  'qwen3-max',    // Model name
  false           // Stream flag
);

// Later, log the response
if (persistence) {
  await logResponse(
    persistence.requestDbId,  // Database ID from logRequest
    sessionId,
    qwenResponse,             // Qwen response object (or null)
    openaiResponse,           // OpenAI response object
    parentId,                 // New parent_id for next message
    usage,                    // {completion_tokens, prompt_tokens, total_tokens}
    durationMs,               // Duration in milliseconds
    'stop',                   // Finish reason
    null                      // Error message (null if success)
  );
}
```

---

## Error Handling

Persistence is **non-blocking**:
- If database write fails, the error is logged but the request continues
- Your API responses are never delayed or broken by persistence issues

Example error log:
```
[Persistence] Failed to log request: Error: database locked
```

---

## Database Maintenance

### Check Database Size:
```bash
ls -lh data/qwen_proxy.db
```

### Vacuum Database (compress):
```bash
sqlite3 data/qwen_proxy.db "VACUUM;"
```

### Delete Old Data:
```bash
# Delete requests older than 30 days
sqlite3 data/qwen_proxy.db "
  DELETE FROM sessions
  WHERE created_at < strftime('%s', 'now', '-30 days') * 1000;
"
```

### Export to CSV:
```bash
sqlite3 -header -csv data/qwen_proxy.db "SELECT * FROM requests;" > requests.csv
sqlite3 -header -csv data/qwen_proxy.db "SELECT * FROM responses;" > responses.csv
```

---

## Performance Monitoring

### Average Request Duration:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    AVG(duration_ms) as avg_ms,
    MIN(duration_ms) as min_ms,
    MAX(duration_ms) as max_ms
  FROM responses
  WHERE error IS NULL;
"
```

### Requests Per Hour:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    strftime('%Y-%m-%d %H:00', timestamp / 1000, 'unixepoch') as hour,
    COUNT(*) as count
  FROM requests
  WHERE timestamp >= strftime('%s', 'now', '-24 hours') * 1000
  GROUP BY hour
  ORDER BY hour;
"
```

### Token Usage Per Model:
```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    r.model,
    COUNT(*) as requests,
    SUM(res.total_tokens) as total_tokens,
    AVG(res.total_tokens) as avg_tokens
  FROM requests r
  JOIN responses res ON res.request_id = r.id
  WHERE res.error IS NULL
  GROUP BY r.model;
"
```

---

## Testing

Run the persistence test suite:
```bash
node test-persistence.js
```

Expected output:
```
===========================================
Phase 4: Persistence Middleware Test
===========================================

✓ Database initialized
✓ Session created
✓ Request logged
✓ Request verified in database
✓ Response logged
✓ Response verified in database
✓ Request-response linkage verified
✓ Error response logged
✓ Summary statistics calculated
✓ Cascade deletion working

===========================================
✓ All tests passed successfully!
===========================================
```

---

## Troubleshooting

### Issue: Requests not being logged

**Check 1:** Database initialized?
```bash
node -e "require('./src/database').initializeDatabase().then(() => console.log('OK'))"
```

**Check 2:** Database file exists?
```bash
ls -la data/qwen_proxy.db
```

**Check 3:** Check console logs for errors:
```bash
grep "Persistence" logs/app.log
```

### Issue: Database locked error

**Solution:** SQLite is already open elsewhere
```bash
# Close any sqlite3 processes
killall sqlite3
```

### Issue: Foreign key constraint failed

**Solution:** Session doesn't exist
```bash
# Check if session exists
sqlite3 data/qwen_proxy.db "SELECT * FROM sessions WHERE id = 'your-session-id';"
```

---

## Next Steps

- **Phase 5:** CRUD API endpoints for sessions
- **Phase 6:** CRUD API endpoints for requests
- **Phase 7:** CRUD API endpoints for responses

These will provide REST APIs to query the logged data without using SQL directly.

---

## Support

For issues or questions:
1. Check the implementation summary: `PHASE_4_IMPLEMENTATION_SUMMARY.md`
2. Review the source code: `src/middleware/persistence-middleware.js`
3. Run the test suite: `node test-persistence.js`
