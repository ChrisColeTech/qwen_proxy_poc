# Phase 2: Key Code Snippets

## Headers Generated (Exact Format)

From `src/api/qwen-auth.js`, the `getHeaders()` method returns:

```javascript
{
  'bx-umidtoken': 'T2gAHsYwuTxiE5HesBMQ...', // From QWEN_TOKEN env var
  'Cookie': 'x-ap=na-vancouver-pop; acw_tc=...', // From QWEN_COOKIES env var
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
```

## Payload Documentation Compliance

### Models API (/api/models)
**Required:** Cookie

```bash
# From docs/payloads/models/request.sh
curl --location 'https://chat.qwen.ai/api/models' \
--header 'Cookie: acw_tc=...; x-ap=...'
```

✓ Our implementation provides: `Cookie` header

---

### New Chat API (/api/v2/chats/new)
**Required:** bx-umidtoken, Cookie, Content-Type

```bash
# From docs/payloads/new_chat/request.sh
curl --location 'https://chat.qwen.ai/api/v2/chats/new' \
--header 'bx-umidtoken: T2gATMkyvn...' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=...; x-ap=...'
```

✓ Our implementation provides: All 3 headers + User-Agent

---

### Completion API (/api/v2/chat/completions)
**Required:** bx-umidtoken, Cookie, Content-Type

```bash
# From docs/payloads/completion/request.sh
curl --location 'https://chat.qwen.ai/api/v2/chat/completions?chat_id=...' \
--header 'bx-umidtoken: T2gATMkyvn...' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=...; x-ap=...'
```

✓ Our implementation provides: All 3 headers + User-Agent

---

## Usage in API Calls

### Example: Calling Models API

```javascript
const auth = require('./src/api/qwen-auth');
const axios = require('axios');

async function getModels() {
  const response = await axios.get(
    'https://chat.qwen.ai/api/models',
    {
      headers: auth.getHeaders(),
      timeout: 60000
    }
  );
  
  return response.data;
}
```

### Example: Creating New Chat

```javascript
const auth = require('./src/api/qwen-auth');
const axios = require('axios');

async function createChat(title, model) {
  const response = await axios.post(
    'https://chat.qwen.ai/api/v2/chats/new',
    {
      title: title,
      models: [model],
      chat_mode: 'guest',
      chat_type: 't2t',
      timestamp: Date.now()
    },
    {
      headers: auth.getHeaders(),
      timeout: 30000
    }
  );
  
  return response.data.data.id; // Returns chat_id
}
```

### Example: Sending Completion Request

```javascript
const auth = require('./src/api/qwen-auth');
const axios = require('axios');

async function sendMessage(chatId, parentId, message) {
  const response = await axios.post(
    `https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`,
    {
      stream: true,
      incremental_output: true,
      chat_id: chatId,
      parent_id: parentId,
      messages: [message],
      // ... other fields
    },
    {
      headers: auth.getHeaders(),
      responseType: 'stream'
    }
  );
  
  return response;
}
```

---

## Middleware Usage in Express

```javascript
const express = require('express');
const authMiddleware = require('./src/middleware/auth-middleware');

const app = express();

// Apply globally
app.use(authMiddleware);

// All routes now have access to req.qwenAuth
app.post('/v1/chat/completions', (req, res) => {
  const headers = req.qwenAuth.headers;
  // Use headers for Qwen API calls
});

// Or apply selectively
app.get('/public', (req, res) => {
  // No auth required
});

app.get('/protected', authMiddleware, (req, res) => {
  // Auth required
  console.log(req.qwenAuth.headers);
});
```

---

## Error Handling Examples

### Missing Credentials

```javascript
// In .env:
QWEN_TOKEN=
QWEN_COOKIES=

// When loading:
const auth = require('./src/api/qwen-auth');
// Throws: QwenAuthError: Invalid Qwen credentials: Both QWEN_TOKEN and QWEN_COOKIES are required.
```

### Middleware Error Response

```javascript
// If credentials not set, middleware returns:
{
  "error": {
    "message": "Qwen API credentials are not configured. Please set QWEN_TOKEN and QWEN_COOKIES environment variables.",
    "type": "authentication_error",
    "code": "missing_credentials"
  }
}
// HTTP Status: 401
```

---

## Safe Logging

### ✗ NEVER DO THIS

```javascript
const auth = require('./src/api/qwen-auth');

// BAD - Exposes credentials!
console.log('Token:', auth.getToken());
console.log('Cookies:', auth.getCookies());
console.log('Headers:', auth.getHeaders());
```

### ✓ ALWAYS DO THIS

```javascript
const auth = require('./src/api/qwen-auth');

// GOOD - Safe for logs
console.log('Token preview:', auth.getTokenPreview());
console.log('Cookie preview:', auth.getCookiePreview());
console.log('Auth info:', auth.getInfo());

// Output:
// Token preview: T2gAHsYwuTxiE5HesBMQ...
// Cookie preview: x-ap=...
// Auth info: { tokenPreview: '...', cookiePreview: '...', isValid: true, userAgent: '...' }
```

---

## Configuration Reference

### Required Environment Variables

```bash
# .env file
QWEN_TOKEN=T2gAHsYwuTxiE5HesBMQsaYzPnKFObp0-Ff8iJxY8g3NZUF4JJhG_88xjRj5jBAmf2M=
QWEN_COOKIES=x-ap=na-vancouver-pop; acw_tc=0a03e58917614845059388224e3bb4fd72d2618d4adb57cf3d3fcb620bef75
```

### Optional Environment Variables

```bash
# Custom User-Agent (optional)
USER_AGENT=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36

# Qwen API timeout (optional, default 120000ms)
QWEN_TIMEOUT=60000
```

---

## Testing Commands

```bash
# Test config loading
node -e "require('./src/config'); console.log('✓ Config valid')"

# Test auth validity
node -e "const auth = require('./src/api/qwen-auth'); console.log('Valid:', auth.isValid())"

# Test header generation
node -e "const auth = require('./src/api/qwen-auth'); console.log(auth.getHeaders())"

# Test safe preview
node -e "const auth = require('./src/api/qwen-auth'); console.log(auth.getInfo())"
```

---

## Integration with Other Phases

### Phase 3: Qwen Types
```javascript
const auth = require('./src/api/qwen-auth');
const { createQwenMessage } = require('./src/api/qwen-types');

// Use auth headers with typed payloads
const headers = auth.getHeaders();
const message = createQwenMessage({ /* ... */ });
```

### Phase 7: Models Handler
```javascript
const auth = require('./src/api/qwen-auth');

async function listModels() {
  const response = await axios.get(
    'https://chat.qwen.ai/api/models',
    { headers: auth.getHeaders() }
  );
  return transformToOpenAI(response.data);
}
```

### Phase 8: Chat Handler
```javascript
const auth = require('./src/api/qwen-auth');
const authMiddleware = require('./src/middleware/auth-middleware');

app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
  // Headers already available on req.qwenAuth
  const response = await qwenClient.sendMessage({
    headers: req.qwenAuth.headers,
    // ...
  });
});
```
