# Qwen Provider Router

A lightweight HTTP proxy that provides a unified OpenAI-compatible API interface while routing requests to different LLM providers. Now with **database-driven configuration** for dynamic provider management!

## Overview

The Provider Router enables seamless switching between LLM providers without code changes or server restarts. Manage providers through CLI commands or REST API calls.

### Key Features

- **Dynamic Configuration**: Add/edit providers without restarting
- **Multiple Instances**: Run multiple instances of the same provider type
- **Database Persistence**: All settings stored in SQLite
- **OpenAI Compatible**: Drop-in replacement for OpenAI API
- **Provider Abstraction**: Test different backends with same client
- **Request Logging**: Complete audit trail of all requests
- **CLI Management**: Powerful command-line tools
- **REST API**: Full programmatic control

## Purpose

- Test the same client against multiple LLM backends
- Compare LM Studio local models vs Qwen Proxy vs Direct Qwen API
- A/B test different models without client code changes
- Dynamic provider switching and failover
- Provider abstraction for testing and development

## Architecture

```
Test Client (test-client)
         ↓
Provider Router (port 3001) ← You are here
         ↓
    ┌────┴────┬──────────┐
    ↓         ↓          ↓
LM Studio  Qwen Proxy  Qwen API
(192.168.  (localhost  (dashscope.
0.22:1234) :3000)      aliyuncs.com)
         ↓
    SQLite Database
    (Configuration + Logs)
```

## Quick Start

```bash
# Install dependencies
npm install

# Start router (uses database configuration)
npm start

# Migrate from .env to database (optional)
provider-cli migrate
```

Router will listen on http://localhost:3001

### First-Time Setup

For new installations, you can either:

**Option 1: Environment Variables (Legacy)**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Start and migrate
npm start
provider-cli migrate
```

**Option 2: Direct Database Setup (Recommended)**
```bash
# Start server
npm start

# Add providers via CLI
provider-cli provider add \
  --id lm-studio-home \
  --name "LM Studio" \
  --type lm-studio \
  --config baseURL=http://192.168.0.22:1234/v1

# Set as active
provider-cli set lm-studio-home
```

## Configuration

### Database Configuration (New)

Providers are now configured in the database:

```bash
# List providers
provider-cli provider list

# Add new provider
provider-cli provider add \
  --id my-provider \
  --name "My Provider" \
  --type lm-studio \
  --config baseURL=http://localhost:1234/v1

# Update configuration
provider-cli provider edit my-provider \
  --config timeout=180000

# Switch providers
provider-cli set my-provider
```

See [Managing Providers via CLI](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/managing-providers-via-cli.md) for complete guide.

### Environment Variables (Legacy)

Legacy `.env` configuration still supported:

#### Server Settings
- `PORT` - Server port (default: 3001)
- `HOST` - Bind address (default: 0.0.0.0)
- `LOG_LEVEL` - Logging level (default: info)

#### Provider Configuration (Deprecated)
- Use database configuration instead
- Run `provider-cli migrate` to migrate from `.env`

See [Migration Guide](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/migrating-from-env-to-database.md) for migration instructions

## Usage

Point your test client to `http://localhost:3001`:

```bash
# In test client .env
PROXY_BASE_URL=http://localhost:3001
```

The router will automatically route to the configured provider.

### Model-Specific Routing

```bash
# In .env
DEFAULT_PROVIDER=lm-studio
MODEL_MAPPINGS=qwen3-coder:lm-studio,qwen3-max:qwen-proxy
```

Now:
- `qwen3-coder` → LM Studio
- `qwen3-max` → Qwen Proxy
- Other models → LM Studio (default)

## API Endpoints

### Chat Completions

#### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

#### GET /v1/models

List available models (proxied from active provider).

### Provider Management (New)

#### GET /v1/providers

List all providers with filtering options.

#### POST /v1/providers

Create a new provider.

#### GET /v1/providers/:id

Get provider details.

#### PUT /v1/providers/:id

Update provider settings.

#### DELETE /v1/providers/:id

Delete a provider.

#### POST /v1/providers/:id/enable

Enable a provider.

#### POST /v1/providers/:id/disable

Disable a provider.

#### POST /v1/providers/:id/test

Test provider connectivity.

#### POST /v1/providers/:id/reload

Reload provider configuration.

#### GET /v1/providers/:id/config

Get provider configuration.

#### PUT /v1/providers/:id/config

Update provider configuration.

### Model Management (New)

#### GET /v1/models

List all models in database.

#### POST /v1/models

Create a new model.

#### GET /v1/providers/:id/models

Get models for specific provider.

#### POST /v1/providers/:id/models

Link model to provider.

### Health Check

#### GET /health

Server health check endpoint.

#### GET /v1/providers/health

Check health of all providers.

See [API Reference](/mnt/d/Projects/qwen_proxy_opencode/docs/api/provider-management-api.md) for complete documentation.

## Development

```bash
# Watch mode (auto-reload)
npm run dev

# Run tests
npm test
```

## Provider Support

### LM Studio
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling (if model supports)
- ✅ Model listing

### Qwen Proxy
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling (with XML transformation)
- ✅ Model listing

### Qwen Direct API
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling
- ✅ Model listing

### Generic OpenAI-Compatible Providers
- ✅ Automatic fallback for unknown provider types
- ✅ Supports any OpenAI-compatible API (OpenRouter, Together, Groq, etc.)
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling
- ✅ Model listing
- ✅ Optional API key authentication
- ✅ Custom headers support

**Examples of supported providers:**
- OpenRouter (`openrouter.ai`)
- Together AI (`api.together.xyz`)
- Groq (`api.groq.com`)
- Perplexity (`api.perplexity.ai`)
- Any other OpenAI-compatible API

**Adding a generic provider:**
```bash
# Example: Adding OpenRouter
provider-cli provider add \
  --id openrouter \
  --name "OpenRouter" \
  --type openrouter \
  --config baseURL=https://openrouter.ai/api/v1 \
  --config apiKey=your-api-key-here

# Example: Adding Together AI
provider-cli provider add \
  --id together \
  --name "Together AI" \
  --type together \
  --config baseURL=https://api.together.xyz/v1 \
  --config apiKey=your-api-key-here
```

## Troubleshooting

**Connection refused to LM Studio:**
- Ensure LM Studio server is running
- Check `LM_STUDIO_BASE_URL` is correct
- Verify LM Studio is listening on 0.0.0.0 (not just 127.0.0.1)

**Tool calling not working:**
- Check if model supports tool calling
- Qwen models require tool definitions in specific format
- Review provider-specific transformations

**Timeout errors:**
- Increase `REQUEST_TIMEOUT` in .env
- Check backend provider is responding
- Review backend logs for errors

## CLI Management

The provider router includes a powerful CLI tool for managing providers without editing files or restarting the server.

### Quick Examples

```bash
# Show current provider status
provider-cli status

# List all providers
provider-cli provider list

# Add new provider
provider-cli provider add \
  --id lm-studio-gpu \
  --name "LM Studio GPU" \
  --type lm-studio \
  --config baseURL=http://192.168.0.50:1234/v1

# Update configuration (no restart!)
provider-cli provider edit lm-studio-gpu \
  --config timeout=240000

# Switch active provider
provider-cli set lm-studio-gpu

# Test connectivity
provider-cli provider test lm-studio-gpu

# View request history
provider-cli history --limit 20

# Show usage statistics
provider-cli stats
```

### CLI Commands

#### Basic Commands
- `status` - Show current active provider and configuration
- `set <provider-id>` - Change active provider (no restart required)
- `list` (alias: `ls`) - List all registered providers
- `test [provider-id]` - Test provider connectivity
- `history` - View request/response history
- `stats` - Show usage statistics

#### Provider Management Commands (New)
- `provider list` - List all providers with details
- `provider add` - Create a new provider
- `provider edit <id>` - Update provider settings
- `provider remove <id>` - Delete a provider
- `provider enable <id>` - Enable a provider
- `provider disable <id>` - Disable a provider
- `provider test <id>` - Test provider health
- `provider reload <id>` - Reload provider configuration
- `provider config <id>` - View provider configuration

#### Model Management Commands (New)
- `model list` - List all models
- `model add` - Create a new model
- `model link <provider-id> <model-id>` - Link model to provider
- `model unlink <provider-id> <model-id>` - Unlink model

#### Migration Command (New)
- `migrate` - Migrate from .env to database configuration

See [CLI Guide](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/managing-providers-via-cli.md) for complete reference.

## Database

All settings and request/response logs are stored in a SQLite database:

- **Location**: `data/provider-router.db`
- **Settings**: Active provider persists across restarts
- **Request Logs**: Complete audit trail of all requests/responses
- **Analytics**: Query historical data for analysis

### Database Features

- Provider selection persists across restarts
- Full request/response logging for debugging
- Performance metrics (duration, status codes)
- Provider usage statistics
- SQL queries for custom analytics

## Testing

### Quick Test

```bash
# Test router is working
curl http://localhost:3001/health

# Test LM Studio connection
curl http://localhost:3001/v1/models

# Test chat completion
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Running Tests

The project includes comprehensive integration tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/integration/database.test.js
npm test tests/integration/cli.test.js
npm test tests/integration/provider-router.test.js
```

### Test Coverage

**Database Tests** (`tests/integration/database.test.js`):
- SettingsService CRUD operations
- LogsService request/response logging
- Database constraints and integrity
- Performance and concurrency

**CLI Tests** (`tests/integration/cli.test.js`):
- All CLI commands (status, set, list, test, history, stats)
- Command options and arguments
- Error handling and validation
- Output formatting

**End-to-End Tests** (`tests/integration/provider-router.test.js`):
- Full workflow: request → database log → CLI query
- Request logging accuracy
- Response capture and storage
- Statistical queries and analytics
- Database performance under load

### Test Database

Tests use a separate test database (`data/test/test.db`) to avoid corrupting real data. The test database is automatically created and cleaned up.

**Note**: End-to-end tests require the server to be running on port 3001. Some tests will skip if the server is not available.

For detailed testing documentation, see `tests/README.md`.

## New Features

### Database-Driven Configuration

All provider configuration is now stored in SQLite database, enabling:

- **Runtime configuration changes** - No server restart required
- **Multiple provider instances** - Run multiple LM Studio servers
- **Dynamic switching** - Change providers on the fly
- **Configuration history** - Track all changes
- **Sensitive data protection** - Mask API keys in responses

### Provider Management API

Complete REST API for managing providers:

```bash
# Create provider
curl -X POST http://localhost:3001/v1/providers \
  -H "Content-Type: application/json" \
  -d '{"id": "my-provider", "name": "My Provider", "type": "lm-studio", ...}'

# Update configuration
curl -X PATCH http://localhost:3001/v1/providers/my-provider/config/timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "240000"}'

# Test health
curl -X POST http://localhost:3001/v1/providers/my-provider/test
```

### Enhanced CLI

Powerful command-line management:

```bash
# Complete provider lifecycle management
provider-cli provider add/edit/remove/enable/disable/test/reload

# Model management
provider-cli model add/link/unlink

# Migration tool
provider-cli migrate
```

### Request Logging

All requests logged to database with:

- Full request/response bodies
- Duration metrics
- Provider information
- Error details

### Model Management

Define and map models to providers:

- Create custom model definitions
- Link models to multiple providers
- Set default models per provider
- Query models by capability

## Documentation

### User Guides

- [Migrating from ENV to Database](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/migrating-from-env-to-database.md)
- [Managing Providers via CLI](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/managing-providers-via-cli.md)
- [Managing Providers via API](/mnt/d/Projects/qwen_proxy_opencode/docs/guides/managing-providers-via-api.md)

### API Reference

- [Provider Management API](/mnt/d/Projects/qwen_proxy_opencode/docs/api/provider-management-api.md)

### Architecture

- [Provider Configuration System](/mnt/d/Projects/qwen_proxy_opencode/docs/architecture/provider-configuration-system.md)

### Development

- [Adding New Provider Types](/mnt/d/Projects/qwen_proxy_opencode/docs/development/adding-new-provider-types.md)

### Changes

- [CHANGELOG](/mnt/d/Projects/qwen_proxy_opencode/docs/CHANGELOG.md)

## Implementation Status

All phases complete! ✅

See implementation plans:
- [Provider Router Implementation Plan](/mnt/d/Projects/qwen_proxy_opencode/docs/05_PROVIDER_ROUTER_IMPLEMENTATION_PLAN.md)
- [Database and CLI Implementation Plan](/mnt/d/Projects/qwen_proxy_opencode/docs/06_DATABASE_AND_CLI_IMPLEMENTATION_PLAN.md)
- [Provider Configuration Database Migration Plan](/mnt/d/Projects/qwen_proxy_opencode/docs/12-PROVIDER_CONFIGURATION_DATABASE_MIGRATION_PLAN.md)
