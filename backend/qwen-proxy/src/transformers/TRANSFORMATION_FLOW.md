# Transformation Flow Diagram

## Request Flow (OpenAI → Qwen)

```
┌─────────────────────────────────────────────────────────────────┐
│ OpenAI Request                                                  │
│ {                                                               │
│   model: "gpt-4",                                               │
│   messages: [                                                   │
│     { role: "system", content: "You are helpful" },             │
│     { role: "user", content: "Hello" },                         │
│     { role: "assistant", content: "Hi!" },                      │
│     { role: "user", content: "How are you?" }  ← LAST MESSAGE   │
│   ],                                                            │
│   stream: true                                                  │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ extractLastMessage()                                            │
│ → { role: "user", content: "How are you?" }                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ createQwenMessage()                                             │
│ + Add 18 required fields                                        │
│ + Set timestamp to Unix SECONDS                                 │
│ + Set parentId from session                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Qwen Request                                                    │
│ {                                                               │
│   stream: true,                                                 │
│   incremental_output: true,                                     │
│   chat_id: "chat-123",                                          │
│   parent_id: "parent-456",  ← From session                      │
│   model: "qwen3-max",                                           │
│   messages: [{                                                  │
│     fid: "uuid-789",                    (1)                     │
│     parentId: "parent-456",             (2)                     │
│     parent_id: "parent-456",            (3) ← DUPLICATE         │
│     childrenIds: [],                    (4)                     │
│     role: "user",                       (5)                     │
│     content: "How are you?",            (6)                     │
│     user_action: "chat",                (7)                     │
│     files: [],                          (8)                     │
│     timestamp: 1761756270,              (9) ← SECONDS!          │
│     models: ["qwen3-max"],              (10)                    │
│     chat_type: "t2t",                   (11)                    │
│     sub_chat_type: "t2t",               (12)                    │
│     feature_config: {                   (13)                    │
│       thinking_enabled: false,          (14)                    │
│       output_schema: "phase"            (15)                    │
│     },                                                          │
│     extra: {                            (16)                    │
│       meta: {                           (17)                    │
│         subChatType: "t2t"              (18)                    │
│       }                                                         │
│     }                                                           │
│   }],                                                           │
│   timestamp: 1761756270                                         │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Response Flow - Non-Streaming (Qwen → OpenAI)

```
┌─────────────────────────────────────────────────────────────────┐
│ Qwen Response                                                   │
│ {                                                               │
│   success: true,                                                │
│   data: {                                                       │
│     parent_id: "parent-789",  ← Save to session!                │
│     message_id: "msg-123",                                      │
│     choices: [{                                                 │
│       message: {                                                │
│         role: "assistant",                                      │
│         content: "I'm doing well!"                              │
│       }                                                         │
│     }]                                                          │
│   }                                                             │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ transformToOpenAICompletion()                                   │
│ + Extract content                                               │
│ + Extract parent_id (for session)                               │
│ + Transform usage format                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenAI Response                                                 │
│ {                                                               │
│   id: "chatcmpl-msg-123",                                       │
│   object: "chat.completion",                                    │
│   created: 1761756270,                                          │
│   model: "qwen3-max",                                           │
│   choices: [{                                                   │
│     index: 0,                                                   │
│     message: {                                                  │
│       role: "assistant",                                        │
│       content: "I'm doing well!"                                │
│     },                                                          │
│     finish_reason: "stop"                                       │
│   }],                                                           │
│   usage: {                                                      │
│     prompt_tokens: 10,                                          │
│     completion_tokens: 5,                                       │
│     total_tokens: 15                                            │
│   },                                                            │
│   _qwen_metadata: {                                             │
│     parent_id: "parent-789"  ← For next request!                │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Response Flow - Streaming (Qwen SSE → OpenAI SSE)

```
┌─────────────────────────────────────────────────────────────────┐
│ Qwen SSE Stream                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Chunk 1: response.created                                       │
│ data: {                                                         │
│   "response.created": {                                         │
│     "chat_id": "chat-123",                                      │
│     "parent_id": "parent-999",  ← EXTRACT THIS!                 │
│     "response_id": "resp-456"                                   │
│   }                                                             │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ SSETransformer.processChunk()                                   │
│ + Detect response.created                                       │
│ + Extract parent_id → save                                      │
│ + DON'T SEND to client                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼  (Skip - not sent to client)
                         │
┌─────────────────────────────────────────────────────────────────┐
│ Chunk 2-N: Content chunks                                       │
│ data: {                                                         │
│   "choices": [{                                                 │
│     "delta": {                                                  │
│       "role": "assistant",                                      │
│       "content": "I'm ",                                        │
│       "status": "typing",                                       │
│       "phase": "answer"                                         │
│     }                                                           │
│   }],                                                           │
│   "usage": { input_tokens: 10, output_tokens: 1 }               │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ transformToOpenAIChunk()                                        │
│ + Remove status, phase                                          │
│ + Keep role, content                                            │
│ + Update usage                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenAI Chunk                                                    │
│ data: {                                                         │
│   "id": "chatcmpl-resp-456",                                    │
│   "object": "chat.completion.chunk",                            │
│   "created": 1761756270,                                        │
│   "model": "qwen3-max",                                         │
│   "choices": [{                                                 │
│     "index": 0,                                                 │
│     "delta": {                                                  │
│       "role": "assistant",                                      │
│       "content": "I'm "                                         │
│     },                                                          │
│     "finish_reason": null                                       │
│   }]                                                            │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼  (Send to client)
                         │
┌─────────────────────────────────────────────────────────────────┐
│ Final Qwen Chunk                                                │
│ data: {                                                         │
│   "choices": [{                                                 │
│     "delta": {                                                  │
│       "content": "",                                            │
│       "role": "assistant",                                      │
│       "status": "finished",  ← DETECT THIS!                     │
│       "phase": "answer"                                         │
│     }                                                           │
│   }]                                                            │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ transformer.finalize()                                          │
│ + Detect finished status                                        │
│ + Create final chunk with finish_reason                         │
│ + Create usage chunk                                            │
│ + Create [DONE] marker                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Final Chunks to Client                                          │
│                                                                 │
│ data: {                                                         │
│   "id": "chatcmpl-resp-456",                                    │
│   "choices": [{                                                 │
│     "delta": {},                                                │
│     "finish_reason": "stop"  ← FINAL CHUNK                      │
│   }]                                                            │
│ }                                                               │
│                                                                 │
│ data: {                                                         │
│   "id": "chatcmpl-resp-456",                                    │
│   "choices": [],                                                │
│   "usage": {                        ← USAGE CHUNK               │
│     "prompt_tokens": 10,                                        │
│     "completion_tokens": 15,                                    │
│     "total_tokens": 25                                          │
│   }                                                             │
│ }                                                               │
│                                                                 │
│ data: [DONE]                         ← DONE MARKER              │
└─────────────────────────────────────────────────────────────────┘
```

## Session State Updates

```
┌─────────────────────────────────────────────────────────────────┐
│ Message 1 (First message)                                       │
├─────────────────────────────────────────────────────────────────┤
│ Session BEFORE: { chatId: "chat-123", parentId: null }         │
│ Request parent_id: null                                         │
│ Response parent_id: "parent-456"                                │
│ Session AFTER: { chatId: "chat-123", parentId: "parent-456" }  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Message 2 (Follow-up)                                           │
├─────────────────────────────────────────────────────────────────┤
│ Session BEFORE: { chatId: "chat-123", parentId: "parent-456" } │
│ Request parent_id: "parent-456"  ← From session                 │
│ Response parent_id: "parent-789"                                │
│ Session AFTER: { chatId: "chat-123", parentId: "parent-789" }  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Message 3 (Another follow-up)                                   │
├─────────────────────────────────────────────────────────────────┤
│ Session BEFORE: { chatId: "chat-123", parentId: "parent-789" } │
│ Request parent_id: "parent-789"  ← From session                 │
│ Response parent_id: "parent-999"                                │
│ Session AFTER: { chatId: "chat-123", parentId: "parent-999" }  │
└─────────────────────────────────────────────────────────────────┘

Key Insight: The parent_id chain maintains conversation context
server-side in Qwen. Each response's parent_id becomes the next
request's parent_id.
```

## Usage Transformation

```
┌─────────────────────────────────────────────────────────────────┐
│ Qwen Usage Format                                               │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   input_tokens: 33,                                             │
│   output_tokens: 838,                                           │
│   total_tokens: 871,                                            │
│   input_tokens_details: { text_tokens: 33 },                    │
│   output_tokens_details: { text_tokens: 838 },                  │
│   cached_tokens: 0                                              │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ extractUsage()                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenAI Usage Format                                             │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   prompt_tokens: 33,      ← input_tokens                        │
│   completion_tokens: 838, ← output_tokens                       │
│   total_tokens: 871       ← total_tokens                        │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Validation                                                      │
├─────────────────────────────────────────────────────────────────┤
│ validateQwenMessage(message)                                    │
│ → Checks all 18 fields                                          │
│ → Returns { valid: true/false, missingFields: [...] }           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SSE Parsing Errors                                              │
├─────────────────────────────────────────────────────────────────┤
│ try {                                                           │
│   const data = JSON.parse(line);                                │
│ } catch (err) {                                                 │
│   // Skip invalid JSON, log error                               │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Empty Messages Array                                            │
├─────────────────────────────────────────────────────────────────┤
│ if (!messages || messages.length === 0) {                       │
│   throw new Error('Messages array is empty');                   │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

**Input:** OpenAI format (4 messages)
**Output:** Qwen format (1 message with 18 fields)
**Timestamp:** Unix seconds (10 digits)
**Context:** Maintained via parent_id chain
**Streaming:** SSE chunks transformed individually
**Special Chunks:** response.created filtered, finished handled
**Usage:** Transformed from Qwen to OpenAI format
**Validation:** All 18 fields checked
