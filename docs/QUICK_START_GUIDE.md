# Quick Start Guide

Get started with Qwen Proxy in three simple steps. Learn about the tech stack and see working code examples.

## Setup Steps

### Step 1: Authenticate with Qwen

Click the "Connect" button in the System Control card on the Home page. This will open a browser window where you can log in to your Qwen account.

**What happens:**
- Chrome extension automatically extracts all session cookies
- Token and cookies are securely stored in database
- Expiration date is tracked automatically
- All required WAF cookies are captured (acw_tc, tfstk, isg, etc.)

**Important:** The extension captures ALL cookies from the `.qwen.ai` domain, not just the auth token. This is required for Qwen's Web Application Firewall (WAF) to accept requests.

### Step 2: Start the Proxy Server

Once authenticated, click the "Start" button to launch the proxy server. The server will run on port 3000.

**What happens:**
- Qwen Proxy starts first (port 3000) - OpenAI-compatible API endpoint
- Provider Router starts automatically (port 3001) - Backend routing service
- Status indicators show when servers are ready
- Database connections are initialized
- Session management is activated

### Step 3: Configure Your OpenAI Client

Point your OpenAI SDK or any OpenAI-compatible client to the proxy endpoint.

**Configuration:**
- **Base URL:** `http://localhost:3000/v1`
- **API Key:** Use any non-empty string (not validated)
- **Model:** `qwen3-max` (or any available Qwen model)

**Supported Features:**
- All OpenAI SDK features
- Streaming and non-streaming responses
- Multi-turn conversations
- Session management
- Token usage reporting

## Code Examples

### JavaScript / TypeScript

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'any-key'  // Required but not validated
});

const response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Hello! How are you?' }
  ]
});

console.log(response.choices[0].message.content);
```

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:3000/v1',
    api_key='any-key'  # Required but not validated
)

response = client.chat.completions.create(
    model='qwen3-max',
    messages=[
        {'role': 'user', 'content': 'Hello! How are you?'}
    ]
)

print(response.choices[0].message.content)
```

### cURL

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Expected Response Format

All responses follow the OpenAI API format:

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1762447937,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today? 😊"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 34,
    "completion_tokens": 11,
    "total_tokens": 45
  }
}
```

## Tech Stack

### Frontend
- **React** 18.3.1 - UI library
- **TypeScript** 5.9.3 - Type safety
- **Vite** 7.1.7 - Build tool
- **Tailwind CSS** 3.4.18 - Styling
- **Zustand** 5.0.8 - State management

### UI Framework
- **shadcn/ui** - Base components
- **Radix UI** - Headless primitives
- **lucide-react** 0.552.0 - Icons
- **react-icons** 5.5.0 - VSCode icons
- **cmdk** 1.1.1 - Command menu

### Desktop Runtime
- **Electron** 27.0.0 - Desktop runtime
- **electron-builder** 26.0.12 - Packaging

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **better-sqlite3** - Database
- **axios** - HTTP client

## Available Models

The proxy supports all Qwen models available in your account. Common models include:

- `qwen3-max` - Most advanced model with vision, document, video, audio support
- `qwen3-coder-plus` - Specialized for coding tasks
- `qwen3-vl-plus` - Vision-language model
- `qwen-max-latest` - Latest Qwen 2.5 Max (alias)
- `qwen-plus-2025-09-11` - Qwen3-Next with sparse MoE

Check the `/v1/models` endpoint for a complete list of available models.

## Features

### OpenAI-Compatible API
- Drop-in replacement for OpenAI API
- Compatible with all OpenAI SDKs
- Standard request/response format

### Automatic Credential Management
- Chrome extension extracts credentials
- Secure database storage
- Automatic expiration tracking
- Complete cookie capture (including WAF cookies)

### Multi-Provider Support
- Multiple AI providers supported
- Provider routing and load balancing
- Fallback mechanisms

### Desktop and Web Compatibility
- Electron desktop app
- Web-based dashboard
- Cross-platform support (macOS, Windows, Linux)

### Session Management
- Automatic session tracking
- Multi-turn conversation support
- Conversation hash for continuity
- Parent message tracking

### Token Usage Reporting
- Accurate token counting
- Per-request usage statistics
- Historical usage tracking

## Important Technical Details

### SSE Response Format
Qwen's API always returns responses in Server-Sent Events (SSE) format, even for non-streaming requests. The proxy handles this automatically by:
- Parsing SSE data chunks
- Accumulating content from delta updates
- Extracting parent_id and message_id
- Converting to standard OpenAI JSON format

### Cookie Requirements
The Chrome extension captures ALL cookies from `.qwen.ai` domain, including:
- `token` - JWT authentication token
- `bx-umidtoken` - Additional auth token
- `acw_tc` - Aliyun WAF cookie
- `tfstk` - Tracking cookie
- `isg` - Security cookie
- `ssxmod_itna`, `ssxmod_itna2` - Session cookies
- Other session/tracking cookies

All these cookies are required for Qwen's Web Application Firewall to accept requests.

### Database Schema
The proxy uses SQLite for persistence with the following key tables:
- `qwen_credentials` - Stores authentication tokens and cookies
- `sessions` - Tracks conversation sessions
- `requests` - Logs API requests
- `responses` - Logs API responses
- `models` - Available AI models
- `providers` - AI provider configurations

## Troubleshooting

### Empty Response Content
If you get responses with empty content:
- Verify credentials are loaded (check Home page status)
- Ensure all cookies were extracted by the Chrome extension
- Check backend logs for SSE parsing errors
- Restart the proxy servers

### CAPTCHA Errors
If you see "missing chat ID" errors:
- Re-authenticate using the Chrome extension
- Ensure you're logged into chat.qwen.ai
- Check that all cookies are being captured (not just token)

### Database Errors
If you see "no such column" errors:
- Check database schema is up to date
- Run migrations if needed
- Verify database file exists and is accessible

### Connection Errors
If the proxy won't start:
- Check ports 3000-3002 are available
- Verify Node.js is installed
- Check backend logs for startup errors
- Ensure database directory is writable

## Additional Resources

### Documentation
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Qwen Documentation](https://help.aliyun.com/zh/dashscope/)
- [Electron Documentation](https://www.electronjs.org/docs)

### Project Documentation
- [Architecture Guide](./26_BACKEND_ARCHITECTURE_GUIDE.md)
- [Implementation Plan](./45_IMPLEMENTATION_PLAN.md)
- [Phase Documentation](./01_PHASE_1_PROJECT_STRUCTURE.md)

### Support
- [GitHub Issues](https://github.com/ChrisColeTech/qwen_proxy_poc/issues)
- [Discussions](https://github.com/ChrisColeTech/qwen_proxy_poc/discussions)
