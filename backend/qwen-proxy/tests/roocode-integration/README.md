# Roocode Integration Tests

## Overview

This test suite validates that the Qwen proxy can properly communicate with the Roocode client.

**NO MOCKS - These are REAL integration tests.**

## Test Files

### 01-openai-sdk-compatibility.test.js

Tests that our proxy works with the REAL OpenAI SDK (same as Roocode uses).

**Tests:**
- Non-streaming completions
- Streaming completions with token usage
- Conversation context preservation

**Run:**
```bash
npm test -- tests/roocode-integration/01-openai-sdk-compatibility.test.js
```

**Note:** Requires proxy server credentials in `.env`

---

### 02-sse-format-validation.test.js

Validates that Server-Sent Events (SSE) format matches OpenAI SDK expectations.

**Tests:**
- SSE chunk structure validation
- Multi-line content handling
- Rapid chunk processing without corruption

**Run:**
```bash
npm test -- tests/roocode-integration/02-sse-format-validation.test.js
```

**Note:** Requires proxy server credentials in `.env`

---

### 03-xml-tool-call-parsing.test.js

Tests XML tool call format compatibility with Roocode's parser.

**Tests:**
- Single tool call extraction
- Multi-parameter tools
- XML-like content in parameters (e.g., JSX)
- Consecutive tool calls
- Content parameter newline handling
- Edge cases (malformed XML, empty params)

**Run:**
```bash
npm test -- tests/roocode-integration/03-xml-tool-call-parsing.test.js
```

**Note:** This test suite runs WITHOUT API calls - it simulates Roocode's parser locally.

**Status:** ✅ All 9 tests passing

---

### 04-end-to-end-integration.test.js

Complete integration tests simulating real Roocode usage scenarios.

**Tests:**
- Full conversation flow with context
- Real-time streaming with parsing
- Multi-turn conversations
- Error handling
- Performance benchmarks

**Run:**
```bash
npm test -- tests/roocode-integration/04-end-to-end-integration.test.js
```

**Note:** Requires proxy server credentials in `.env`

---

## Running All Integration Tests

```bash
# Run all Roocode integration tests
npm test -- tests/roocode-integration

# Run with verbose output
npm test -- tests/roocode-integration --verbose

# Run specific test
npm test -- tests/roocode-integration/03-xml-tool-call-parsing.test.js
```

## Prerequisites

### 1. Install Dependencies

```bash
cd /mnt/d/Projects/qwen_proxy/backend
npm install
```

### 2. Configure Credentials

Create or update `.env` file:

```bash
QWEN_TOKEN=<your-bx-umidtoken>
QWEN_COOKIES=<your-cookies>
```

See `SETUP_INSTRUCTIONS.md` for how to obtain these.

### 3. Verify Setup

```bash
# Test credentials
npm test -- tests/00-diagnostic.test.js
```

## Test Results

### XML Parsing Tests (✅ Complete)

```
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Time:        ~3 seconds
```

All XML parsing tests pass - validates that our proxy can generate XML format that Roocode can parse.

### OpenAI SDK Tests (⏳ Pending)

Requires running proxy server with real Qwen API credentials.

### SSE Format Tests (⏳ Pending)

Requires running proxy server with real Qwen API credentials.

### E2E Tests (⏳ Pending)

Requires running proxy server with real Qwen API credentials.

## What's Tested

### ✅ Verified (No API Required)

- XML tool call format
- Parser compatibility
- Content parameter handling
- Multi-parameter tools
- Edge cases

### ⏳ Ready to Test (Requires API)

- OpenAI SDK integration
- SSE streaming format
- Real-time parsing
- Conversation continuity
- Error handling
- Performance

## Key Findings

### 1. Roocode Uses OpenAI SDK

Roocode doesn't implement custom HTTP logic - it uses the official OpenAI SDK.

**Implication:** If our proxy works with the OpenAI SDK, it works with Roocode.

### 2. Tool Calls MUST Be XML

**Critical:** Roocode expects tool calls as XML in the text content:

```xml
<read_file><path>src/index.js</path></read_file>
```

NOT as OpenAI's native tool_calls format:

```json
{
  "tool_calls": [
    {
      "function": {
        "name": "read_file",
        "arguments": "{\"path\": \"src/index.js\"}"
      }
    }
  ]
}
```

### 3. Content Parameter Special Handling

The `<content>` parameter strips only first and last newlines:

```typescript
// WRONG
content.trim()  // Removes ALL leading/trailing whitespace

// RIGHT
content.replace(/^\n/, "").replace(/\n$/, "")  // Only strip newlines at edges
```

### 4. Streaming is Critical

Roocode always uses `stream: true` and expects:
- Real-time character-by-character parsing
- SSE format with proper chunks
- Usage data in final chunk

## Next Steps

### Phase 1: Run Integration Tests ✅

```bash
# XML parsing tests (complete)
npm test -- tests/roocode-integration/03-xml-tool-call-parsing.test.js
```

### Phase 2: Test OpenAI SDK Integration ⏳

1. Ensure proxy server is running
2. Configure credentials
3. Run OpenAI SDK tests

```bash
npm test -- tests/roocode-integration/01-openai-sdk-compatibility.test.js
```

### Phase 3: Test SSE Format ⏳

```bash
npm test -- tests/roocode-integration/02-sse-format-validation.test.js
```

### Phase 4: End-to-End Testing ⏳

```bash
npm test -- tests/roocode-integration/04-end-to-end-integration.test.js
```

### Phase 5: Test with Real Roocode Client ⏳

1. Configure Roocode to use proxy
2. Test in Roocode UI
3. Verify all features work

## Troubleshooting

### Tests Fail with "Connection Refused"

**Problem:** Proxy server not running

**Solution:**
```bash
# Start proxy server
node proxy-server.js
```

### Tests Fail with "Unauthorized"

**Problem:** Invalid Qwen credentials

**Solution:**
1. Check `.env` file
2. Verify QWEN_TOKEN and QWEN_COOKIES
3. Re-obtain from browser if expired

### XML Parsing Tests Fail

**Problem:** Parser implementation mismatch

**Solution:**
1. Review Roocode source code
2. Check `/mnt/d/Projects/Roo-Cline/src/core/assistant-message/AssistantMessageParser.ts`
3. Update parser simulation

## Documentation

See main documentation:
- `ROOCODE_INTEGRATION.md` - Complete integration findings
- `README.md` - Project overview
- `DISCOVERIES.md` - Qwen API discoveries

## Support

Questions about these tests?

1. Review `ROOCODE_INTEGRATION.md` for detailed findings
2. Check Roocode source code at `/mnt/d/Projects/Roo-Cline/`
3. Run tests with `--verbose` flag for detailed output

---

**Test Suite Version:** 1.0
**Last Updated:** October 28, 2024
**Status:** XML Parsing Tests Complete ✅
