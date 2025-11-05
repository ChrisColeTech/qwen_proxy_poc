# Phase 2: Session Management - Quick Reference

## Files Created

```
backend/
├── src/session/
│   ├── session-id-generator.js    (2.3 KB) - Generate conversation IDs
│   ├── session-manager.js         (4.0 KB) - Manage session state
│   └── README.md                  (9.6 KB) - Full documentation
├── tests/
│   ├── unit/
│   │   ├── session-id-generator.test.js  (7.9 KB) - 18 tests
│   │   └── session-manager.test.js       (14 KB)  - 30 tests
│   └── integration/
│       └── session-integration.test.js   (11 KB)  - 5 tests
├── examples/
│   └── session-example.js         (8.7 KB) - Visual demo
├── PHASE_2_COMPLETE.md            (8.2 KB) - Full summary
└── PHASE_2_QUICK_REFERENCE.md     (this file)
```

## Quick Start

### Run Tests
```bash
npm test -- tests/unit/session-id-generator.test.js tests/unit/session-manager.test.js tests/integration/session-integration.test.js
# Expected: 53 tests pass
```

### Run Example
```bash
node examples/session-example.js
# Shows visual multi-turn conversation demo
```

## API Cheat Sheet

### Generate Conversation ID
```javascript
const { generateConversationId } = require('./src/session/session-id-generator');

const messages = [
  { role: 'user', content: 'Hello' }
];

const convId = generateConversationId(messages);
// Returns: '663cd587bb463fa5ac0e1ad1b0cecf19'
```

### Manage Sessions
```javascript
const SessionManager = require('./src/session/session-manager');
const manager = new SessionManager();

// Create
const session = manager.createSession('conv-id', 'chat-id');

// Read
const session = manager.getSession('conv-id');

// Update
manager.updateParentId('conv-id', 'parent-id');

// Delete
manager.deleteSession('conv-id');
```

## Key Algorithm

**Session ID Generation:**
1. Find first message where `role === 'user'`
2. Extract only `{ role, content }`
3. MD5 hash of `JSON.stringify({ role, content })`
4. Return 32-character hex string

**Why it works:**
- First user message never changes
- System messages ignored
- Metadata ignored
- Produces consistent ID across all turns

## Multi-Turn Flow

```
Turn 1:
  ID = hash(first user msg)        → "abc123"
  session = create("abc123", ...)  → { chatId: "chat1", parentId: null }
  send to Qwen(chatId, parentId)   → response { id: "msg1" }
  updateParentId("abc123", "msg1")

Turn 2:
  ID = hash(first user msg)        → "abc123" (SAME!)
  session = get("abc123")          → { chatId: "chat1", parentId: "msg1" }
  send to Qwen(chatId, parentId)   → response { id: "msg2" }
  updateParentId("abc123", "msg2")

Turn 3+:
  Repeat with same chatId, updated parentId
```

## Session Object Structure

```javascript
{
  chatId: 'qwen-chat-uuid',      // Qwen chat ID (constant per conversation)
  parentId: null | 'msg-uuid',   // Last message ID (updates each turn)
  createdAt: 1234567890,         // Timestamp (ms)
  lastAccessed: 1234567890       // Updated on getSession/updateParentId
}
```

## Integration Snippet (Phase 4)

```javascript
const { generateConversationId } = require('./src/session/session-id-generator');
const SessionManager = require('./src/session/session-manager');
const sessionManager = new SessionManager();

// In request handler:
app.post('/v1/chat/completions', async (req, res) => {
  const messages = req.body.messages;

  // 1. Generate conversation ID
  const conversationId = generateConversationId(messages);

  // 2. Get or create session
  let session = sessionManager.getSession(conversationId);
  if (!session) {
    const chatId = await createQwenChat();
    session = sessionManager.createSession(conversationId, chatId);
  }

  // 3. Send to Qwen with session data
  const qwenRequest = transformToQwenRequest(messages, session);
  const qwenResponse = await sendToQwen(qwenRequest);

  // 4. Update parent_id for next turn
  sessionManager.updateParentId(conversationId, qwenResponse.id);

  // 5. Transform and return response
  const openAIResponse = transformToOpenAI(qwenResponse);
  res.json(openAIResponse);
});
```

## Test Coverage

- **Unit Tests**: 48 tests (18 + 30)
  - Session ID generation (consistency, uniqueness, edge cases)
  - Session CRUD operations
  - Timestamp tracking
  - Concurrent conversations

- **Integration Tests**: 5 tests
  - Multi-turn conversation flow
  - Session isolation
  - Complete proxy simulation
  - System message handling

## Performance

- **Session lookup**: O(1) via Map
- **ID generation**: O(n) where n = message count
- **Memory**: O(k) where k = active conversations
- **Hash speed**: ~1-2ms per request

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Different IDs for same conversation | Hashing full message object | Only hash `{ role, content }` |
| Sessions mixed up | System message affects hash | Find first USER message |
| "No user message" error | No user in message array | This is correct - OpenAI requires user message |
| Session not found | Wrong conversation ID | Verify ID generation logic |

## Documentation

- **Full docs**: `src/session/README.md`
- **Complete summary**: `PHASE_2_COMPLETE.md`
- **Original research**: `MULTI_TURN_ANALYSIS.md`

## Next Phase

Phase 4 will integrate these modules into the proxy server. See `PHASE_2_COMPLETE.md` for integration points.

---

**Status**: ✓ Complete and tested (53 tests passing)
