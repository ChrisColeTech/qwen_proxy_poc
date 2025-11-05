# Document 29: Provider Router Guide

**Created:** 2025-11-04
**Status:** Active
**Purpose:** Comprehensive technical documentation for the Provider Router backend service

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Port and Configuration](#port-and-configuration)
5. [Startup and Lifecycle](#startup-and-lifecycle)
6. [OpenAI Compatibility Layer](#openai-compatibility-layer)
7. [Provider Management](#provider-management)
8. [Session Management](#session-management)
9. [Request/Response Logging](#requestresponse-logging)
10. [Database Integration](#database-integration)
11. [API Endpoints](#api-endpoints)
12. [Provider Configuration](#provider-configuration)
13. [Model Management](#model-management)
14. [Load Balancing and Selection](#load-balancing-and-selection)
15. [Error Handling](#error-handling)
16. [Development vs Production](#development-vs-production)
17. [Common Operations](#common-operations)
18. [Troubleshooting](#troubleshooting)

---

## Overview

The Provider Router is a multi-provider OpenAI-compatible proxy server that routes requests to multiple AI provider backends (LM Studio, Qwen Proxy, Qwen Direct API). It provides a unified API interface while enabling dynamic provider switching, request logging, and database-driven configuration management.

**Key Capabilities:**
- OpenAI-compatible API interface (`/v1/chat/completions`, `/v1/models`)
- Dynamic provider switching without restarts
- Database-driven configuration (SQLite)
- Comprehensive request/response logging
- Session management for conversation tracking
- CLI and REST API for management
- Health checking and provider testing
- Model synchronization across providers

**Architecture Position:**
```
Client Applications
         ↓
Provider Router (port 8000) ← This Service
         ↓
    ┌────┴────┬──────────┐
    ↓         ↓          ↓
LM Studio  Qwen Proxy  Qwen API
         ↓
  SQLite Database
  (provider-router.db)
```

---

## Technology Stack

**Runtime & Core:**
- **Node.js:** v20.0.0+
- **Express.js:** v4.18.2 - HTTP server framework
- **ES Modules:** Modern JavaScript module system

**Database:**
- **better-sqlite3:** v9.6.0 - Synchronous SQLite3 bindings
- **SQLite:** Embedded database for configuration and logs

**HTTP & Networking:**
- **axios:** v1.6.0 - HTTP client for provider requests
- **cors:** v2.8.5 - Cross-Origin Resource Sharing middleware

**Configuration & CLI:**
- **dotenv:** v16.4.7 - Environment variable management
- **commander:** v11.0.0 - CLI framework

**File Location:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/package.json` (lines 24-31)

---

## Directory Structure

```
backend/provider-router/
├── src/
│   ├── index.js                 # Server entry point and initialization
│   ├── server.js                # Express server and route definitions
│   ├── config.js                # Configuration loader and validator
│   │
│   ├── router/
│   │   └── provider-router.js   # Main routing logic
│   │
│   ├── providers/               # Provider implementations
│   │   ├── base-provider.js     # Abstract base class
│   │   ├── provider-factory.js  # Provider instantiation
│   │   ├── provider-registry.js # Provider lifecycle management
│   │   ├── provider-types.js    # Type definitions and validation
│   │   ├── lm-studio-provider.js
│   │   ├── qwen-proxy-provider.js
│   │   ├── qwen-direct-provider.js
│   │   └── qwen/                # Qwen-specific utilities
│   │
│   ├── routes/                  # REST API route handlers
│   │   ├── sessions.js          # Session management
│   │   ├── requests.js          # Request history
│   │   ├── responses.js         # Response history
│   │   ├── providers.js         # Provider CRUD
│   │   ├── provider-configs.js  # Provider configuration
│   │   ├── provider-models.js   # Provider-model mappings
│   │   ├── models.js            # Model management
│   │   ├── model-sync.js        # Model synchronization
│   │   ├── settings.js          # Server settings
│   │   ├── qwen-credentials.js  # Qwen authentication
│   │   └── activity.js          # Activity logs and stats
│   │
│   ├── controllers/             # Business logic layer
│   │
│   ├── middleware/              # Express middleware
│   │   ├── cors.js              # CORS configuration
│   │   ├── request-logger.js    # Request logging
│   │   ├── response-logger.js   # Response logging
│   │   ├── database-logger.js   # Database audit logging
│   │   ├── error-handler.js     # Centralized error handling
│   │   └── validation.js        # Request validation
│   │
│   ├── database/                # Database layer
│   │   ├── connection.js        # SQLite connection manager
│   │   ├── schema.sql           # Database schema
│   │   ├── migrations.js        # Schema migration runner
│   │   ├── repositories/        # Data access objects
│   │   ├── services/            # Business logic services
│   │   └── migrations/          # Migration scripts
│   │
│   ├── services/                # Application services
│   │   └── settings-sync.js     # Settings synchronization
│   │
│   ├── utils/                   # Utility functions
│   │   ├── logger.js            # Logging utility
│   │   └── config-migrator.js   # Legacy config migration
│   │
│   └── cli/                     # CLI commands
│
├── bin/
│   └── provider-cli.js          # CLI entry point
│
├── data/
│   └── provider-router.db       # SQLite database (created at runtime)
│
├── .env.example                 # Environment variable template
├── package.json                 # NPM configuration
└── README.md                    # User documentation
```

---

## Port and Configuration

### Default Port

**Port 3001** - Default listening port

**Configuration:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/config.js` (line 60)

```javascript
server: {
  port: parseInt(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
}
```

### Environment Variables

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/.env.example`

**Server Settings:**
```bash
PORT=3001                    # Server port (default: 3001)
HOST=0.0.0.0                # Bind address
```

**Logging Settings:**
```bash
LOG_LEVEL=info              # debug, info, warn, error
LOG_REQUESTS=true           # Log incoming requests
LOG_RESPONSES=false         # Log outgoing responses
```

**Request Settings:**
```bash
REQUEST_TIMEOUT=120000      # Request timeout (2 minutes)
```

**Provider Configuration (Deprecated):**
```bash
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
QWEN_PROXY_BASE_URL=http://localhost:3000
QWEN_API_KEY=your-key-here
```

**Note:** Provider configuration from `.env` is deprecated. Use database configuration instead (see [Provider Configuration](#provider-configuration)).

### Database Configuration Override

Settings from database override environment variables:
- `server.port` → PORT
- `server.host` → HOST
- `server.timeout` → REQUEST_TIMEOUT
- `logging.level` → LOG_LEVEL
- `logging.logRequests` → LOG_REQUESTS
- `logging.logResponses` → LOG_RESPONSES

**Implementation:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/config.js` (lines 105-137)

---

## Startup and Lifecycle

### Spawned by API Server

The Provider Router is automatically spawned by the API Server via process control.

**API Server Control:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/proxy-control.js` (line 47)

```javascript
// Spawn provider-router process
proxyProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: providerRouterPath,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: isWindows,
  env: { ...process.env }
})
```

**Control Endpoints:**
- `POST /api/proxy/start` - Start provider-router (line 28)
- `POST /api/proxy/stop` - Stop provider-router (line 115)
- `GET /api/proxy/status` - Get status (line 171)

### Startup Sequence

**Entry Point:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js` (line 197)

**Initialization Steps:**

1. **Database Initialization** (line 132)
   ```javascript
   initDatabase()  // Connect to SQLite
   ```

2. **Run Migrations** (line 138)
   ```javascript
   await runMigrations()  // Apply schema updates
   ```

3. **Load Settings** (line 142)
   ```javascript
   await loadAndApplySettings()  // Database → config
   ```

4. **Validate Configuration** (line 146)
   ```javascript
   validateConfig()  // Check required settings
   ```

5. **Check Migration Status** (line 151)
   ```javascript
   await checkAndMigrate()  // Auto-migrate from .env if needed
   ```

6. **Initialize Qwen Credentials** (line 154)
   ```javascript
   initializeQwenCredentials()  // Load from env vars
   ```

7. **Initialize Providers** (line 157)
   ```javascript
   await initializeProviders()  // Load enabled providers
   ```

8. **Sync Models** (line 163)
   ```javascript
   await ModelSyncService.syncAllProviders(providerRegistry)
   ```

9. **Start HTTP Server** (line 172)
   ```javascript
   app.listen(port, host, () => {
     logger.info(`Server listening on http://${host}:${port}`)
   })
   ```

### Graceful Shutdown

**Signal Handlers:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js` (lines 184-194)

```javascript
process.on('SIGINT', () => {
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDatabase()
  process.exit(0)
})
```

---

## OpenAI Compatibility Layer

The Provider Router implements OpenAI-compatible endpoints, making it a drop-in replacement.

### Chat Completions Endpoint

**Route:** `POST /v1/chat/completions`
**Implementation:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` (lines 40-65)

```javascript
app.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const request = req.body
    const stream = request.stream || false

    // Route through provider router
    const response = await providerRouter.route(request, stream)

    if (stream) {
      // Set streaming headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.pipe(res)
    } else {
      res.json(response)
    }
  } catch (error) {
    next(error)
  }
})
```

**Features:**
- OpenAI request format support
- Streaming and non-streaming responses
- Provider-agnostic routing
- Automatic request/response transformation

### Models List Endpoint

**Route:** `GET /v1/models`
**Implementation:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` (lines 71-82)

```javascript
app.get('/v1/models', async (req, res, next) => {
  try {
    const providerName = req.query.provider || null
    const models = await providerRouter.listModels(providerName)
    res.json(models)
  } catch (error) {
    next(error)
  }
})
```

**Query Parameters:**
- `provider` (optional) - Filter by specific provider

### Request/Response Format

**OpenAI Request:**
```json
{
  "model": "qwen3-max",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**OpenAI Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "qwen3-max",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

---

## Provider Management

### Provider Registry

**Central Registry:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/providers/provider-registry.js`

**Class:** `ProviderRegistry` (line 14)

**Key Methods:**

1. **Load Providers from Database** (line 24)
   ```javascript
   async loadProviders() {
     const providerRecords = ProviderService.getEnabled()
     for (const record of providerRecords) {
       const provider = await ProviderFactory.createFromDatabase(record.id)
       this.register(record.id, provider)
       await provider.healthCheck()
     }
   }
   ```

2. **Reload Provider** (line 77)
   ```javascript
   async reloadProvider(providerId) {
     if (this.has(providerId)) {
       this.unregister(providerId)
     }
     const provider = await ProviderFactory.createFromDatabase(providerId)
     this.register(providerId, provider)
   }
   ```

3. **Health Check All** (line 268)
   ```javascript
   async healthCheckAll() {
     const results = {}
     for (const [providerId, provider] of this.providers.entries()) {
       results[providerId] = { healthy: await provider.healthCheck() }
     }
     return results
   }
   ```

### Provider Factory

**Factory Class:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/providers/provider-factory.js`

**Create from Database** (line 25)
```javascript
static async createFromDatabase(providerId) {
  // 1. Load provider record
  const providerRecord = ProviderService.getById(providerId)

  // 2. Load provider configs
  const config = ProviderConfigService.buildConfig(providerId)

  // 3. Merge with defaults
  const defaultConfig = getDefaultConfig(providerRecord.type)
  const completeConfig = { ...defaultConfig, ...config }

  // 4. Validate configuration
  validateProviderConfig(providerRecord.type, completeConfig)

  // 5. Load models
  const models = ProviderModelService.getModelsForProvider(providerId)

  // 6. Create instance
  return this.create(providerRecord.type, providerId, name, completeConfig)
}
```

### Provider Types

**Type Definitions:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/providers/provider-types.js`

**Supported Types:**
1. **LM Studio** (`lm-studio`) - Local OpenAI-compatible server
2. **Qwen Proxy** (`qwen-proxy`) - XML tool transformation proxy
3. **Qwen Direct** (`qwen-direct`) - Direct Qwen API access

**Type Metadata** (line 19)
```javascript
export const PROVIDER_TYPE_METADATA = {
  [PROVIDER_TYPES.LM_STUDIO]: {
    name: 'LM Studio',
    requiredConfig: ['baseURL'],
    optionalConfig: ['timeout', 'defaultModel'],
    capabilities: ['chat', 'streaming', 'tools', 'models']
  },
  // ... other types
}
```

### Base Provider Interface

**Abstract Class:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/providers/base-provider.js`

**Required Methods:**
- `chatCompletion(request, stream)` - Send chat request (line 23)
- `listModels()` - Get available models (line 31)
- `transformRequest(request)` - Transform to provider format (line 40)
- `transformResponse(response)` - Transform to OpenAI format (line 50)
- `healthCheck()` - Check provider health (line 61)

---

## Session Management

Sessions track conversation state and enable request/response correlation.

### Session Table Schema

**Schema:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/schema.sql` (lines 16-30)

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                    -- MD5 hash of first user message
    chat_id TEXT NOT NULL,                  -- Qwen chat ID
    parent_id TEXT,                         -- Current parent_id for next message
    first_user_message TEXT NOT NULL,       -- First message for reference
    message_count INTEGER DEFAULT 0,        -- Number of messages
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    last_accessed INTEGER NOT NULL,         -- Timestamp (milliseconds)
    expires_at INTEGER NOT NULL             -- Timestamp (milliseconds)
);
```

### Session Creation

**Middleware:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/database-logger.js` (line 111)

```javascript
function getOrCreateSession(req) {
  let sessionId = req.persistence?.sessionId || req.sessionId

  if (!sessionId) {
    sessionId = `simple-session-${req.requestId || crypto.randomUUID()}`

    const existingSession = sessionRepo.getSession(sessionId)

    if (!existingSession) {
      const firstMessage = extractFirstMessage(req)
      sessionRepo.createSession(
        sessionId,
        `chat-${Date.now()}`,
        firstMessage,
        DEFAULT_SESSION_TIMEOUT  // 30 minutes
      )
    } else {
      sessionRepo.touchSession(sessionId, DEFAULT_SESSION_TIMEOUT)
    }
  }

  return sessionId
}
```

### Session REST API

**Routes:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/sessions.js`

**Endpoints:**
- `GET /v1/sessions` - List all sessions (line 26)
- `GET /v1/sessions/:id` - Get session details (line 42)
- `GET /v1/sessions/chat/:chatId` - Get by chat ID (line 34)
- `GET /v1/sessions/:sessionId/requests` - Get session requests (line 53)
- `DELETE /v1/sessions/:id` - Delete session (line 61)
- `DELETE /v1/sessions` - Cleanup expired (line 68)

---

## Request/Response Logging

All requests and responses are logged to the database for audit and debugging.

### Logging Middleware

**Database Logger:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/database-logger.js`

**Middleware Stack:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` (lines 30-34)
```javascript
app.use(requestLogger)    // Performance metrics
app.use(responseLogger)   // Response capture
app.use(databaseLogger)   // Database persistence
```

**Log Flow:**
1. Request received → `requestLogger` logs metadata
2. Response generated → `responseLogger` captures
3. Both saved → `databaseLogger` persists to DB

### Request Table Schema

**Schema:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/schema.sql` (lines 33-46)

```sql
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    request_id TEXT NOT NULL UNIQUE,        -- UUID for tracking
    timestamp INTEGER NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    openai_request TEXT NOT NULL,           -- Full OpenAI request (JSON)
    qwen_request TEXT NOT NULL,             -- Transformed payload (JSON)
    model TEXT NOT NULL,
    stream BOOLEAN NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Response Table Schema

**Schema:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/schema.sql` (lines 54-73)

```sql
CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    response_id TEXT NOT NULL UNIQUE,
    timestamp INTEGER NOT NULL,
    qwen_response TEXT,                     -- Raw provider response (JSON)
    openai_response TEXT,                   -- Transformed response (JSON)
    parent_id TEXT,                         -- Conversation tracking
    completion_tokens INTEGER,
    prompt_tokens INTEGER,
    total_tokens INTEGER,
    finish_reason TEXT,                     -- stop, length, error
    error TEXT,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Request Logger Middleware

**Performance Tracking:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/request-logger.js` (line 13)

```javascript
export function requestLogger(req, res, next) {
  const startTime = Date.now()
  const requestId = generateRequestId()

  req.requestId = requestId

  logger.info(`Incoming Request: ${req.method} ${req.url}`, {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  })

  res.end = function(chunk, ...args) {
    const duration = Date.now() - startTime

    logger.info(`Response: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)

    if (duration > 5000) {
      logger.warn('Slow request detected', { duration })
    }

    return originalEnd.apply(res, [chunk, ...args])
  }

  next()
}
```

---

## Database Integration

### Centralized SQLite Database

**Database Path:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/data/provider-router.db`

**Connection Manager:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/connection.js`

**Initialization** (line 24)
```javascript
export function initDatabase() {
  // Ensure data directory exists
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  // Connect to database
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')  // Better concurrency
  db.pragma('foreign_keys = ON')   // Enforce constraints

  // Run schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(schema)

  return db
}
```

### Database Schema

**Schema File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/schema.sql`

**Tables:**

1. **settings** - Server configuration (line 2)
2. **metadata** - Schema version tracking (line 9)
3. **sessions** - Conversation sessions (line 16)
4. **requests** - API requests (line 33)
5. **responses** - API responses (line 54)
6. **qwen_credentials** - Qwen authentication (line 83)
7. **providers** - Provider definitions (added in migrations)
8. **provider_configs** - Provider configuration (added in migrations)
9. **models** - Model definitions (added in migrations)
10. **provider_models** - Model-provider mappings (added in migrations)

**Indexes:**
- Session expiration, chat_id, created_at
- Request session_id, timestamp, request_id
- Response request_id, session_id, timestamp

### Migration System

**Migration Runner:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/database/migrations.js`

**Automatic Migration:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js` (line 52)

```javascript
async function checkAndMigrate() {
  if (isLegacyConfigMode()) {
    logger.info('Legacy config mode enabled - skipping migration')
    return
  }

  if (isMigrationNeeded()) {
    logger.info('Database is empty - attempting automatic migration from .env')

    const result = await migrateEnvToDatabase({
      createBackup: true,
      dryRun: false
    })

    if (result.success) {
      logger.info('Migration completed', {
        providersCreated: result.providersCreated
      })
    }
  }
}
```

### Repository Pattern

**Data Access Objects:**
- `SessionRepository` - Session CRUD
- `RequestRepository` - Request CRUD
- `ResponseRepository` - Response CRUD
- `ProviderRepository` - Provider CRUD
- `ModelRepository` - Model CRUD

**Service Layer:**
- `SettingsService` - Settings management
- `ProviderService` - Provider logic
- `ProviderConfigService` - Config management
- `ProviderModelService` - Model-provider relationships
- `ModelSyncService` - Model synchronization

---

## API Endpoints

### OpenAI-Compatible Endpoints

**Chat Completions:**
```
POST /v1/chat/completions
```
OpenAI-compatible chat completions endpoint with streaming support.

**Models List:**
```
GET /v1/models?provider=<provider-id>
```
List available models from database or specific provider.

### Provider Management Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/providers.js`

```
GET    /v1/providers              # List all providers
POST   /v1/providers              # Create new provider
GET    /v1/providers/:id          # Get provider details
PUT    /v1/providers/:id          # Update provider
DELETE /v1/providers/:id          # Delete provider
POST   /v1/providers/:id/enable   # Enable provider
POST   /v1/providers/:id/disable  # Disable provider
POST   /v1/providers/:id/test     # Test provider health
POST   /v1/providers/:id/reload   # Reload from database
```

### Provider Configuration Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/provider-configs.js`

```
GET    /v1/providers/:id/config         # Get all configs
POST   /v1/providers/:id/config         # Set config
PUT    /v1/providers/:id/config         # Update all configs
PATCH  /v1/providers/:id/config/:key    # Update single config
DELETE /v1/providers/:id/config         # Delete all configs
DELETE /v1/providers/:id/config/:key    # Delete single config
```

### Model Management Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/models.js`

```
GET    /v1/models           # List all models
POST   /v1/models           # Create new model
GET    /v1/models/:id       # Get model details
PUT    /v1/models/:id       # Update model
DELETE /v1/models/:id       # Delete model
```

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/model-sync.js`

```
POST   /v1/models/sync                  # Sync all providers
POST   /v1/models/sync/:providerId      # Sync specific provider
```

### Provider-Model Mapping Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/provider-models.js`

```
GET    /v1/providers/:id/models         # Get provider's models
POST   /v1/providers/:id/models         # Link model to provider
DELETE /v1/providers/:id/models/:modelId # Unlink model
```

### Session Management Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/sessions.js`

```
GET    /v1/sessions                     # List all sessions
GET    /v1/sessions/:id                 # Get session details
GET    /v1/sessions/chat/:chatId        # Get by chat ID
GET    /v1/sessions/:id/requests        # Get session requests
DELETE /v1/sessions/:id                 # Delete session
DELETE /v1/sessions                     # Cleanup expired
```

### Request/Response History Endpoints

**Files:** `src/routes/requests.js`, `src/routes/responses.js`

```
GET    /v1/requests                     # List all requests
GET    /v1/requests/:id                 # Get request details
DELETE /v1/requests/:id                 # Delete request

GET    /v1/responses                    # List all responses
GET    /v1/responses/:id                # Get response details
DELETE /v1/responses/:id                # Delete response
```

### Settings Management Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/settings.js`

```
GET    /v1/settings           # Get all settings
GET    /v1/settings/:key      # Get specific setting
PUT    /v1/settings/:key      # Update setting
POST   /v1/settings/bulk      # Bulk update
DELETE /v1/settings/:key      # Reset to default
```

**Setting Keys:**
- `server.port` - Server port
- `server.host` - Bind address
- `server.timeout` - Request timeout
- `logging.level` - Log level
- `logging.logRequests` - Log requests
- `logging.logResponses` - Log responses
- `active_provider` - Active provider ID

### Activity Endpoints

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/routes/activity.js`

```
GET /api/v1/activity/recent?limit=20    # Recent activity
GET /api/v1/activity/stats              # Statistics
```

**Statistics Include:**
- Total API requests
- Average response time
- Active sessions count
- Recent error count
- Total providers
- Total models

### Health Check Endpoint

**Implementation:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` (line 154)

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "providers": {
    "lm-studio": {
      "status": "healthy",
      "baseURL": "http://192.168.0.22:1234/v1"
    }
  },
  "registeredProviders": ["lm-studio", "qwen-proxy"]
}
```

---

## Provider Configuration

### Database-Driven Configuration

Providers are now configured in the database, enabling runtime changes without restarts.

**Configuration Tables:**

1. **providers** - Provider metadata
   - `id`, `name`, `type`, `enabled`, `priority`, `description`

2. **provider_configs** - Key-value configuration
   - `provider_id`, `key`, `value`, `is_sensitive`

3. **models** - Model definitions
   - `id`, `name`, `description`, `capabilities`

4. **provider_models** - Model assignments
   - `provider_id`, `model_id`, `is_default`

### Provider Types Configuration

**LM Studio Configuration:**
```javascript
{
  baseURL: 'http://192.168.0.22:1234/v1',
  timeout: 120000,
  defaultModel: 'qwen3-max'
}
```

**Qwen Proxy Configuration:**
```javascript
{
  baseURL: 'http://localhost:3000',
  timeout: 120000
}
```

**Qwen Direct Configuration:**
```javascript
{
  token: 'bx-umidtoken-value',
  cookies: 'cookie-header-value',
  baseURL: 'https://chat.qwen.ai',
  timeout: 120000,
  expiresAt: 1706745600000
}
```

### Configuration Validation

**Validator:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/providers/provider-types.js` (line 133)

```javascript
export function validateProviderConfig(type, config) {
  const metadata = getProviderTypeMetadata(type)
  const errors = []

  // Check required fields
  for (const field of metadata.requiredConfig) {
    if (!config[field]) {
      errors.push(`Missing required config field: ${field}`)
    }
  }

  // Validate field types
  for (const [field, value] of Object.entries(config)) {
    const schema = metadata.configSchema[field]
    if (schema && schema.type === 'number' && typeof value !== 'number') {
      errors.push(`Config field '${field}' must be a number`)
    }
  }

  return { valid: errors.length === 0, errors }
}
```

### Legacy Configuration Mode

**Environment Variable:** `USE_LEGACY_CONFIG=true`

When enabled, providers are loaded from `.env` file instead of database.

**Deprecation Warning:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/config.js` (line 32)

```javascript
function logDeprecationWarning() {
  if (isLegacyConfigMode()) {
    console.warn('DEPRECATION WARNING: Legacy provider configuration is enabled')
    console.warn('Please migrate to database-driven configuration by running:')
    console.warn('  npm run cli migrate')
  }
}
```

---

## Model Management

### Model Synchronization

Models are automatically synced from providers to the database on startup.

**Sync Service:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js` (line 160)

```javascript
const { ModelSyncService } = await import('./database/services/model-sync-service.js')
const { providerRegistry } = await import('./providers/provider-registry.js')

const syncResult = await ModelSyncService.syncAllProviders(providerRegistry)

if (syncResult.success) {
  logger.info('Model sync completed successfully', syncResult.totals)
}
```

**Sync Endpoints:**
```
POST /v1/models/sync                  # Sync all providers
POST /v1/models/sync/:providerId      # Sync specific provider
```

### Model Schema

**Database Schema:** (Added in migrations)

```sql
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capabilities TEXT,              -- JSON array: ["chat", "vision"]
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_models (
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (provider_id, model_id),
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);
```

### Model REST API

**Create Model:**
```bash
curl -X POST http://localhost:8000/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "id": "qwen3-max",
    "name": "Qwen 3 Max",
    "description": "Qwen 3 Max model",
    "capabilities": ["chat", "tools", "streaming"]
  }'
```

**Link Model to Provider:**
```bash
curl -X POST http://localhost:8000/v1/providers/lm-studio/models \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "qwen3-max",
    "is_default": true
  }'
```

**List Provider Models:**
```bash
curl http://localhost:8000/v1/providers/lm-studio/models
```

---

## Load Balancing and Selection

### Active Provider Selection

**Settings Service:** Active provider is stored in database settings.

**Query Active Provider:**
```sql
SELECT value FROM settings WHERE key = 'active_provider';
```

**Provider Router:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/router/provider-router.js` (line 18)

```javascript
async route(request, stream = false) {
  // Get active provider from database
  const providerId = SettingsService.getActiveProvider()
  logger.info(`Routing request to provider: ${providerId}`)

  const provider = providerRegistry.get(providerId)
  const transformedRequest = provider.transformRequest(request)
  const response = await provider.chatCompletion(transformedRequest, stream)

  return stream ? response : provider.transformResponse(response)
}
```

### Provider Switching

**CLI Command:**
```bash
provider-cli set <provider-id>
```

**REST API:**
```bash
curl -X PUT http://localhost:8000/v1/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio"}'
```

**No restart required** - Change takes effect immediately.

### Future Load Balancing

Currently, routing is single-provider (active provider). Future enhancements could include:
- Round-robin load balancing
- Health-based routing
- Fallback providers
- Model-specific routing
- Weighted distribution

**Priority Field:** Provider table includes `priority` field for future use.

---

## Error Handling

### Centralized Error Handler

**Middleware:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/error-handler.js`

**Registration:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js` (line 226)
```javascript
app.use(errorHandler)  // Must be last
```

**Error Context Logging** (line 14)
```javascript
export function errorHandler(err, req, res, next) {
  const errorContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    errorName: err.name,
    errorMessage: err.message,
    timestamp: new Date().toISOString()
  }

  logger.error(`Request Error: ${req.method} ${req.url}`, err)
  logger.error('Error Context:', errorContext)

  if (err.stack) {
    logger.error('Stack Trace:', { stack: err.stack })
  }
}
```

### Error Types

**Validation Errors** (line 71)
```javascript
if (err.name === 'ValidationError') {
  return res.status(400).json({
    error: {
      message: err.message,
      type: 'validation_error'
    },
    requestId: req.requestId
  })
}
```

**Timeout Errors** (line 92)
```javascript
if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
  return res.status(504).json({
    error: {
      message: 'Request timeout',
      type: 'timeout_error',
      code: err.code
    }
  })
}
```

**Connection Errors** (line 110)
```javascript
if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
  return res.status(503).json({
    error: {
      message: 'Service unavailable - could not connect to provider',
      type: 'connection_error'
    }
  })
}
```

**Provider Errors** (line 60)
```javascript
if (err.error) {
  const statusCode = err.error.status || 500
  return res.status(statusCode).json({
    ...err,
    requestId: req.requestId
  })
}
```

### Request ID Tracking

Every request gets a unique ID for correlation across logs.

**ID Generation:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/middleware/request-logger.js` (line 105)
```javascript
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

---

## Development vs Production

### Development Mode

**Start Command:**
```bash
npm run dev
```

**Features:**
- Auto-reload on file changes (via `--watch`)
- Kills existing process on port 8000
- Enhanced logging

**Script:** `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/package.json` (line 12)
```json
{
  "scripts": {
    "dev": "npx kill-port 8000 && node --watch src/index.js"
  }
}
```

### Production Mode

**Start Command:**
```bash
npm start
```

**Features:**
- Standard logging
- No auto-reload
- Process cleanup

**Script:** (line 11)
```json
{
  "scripts": {
    "start": "npx kill-port 8000 && node src/index.js"
  }
}
```

### Environment Detection

Based on `NODE_ENV` environment variable:
```bash
NODE_ENV=production npm start
```

### Logging Levels

**Development:** `LOG_LEVEL=debug`
- Verbose request/response logging
- Request body logging
- Performance metrics

**Production:** `LOG_LEVEL=info`
- Standard logging
- Error tracking
- Performance warnings only

---

## Common Operations

### Add New Provider

**Via CLI:**
```bash
provider-cli provider add \
  --id my-lm-studio \
  --name "My LM Studio" \
  --type lm-studio \
  --config baseURL=http://192.168.0.50:1234/v1 \
  --config timeout=180000
```

**Via REST API:**
```bash
curl -X POST http://localhost:8000/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-lm-studio",
    "name": "My LM Studio",
    "type": "lm-studio",
    "enabled": true,
    "priority": 0,
    "config": {
      "baseURL": "http://192.168.0.50:1234/v1",
      "timeout": 180000
    }
  }'
```

### Switch Active Provider

**Via CLI:**
```bash
provider-cli set my-lm-studio
```

**Via REST API:**
```bash
curl -X PUT http://localhost:8000/v1/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "my-lm-studio"}'
```

### Update Provider Configuration

**Via CLI:**
```bash
provider-cli provider edit my-lm-studio \
  --config timeout=240000
```

**Via REST API:**
```bash
curl -X PATCH http://localhost:8000/v1/providers/my-lm-studio/config/timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "240000"}'
```

### Test Provider Health

**Via CLI:**
```bash
provider-cli provider test my-lm-studio
```

**Via REST API:**
```bash
curl -X POST http://localhost:8000/v1/providers/my-lm-studio/test
```

### Reload Provider

After database changes, reload provider without restart:

**Via CLI:**
```bash
provider-cli provider reload my-lm-studio
```

**Via REST API:**
```bash
curl -X POST http://localhost:8000/v1/providers/my-lm-studio/reload
```

### View Request History

**Via CLI:**
```bash
provider-cli history --limit 20
```

**Via REST API:**
```bash
curl http://localhost:8000/v1/requests?limit=20
```

### Get Statistics

**Via CLI:**
```bash
provider-cli stats
```

**Via REST API:**
```bash
curl http://localhost:8000/api/v1/activity/stats
```

### Migrate from .env to Database

**One-time migration:**
```bash
provider-cli migrate
```

This reads provider configuration from `.env` and creates database records.

---

## Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
lsof -i :8000
```

**Kill process on port:**
```bash
npx kill-port 8000
```

**Check database:**
```bash
sqlite3 backend/provider-router/data/provider-router.db ".tables"
```

### Provider Connection Errors

**Error:** `ECONNREFUSED` or `Service unavailable`

**Solutions:**
1. Verify provider is running
2. Check baseURL in configuration
3. Test direct connection to provider
4. Check firewall/network settings

**Health Check:**
```bash
curl -X POST http://localhost:8000/v1/providers/<provider-id>/test
```

### Request Timeout Errors

**Error:** `Request timeout` or `ETIMEDOUT`

**Solutions:**
1. Increase timeout in settings:
   ```bash
   curl -X PUT http://localhost:8000/v1/settings/server.timeout \
     -H "Content-Type: application/json" \
     -d '{"value": "240000"}'
   ```

2. Check provider response time
3. Check network latency

### Database Lock Errors

**Error:** `database is locked`

**Solutions:**
1. Check for zombie processes
2. Restart server
3. Check WAL mode is enabled:
   ```bash
   sqlite3 data/provider-router.db "PRAGMA journal_mode;"
   ```

### Provider Not Found

**Error:** `Provider not found: <id>`

**Solutions:**
1. List available providers:
   ```bash
   provider-cli provider list
   ```

2. Check provider is enabled:
   ```bash
   curl http://localhost:8000/v1/providers/<id>
   ```

3. Reload providers:
   ```bash
   curl -X POST http://localhost:8000/v1/providers/<id>/reload
   ```

### Migration Issues

**Error:** Migration fails or providers not loading

**Solutions:**
1. Check `.env` file exists and is valid
2. Set legacy mode temporarily:
   ```bash
   USE_LEGACY_CONFIG=true npm start
   ```

3. Manual migration:
   ```bash
   provider-cli migrate --dry-run  # Preview
   provider-cli migrate            # Execute
   ```

### Logging Issues

**Enable debug logging:**
```bash
curl -X PUT http://localhost:8000/v1/settings/logging.level \
  -H "Content-Type: application/json" \
  -d '{"value": "debug"}'
```

**Check logs for errors:**
- Console output
- Request/response logs in database
- Error handler stack traces

### Model Sync Issues

**Force re-sync:**
```bash
curl -X POST http://localhost:8000/v1/models/sync
```

**Check sync results:**
```bash
curl http://localhost:8000/api/v1/activity/stats
```

### Database Corruption

**Backup and rebuild:**
```bash
# Backup
cp data/provider-router.db data/provider-router.db.backup

# Delete and restart (will recreate)
rm data/provider-router.db
npm start

# Re-migrate
provider-cli migrate
```

---

## Summary

The Provider Router is a sophisticated multi-provider proxy that:

1. **Abstracts** multiple LLM backends behind a unified OpenAI-compatible API
2. **Manages** provider lifecycle dynamically without restarts
3. **Logs** all requests/responses to SQLite for audit and analysis
4. **Tracks** conversations through session management
5. **Validates** configurations and performs health checks
6. **Synchronizes** models across providers
7. **Provides** both CLI and REST API for management

**Key Files:**
- Entry: `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/index.js`
- Server: `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/server.js`
- Router: `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/src/router/provider-router.js`
- Database: `/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/data/provider-router.db`

**Default Port:** 8000
**Spawned By:** API Server via `proxy-control.js:47`
**Configuration:** Database-driven (SQLite) with legacy .env fallback

---

**End of Document 29**
