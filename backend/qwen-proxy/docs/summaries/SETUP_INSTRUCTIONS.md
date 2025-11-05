# Qwen Proxy Backend - Setup Instructions

## Critical Discovery: bx-umidtoken Required

### What We Found

During TDD with the REAL Qwen API, we discovered:

1. **Qwen API requires the `bx-umidtoken` header** for all requests
2. **Without this header, Qwen returns a WAF (Web Application Firewall) challenge page** instead of JSON
3. **The token is NOT in the cookies** - it's a separate header

### How to Get Your Token

1. **Open your browser** and go to https://chat.qwen.ai
2. **Open DevTools** (F12 or Right-click > Inspect)
3. **Go to the Network tab**
4. **Create a new chat** or send a message
5. **Look for a request** to `/api/v2/chats/new` or `/api/v2/chat/completions`
6. **Click on the request** and go to the "Headers" tab
7. **Find the `bx-umidtoken` header** in the Request Headers section
8. **Copy the value**

### Update Your .env File

```bash
QWEN_TOKEN=<paste your bx-umidtoken value here>
QWEN_COOKIES=<your existing cookies>
```

### Example .env

```bash
QWEN_TOKEN=T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM=
QWEN_COOKIES=acw_tc=0a03e58517616784239255559e40ba47be77413cdb574b5ab1227b1dbb7494; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Running Tests

Once you have a valid token:

```bash
npm test
```

The tests will:
1. Create a real chat session with Qwen
2. Send a message and verify the response
3. Send a follow-up message to discover message handling behavior

## Current Status

- Backend folder DELETED and rebuilt from scratch
- Test infrastructure setup complete
- Waiting for valid `bx-umidtoken` to run real API tests

## Next Steps

1. User provides valid `bx-umidtoken`
2. Run tests to discover actual Qwen behavior
3. Document findings about message handling
4. Build proxy implementation based on discoveries
