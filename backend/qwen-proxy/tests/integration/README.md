# Integration Tests

This directory contains comprehensive integration tests for the Qwen Proxy server. These tests validate end-to-end functionality by making real HTTP requests to the running proxy server.

## Phase 8: Chat Completions Handler Tests

Phase 8 introduces the main chat completions endpoint that orchestrates all previous phases (1-7).

## Test Files

### Phase 8: Chat Completions Handler

1. **chat-completions.test.js** (NEW)
   - Jest-based unit tests with mocked QwenClient
   - Tests request validation
   - Tests session management
   - Tests parent_id chain logic
   - Tests streaming and non-streaming modes
   - Tests multi-turn conversations
   - Tests error handling
   - **20+ test cases**

2. **manual-test-chat-completions.js** (NEW)
   - Manual integration tests with REAL API calls
   - Tests first message (parent_id = null)
   - Tests follow-up messages (parent_id = UUID)
   - Tests streaming mode
   - Tests multi-turn context preservation
   - Colorful console output with detailed verification
   - **4 comprehensive test scenarios**

### Phase 6 Core Integration Tests

1. **01-openai-compatibility.test.js**
   - Tests basic OpenAI API compatibility
   - Validates non-streaming and streaming responses
   - Checks response format and structure
   - Verifies token usage reporting
   - Tests model parameter preservation
   - Tests health endpoint
   - **7 test cases**

2. **02-multi-turn-conversations.test.js**
   - Tests multi-turn conversation context preservation
   - Validates session creation and reuse
   - Tests 2, 3, and 5-turn conversations
   - Verifies full conversation history handling (Roocode style)
   - Tests session identification by first user message
   - Tests streaming mode context preservation
   - **8 test cases**

3. **03-session-management.test.js**
   - Tests parallel conversation isolation
   - Validates session reuse for same conversation
   - Tests session isolation between different conversations
   - Verifies parent_id tracking
   - Tests multiple concurrent sessions
   - Tests session persistence over time
   - **6 test cases**

4. **04-error-recovery.test.js**
   - Tests error handling for invalid requests
   - Validates OpenAI-compatible error format
   - Tests missing/empty messages arrays
   - Tests invalid message formats
   - Tests concurrent requests
   - Tests large message content
   - Tests special characters
   - Tests long conversation history
   - Tests wrong HTTP methods
   - **16 test cases**

### Additional Test Files

5. **session-integration.test.js**
   - Unit-level session management integration tests
   - Tests conversation ID generation
   - Tests session lifecycle simulation
   - **6 test cases**

## Running Tests

### Prerequisites

1. **Start the proxy server:**
   ```bash
   node src/server.js
   ```
   Or use the background process:
   ```bash
   node src/server.js &
   ```

2. **Set environment variables:**
   ```bash
   # Required for tests that make real API calls
   QWEN_TOKEN=your-token
   QWEN_COOKIES=your-cookies

   # Optional: Change proxy URL (default: http://localhost:3000)
   TEST_PROXY_URL=http://localhost:3000
   ```

### Run All Integration Tests

```bash
npm test -- tests/integration/
```

### Run Specific Test Files

```bash
# Phase 8: Chat completions handler (mocked)
npm test -- tests/integration/chat-completions.test.js

# Phase 8: Manual tests with real API
node tests/integration/manual-test-chat-completions.js

# OpenAI compatibility tests
npm test -- tests/integration/01-openai-compatibility.test.js

# Multi-turn conversation tests
npm test -- tests/integration/02-multi-turn-conversations.test.js

# Session management tests
npm test -- tests/integration/03-session-management.test.js

# Error recovery tests
npm test -- tests/integration/04-error-recovery.test.js
```

### Run Without API Credentials

Tests that require real API calls will gracefully skip if no credentials are provided:

```bash
# These tests will skip API calls but still run validation tests
npm test -- tests/integration/04-error-recovery.test.js
```

## Test Coverage

### What's Tested

- OpenAI API compatibility (response format, structure)
- Streaming and non-streaming modes
- Multi-turn context preservation (2-5 turns)
- Session management and isolation
- Parent ID tracking for context
- Error handling and validation
- Concurrent request handling
- Edge cases (special characters, large content, etc.)

### Total Test Cases

- **Phase 6 Integration Tests**: 37 test cases
- **All Integration Tests**: 43+ test cases

## Test Behavior

### Credential Handling

- Tests check for `QWEN_TOKEN` and `QWEN_COOKIES` environment variables
- Tests that require API calls will skip if credentials are missing
- Error handling tests run without credentials (test validation only)

### Timeouts

- Most tests: 30 seconds
- Multi-turn tests: 60-90 seconds
- Long conversation tests: 150 seconds

### Session State

- Tests may create sessions on the server
- Check `/health` endpoint to see session count
- Sessions persist in memory until server restart

## Troubleshooting

### Server Not Running

If tests fail with `ECONNREFUSED`:
```bash
# Start the server
node src/server.js &

# Verify it's running
curl http://localhost:3000/health
```

### Tests Timeout

- Increase Jest timeout: `--testTimeout=60000`
- Check server logs for errors
- Verify network connectivity

### Tests Skip

If tests skip with "no credentials":
- Set `QWEN_TOKEN` and `QWEN_COOKIES` in `.env`
- Source the environment: `source .env` or use dotenv

### Memory Issues

If too many sessions accumulate:
```bash
# Restart the server
pkill -f "node src/server.js"
node src/server.js &
```

## Expected Results

With credentials configured and server running:
- **01-openai-compatibility.test.js**: All 7 tests should pass
- **02-multi-turn-conversations.test.js**: All 8 tests should pass
- **03-session-management.test.js**: All 6 tests should pass (takes several minutes)
- **04-error-recovery.test.js**: All 16 tests should pass

Without credentials:
- Error handling tests still pass (16 tests)
- API-dependent tests gracefully skip

## Integration with CI/CD

For automated testing:

1. Set credentials as environment variables
2. Start server in background: `node src/server.js &`
3. Wait for server: `sleep 2`
4. Run tests: `npm test -- tests/integration/`
5. Kill server: `pkill -f "node src/server.js"`

Example:
```bash
#!/bin/bash
export QWEN_TOKEN=$SECRET_TOKEN
export QWEN_COOKIES=$SECRET_COOKIES
node src/server.js &
SERVER_PID=$!
sleep 2
npm test -- tests/integration/
EXIT_CODE=$?
kill $SERVER_PID
exit $EXIT_CODE
```
