# Integration Tests - Quick Start Guide

## TL;DR

```bash
# 1. Start the server
node src/server.js &

# 2. Set credentials (optional - some tests will skip)
export QWEN_TOKEN=your-token
export QWEN_COOKIES=your-cookies

# 3. Run all integration tests
npm test -- tests/integration/

# 4. Or run individual test files
npm test -- tests/integration/01-openai-compatibility.test.js
npm test -- tests/integration/02-multi-turn-conversations.test.js
npm test -- tests/integration/03-session-management.test.js
npm test -- tests/integration/04-error-recovery.test.js
```

## What Gets Tested

### ✅ 01-openai-compatibility.test.js (7 tests)
- Non-streaming responses work
- Streaming responses work
- Token usage is reported
- Response format matches OpenAI
- Model parameter preserved
- Health endpoint works
- System messages handled

### ✅ 02-multi-turn-conversations.test.js (8 tests)
- First message creates session
- Follow-up messages reuse session
- 2-turn context preserved
- 3-turn context preserved
- 5-turn context preserved
- Full history works (Roocode style)
- Streaming with multi-turn works
- Session identified by first user message

### ✅ 03-session-management.test.js (6 tests)
- Parallel conversations isolated
- Same conversation uses same session
- Sessions are isolated (RED vs BLUE test)
- Parent ID tracked correctly
- Multiple sessions coexist
- Sessions persist over time

### ✅ 04-error-recovery.test.js (16 tests)
- Missing messages → 400
- Empty messages → 400
- No user message → 400
- Invalid format → 400
- Error format is OpenAI-compatible
- Invalid JSON handled
- Concurrent requests work
- Large content handled
- Special characters handled
- Long history handled
- Wrong HTTP methods → 404/405
- Extra fields ignored

## Expected Results

**With API Credentials:**
- All 37 tests should pass
- Tests take 5-15 minutes total
- Real API calls are made

**Without API Credentials:**
- 16 error tests pass
- 21 API tests skip gracefully
- Tests take ~10 seconds

## Common Issues

### "ECONNREFUSED"
**Problem**: Server not running
**Solution**: `node src/server.js &`

### Tests Skip
**Problem**: No credentials
**Solution**: Set `QWEN_TOKEN` and `QWEN_COOKIES` in `.env`

### Tests Timeout
**Problem**: API is slow
**Solution**: Increase timeout with `--testTimeout=60000`

### Too Many Sessions
**Problem**: Sessions accumulate
**Solution**: Restart server `pkill -f "node src/server.js" && node src/server.js &`

## Quick Verification

```bash
# Check server is running
curl http://localhost:3000/health

# Run error tests (no credentials needed)
npm test -- tests/integration/04-error-recovery.test.js

# Run one API test (credentials needed)
npm test -- tests/integration/01-openai-compatibility.test.js
```

## File Structure

```
tests/integration/
├── README.md                           # Full documentation
├── QUICK_START.md                      # This file
├── 01-openai-compatibility.test.js    # 7 tests  (12KB)
├── 02-multi-turn-conversations.test.js # 8 tests  (17KB)
├── 03-session-management.test.js      # 6 tests  (17KB)
└── 04-error-recovery.test.js          # 16 tests (14KB)
```

## More Information

- **Full Documentation**: See `README.md` in this directory
- **Implementation Summary**: See `/PHASE_6_SUMMARY.md` in backend root
- **Coverage Report**: See `/TEST_COVERAGE_REPORT.md` in backend root
- **Implementation Plan**: See `/IMPLEMENTATION_PLAN_V2.md` in backend root
