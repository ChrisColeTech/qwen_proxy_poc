# Testing Guide

Complete guide for testing the Qwen Proxy system, including provider routing, switching, and validation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Starting the System](#starting-the-system)
3. [Testing the Provider Router](#testing-the-provider-router)
4. [Switching Providers](#switching-providers)
5. [Testing Individual Providers](#testing-individual-providers)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required

1. **Node.js** installed (v18 or higher)
2. **SQLite3** CLI tool installed
3. **curl** or another HTTP client
4. **jq** (optional, for JSON formatting)

### Optional

- **LM Studio** running locally on port 1234 (for testing LM Studio provider)
- **Qwen credentials** configured (for testing qwen-proxy provider)

### Verify Prerequisites

```bash
# Check Node.js
node --version  # Should be v18+

# Check SQLite3
sqlite3 --version

# Check curl
curl --version

# Check jq (optional)
jq --version

# Check LM Studio (optional)
curl -s http://localhost:1234/v1/models | jq .
```

## Starting the System

The provider router automatically starts both the qwen-proxy server and itself when started.

### Method 1: Using API Server (Recommended)

Start the API server first:

```bash
cd /Users/chris/Projects/qwen_proxy_poc
npm run dev:backend
```

Wait for the servers to start (you should see):
```
[INFO] API Server listening on http://localhost:3002
[INFO] Ready to accept management requests
```

Then start the proxy servers via API:

```bash
curl -X POST http://localhost:3002/api/proxy/start | jq .
```

Expected response:
```json
{
  "success": true,
  "status": "starting",
  "providerRouter": {
    "running": true,
    "port": 3001,
    "pid": 12345,
    "uptime": 0
  },
  "qwenProxy": {
    "running": true,
    "port": 3000,
    "pid": 12346,
    "uptime": 0
  },
  "message": "Proxy servers are starting..."
}
```

Wait 3-5 seconds for servers to fully initialize.

### Method 2: Direct Start

Start the provider router directly:

```bash
cd /Users/chris/Projects/qwen_proxy_poc/backend/provider-router
npm run dev
```

This will automatically start:
1. Qwen Proxy on port 3000
2. Provider Router on port 3001

### Verify Servers Are Running

Check health endpoints:

```bash
# Provider Router
curl -s http://localhost:3001/health | jq .

# Qwen Proxy
curl -s http://localhost:3000/health | jq .

# API Server
curl -s http://localhost:3002/api/health | jq .
```

Check proxy status:

```bash
curl -s http://localhost:3002/api/proxy/status | jq .
```

## Testing the Provider Router

The provider router is the main entry point at **port 3001**. All requests should go through the provider router.

### Check Active Provider

```bash
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "SELECT value FROM settings WHERE key = 'active_provider';"
```

### Test Chat Completion

```bash
curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }' | jq .
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1762451254,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

### Test Different Prompts

```bash
# Test math
curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "What is 5+3? Answer with just the number."}
    ]
  }' | jq '.choices[0].message.content'

# Test language
curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Translate hello to Spanish"}
    ]
  }' | jq '.choices[0].message.content'
```

### Test Models Endpoint

```bash
curl -s http://localhost:3001/v1/models | jq '.data[0:3]'
```

## Switching Providers

The system supports multiple providers that can be switched dynamically.

### Available Providers

List all providers:

```bash
curl -s http://localhost:3002/api/providers | jq '.data[] | {id, name, type, enabled}'
```

Typical providers:
- **lm-studio-default**: Local LM Studio instance (port 1234)
- **qwen-proxy-default**: Qwen via proxy server (port 3000)
- **qwen-direct-default**: Direct Qwen API calls (disabled by default)

### Method 1: Using Database (Direct)

```bash
# Switch to LM Studio
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'lm-studio-default' WHERE key = 'active_provider';"

# Switch to Qwen Proxy
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"

# Verify change
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "SELECT value FROM settings WHERE key = 'active_provider';"
```

### Method 2: Using API (Recommended)

```bash
# Switch to LM Studio
curl -s -X PUT http://localhost:3002/api/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio-default"}' | jq .

# Switch to Qwen Proxy
curl -s -X PUT http://localhost:3002/api/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "qwen-proxy-default"}' | jq .
```

### Method 3: Using npm Script

```bash
# Switch to LM Studio
npm run cli -- switch-provider lm-studio-default

# Switch to Qwen Proxy
npm run cli -- switch-provider qwen-proxy-default
```

**Important**: After switching providers, wait 2-3 seconds before sending requests to ensure the change is propagated.

## Testing Individual Providers

### Testing LM Studio Provider

**Prerequisites**: LM Studio must be running with a model loaded on port 1234.

#### 1. Verify LM Studio is Running

```bash
curl -s http://localhost:1234/v1/models | jq .
```

Should return a list of loaded models.

#### 2. Switch to LM Studio Provider

```bash
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'lm-studio-default' WHERE key = 'active_provider';"
```

#### 3. Test via Provider Router

```bash
curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello from LM Studio!"}
    ]
  }' | jq '{content: .choices[0].message.content, model: .model}'
```

#### 4. Verify Routing

Check the backend logs to confirm the request was routed to LM Studio:

```
[INFO] Routing request to provider: lm-studio-default
```

### Testing Qwen Proxy Provider

**Prerequisites**: Qwen credentials must be configured.

#### 1. Verify Qwen Credentials

```bash
curl -s http://localhost:3002/api/qwen/credentials/status | jq .
```

Expected response:
```json
{
  "hasCredentials": true,
  "isValid": true,
  "isExpired": false,
  "expiresAt": 1763052613
}
```

#### 2. Switch to Qwen Proxy Provider

```bash
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"
```

#### 3. Test via Provider Router

```bash
curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello from Qwen!"}
    ]
  }' | jq '{content: .choices[0].message.content, metadata: ._qwen_metadata}'
```

#### 4. Test Direct Qwen Proxy (Optional)

You can also test the qwen-proxy directly on port 3000:

```bash
curl -s http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Direct test"}
    ]
  }' | jq .
```

## Complete Testing Flow

Here's a complete test script that validates the entire system:

```bash
#!/bin/bash

echo "=== Qwen Proxy Testing Flow ==="
echo ""

# 1. Check services
echo "1. Checking services..."
curl -s http://localhost:3001/health > /dev/null && echo "✓ Provider Router healthy" || echo "✗ Provider Router not responding"
curl -s http://localhost:3000/health > /dev/null && echo "✓ Qwen Proxy healthy" || echo "✗ Qwen Proxy not responding"
echo ""

# 2. Test with current provider
echo "2. Testing current provider..."
CURRENT=$(sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db "SELECT value FROM settings WHERE key = 'active_provider';")
echo "Active provider: $CURRENT"
RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Say test"}]}')
CONTENT=$(echo $RESPONSE | jq -r '.choices[0].message.content')
echo "Response: $CONTENT"
echo ""

# 3. Switch to qwen-proxy
echo "3. Switching to qwen-proxy-default..."
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"
sleep 2
RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello Qwen"}]}')
CONTENT=$(echo $RESPONSE | jq -r '.choices[0].message.content')
echo "Qwen response: $CONTENT"
echo ""

# 4. Switch to LM Studio (if available)
echo "4. Switching to lm-studio-default..."
if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
  sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
    "UPDATE settings SET value = 'lm-studio-default' WHERE key = 'active_provider';"
  sleep 2
  RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer any-key" \
    -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello LM Studio"}]}')
  CONTENT=$(echo $RESPONSE | jq -r '.choices[0].message.content')
  echo "LM Studio response: $CONTENT"
else
  echo "⚠ LM Studio not available, skipping"
fi
echo ""

# 5. List models
echo "5. Listing available models..."
curl -s http://localhost:3001/v1/models | jq -r '.data[] | .id' | head -5
echo ""

echo "=== Testing Complete ==="
```

Save this as `test-flow.sh` and run:

```bash
chmod +x test-flow.sh
./test-flow.sh
```

## Troubleshooting

### Provider Router Returns Empty Content

**Symptoms**: Response has `"content": ""` and `"usage": {"prompt_tokens": 0, ...}`

**Solution**: This bug was fixed in qwen-client.js. Ensure you have the latest code:
- The fix extracts the `data` field from Qwen's JSON response
- See commit: "Fix empty content bug in qwen-proxy non-streaming responses"

### Cannot Connect to Provider Router

**Check**:
```bash
# Check if port 3001 is listening
lsof -i :3001

# Check backend logs
tail -f backend/provider-router/logs/*.log
```

**Solution**: Restart the proxy servers:
```bash
curl -X POST http://localhost:3002/api/proxy/start
```

### LM Studio Provider Not Working

**Check**:
```bash
# Verify LM Studio is running
curl -s http://localhost:1234/v1/models | jq .
```

**Common issues**:
1. LM Studio not running → Start LM Studio and load a model
2. Model not loaded → Load a model in LM Studio
3. Wrong port → Check LM Studio settings (default: 1234)

### Qwen Proxy Provider Returns Errors

**Check credentials**:
```bash
curl -s http://localhost:3002/api/qwen/credentials/status | jq .
```

**Common issues**:
1. No credentials → Use Chrome extension to authenticate
2. Expired credentials → Re-authenticate via Chrome extension
3. Missing cookies → Ensure Chrome extension captures all cookies

### Provider Switch Not Working

**Verify the change**:
```bash
sqlite3 /Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db \
  "SELECT key, value FROM settings WHERE key = 'active_provider';"
```

**Check provider router logs**:
```bash
# Look for "Routing request to provider: <provider-id>"
tail -f backend/provider-router/logs/*.log
```

**Solution**: Wait 2-3 seconds after switching providers before sending requests.

### Database Locked Error

**Symptoms**: `SqliteError: database is locked`

**Solution**:
```bash
# Close any open database connections
pkill -f "sqlite3.*provider-router.db"

# Restart the backend
npm run dev:backend
```

## Performance Testing

### Measure Response Time

```bash
time curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"test"}]}' \
  > /dev/null
```

### Load Testing (Simple)

```bash
# Send 10 requests in parallel
for i in {1..10}; do
  curl -s http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer any-key" \
    -d '{"model":"qwen3-max","messages":[{"role":"user","content":"test '$i'"}]}' &
done
wait
echo "All requests completed"
```

## Additional Resources

- [Quick Start Guide](./QUICK_START_GUIDE.md) - Getting started with the system
- [Provider Router Guide](./PROVIDER_ROUTER_GUIDE.md) - Detailed provider documentation
- [Backend Architecture](./26_BACKEND_ARCHITECTURE_GUIDE.md) - System architecture

## Testing Checklist

Use this checklist to verify a complete test cycle:

- [ ] Start API server
- [ ] Start proxy servers via API
- [ ] Verify all services are healthy
- [ ] Check active provider
- [ ] Test chat completion with current provider
- [ ] Test models endpoint
- [ ] Switch to qwen-proxy provider
- [ ] Test qwen-proxy responses
- [ ] Switch to LM Studio provider (if available)
- [ ] Test LM Studio responses
- [ ] Verify provider routing in logs
- [ ] Test error handling (invalid requests)
- [ ] Check database for stored requests/responses

## CI/CD Integration

For automated testing in CI/CD pipelines:

```bash
# Install dependencies
npm install

# Start services in background
npm run dev:backend &
BACKEND_PID=$!

# Wait for services to start
sleep 10

# Run tests
npm test

# Cleanup
kill $BACKEND_PID
```
