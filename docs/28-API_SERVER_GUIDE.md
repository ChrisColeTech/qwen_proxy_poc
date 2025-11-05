# Document 28: API Server Guide

**Created:** 2025-11-04
**Status:** Active
**Purpose:** Comprehensive guide to the API Server backend service

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Port and Configuration](#port-and-configuration)
5. [Startup and Lifecycle](#startup-and-lifecycle)
6. [Complete API Reference](#complete-api-reference)
7. [Database Integration](#database-integration)
8. [Process Management](#process-management)
9. [Error Handling](#error-handling)
10. [Logging](#logging)
11. [Development vs Production](#development-vs-production)
12. [Common Operations](#common-operations)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The API Server is a RESTful management API that provides comprehensive control over the Qwen Provider Router system. It serves as the primary interface for managing providers, models, sessions, requests, responses, and system settings.

**Key Characteristics:**
- Express-based HTTP server running on port 3002
- Shares the centralized SQLite database with provider-router
- Provides 57+ API endpoints organized into 11 functional categories
- Implements CORS for cross-origin requests
- Supports health checks and process management
- Can spawn and manage provider-router and qwen-proxy processes

**Location:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server`

**Role in Architecture:**
- Management layer for the entire proxy system
- Primary interface for frontend applications
- Database query and manipulation interface
- Process lifecycle controller for child services
- Activity monitoring and statistics aggregation

---

## Technology Stack

### Core Dependencies

**Runtime:**
- Node.js >= 20.0.0 (ES Modules)
- Express 4.18.2 - Web framework

**Database:**
- better-sqlite3 9.6.0 - SQLite3 database driver

**Middleware:**
- cors 2.8.5 - Cross-Origin Resource Sharing
- dotenv 16.4.7 - Environment configuration

**File Reference:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/package.json` (lines 19-23)

### Module System

The API Server uses ES Modules (type: "module" in package.json line 5), requiring:
- `import/export` syntax instead of `require()`
- `.js` extensions in import statements
- File URLs for path resolution

---

## Directory Structure

```
backend/api-server/
├── src/
│   ├── server.js              # Express app setup and route mounting
│   ├── index.js               # Entry point and startup logic
│   ├── config.js              # Configuration from environment
│   ├── routes/                # API endpoint definitions (11 files)
│   │   ├── providers.js       # Provider CRUD operations
│   │   ├── models.js          # Model management
│   │   ├── sessions.js        # Session tracking
│   │   ├── requests.js        # Request history
│   │   ├── responses.js       # Response logging
│   │   ├── activity.js        # Activity stats
│   │   ├── settings.js        # System settings
│   │   ├── provider-configs.js    # Provider configuration
│   │   ├── provider-models.js     # Provider-model mapping
│   │   ├── qwen-credentials.js    # Qwen auth credentials
│   │   └── proxy-control.js       # Process management
│   ├── controllers/           # Business logic (8 files)
│   │   └── *-controller.js    # Re-exports from provider-router
│   ├── middleware/            # Express middleware (8 files)
│   │   ├── cors.js            # CORS configuration
│   │   ├── error-handler.js   # Centralized error handling
│   │   ├── validation.js      # Request validation
│   │   ├── settings-validation.js
│   │   ├── request-logger.js  # HTTP request logging
│   │   └── response-logger.js # HTTP response logging
│   ├── database/              # Database service exports
│   │   └── services/
│   │       └── index.js       # Re-exports from provider-router
│   └── utils/
│       └── logger.js          # Logging utility
├── package.json               # Dependencies and scripts
├── .env.example              # Environment template
└── README.md                 # Basic documentation
```

**Total Route Files:** 11 files, 1267 lines of code

---

## Port and Configuration

### Default Port

**Port 3002** - Management API Server
Configured via environment variable `API_PORT`

**File Reference:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/config.js` (line 8)

### Environment Variables

**Configuration File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/config.js`

```javascript
{
  server: {
    port: parseInt(process.env.API_PORT || '3002'),
    host: process.env.API_HOST || 'localhost',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logRequests: process.env.LOG_REQUESTS !== 'false',
    logResponses: process.env.LOG_RESPONSES !== 'false',
  },
  database: {
    path: process.env.DATABASE_PATH || '../provider-router/src/database/qwen_proxy.db',
  },
}
```

**Supported Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 3002 | Server listening port |
| `API_HOST` | localhost | Server bind address |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `LOG_REQUESTS` | true | Enable request logging |
| `LOG_RESPONSES` | true | Enable response logging |
| `DATABASE_PATH` | ../provider-router/src/database/qwen_proxy.db | SQLite database path |

**File Reference:** Lines 6-19 of config.js

### .env.example Template

Located at `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/.env.example`

---

## Startup and Lifecycle

### Server Entry Point

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/index.js`

**Startup Sequence:**

1. **Load Environment** (line 6)
   ```javascript
   import 'dotenv/config'
   ```

2. **Initialize Database** (lines 20-22)
   ```javascript
   initDatabase()
   logger.info('Database connected')
   ```
   - Uses provider-router's database connection module
   - Shares the same SQLite database

3. **Start HTTP Server** (lines 25-28)
   ```javascript
   app.listen(port, host, () => {
     logger.info(`API Server listening on http://${host}:${port}`)
   })
   ```

### Graceful Shutdown

**Signal Handlers** (lines 37-47):

```javascript
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})
```

**Shutdown Steps:**
1. Receive SIGINT or SIGTERM signal
2. Log shutdown message
3. Close database connection
4. Exit with code 0

### Express Application Setup

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/server.js`

**Middleware Chain** (lines 26-28):
1. CORS middleware - Enable cross-origin requests
2. `express.json()` - Parse JSON request bodies
3. `express.urlencoded({ extended: true })` - Parse URL-encoded bodies

**Route Mounting** (lines 40-50):
```javascript
app.use('/api/providers', providersRouter)
app.use('/api/models', modelsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/responses', responsesRouter)
app.use('/api/activity', activityRouter)
app.use('/api/settings', settingsRouter)
app.use('/api', providerConfigsRouter)
app.use('/api', providerModelsRouter)
app.use('/api/qwen', qwenCredentialsRouter)
app.use('/api/proxy', proxyControlRouter)
```

**Error Handler** (line 53):
```javascript
app.use(errorHandler) // Must be last
```

### NPM Scripts

**File Reference:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/package.json` (lines 7-10)

```json
{
  "start": "npx kill-port 3002 && node src/index.js",
  "dev": "npx kill-port 3002 && node --watch src/index.js"
}
```

**Scripts:**
- `npm start` - Production mode with port cleanup
- `npm run dev` - Development mode with file watching

---

## Complete API Reference

All endpoints are prefixed with `/api` (not `/api/v1`)

### 1. Health Check

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/server.js` (lines 31-37)

#### GET /api/health

Check server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "service": "api-server",
  "timestamp": "2025-11-04T12:00:00.000Z"
}
```

---

### 2. Provider Management (10 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/providers.js`

#### GET /api/providers

List all providers with optional filtering.

**Query Parameters:**
- `type` - Filter by provider type (lm-studio, qwen-proxy, qwen-direct)
- `enabled` - Filter by enabled status (true/false)
- Pagination parameters (from validatePagination middleware)

**File Reference:** Lines 27-33

#### GET /api/providers/:id

Get detailed information for a specific provider.

**Parameters:**
- `id` - Provider ID (slug format)

**Validation:** validateProviderId middleware

**File Reference:** Lines 36-41

#### POST /api/providers

Create a new provider.

**Request Body:**
```json
{
  "id": "my-provider",          // Required: slug format
  "name": "My Provider",         // Required: display name
  "type": "lm-studio",          // Required: provider type
  "enabled": true,              // Optional: default true
  "priority": 0,                // Optional: routing priority
  "description": "...",         // Optional
  "config": {}                  // Optional: configuration object
}
```

**Validation:** validateProvider middleware

**File Reference:** Lines 44-55

#### PUT /api/providers/:id

Update an existing provider.

**Parameters:**
- `id` - Provider ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "type": "qwen-proxy",
  "enabled": false,
  "priority": 10,
  "description": "..."
}
```

**Validation:** validateProviderId, validateProvider

**File Reference:** Lines 58-69

#### DELETE /api/providers/:id

Delete a provider.

**Parameters:**
- `id` - Provider ID

**File Reference:** Lines 72-77

#### POST /api/providers/:id/enable

Enable a provider for routing.

**Parameters:**
- `id` - Provider ID

**File Reference:** Lines 80-85

#### POST /api/providers/:id/disable

Disable a provider from routing.

**Parameters:**
- `id` - Provider ID

**File Reference:** Lines 88-93

#### POST /api/providers/:id/test

Test provider connection and health.

**Parameters:**
- `id` - Provider ID

**File Reference:** Lines 96-101

#### POST /api/providers/:id/reload

Reload provider configuration from database.

**Parameters:**
- `id` - Provider ID

**File Reference:** Lines 104-109

---

### 3. Provider Configuration (4 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/provider-configs.js`

#### GET /api/providers/:id/config

Get all configuration for a provider.

**Parameters:**
- `id` - Provider ID

**Query Parameters:**
- `mask` - Whether to mask sensitive values (default: true)

**Response:**
```json
{
  "provider_id": "my-provider",
  "config": {
    "api_key": "***MASKED***",
    "endpoint": "http://localhost:1234"
  },
  "masked": true
}
```

**File Reference:** Lines 28-54

#### PUT /api/providers/:id/config

Bulk update provider configuration.

**Parameters:**
- `id` - Provider ID

**Request Body:**
```json
{
  "config": {
    "api_key": "sk-...",
    "endpoint": "http://localhost:1234",
    "timeout": 30000
  }
}
```

**File Reference:** Lines 57-96

#### PATCH /api/providers/:id/config/:key

Update a single configuration value.

**Parameters:**
- `id` - Provider ID
- `key` - Configuration key

**Request Body:**
```json
{
  "value": "new-value",
  "is_sensitive": false  // Optional: auto-detected if not provided
}
```

**Auto-detection of sensitive keys** (lines 124-129):
- Contains "key"
- Contains "secret"
- Contains "password"
- Contains "token"

**File Reference:** Lines 108-146

#### DELETE /api/providers/:id/config/:key

Delete a configuration key.

**Parameters:**
- `id` - Provider ID
- `key` - Configuration key

**File Reference:** Lines 149-193

---

### 4. Provider-Model Mapping (4 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/provider-models.js`

#### GET /api/providers/:id/models

Get all models linked to a provider.

**Parameters:**
- `id` - Provider ID

**Response:**
```json
{
  "provider_id": "my-provider",
  "models": [...],
  "total": 3
}
```

**File Reference:** Lines 27-52

#### POST /api/providers/:id/models

Link a model to a provider.

**Parameters:**
- `id` - Provider ID

**Request Body:**
```json
{
  "model_id": "gpt-4",           // Required
  "is_default": false,          // Optional: default false
  "config": {}                  // Optional: provider-specific config
}
```

**Error Codes:**
- 404: Provider or model not found
- 409: Model already linked to provider

**File Reference:** Lines 55-114

#### DELETE /api/providers/:id/models/:modelId

Unlink a model from a provider.

**Parameters:**
- `id` - Provider ID
- `modelId` - Model ID

**File Reference:** Lines 117-161

#### PUT /api/providers/:id/models/:modelId/default

Set a model as the default for a provider.

**Parameters:**
- `id` - Provider ID
- `modelId` - Model ID

**File Reference:** Lines 164-209

---

### 5. Model Management (5 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/models.js`

#### GET /api/models

List all models.

**Query Parameters:**
- `capability` - Filter by capability (e.g., 'chat', 'vision')
- Pagination parameters

**File Reference:** Lines 23-28

#### GET /api/models/:id

Get model details.

**Parameters:**
- `id` - Model ID

**File Reference:** Lines 31-36

#### POST /api/models

Create a new model.

**Request Body:**
```json
{
  "id": "gpt-4",                     // Required: slug format
  "name": "GPT-4",                   // Required: display name
  "description": "...",              // Optional
  "capabilities": ["chat", "vision"] // Optional: default []
}
```

**File Reference:** Lines 39-47

#### PUT /api/models/:id

Update a model.

**Parameters:**
- `id` - Model ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "...",
  "capabilities": ["chat"]
}
```

**File Reference:** Lines 50-59

#### DELETE /api/models/:id

Delete a model.

**Parameters:**
- `id` - Model ID

**File Reference:** Lines 62-67

---

### 6. Session Management (5 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/sessions.js`

#### GET /api/sessions

List all sessions with pagination.

**Query Parameters:**
- `limit` - Number of sessions to return (default: 50)
- `offset` - Number of sessions to skip (default: 0)
- `sort` - Sort order: created_at or last_accessed (default: created_at)

**File Reference:** Lines 18-25

#### GET /api/sessions/:id

Get single session details.

**Parameters:**
- `id` - Session ID

**File Reference:** Lines 28-33

#### GET /api/sessions/:sessionId/requests

Get all requests for a specific session.

**Parameters:**
- `sessionId` - Session ID

**Query Parameters:**
- `limit` - Number of requests (default: 100)
- `offset` - Offset for pagination (default: 0)

**File Reference:** Lines 36-44

#### DELETE /api/sessions/:id

Delete a session and all related data (cascades to requests and responses).

**Parameters:**
- `id` - Session ID

**File Reference:** Lines 47-52

#### DELETE /api/sessions

Cleanup expired sessions.

**File Reference:** Lines 55-59

---

### 7. Request History (3 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/requests.js`

#### GET /api/requests

List all requests with pagination and filtering.

**Query Parameters:**
- `limit` - Number of requests (default: 50)
- `offset` - Pagination offset (default: 0)
- `session_id` - Filter by session ID
- `model` - Filter by model name
- `stream` - Filter by stream flag (true/false)
- `start_date` - Filter by start timestamp (milliseconds)
- `end_date` - Filter by end timestamp (milliseconds)

**File Reference:** Lines 17-28

#### GET /api/requests/:id

Get single request details.

**Parameters:**
- `id` - Request database ID (integer) or request_id (UUID)

**Returns:** Full request object with parsed JSON fields and linked response

**File Reference:** Lines 31-37

#### DELETE /api/requests/:id

Delete a request and related response (cascade).

**Parameters:**
- `id` - Request database ID or request_id UUID

**File Reference:** Lines 40-45

---

### 8. Response History (6 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/responses.js`

#### GET /api/responses

List all responses with pagination and filtering.

**Query Parameters:**
- `limit` - Number of responses (default: 50)
- `offset` - Pagination offset (default: 0)
- `session_id` - Filter by session ID
- `request_id` - Filter by request ID
- `finish_reason` - Filter by finish reason (stop, length, error, etc.)
- `has_error` - Filter by error status (true/false)
- `start_date` - Filter by start timestamp (milliseconds)
- `end_date` - Filter by end timestamp (milliseconds)

**File Reference:** Lines 18-31

#### GET /api/responses/stats

Get usage statistics.

**Query Parameters:**
- `session_id` - Optional session ID to filter stats

**Response:**
```json
{
  "total_responses": 1234,
  "total_tokens": 56789,
  "total_completion_tokens": 34567,
  "total_prompt_tokens": 22222,
  "avg_duration_ms": 1234.5,
  "success_rate": 0.98
}
```

**File Reference:** Lines 34-40

#### GET /api/responses/:id

Get single response details.

**Parameters:**
- `id` - Response database ID or response_id UUID

**Returns:** Full response object with parsed JSON fields

**File Reference:** Lines 43-49

#### GET /api/responses/request/:requestId

Get response for a specific request.

**Parameters:**
- `requestId` - request_id UUID or database ID

**File Reference:** Lines 52-58

#### GET /api/responses/session/:sessionId

Get responses by session.

**Parameters:**
- `sessionId` - Session ID

**Query Parameters:**
- `limit` - Number of responses (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "responses": [...],
  "session_id": "...",
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

**File Reference:** Lines 61-70

#### DELETE /api/responses/:id

Delete a response.

**Parameters:**
- `id` - Response database ID or response_id UUID

**File Reference:** Lines 73-79

---

### 9. Activity Monitoring (2 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/activity.js`

#### GET /api/activity/recent

Get recent activity from requests/responses tables.

**Query Parameters:**
- `limit` - Number of activities to return (default: 20)

**File Reference:** Lines 15-20

#### GET /api/activity/stats

Get aggregated statistics.

**Returns:**
- Total API requests
- Average response time
- Active sessions count
- Recent error count
- Total providers
- Total models

**File Reference:** Lines 23-33

---

### 10. Settings Management (5 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/settings.js`

#### GET /api/settings

Get all settings.

**Query Parameters:**
- `category` - Filter by category (server, logging, system, provider)

**File Reference:** Lines 23-28

#### GET /api/settings/:key

Get specific setting.

**Parameters:**
- `key` - Setting key (e.g., 'server.port', 'logging.level')

**File Reference:** Lines 31-36

#### PUT /api/settings/:key

Update specific setting.

**Parameters:**
- `key` - Setting key

**Request Body:**
```json
{
  "value": "new-value"
}
```

**File Reference:** Lines 39-46

#### POST /api/settings/bulk

Bulk update settings.

**Request Body:**
```json
{
  "settings": {
    "server.port": 3002,
    "logging.level": "debug",
    "system.timeout": 30000
  }
}
```

**File Reference:** Lines 49-54

#### DELETE /api/settings/:key

Delete setting (reset to default).

**Parameters:**
- `key` - Setting key

**File Reference:** Lines 57-62

---

### 11. Qwen Credentials (3 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/qwen-credentials.js`

#### POST /api/qwen/credentials

Set or update Qwen credentials.

**Request Body:**
```json
{
  "token": "eyJ...",              // Required: Qwen API token
  "cookies": "session=...; ...",  // Required: Qwen session cookies
  "expiresAt": 1699999999         // Optional: Unix timestamp
}
```

**Validation** (lines 18-53):
- `token` must be non-empty string
- `cookies` must be non-empty string
- `expiresAt` must be positive integer if provided

**File Reference:** Lines 56-63

#### GET /api/qwen/credentials

Get current Qwen credentials status.

**Response:**
```json
{
  "token": "eyJ***",           // Masked
  "cookies": "ses***",         // Masked
  "expiresAt": 1699999999,
  "isExpired": false
}
```

**File Reference:** Lines 66-74

#### DELETE /api/qwen/credentials

Delete Qwen credentials.

**Response:**
```json
{
  "success": true
}
```

**File Reference:** Lines 77-82

---

### 12. Proxy Process Control (3 endpoints)

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/proxy-control.js`

#### POST /api/proxy/start

Start the provider-router and qwen-proxy servers.

**Behavior:**
1. Checks if proxy is already running (lines 30-37)
2. Spawns provider-router process via npm (lines 40-56)
3. Sets up stdout/stderr logging (lines 59-71)
4. Automatically starts qwen-proxy (line 90)

**Process Details:**
- Command: `npm run dev`
- Working directory: `backend/provider-router`
- Port: 3001 (provider-router default)
- Logging prefix: `[Proxy]` and `[Qwen Proxy]`

**Response:**
```json
{
  "status": "started",
  "port": 3001,
  "pid": 12345,
  "uptime": 0,
  "message": "Proxy server started successfully"
}
```

**File Reference:** Lines 25-109

#### POST /api/proxy/stop

Stop the provider-router and qwen-proxy servers.

**Behavior:**
1. Checks if proxy is running (lines 117-122)
2. Stops qwen-proxy first (line 128)
3. Sends SIGTERM to proxy process (line 131)
4. Force kills with SIGKILL after 2 seconds if needed (lines 135-141)

**Response:**
```json
{
  "status": "stopped",
  "message": "Proxy server stopped successfully"
}
```

**File Reference:** Lines 112-165

#### GET /api/proxy/status

Get current status of the provider-router proxy server.

**Response (running):**
```json
{
  "status": "running",
  "port": 3001,
  "pid": 12345,
  "uptime": 3600,
  "message": "Proxy server is running"
}
```

**Response (stopped):**
```json
{
  "status": "stopped",
  "port": 3001,
  "uptime": 0,
  "message": "Proxy server is not running"
}
```

**File Reference:** Lines 168-198

**Process Management Helpers:**

- `isProcessRunning(pid)` - Check if process exists (lines 203-217)
- `startQwenProxy()` - Start qwen-proxy server (lines 220-277)
- `stopQwenProxy()` - Stop qwen-proxy server (lines 280-307)

---

## Database Integration

### Shared Database Architecture

The API Server shares the same SQLite database as the provider-router service.

**Database Path:** `../provider-router/src/database/qwen_proxy.db`

**File Reference:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/config.js` (line 17)

### Database Connection

**Connection Module:** Re-uses provider-router's database connection

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/index.js`

```javascript
import { initDatabase, closeDatabase } from '../../provider-router/src/database/connection.js'
```

**Initialization** (line 21):
```javascript
initDatabase()
```

**Graceful Shutdown** (lines 39, 45):
```javascript
closeDatabase()
```

### Database Services

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/database/services/index.js`

All database services are re-exported from provider-router to avoid code duplication:

```javascript
export {
  ProviderService,
  ModelService,
  ProviderConfigService,
  ProviderModelService,
  SettingsService,
  QwenCredentialsService
} from '../../../../provider-router/src/database/services/index.js'
```

**Available Services:**
- `ProviderService` - Provider CRUD operations
- `ModelService` - Model management
- `ProviderConfigService` - Provider configuration key-value store
- `ProviderModelService` - Provider-model relationship mapping
- `SettingsService` - System settings storage
- `QwenCredentialsService` - Qwen authentication credentials

### Database Tables

The API Server has access to all provider-router tables:

1. **providers** - Provider definitions
2. **models** - Model registry
3. **provider_configs** - Provider configuration key-value pairs
4. **provider_models** - Provider-model mappings
5. **sessions** - Request session tracking
6. **requests** - Request history
7. **responses** - Response logging
8. **settings** - System settings
9. **qwen_credentials** - Qwen authentication data

### Concurrent Access

Both api-server and provider-router can access the database simultaneously:
- SQLite supports concurrent reads
- Writes are serialized with WAL mode
- better-sqlite3 handles locking automatically

---

## Process Management

The API Server can spawn and manage child processes for provider-router and qwen-proxy.

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/proxy-control.js`

### Process State Tracking

**Global Variables:**

```javascript
let proxyProcess = null          // provider-router child process
let proxyStartTime = null        // Timestamp when started
let qwenProxyProcess = null      // qwen-proxy child process
```

**File Reference:** Lines 18-22

### Starting Provider Router

**Function:** POST /api/proxy/start (lines 28-109)

**Steps:**

1. **Check Existing Process** (lines 30-37)
   - Return status if already running
   - Include uptime and PID

2. **Resolve Path** (line 41)
   ```javascript
   const providerRouterPath = path.join(__dirname, '../../../provider-router')
   ```

3. **Spawn Process** (lines 47-55)
   ```javascript
   const npmCmd = isWindows ? 'npm.cmd' : 'npm'
   proxyProcess = spawn(npmCmd, ['run', 'dev'], {
     cwd: providerRouterPath,
     stdio: ['ignore', 'pipe', 'pipe'],
     shell: isWindows,
     env: { ...process.env }
   })
   ```

4. **Set up Logging** (lines 60-71)
   - Pipe stdout to console with `[Proxy]` prefix
   - Pipe stderr to console with `[Proxy Error]` prefix

5. **Handle Process Events** (lines 74-85)
   - `exit` event - Log and cleanup
   - `error` event - Log error and cleanup

6. **Start Qwen Proxy** (line 90)
   - Automatically starts qwen-proxy as dependency

### Starting Qwen Proxy

**Function:** `startQwenProxy()` (lines 222-277)

**Steps:**

1. **Check Existing Process** (lines 224-227)

2. **Resolve Path** (line 231)
   ```javascript
   const qwenProxyPath = path.join(__dirname, '../../../qwen-proxy')
   ```

3. **Spawn Process** (lines 239-244)
   - Command: `npm run dev`
   - Working directory: `backend/qwen-proxy`

4. **Set up Logging** (lines 246-258)
   - Prefix: `[Qwen Proxy]`

5. **Handle Events** (lines 261-270)

### Stopping Processes

**Function:** POST /api/proxy/stop (lines 115-165)

**Stop Sequence:**

1. **Stop Qwen Proxy First** (line 128)
   ```javascript
   stopQwenProxy()
   ```

2. **Send SIGTERM** (line 131)
   ```javascript
   proxyProcess.kill('SIGTERM')
   ```

3. **Graceful Shutdown Window** (lines 135-141)
   - Wait 2 seconds
   - Force kill with SIGKILL if still running

4. **Cleanup State** (lines 143-144)

### Process Health Check

**Function:** `isProcessRunning(pid)` (lines 203-217)

**Implementation:**
```javascript
try {
  // Sending signal 0 checks if process exists without killing it
  process.kill(pid, 0)
  return true
} catch (error) {
  // ESRCH = no such process
  // EPERM = process exists but no permission (still running)
  return error.code === 'EPERM'
}
```

### Process Lifecycle

```
┌─────────────────┐
│ API Server Start│
└────────┬────────┘
         │
         v
┌─────────────────┐
│ POST /api/proxy/│
│     start       │
└────────┬────────┘
         │
         ├──────────────────┐
         v                  v
┌─────────────────┐  ┌──────────────┐
│  provider-router│  │  qwen-proxy  │
│   (port 3001)   │  │  (port ???)  │
└────────┬────────┘  └──────┬───────┘
         │                  │
         │  Running State   │
         │                  │
         v                  v
┌─────────────────┐  ┌──────────────┐
│ GET /api/proxy/ │  │   Process    │
│     status      │←─┤   Monitor    │
└─────────────────┘  └──────────────┘
         │
         v
┌─────────────────┐
│ POST /api/proxy/│
│      stop       │
└────────┬────────┘
         │
         ├──────────────────┐
         v                  v
    SIGTERM            SIGTERM
         │                  │
    Wait 2s            Wait 2s
         │                  │
    SIGKILL            SIGKILL
   (if needed)        (if needed)
```

---

## Error Handling

### Centralized Error Handler

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/middleware/error-handler.js`

**Mounted As:** Last middleware in Express chain (server.js line 53)

### Error Context Logging

**Error Information Captured** (lines 15-26):

```javascript
const errorContext = {
  requestId: req.requestId,
  method: req.method,
  url: req.url,
  path: req.path,
  query: req.query,
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString(),
  errorName: err.name,
  errorMessage: err.message,
}
```

### Error Types

**1. Validation Error** (lines 51-59)

**Status:** 400 Bad Request

**Response:**
```json
{
  "error": {
    "message": "Validation failed",
    "type": "validation_error"
  },
  "requestId": "req-123"
}
```

**2. Unauthorized Error** (lines 61-69)

**Status:** 401 Unauthorized

**Response:**
```json
{
  "error": {
    "message": "Unauthorized",
    "type": "authentication_error"
  },
  "requestId": "req-123"
}
```

**3. Timeout Error** (lines 72-87)

**Status:** 504 Gateway Timeout

**Error Codes:** ETIMEDOUT, ECONNABORTED

**Response:**
```json
{
  "error": {
    "message": "Request timeout",
    "type": "timeout_error",
    "code": "ETIMEDOUT"
  },
  "requestId": "req-123"
}
```

**4. Connection Error** (lines 90-105)

**Status:** 503 Service Unavailable

**Error Codes:** ECONNREFUSED, ENOTFOUND

**Response:**
```json
{
  "error": {
    "message": "Service unavailable - could not connect to provider",
    "type": "connection_error",
    "code": "ECONNREFUSED"
  },
  "requestId": "req-123"
}
```

**5. Default Error** (lines 108-116)

**Status:** 500 Internal Server Error (or err.statusCode)

**Response:**
```json
{
  "error": {
    "message": "Internal server error",
    "type": "internal_error"
  },
  "requestId": "req-123"
}
```

### Debug Mode

When `LOG_LEVEL=debug`, request body is logged on errors (lines 35-40):

```javascript
if (config.logging.level === 'debug' && req.body) {
  logger.debug('Request Body at Error:', {
    requestId: req.requestId,
    body: req.body,
  })
}
```

### Stack Trace Logging

Full stack traces are logged for all errors (lines 43-48):

```javascript
if (err.stack) {
  logger.error('Stack Trace:', {
    requestId: req.requestId,
    stack: err.stack
  })
}
```

---

## Logging

### Logger Architecture

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/utils/logger.js`

**Singleton Instance:**
```javascript
export const logger = new Logger()
```

### Log Levels

**Hierarchy** (lines 8-13):

```javascript
const LEVELS = {
  debug: 0,  // Most verbose
  info: 1,   // Default
  warn: 2,
  error: 3,  // Least verbose
}
```

**Configuration:** Set via `LOG_LEVEL` environment variable

### Color Coding

**ANSI Colors** (lines 15-21):

| Level | Color | Code |
|-------|-------|------|
| debug | Cyan | \x1b[36m |
| info | Green | \x1b[32m |
| warn | Yellow | \x1b[33m |
| error | Red | \x1b[31m |

### Log Methods

**1. debug(message, data)**

**Usage:** Detailed debugging information

```javascript
logger.debug('Processing request', { id: 123, data: {...} })
```

**File Reference:** Lines 48-52

**2. info(message, data)**

**Usage:** General informational messages

```javascript
logger.info('Server started', { port: 3002, host: 'localhost' })
```

**File Reference:** Lines 54-58

**3. warn(message, data)**

**Usage:** Warning messages

```javascript
logger.warn('Deprecated API usage', { endpoint: '/old-api' })
```

**File Reference:** Lines 60-64

**4. error(message, error)**

**Usage:** Error logging with stack traces

```javascript
logger.error('Database error', new Error('Connection failed'))
```

**Special Handling for Error objects** (lines 66-75):
- Automatically extracts and prints stack trace
- Formats error objects as JSON

**File Reference:** Lines 66-75

### Special Log Methods

**5. request(method, url, provider)**

**Usage:** HTTP request logging (if enabled)

```javascript
logger.request('GET', '/api/models', 'provider-123')
```

**Output:** `GET /api/models → provider-123`

**Controlled by:** `config.logging.logRequests`

**File Reference:** Lines 77-81

**6. response(status, provider)**

**Usage:** HTTP response logging (if enabled)

```javascript
logger.response(200, 'provider-123')
```

**Output:** `← 200 from provider-123`

**Controlled by:** `config.logging.logResponses`

**File Reference:** Lines 83-87

### Log Format

**Template** (lines 36-46):

```
[LEVEL] 2025-11-04T12:00:00.000Z Message
{
  "additional": "data",
  "formatted": "as JSON"
}
```

**Example Output:**

```
[INFO] 2025-11-04T12:00:00.123Z API Server listening on http://localhost:3002
[INFO] 2025-11-04T12:00:01.456Z Ready to accept management requests
[ERROR] 2025-11-04T12:00:02.789Z Request Error: GET /api/invalid
Error: Not found
    at Router.handle (/path/to/server.js:123:45)
    ...
```

### Timestamp Format

**ISO 8601:** `new Date().toISOString()`

**File Reference:** Line 29

---

## Development vs Production

### NPM Scripts

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/package.json` (lines 7-10)

| Script | Command | Use Case |
|--------|---------|----------|
| `npm start` | `npx kill-port 3002 && node src/index.js` | Production |
| `npm run dev` | `npx kill-port 3002 && node --watch src/index.js` | Development |

### Development Mode

**Features:**
- `--watch` flag for automatic restart on file changes
- Port cleanup with `kill-port` before start
- More verbose logging recommended (LOG_LEVEL=debug)

**Recommended .env:**
```bash
API_PORT=3002
API_HOST=localhost
LOG_LEVEL=debug
LOG_REQUESTS=true
LOG_RESPONSES=true
```

**Start Development Server:**
```bash
cd backend/api-server
npm run dev
```

### Production Mode

**Features:**
- No file watching
- Port cleanup for reliability
- Production-level logging (LOG_LEVEL=info or warn)

**Recommended .env:**
```bash
API_PORT=3002
API_HOST=0.0.0.0
LOG_LEVEL=info
LOG_REQUESTS=false
LOG_RESPONSES=false
```

**Start Production Server:**
```bash
cd backend/api-server
npm start
```

### CORS Configuration

**File:** `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/middleware/cors.js`

**Development Settings** (lines 11-18):

```javascript
const corsOptions = {
  origin: true,           // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 600            // Cache preflight for 10 minutes
}
```

**Production Consideration:**
- Currently allows all origins (`origin: true`)
- Should be restricted to specific domains in production
- Consider environment-based CORS configuration

### Database Path

**Development:** Relative path to provider-router database

```javascript
database: {
  path: process.env.DATABASE_PATH || '../provider-router/src/database/qwen_proxy.db',
}
```

**Production:** Consider absolute path or environment variable

---

## Common Operations

### Starting the API Server

**Method 1: Development Mode**

```bash
cd /Users/chris/Projects/qwen_proxy_opencode/backend/api-server
npm run dev
```

**Output:**
```
[INFO] 2025-11-04T12:00:00.123Z Starting API Server...
[INFO] 2025-11-04T12:00:00.234Z Initializing database connection...
[INFO] 2025-11-04T12:00:00.345Z Database connected
[INFO] 2025-11-04T12:00:00.456Z API Server listening on http://localhost:3002
[INFO] 2025-11-04T12:00:00.567Z Ready to accept management requests
```

**Method 2: Production Mode**

```bash
cd /Users/chris/Projects/qwen_proxy_opencode/backend/api-server
npm start
```

**Method 3: Direct Node**

```bash
cd /Users/chris/Projects/qwen_proxy_opencode/backend/api-server
node src/index.js
```

### Health Check

**Verify Server is Running:**

```bash
curl http://localhost:3002/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "api-server",
  "timestamp": "2025-11-04T12:00:00.000Z"
}
```

### Stopping the API Server

**Method 1: Graceful Shutdown (Ctrl+C)**

```
^C
[INFO] 2025-11-04T12:00:00.123Z Received SIGINT, shutting down gracefully...
```

**Method 2: Kill Process**

```bash
# Find PID
lsof -i :3002

# Kill gracefully
kill -TERM <PID>

# Force kill
kill -9 <PID>
```

**Method 3: Kill Port**

```bash
npx kill-port 3002
```

### Starting Provider Router via API

**Request:**
```bash
curl -X POST http://localhost:3002/api/proxy/start
```

**Response:**
```json
{
  "status": "started",
  "port": 3001,
  "pid": 12345,
  "uptime": 0,
  "message": "Proxy server started successfully"
}
```

**Console Output:**
```
[Proxy Control] Starting provider-router at: /path/to/provider-router
[Proxy Control] Proxy server started with PID: 12345
[Qwen Proxy] Starting at: /path/to/qwen-proxy
[Qwen Proxy] Started with PID: 12346
[Proxy] Server listening on port 3001
[Qwen Proxy] Server listening on port 8787
```

### Checking Proxy Status

**Request:**
```bash
curl http://localhost:3002/api/proxy/status
```

**Response (Running):**
```json
{
  "status": "running",
  "port": 3001,
  "pid": 12345,
  "uptime": 3600,
  "message": "Proxy server is running"
}
```

### Stopping Provider Router via API

**Request:**
```bash
curl -X POST http://localhost:3002/api/proxy/stop
```

**Response:**
```json
{
  "status": "stopped",
  "message": "Proxy server stopped successfully"
}
```

### Listing Providers

**Request:**
```bash
curl http://localhost:3002/api/providers
```

**With Filtering:**
```bash
curl "http://localhost:3002/api/providers?type=qwen-proxy&enabled=true"
```

### Creating a Provider

**Request:**
```bash
curl -X POST http://localhost:3002/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-lm-studio",
    "name": "My LM Studio",
    "type": "lm-studio",
    "enabled": true,
    "priority": 10,
    "description": "Local LM Studio instance"
  }'
```

### Setting Provider Configuration

**Request:**
```bash
curl -X PUT http://localhost:3002/api/providers/my-lm-studio/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "endpoint": "http://localhost:1234",
      "api_key": "sk-...",
      "timeout": 30000
    }
  }'
```

### Viewing Activity Stats

**Request:**
```bash
curl http://localhost:3002/api/activity/stats
```

**Response:**
```json
{
  "total_requests": 1234,
  "average_response_time": 456.78,
  "active_sessions": 23,
  "recent_errors": 5,
  "total_providers": 3,
  "total_models": 10
}
```

### Setting Qwen Credentials

**Request:**
```bash
curl -X POST http://localhost:3002/api/qwen/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cookies": "session=abc123; bx-umidtoken=xyz789",
    "expiresAt": 1699999999
  }'
```

---

## Troubleshooting

### Problem: Server won't start - Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solution:**

```bash
# Find process using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or use kill-port
npx kill-port 3002

# Then restart
npm run dev
```

**Prevention:** The start scripts already include `npx kill-port 3002`

### Problem: Database not found

**Error:**
```
[ERROR] Failed to start API Server: Error: ENOENT: no such file or directory, open '../provider-router/src/database/qwen_proxy.db'
```

**Solution:**

1. **Ensure provider-router database is initialized:**
```bash
cd backend/provider-router
npm install
npm run init-db
```

2. **Verify database path in config:**
```bash
# Check config.js line 17
echo $DATABASE_PATH
```

3. **Use absolute path if needed:**
```bash
export DATABASE_PATH="/absolute/path/to/qwen_proxy.db"
```

### Problem: CORS errors in browser

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:3002/api/providers' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

1. **Check CORS middleware is loaded** (server.js line 26)

2. **Verify origin is allowed:**
```javascript
// middleware/cors.js
const corsOptions = {
  origin: true,  // Should allow all origins
  credentials: true,
}
```

3. **For specific origins:**
```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}
```

### Problem: Proxy won't start via API

**Error:**
```json
{
  "status": "error",
  "message": "Failed to start proxy server: spawn npm ENOENT"
}
```

**Solutions:**

1. **Verify npm is in PATH:**
```bash
which npm
```

2. **Check provider-router exists:**
```bash
ls -la backend/provider-router
```

3. **Verify provider-router dependencies:**
```bash
cd backend/provider-router
npm install
```

4. **Check logs for detailed error:**
```
[Proxy Control] Failed to start proxy process: Error: spawn npm ENOENT
```

### Problem: High memory usage

**Symptom:** Node process using excessive memory

**Solutions:**

1. **Check for memory leaks:**
```bash
node --inspect src/index.js
# Open chrome://inspect
```

2. **Limit process memory:**
```bash
node --max-old-space-size=512 src/index.js
```

3. **Review database queries:**
   - Check for unbounded result sets
   - Add pagination limits
   - Review response caching

### Problem: Slow API responses

**Solutions:**

1. **Enable query logging:**
```bash
LOG_LEVEL=debug npm run dev
```

2. **Check database indexes:**
   - Verify indexes on frequently queried columns
   - Review provider-router schema

3. **Add request timeouts:**
```javascript
// config.js
request: {
  timeout: 30000  // 30 seconds
}
```

4. **Monitor database file size:**
```bash
ls -lh backend/provider-router/src/database/qwen_proxy.db
```

5. **Cleanup old data:**
```bash
curl -X DELETE http://localhost:3002/api/sessions
```

### Problem: Validation errors

**Error:**
```json
{
  "error": {
    "message": "Validation failed",
    "type": "validation_error",
    "errors": ["id is required and must be a non-empty string"]
  }
}
```

**Solutions:**

1. **Check request body format:**
```bash
curl -X POST http://localhost:3002/api/providers \
  -H "Content-Type: application/json" \
  -d '{"id":"test","name":"Test","type":"lm-studio"}'
```

2. **Verify required fields:**
   - Providers: id, name, type
   - Models: id, name
   - Qwen credentials: token, cookies

3. **Check validation middleware:**
   - See `middleware/validation.js`
   - See `middleware/settings-validation.js`

### Problem: Cannot delete provider

**Error:**
```json
{
  "error": {
    "message": "Cannot delete provider with active sessions",
    "type": "constraint_error"
  }
}
```

**Solution:**

1. **Delete associated sessions first:**
```bash
curl -X DELETE http://localhost:3002/api/sessions
```

2. **Disable provider instead of deleting:**
```bash
curl -X POST http://localhost:3002/api/providers/<id>/disable
```

### Problem: Credentials not persisting

**Symptom:** Qwen credentials lost after restart

**Solutions:**

1. **Verify database write permissions:**
```bash
ls -la backend/provider-router/src/database/qwen_proxy.db
```

2. **Check credentials are saved:**
```bash
curl http://localhost:3002/api/qwen/credentials
```

3. **Verify database service:**
```javascript
// Database service should persist to SQLite
QwenCredentialsService.set(token, cookies, expiresAt)
```

### Problem: Process won't stop gracefully

**Symptom:** Server hangs on shutdown

**Solutions:**

1. **Force exit:**
```bash
kill -9 <PID>
```

2. **Check for open connections:**
```bash
lsof -p <PID>
```

3. **Review cleanup code:**
   - Database connection closed (index.js lines 39, 45)
   - HTTP server closed
   - Child processes terminated

### Debug Mode

**Enable maximum logging:**

```bash
export LOG_LEVEL=debug
export LOG_REQUESTS=true
export LOG_RESPONSES=true
npm run dev
```

**Output includes:**
- Request bodies
- Response data
- Database queries
- Stack traces
- Process events

---

## Summary

The API Server is a comprehensive management interface providing:

- **57+ REST endpoints** across 11 functional categories
- **Shared database access** with provider-router
- **Process management** for provider-router and qwen-proxy
- **Comprehensive error handling** with detailed logging
- **Health monitoring** and activity statistics
- **CORS support** for cross-origin requests

**Key Files:**
- Entry point: `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/index.js`
- Express app: `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/server.js`
- Configuration: `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/config.js`
- Routes: `/Users/chris/Projects/qwen_proxy_opencode/backend/api-server/src/routes/*.js` (11 files)

**Default Configuration:**
- Port: 3002
- Host: localhost
- Log Level: info
- Database: Shared with provider-router

**Architecture Pattern:**
- Re-uses provider-router database services
- Minimal code duplication
- Clean separation of concerns
- Express middleware pipeline
- Centralized error handling

---

**Document Version:** 1.0
**Last Updated:** 2025-11-04
