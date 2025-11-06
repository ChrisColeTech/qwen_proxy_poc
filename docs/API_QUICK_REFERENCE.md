# API Quick Reference

## Base URL
`http://localhost:3002/api`

## All Endpoints at a Glance

### Proxy Control
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/proxy/status` | Get proxy status & dashboard data |
| POST | `/proxy/start` | Start both proxy servers |
| POST | `/proxy/stop` | Stop both proxy servers |

### Providers (CRUD)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/providers` | List all providers |
| GET | `/providers/:id` | Get provider details |
| POST | `/providers` | Create provider |
| PUT | `/providers/:id` | Update provider |
| DELETE | `/providers/:id` | Delete provider |
| POST | `/providers/:id/enable` | Enable provider |
| POST | `/providers/:id/disable` | Disable provider |
| POST | `/providers/:id/test` | Test provider health |
| POST | `/providers/:id/reload` | Reload provider config |

### Provider Config
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/providers/:id/config` | Get provider config |
| PUT | `/providers/:id/config` | Bulk update config |
| PATCH | `/providers/:id/config/:key` | Update single config |
| DELETE | `/providers/:id/config/:key` | Delete config key |

### Models (CRUD)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/models` | List all models |
| GET | `/models/:id` | Get model details |
| POST | `/models` | Create model |
| PUT | `/models/:id` | Update model |
| DELETE | `/models/:id` | Delete model |

### Provider-Model Links
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/providers/:id/models` | Get provider's models |
| POST | `/providers/:id/models` | Link model to provider |
| DELETE | `/providers/:id/models/:modelId` | Unlink model |
| PUT | `/providers/:id/models/:modelId/default` | Set default model |

### Qwen Credentials
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/qwen/credentials` | Get credentials status |
| POST | `/qwen/credentials` | Set/update credentials |
| DELETE | `/qwen/credentials` | Delete credentials |

---

## Query Parameters

### GET /api/providers
- `type=lm-studio|qwen-proxy|qwen-direct` - Filter by type
- `enabled=true|false` - Filter by enabled status

### GET /api/models
- `capability=string` - Filter by capability

### GET /api/providers/:id/config
- `mask=false` - Show unmasked sensitive values (default: true)

---

## Common Request/Response Patterns

### Create Provider
```json
POST /api/providers
{
  "id": "my-provider",
  "name": "My Provider",
  "type": "lm-studio"
}
// 201 Created
{
  "id": "my-provider",
  "name": "My Provider",
  "type": "lm-studio",
  "enabled": true,
  "priority": 0,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

### Set Credentials
```json
POST /api/qwen/credentials
{
  "token": "bx-token-value",
  "cookies": "cookie=value; another=value"
}
// 200 OK
{
  "success": true,
  "message": "Qwen credentials updated successfully",
  "id": 1,
  "expiresAt": null
}
```

### Link Model to Provider
```json
POST /api/providers/my-provider/models
{
  "model_id": "qwen-max",
  "is_default": true
}
// 201 Created
{
  "id": 1,
  "provider_id": "my-provider",
  "model_id": "qwen-max",
  "is_default": true,
  "config": null,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

### Update Provider Config
```json
PUT /api/providers/my-provider/config
{
  "config": {
    "baseURL": "http://localhost:8000",
    "timeout": "30000"
  }
}
// 200 OK
{
  "provider_id": "my-provider",
  "config": {
    "baseURL": "http://localhost:8000",
    "timeout": "30000"
  },
  "updated_count": 2
}
```

---

## Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "message": "Human readable message",
    "type": "validation_error|not_found_error|conflict_error|server_error",
    "code": "error_code",
    "errors": ["Error 1", "Error 2"]  // Only for validation errors
  }
}
```

---

## Status Codes Quick Reference

| Code | Scenario |
|------|----------|
| 200 | Success (GET, PUT, PATCH, DELETE) |
| 201 | Success (POST - created) |
| 400 | Bad request / validation error |
| 404 | Resource not found |
| 409 | Conflict (resource already exists) |
| 500 | Server error |

---

## Provider Types & Configs

### lm-studio
- Type: `"lm-studio"`
- Required config: `baseURL`
- Example: `{ "baseURL": "http://localhost:1234" }`

### qwen-proxy
- Type: `"qwen-proxy"`
- Required config: `baseURL`
- Example: `{ "baseURL": "http://localhost:3000" }`

### qwen-direct
- Type: `"qwen-direct"`
- Required config: `token`, `cookies`
- Example: `{ "token": "...", "cookies": "..." }`

---

## Validation Rules

### IDs (Provider & Model)
- Format: `[a-z0-9-]+` (lowercase letters, numbers, hyphens)
- Examples: `my-provider`, `qwen-max`, `lm-studio-1`

### Capabilities
- Array of strings
- Examples: `["chat"]`, `["chat", "vision"]`

### Priority
- Integer number
- Higher = higher priority in routing
- Default: 0

### Enabled Status
- Boolean: true or false
- Default: true

### Credentials
- Token: required, non-empty string
- Cookies: required, non-empty string
- expiresAt: optional, Unix timestamp

---

## Sensitive Field Detection

These configuration keys are automatically masked:
- Contains "key"
- Contains "secret"
- Contains "password"
- Contains "token"

Can be explicitly marked with `is_sensitive: true` in requests.

---

## Frontend Integration Example

```typescript
const API_BASE = 'http://localhost:3002/api';

// Get dashboard overview
const status = await fetch(`${API_BASE}/proxy/status`).then(r => r.json());

// List providers
const providers = await fetch(`${API_BASE}/providers`).then(r => r.json());

// Get provider details
const provider = await fetch(`${API_BASE}/providers/my-provider`).then(r => r.json());

// Update config
await fetch(`${API_BASE}/providers/my-provider/config`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: { baseURL: 'http://localhost:8000' }
  })
});

// Check credentials
const creds = await fetch(`${API_BASE}/qwen/credentials`).then(r => r.json());
if (!creds.isValid) {
  // Set credentials
  await fetch(`${API_BASE}/qwen/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: 'token-value',
      cookies: 'cookie=value'
    })
  });
}
```

