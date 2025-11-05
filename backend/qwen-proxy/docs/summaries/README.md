# Qwen Proxy Backend

> OpenAI-compatible proxy server for Qwen AI models

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)](https://github.com/your-repo/qwen-proxy)

---

## Overview

A production-ready OpenAI-compatible proxy server for the Qwen API. This proxy enables you to use Qwen models through the standard OpenAI API format, making it seamless to integrate with existing OpenAI-compatible applications, SDKs, and tools.

### Features

- **OpenAI API Compatibility**
  - `/v1/models` - List available models
  - `/v1/models/{model}` - Retrieve specific model
  - `/v1/chat/completions` - Chat completions (streaming & non-streaming)
  - `/v1/completions` - Legacy completions endpoint

- **Production Features**
  - Multi-turn conversation management with context retention
  - Automatic session handling via parent_id chain
  - Real-time model information from Qwen API (NOT hardcoded)
  - Streaming and non-streaming support
  - Request validation and error handling
  - Retry logic with exponential backoff
  - Health checks and Prometheus metrics
  - Graceful shutdown handling
  - **SQLite persistence** - Automatic request/response tracking and analytics

- **Deployment Options**
  - Docker & Docker Compose
  - PM2 process manager
  - Systemd service
  - Nginx reverse proxy configuration
  - SSL/TLS support

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or yarn
- Valid **Qwen account** at https://chat.qwen.ai
- **Qwen credentials** (see below)

### 1. Get Your Qwen Credentials

You need two pieces of information from your browser:

1. Open https://chat.qwen.ai in Chrome/Firefox
2. Log in to your account
3. Open DevTools (F12) → **Network** tab
4. Send a test message in the chat
5. Find the request to `/api/v2/chat/completions`
6. Copy these headers:
   - `bx-umidtoken` → This is your **QWEN_TOKEN**
   - `Cookie` → This is your **QWEN_COOKIES** (copy entire string)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-repo/qwen-proxy.git
cd qwen-proxy/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Update these values in `.env`:

```bash
QWEN_TOKEN=your-bx-umidtoken-value-here
QWEN_COOKIES=your-complete-cookie-string-here
```

### 3. Validate Configuration

```bash
npm run validate-config
```

Expected output: `Configuration is valid!`

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3000 (or your configured PORT).

### 5. Test the Endpoints

```bash
# Health check
curl http://localhost:3000/health

# List models
curl http://localhost:3000/v1/models

# Chat completion
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## Usage

### With OpenAI SDK (Node.js)

```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key' // Not required but SDK needs something
});

// Chat completion
const response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Explain quantum computing in one sentence.' }
  ]
});

console.log(response.choices[0].message.content);
```

### With OpenAI SDK (Python)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[
        {"role": "user", "content": "Explain quantum computing in one sentence."}
    ]
)

print(response.choices[0].message.content)
```

### Streaming

```javascript
const stream = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Write a poem' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Multi-Turn Conversations

```javascript
const conversation = [
  { role: 'user', content: 'My name is Alice' }
];

// First message
let response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: conversation
});

conversation.push({ role: 'assistant', content: response.choices[0].message.content });
conversation.push({ role: 'user', content: 'What is my name?' });

// Second message - context is maintained
response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: conversation
});

console.log(response.choices[0].message.content); // "Alice"
```

See [examples/](examples/) for more usage examples.

---

## API Documentation

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/models` | GET | List all available models |
| `/v1/models/{model}` | GET | Retrieve specific model details |
| `/v1/chat/completions` | POST | Create chat completion |
| `/v1/completions` | POST | Legacy completions endpoint |
| `/health` | GET | Health check |
| `/metrics` | GET | Prometheus metrics |

### Request Format

#### Chat Completions

```json
{
  "model": "qwen3-max",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Response Format

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

---

## SQLite Persistence

The Qwen Proxy includes built-in SQLite persistence that automatically tracks all API requests and responses. This enables powerful debugging, analytics, and billing capabilities.

### Features

- **Automatic Request/Response Tracking**
  - Every API call is logged to SQLite database
  - Full request and response bodies preserved
  - Token usage and performance metrics captured

- **Session Management**
  - Conversation history maintained
  - Parent ID chain tracking for context
  - Session statistics and analytics

- **CRUD API Endpoints**
  - Query historical requests and responses
  - Get usage statistics and billing data
  - Export session data for analysis

- **Zero Configuration**
  - Database auto-initializes on first run
  - No setup required
  - Works out of the box

### Quick Start

The database is created automatically when you start the server:

```bash
npm start
```

Database location: `./data/qwen_proxy.db`

### Query Your Data

**List sessions:**
```bash
curl http://localhost:3000/v1/sessions
```

**Get usage statistics:**
```bash
curl http://localhost:3000/v1/responses/stats
```

**Get session details:**
```bash
curl http://localhost:3000/v1/sessions/{sessionId}
```

### Available Endpoints

**Sessions:**
- `GET /v1/sessions` - List all sessions
- `GET /v1/sessions/:id` - Get session details
- `GET /v1/sessions/:id/stats` - Get session statistics
- `DELETE /v1/sessions/:id` - Delete session

**Requests:**
- `GET /v1/requests` - List all requests
- `GET /v1/requests/:id` - Get request details
- `GET /v1/sessions/:sessionId/requests` - Get session requests

**Responses:**
- `GET /v1/responses` - List all responses
- `GET /v1/responses/stats` - Get usage statistics
- `GET /v1/responses/:id` - Get response details
- `GET /v1/requests/:requestId/response` - Get request response

### Use Cases

**Debug Conversations:**
```bash
# Find a session and view all requests
SESSION_ID="session_abc123"
curl http://localhost:3000/v1/sessions/$SESSION_ID/requests
```

**Calculate Costs:**
```bash
# Get total token usage
curl http://localhost:3000/v1/responses/stats | jq '.statistics.total_tokens'
```

**Monitor Performance:**
```bash
# Get average response time
curl http://localhost:3000/v1/responses/stats | jq '.statistics.avg_duration_ms'
```

**Export Data:**
```bash
# Export session to JSON
curl http://localhost:3000/v1/sessions/$SESSION_ID > session.json
```

### Database Schema

The database includes four main tables:

- **sessions** - Conversation sessions with parent_id chain
- **requests** - All incoming API requests (OpenAI and Qwen formats)
- **responses** - All API responses with token usage and timing
- **metadata** - Schema version and system information

### Direct Database Access

You can query the database directly using SQLite:

```bash
sqlite3 data/qwen_proxy.db

# Count records
SELECT COUNT(*) FROM sessions;

# Recent sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10;

# Token usage
SELECT SUM(total_tokens) FROM responses;
```

### Maintenance

**Backup database:**
```bash
sqlite3 data/qwen_proxy.db ".backup 'backups/qwen_proxy_backup.db'"
```

**Check database size:**
```bash
ls -lh data/qwen_proxy.db
```

**Vacuum database (reclaim space):**
```bash
sqlite3 data/qwen_proxy.db "VACUUM;"
```

### Configuration

All settings are optional (defaults work great):

```env
# Database location (default: ./data/qwen_proxy.db)
DATABASE_PATH=./data/qwen_proxy.db

# Session timeout (default: 30 minutes)
SESSION_TIMEOUT=1800000

# Enable/disable persistence (default: true)
ENABLE_PERSISTENCE=true

# Enable/disable CRUD endpoints (default: true)
ENABLE_CRUD_API=true
```

### Documentation

- **[Quick Start Guide](QUICK_START_PERSISTENCE.md)** - Get started in 5 minutes
- **[Complete Documentation](SQLITE_PERSISTENCE_COMPLETE.md)** - Comprehensive guide
- **[Integration Tests](tests/integration/sqlite-persistence.test.js)** - Test suite
- **[E2E Test Script](tests/e2e/test-persistence-flow.js)** - Manual testing

### Testing

```bash
# Run integration tests
npm test tests/integration/sqlite-persistence.test.js

# Run E2E test (server must be running)
node tests/e2e/test-persistence-flow.js
```

---

## Deployment

### Docker

```bash
# Build image
docker build -t qwen-proxy .

# Run container
docker run -d \
  --name qwen-proxy \
  -p 3000:3000 \
  --env-file .env.production \
  qwen-proxy
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f qwen-proxy

# Stop services
docker-compose down
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Logs
pm2 logs qwen-proxy
```

### Systemd Service

```bash
# Install service
sudo cp qwen-proxy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable qwen-proxy
sudo systemctl start qwen-proxy

# Check status
sudo systemctl status qwen-proxy
```

### Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/qwen-proxy
sudo ln -s /etc/nginx/sites-available/qwen-proxy /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `QWEN_TOKEN` | **Yes** | - | bx-umidtoken header value |
| `QWEN_COOKIES` | **Yes** | - | Cookie header value |
| `LOG_LEVEL` | No | `info` | Logging level |
| `SESSION_TIMEOUT` | No | `1800000` | Session timeout (ms) |
| `RETRY_MAX_ATTEMPTS` | No | `3` | Max retry attempts |
| `MODELS_CACHE_DURATION` | No | `3600000` | Cache duration (ms) |

See [.env.example](.env.example) for all available options.

---

## Project Structure

```
backend/
├── src/
│   ├── api/                 # Qwen API client and authentication
│   │   ├── qwen-auth.js     # Authentication manager
│   │   ├── qwen-client.js   # HTTP client
│   │   └── qwen-types.js    # Type definitions
│   ├── config/              # Configuration management
│   │   └── index.js         # Centralized config
│   ├── handlers/            # Request handlers
│   │   ├── chat-completion-handler.js
│   │   ├── models-handler.js
│   │   └── health-handler.js
│   ├── middleware/          # Express middleware
│   │   ├── error-handler.js
│   │   └── request-validator.js
│   ├── session/             # Session management
│   │   ├── session-manager.js
│   │   └── session-id-generator.js
│   ├── transform/           # Request/response transformers
│   │   ├── request-transformer.js
│   │   └── response-transformer.js
│   ├── utils/               # Utilities
│   │   ├── logger.js
│   │   ├── metrics.js
│   │   └── retry-handler.js
│   ├── index.js             # Entry point
│   └── server.js            # Express server
├── tests/                   # Test suites
├── examples/                # Usage examples
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
├── Dockerfile               # Docker image
├── docker-compose.yml       # Docker Compose config
├── ecosystem.config.js      # PM2 config
├── nginx.conf               # Nginx config
├── .env.example             # Environment template
└── package.json             # Dependencies
```

---

## How It Works

### Parent ID Chain

The proxy maintains conversation context using Qwen's parent_id chain:

```
Message 1:
  Input:  parent_id = null
  Output: parent_id = "abc123"

Message 2:
  Input:  parent_id = "abc123"  ← Use parent_id from previous response
  Output: parent_id = "def456"

Message 3:
  Input:  parent_id = "def456"
  Output: parent_id = "ghi789"
```

### Session Management

```javascript
// Sessions are tracked per conversation
{
  'conversation-hash': {
    chatId: 'qwen-chat-uuid',
    parentId: 'latest-parent-uuid',
    lastAccessed: timestamp
  }
}
```

### Message Handling

Unlike OpenAI which requires full message history, Qwen only needs:
- The **new message**
- The **parent_id** from the previous response

Qwen maintains context server-side via the parent_id chain.

```javascript
// OpenAI sends: [msg1, msg2, msg3]
// We extract: msg3
// We send to Qwen: msg3 with parent_id from msg2's response
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture.

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Validate Deployment

```bash
# Check configuration and dependencies
node scripts/validate-deployment.js
```

### Performance Benchmark

```bash
# Run performance benchmarks
node scripts/benchmark.js
```

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for complete testing checklist.

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "authentication": "ok",
    "sessions": "ok"
  },
  "metrics": {
    "activeSessions": 5,
    "memoryUsage": { ... }
  }
}
```

### Prometheus Metrics

```bash
curl http://localhost:3000/metrics
```

Metrics include:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Request count
- `qwen_api_calls_total` - Qwen API calls
- `active_sessions` - Active sessions
- `nodejs_heap_size_used_bytes` - Memory usage

---

## Troubleshooting

### Server won't start

**Check credentials:**
```bash
npm run validate-config
```

**Check logs:**
```bash
# PM2
pm2 logs qwen-proxy

# Systemd
sudo journalctl -u qwen-proxy -f

# Docker
docker logs qwen-proxy
```

### API errors

**Verify Qwen connectivity:**
```bash
curl -v https://chat.qwen.ai/api/models \
  -H "Cookie: YOUR_COOKIES"
```

**Common issues:**
- Credentials expired - re-extract from browser
- Network timeout - check internet connection
- Rate limiting - reduce request frequency

See [DEPLOYMENT.md#troubleshooting](DEPLOYMENT.md#troubleshooting) for more.

---

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Code Style

- ESLint configuration included
- Run linter: `npm run lint`
- Format code before committing

### Adding Features

1. Write tests first (TDD approach)
2. Implement feature
3. Update documentation
4. Run full test suite

---

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Testing checklist
- **[examples/](examples/)** - Usage examples

---

## Key Discoveries

This project was built using **Test-Driven Development with real API calls**. Key findings:

✅ **Authentication**
- Requires `bx-umidtoken` header and full `Cookie` header
- User-Agent required to avoid WAF blocks

✅ **Message Handling**
- Only send the NEW message (not full history)
- Qwen maintains context server-side
- Use parent_id chain for context

✅ **Parent ID Chain**
- First message: `parent_id = null`
- Subsequent messages: `parent_id` from previous response
- This is how Qwen tracks conversation context

✅ **Models Endpoint**
- **NOT hardcoded** - calls real Qwen API
- Returns actual model list with capabilities
- Cached to reduce API calls

---

## Performance

Typical metrics (tested with real Qwen API):

- Health check: < 100ms
- Models list (cached): < 500ms
- Chat completion (non-streaming): ~2000ms first chunk
- Concurrent requests (100): No errors
- Memory usage: ~200MB idle, ~500MB under load

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Support

- **Issues**: https://github.com/your-repo/qwen-proxy/issues
- **Documentation**: https://github.com/your-repo/qwen-proxy/wiki
- **Examples**: [examples/](examples/)

---

## Acknowledgments

Built with:
- [Express](https://expressjs.com/)
- [Axios](https://axios-http.com/)
- [Prom-client](https://github.com/siimon/prom-client)
- [Winston](https://github.com/winstonjs/winston)

---

**⚡ Production-ready and battle-tested with real Qwen API calls**
