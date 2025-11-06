# Backend API Server - Comprehensive Analysis

## Overview
The Backend API Server (port 3002) is a management/control plane API for the Qwen Proxy POC system. It provides RESTful endpoints for managing providers, models, credentials, and proxy server lifecycle. The server uses Express.js and SQLite for persistent data storage.

## Key Architecture Details

### Server Configuration
- **Port**: 3002 (configurable via `API_PORT` env var)
- **Host**: localhost (configurable via `API_HOST` env var)
- **Framework**: Express.js
- **Database**: SQLite (shared with provider-router)
- **Data Validation**: Custom middleware with comprehensive validation

### Database Access
- Uses shared database from provider-router module
- Connection initialization at startup via `initDatabase()`
- Graceful shutdown with `closeDatabase()`
- Database path: `provider-router/src/database/qwen_proxy.db`

---

## API Routes Summary

### Base URL
All endpoints are prefixed with `/api/` and served on the API Server (port 3002).

---

## ROUTE 1: Proxy Status & Control
**File**: `src/routes/proxy-control.js`

### GET /api/proxy/status
**Purpose**: Get current status of both proxy servers and dashboard data

**Response (200 OK)**:
```json
{
  "status": "running|partial|stopped",
  "providerRouter": {
    "running": boolean,
    "port": 3001,
    "pid": number|null,
    "uptime": number  // seconds
  },
  "qwenProxy": {
    "running": boolean,
    "port": 3000,
    "pid": number|null,
    "uptime": number  // seconds
  },
  "providers": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "type": "lm-studio|qwen-proxy|qwen-direct",
        "enabled": boolean,
        "priority": number,
        "description": "string|null",
        "runtime_status": "loaded|not_loaded",
        "created_at": number,
        "updated_at": number
      }
    ],
    "total": number,
    "enabled": number
  },
  "models": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "description": "string|null",
        "capabilities": ["string"],
        "status": "active",
        "created_at": number,
        "updated_at": number
      }
    ],
    "total": number
  },
  "credentials": {
    "valid": boolean
  },
  "message": "string"
}
```

### POST /api/proxy/start
**Purpose**: Start both qwen-proxy and provider-router servers

**Response (200 OK)**:
```json
{
  "success": true,
  "status": "starting",
  "providerRouter": {
    "running": boolean,
    "port": 3001,
    "pid": number|null,
    "uptime": number
  },
  "qwenProxy": {
    "running": boolean,
    "port": 3000,
    "pid": number|null,
    "uptime": number
  },
  "message": "Proxy servers are starting..."
}
```

### POST /api/proxy/stop
**Purpose**: Stop both proxy servers

**Response (200 OK)**:
```json
{
  "success": true,
  "status": "stopped",
  "providerRouter": {
    "running": false,
    "port": 3001,
    "pid": null,
    "uptime": 0
  },
  "qwenProxy": {
    "running": false,
    "port": 3000,
    "pid": null,
    "uptime": 0
  },
  "message": "Proxy servers stopped successfully"
}
```

---

## ROUTE 2: Providers Management
**File**: `src/routes/providers.js`

### GET /api/providers
**Purpose**: List all providers with optional filtering

**Query Parameters**:
- `type` (optional): Filter by type - "lm-studio", "qwen-proxy", or "qwen-direct"
- `enabled` (optional): Filter by enabled status - "true" or "false"

**Response (200 OK)**:
```json
{
  "providers": [
    {
      "id": "string",
      "name": "string",
      "type": "lm-studio|qwen-proxy|qwen-direct",
      "enabled": boolean,
      "priority": number,
      "description": "string|null",
      "runtime_status": "loaded|not_loaded",
      "created_at": number,
      "updated_at": number
    }
  ],
  "total": number
}
```

### GET /api/providers/:id
**Purpose**: Get detailed provider information including config and linked models

**Path Parameters**:
- `id` (required): Provider ID (slug format)

**Response (200 OK)**:
```json
{
  "id": "string",
  "name": "string",
  "type": "lm-studio|qwen-proxy|qwen-direct",
  "enabled": boolean,
  "priority": number,
  "description": "string|null",
  "runtime_status": "loaded|not_loaded",
  "created_at": number,
  "updated_at": number,
  "config": {
    "key1": "value1|***MASKED***",
    "key2": "value2|***MASKED***"
  },
  "models": [
    {
      "id": "string",
      "name": "string",
      "capabilities": ["string"],
      "is_default": boolean,
      "provider_config": {} | null
    }
  ]
}
```

### POST /api/providers
**Purpose**: Create a new provider

**Request Body**:
```json
{
  "id": "string",           // required: lowercase-slug format
  "name": "string",         // required: display name
  "type": "string",         // required: "lm-studio", "qwen-proxy", or "qwen-direct"
  "enabled": boolean,       // optional: default true
  "priority": number,       // optional: default 0
  "description": "string",  // optional
  "config": {               // optional: key-value configuration
    "baseURL": "http://...",
    "apiKey": "secret..."
  }
}
```

**Response (201 Created)**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "enabled": boolean,
  "priority": number,
  "description": "string|null",
  "created_at": number,
  "updated_at": number,
  "config": {}
}
```

### PUT /api/providers/:id
**Purpose**: Update provider details

**Request Body** (all fields optional):
```json
{
  "name": "string",
  "type": "string",
  "enabled": boolean,
  "priority": number,
  "description": "string"
}
```

**Response (200 OK)**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "enabled": boolean,
  "priority": number,
  "description": "string|null",
  "created_at": number,
  "updated_at": number
}
```

### DELETE /api/providers/:id
**Purpose**: Delete a provider and cascade delete linked models/configs

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Provider deleted"
}
```

### POST /api/providers/:id/enable
**Purpose**: Enable a provider

**Response (200 OK)**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "enabled": true,
  "priority": number,
  "description": "string|null",
  "created_at": number,
  "updated_at": number,
  "message": "Provider enabled"
}
```

### POST /api/providers/:id/disable
**Purpose**: Disable a provider

**Response (200 OK)**:
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "enabled": false,
  "priority": number,
  "description": "string|null",
  "created_at": number,
  "updated_at": number,
  "message": "Provider disabled"
}
```

### POST /api/providers/:id/test
**Purpose**: Test provider health/connectivity

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "healthy": boolean,
  "duration_ms": number,
  "timestamp": number
}
```

### POST /api/providers/:id/reload
**Purpose**: Reload provider configuration from database into runtime

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "name": "string",
  "type": "string",
  "message": "Provider reloaded successfully",
  "timestamp": number
}
```

---

## ROUTE 3: Provider Configuration
**File**: `src/routes/provider-configs.js`

### GET /api/providers/:id/config
**Purpose**: Get all configuration for a provider

**Query Parameters**:
- `mask` (optional): Whether to mask sensitive values - default: true

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "config": {
    "baseURL": "http://localhost:8000",
    "apiKey": "***MASKED***",
    "timeout": "30000"
  },
  "masked": boolean
}
```

### PUT /api/providers/:id/config
**Purpose**: Bulk update provider configuration

**Request Body**:
```json
{
  "config": {
    "baseURL": "http://localhost:8000",
    "apiKey": "secret-key",
    "timeout": 30000
  }
}
```

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "config": {
    "baseURL": "http://localhost:8000",
    "apiKey": "***MASKED***",
    "timeout": "30000"
  },
  "updated_count": number
}
```

### PATCH /api/providers/:id/config/:key
**Purpose**: Update a single configuration value

**Request Body**:
```json
{
  "value": "any-value",
  "is_sensitive": boolean  // optional: auto-detected based on key name
}
```

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "key": "string",
  "value": "***MASKED***|actual-value",
  "is_sensitive": boolean,
  "updated_at": number
}
```

### DELETE /api/providers/:id/config/:key
**Purpose**: Delete a configuration key

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Configuration key deleted"
}
```

---

## ROUTE 4: Models Management
**File**: `src/routes/models.js`

### GET /api/models
**Purpose**: List all models with optional filtering

**Query Parameters**:
- `capability` (optional): Filter by capability (e.g., "chat", "vision")

**Response (200 OK)**:
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "capabilities": ["chat", "vision"],
      "status": "active",
      "created_at": number,
      "updated_at": number
    }
  ],
  "total": number
}
```

### GET /api/models/:id
**Purpose**: Get detailed model information with provider mappings

**Path Parameters**:
- `id` (required): Model ID (slug format)

**Response (200 OK)**:
```json
{
  "model": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "capabilities": ["string"],
    "status": "active",
    "created_at": number,
    "updated_at": number,
    "providers": [
      {
        "id": "string",
        "name": "string",
        "type": "lm-studio|qwen-proxy|qwen-direct",
        "enabled": boolean,
        "priority": number,
        "is_default": boolean,
        "model_config": {} | null,
        "created_at": number,
        "updated_at": number
      }
    ]
  }
}
```

### POST /api/models
**Purpose**: Create a new model

**Request Body**:
```json
{
  "id": "string",               // required: lowercase-slug format
  "name": "string",             // required: display name
  "description": "string",      // optional
  "capabilities": ["string"]    // optional: default []
}
```

**Response (201 Created)**:
```json
{
  "model": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "capabilities": ["string"],
    "status": "active",
    "created_at": number,
    "updated_at": number
  }
}
```

### PUT /api/models/:id
**Purpose**: Update model details

**Request Body** (all fields optional):
```json
{
  "name": "string",
  "description": "string",
  "capabilities": ["string"]
}
```

**Response (200 OK)**:
```json
{
  "model": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "capabilities": ["string"],
    "status": "active",
    "created_at": number,
    "updated_at": number
  }
}
```

### DELETE /api/models/:id
**Purpose**: Delete a model and cascade delete provider links

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Model deleted"
}
```

---

## ROUTE 5: Provider-Model Mappings
**File**: `src/routes/provider-models.js`

### GET /api/providers/:id/models
**Purpose**: Get all models linked to a provider

**Path Parameters**:
- `id` (required): Provider ID

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "models": [
    {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "capabilities": ["string"],
      "status": "active",
      "is_default": boolean,
      "provider_config": {} | null,
      "created_at": number,
      "updated_at": number
    }
  ],
  "total": number
}
```

### POST /api/providers/:id/models
**Purpose**: Link a model to a provider

**Request Body**:
```json
{
  "model_id": "string",    // required: model ID to link
  "is_default": boolean,   // optional: default false
  "config": {}             // optional: provider-specific model config
}
```

**Response (201 Created)**:
```json
{
  "id": number,
  "provider_id": "string",
  "model_id": "string",
  "is_default": boolean,
  "config": {} | null,
  "created_at": number,
  "updated_at": number
}
```

### DELETE /api/providers/:id/models/:modelId
**Purpose**: Unlink a model from a provider

**Path Parameters**:
- `id` (required): Provider ID
- `modelId` (required): Model ID

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Model unlinked from provider"
}
```

### PUT /api/providers/:id/models/:modelId/default
**Purpose**: Set a model as the default for a provider

**Path Parameters**:
- `id` (required): Provider ID
- `modelId` (required): Model ID

**Response (200 OK)**:
```json
{
  "provider_id": "string",
  "default_model": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "capabilities": ["string"],
    "is_default": true,
    "provider_config": {} | null,
    "created_at": number,
    "updated_at": number
  },
  "message": "Default model updated"
}
```

---

## ROUTE 6: Qwen Credentials Management
**File**: `src/routes/qwen-credentials.js`

### GET /api/qwen/credentials
**Purpose**: Get current Qwen credentials status (without sensitive data)

**Response (200 OK)**:
```json
{
  "hasCredentials": boolean,
  "expiresAt": number | null,
  "isValid": boolean,
  "createdAt": number,
  "updatedAt": number
}
```

OR (if no credentials):
```json
{
  "hasCredentials": false,
  "expiresAt": null,
  "isValid": false
}
```

### POST /api/qwen/credentials
**Purpose**: Set or update Qwen credentials

**Request Body**:
```json
{
  "token": "string",         // required: bx-umidtoken value
  "cookies": "string",       // required: Cookie header value
  "expiresAt": number        // optional: Unix timestamp when credentials expire
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Qwen credentials updated successfully",
  "id": number,
  "expiresAt": number | null
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": {
    "message": "Validation failed",
    "type": "validation_error",
    "errors": [
      "token is required and must be a non-empty string",
      "cookies is required and must be a non-empty string"
    ]
  }
}
```

### DELETE /api/qwen/credentials
**Purpose**: Delete all Qwen credentials

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Qwen credentials deleted",
  "deleted": number
}
```

---

## Data Structures

### Provider Object
```javascript
{
  id: "string",              // slug format: lowercase-slug
  name: "string",            // display name
  type: "lm-studio" | "qwen-proxy" | "qwen-direct",
  enabled: boolean,
  priority: number,          // higher = higher priority in routing
  description: string | null,
  runtime_status: "loaded" | "not_loaded",  // from status endpoint only
  created_at: number,        // timestamp
  updated_at: number         // timestamp
}
```

### Model Object
```javascript
{
  id: "string",              // slug format
  name: "string",            // display name
  description: string | null,
  capabilities: ["string"],  // e.g., ["chat", "vision"]
  status: "active",          // computed field
  created_at: number,
  updated_at: number
}
```

### ProviderModelLink Object
```javascript
{
  id: number,
  provider_id: "string",
  model_id: "string",
  is_default: boolean,
  config: object | null,     // provider-specific model config
  created_at: number,
  updated_at: number
}
```

### QwenCredentials Object
```javascript
{
  hasCredentials: boolean,
  expiresAt: number | null,  // Unix timestamp
  isValid: boolean,          // not expired and has required fields
  createdAt: number,
  updatedAt: number
}
```

### Error Response Format
```javascript
{
  error: {
    message: "string",                    // user-friendly message
    type: "validation_error" | "not_found_error" | "conflict_error" | "server_error",
    code: "string",                       // machine-readable error code
    errors: ["string"] | undefined        // validation errors only
  }
}
```

---

## Validation Rules

### Provider ID Format
- Lowercase letters, numbers, and hyphens only
- Required for POST, optional for PUT
- Example: "my-provider", "lm-studio-1"

### Model ID Format
- Lowercase letters, numbers, and hyphens only
- Required for POST, optional for PUT
- Example: "qwen-max", "claude-3-5-sonnet"

### Provider Types
- Valid types: "lm-studio", "qwen-proxy", "qwen-direct"
- Required for provider creation

### Sensitive Configuration Keys
Auto-detected if key name contains: "key", "secret", "password", or "token"
Can be explicitly marked with `is_sensitive: true` in PATCH request

### Credentials Validation
- Token: required, non-empty string
- Cookies: required, non-empty string
- expiresAt: optional, must be positive Unix timestamp

---

## Patterns & Best Practices for Frontend Integration

### 1. Fetch Providers and Models Together
```javascript
// Get status includes both providers and models
const response = await fetch('http://localhost:3002/api/proxy/status');
const { providers, models } = response.json();
```

### 2. Display Provider Details with Models
```javascript
// Get provider with linked models
const response = await fetch('http://localhost:3002/api/providers/my-provider');
const { config, models } = response.json();
// config is masked by default, models show relationships
```

### 3. Link Models to Providers
```javascript
// Link a model to a provider
await fetch('http://localhost:3002/api/providers/my-provider/models', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model_id: 'qwen-max',
    is_default: true
  })
});
```

### 4. Handle Sensitive Data
```javascript
// Default: sensitive values are masked
const config = await fetch('http://localhost:3002/api/providers/id/config')
  .then(r => r.json());
// Returns: { apiKey: '***MASKED***' }

// Opt-in to unmask (if needed)
const unmasked = await fetch('http://localhost:3002/api/providers/id/config?mask=false')
  .then(r => r.json());
// Returns: { apiKey: 'actual-secret' }
```

### 5. Check Credentials Status
```javascript
// Get credentials without exposing sensitive data
const creds = await fetch('http://localhost:3002/api/qwen/credentials')
  .then(r => r.json());

if (creds.isValid) {
  console.log('Credentials are valid and not expired');
} else {
  console.log('Credentials missing or expired');
}
```

### 6. Proper Error Handling
```javascript
try {
  const response = await fetch('http://localhost:3002/api/providers');
  if (!response.ok) {
    const error = await response.json();
    console.error(`${error.error.type}: ${error.error.message}`);
    console.error('Details:', error.error.errors);
  }
} catch (e) {
  console.error('Network error:', e);
}
```

### 7. Filter Providers by Type
```javascript
// List only qwen-direct providers
const response = await fetch('http://localhost:3002/api/providers?type=qwen-direct');

// List only enabled providers
const response = await fetch('http://localhost:3002/api/providers?enabled=true');

// Combine filters
const response = await fetch('http://localhost:3002/api/providers?type=lm-studio&enabled=true');
```

### 8. Filter Models by Capability
```javascript
// List models with chat capability
const response = await fetch('http://localhost:3002/api/models?capability=chat');
```

---

## Common Use Cases

### Use Case 1: Dashboard Overview
1. GET `/api/proxy/status` - Get all data in one call
2. Display providers with enable/disable toggles
3. Show model counts and capabilities
4. Display credentials validity

### Use Case 2: Add New Provider
1. POST `/api/providers` with id, name, type
2. POST `/api/providers/:id/config` to add configuration
3. GET `/api/models` to list available models
4. POST `/api/providers/:id/models` to link models
5. PUT `/api/providers/:id/models/:modelId/default` to set default

### Use Case 3: Configure Provider
1. GET `/api/providers/:id` to fetch current config
2. PATCH `/api/providers/:id/config/:key` for individual values
   OR PUT `/api/providers/:id/config` for bulk update
3. POST `/api/providers/:id/test` to verify connection

### Use Case 4: Manage Credentials
1. GET `/api/qwen/credentials` to check current status
2. If not valid: POST `/api/qwen/credentials` with token/cookies
3. DELETE `/api/qwen/credentials` to clear
4. POST `/api/proxy/start` to restart services with new creds

### Use Case 5: Server Lifecycle
1. POST `/api/proxy/start` to start both proxy servers
2. GET `/api/proxy/status` periodically to monitor
3. POST `/api/proxy/stop` to stop when needed

---

## HTTP Status Codes

| Code | Meaning | Context |
|------|---------|---------|
| 200 | OK | Successful read/update operation |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Validation error |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server-side error |

---

## Important Notes

1. **Database Sharing**: The API Server shares the same SQLite database with provider-router. Changes made through one affect the other.

2. **Sensitive Data Masking**: By default, configuration values for keys containing "key", "secret", "password", or "token" are masked in responses.

3. **Provider Types**: Each type has different required configurations:
   - `lm-studio`: requires `baseURL`
   - `qwen-proxy`: requires `baseURL`
   - `qwen-direct`: requires `token` and `cookies`

4. **Cascade Operations**: Deleting a provider cascades to delete its configs and model links. Deleting a model cascades to delete its provider links.

5. **Runtime Status**: The `runtime_status` field only appears in status endpoint. It indicates whether a provider is loaded in the running provider-router process.

6. **Transactions**: Provider-model link operations use SQLite transactions for data consistency.

7. **Boolean Conversion**: SQLite stores booleans as 0/1; the service layer automatically converts to true/false for JSON responses.

8. **JSON Serialization**: Capabilities and config objects are stored as JSON strings in SQLite and automatically parsed/serialized by service layers.
