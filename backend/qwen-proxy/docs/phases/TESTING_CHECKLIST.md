# Qwen Proxy Backend - Testing Checklist

Complete testing checklist for validating the Qwen Proxy Backend before production deployment.

**Date:** 2025-10-29
**Version:** 1.0.0
**Status:** Ready for Testing

---

## Pre-Deployment Testing Checklist

### Phase 1: Unit Tests

- [ ] **Configuration Module**
  - [ ] Loads environment variables correctly
  - [ ] Validates required credentials (QWEN_TOKEN, QWEN_COOKIES)
  - [ ] Uses default values for optional settings
  - [ ] Throws error when required values missing

- [ ] **Authentication Module**
  - [ ] QwenAuth initializes with valid credentials
  - [ ] getHeaders() returns correct format
  - [ ] isValid() correctly validates credentials
  - [ ] Throws error with invalid credentials

- [ ] **Type Definitions**
  - [ ] createQwenMessage() creates correct structure
  - [ ] createChatPayload() creates correct structure
  - [ ] createCompletionPayload() creates correct structure
  - [ ] All required fields present
  - [ ] Field names match documentation (snake_case)

- [ ] **Session Manager**
  - [ ] Creates new session with chatId
  - [ ] Retrieves existing session
  - [ ] Updates parentId correctly
  - [ ] Cleanup removes expired sessions
  - [ ] Metrics return correct counts

- [ ] **Session ID Generator**
  - [ ] Generates stable ID for same content
  - [ ] Different content produces different IDs
  - [ ] Handles empty messages
  - [ ] Handles special characters

- [ ] **Request Transformer**
  - [ ] Transforms OpenAI format to Qwen format
  - [ ] Extracts last message only
  - [ ] Uses session.chatId and session.parentId
  - [ ] Handles first message (parentId: null)
  - [ ] Handles follow-up messages

- [ ] **Response Transformer**
  - [ ] Transforms Qwen chunks to OpenAI format
  - [ ] Extracts parent_id from response.created
  - [ ] Handles content chunks
  - [ ] Handles final chunk (status: finished)
  - [ ] Creates usage chunk
  - [ ] Filters empty content chunks

- [ ] **Retry Handler**
  - [ ] Retries on network errors
  - [ ] Retries on 5xx errors
  - [ ] Does NOT retry on 4xx errors
  - [ ] Does NOT retry on auth errors
  - [ ] Implements exponential backoff
  - [ ] Respects max retry limit

---

### Phase 2: Integration Tests

- [ ] **Models Endpoint**
  - [ ] `/v1/models` returns list (200 OK)
  - [ ] Response format matches OpenAI spec
  - [ ] Models list is NOT hardcoded (calls real API)
  - [ ] Contains actual Qwen models (qwen3-max, qwen3-plus, etc.)
  - [ ] Includes model capabilities in metadata
  - [ ] `/v1/models/qwen3-max` returns specific model
  - [ ] `/v1/models/invalid` returns 404
  - [ ] Cache works (subsequent requests faster)

- [ ] **Chat Completions - Non-Streaming**
  - [ ] Basic completion works
  - [ ] Returns OpenAI-compatible format
  - [ ] Contains id, object, created, model, choices, usage
  - [ ] choices[0].message.content has response
  - [ ] Usage tokens are present
  - [ ] finish_reason is "stop"

- [ ] **Chat Completions - Streaming**
  - [ ] Streaming response works
  - [ ] Returns SSE format (data: {...}\n\n)
  - [ ] First chunk has role: assistant
  - [ ] Content chunks contain incremental text
  - [ ] Final chunk has finish_reason: "stop"
  - [ ] Ends with "data: [DONE]\n\n"
  - [ ] Headers set correctly (text/event-stream)

- [ ] **Multi-Turn Conversations**
  - [ ] First message creates new session
  - [ ] Session stores chatId
  - [ ] Follow-up message reuses chatId
  - [ ] parent_id chain works correctly
  - [ ] Context is maintained (AI remembers previous messages)
  - [ ] Same first message reuses conversation

- [ ] **Health Check**
  - [ ] `/health` returns 200 when healthy
  - [ ] Contains status, timestamp, uptime
  - [ ] Reports authentication status
  - [ ] Shows active session count
  - [ ] Shows memory usage
  - [ ] Returns 503 when unhealthy

- [ ] **Metrics Endpoint**
  - [ ] `/metrics` returns Prometheus format
  - [ ] Contains http_request_duration_seconds
  - [ ] Contains http_requests_total
  - [ ] Contains qwen_api_calls_total
  - [ ] Contains active_sessions
  - [ ] Contains Node.js metrics (heap, cpu)

---

### Phase 3: Error Handling Tests

- [ ] **Validation Errors**
  - [ ] Missing messages → 400 error
  - [ ] Empty messages array → 400 error
  - [ ] Message without role → 400 error
  - [ ] Message without content → 400 error
  - [ ] Invalid role → 400 error
  - [ ] Error format matches OpenAI spec

- [ ] **Authentication Errors**
  - [ ] Invalid QWEN_TOKEN → startup error
  - [ ] Invalid QWEN_COOKIES → startup error
  - [ ] Missing credentials → startup error
  - [ ] Error message is descriptive

- [ ] **Network Errors**
  - [ ] Connection timeout triggers retry
  - [ ] Network error triggers retry
  - [ ] After max retries, returns 502
  - [ ] Error is logged

- [ ] **Qwen API Errors**
  - [ ] Qwen 4xx error → returns error to client
  - [ ] Qwen 5xx error → retries then fails
  - [ ] Error message is informative
  - [ ] Doesn't leak sensitive data

---

### Phase 4: Real Qwen API Tests

- [ ] **Models API Integration**
  - [ ] Actually calls https://chat.qwen.ai/api/models
  - [ ] Returns real model data (NOT hardcoded)
  - [ ] Model list matches current Qwen offerings
  - [ ] Capabilities are accurate
  - [ ] Cache duration works

- [ ] **Chat Creation**
  - [ ] Creates chat via /api/v2/chats/new
  - [ ] Receives valid chat_id
  - [ ] chat_id is UUID format
  - [ ] Can reuse chat_id for follow-ups

- [ ] **Message Sending**
  - [ ] Sends message via /api/v2/chat/completions
  - [ ] Receives streaming response
  - [ ] response.created chunk contains parent_id
  - [ ] parent_id is UUID format
  - [ ] Content chunks arrive incrementally
  - [ ] Final chunk indicates completion

- [ ] **Multi-Turn with Real API**
  - [ ] Send first message → get response
  - [ ] Extract and store parent_id
  - [ ] Send second message with parent_id
  - [ ] AI response shows context awareness
  - [ ] Example: "My name is Alice" → "What's my name?" → "Alice"

---

### Phase 5: OpenAI SDK Compatibility

- [ ] **Node.js OpenAI SDK**
  ```javascript
  const OpenAI = require('openai');
  const client = new OpenAI({
    baseURL: 'http://localhost:3000/v1',
    apiKey: 'dummy'
  });
  ```
  - [ ] list models works
  - [ ] chat.completions.create() non-streaming works
  - [ ] chat.completions.create() streaming works
  - [ ] Multi-turn conversation works
  - [ ] Error handling works

- [ ] **Python OpenAI SDK**
  ```python
  from openai import OpenAI
  client = OpenAI(
      base_url="http://localhost:3000/v1",
      api_key="dummy"
  )
  ```
  - [ ] list models works
  - [ ] chat.completions.create() non-streaming works
  - [ ] chat.completions.create() streaming works
  - [ ] Multi-turn conversation works

---

### Phase 6: Roocode Compatibility

- [ ] **Basic Functionality**
  - [ ] Roocode connects successfully
  - [ ] Can send messages
  - [ ] Receives responses
  - [ ] Streaming works

- [ ] **XML Tags (If Implemented)**
  - [ ] Plain text wrapped in `<attempt_completion>`
  - [ ] Roocode parses responses correctly
  - [ ] No parsing errors in Roocode

---

### Phase 7: Performance Tests

- [ ] **Response Times**
  - [ ] Models endpoint < 500ms (cached)
  - [ ] First API call < 2000ms (cache miss)
  - [ ] Chat completion starts streaming < 2000ms
  - [ ] Health check < 100ms
  - [ ] Metrics endpoint < 200ms

- [ ] **Concurrent Requests**
  - [ ] Handles 10 concurrent requests
  - [ ] Handles 50 concurrent requests
  - [ ] Handles 100 concurrent requests
  - [ ] No crashes or memory leaks
  - [ ] Response times remain acceptable

- [ ] **Memory Usage**
  - [ ] Baseline memory < 200 MB
  - [ ] Under load < 500 MB
  - [ ] No memory leaks after 1000 requests
  - [ ] Session cleanup prevents memory growth

- [ ] **Throughput**
  - [ ] Can handle 100 req/min
  - [ ] Can handle 1000 req/min (with clustering)
  - [ ] No request drops
  - [ ] Error rate < 1%

---

### Phase 8: Session Management Tests

- [ ] **Session Lifecycle**
  - [ ] New conversation creates session
  - [ ] Session stores chatId and parentId
  - [ ] Session retrieved on follow-up
  - [ ] Session expires after timeout
  - [ ] Cleanup removes old sessions

- [ ] **Session Cleanup**
  - [ ] Cleanup runs on interval
  - [ ] Expired sessions removed
  - [ ] Active sessions retained
  - [ ] Metrics updated correctly

- [ ] **Session Under Load**
  - [ ] Multiple concurrent sessions
  - [ ] No session collision
  - [ ] Correct session retrieved
  - [ ] No race conditions

---

### Phase 9: Security Tests

- [ ] **Credential Protection**
  - [ ] Credentials not in logs
  - [ ] Credentials not in error messages
  - [ ] .env file not in git
  - [ ] Sanitization works

- [ ] **Input Validation**
  - [ ] XSS attempts rejected
  - [ ] SQL injection attempts N/A (no DB)
  - [ ] Large payloads handled
  - [ ] Special characters handled

- [ ] **Security Headers** (if behind nginx)
  - [ ] HSTS header present
  - [ ] X-Frame-Options present
  - [ ] X-Content-Type-Options present
  - [ ] CSP header present (optional)

- [ ] **CORS** (if enabled)
  - [ ] Only allowed origins accepted
  - [ ] Credentials handled correctly
  - [ ] Preflight requests work

---

### Phase 10: Deployment Tests

- [ ] **Docker**
  - [ ] Image builds successfully
  - [ ] Container starts
  - [ ] Container responds to requests
  - [ ] Health check passes
  - [ ] Logs accessible
  - [ ] Can stop/restart gracefully

- [ ] **Docker Compose**
  - [ ] All services start
  - [ ] Networking works
  - [ ] Volumes persist data
  - [ ] Health checks pass
  - [ ] Can update and redeploy

- [ ] **PM2**
  - [ ] Starts in cluster mode
  - [ ] All instances running
  - [ ] Load balancing works
  - [ ] Can reload without downtime
  - [ ] Logs accessible
  - [ ] Auto-restart on crash

- [ ] **Systemd**
  - [ ] Service starts
  - [ ] Auto-starts on boot
  - [ ] Restarts on failure
  - [ ] Logs to journal
  - [ ] Can stop/restart
  - [ ] Environment variables loaded

---

### Phase 11: Monitoring Tests

- [ ] **Logging**
  - [ ] Logs to console/file
  - [ ] Log level configurable
  - [ ] Structured JSON in production
  - [ ] Pretty print in development
  - [ ] Sensitive data sanitized

- [ ] **Prometheus Metrics**
  - [ ] Metrics endpoint accessible
  - [ ] All custom metrics present
  - [ ] Metrics update correctly
  - [ ] Prometheus can scrape
  - [ ] No metric errors

- [ ] **Grafana** (if configured)
  - [ ] Can connect to Prometheus
  - [ ] Dashboards load
  - [ ] Metrics display correctly
  - [ ] Alerts work (if configured)

---

### Phase 12: Graceful Shutdown Tests

- [ ] **SIGTERM Handling**
  - [ ] Stops accepting new connections
  - [ ] Completes active requests
  - [ ] Cleans up sessions
  - [ ] Exits with code 0
  - [ ] Logs shutdown process

- [ ] **SIGINT Handling**
  - [ ] Same as SIGTERM
  - [ ] Can Ctrl+C to stop

- [ ] **Timeout Handling**
  - [ ] Force exits after 10 seconds
  - [ ] Logs forced shutdown
  - [ ] Exits with error code

---

### Phase 13: Documentation Tests

- [ ] **README**
  - [ ] Setup instructions accurate
  - [ ] All commands work
  - [ ] Environment variables documented
  - [ ] Examples work

- [ ] **API Documentation**
  - [ ] All endpoints documented
  - [ ] Examples are correct
  - [ ] Response formats match
  - [ ] Error codes listed

- [ ] **Deployment Guide**
  - [ ] All deployment methods work
  - [ ] Commands are correct
  - [ ] Configuration examples valid
  - [ ] Troubleshooting helps

---

## Critical Issues (Must Fix Before Production)

- [ ] All critical tests pass
- [ ] No hardcoded model data
- [ ] Real Qwen API integration verified
- [ ] Multi-turn conversations work
- [ ] Error handling robust
- [ ] Security measures in place
- [ ] Logging works
- [ ] Monitoring works
- [ ] Graceful shutdown works

---

## Performance Benchmarks

### Expected Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Models endpoint (cached) | < 500ms | ___ | [ ] |
| Chat completion (first chunk) | < 2000ms | ___ | [ ] |
| Health check | < 100ms | ___ | [ ] |
| Memory usage (idle) | < 200MB | ___ | [ ] |
| Memory usage (load) | < 500MB | ___ | [ ] |
| Concurrent requests (100) | No errors | ___ | [ ] |
| Throughput | 100+ req/min | ___ | [ ] |

---

## Final Production Readiness

- [ ] **Code Quality**
  - [ ] No console.log() in production
  - [ ] No TODO comments for critical features
  - [ ] Error handling comprehensive
  - [ ] Code reviewed

- [ ] **Configuration**
  - [ ] All env variables documented
  - [ ] Production .env.example created
  - [ ] Sensitive defaults removed
  - [ ] Security settings enabled

- [ ] **Dependencies**
  - [ ] All dependencies installed
  - [ ] No vulnerabilities (npm audit)
  - [ ] Versions locked (package-lock.json)
  - [ ] Dev dependencies separated

- [ ] **Documentation**
  - [ ] README complete
  - [ ] API docs complete
  - [ ] Deployment guide complete
  - [ ] Troubleshooting guide complete

- [ ] **Deployment**
  - [ ] Dockerfile works
  - [ ] docker-compose.yml works
  - [ ] PM2 config works
  - [ ] Systemd service works
  - [ ] Nginx config works

- [ ] **Monitoring**
  - [ ] Health checks configured
  - [ ] Metrics exposed
  - [ ] Logging configured
  - [ ] Alerting setup (optional)

- [ ] **Security**
  - [ ] Credentials protected
  - [ ] Security headers set
  - [ ] HTTPS configured (production)
  - [ ] Firewall configured
  - [ ] Rate limiting considered

---

## Sign-Off

### Testing Completed By

**Name:** ___________________
**Date:** ___________________
**Role:** ___________________

### Issues Found

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

### Production Deployment Approval

- [ ] All critical tests pass
- [ ] All high-priority tests pass
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Deployment tested

**Approved By:** ___________________
**Date:** ___________________
**Signature:** ___________________

---

## FINAL STATUS: ⬜ NOT READY | ⬜ READY FOR PRODUCTION

**Notes:**

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
