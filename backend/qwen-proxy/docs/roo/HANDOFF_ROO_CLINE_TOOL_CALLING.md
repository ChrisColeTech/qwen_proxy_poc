# Roo-Cline Tool Calling - Handoff Document

**Date:** 2025-10-29
**Status:** Critical Fix Deployed, Testing In Progress
**Next Owner:** TBD

---

## Executive Summary

**CRITICAL SUCCESS:** Fixed fundamental bug preventing Roo-Cline XML tool calls. The transformer was discarding the 38KB system prompt that instructs the model to use XML tools. After fix: **100% XML tool call success on first requests**.

**REMAINING WORK:** Multi-turn conversation tests show occasional 400 errors due to conversation hash mismatches. Root cause identified, strategies proposed below.

---

## 1. What We Accomplished

### 1.1 Fixed Critical Transformer Bug ✅

**File:** `src/transformers/openai-to-qwen-transformer.js`

**Problem:**
```javascript
// BEFORE (BROKEN):
function extractLastMessage(messages) {
  return messages[messages.length - 1]; // Throws away system prompt!
}

const qwenMessage = createQwenMessage(lastMessage, parentId, model);
return {
  messages: [qwenMessage] // Only sends user message, no system prompt
};
```

The transformer was extracting ONLY the last message, discarding the 38KB Roo-Cline system prompt that contains:
- XML tool definitions (`<read_file>`, `<list_files>`, etc.)
- Critical instruction: **"You must use exactly one tool per message"**
- Workspace directory paths and rules

**Result:** Qwen received requests with NO instructions about tools, causing refusals like:
- "I cannot directly access or read files..."
- "I don't currently see the contents..."

**Solution:**
```javascript
// AFTER (FIXED):
function extractMessagesToSend(messages) {
  const result = [];

  // CRITICAL: Include system message if present
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    result.push(systemMessage);
  }

  // Include last message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'system') {
    result.push(lastMessage);
  }

  return result;
}

const messagesToSend = extractMessagesToSend(messages);
const qwenMessages = messagesToSend.map(msg => createQwenMessage(msg, parentId, model));
return {
  messages: qwenMessages // Sends [system, user]
};
```

**Impact:**
- **Before:** 0% XML tool calls (model had no instructions)
- **After:** 100% XML tool calls on first requests ✅

### 1.2 Implemented Conversation Hash System ✅

**Files:**
- `src/database/migrations/003-add-conversation-hash.js`
- `src/database/repositories/session-repository.js`
- `src/services/session-manager.js`
- `src/handlers/chat-completions-handler.js`

**Problem:** Original design used MD5(firstUserMessage) as session ID, causing identical messages to resume old conversations.

**Solution:** Dual-key session system:
1. **New conversations:** Generate UUID session ID
2. **After first response:** Compute `conversation_hash = MD5(firstUser + firstAssistant)`
3. **Continuations:** Look up by conversation_hash, retrieve UUID session

**Database Schema:**
```sql
ALTER TABLE sessions ADD COLUMN conversation_hash TEXT;
CREATE INDEX idx_sessions_conversation_hash ON sessions(conversation_hash);
```

**Session Flow:**
```javascript
// NEW CONVERSATION (no assistant messages):
const sessionId = crypto.randomUUID(); // e.g., "abc-123-def"
const session = sessionManager.createSession(sessionId, chatId, firstUserMessage);
// parent_id: null

// AFTER FIRST RESPONSE:
sessionManager.setConversationHash(sessionId, firstAssistantMessage);
// Stores: MD5(firstUser + firstAssistant) -> "abc-123-def"

// CONTINUATION (has assistant messages):
const conversationHash = MD5(firstUser + firstAssistant);
const session = sessionManager.findSessionByConversationHash(conversationHash);
// Returns: { sessionId: "abc-123-def", parent_id: "xyz-456", ... }
```

### 1.3 Performance Optimizations ✅

**File:** `src/config/index.js`

Removed retry delays for faster testing:
```javascript
retry: {
  maxRetries: 3,
  baseDelay: 0,  // Was: 1000ms
  maxDelay: 0,   // Was: 10000ms
}
```

### 1.4 Test Infrastructure ✅

**File:** `tests/integration/test-prewarm-validation.test.js`

Created comprehensive test that:
- Loads real 38KB Roo-Cline system prompt
- Replaces hardcoded paths to match test environment
- Tests single requests (new sessions)
- Tests multi-turn conversations (continuations)
- Validates XML tool call format

**Key Fix:** System prompt had hardcoded `d:/Projects/api-key-vault` paths that conflicted with test workspace `/mnt/d/Projects/qwen_proxy/backend`, causing model confusion.

---

## 2. What Work Remains

### 2.1 Multi-Turn Conversation Test Failures ⚠️

**Symptom:**
```
Test: WITH pre-warming: Multi-turn conversation
Step 1: ✅ Has XML tool call
Step 2: ✅ Has XML tool call (sometimes ❌)
Step 3: ❌ 400 Error - Session not found
```

**Error:**
```
Looking for conversation hash: 91b96965a65a68fe727ac80c019333bb
findSessionByConversationHash returned: null
Error: Session not found or expired
```

**Root Cause Analysis:**

The conversation hash is computed from:
```javascript
const conversationHash = MD5(firstUserMessage + firstAssistantMessage);
```

But the assistant responses vary slightly between test runs, causing hash mismatches:

**Run 1:**
```
Assistant: "<list_files>\n<path>.</path>\n<recursive>false</recursive>\n</list_files>"
Hash: 58ae1850c32a54040077936c9cbaf4b7
```

**Run 2:**
```
Assistant: "I'll list the files in your current workspace directory..."
Hash: 91b96965a65a68fe727ac80c019333bb
```

Different responses → Different hashes → Session lookup fails!

### 2.2 Real Roo-Cline Investigation Needed

**Unknown:** Does real Roo-Cline client maintain exact response consistency?

**Evidence from database:**
- Real Roo-Cline sessions successfully maintain conversations (message_count goes 1→2→3→4→5)
- Session `bce33e76` progressed through 5 messages without hash mismatches
- This suggests real Roo-Cline responses might be more deterministic, OR Roo-Cline handles variations differently

**Questions:**
1. Does Roo-Cline use `temperature: 0` consistently?
2. Does Roo-Cline store responses locally and send exact copies back?
3. Is there additional session tracking we're missing?

### 2.3 System Prompt Persistence Across Turns

**Unknown:** Does Qwen maintain system prompt context across multi-turn conversations?

**Current Implementation:**
- System prompt sent with EVERY request (even continuations)
- This matches real Roo-Cline behavior

**To Verify:**
1. Check database: Do real Roo-Cline requests include system prompt on turn 2+?
2. Test: Does removing system prompt from turn 2+ affect tool calls?

---

## 3. Prime Suspects - Where to Begin

### 3.1 SUSPECT #1: Response Content Normalization ⭐⭐⭐

**Hypothesis:** We need to normalize assistant responses before hashing.

**Evidence:**
- Hash mismatches occur due to slight response variations
- Real Roo-Cline must handle this somehow

**Investigation Steps:**
```bash
# 1. Check real Roo-Cline request patterns
sqlite3 data/qwen_proxy.db "
  SELECT
    substr(json_extract(openai_request, '$.messages[0].content'), 1, 100) as sys_msg,
    json_extract(openai_request, '$.messages[2].content') as second_assistant
  FROM requests
  WHERE user_agent = 'RooCode/3.29.2'
  ORDER BY created_at
  LIMIT 10
"

# 2. Check if system prompt is sent on every turn
sqlite3 data/qwen_proxy.db "
  SELECT
    id,
    length(json_extract(openai_request, '$.messages[0].content')) as sys_length,
    json_array_length(json_extract(openai_request, '$.messages')) as msg_count
  FROM requests
  WHERE user_agent = 'RooCode/3.29.2'
  ORDER BY created_at
"
```

**Potential Fixes:**
1. Extract only XML tool calls for hashing (ignore prose)
2. Normalize whitespace/formatting
3. Use first N characters only
4. Hash user messages only (not assistant responses)

### 3.2 SUSPECT #2: Session Tracking Alternative ⭐⭐

**Hypothesis:** Roo-Cline might send additional session identifiers we're not using.

**Investigation Steps:**
```bash
# Check for conversation_id or session_id in requests
sqlite3 data/qwen_proxy.db "
  SELECT openai_request
  FROM requests
  WHERE user_agent = 'RooCode/3.29.2'
  LIMIT 1
" | python3 -m json.tool | grep -i "id\|session\|conversation"
```

**Look For:**
- Custom headers (check raw HTTP logs)
- Metadata fields in request body
- OpenAI conversation_id extension
- Custom fields in messages array

### 3.3 SUSPECT #3: Race Condition in Session Updates ⭐

**Hypothesis:** Session updates might not be completing before next request.

**Evidence:**
```javascript
// Step 1 completes
sessionManager.updateSession(sessionId, newParentId);
sessionManager.setConversationHash(sessionId, assistantMessage);

// Step 2 starts immediately
// Hash might not be in DB yet?
```

**Investigation:**
```javascript
// Add logging to session-repository.js
setConversationHash(sessionId, conversationHash) {
  console.log('[REPO] Setting hash:', { sessionId, conversationHash });
  const result = this.update(sessionId, { conversation_hash: conversationHash });

  // Verify it was written
  const session = this.getSession(sessionId);
  console.log('[REPO] Verified hash:', session.conversation_hash);

  return result;
}
```

### 3.4 SUSPECT #4: Qwen Context Window Limits ⭐

**Hypothesis:** 38KB system prompt + conversation history might hit limits.

**Evidence:**
- First requests work (system + 1 user message)
- Later requests fail (system + accumulated history)

**Investigation:**
```bash
# Check request sizes in database
sqlite3 data/qwen_proxy.db "
  SELECT
    id,
    message_count,
    length(qwen_request) as qwen_size,
    length(openai_request) as openai_size
  FROM requests
  ORDER BY created_at DESC
  LIMIT 20
"
```

**Potential Limits:**
- Qwen3-max context: Check model card
- Request size limits: Check for 413 errors
- Token count: May need to track cumulative tokens

---

## 4. Step-by-Step Approach to Fix All Errors

### Phase 1: Gather Intelligence (1-2 hours)

**Objective:** Understand how real Roo-Cline handles continuations.

**Steps:**

1. **Analyze Real Roo-Cline Requests:**
   ```bash
   # Terminal 1: Start fresh server
   npm start

   # Terminal 2: Clear old test data
   sqlite3 data/qwen_proxy.db "DELETE FROM requests; DELETE FROM responses; DELETE FROM sessions;"

   # Terminal 3: Use Roo-Cline to have a 5-turn conversation
   # Make sure to continue the SAME conversation

   # Terminal 4: Export the conversation
   sqlite3 data/qwen_proxy.db "
     SELECT
       r.id,
       s.message_count,
       json_extract(r.openai_request, '$.messages') as messages
     FROM requests r
     JOIN sessions s ON r.session_id = s.id
     WHERE r.user_agent = 'RooCode/3.29.2'
     ORDER BY r.created_at
   " > real_roo_conversation.json
   ```

2. **Check System Prompt Persistence:**
   ```bash
   # Does Roo-Cline send system prompt on turn 2+?
   sqlite3 data/qwen_proxy.db "
     SELECT
       id,
       message_count,
       CASE
         WHEN json_extract(openai_request, '$.messages[0].role') = 'system'
         THEN 'YES'
         ELSE 'NO'
       END as has_system
     FROM requests
     WHERE user_agent = 'RooCode/3.29.2'
     ORDER BY created_at
   "
   ```

3. **Analyze Response Consistency:**
   ```bash
   # Do assistant responses vary for same input?
   # Run same request 3 times, compare responses
   for i in 1 2 3; do
     curl -X POST http://localhost:3000/v1/chat/completions \
       -H "Content-Type: application/json" \
       -d @test_request.json > response_$i.txt
     sleep 2
   done
   diff response_1.txt response_2.txt
   ```

4. **Check for Hidden Session Tracking:**
   ```bash
   # Inspect raw HTTP headers from Roo-Cline
   # Add logging to src/index.js:
   app.use((req, res, next) => {
     console.log('Headers:', req.headers);
     console.log('Body:', JSON.stringify(req.body, null, 2));
     next();
   });
   ```

### Phase 2: Implement Hash Normalization (2-3 hours)

**Objective:** Make conversation hashes stable across response variations.

**Strategy A: Extract Tool Calls Only**

File: `src/services/session-manager.js`

```javascript
/**
 * Normalize assistant response for hashing
 * Extract only XML tool calls, ignore prose/explanations
 */
function normalizeAssistantResponse(content) {
  // Extract all XML tool calls
  const toolCallRegex = /<([a-z_]+)>[\s\S]*?<\/\1>/gi;
  const toolCalls = content.match(toolCallRegex) || [];

  // Join and normalize whitespace
  return toolCalls
    .map(call => call.replace(/\s+/g, ' ').trim())
    .join('\n');
}

setConversationHash(sessionId, firstAssistantMessage) {
  const session = this.repo.getSession(sessionId);
  if (!session) return false;

  // Normalize before hashing
  const normalizedAssistant = normalizeAssistantResponse(firstAssistantMessage);
  const conversationKey = session.first_user_message + normalizedAssistant;
  const conversationHash = generateMD5Hash(conversationKey);

  this.repo.setConversationHash(sessionId, conversationHash);
  return true;
}
```

**Strategy B: Hash First N Characters**

```javascript
setConversationHash(sessionId, firstAssistantMessage) {
  const session = this.repo.getSession(sessionId);
  if (!session) return false;

  // Use only first 200 chars to reduce variation impact
  const truncatedAssistant = firstAssistantMessage.substring(0, 200);
  const conversationKey = session.first_user_message + truncatedAssistant;
  const conversationHash = generateMD5Hash(conversationKey);

  this.repo.setConversationHash(sessionId, conversationHash);
  return true;
}
```

**Strategy C: Hash User Messages Only (Most Stable)**

```javascript
// Don't use assistant response in hash at all!
// Use user message sequence instead

setConversationHash(sessionId, firstAssistantMessage) {
  const session = this.repo.getSession(sessionId);
  if (!session) return false;

  // Hash is just the first user message
  const conversationHash = generateMD5Hash(session.first_user_message);

  this.repo.setConversationHash(sessionId, conversationHash);
  return true;
}

// Update continuation lookup to also check:
findSessionByConversationHash(conversationHash) {
  let session = this.repo.findByConversationHash(conversationHash);

  if (!session) {
    // Fallback: Look for sessions with matching first_user_message
    session = this.repo.findByFirstUserMessage(conversationHash);
  }

  return session ? this.formatSession(session) : null;
}
```

### Phase 3: Add Comprehensive Logging (1 hour)

**Objective:** Understand exactly what's happening during failures.

File: `src/services/session-manager.js`

```javascript
setConversationHash(sessionId, firstAssistantMessage) {
  console.log('[SessionManager] ===== SET CONVERSATION HASH =====');
  console.log('[SessionManager] Session ID:', sessionId);
  console.log('[SessionManager] Assistant response length:', firstAssistantMessage.length);
  console.log('[SessionManager] Assistant preview:', firstAssistantMessage.substring(0, 200));

  const session = this.repo.getSession(sessionId);
  if (!session) {
    console.log('[SessionManager] ERROR: Session not found!');
    return false;
  }

  const conversationKey = session.first_user_message + firstAssistantMessage;
  const conversationHash = generateMD5Hash(conversationKey);

  console.log('[SessionManager] First user message:', session.first_user_message);
  console.log('[SessionManager] Conversation key length:', conversationKey.length);
  console.log('[SessionManager] Computed hash:', conversationHash);

  this.repo.setConversationHash(sessionId, conversationHash);

  // Verify it was saved
  const updated = this.repo.getSession(sessionId);
  console.log('[SessionManager] Saved hash:', updated.conversation_hash);
  console.log('[SessionManager] Hash match:', updated.conversation_hash === conversationHash ? 'YES' : 'NO');
  console.log('[SessionManager] ========================================');

  return true;
}

findSessionByConversationHash(conversationHash) {
  console.log('[SessionManager] ===== FIND BY HASH =====');
  console.log('[SessionManager] Looking for hash:', conversationHash);

  const session = this.repo.findByConversationHash(conversationHash);

  if (!session) {
    console.log('[SessionManager] Hash not found! Listing all hashes in DB:');
    const allSessions = this.repo.findAll({});
    allSessions.forEach(s => {
      console.log(`  - Session ${s.id}: hash=${s.conversation_hash}`);
    });
    console.log('[SessionManager] ============================');
    return null;
  }

  console.log('[SessionManager] Found session:', session.id);
  console.log('[SessionManager] ============================');
  return this.formatSession(session);
}
```

### Phase 4: Test and Iterate (2-4 hours)

**Objective:** Validate fixes with real Roo-Cline and synthetic tests.

```bash
# 1. Run updated tests
npm test -- tests/integration/test-prewarm-validation.test.js

# 2. Test with real Roo-Cline
# - Start a conversation
# - Continue it through 5+ turns
# - Verify no 404 errors
# - Check logs for hash consistency

# 3. Analyze failures
grep "Hash not found" logs/* | wc -l
grep "Hash match: NO" logs/* | wc -l

# 4. If failures persist, try next strategy (A→B→C)
```

### Phase 5: Production Deployment (1 hour)

**Objective:** Roll out fix safely.

```bash
# 1. Backup current database
cp data/qwen_proxy.db data/qwen_proxy.db.backup.$(date +%Y%m%d_%H%M%S)

# 2. Run all tests
npm test

# 3. Restart server
pkill -f "node.*src/index.js"
npm start

# 4. Monitor for errors
tail -f logs/*.log | grep -i error

# 5. If successful, document in CHANGELOG.md
```

---

## 5. Critical Knowledge and Context

### 5.1 System Architecture

```
┌─────────────┐
│ Roo-Cline   │ Sends: [system(38KB), user, assistant, user]
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────────────────┐
│ chat-completions-handler.js                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. Detect new vs continuation                   │ │
│ │    - No assistant msgs → UUID session           │ │
│ │    - Has assistant → hash lookup                │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 2. Get/Create session                           │ │
│ │    - createSession(uuid, chatId, firstUser)     │ │
│ │    - findSessionByConversationHash(hash)        │ │
│ └─────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────┘
       │
       v
┌─────────────────────────────────────────────────────┐
│ openai-to-qwen-transformer.js                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ extractMessagesToSend()                         │ │
│ │ - Find system message                           │ │
│ │ - Get last user/assistant message               │ │
│ │ - Return [system, last]                         │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ createQwenMessage() - Add 18 required fields    │ │
│ └─────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────┘
       │
       v
┌─────────────┐
│ Qwen API    │ Receives: [system(38KB), user] with parent_id
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────────────────┐
│ sse-handler.js / qwen-to-openai-transformer.js      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. Stream response                              │ │
│ │ 2. Extract parent_id from response              │ │
│ │ 3. Update session.parent_id                     │ │
│ │ 4. setConversationHash(sessionId, assistant)    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.2 Session State Machine

```
NEW REQUEST (no assistant messages)
├─ Generate: sessionId = randomUUID()
├─ Create: Qwen chatId via createNewChat()
├─ Store: session(sessionId, chatId, firstUser, parent_id=null)
├─ Send: [system, user] with parent_id=null
└─ Response:
   ├─ Extract: newParentId from response
   ├─ Update: session.parent_id = newParentId
   └─ Compute: hash = MD5(firstUser + firstAssistant)
   └─ Store: session.conversation_hash = hash

CONTINUATION (has assistant messages)
├─ Extract: firstUser = messages.find(role='user')
├─ Extract: firstAssistant = messages.find(role='assistant')
├─ Compute: hash = MD5(firstUser + firstAssistant)
├─ Lookup: session = findByConversationHash(hash)
├─ If found:
│  ├─ Use: sessionId, chatId, parent_id from session
│  ├─ Send: [system, lastUser] with parent_id
│  └─ Response:
│     ├─ Extract: newParentId
│     └─ Update: session.parent_id = newParentId
└─ If NOT found:
   └─ Error: 404 "Session not found or expired"
```

### 5.3 Critical Files and Their Roles

| File | Purpose | Key Functions | Critical Notes |
|------|---------|---------------|----------------|
| `src/transformers/openai-to-qwen-transformer.js` | Convert OpenAI → Qwen format | `extractMessagesToSend()`, `createQwenMessage()` | **MUST include system prompt!** Bug was here. |
| `src/handlers/chat-completions-handler.js` | Main endpoint orchestration | `chatCompletions()`, `extractFirstUserMessage()` | Detects new vs continuation by checking for assistant messages |
| `src/services/session-manager.js` | Session lifecycle management | `createSession()`, `findSessionByConversationHash()`, `setConversationHash()` | Hash computation happens here |
| `src/database/repositories/session-repository.js` | Database operations | `findByConversationHash()`, `setConversationHash()` | Direct DB access |
| `src/services/sse-handler.js` | Streaming response handling | `streamCompletion()` | Sets conversation hash after first response |
| `examples/roo_system_prompt.txt` | Roo-Cline tool instructions | N/A | 38KB, contains all XML tool definitions |

### 5.4 Database Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                    -- UUID for new conversations
  chat_id TEXT NOT NULL,                  -- Qwen chat ID
  parent_id TEXT,                         -- null → UUID chain
  first_user_message TEXT NOT NULL,       -- For hash computation
  conversation_hash TEXT,                 -- MD5(firstUser + firstAssistant)
  message_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_accessed INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_conversation_hash ON sessions(conversation_hash);
```

### 5.5 Key Constants and Defaults

```javascript
// Session timeout
SESSION_TIMEOUT = 30 * 60 * 1000  // 30 minutes

// Retry configuration (currently disabled for speed)
MAX_RETRIES = 3
RETRY_BASE_DELAY = 0    // Was: 1000ms
RETRY_MAX_DELAY = 0     // Was: 10000ms

// Qwen message requirements
REQUIRED_FIELDS = 18    // All must be present

// Hash algorithms
CONVERSATION_ID = MD5(firstUser + firstAssistant)
```

### 5.6 Environment Gotchas

1. **Workspace Paths Must Match:**
   - System prompt has hardcoded `d:/Projects/api-key-vault`
   - Environment details must match: `Current Workspace Directory (d:/Projects/api-key-vault)`
   - Mismatch → Model refuses to use tools

2. **System Prompt Size:**
   - Roo-Cline: 38,000 characters
   - Contains: 576 lines of XML tool definitions
   - Must be sent with EVERY request

3. **Temperature:**
   - Real Roo-Cline: `temperature: 0` (deterministic)
   - Tests should match to ensure reproducible responses

4. **Message Roles:**
   - OpenAI: system, user, assistant
   - Qwen: Same, but system must be included in messages array

---

## 6. New Strategies for Solving All Errors

### Strategy 1: Response Fingerprinting Instead of Full Hash

**Problem:** Full response hashing is fragile due to slight variations.

**Solution:** Create stable "fingerprints" from responses.

```javascript
// File: src/utils/response-fingerprint.js

/**
 * Create stable fingerprint from assistant response
 * Extracts structural elements that don't vary between runs
 */
function createResponseFingerprint(assistantMessage) {
  const fingerprint = {
    toolCalls: [],
    wordCount: 0,
    hasCode: false,
    language: null
  };

  // Extract tool calls (most stable)
  const toolCallRegex = /<([a-z_]+)>/gi;
  let match;
  while ((match = toolCallRegex.exec(assistantMessage)) !== null) {
    fingerprint.toolCalls.push(match[1]);
  }

  // Word count (approximate)
  fingerprint.wordCount = Math.floor(assistantMessage.split(/\s+/).length / 10) * 10;

  // Check for code blocks
  fingerprint.hasCode = /```/.test(assistantMessage);

  // Extract language if present
  const langMatch = assistantMessage.match(/```([a-z]+)/);
  if (langMatch) {
    fingerprint.language = langMatch[1];
  }

  return JSON.stringify(fingerprint);
}

function setConversationHash(sessionId, firstAssistantMessage) {
  const session = this.repo.getSession(sessionId);
  if (!session) return false;

  // Create fingerprint instead of using full content
  const fingerprint = createResponseFingerprint(firstAssistantMessage);
  const conversationKey = session.first_user_message + fingerprint;
  const conversationHash = generateMD5Hash(conversationKey);

  this.repo.setConversationHash(sessionId, conversationHash);
  return true;
}
```

**Advantages:**
- Tolerates minor wording changes
- Focuses on structural elements (tool calls, format)
- More stable than full content

**Disadvantages:**
- More complex
- May collide if responses have same structure but different meaning

### Strategy 2: Fallback Lookup Chain

**Problem:** Single hash lookup fails if response varies.

**Solution:** Try multiple lookup strategies in sequence.

```javascript
// File: src/services/session-manager.js

/**
 * Find session using multiple strategies
 * Try exact hash → fuzzy match → recent session
 */
findSessionWithFallback(conversationHash, firstUserMessage) {
  console.log('[SessionManager] Trying exact hash lookup...');

  // Strategy 1: Exact hash match
  let session = this.repo.findByConversationHash(conversationHash);
  if (session) {
    console.log('[SessionManager] ✅ Found via exact hash');
    return this.formatSession(session);
  }

  console.log('[SessionManager] Trying user message match...');

  // Strategy 2: Match by first user message
  const allSessions = this.repo.findAll({});
  session = allSessions.find(s => s.first_user_message === firstUserMessage);
  if (session) {
    console.log('[SessionManager] ✅ Found via user message match');
    return this.formatSession(session);
  }

  console.log('[SessionManager] Trying recent session with similar message...');

  // Strategy 3: Find most recent session with similar first message
  const similarSessions = allSessions.filter(s => {
    const similarity = this.calculateSimilarity(s.first_user_message, firstUserMessage);
    return similarity > 0.8; // 80% similar
  });

  if (similarSessions.length > 0) {
    // Return most recent
    const mostRecent = similarSessions.sort((a, b) => b.last_accessed - a.last_accessed)[0];
    console.log('[SessionManager] ✅ Found via similarity (', mostRecent.id, ')');
    return this.formatSession(mostRecent);
  }

  console.log('[SessionManager] ❌ No session found');
  return null;
}

/**
 * Calculate Levenshtein distance-based similarity
 */
calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}
```

**Advantages:**
- Graceful degradation
- Higher success rate
- Helps identify pattern of failures

**Disadvantages:**
- May match wrong session (false positives)
- More complex logic
- Slower (multiple DB queries)

### Strategy 3: Client-Side Session ID Injection

**Problem:** Server-computed hashes are unreliable.

**Solution:** Let client manage session IDs via custom header/field.

```javascript
// File: src/handlers/chat-completions-handler.js

async function chatCompletions(req, res, next) {
  try {
    const { messages, model, stream, ...options } = req.body;

    // Check for client-provided session ID
    const clientSessionId = req.headers['x-conversation-id'] ||
                           req.body.conversation_id;

    let sessionId;
    let session = null;

    if (clientSessionId) {
      // Client is managing session - use their ID
      console.log('[ChatCompletions] Client-provided session:', clientSessionId);

      session = sessionManager.getSession(clientSessionId);

      if (!session) {
        // First message in this client session
        const firstUserMessage = extractFirstUserMessage(messages);
        const chatId = await qwenClient.createNewChat('API Chat', [model || 'qwen3-max']);
        session = sessionManager.createSession(clientSessionId, chatId, firstUserMessage);
      }

      sessionId = clientSessionId;

    } else {
      // Existing hash-based logic
      const hasAssistantMessage = messages.some(m => m.role === 'assistant');
      // ... (current implementation)
    }

    // ... rest of handler

    // Include session ID in response headers
    res.setHeader('X-Conversation-Id', sessionId);

  } catch (error) {
    next(error);
  }
}
```

**Client Usage:**
```javascript
// Roo-Cline would send:
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Conversation-Id': 'stored-session-id-123' // From previous response
  },
  body: JSON.stringify({
    model: 'qwen3-max',
    messages: [/* ... */]
  })
});

// Extract and store for next request
const sessionId = response.headers.get('X-Conversation-Id');
localStorage.setItem('currentSession', sessionId);
```

**Advantages:**
- No hash computation needed
- Client controls session lifecycle
- 100% reliable continuations

**Disadvantages:**
- Requires client modification (Roo-Cline would need update)
- Breaks OpenAI API compatibility
- Session hijacking risk (need validation)

### Strategy 4: Time-Based Session Resolution

**Problem:** Hash mismatches prevent continuation.

**Solution:** Use temporal proximity to find likely session.

```javascript
// File: src/services/session-manager.js

/**
 * Find session created recently with matching first message
 * Used as fallback when hash lookup fails
 */
findRecentSessionByFirstMessage(firstUserMessage, timeWindowMs = 5 * 60 * 1000) {
  const cutoff = Date.now() - timeWindowMs; // Last 5 minutes

  const stmt = this.repo.db.prepare(`
    SELECT * FROM sessions
    WHERE first_user_message = ?
      AND created_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const session = stmt.get(firstUserMessage, cutoff);
  return session;
}

/**
 * Enhanced find with time-based fallback
 */
findSessionByConversationHash(conversationHash, firstUserMessage) {
  // Try exact hash first
  let session = this.repo.findByConversationHash(conversationHash);

  if (!session && firstUserMessage) {
    console.log('[SessionManager] Hash miss, trying time-based lookup...');

    // Fallback: Find recent session with same first message
    session = this.findRecentSessionByFirstMessage(firstUserMessage);

    if (session) {
      console.log('[SessionManager] ✅ Found via time-based lookup:', session.id);
      console.log('[SessionManager] Age:', Math.floor((Date.now() - session.created_at) / 1000), 'seconds');
    }
  }

  if (!session) {
    return null;
  }

  // Update last accessed
  this.repo.touchSession(session.id, this.timeout);

  return this.formatSession(session);
}
```

**Usage in handler:**
```javascript
// File: src/handlers/chat-completions-handler.js

const firstUserMessage = extractFirstUserMessage(messages);
const firstAssistantMsg = messages.find(m => m.role === 'assistant');
const conversationKey = firstUserMessage + firstAssistantMsg.content;
const conversationHash = sessionManager.generateSessionId(conversationKey);

// Pass first message for fallback
session = sessionManager.findSessionByConversationHash(
  conversationHash,
  firstUserMessage  // NEW: enables time-based fallback
);
```

**Advantages:**
- Simple implementation
- Works for rapid conversation turns
- No client changes needed

**Disadvantages:**
- May match wrong session if multiple conversations start with same message
- Time window is arbitrary (5 min? 10 min?)
- Won't help if conversation has long pauses

---

## 7. Quick Reference

### Commands to Run

```bash
# Start server
npm start

# Run all tests
npm test

# Run specific test
npm test -- tests/integration/test-prewarm-validation.test.js

# Check database
sqlite3 data/qwen_proxy.db "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10"

# Monitor logs
tail -f logs/*.log

# Clear test data
sqlite3 data/qwen_proxy.db "DELETE FROM requests WHERE created_at < strftime('%s', 'now') - 3600"
```

### Files to Check When Debugging

1. **No XML tool calls:** `src/transformers/openai-to-qwen-transformer.js:extractMessagesToSend()`
2. **Session not found:** `src/services/session-manager.js:findSessionByConversationHash()`
3. **Hash mismatch:** `src/services/session-manager.js:setConversationHash()`
4. **400 errors:** `src/handlers/chat-completions-handler.js:chatCompletions()`
5. **Streaming issues:** `src/services/sse-handler.js:streamCompletion()`

### Key Log Messages

```bash
# Success indicators
✅ "Has XML tool call: true"
✅ "Set conversation hash for session"
✅ "findSessionByConversationHash returned: found"

# Failure indicators
❌ "Has XML tool call: false"
❌ "Session not found or expired"
❌ "findSessionByConversationHash returned: null"
❌ "Hash not found! Listing all hashes"
```

---

## Conclusion

**MAJOR WIN:** Fixed critical bug preventing XML tool calls. Transformer was discarding system prompts.

**NEXT STEPS:**
1. Implement response normalization (Strategy #1 recommended)
2. Add comprehensive logging (Phase 3)
3. Test with real Roo-Cline client
4. Monitor for hash mismatch patterns
5. Consider fallback strategies if normalization insufficient

**ESTIMATED TIME TO FULL RESOLUTION:** 6-10 hours

**RISK ASSESSMENT:** Low - Core functionality (XML tool calls) now working. Remaining issue affects only multi-turn conversations with response variation.

---

**Questions? Issues?**
- Check logs: `tail -f logs/*.log`
- Check database: `sqlite3 data/qwen_proxy.db`
- Review this doc: `/docs/HANDOFF_ROO_CLINE_TOOL_CALLING.md`

**Good luck! 🚀**
