# Phase 4 Integration Checklist

## Files Created (Phase 4 - COMPLETE)

✅ `/src/middleware/persistence-middleware.js` - Main middleware implementation
✅ `PERSISTENCE_MIDDLEWARE_INTEGRATION.md` - Detailed integration guide
✅ `PHASE_4_COMPLETION_SUMMARY.md` - Implementation summary
✅ `QUICK_START_INTEGRATION.md` - Quick start guide
✅ `INTEGRATION_CHECKLIST.md` - This file

---

## Files to Modify for Integration (YOUR TASK)

Choose **ONE** of these options:

### Option 1: Provider Router Integration (RECOMMENDED)

**File to modify:**
- [ ] `/src/router/provider-router.js`

**What to add:**
1. Import persistence functions and SessionManager
2. Add session management logic
3. Log request after transformation
4. Log response with timing
5. Handle errors

**Estimated time:** 30 minutes
**Difficulty:** Medium
**Data captured:** Complete (both OpenAI and provider formats)

---

### Option 2: Server Integration (SIMPLER)

**File to modify:**
- [ ] `/src/server.js`

**What to add:**
1. Import createPersistenceTracker
2. Wrap /v1/chat/completions handler
3. Add basic session logic
4. Log requests and responses

**Estimated time:** 15 minutes
**Difficulty:** Easy
**Data captured:** Basic (OpenAI format only)

---

## Integration Steps

### Step 1: Choose Your Option

- [ ] Review both options in `QUICK_START_INTEGRATION.md`
- [ ] Decide: Option 1 (complete) or Option 2 (simple)

### Step 2: Make Code Changes

- [ ] Open the file to modify
- [ ] Add imports from integration guide
- [ ] Copy/adapt code from integration guide
- [ ] Test syntax: `node --check <file>`

### Step 3: Test the Integration

- [ ] Start the server: `npm start`
- [ ] Test non-streaming: See test commands below
- [ ] Test streaming: See test commands below
- [ ] Verify database: See verification commands below

### Step 4: Verify Results

- [ ] Check requests table has entries
- [ ] Check responses table has entries
- [ ] Verify request-response linkage
- [ ] Check token usage is captured
- [ ] Verify timing is recorded

---

## Test Commands

### Non-Streaming Request
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello, how are you?"}],
    "stream": false
  }'
```

### Streaming Request
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Tell me a short story"}],
    "stream": true
  }'
```

---

## Verification Commands

### Check Request Count
```bash
sqlite3 data/provider-router.db "SELECT COUNT(*) as request_count FROM requests;"
```

### Check Response Count
```bash
sqlite3 data/provider-router.db "SELECT COUNT(*) as response_count FROM responses;"
```

### View Recent Requests
```bash
sqlite3 data/provider-router.db "
  SELECT
    request_id,
    model,
    stream,
    datetime(created_at/1000, 'unixepoch') as created
  FROM requests
  ORDER BY created_at DESC
  LIMIT 5;
"
```

### View Linked Request-Response Pairs
```bash
sqlite3 data/provider-router.db "
  SELECT
    r.request_id,
    r.model,
    r.stream,
    res.finish_reason,
    res.total_tokens,
    res.duration_ms,
    res.error
  FROM requests r
  LEFT JOIN responses res ON res.request_id = r.id
  ORDER BY r.created_at DESC
  LIMIT 10;
"
```

### Check Session Updates
```bash
sqlite3 data/provider-router.db "
  SELECT
    id,
    chat_id,
    parent_id,
    message_count,
    datetime(created_at/1000, 'unixepoch') as created
  FROM sessions
  ORDER BY created_at DESC
  LIMIT 5;
"
```

---

## Success Criteria

After integration, you should see:

- [x] Middleware file exists and is valid JavaScript
- [ ] Server starts without errors
- [ ] Non-streaming requests work
- [ ] Streaming requests work
- [ ] Database has request records
- [ ] Database has response records
- [ ] Requests and responses are linked
- [ ] Token usage is captured
- [ ] Duration is calculated
- [ ] Session parent_id updates
- [ ] Errors are handled gracefully
- [ ] Performance is acceptable (< 5ms overhead)

---

## Troubleshooting

### "Cannot find module" error
- Check import paths are correct
- Ensure using ES6 module syntax (import/export)
- Verify file exists at specified path

### Database errors
- Check database file exists: `ls -l data/provider-router.db`
- Verify schema: `sqlite3 data/provider-router.db ".schema"`
- Check tables exist: `sqlite3 data/provider-router.db ".tables"`

### No records in database
- Check logging is enabled (look for [Persistence] in logs)
- Verify integration code is being executed
- Add console.log statements to debug
- Check for errors in error logs

### Performance issues
- Monitor with: `time curl ...`
- Should be < 5ms overhead
- Check database indexes exist
- Verify WAL mode enabled

---

## Documentation Reference

- **Quick Start:** `QUICK_START_INTEGRATION.md`
- **Detailed Guide:** `PERSISTENCE_MIDDLEWARE_INTEGRATION.md`
- **Implementation Details:** `PHASE_4_COMPLETION_SUMMARY.md`
- **Middleware Source:** `src/middleware/persistence-middleware.js`

---

## Support

If you encounter issues:

1. Check the detailed integration guide
2. Review the middleware source code
3. Look for [Persistence] logs in console
4. Verify database schema matches Phase 1
5. Ensure repositories exist from Phase 2
6. Check SessionManager works from Phase 3

---

## Next Phase

After successful integration:

- **Phase 5:** Sessions CRUD API Endpoints
- **Phase 6:** Requests CRUD API Endpoints
- **Phase 7:** Responses CRUD API Endpoints
- **Phase 8:** Database Migrations System
- **Phase 9:** Test Suite Updates
- **Phase 10:** Performance Optimization

---

**Status:** Phase 4 COMPLETE ✅ | Integration PENDING ⏳
