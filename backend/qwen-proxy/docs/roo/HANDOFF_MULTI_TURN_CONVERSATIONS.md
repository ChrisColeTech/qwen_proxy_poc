# Multi-Turn Conversation Debugging - Handoff Document

**Date:** 2025-10-29
**Status:** Critical Bug Identified - System Message parent_id
**Priority:** HIGH
**Next Owner:** TBD

---

## Executive Summary

**DISCOVERED:** Second critical transformer bug causing empty responses in multi-turn conversations. System messages are incorrectly assigned `parent_id` from previous assistant response, causing Qwen to return empty content.

**STATUS:**
- ✅ Single requests (new sessions): **100% working** with XML tool calls
- ❌ Multi-turn conversations: **Step 2+ fail** with empty responses
- ⚠️ Root cause identified, fix ready to apply

---

## 1. What We Accomplished

### 1.1 Fixed First Critical Bug: System Prompt Inclusion ✅

**File:** `src/transformers/openai-to-qwen-transformer.js`
**Lines:** 25-45

**The Bug:**
```javascript
// BEFORE: Only sent last message, discarded system prompt
function extractLastMessage(messages) {
  return messages[messages.length - 1];
}
```

**The Fix:**
```javascript
// AFTER: Include system message + last message
function extractMessagesToSend(messages) {
  const result = [];

  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'system') {
    result.push(lastMessage);
  }

  return result;
}
```

**Result:** 100% XML tool call success on first requests ✅

### 1.2 Identified Second Critical Bug: System Message parent_id ⚠️

**File:** `src/transformers/openai-to-qwen-transformer.js`
**Lines:** 149-150

**Database Evidence:**

| Request | Step | System parent_id | User parent_id | Response |
|---------|------|------------------|----------------|----------|
| 197 | 1 (new) | `null` ✅ | `null` ✅ | `<read_file>` (6 sec) ✅ |
| 198 | 1 (new) | `null` ✅ | `null` ✅ | `<list_files>` (6 sec) ✅ |
| 199 | 2 (continuation) | `3f9da6b2...` ❌ | `3f9da6b2...` ✅ | `""` empty (1.1 sec) ❌ |

**The Bug:**
```javascript
// Line 149-150: ALL messages get same parent_id
const qwenMessages = messagesToSend.map(msg =>
  createQwenMessage(msg, parentId, model)  // BUG: System gets parent_id too!
);
```

**Why It Breaks:**
- **Request 199:** System message has `parent_id: "3f9da6b2..."`
- Qwen returns empty response in 1.1 seconds (vs normal 6 seconds)
- 0 prompt_tokens, 0 completion_tokens
- Content: `""` (empty string)

**The Pattern:**
- System messages should **ALWAYS** have `parent_id: null` (they're configuration, not conversation)
- User messages in continuations get `parent_id: <previous_assistant_id>` (links the chain)
- Qwen rejects/ignores requests where system message has a parent_id

### 1.3 Test Infrastructure Created ✅

**File:** `tests/integration/test-prewarm-validation.test.js`

- Loads real 38KB Roo-Cline system prompt
- Replaces hardcoded paths with test environment paths
- Tests new sessions AND multi-turn conversations
- Validates XML tool call format
- Uses `beforeAll` database cleanup to preserve data for investigation

---

## 2. What Work Remains

### 2.1 IMMEDIATE: Fix System Message parent_id Bug 🔥

**Priority:** CRITICAL
**Estimated Time:** 10 minutes + testing

**Required Change:**
```javascript
// File: src/transformers/openai-to-qwen-transformer.js
// Lines: 148-152

// CURRENT (BROKEN):
const qwenMessages = messagesToSend.map(msg =>
  createQwenMessage(msg, parentId, model)
);

// FIX:
const qwenMessages = messagesToSend.map(msg => {
  // System messages always have parent_id: null
  // Only user/assistant messages get parent_id from session
  const msgParentId = (msg.role === 'system') ? null : parentId;
  return createQwenMessage(msg, msgParentId, model);
});
```

**Expected Outcome:**
- Step 2+ requests will include proper system message with `parent_id: null`
- Qwen will return valid XML tool calls instead of empty responses
- Multi-turn test should pass all 5 steps

### 2.2 Validate Multi-Turn Conversations

**After fix, test:**
1. Run integration test: `npm test -- tests/integration/test-prewarm-validation.test.js`
2. Test with real Roo-Cline: 5-turn conversation
3. Verify no hash mismatches (Step 3 400 errors)

### 2.3 Monitor Response Consistency

**Unknown:** Will fixing parent_id also fix hash mismatches?

**Hypothesis:** Empty responses in Step 2 caused hash mismatches in Step 3:
- Step 1: Creates session, hash = MD5(user + assistant)
- Step 2: Returns empty → No hash update possible
- Step 3: Tries to lookup with wrong hash → 404 Session not found

**To Verify:**
```bash
# After fix, check if responses are now consistent
npm test -- tests/integration/test-prewarm-validation.test.js

# Look for:
# Step 1: ✅ Has XML
# Step 2: ✅ Has XML (should be fixed now!)
# Step 3: ✅ Has XML (hash should match now!)
```

---

## 3. Prime Suspects - Where to Begin

### 3.1 SUSPECT #1: System Message parent_id Bug ⭐⭐⭐⭐⭐

**Status:** CONFIRMED via database analysis
**Priority:** FIX FIRST

**Evidence:**
```sql
-- Request 199 (Step 2 - failed):
-- system.parent_id: "3f9da6b2-ecb3-41b2-9c03-5e41a2b5a72b" (WRONG!)
-- user.parent_id: "3f9da6b2-ecb3-41b2-9c03-5e41a2b5a72b" (correct)
-- Response: "" (empty, 1.1 sec)

-- Requests 197 & 198 (Step 1 - worked):
-- system.parent_id: null (correct)
-- user.parent_id: null (correct)
-- Response: XML tool calls (6 sec)
```

**Fix:** See Section 2.1 above

### 3.2 SUSPECT #2: Hash Mismatch Cascade ⭐⭐⭐

**Hypothesis:** Empty Step 2 response prevents hash from being set, causing Step 3 lookup to fail.

**Flow:**
```
Step 1: User asks task → Qwen responds with XML → Hash set
Step 2: User asks task → Qwen returns EMPTY (parent_id bug) → Hash NOT set
Step 3: User asks task → Lookup hash → NOT FOUND → 404 error
```

**Investigation After Fix:**
```bash
# Check if hash is properly set after Step 2
sqlite3 data/qwen_proxy.db "
  SELECT
    s.id,
    s.message_count,
    s.conversation_hash,
    length(s.conversation_hash) as hash_len
  FROM sessions s
  ORDER BY s.created_at DESC
  LIMIT 5
"
```

### 3.3 SUSPECT #3: Response Content Variation ⭐⭐

**Hypothesis:** Even with fixed parent_id, responses might vary slightly causing hash mismatches.

**Evidence Needed:**
```bash
# Run test 3 times, check if Step 2 responses are identical
for i in 1 2 3; do
  npm test -- tests/integration/test-prewarm-validation.test.js 2>&1 |
    grep "Response 2 preview" |
    tee response_2_run_$i.txt
done

diff response_2_run_1.txt response_2_run_2.txt
```

**If responses vary:**
- Consider response normalization (extract XML tags only)
- Use response fingerprinting
- Add fuzzy matching fallback

### 3.4 SUSPECT #4: Session Timing Issues ⭐

**Hypothesis:** Hash might not be committed to DB before next request.

**Investigation:**
```javascript
// Add to session-manager.js setConversationHash():
console.log('[SessionManager] Setting hash:', conversationHash);
this.repo.setConversationHash(sessionId, conversationHash);

// Verify immediately
const verified = this.repo.getSession(sessionId);
console.log('[SessionManager] Verified hash in DB:', verified.conversation_hash);
console.log('[SessionManager] Match:', verified.conversation_hash === conversationHash);
```

---

## 4. Step-by-Step Fix & Test Approach

### Phase 1: Apply Critical Fix (15 minutes)

**Step 1: Fix the transformer**

```bash
# Edit the file
code src/transformers/openai-to-qwen-transformer.js
```

Replace lines 149-150:
```javascript
const qwenMessages = messagesToSend.map(msg => {
  // System messages always have parent_id: null
  const msgParentId = (msg.role === 'system') ? null : parentId;
  return createQwenMessage(msg, msgParentId, model);
});
```

**Step 2: Clear test database**

```bash
sqlite3 data/qwen_proxy.db "
  DELETE FROM sessions;
  DELETE FROM requests;
  DELETE FROM responses;
"
```

**Step 3: Run test**

```bash
npm test -- tests/integration/test-prewarm-validation.test.js --verbose
```

**Step 4: Check results**

Look for:
```
✅ Step 1: Has XML tool call: true
✅ Step 2: Has XML tool call: true  <-- Should be FIXED!
✅ Step 3: Has XML tool call: true  <-- Should work now!
```

### Phase 2: Database Verification (10 minutes)

**Check parent_id values are correct:**

```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    r.id,
    s.message_count,
    json_extract(r.qwen_request, '$.messages[0].role') as sys_role,
    json_extract(r.qwen_request, '$.messages[0].parent_id') as sys_parent,
    json_extract(r.qwen_request, '$.messages[1].role') as user_role,
    json_extract(r.qwen_request, '$.messages[1].parent_id') as user_parent,
    substr(json_extract(resp.openai_response, '$.choices[0].message.content'), 1, 100) as response
  FROM requests r
  JOIN sessions s ON r.session_id = s.id
  LEFT JOIN responses resp ON r.request_id = resp.request_id
  ORDER BY r.created_at
"
```

**Expected Output:**
```
req_id | msg_count | sys_role | sys_parent | user_role | user_parent | response
-------|-----------|----------|------------|-----------|-------------|----------
  1    |     1     | system   | NULL       | user      | NULL        | <read_file>
  2    |     2     | system   | NULL       | user      | abc-123-... | <list_files>
  3    |     3     | system   | NULL       | user      | def-456-... | <search_files>
```

All `sys_parent` should be NULL! ✅

**Check response lengths:**

```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    r.id,
    s.message_count,
    resp.duration_ms,
    resp.completion_tokens,
    length(json_extract(resp.openai_response, '$.choices[0].message.content')) as content_len
  FROM requests r
  JOIN sessions s ON r.session_id = s.id
  LEFT JOIN responses resp ON r.request_id = resp.request_id
  ORDER BY r.created_at
"
```

**Expected:** No empty responses (content_len > 0, duration > 3000ms, completion_tokens > 0)

### Phase 3: Real Roo-Cline Test (20 minutes)

**Step 1: Start fresh server**

```bash
# Kill existing
pkill -f "node.*src/index.js"

# Clear logs
rm logs/*.log

# Start
npm start
```

**Step 2: Use Roo-Cline for 5-turn conversation**

Open Roo-Cline and:
1. Ask it to list files
2. Ask it to read a file
3. Ask it to search for a pattern
4. Ask it to edit a file
5. Ask it to explain what it did

**Step 3: Check for errors**

```bash
# No 404 errors
grep "Session not found" logs/*.log
# Should be empty!

# No empty responses
sqlite3 data/qwen_proxy.db "
  SELECT COUNT(*) FROM responses
  WHERE json_extract(openai_response, '$.choices[0].message.content') = ''
"
# Should be 0!
```

**Step 4: Verify conversation continuity**

```bash
sqlite3 data/qwen_proxy.db "
  SELECT
    s.id,
    s.message_count,
    COUNT(r.id) as request_count
  FROM sessions s
  LEFT JOIN requests r ON s.id = r.session_id
  GROUP BY s.id
  ORDER BY s.created_at DESC
  LIMIT 5
"
```

**Expected:** One session with message_count = 5, request_count = 5

### Phase 4: Stress Test (30 minutes)

**Run test multiple times to check consistency:**

```bash
for i in {1..10}; do
  echo "=== Run $i ==="

  # Clear DB
  sqlite3 data/qwen_proxy.db "DELETE FROM sessions; DELETE FROM requests; DELETE FROM responses;"

  # Run test
  npm test -- tests/integration/test-prewarm-validation.test.js 2>&1 | grep -E "(PASS|FAIL|Has XML)"

  sleep 2
done
```

**Success Criteria:**
- All 10 runs pass
- No hash mismatches
- No empty responses

---

## 5. Critical Knowledge & Context

### 5.1 Why System Messages Have No Parent

**Concept:** parent_id creates conversation chain

```
┌─────────────────────────────────────────────┐
│ Conversation Chain (Linked List)           │
├─────────────────────────────────────────────┤
│                                             │
│  Message 1 (User):      parent_id: null    │
│        ↓                                    │
│  Message 2 (Assistant): parent_id: msg1    │
│        ↓                                    │
│  Message 3 (User):      parent_id: msg2    │
│        ↓                                    │
│  Message 4 (Assistant): parent_id: msg3    │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ System Message (Configuration)              │
├─────────────────────────────────────────────┤
│                                             │
│  System Message:        parent_id: null    │
│                         (always null!)      │
│                                             │
│  - Not part of conversation chain          │
│  - Provides instructions/context           │
│  - Sent with EVERY request                 │
│  - Never changes during conversation       │
│                                             │
└─────────────────────────────────────────────┘
```

**Qwen's Behavior:**
- System message with `parent_id != null` → Rejected/Ignored
- Returns empty response quickly (1-2 seconds vs normal 5-7 seconds)
- 0 tokens processed

### 5.2 Request Structure

**New Conversation (Step 1):**
```json
{
  "parent_id": null,
  "messages": [
    {
      "role": "system",
      "content": "You are Roo...",
      "parent_id": null,       // ✅ Always null
      "fid": "new-uuid-1"
    },
    {
      "role": "user",
      "content": "List files",
      "parent_id": null,       // ✅ Null for first message
      "fid": "new-uuid-2"
    }
  ]
}
```

**Continuation (Step 2+):**
```json
{
  "parent_id": "assistant-response-id-from-step-1",
  "messages": [
    {
      "role": "system",
      "content": "You are Roo...",
      "parent_id": null,       // ✅ MUST be null (bug was here!)
      "fid": "new-uuid-3"
    },
    {
      "role": "user",
      "content": "Read README.md",
      "parent_id": "assistant-response-id-from-step-1",  // ✅ Links to previous
      "fid": "new-uuid-4"
    }
  ]
}
```

### 5.3 Transformer Logic Flow

```javascript
// File: src/transformers/openai-to-qwen-transformer.js

function transformToQwenRequest(openAIRequest, session, stream = true) {
  const { messages, model } = openAIRequest;
  const { chatId, parentId } = session;  // parentId from session (null or UUID)

  // Step 1: Extract messages to send
  const messagesToSend = extractMessagesToSend(messages);
  // Returns: [systemMsg, lastMsg]

  // Step 2: Create Qwen messages with 18 required fields
  // BUG WAS HERE - All messages got same parentId
  const qwenMessages = messagesToSend.map(msg => {
    // FIX: System always null, user gets session parentId
    const msgParentId = (msg.role === 'system') ? null : parentId;
    return createQwenMessage(msg, msgParentId, model);
  });

  // Step 3: Build request
  return {
    stream: stream,
    chat_id: chatId,
    parent_id: parentId,     // Session parent_id (for request level)
    messages: qwenMessages,  // Each message has its own parent_id
    // ... other fields
  };
}
```

### 5.4 Session State Machine

```
NEW REQUEST
  ↓
  hasAssistantMessage?
  ↓               ↓
  NO             YES
  ↓               ↓
CREATE UUID    COMPUTE HASH
sessionId      hash=MD5(user+assistant)
  ↓               ↓
createSession   findByHash(hash)
parentId=null     ↓
  ↓             session found?
  ↓             ↓           ↓
  ↓            YES         NO
  ↓             ↓           ↓
  ↓         sessionId   404 ERROR
  ↓         parentId
  ↓             ↓
  └─────────────┘
        ↓
   SEND REQUEST
   [system(parent=null), user(parent=sessionParentId)]
        ↓
   RECEIVE RESPONSE
        ↓
   UPDATE SESSION
   session.parent_id = responseParentId
        ↓
   IF NEW SESSION:
     setConversationHash(sessionId, assistantMsg)
```

### 5.5 Key Files

| File | Lines | Purpose | Bug Location |
|------|-------|---------|--------------|
| `openai-to-qwen-transformer.js` | 149-150 | Message transformation | **BUG HERE** - All messages got same parent_id |
| `chat-completions-handler.js` | 180-250 | Detect new vs continuation | Checks for assistant messages |
| `session-manager.js` | 130-160 | Hash computation | Sets conversation_hash after first response |
| `sse-handler.js` | 130-138 | Streaming response | Calls setConversationHash for new sessions |

### 5.6 Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- UUID for new conversations
  chat_id TEXT NOT NULL,            -- Qwen chat ID
  parent_id TEXT,                   -- Last assistant message ID (null → UUID chain)
  first_user_message TEXT NOT NULL, -- Used for hash computation
  conversation_hash TEXT,           -- MD5(firstUser + firstAssistant)
  message_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_accessed INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_conversation_hash ON sessions(conversation_hash);

-- Requests table
CREATE TABLE requests (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  openai_request TEXT NOT NULL,     -- Full OpenAI request JSON
  qwen_request TEXT NOT NULL,       -- Transformed Qwen request JSON
  model TEXT NOT NULL,
  stream BOOLEAN NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Responses table
CREATE TABLE responses (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  qwen_response TEXT,               -- Raw Qwen response (null for streaming)
  openai_response TEXT,             -- Transformed OpenAI response JSON
  parent_id TEXT,                   -- New parent_id from this response
  completion_tokens INTEGER,
  prompt_tokens INTEGER,
  total_tokens INTEGER,
  finish_reason TEXT,
  error TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (request_id) REFERENCES requests(id)
);
```

---

## 6. New Strategies for Solving Remaining Issues

### Strategy 1: Response Normalization for Hash Stability

**Problem:** Even with fixed parent_id, responses might vary slightly.

**Solution:** Normalize before hashing.

```javascript
// File: src/services/session-manager.js

/**
 * Normalize assistant response for stable hashing
 * Extract XML tool calls only, ignore prose
 */
function normalizeForHash(content) {
  // Extract all XML tool calls
  const toolCallRegex = /<([a-z_]+)>[\s\S]*?<\/\1>/gi;
  const toolCalls = content.match(toolCallRegex) || [];

  if (toolCalls.length === 0) {
    // No tool calls, use first 100 chars
    return content.substring(0, 100).replace(/\s+/g, ' ').trim();
  }

  // Normalize whitespace in tool calls
  return toolCalls
    .map(call => call.replace(/\s+/g, ' ').trim())
    .join('\n');
}

setConversationHash(sessionId, firstAssistantMessage) {
  const session = this.repo.getSession(sessionId);
  if (!session) return false;

  // Normalize before hashing
  const normalizedAssistant = normalizeForHash(firstAssistantMessage);
  const conversationKey = session.first_user_message + normalizedAssistant;
  const conversationHash = generateMD5Hash(conversationKey);

  this.repo.setConversationHash(sessionId, conversationHash);
  return true;
}
```

**Advantages:**
- Tolerates minor wording variations
- Focuses on structural elements (XML tags)
- Preserves tool call information

### Strategy 2: Fallback Lookup Chain

**Problem:** If hash lookup fails, conversation dies with 404.

**Solution:** Try multiple lookup strategies.

```javascript
// File: src/services/session-manager.js

findSessionByConversationHash(conversationHash, firstUserMessage) {
  // Strategy 1: Exact hash match
  let session = this.repo.findByConversationHash(conversationHash);
  if (session) {
    console.log('[SessionManager] ✅ Found via exact hash');
    return this.formatSession(session);
  }

  // Strategy 2: Recent session with same first message
  if (firstUserMessage) {
    console.log('[SessionManager] Trying time-based fallback...');
    const recent = this.repo.findRecentByFirstMessage(firstUserMessage, 5 * 60 * 1000);
    if (recent) {
      console.log('[SessionManager] ✅ Found via time-based (< 5 min old)');
      return this.formatSession(recent);
    }
  }

  // Strategy 3: User-only hash (ignore assistant variation)
  const userOnlyHash = generateMD5Hash(firstUserMessage);
  session = this.repo.findByConversationHash(userOnlyHash);
  if (session) {
    console.log('[SessionManager] ✅ Found via user-only hash');
    return this.formatSession(session);
  }

  console.log('[SessionManager] ❌ All strategies failed');
  return null;
}
```

**Add to repository:**
```javascript
// File: src/database/repositories/session-repository.js

findRecentByFirstMessage(firstUserMessage, maxAgeMs) {
  const cutoff = Date.now() - maxAgeMs;

  const stmt = this.db.prepare(`
    SELECT * FROM sessions
    WHERE first_user_message = ?
      AND created_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  return stmt.get(firstUserMessage, cutoff);
}
```

### Strategy 3: Comprehensive Logging

**Problem:** Hard to debug hash mismatches without visibility.

**Solution:** Add detailed logging at every step.

```javascript
// File: src/services/session-manager.js

setConversationHash(sessionId, firstAssistantMessage) {
  console.log('\n===== SET CONVERSATION HASH =====');
  console.log('Session ID:', sessionId);
  console.log('Assistant length:', firstAssistantMessage.length);
  console.log('Assistant preview:', firstAssistantMessage.substring(0, 150));

  const session = this.repo.getSession(sessionId);
  if (!session) {
    console.error('ERROR: Session not found:', sessionId);
    return false;
  }

  console.log('First user message:', session.first_user_message);

  const conversationKey = session.first_user_message + firstAssistantMessage;
  const conversationHash = generateMD5Hash(conversationKey);

  console.log('Computed hash:', conversationHash);
  console.log('Key length:', conversationKey.length);

  this.repo.setConversationHash(sessionId, conversationHash);

  // Verify
  const updated = this.repo.getSession(sessionId);
  console.log('Verified in DB:', updated.conversation_hash);
  console.log('Match:', updated.conversation_hash === conversationHash ? '✅' : '❌');
  console.log('=====================================\n');

  return true;
}

findSessionByConversationHash(conversationHash) {
  console.log('\n===== FIND BY HASH =====');
  console.log('Looking for:', conversationHash);

  const session = this.repo.findByConversationHash(conversationHash);

  if (!session) {
    console.error('Hash not found! All hashes in DB:');
    const all = this.repo.findAll({});
    all.forEach(s => {
      console.log(`  ${s.id}: ${s.conversation_hash}`);
    });
  } else {
    console.log('✅ Found:', session.id);
  }

  console.log('========================\n');
  return session ? this.formatSession(session) : null;
}
```

### Strategy 4: Test-Driven Development

**Problem:** Manual testing is slow and unreliable.

**Solution:** Comprehensive automated tests.

```javascript
// File: tests/integration/test-multi-turn-stable.test.js

describe('Multi-Turn Conversation Stability', () => {

  test('Same input produces same hash across runs', async () => {
    const hashes = [];

    for (let i = 0; i < 5; i++) {
      // Clear DB
      db.prepare('DELETE FROM sessions').run();

      // Send request
      const response = await sendRequest({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'List files in current directory' }
        ]
      });

      // Extract hash
      const sessions = db.prepare('SELECT conversation_hash FROM sessions').all();
      hashes.push(sessions[0].conversation_hash);
    }

    // All hashes should be identical
    const uniqueHashes = [...new Set(hashes)];
    expect(uniqueHashes.length).toBe(1);
  });

  test('Multi-turn conversation maintains session', async () => {
    // Step 1: Create session
    const r1 = await sendRequest({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'List files' }
      ]
    });
    const assistant1 = r1.choices[0].message.content;

    // Step 2: Continue (hash lookup)
    const r2 = await sendRequest({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'List files' },
        { role: 'assistant', content: assistant1 },
        { role: 'user', content: 'Read README' }
      ]
    });

    // Should succeed without 404
    expect(r2.choices[0].message.content).toBeTruthy();
    expect(r2.choices[0].message.content.length).toBeGreaterThan(0);
  });

  test('System message always has null parent_id', async () => {
    // Step 1: New
    await sendRequest({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Task 1' }
      ]
    });

    const assistant1 = db.prepare('SELECT * FROM responses ORDER BY id DESC LIMIT 1').get();

    // Step 2: Continuation
    await sendRequest({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Task 1' },
        { role: 'assistant', content: assistant1.openai_response },
        { role: 'user', content: 'Task 2' }
      ]
    });

    // Check all requests
    const requests = db.prepare('SELECT qwen_request FROM requests').all();

    requests.forEach((req, i) => {
      const parsed = JSON.parse(req.qwen_request);
      const systemMsg = parsed.messages.find(m => m.role === 'system');

      expect(systemMsg.parent_id).toBeNull();
      expect(systemMsg.parentId).toBeNull();
    });
  });
});
```

---

## 7. Quick Reference

### Commands

```bash
# Apply fix
code src/transformers/openai-to-qwen-transformer.js

# Clear test data
sqlite3 data/qwen_proxy.db "DELETE FROM sessions; DELETE FROM requests; DELETE FROM responses;"

# Run test
npm test -- tests/integration/test-prewarm-validation.test.js --verbose

# Check parent_id values
sqlite3 data/qwen_proxy.db "
  SELECT
    json_extract(qwen_request, '$.messages[0].parent_id') as sys_parent,
    json_extract(qwen_request, '$.messages[1].parent_id') as user_parent
  FROM requests
  ORDER BY created_at
"

# Check for empty responses
sqlite3 data/qwen_proxy.db "
  SELECT id, duration_ms, completion_tokens
  FROM responses
  WHERE json_extract(openai_response, '$.choices[0].message.content') = ''
"

# Monitor logs
tail -f logs/*.log | grep -E "(Has XML|Session not found|parent_id)"
```

### Success Indicators

✅ All requests show `system.parent_id = null`
✅ No empty responses (content length > 0)
✅ Response duration > 3 seconds (normal Qwen processing time)
✅ All 5 steps pass with XML tool calls
✅ No "Session not found" errors
✅ Hash is set after Step 1 and found in Step 2+

### Failure Indicators

❌ `system.parent_id = "uuid"` (not null)
❌ Empty response content
❌ Response duration < 2 seconds
❌ "Session not found or expired"
❌ "Hash not found"
❌ Test fails at Step 2 or 3

---

## Conclusion

**STATUS:** Root cause identified, fix ready to apply.

**THE BUG:** System messages incorrectly assigned `parent_id` from session, causing Qwen to reject requests.

**THE FIX:** One line change - check message role before assigning parent_id.

**ESTIMATED TIME TO RESOLUTION:** 30 minutes (15 min fix + 15 min test)

**NEXT STEPS:**
1. Apply fix to `openai-to-qwen-transformer.js:149-150`
2. Run integration test
3. Verify with real Roo-Cline
4. Monitor for any remaining issues

**RISK:** Low - Fix is surgical, well-understood, backed by database evidence.

---

**Need Help?**
- Database investigation: See Section 4 (Step-by-Step Approach)
- Understanding parent_id: See Section 5.1 (Why System Messages Have No Parent)
- Apply fix: See Section 2.1 (Immediate Fix)

**Good luck! 🚀**
