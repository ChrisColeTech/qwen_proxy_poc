# Test-Driven Development Report

## Mission: Rebuild Qwen Proxy Backend with REAL API Tests

**Date:** 2025-10-28
**Approach:** Test-Driven Development with NO MOCKS
**Status:** ✅ COMPLETE

---

## Process Overview

### Phase 1: Clean Slate

1. ✅ Deleted entire `/mnt/d/Projects/qwen_proxy/backend` folder
2. ✅ Created fresh directory
3. ✅ Initialized npm project
4. ✅ Installed dependencies: express, axios, dotenv, jest, supertest, uuid

### Phase 2: Test Infrastructure

1. ✅ Copied `.env` from parent directory
2. ✅ Configured Jest for Node.js environment
3. ✅ Created test directory structure

### Phase 3: Discovery Through Testing

Created 4 test files with 7 tests total, all calling REAL Qwen API:

#### Test 1: Diagnostic Tests (00-diagnostic.test.js)

**Purpose:** Verify credentials and basic connectivity

**Discoveries:**
- ❌ QWEN_TOKEN was initially "undefined"
- ✅ User updated with valid `bx-umidtoken`
- ❌ Models endpoint returns WAF without proper headers
- ✅ Creating chat works with all required headers

**Key Insight:** Must include `User-Agent` header to avoid WAF

#### Test 2: First Message (01-qwen-chat.test.js)

**Purpose:** Send a message to a new chat

**Attempts:**
1. ❌ Used `parent_id: "root"` → Error: "parent_id root is not exist"
2. ❌ Used `parent_id: uuidv4()` → Error: "parent_id {uuid} is not exist"
3. ✅ Used `parent_id: null` → SUCCESS!

**Discovery:** First message MUST have `parent_id: null`

**Result:**
```
Chat created: 853306a9-0dd3-4c38-9c52-25ca481c9ca4
Assistant: "Hello there! 👋"
```

#### Test 3: Follow-up Messages (02-follow-up-messages.test.js)

**Purpose:** Discover how Qwen handles conversation context

**Test Setup:**
- First message: "Remember this number: 42"
- Follow-up: "What number did I ask you to remember?"

**Attempts:**
1. ✅ Send only NEW message (no history) → Request succeeds!
2. ❌ Used `message_id` as parent → Context NOT preserved
3. Result: "You never asked me to remember a number"

**Discovery:** Qwen accepts single messages, but parent_id chain matters!

#### Test 4: Parent ID Chain (03-parent-id-discovery.test.js)

**Purpose:** Understand parent_id vs message_id

**Test Setup:**
- First message: "My favorite color is blue"
- Follow-up: "What is my favorite color?"

**Key Observations:**
```json
Response from message 1:
{
  "parent_id": "0add4c96-c9b6-4fff-b1dd-51df75dda74b",
  "message_id": "2769348b-c077-41a6-9d35-636a7bd89a53"
}
```

**Attempt with `parent_id` from response:**
- ✅ Context preserved!
- ✅ Assistant: "Your favorite color is blue"

**CRITICAL DISCOVERY:**
- Use `parent_id` from response (NOT `message_id`)
- Parent ID creates a chain that Qwen uses server-side
- Only send new message, Qwen retrieves context via parent_id

---

## Final Test Results

```
Test Suites: 4 passed, 4 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        ~30 seconds
```

**All tests passed against REAL Qwen API!**

---

## Documented Discoveries

### 1. Authentication
- `bx-umidtoken`: Must be present (from browser)
- `Cookie`: Full cookie string
- `User-Agent`: Browser UA (avoids WAF)
- Without these → HTML WAF challenge, not JSON

### 2. Creating Chats
```javascript
POST /api/v2/chats/new
{
  "title": "Chat Title",
  "models": ["qwen3-max"],
  "chat_mode": "guest",
  "chat_type": "t2t",
  "timestamp": Date.now()
}
```

### 3. First Message
```javascript
{
  "parent_id": null,  // ← MUST BE NULL!
  "messages": [{
    "parentId": null,  // ← MUST BE NULL!
    "parent_id": null  // ← MUST BE NULL!
  }]
}
```

### 4. Follow-up Messages
```javascript
{
  "parent_id": previousResponse.data.parent_id,  // ← Use this!
  "messages": [/* Only NEW message */]
}
```

### 5. Server-Side Context
- Qwen maintains conversation history internally
- Parent ID chain links messages
- No need to send full message array
- Dramatically simpler than expected!

---

## Files Created

### Test Files
- `tests/00-diagnostic.test.js` - Credential verification
- `tests/01-qwen-chat.test.js` - First message test
- `tests/02-follow-up-messages.test.js` - Follow-up discovery
- `tests/03-parent-id-discovery.test.js` - Parent ID proof

### Documentation
- `DISCOVERIES.md` - Detailed findings with code examples
- `SETUP_INSTRUCTIONS.md` - How to get bx-umidtoken
- `README.md` - Project overview
- `TDD_REPORT.md` - This file

### Configuration
- `package.json` - Dependencies and scripts
- `jest.config.js` - Jest configuration
- `.env` - Credentials (copied from parent)

---

## Key Learnings

### What We THOUGHT Qwen Needed
- Full conversation history in every request
- Complex session management
- Message array like OpenAI

### What Qwen ACTUALLY Needs
- Only the new message
- Parent ID from previous response
- Maintains context server-side

### Impact
- Much simpler proxy implementation
- Less data transferred per request
- No need to manage full message history

---

## Success Criteria Met

✅ Backend folder deleted and recreated
✅ At least 2 REAL API tests passing (we have 7!)
✅ Tests document ACTUAL Qwen behavior
✅ NO mock tests exist
✅ Implementation discoveries proven with real API

---

## Next Steps for Proxy Implementation

Based on our discoveries:

1. **Session Management**
   ```javascript
   sessions.set(conversationId, {
     chat_id: qwenChatId,
     parent_id: latestParentId
   });
   ```

2. **Message Handling**
   ```javascript
   // Extract only last message from OpenAI array
   const lastMessage = openAIMessages[openAIMessages.length - 1];

   // Send to Qwen with stored parent_id
   const response = await qwen.sendMessage({
     parent_id: session.parent_id,
     message: lastMessage
   });

   // Update parent_id for next message
   session.parent_id = response.data.parent_id;
   ```

3. **OpenAI Compatibility**
   - Convert OpenAI message format to Qwen format
   - Convert Qwen response to OpenAI format
   - Handle streaming (separate implementation)

---

## Conclusion

**TDD with real API testing proved its value:**

1. **No assumptions** - Every behavior verified
2. **No surprises** - Know exactly how Qwen works
3. **No mocks** - Tests prove real functionality
4. **Clear documentation** - Findings captured in tests
5. **Confidence** - Implementation will work first time

**The proxy can now be built on solid ground, not guesswork.**

---

## Test Execution Evidence

All tests can be re-run at any time:

```bash
cd /mnt/d/Projects/qwen_proxy/backend
npm test
```

Every test calls the real Qwen API and verifies actual behavior.

**NO MOCK TESTS. ONLY REAL API TESTS.**

---

*End of Report*
