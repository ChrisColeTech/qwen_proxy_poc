# Qwen API - Real Test Discoveries

## Test-Driven Development Results

All tests performed against the REAL Qwen API with NO MOCKS.

## Critical Discoveries

### 1. Authentication Requirements

**Required Headers:**
- `bx-umidtoken`: MUST be present (get from browser DevTools)
- `Cookie`: Full cookie string from logged-in session
- `User-Agent`: Browser user agent string (important for WAF)
- `Content-Type`: application/json

**Without these headers:**
- Qwen returns an HTML WAF (Web Application Firewall) challenge page
- NOT a JSON error response

### 2. Creating a New Chat

**Endpoint:** `POST /api/v2/chats/new`

**Payload:**
```json
{
  "title": "Chat Title",
  "models": ["qwen3-max"],
  "chat_mode": "guest",
  "chat_type": "t2t",
  "timestamp": 1761697524151
}
```

**Response:**
```json
{
  "success": true,
  "request_id": "...",
  "data": {
    "id": "chat-uuid"
  }
}
```

### 3. First Message in a Chat

**CRITICAL: `parent_id` MUST be `null` for the first message!**

**Endpoint:** `POST /api/v2/chat/completions?chat_id={chat_id}`

**Payload:**
```json
{
  "stream": false,
  "incremental_output": true,
  "chat_id": "chat-uuid",
  "chat_mode": "guest",
  "model": "qwen3-max",
  "parent_id": null,  // ← MUST BE NULL!
  "messages": [
    {
      "fid": "message-uuid",
      "parentId": null,  // ← MUST BE NULL!
      "childrenIds": [],
      "role": "user",
      "content": "Your message here",
      "user_action": "chat",
      "files": [],
      "timestamp": 1761697524,
      "models": ["qwen3-max"],
      "chat_type": "t2t",
      "feature_config": {
        "thinking_enabled": false,
        "output_schema": "phase"
      },
      "extra": {
        "meta": {
          "subChatType": "t2t"
        }
      },
      "sub_chat_type": "t2t",
      "parent_id": null  // ← MUST BE NULL!
    }
  ],
  "timestamp": 1761697524
}
```

**Response:**
```json
{
  "success": true,
  "request_id": "...",
  "data": {
    "chat_id": "",
    "parent_id": "new-parent-uuid",  // ← USE THIS for next message!
    "message_id": "assistant-message-uuid",
    "messages": null,
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "Assistant response here"
        }
      }
    ]
  }
}
```

### 4. Follow-up Messages

**CRITICAL DISCOVERY: Qwen maintains conversation context SERVER-SIDE!**

**You only need to send the NEW message, not the full history!**

**Use `parent_id` from the previous response:**

```json
{
  "parent_id": "parent-uuid-from-previous-response",  // ← From previous response.data.parent_id
  "messages": [
    {
      "fid": "new-message-uuid",
      "parentId": "parent-uuid-from-previous-response",  // ← Same here
      "role": "user",
      "content": "Follow-up message",
      "parent_id": "parent-uuid-from-previous-response"  // ← And here
    }
  ]
}
```

**Key Insight:**
- Response includes BOTH `parent_id` and `message_id`
- For the NEXT message, use `parent_id` from response (NOT `message_id`)
- Qwen uses the parent_id chain to retrieve context server-side

### 5. Failed Experiments

❌ **Using "root" as parent_id**
```
Error: "Invalid input chat parent_id root is not exist."
```

❌ **Using a random UUID as parent_id**
```
Error: "Invalid input chat parent_id {uuid} is not exist."
```

❌ **Using assistant's message_id as parent (instead of parent_id)**
```
Result: Context lost, Qwen doesn't remember previous messages
```

✅ **Using parent_id from previous response**
```
Result: Context preserved! Qwen remembers conversation history
```

## Session Management for OpenAI Compatibility

### Strategy

For OpenAI-compatible API:
1. **Map OpenAI conversations to Qwen chats**
   - Create a new Qwen chat for each OpenAI conversation
   - Track `chat_id` and `parent_id` per session

2. **Handle message arrays**
   - OpenAI sends full message history
   - Extract only the LAST user message
   - Use stored `parent_id` for context

3. **Maintain parent_id chain**
   - Store `parent_id` from each response
   - Use it for the next message in same conversation

### Pseudo-code

```javascript
const sessions = new Map(); // conversation_id -> { chat_id, parent_id }

async function handleOpenAIRequest(messages) {
  const conversationId = extractConversationId(messages);

  let session = sessions.get(conversationId);

  if (!session) {
    // First message in conversation
    const { chat_id } = await createQwenChat();
    session = { chat_id, parent_id: null };
    sessions.set(conversationId, session);
  }

  // Extract only the last user message
  const lastMessage = messages[messages.length - 1];

  // Send to Qwen with stored parent_id
  const response = await sendToQwen({
    chat_id: session.chat_id,
    parent_id: session.parent_id,
    message: lastMessage
  });

  // Update parent_id for next message
  session.parent_id = response.data.parent_id;

  return convertToOpenAIFormat(response);
}
```

## Test Results

✅ **All tests passed with REAL API**

1. ✅ Create chat and send first message
2. ✅ Send follow-up message with context preservation
3. ✅ Verify parent_id chain maintains conversation

## Next Steps

1. Implement OpenAI-compatible proxy with session management
2. Handle streaming responses
3. Add proper error handling for expired tokens
4. Implement session cleanup/timeout
