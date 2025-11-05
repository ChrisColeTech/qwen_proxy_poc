# Production-Ready Backend Implementation Plan

Based on knowledge gained from **real API tests** (no mocks, no assumptions).

## Current Status

### ✅ What We Know (From Real Tests)

**Qwen API Behavior:**
- First message needs `parent_id: null`
- Follow-up messages need `parent_id` from previous response
- Only send NEW message, not full history (Qwen maintains context server-side)
- Use `parent_id` from response (NOT `message_id`)
- Required headers: `bx-umidtoken`, `Cookie`, `User-Agent`

**Roocode Behavior:**
- Uses standard OpenAI SDK
- Sends full conversation history on every request
- Does NOT send any conversation tracking ID
- Expects XML tool calls embedded in text (NOT JSON function calling)
- Needs SSE format: `data: {json}\n\n`

**Multi-Turn Compatibility:**
- ✅ Format mismatch is handled correctly (extract last message)
- ✅ Session identification improved (hash of first USER message)
- ✅ Parent ID chain works for context preservation

### ✅ What We Have

**Tests:**
- 7/7 Qwen API tests passing (real API, no mocks)
- 9/9 XML parsing tests passing (Roocode format validation)
- 4 integration tests ready (need API to run)

**Current Proxy:**
- Basic OpenAI-compatible endpoint
- Session management with parent_id tracking
- SSE streaming support
- Message format transformation

### ❌ What's Missing

1. **XML Tool Call Generation** - Qwen may not naturally output XML format
2. **Session Cleanup** - No timeout or garbage collection
3. **Error Handling** - Minimal error recovery
4. **Production Features** - No auth, rate limiting, monitoring
5. **Real Integration Testing** - Haven't tested with actual Roocode client

## Implementation Strategy

### Phase 1: Critical Missing Features

#### 1.1 Test XML Tool Call Generation

**Goal:** Determine if Qwen naturally outputs XML tool calls

**Test:**
```javascript
// Send a prompt that should trigger tool usage
const response = await sendToQwen({
  message: "Please read the file src/index.js"
});

// Check if response contains XML tool call
if (response.includes('<read_file>')) {
  console.log('✅ Qwen outputs XML naturally');
} else {
  console.log('❌ Need to implement XML generation');
}
```

**Implementation Options:**

**Option A: Prompt Engineering (Try First)**
```javascript
const SYSTEM_PROMPT = `You are a helpful coding assistant.

When you need to use tools, output them in this XML format:

<read_file><path>file/path.js</path></read_file>
<write_to_file><path>file.js</path><content>
code here
</content></write_to_file>

Available tools: read_file, write_to_file, execute_command, search_files, list_files, attempt_completion
`;
```

**Option B: Response Post-Processing (Fallback)**
```javascript
function convertToolCallsToXML(qwenResponse) {
  // If Qwen uses JSON tool calls, convert to XML
  if (qwenResponse.tool_calls) {
    return qwenResponse.tool_calls.map(tc => {
      const params = Object.entries(tc.function.arguments)
        .map(([key, val]) => `<${key}>${val}</${key}>`)
        .join('');
      return `<${tc.function.name}>${params}</${tc.function.name}>`;
    }).join('\n');
  }
  return qwenResponse.content;
}
```

**Option C: Fine-tuning (Long-term)**
- Train Qwen on XML tool call examples
- Most robust but requires ML resources

#### 1.2 Implement Session Cleanup

**Problem:** Sessions accumulate in memory forever

**Solution:**
```javascript
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.lastAccessed = new Map();

    // Cleanup every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    const TIMEOUT = 30 * 60 * 1000; // 30 minutes

    for (const [id, timestamp] of this.lastAccessed) {
      if (now - timestamp > TIMEOUT) {
        this.sessions.delete(id);
        this.lastAccessed.delete(id);
        console.log(`[SESSION] Cleaned up expired session: ${id}`);
      }
    }
  }

  getSession(conversationId) {
    this.lastAccessed.set(conversationId, Date.now());
    return this.sessions.get(conversationId);
  }

  setSession(conversationId, session) {
    this.sessions.set(conversationId, session);
    this.lastAccessed.set(conversationId, Date.now());
  }
}
```

#### 1.3 Improve Error Handling

**Critical Errors to Handle:**

1. **Expired Qwen Credentials**
```javascript
if (error.response?.status === 401 ||
    error.response?.data?.includes('WAF')) {
  return res.status(401).json({
    error: {
      message: 'Qwen credentials expired. Please update QWEN_TOKEN.',
      type: 'authentication_error'
    }
  });
}
```

2. **Invalid parent_id**
```javascript
if (error.response?.data?.includes('parent_id') &&
    error.response?.data?.includes('not exist')) {
  // Reset session and retry with parent_id: null
  session.parent_id = null;
  return retry();
}
```

3. **Network Errors**
```javascript
if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
  // Retry with exponential backoff
  return retryWithBackoff(attempt + 1);
}
```

4. **Qwen API Errors**
```javascript
if (error.response?.data?.error) {
  return res.status(error.response.status).json({
    error: {
      message: error.response.data.error.message,
      type: 'qwen_api_error',
      code: error.response.data.error.code
    }
  });
}
```

### Phase 2: Integration Testing

#### 2.1 Run Integration Tests

```bash
# Test 1: OpenAI SDK compatibility
npm test -- tests/roocode-integration/01-openai-sdk-compatibility.test.js

# Test 2: SSE format validation
npm test -- tests/roocode-integration/02-sse-format-validation.test.js

# Test 3: Multi-turn conversations
npm test -- tests/roocode-integration/04-end-to-end-integration.test.js
```

**Expected Issues:**
- ❌ XML tool calls may not work (Qwen doesn't output them)
- ⚠️ Session identification may fail in edge cases
- ⚠️ Performance may be slow (network latency)

#### 2.2 Test with Real Roocode

**Setup:**
1. Start proxy: `node proxy-server.js`
2. Configure Roocode:
   ```json
   {
     "apiProvider": "openai-compatible",
     "baseURL": "http://localhost:3000/v1",
     "apiKey": "dummy-key"
   }
   ```
3. Test conversation flow
4. Monitor logs for errors

**Critical Test Cases:**
- Simple conversation (no tools)
- Conversation with tool calls
- Multi-turn context preservation
- Error recovery (network issues, etc.)

### Phase 3: Production Features

#### 3.1 Add Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Log all requests
app.use((req, res, next) => {
  logger.info('Request', {
    method: req.method,
    url: req.url,
    messageCount: req.body?.messages?.length
  });
  next();
});
```

#### 3.2 Add Monitoring

```javascript
// Prometheus metrics
const promClient = require('prom-client');

const requestDuration = new promClient.Histogram({
  name: 'qwen_proxy_request_duration_seconds',
  help: 'Duration of requests in seconds',
  labelNames: ['method', 'status']
});

const activeSessionsGauge = new promClient.Gauge({
  name: 'qwen_proxy_active_sessions',
  help: 'Number of active sessions',
  collect() {
    this.set(sessions.size);
  }
});
```

#### 3.3 Add Rate Limiting (Optional)

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/v1/', limiter);
```

### Phase 4: Optimization

#### 4.1 Connection Pooling

```javascript
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

const qwenClient = axios.create({
  baseURL: QWEN_BASE_URL,
  httpsAgent,
  headers: {
    'Cookie': QWEN_COOKIES,
    'bx-umidtoken': QWEN_TOKEN,
    'User-Agent': 'Mozilla/5.0'
  }
});
```

#### 4.2 Response Caching (Optional)

For repeated identical requests:
```javascript
const cache = new Map();

function getCacheKey(messages) {
  return crypto.createHash('md5')
    .update(JSON.stringify(messages))
    .digest('hex');
}

// Cache responses for 5 minutes
if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
  return cached.response;
}
```

## Recommended Implementation Order

### Week 1: Critical Features
1. ✅ **Day 1-2:** Test XML tool call generation
   - Write test to check Qwen's natural output
   - Implement prompt engineering solution
   - If needed, implement post-processing fallback

2. ✅ **Day 3:** Implement session cleanup
   - Add timeout tracking
   - Add cleanup interval
   - Add session metrics

3. ✅ **Day 4-5:** Improve error handling
   - Handle expired credentials
   - Handle invalid parent_id
   - Handle network errors
   - Add retry logic

### Week 2: Testing & Integration
4. ✅ **Day 6-7:** Run integration tests
   - Fix any failing tests
   - Add debug logging
   - Document issues found

5. ✅ **Day 8-9:** Test with real Roocode
   - Set up Roocode with proxy
   - Test all tool calls
   - Fix compatibility issues

6. ✅ **Day 10:** Performance testing
   - Load testing
   - Latency measurement
   - Optimization if needed

### Week 3: Production Ready
7. ✅ **Day 11-12:** Add logging & monitoring
   - Winston logging
   - Prometheus metrics
   - Health check endpoint

8. ✅ **Day 13-14:** Documentation
   - Deployment guide
   - Configuration options
   - Troubleshooting guide

9. ✅ **Day 15:** Final testing
   - End-to-end testing
   - Security review
   - Performance validation

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ All Qwen API tests pass
- ✅ All Roocode integration tests pass
- ✅ Works with real Roocode client
- ✅ Multi-turn conversations work
- ✅ Basic error handling
- ✅ Session cleanup

### Production Ready
- ✅ All MVP criteria
- ✅ Comprehensive logging
- ✅ Monitoring metrics
- ✅ Documentation complete
- ✅ Load tested (100 concurrent users)
- ✅ Error recovery tested
- ✅ Deployment guide

## Risk Assessment

### High Risk Issues

**1. XML Tool Call Generation**
- **Risk:** Qwen may not output XML format naturally
- **Impact:** Tool calls won't work in Roocode
- **Mitigation:** Implement post-processing fallback
- **Test:** Write test ASAP to validate

**2. Session Identification Reliability**
- **Risk:** First user message hash may collide
- **Impact:** Conversations could get mixed up
- **Mitigation:** Add session ID to hash (timestamp + content)
- **Test:** Simulate concurrent conversations

### Medium Risk Issues

**3. Performance at Scale**
- **Risk:** Creating new Qwen chat per session is slow
- **Impact:** Poor user experience
- **Mitigation:** Connection pooling, caching
- **Test:** Load testing with 100+ concurrent users

**4. Qwen API Rate Limits**
- **Risk:** Qwen may rate limit heavy usage
- **Impact:** Service degradation
- **Mitigation:** Implement request queuing
- **Test:** Monitor in production

### Low Risk Issues

**5. Memory Leaks**
- **Risk:** Sessions accumulate forever
- **Impact:** Server runs out of memory
- **Mitigation:** Session cleanup implemented
- **Test:** Memory profiling

## Next Steps

1. **Start with Phase 1.1** - Test XML tool call generation
   - This is the highest risk item
   - Determines implementation approach
   - Quick to test (1-2 hours)

2. **Then Phase 1.2** - Session cleanup
   - Prevents memory issues
   - Easy to implement
   - No external dependencies

3. **Then Phase 1.3** - Error handling
   - Makes debugging easier
   - Improves reliability
   - Builds on existing code

4. **Then Phase 2** - Integration testing
   - Validates everything works
   - Finds issues early
   - Requires API credentials

Would you like me to start with Phase 1.1 (Testing XML tool call generation)?
