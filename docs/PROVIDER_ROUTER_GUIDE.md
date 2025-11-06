# Provider Router System Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Available Providers](#available-providers)
4. [Configuration](#configuration)
5. [Switching Providers](#switching-providers)
6. [API Reference](#api-reference)
7. [Code Examples](#code-examples)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Provider Router is a lightweight HTTP proxy that provides a unified OpenAI-compatible API interface while routing requests to different LLM providers. It enables seamless switching between different AI backends without requiring code changes or server restarts.

### Key Features

- **Unified API**: OpenAI-compatible interface works with any provider
- **Dynamic Configuration**: Database-driven provider management
- **Multiple Providers**: Support for LM Studio, Qwen Proxy, and Qwen Direct API
- **Hot Switching**: Change providers without restarting the server
- **Provider Abstraction**: Test different backends with the same client code
- **Request Logging**: Complete audit trail stored in SQLite database
- **Health Monitoring**: Built-in health checks for all providers

### Why Use the Provider Router?

- **Testing**: Compare different LLM backends with identical test cases
- **Development**: Switch between local and cloud providers easily
- **Flexibility**: Try different models without changing client code
- **Reliability**: Automatic health checks and failover support
- **Observability**: Built-in logging and metrics for all requests

---

## Architecture

```
┌─────────────────────┐
│   Client Application │
│  (any OpenAI client) │
└──────────┬──────────┘
           │ HTTP/JSON
           ↓
┌──────────────────────────────────┐
│   Provider Router (port 3001)    │
│  ┌────────────────────────────┐  │
│  │   OpenAI-Compatible API    │  │
│  └─────────────┬──────────────┘  │
│                ↓                  │
│  ┌────────────────────────────┐  │
│  │    Provider Router Logic   │  │
│  │  - Route by active provider│  │
│  │  - Transform requests      │  │
│  │  - Transform responses     │  │
│  └─────────────┬──────────────┘  │
│                ↓                  │
│  ┌────────────────────────────┐  │
│  │    Provider Registry       │  │
│  │  - Load from database      │  │
│  │  - Manage instances        │  │
│  └─────────────┬──────────────┘  │
│                ↓                  │
│  ┌────────────────────────────┐  │
│  │   SQLite Database          │  │
│  │  - Provider configs        │  │
│  │  - Active provider setting │  │
│  │  - Request/response logs   │  │
│  └────────────────────────────┘  │
└────────┬────────┬─────────┬──────┘
         │        │         │
    ┌────┴───┐ ┌─┴────┐ ┌──┴─────┐
    │LM Studio│ │Qwen  │ │Qwen    │
    │  Local  │ │Proxy │ │Direct  │
    │ Server  │ │Server│ │  API   │
    └─────────┘ └──────┘ └────────┘
```

### Key Components

1. **Provider Router**: Routes requests to the appropriate provider based on active configuration
2. **Provider Registry**: Manages provider instances loaded from the database
3. **Provider Factory**: Creates provider instances based on type and configuration
4. **Settings Service**: Manages the active provider selection
5. **Database**: Stores provider configurations, settings, and request logs

---

## Available Providers

The Provider Router supports three types of providers:

### 1. LM Studio (`lm-studio`)

Local LLM server running on your machine or network.

**Features:**
- Chat completions
- Streaming responses
- Tool calling (if model supports)
- Model listing

**Configuration:**
- `baseURL`: LM Studio API endpoint (e.g., `http://localhost:1234/v1`)
- `timeout`: Request timeout in milliseconds (default: 120000)
- `defaultModel`: Default model if not specified (optional)

**Use Cases:**
- Local development
- Privacy-sensitive applications
- Testing without API costs
- Offline usage

### 2. Qwen Proxy (`qwen-proxy`)

Proxy server that connects to Qwen's API with XML tool transformation.

**Features:**
- Chat completions
- Streaming responses
- Tool calling with XML transformations
- Model listing

**Configuration:**
- `baseURL`: Qwen Proxy endpoint (e.g., `http://localhost:3000`)
- `timeout`: Request timeout in milliseconds (default: 120000)

**Use Cases:**
- Tool calling with Qwen models
- XML-based function calling
- Managed Qwen access

### 3. Qwen Direct (`qwen-direct`)

Direct connection to Qwen's API with authentication.

**Features:**
- Chat completions
- Streaming responses
- Session management
- Model listing

**Configuration:**
- `token`: Qwen API token (bx-umidtoken)
- `cookies`: Qwen API cookies
- `baseURL`: Qwen API endpoint (default: `https://chat.qwen.ai`)
- `timeout`: Request timeout in milliseconds (default: 120000)
- `expiresAt`: Token expiration timestamp (optional)

**Use Cases:**
- Direct Qwen API access
- Production deployments
- Advanced Qwen features

---

## Configuration

### Database-Driven Configuration

All provider configuration is stored in a SQLite database at `backend/provider-router/data/provider-router.db`. This enables dynamic configuration changes without server restarts.

### Provider Structure

Each provider has the following properties:

```javascript
{
  id: "provider-id",              // Unique identifier (slug format)
  name: "Display Name",           // Human-readable name
  type: "lm-studio",              // Provider type
  enabled: true,                  // Enable/disable status
  priority: 10,                   // Routing priority (higher = preferred)
  description: "Description",     // Optional description
  config: {                       // Provider-specific configuration
    baseURL: "http://localhost:1234/v1",
    timeout: 120000,
    defaultModel: "qwen3-max"
  }
}
```

### Active Provider Setting

The active provider is stored in the `settings` table with key `active_provider`. This determines which provider receives requests.

```sql
SELECT value FROM settings WHERE key = 'active_provider';
-- Returns: "lm-studio-default"
```

### Environment Variables (Legacy)

Legacy `.env` configuration is still supported but deprecated. Use `provider-cli migrate` to migrate from environment variables to database.

---

## Switching Providers

### Method 1: Using the CLI (Recommended)

The CLI tool provides the easiest way to switch providers:

```bash
# Check current provider status
npx provider-cli status

# List available providers
npx provider-cli provider list

# Switch to a different provider
npx provider-cli set qwen-proxy-default

# Verify the change
npx provider-cli status
```

**Note:** The CLI directly updates the database setting. Changes take effect immediately for new requests.

### Method 2: Direct Database Update

You can update the active provider directly in the database:

```bash
# Using sqlite3 CLI
sqlite3 backend/provider-router/data/provider-router.db \
  "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"
```

**Note:** The server reads the active provider from the database on each request, so changes take effect immediately.

### Method 3: Settings API (Limited)

The Settings API currently has validation restrictions. The `active_provider` setting can be read but not updated through the API:

```bash
# Read current active provider
curl http://localhost:3001/v1/settings | jq '.settings.active_provider'
```

For programmatic switching, use the database directly or the CLI.

### Verification

After switching providers, verify the change:

```bash
# Check active provider
curl http://localhost:3001/v1/settings | jq '.settings.active_provider'

# Test with a chat completion
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

---

## API Reference

### Provider Management

#### List All Providers

**Endpoint:** `GET /v1/providers`

**Query Parameters:**
- `type` (optional): Filter by provider type (`lm-studio`, `qwen-proxy`, `qwen-direct`)
- `enabled` (optional): Filter by enabled status (`true` or `false`)

**Response:**
```json
{
  "providers": [
    {
      "id": "lm-studio-default",
      "name": "LM Studio Default",
      "type": "lm-studio",
      "enabled": true,
      "priority": 10,
      "description": "Default LM Studio provider instance",
      "created_at": 1762087046238,
      "updated_at": 1762087046238,
      "runtime_status": "loaded"
    }
  ],
  "total": 1
}
```

#### Get Provider Details

**Endpoint:** `GET /v1/providers/:id`

**Parameters:**
- `id`: Provider ID

**Response:**
```json
{
  "id": "lm-studio-default",
  "name": "LM Studio Default",
  "type": "lm-studio",
  "enabled": true,
  "priority": 10,
  "description": "Default LM Studio provider instance",
  "created_at": 1762087046238,
  "updated_at": 1762087046238,
  "config": {
    "baseURL": "http://localhost:1234/v1",
    "timeout": 120000,
    "defaultModel": "qwen3-max"
  },
  "models": [
    {
      "id": "qwen3-max",
      "name": "Qwen3 Max",
      "description": "High performance model",
      "capabilities": "[\"chat\",\"completion\",\"tools\"]",
      "is_default": false
    }
  ],
  "runtime_status": "loaded"
}
```

#### Enable Provider

**Endpoint:** `POST /v1/providers/:id/enable`

**Parameters:**
- `id`: Provider ID

**Response:**
```json
{
  "id": "lm-studio-default",
  "name": "LM Studio Default",
  "enabled": true,
  "message": "Provider enabled"
}
```

#### Disable Provider

**Endpoint:** `POST /v1/providers/:id/disable`

**Parameters:**
- `id`: Provider ID

**Response:**
```json
{
  "id": "lm-studio-default",
  "name": "LM Studio Default",
  "enabled": false,
  "message": "Provider disabled"
}
```

#### Test Provider Connection

**Endpoint:** `POST /v1/providers/:id/test`

**Parameters:**
- `id`: Provider ID

**Response:**
```json
{
  "provider_id": "lm-studio-default",
  "healthy": true,
  "duration_ms": 5,
  "timestamp": 1762449326131
}
```

#### Reload Provider

**Endpoint:** `POST /v1/providers/:id/reload`

**Parameters:**
- `id`: Provider ID

Reloads provider configuration from database.

**Response:**
```json
{
  "provider_id": "lm-studio-default",
  "name": "LM Studio Default",
  "type": "lm-studio",
  "message": "Provider reloaded successfully",
  "timestamp": 1762449326131
}
```

### Chat Completions

#### Create Chat Completion

**Endpoint:** `POST /v1/chat/completions`

OpenAI-compatible chat completions endpoint. Routes to the active provider.

**Request:**
```json
{
  "model": "qwen3-max",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

### Model Management

#### List Models

**Endpoint:** `GET /v1/models`

**Query Parameters:**
- `provider` (optional): Get models from specific provider

Lists models from the active provider (or specified provider).

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "owned_by": "organization_owner"
    },
    {
      "id": "qwen3-coder-plus",
      "object": "model",
      "owned_by": "organization_owner"
    }
  ]
}
```

### Settings Management

#### Get All Settings

**Endpoint:** `GET /v1/settings`

**Query Parameters:**
- `category` (optional): Filter by category (`server`, `logging`, `system`, `provider`)

**Response:**
```json
{
  "settings": {
    "server.port": "3001",
    "server.host": "0.0.0.0",
    "server.timeout": "120000.0",
    "logging.level": "info",
    "active_provider": "lm-studio-default"
  },
  "category": "all"
}
```

#### Get Specific Setting

**Endpoint:** `GET /v1/settings/:key`

**Parameters:**
- `key`: Setting key (e.g., `server.port`)

**Response:**
```json
{
  "key": "server.port",
  "value": "3001",
  "category": "server",
  "requiresRestart": true,
  "isDefault": false
}
```

### Health Check

#### Server Health

**Endpoint:** `GET /health`

Returns server health and status of all providers.

**Response:**
```json
{
  "status": "ok",
  "providers": {
    "LM Studio Default": {
      "status": "healthy",
      "baseURL": "http://localhost:1234/v1"
    },
    "Qwen Proxy Default": {
      "status": "healthy",
      "baseURL": "http://localhost:3000"
    }
  },
  "registeredProviders": [
    "lm-studio-default",
    "qwen-proxy-default"
  ]
}
```

---

## Code Examples

### JavaScript/Node.js

#### List Providers

```javascript
async function listProviders() {
  const response = await fetch('http://localhost:3001/v1/providers');
  const data = await response.json();

  console.log(`Found ${data.total} providers:`);
  data.providers.forEach(provider => {
    console.log(`- ${provider.name} (${provider.type}): ${provider.enabled ? 'enabled' : 'disabled'}`);
  });

  return data.providers;
}

// Usage
const providers = await listProviders();
```

#### Get Active Provider

```javascript
async function getActiveProvider() {
  const response = await fetch('http://localhost:3001/v1/settings');
  const data = await response.json();

  const activeProvider = data.settings.active_provider;
  console.log(`Active provider: ${activeProvider}`);

  return activeProvider;
}

// Usage
const active = await getActiveProvider();
```

#### Enable/Disable Provider

```javascript
async function setProviderStatus(providerId, enabled) {
  const endpoint = enabled ? 'enable' : 'disable';
  const response = await fetch(
    `http://localhost:3001/v1/providers/${providerId}/${endpoint}`,
    { method: 'POST' }
  );

  const data = await response.json();
  console.log(`Provider ${providerId}: ${data.message}`);

  return data;
}

// Usage
await setProviderStatus('lm-studio-default', false); // Disable
await setProviderStatus('qwen-proxy-default', true);  // Enable
```

#### Test Provider Connection

```javascript
async function testProvider(providerId) {
  const response = await fetch(
    `http://localhost:3001/v1/providers/${providerId}/test`,
    { method: 'POST' }
  );

  const data = await response.json();

  if (data.healthy) {
    console.log(`✓ Provider ${providerId} is healthy (${data.duration_ms}ms)`);
  } else {
    console.log(`✗ Provider ${providerId} is unhealthy`);
  }

  return data;
}

// Usage
await testProvider('lm-studio-default');
```

#### Send Chat Completion

```javascript
async function sendChatCompletion(messages, options = {}) {
  const response = await fetch('http://localhost:3001/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'qwen3-max',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 150,
      stream: false
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  console.log('Response:', content);
  return data;
}

// Usage
await sendChatCompletion([
  { role: 'user', content: 'What is the capital of France?' }
]);
```

#### Complete Provider Management Workflow

```javascript
async function switchProviderWorkflow(newProviderId) {
  console.log('Starting provider switch workflow...\n');

  // 1. Get current active provider
  const currentActive = await getActiveProvider();
  console.log(`Current active: ${currentActive}\n`);

  // 2. List all available providers
  const providers = await listProviders();
  console.log();

  // 3. Check if target provider exists and is enabled
  const targetProvider = providers.find(p => p.id === newProviderId);
  if (!targetProvider) {
    throw new Error(`Provider ${newProviderId} not found`);
  }

  if (!targetProvider.enabled) {
    console.log(`Provider ${newProviderId} is disabled. Enabling...\n`);
    await setProviderStatus(newProviderId, true);
  }

  // 4. Test target provider health
  const health = await testProvider(newProviderId);
  if (!health.healthy) {
    throw new Error(`Provider ${newProviderId} is not healthy`);
  }
  console.log();

  // 5. Switch provider (via CLI or database)
  console.log(`Note: Use CLI to switch: npx provider-cli set ${newProviderId}`);
  console.log('Or update database directly.\n');

  // 6. Verify with a test request
  console.log('Testing with chat completion...');
  await sendChatCompletion([
    { role: 'user', content: 'Say "test successful" if you can read this.' }
  ]);

  console.log('\nProvider switch workflow completed!');
}

// Usage
await switchProviderWorkflow('qwen-proxy-default');
```

### Python

#### List Providers

```python
import requests
import json

def list_providers():
    response = requests.get('http://localhost:3001/v1/providers')
    data = response.json()

    print(f"Found {data['total']} providers:")
    for provider in data['providers']:
        status = 'enabled' if provider['enabled'] else 'disabled'
        print(f"- {provider['name']} ({provider['type']}): {status}")

    return data['providers']

# Usage
providers = list_providers()
```

#### Get Active Provider

```python
def get_active_provider():
    response = requests.get('http://localhost:3001/v1/settings')
    data = response.json()

    active_provider = data['settings']['active_provider']
    print(f"Active provider: {active_provider}")

    return active_provider

# Usage
active = get_active_provider()
```

#### Enable/Disable Provider

```python
def set_provider_status(provider_id, enabled):
    endpoint = 'enable' if enabled else 'disable'
    url = f'http://localhost:3001/v1/providers/{provider_id}/{endpoint}'

    response = requests.post(url)
    data = response.json()

    print(f"Provider {provider_id}: {data['message']}")
    return data

# Usage
set_provider_status('lm-studio-default', False)  # Disable
set_provider_status('qwen-proxy-default', True)   # Enable
```

#### Test Provider Connection

```python
def test_provider(provider_id):
    url = f'http://localhost:3001/v1/providers/{provider_id}/test'
    response = requests.post(url)
    data = response.json()

    if data['healthy']:
        print(f"✓ Provider {provider_id} is healthy ({data['duration_ms']}ms)")
    else:
        print(f"✗ Provider {provider_id} is unhealthy")

    return data

# Usage
test_provider('lm-studio-default')
```

#### Send Chat Completion

```python
def send_chat_completion(messages, model='qwen3-max', **options):
    url = 'http://localhost:3001/v1/chat/completions'

    payload = {
        'model': model,
        'messages': messages,
        'temperature': options.get('temperature', 0.7),
        'max_tokens': options.get('max_tokens', 150),
        'stream': False
    }

    response = requests.post(url, json=payload)
    data = response.json()

    content = data['choices'][0]['message']['content']
    print(f"Response: {content}")

    return data

# Usage
send_chat_completion([
    {'role': 'user', 'content': 'What is the capital of France?'}
])
```

### cURL

#### List Providers

```bash
# List all providers
curl http://localhost:3001/v1/providers | jq .

# Filter by type
curl 'http://localhost:3001/v1/providers?type=lm-studio' | jq .

# Filter by enabled status
curl 'http://localhost:3001/v1/providers?enabled=true' | jq .
```

#### Get Provider Details

```bash
curl http://localhost:3001/v1/providers/lm-studio-default | jq .
```

#### Get Active Provider

```bash
curl http://localhost:3001/v1/settings | jq '.settings.active_provider'
```

#### Enable/Disable Provider

```bash
# Disable provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-default/disable | jq .

# Enable provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-default/enable | jq .
```

#### Test Provider Connection

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-default/test | jq .
```

#### Send Chat Completion

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }' | jq .
```

#### Check Server Health

```bash
curl http://localhost:3001/health | jq .
```

#### Get All Settings

```bash
# All settings
curl http://localhost:3001/v1/settings | jq .

# Server settings only
curl 'http://localhost:3001/v1/settings?category=server' | jq .
```

---

## Testing

### Running Integration Tests

The provider router includes comprehensive integration tests:

```bash
# Run all tests
cd backend/provider-router
npm test

# Run provider switching tests specifically
node --test tests/integration/provider-switching.test.js
```

### Test Coverage

The integration tests verify:

- **Provider Management**: List, get, filter providers
- **Provider Status**: Enable, disable, and verify status changes
- **Health Checks**: Test provider connections and overall server health
- **Active Provider**: Get current active provider and verify routing
- **Model Listing**: List models from providers and database
- **Configuration**: Get provider configuration
- **Error Handling**: 404 responses for non-existent providers
- **Provider Types**: Support for multiple provider types

### Manual Testing

#### Test Provider Switching

```bash
# 1. Check current status
npx provider-cli status

# 2. List available providers
npx provider-cli provider list

# 3. Switch to different provider
npx provider-cli set qwen-proxy-default

# 4. Verify the switch
curl http://localhost:3001/v1/settings | jq '.settings.active_provider'

# 5. Test with chat completion
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 20
  }' | jq '.choices[0].message.content'
```

#### Test Provider Health

```bash
# Test all providers
for provider in lm-studio-default qwen-proxy-default; do
  echo "Testing $provider..."
  curl -X POST "http://localhost:3001/v1/providers/$provider/test" | jq .
done
```

#### Test Provider Enable/Disable

```bash
# Disable provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-default/disable | jq .

# Verify disabled
curl http://localhost:3001/v1/providers/lm-studio-default | jq '.enabled'

# Enable provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-default/enable | jq .

# Verify enabled
curl http://localhost:3001/v1/providers/lm-studio-default | jq '.enabled'
```

---

## Troubleshooting

### Provider Not Found

**Problem:** CLI or API returns "Provider not found"

**Solutions:**
1. Check provider exists in database:
   ```bash
   npx provider-cli provider list
   ```

2. Verify provider ID is correct (use exact ID from list)

3. Check if provider is loaded in runtime:
   ```bash
   curl http://localhost:3001/health | jq '.registeredProviders'
   ```

4. Reload provider if it exists in database but not loaded:
   ```bash
   curl -X POST http://localhost:3001/v1/providers/PROVIDER_ID/reload
   ```

### Provider Not Healthy

**Problem:** Provider health check fails

**Solutions:**

1. **For LM Studio:**
   - Verify LM Studio is running
   - Check baseURL is correct: `http://localhost:1234/v1`
   - Ensure LM Studio is listening on 0.0.0.0 (not just 127.0.0.1)
   - Test direct connection:
     ```bash
     curl http://localhost:1234/v1/models
     ```

2. **For Qwen Proxy:**
   - Verify Qwen Proxy is running on port 3000
   - Check baseURL is correct: `http://localhost:3000`
   - Test direct connection:
     ```bash
     curl http://localhost:3000/health
     ```

3. **For Qwen Direct:**
   - Verify credentials are set in database
   - Check token hasn't expired
   - Test API access directly

### Active Provider Not Changing

**Problem:** Setting active provider doesn't take effect

**Solutions:**

1. **Using CLI:**
   ```bash
   npx provider-cli set PROVIDER_ID
   ```

2. **Direct database update:**
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db \
     "UPDATE settings SET value = 'PROVIDER_ID' WHERE key = 'active_provider';"
   ```

3. **Verify change:**
   ```bash
   curl http://localhost:3001/v1/settings | jq '.settings.active_provider'
   ```

4. **Note:** The server reads active provider from database on each request, so changes take effect immediately without restart.

### Connection Refused

**Problem:** Cannot connect to provider router

**Solutions:**

1. Check if server is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verify port is correct (default: 3001)

3. Check server logs for errors:
   ```bash
   tail -f backend/provider-router/logs/provider-router.log
   ```

4. Start server if not running:
   ```bash
   cd backend/provider-router
   npm start
   ```

### Provider Disabled

**Problem:** Cannot use provider because it's disabled

**Solutions:**

1. Enable the provider:
   ```bash
   curl -X POST http://localhost:3001/v1/providers/PROVIDER_ID/enable
   ```

2. Or via CLI:
   ```bash
   npx provider-cli provider enable PROVIDER_ID
   ```

3. Verify enabled:
   ```bash
   curl http://localhost:3001/v1/providers/PROVIDER_ID | jq '.enabled'
   ```

### Timeout Errors

**Problem:** Requests timeout

**Solutions:**

1. Check provider timeout setting:
   ```bash
   curl http://localhost:3001/v1/providers/PROVIDER_ID | jq '.config.timeout'
   ```

2. Increase timeout if needed (via database or config update)

3. Verify backend provider is responding:
   - Test LM Studio directly: `curl http://localhost:1234/v1/models`
   - Test Qwen Proxy directly: `curl http://localhost:3000/health`

4. Check network connectivity between provider router and backend

### Database Errors

**Problem:** SQLite database errors

**Solutions:**

1. Check database file exists:
   ```bash
   ls -lh backend/provider-router/data/provider-router.db
   ```

2. Verify database permissions:
   ```bash
   chmod 644 backend/provider-router/data/provider-router.db
   ```

3. Check database integrity:
   ```bash
   sqlite3 backend/provider-router/data/provider-router.db "PRAGMA integrity_check;"
   ```

4. If corrupted, restore from backup or reinitialize:
   ```bash
   cd backend/provider-router
   rm data/provider-router.db
   npm start  # Will recreate database
   npx provider-cli migrate  # If migrating from .env
   ```

### Model Not Found

**Problem:** Requested model not available

**Solutions:**

1. List available models:
   ```bash
   curl http://localhost:3001/v1/models | jq '.data[].id'
   ```

2. Sync models from providers:
   ```bash
   curl -X POST http://localhost:3001/v1/models/sync
   ```

3. Check model is loaded in backend provider:
   - For LM Studio: Check loaded models in UI
   - For Qwen: Verify model name is correct

4. Use a different model that's available

### CLI Provider List Empty

**Problem:** `npx provider-cli provider list` shows no providers

**Solutions:**

1. This is expected - CLI loads fresh database connection, providers are loaded at server runtime

2. Use API instead to see runtime providers:
   ```bash
   curl http://localhost:3001/v1/providers | jq .
   ```

3. Or check health endpoint:
   ```bash
   curl http://localhost:3001/health | jq '.registeredProviders'
   ```

4. The CLI is useful for database operations, but API shows runtime state

---

## Additional Resources

### Related Documentation

- [Provider Router README](../backend/provider-router/README.md)
- [API Server Documentation](../backend/api-server/README.md)
- [Test Client Guide](../backend/test-client/README.md)

### Database Schema

The provider router uses SQLite with the following key tables:

- `providers`: Provider definitions (id, name, type, enabled, priority)
- `provider_configs`: Provider configuration key-value pairs
- `provider_models`: Model-provider mappings
- `models`: Model definitions
- `settings`: System settings (including active_provider)
- `requests`: Request history and logs
- `responses`: Response history and logs

### CLI Commands Reference

```bash
# Status and info
provider-cli status              # Show current provider
provider-cli stats               # Show usage statistics
provider-cli history             # Show request history

# Provider management
provider-cli provider list       # List all providers
provider-cli provider add        # Add new provider
provider-cli provider edit ID    # Edit provider
provider-cli provider enable ID  # Enable provider
provider-cli provider disable ID # Disable provider
provider-cli provider test ID    # Test provider health
provider-cli provider remove ID  # Remove provider

# Active provider
provider-cli set ID              # Set active provider

# Model management
provider-cli model list          # List all models
provider-cli model add           # Add new model
provider-cli model link          # Link model to provider

# Migration
provider-cli migrate             # Migrate from .env to database
```

### Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs in `backend/provider-router/logs/`
3. Check database state with `sqlite3 backend/provider-router/data/provider-router.db`
4. Test individual components (LM Studio, Qwen Proxy) independently
5. Review the integration tests for working examples

---

## Summary

The Provider Router system enables flexible AI backend management with:

- **3 supported providers**: LM Studio, Qwen Proxy, Qwen Direct
- **OpenAI-compatible API**: Works with any OpenAI client
- **Dynamic configuration**: Database-driven, no restarts needed
- **Health monitoring**: Built-in health checks and testing
- **Complete API**: Full REST API for all management operations
- **CLI tools**: Easy command-line management
- **Comprehensive logging**: All requests tracked in database

Use this guide to understand, configure, and troubleshoot the provider router system in your Qwen Proxy POC deployment.
