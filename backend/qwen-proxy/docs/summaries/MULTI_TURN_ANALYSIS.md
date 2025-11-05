# Multi-Turn Conversation Format Compatibility Analysis

## The Problem

**Roocode sends:** Full conversation history (OpenAI format)
**Qwen expects:** Only the NEW message + parent_id for context

## Current Proxy Implementation (proxy-server.js)

### What It Does Right ✅

```javascript
// Line 119: Extract last message (Qwen only needs the new message)
const lastMessage = messages[messages.length - 1];

// Line 122: Send to Qwen
const qwenResponse = await sendToQwen(session.chat_id, session.parent_id, lastMessage);
```

**This is CORRECT!** The proxy already:
1. Extracts only the last message from Roocode's full history
2. Uses the stored `parent_id` from the previous turn
3. Updates the `parent_id` after each response for the next turn

### Session Management Strategy ✅

```javascript
// Lines 104-116: Session management
const conversationId = crypto.createHash('md5')
  .update(JSON.stringify(messages[0]))
  .digest('hex');

let session = sessions.get(conversationId);
if (!session) {
  const chatId = await createQwenChat();
  session = { chat_id: chatId, parent_id: null };
  sessions.set(conversationId, session);
}
```

**This is CORRECT!** The proxy:
1. Uses hash of first message to identify unique conversations
2. Creates ONE Qwen chat per conversation
3. Tracks `parent_id` across multiple turns

## Format Comparison

### Request 1: First Message

**Roocode sends to proxy:**
```json
{
  "model": "qwen3-max",
  "messages": [
    { "role": "user", "content": "My favorite color is blue" }
  ]
}
```

**Proxy transforms to Qwen:**
```json
{
  "chat_id": "new-chat-uuid",
  "parent_id": null,  // ← First message
  "messages": [
    {
      "fid": "msg-uuid",
      "parentId": null,
      "role": "user",
      "content": "My favorite color is blue"
    }
  ]
}
```

**Qwen responds:**
```json
{
  "parent_id": "abc123",  // ← Store this for next turn!
  "choices": [
    {
      "message": {
        "content": "That's a nice color!"
      }
    }
  ]
}
```

### Request 2: Follow-up Message

**Roocode sends to proxy (FULL HISTORY):**
```json
{
  "model": "qwen3-max",
  "messages": [
    { "role": "user", "content": "My favorite color is blue" },
    { "role": "assistant", "content": "That's a nice color!" },
    { "role": "user", "content": "What is my favorite color?" }
  ]
}
```

**Proxy extracts ONLY NEW MESSAGE and transforms to Qwen:**
```json
{
  "chat_id": "new-chat-uuid",  // ← Same chat
  "parent_id": "abc123",        // ← From previous response
  "messages": [
    {
      "fid": "msg-uuid-2",
      "parentId": "abc123",      // ← From previous response
      "role": "user",
      "content": "What is my favorite color?"  // ← ONLY the new message!
    }
  ]
}
```

**Qwen responds with context:**
```json
{
  "parent_id": "def456",  // ← Store this for next turn!
  "choices": [
    {
      "message": {
        "content": "Your favorite color is blue!"  // ← Qwen remembers!
      }
    }
  ]
}
```

## Why This Works

### Roocode's Approach (Stateless)
- Sends full conversation history on every request
- This is the standard OpenAI API pattern
- Works because OpenAI API is stateless

### Qwen's Approach (Stateful)
- Maintains conversation context SERVER-SIDE
- Uses `parent_id` chain to retrieve context
- Only needs the NEW message + parent_id reference

### Proxy's Translation ✅
```
Roocode (Full History) → Proxy (Extract Last + Parent ID) → Qwen (Context Lookup)
                                                                     ↓
                                                              Server-side context
```

## Test Coverage

### Qwen API Tests (Direct) ✅
**File:** `tests/03-parent-id-discovery.test.js`
- Turn 1: "My favorite color is blue" → parent_id: null
- Turn 2: "What is my favorite color?" → parent_id: from turn 1
- **Result:** Context preserved via parent_id chain

### Roocode Integration Tests (via Proxy) ⏳
**File:** `tests/roocode-integration/04-end-to-end-integration.test.js`
- Turn 1: Set context about project
- Turn 2: Ask about project name (sends FULL history)
- Turn 3: Ask about framework (sends FULL history)
- **Expected:** Proxy extracts last message, uses parent_id

## Potential Issues

### ✅ Issue 1: Session Identification (RESOLVED)

**Investigation Result:** Roocode does **NOT** send any conversation ID!

After analyzing Roocode's source code:
- Uses standard OpenAI SDK (`client.chat.completions.create()`)
- Only sends standard headers (User-Agent, Referer, X-Title)
- `taskId` exists only internally for local file storage, **never sent to API**
- No custom conversation tracking headers

**Files checked:**
- `/src/api/providers/base-openai-compatible-provider.ts:95` - Standard OpenAI SDK call
- `/src/api/providers/constants.ts` - Only has DEFAULT_HEADERS (User-Agent, etc.)
- `/src/core/task/Task.ts` - taskId is internal only

**Solution Implemented:** Hash of first USER message (most reliable option)
```javascript
// OLD (problematic):
const conversationId = crypto.createHash('md5')
  .update(JSON.stringify(messages[0]))  // Could be system message
  .digest('hex');

// NEW (reliable):
const firstUserMessage = messages.find(m => m.role === 'user');
const conversationId = crypto.createHash('md5')
  .update(JSON.stringify({
    role: firstUserMessage.role,
    content: firstUserMessage.content
  }))
  .digest('hex');
```

**Why this works:**
- First user message is stable across all turns in a conversation
- System messages may be added/removed but first user message stays the same
- Roocode sends full history on each request, so first user message is always present

### ✅ Issue 2: Message Format (ALREADY HANDLED)

The proxy correctly extracts and transforms:
- Extracts: `messages[messages.length - 1]` (last message)
- Transforms: OpenAI format → Qwen format
- Preserves: Content and role

### ✅ Issue 3: Parent ID Chain (ALREADY HANDLED)

The proxy correctly:
- Stores `parent_id` from each response
- Uses it for the next message
- Initializes with `null` for first message

## Conclusion

### ✅ The proxy IS compatible with multi-turn conversations!

**The transformation logic is CORRECT:**
1. Roocode sends full history (OpenAI standard)
2. Proxy extracts ONLY last message
3. Proxy uses stored parent_id for context
4. Qwen retrieves full context server-side
5. Proxy updates parent_id for next turn

### ⚠️ One potential issue: Session identification

**Needs testing to confirm:**
- Does the hash-of-first-message approach work reliably with Roocode?
- Does Roocode ever modify the first message between requests?
- Should we use a different session identification strategy?

### 🧪 Next Steps

1. **Run the integration tests** with real API to confirm it works
2. **Monitor session identification** in logs
3. **Add session debugging** to track conversation continuity
4. **Implement fallback** if session identification fails

## Test Command

```bash
# Run Roocode integration tests (includes multi-turn)
npm test -- tests/roocode-integration/04-end-to-end-integration.test.js

# Look for the "Multi-turn conversation" test specifically
```

## Expected Outcome

✅ **If tests pass:** The proxy correctly handles multi-turn conversations!
❌ **If tests fail:** Check logs to see if session identification is the issue.

## Debugging

Add this to proxy-server.js to debug session management:

```javascript
// After line 116 (session creation)
console.log(`[SESSION] ID: ${conversationId.substring(0, 8)}, ChatID: ${session.chat_id}, ParentID: ${session.parent_id}`);
console.log(`[SESSION] Message count: ${messages.length}, Extracting last: "${lastMessage.content.substring(0, 50)}..."`);
```

This will help confirm:
1. Same conversation uses same session
2. Parent ID is tracked correctly
3. Last message is extracted correctly
