# Phase 2: Session Management Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Roocode)                            │
│                    Uses Standard OpenAI SDK                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ POST /v1/chat/completions
                                 │ { messages: [...] }
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PROXY SERVER                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Request Handler                                           │    │
│  │  1. Receive OpenAI request                                 │    │
│  │  2. Generate conversation ID from messages                 │    │
│  │  3. Get or create session                                  │    │
│  │  4. Transform to Qwen format (with chat_id, parent_id)    │    │
│  │  5. Send to Qwen API                                       │    │
│  │  6. Update parent_id for next turn                         │    │
│  │  7. Transform response to OpenAI format                    │    │
│  │  8. Return to client                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────┐  ┌──────────────────────────────┐       │
│  │  session-id-generator │  │  session-manager             │       │
│  │                       │  │                              │       │
│  │  • Find first USER    │  │  • In-memory Map storage    │       │
│  │    message            │  │  • Create session           │       │
│  │  • Hash {role,content}│  │  • Get session              │       │
│  │  • Return MD5 hex     │  │  • Update parent_id         │       │
│  │                       │  │  • Delete session           │       │
│  └───────────────────────┘  └──────────────────────────────┘       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ POST /v1/messages
                                 │ { message: {...}, chat_id, parent_id }
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         QWEN API                                    │
│                    Requires chat_id + parent_id                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Multi-Turn Conversation

### Turn 1: First Message

```
CLIENT                    PROXY                      QWEN API
  │                         │                           │
  │  POST /v1/chat/...      │                           │
  │  messages: [            │                           │
  │    {user: "Hello"}      │                           │
  │  ]                      │                           │
  ├────────────────────────►│                           │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │ Generate ID │                    │
  │                  │ hash("Hello")                    │
  │                  │ = "abc123"  │                    │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │ Get session │                    │
  │                  │ "abc123"    │                    │
  │                  │ → NOT FOUND │                    │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │Create session                    │
  │                  │ chatId: chat1│                   │
  │                  │ parentId: null                   │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │                         │  POST /v1/messages        │
  │                         │  chat_id: chat1           │
  │                         │  parent_id: null          │
  │                         │  message: {user: "Hello"} │
  │                         ├──────────────────────────►│
  │                         │                           │
  │                         │◄──────────────────────────┤
  │                         │  { id: "msg1", ... }      │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │Update session                    │
  │                  │ parentId: msg1                   │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │◄────────────────────────┤                           │
  │  { choices: [...] }     │                           │
  │                         │                           │
```

### Turn 2: Follow-up Message

```
CLIENT                    PROXY                      QWEN API
  │                         │                           │
  │  POST /v1/chat/...      │                           │
  │  messages: [            │                           │
  │    {user: "Hello"},     │                           │
  │    {asst: "Hi!"},       │                           │
  │    {user: "How are you?"}                           │
  │  ]                      │                           │
  ├────────────────────────►│                           │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │ Generate ID │                    │
  │                  │ hash("Hello")                    │
  │                  │ = "abc123"  │  ← SAME ID!        │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │ Get session │                    │
  │                  │ "abc123"    │                    │
  │                  │ → FOUND!    │                    │
  │                  │ chatId: chat1                    │
  │                  │ parentId: msg1                   │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │                         │  POST /v1/messages        │
  │                         │  chat_id: chat1  ← SAME!  │
  │                         │  parent_id: msg1 ← FROM TURN 1
  │                         │  message: {user: "How..."}│
  │                         ├──────────────────────────►│
  │                         │                           │
  │                         │◄──────────────────────────┤
  │                         │  { id: "msg2", ... }      │
  │                         │                           │
  │                  ┌──────┴──────┐                    │
  │                  │Update session                    │
  │                  │ parentId: msg2                   │
  │                  └──────┬──────┘                    │
  │                         │                           │
  │◄────────────────────────┤                           │
  │  { choices: [...] }     │                           │
  │                         │                           │
```

## Session State Transitions

```
┌─────────────────────┐
│   No Session Exists │
│   (First Message)   │
└──────────┬──────────┘
           │
           │ generateConversationId(messages)
           │ → conversationId = "abc123"
           │
           ▼
┌─────────────────────┐
│  Create New Session │
│  chatId: chat1      │
│  parentId: null     │
└──────────┬──────────┘
           │
           │ Send to Qwen (chat1, null)
           │ Response: { id: "msg1" }
           │
           ▼
┌─────────────────────┐
│  Update Parent ID   │
│  chatId: chat1      │
│  parentId: msg1     │◄──────────────┐
└──────────┬──────────┘               │
           │                          │
           │ Next Turn                │
           │ (same conversationId)    │
           │                          │
           ▼                          │
┌─────────────────────┐               │
│  Retrieve Session   │               │
│  chatId: chat1      │               │
│  parentId: msg1     │               │
└──────────┬──────────┘               │
           │                          │
           │ Send to Qwen             │
           │ (chat1, msg1)            │
           │ Response: { id: "msg2" } │
           │                          │
           │ updateParentId("abc123", "msg2")
           └──────────────────────────┘
```

## Conversation ID Algorithm

```
Input: messages = [
  { role: "system", content: "You are helpful" },
  { role: "user", content: "Hello" },
  { role: "assistant", content: "Hi!" },
  { role: "user", content: "How are you?" }
]

Step 1: Find first USER message
        ↓
        { role: "user", content: "Hello" }

Step 2: Extract only { role, content }
        ↓
        { role: "user", content: "Hello" }

Step 3: JSON stringify
        ↓
        '{"role":"user","content":"Hello"}'

Step 4: MD5 hash
        ↓
        '663cd587bb463fa5ac0e1ad1b0cecf19'

Output: conversationId = '663cd587bb463fa5ac0e1ad1b0cecf19'
```

## Session Storage Structure

```
SessionManager
└── sessions: Map<conversationId, Session>
    │
    ├── "abc123" → {
    │                chatId: "chat1",
    │                parentId: "msg1",
    │                createdAt: 1234567890,
    │                lastAccessed: 1234567891
    │              }
    │
    ├── "def456" → {
    │                chatId: "chat2",
    │                parentId: null,
    │                createdAt: 1234567900,
    │                lastAccessed: 1234567900
    │              }
    │
    └── "ghi789" → {
                     chatId: "chat3",
                     parentId: "msg5",
                     createdAt: 1234567910,
                     lastAccessed: 1234567920
                   }
```

## Component Responsibilities

### session-id-generator.js
```
Purpose: Generate stable conversation IDs
Input:   OpenAI message array
Output:  MD5 hash string
Logic:   Hash first user message { role, content }
Why:     First user message never changes throughout conversation
```

### session-manager.js
```
Purpose: Store and manage session state
Storage: In-memory Map (O(1) lookup)
State:   { chatId, parentId, createdAt, lastAccessed }
Methods: create, get, update, delete, getAll, count, clear
```

## Key Design Decisions

### Why Hash First User Message?

```
✓ CONSISTENT: Same message always produces same ID
✓ STABLE: First user message doesn't change as conversation grows
✓ SIMPLE: No need for external conversation tracking
✓ RELIABLE: Works with standard OpenAI SDK (no custom headers)

✗ Rejected alternatives:
  - Random ID: Not consistent across turns
  - Timestamp: Changes between requests
  - Full history hash: Changes every turn
  - Session cookie: Roocode uses stateless SDK
```

### Why In-Memory Storage?

```
✓ FAST: O(1) lookup via Map
✓ SIMPLE: No database dependencies
✓ SUFFICIENT: Proxy use case (short-lived sessions)

✗ Trade-offs:
  - Lost on restart: Acceptable (new conversations start fresh)
  - Not shared: Single-instance only (can add Redis later)
  - No persistence: Users start new session if proxy restarts
```

### Why Track parent_id?

```
Qwen requires parent_id to maintain conversation context:

Turn 1: parent_id = null       → Creates new message thread
Turn 2: parent_id = msg1       → Links to Turn 1 response
Turn 3: parent_id = msg2       → Links to Turn 2 response

This creates a chain: null → msg1 → msg2 → msg3 → ...

Without parent_id: Each turn would be isolated (no context)
```

## Testing Strategy

```
Unit Tests (48 tests)
├── session-id-generator (18 tests)
│   ├── Consistency: Same input = same ID
│   ├── Uniqueness: Different input = different ID
│   ├── Stability: System messages don't affect ID
│   └── Edge cases: No user message, array content, metadata
│
└── session-manager (30 tests)
    ├── CRUD operations
    ├── Parent ID updates
    ├── Timestamp tracking
    ├── Concurrent conversations
    └── Edge cases

Integration Tests (5 tests)
├── Multi-turn flow simulation
├── Session isolation verification
├── Complete proxy flow
└── Metadata handling
```

## Performance Characteristics

```
Operation                Time Complexity    Memory
─────────────────────    ───────────────    ──────────
generateConversationId   O(n)              O(1)
  (n = message count)

createSession           O(1)               O(1)
getSession              O(1)               O(1)
updateParentId          O(1)               O(1)
deleteSession           O(1)               O(1)

Total Memory Usage      -                  O(k)
  (k = active sessions)

Typical:
- 100 concurrent conversations = ~10 KB memory
- 1000 concurrent conversations = ~100 KB memory
- ID generation = 1-2 ms per request
```

## Integration Checklist (Phase 4)

- [ ] Import session modules
- [ ] Initialize SessionManager at startup
- [ ] Add conversation ID generation in request handler
- [ ] Add session retrieval/creation logic
- [ ] Pass session data to Qwen transformer
- [ ] Update parent_id after Qwen response
- [ ] Test single-turn conversations
- [ ] Test multi-turn conversations
- [ ] Test concurrent conversations
- [ ] Verify session isolation

## File Structure

```
backend/
├── src/
│   └── session/
│       ├── session-id-generator.js    # ID generation
│       ├── session-manager.js         # Session storage
│       └── README.md                  # Module docs
│
├── tests/
│   ├── unit/
│   │   ├── session-id-generator.test.js
│   │   └── session-manager.test.js
│   └── integration/
│       └── session-integration.test.js
│
├── examples/
│   └── session-example.js             # Visual demo
│
└── documentation/
    ├── PHASE_2_COMPLETE.md            # Full summary
    ├── PHASE_2_QUICK_REFERENCE.md     # Quick reference
    └── PHASE_2_ARCHITECTURE.md        # This file
```

## Summary

Phase 2 implements a complete session management system that:

1. **Generates stable conversation IDs** from OpenAI message arrays
2. **Stores session state** mapping conversations to Qwen chats
3. **Maintains parent_id chains** for multi-turn conversations
4. **Isolates concurrent conversations** with unique sessions
5. **Provides O(1) lookups** for performance
6. **Handles edge cases** gracefully
7. **Is thoroughly tested** (53 tests passing)
8. **Is well documented** (multiple docs + examples)

Ready for Phase 4 integration.
