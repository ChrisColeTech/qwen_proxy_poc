# Provider Management API Reference

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Providers API](#providers-api)
- [Provider Configuration API](#provider-configuration-api)
- [Models API](#models-api)
- [Provider Models API](#provider-models-api)
- [Health Check API](#health-check-api)

## Overview

The Provider Management API provides RESTful endpoints for managing LLM provider configurations, models, and their relationships. All endpoints accept and return JSON data.

### API Features

- Create, read, update, and delete providers
- Manage provider configurations (key-value pairs)
- Define and manage models
- Map models to providers
- Enable/disable providers
- Test provider connectivity
- Reload provider configurations

### API Version

Current API version: **v1**

All management endpoints are prefixed with `/v1`.

## Base URL

```
http://localhost:3001/v1
```

Replace `localhost:3001` with your server's hostname and port.

## Authentication

**Current State**: No authentication required

**Future**: API key or JWT authentication will be added. For now, ensure the API is not exposed to untrusted networks.

## Error Handling

### Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_INPUT | Request validation failed |
| NOT_FOUND | Resource not found |
| DUPLICATE | Resource already exists |
| DATABASE_ERROR | Database operation failed |
| PROVIDER_ERROR | Provider operation failed |

### Error Examples

#### 400 Bad Request

```json
{
  "error": "Invalid provider type",
  "code": "INVALID_INPUT",
  "details": {
    "type": "Must be one of: lm-studio, qwen-proxy, qwen-direct"
  }
}
```

#### 404 Not Found

```json
{
  "error": "Provider not found",
  "code": "NOT_FOUND",
  "details": {
    "provider_id": "lm-studio-unknown"
  }
}
```

#### 409 Conflict

```json
{
  "error": "Provider with this name already exists",
  "code": "DUPLICATE",
  "details": {
    "name": "LM Studio Home"
  }
}
```

## Providers API

### List All Providers

Get a list of all providers.

**Endpoint**: `GET /v1/providers`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by provider type |
| enabled | boolean | No | Filter by enabled status |

**Request Example**:

```bash
curl http://localhost:3001/v1/providers

# Filter by type
curl http://localhost:3001/v1/providers?type=lm-studio

# Filter by enabled status
curl http://localhost:3001/v1/providers?enabled=true
```

**Response Example** (200 OK):

```json
{
  "providers": [
    {
      "id": "lm-studio-home",
      "name": "LM Studio Home",
      "type": "lm-studio",
      "enabled": true,
      "priority": 10,
      "description": "Local LM Studio instance",
      "created_at": 1706745600000,
      "updated_at": 1706745600000
    },
    {
      "id": "qwen-direct-1",
      "name": "Qwen Direct API",
      "type": "qwen-direct",
      "enabled": true,
      "priority": 5,
      "description": "Direct Qwen API access",
      "created_at": 1706745700000,
      "updated_at": 1706745700000
    }
  ],
  "count": 2
}
```

### Get Provider Details

Get details for a specific provider.

**Endpoint**: `GET /v1/providers/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/providers/lm-studio-home
```

**Response Example** (200 OK):

```json
{
  "id": "lm-studio-home",
  "name": "LM Studio Home",
  "type": "lm-studio",
  "enabled": true,
  "priority": 10,
  "description": "Local LM Studio instance",
  "created_at": 1706745600000,
  "updated_at": 1706745600000
}
```

**Error Response** (404 Not Found):

```json
{
  "error": "Provider not found",
  "code": "NOT_FOUND"
}
```

### Create Provider

Create a new provider.

**Endpoint**: `POST /v1/providers`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique provider ID (slug format) |
| name | string | Yes | Display name |
| type | string | Yes | Provider type (lm-studio, qwen-proxy, qwen-direct) |
| enabled | boolean | No | Enabled status (default: true) |
| priority | integer | No | Priority for routing (default: 0) |
| description | string | No | Provider description |
| config | object | No | Provider configuration (key-value pairs) |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lm-studio-gpu",
    "name": "LM Studio GPU Server",
    "type": "lm-studio",
    "enabled": true,
    "priority": 10,
    "description": "LM Studio on GPU server",
    "config": {
      "baseURL": "http://192.168.0.50:1234/v1",
      "defaultModel": "qwen3-max",
      "timeout": 180000
    }
  }'
```

**Response Example** (201 Created):

```json
{
  "id": "lm-studio-gpu",
  "name": "LM Studio GPU Server",
  "type": "lm-studio",
  "enabled": true,
  "priority": 10,
  "description": "LM Studio on GPU server",
  "created_at": 1706745800000,
  "updated_at": 1706745800000
}
```

**Error Response** (400 Bad Request):

```json
{
  "error": "Invalid provider type",
  "code": "INVALID_INPUT",
  "details": {
    "type": "Must be one of: lm-studio, qwen-proxy, qwen-direct"
  }
}
```

**Error Response** (409 Conflict):

```json
{
  "error": "Provider with this ID already exists",
  "code": "DUPLICATE"
}
```

### Update Provider

Update an existing provider.

**Endpoint**: `PUT /v1/providers/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Display name |
| enabled | boolean | No | Enabled status |
| priority | integer | No | Priority for routing |
| description | string | No | Provider description |

**Note**: Provider `type` cannot be changed after creation.

**Request Example**:

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-gpu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LM Studio GPU Server (Updated)",
    "priority": 15,
    "description": "Updated description"
  }'
```

**Response Example** (200 OK):

```json
{
  "id": "lm-studio-gpu",
  "name": "LM Studio GPU Server (Updated)",
  "type": "lm-studio",
  "enabled": true,
  "priority": 15,
  "description": "Updated description",
  "created_at": 1706745800000,
  "updated_at": 1706745900000
}
```

### Delete Provider

Delete a provider.

**Endpoint**: `DELETE /v1/providers/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/providers/lm-studio-gpu
```

**Response Example** (200 OK):

```json
{
  "message": "Provider deleted successfully",
  "id": "lm-studio-gpu"
}
```

**Error Response** (404 Not Found):

```json
{
  "error": "Provider not found",
  "code": "NOT_FOUND"
}
```

### Enable Provider

Enable a provider.

**Endpoint**: `POST /v1/providers/:id/enable`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/enable
```

**Response Example** (200 OK):

```json
{
  "message": "Provider enabled successfully",
  "id": "lm-studio-gpu",
  "enabled": true
}
```

### Disable Provider

Disable a provider.

**Endpoint**: `POST /v1/providers/:id/disable`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/disable
```

**Response Example** (200 OK):

```json
{
  "message": "Provider disabled successfully",
  "id": "lm-studio-gpu",
  "enabled": false
}
```

### Test Provider

Test provider connectivity and health.

**Endpoint**: `POST /v1/providers/:id/test`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/test
```

**Response Example** (200 OK):

```json
{
  "provider_id": "lm-studio-gpu",
  "status": "healthy",
  "response_time_ms": 45,
  "details": {
    "available_models": ["qwen3-max", "qwen3-coder"]
  }
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "provider_id": "lm-studio-gpu",
  "status": "unhealthy",
  "error": "Connection refused",
  "details": {
    "baseURL": "http://192.168.0.50:1234/v1"
  }
}
```

### Reload Provider

Reload provider configuration from database.

**Endpoint**: `POST /v1/providers/:id/reload`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/reload
```

**Response Example** (200 OK):

```json
{
  "message": "Provider reloaded successfully",
  "id": "lm-studio-gpu"
}
```

## Provider Configuration API

### Get Provider Configuration

Get all configuration for a provider.

**Endpoint**: `GET /v1/providers/:id/config`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/providers/lm-studio-gpu/config
```

**Response Example** (200 OK):

```json
{
  "provider_id": "lm-studio-gpu",
  "config": {
    "baseURL": "http://192.168.0.50:1234/v1",
    "defaultModel": "qwen3-max",
    "timeout": 180000,
    "apiKey": "***"
  }
}
```

**Note**: Sensitive values (marked with `is_sensitive=true`) are masked with `***`.

### Update Provider Configuration (Bulk)

Update multiple configuration keys at once.

**Endpoint**: `PUT /v1/providers/:id/config`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Body**:

```json
{
  "config": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Request Example**:

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-gpu/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "baseURL": "http://192.168.0.60:1234/v1",
      "timeout": 240000
    }
  }'
```

**Response Example** (200 OK):

```json
{
  "message": "Configuration updated successfully",
  "provider_id": "lm-studio-gpu",
  "updated_keys": ["baseURL", "timeout"]
}
```

### Update Single Configuration Key

Update a single configuration key.

**Endpoint**: `PATCH /v1/providers/:id/config/:key`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |
| key | string | Yes | Configuration key |

**Request Body**:

```json
{
  "value": "new_value",
  "is_sensitive": false
}
```

**Request Example**:

```bash
curl -X PATCH http://localhost:3001/v1/providers/lm-studio-gpu/config/baseURL \
  -H "Content-Type: application/json" \
  -d '{
    "value": "http://192.168.0.70:1234/v1"
  }'
```

**Response Example** (200 OK):

```json
{
  "provider_id": "lm-studio-gpu",
  "key": "baseURL",
  "value": "http://192.168.0.70:1234/v1",
  "updated_at": 1706746000000
}
```

### Delete Configuration Key

Delete a configuration key.

**Endpoint**: `DELETE /v1/providers/:id/config/:key`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |
| key | string | Yes | Configuration key |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/providers/lm-studio-gpu/config/timeout
```

**Response Example** (200 OK):

```json
{
  "message": "Configuration key deleted successfully",
  "provider_id": "lm-studio-gpu",
  "key": "timeout"
}
```

## Models API

### List All Models

Get a list of all models.

**Endpoint**: `GET /v1/models`

**Request Example**:

```bash
curl http://localhost:3001/v1/models
```

**Response Example** (200 OK):

```json
{
  "models": [
    {
      "id": "qwen3-max",
      "name": "Qwen 3 Max",
      "description": "Most capable Qwen model",
      "capabilities": ["chat", "completion", "vision"],
      "created_at": 1706745600000,
      "updated_at": 1706745600000
    },
    {
      "id": "qwen3-coder",
      "name": "Qwen 3 Coder",
      "description": "Specialized coding model",
      "capabilities": ["chat", "completion", "code"],
      "created_at": 1706745700000,
      "updated_at": 1706745700000
    }
  ],
  "count": 2
}
```

### Get Model Details

Get details for a specific model.

**Endpoint**: `GET /v1/models/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Model ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/models/qwen3-max
```

**Response Example** (200 OK):

```json
{
  "id": "qwen3-max",
  "name": "Qwen 3 Max",
  "description": "Most capable Qwen model",
  "capabilities": ["chat", "completion", "vision"],
  "created_at": 1706745600000,
  "updated_at": 1706745600000
}
```

### Create Model

Create a new model.

**Endpoint**: `POST /v1/models`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique model ID |
| name | string | Yes | Display name |
| description | string | No | Model description |
| capabilities | array | No | Array of capability strings |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "id": "gpt-4",
    "name": "GPT-4",
    "description": "OpenAI GPT-4 model",
    "capabilities": ["chat", "completion", "vision", "tools"]
  }'
```

**Response Example** (201 Created):

```json
{
  "id": "gpt-4",
  "name": "GPT-4",
  "description": "OpenAI GPT-4 model",
  "capabilities": ["chat", "completion", "vision", "tools"],
  "created_at": 1706745800000,
  "updated_at": 1706745800000
}
```

### Update Model

Update an existing model.

**Endpoint**: `PUT /v1/models/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Model ID |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Display name |
| description | string | No | Model description |
| capabilities | array | No | Array of capability strings |

**Request Example**:

```bash
curl -X PUT http://localhost:3001/v1/models/gpt-4 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "capabilities": ["chat", "completion", "vision", "tools", "code"]
  }'
```

**Response Example** (200 OK):

```json
{
  "id": "gpt-4",
  "name": "GPT-4",
  "description": "Updated description",
  "capabilities": ["chat", "completion", "vision", "tools", "code"],
  "created_at": 1706745800000,
  "updated_at": 1706745900000
}
```

### Delete Model

Delete a model.

**Endpoint**: `DELETE /v1/models/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Model ID |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/models/gpt-4
```

**Response Example** (200 OK):

```json
{
  "message": "Model deleted successfully",
  "id": "gpt-4"
}
```

## Provider Models API

### Get Models for Provider

Get all models linked to a provider.

**Endpoint**: `GET /v1/providers/:id/models`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/providers/lm-studio-gpu/models
```

**Response Example** (200 OK):

```json
{
  "provider_id": "lm-studio-gpu",
  "models": [
    {
      "id": "qwen3-max",
      "name": "Qwen 3 Max",
      "is_default": true,
      "config": null
    },
    {
      "id": "qwen3-coder",
      "name": "Qwen 3 Coder",
      "is_default": false,
      "config": null
    }
  ],
  "count": 2
}
```

### Link Model to Provider

Link a model to a provider.

**Endpoint**: `POST /v1/providers/:id/models`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model_id | string | Yes | Model ID to link |
| is_default | boolean | No | Set as default model (default: false) |
| config | object | No | Provider-specific model config |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/models \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "qwen3-max",
    "is_default": true
  }'
```

**Response Example** (201 Created):

```json
{
  "provider_id": "lm-studio-gpu",
  "model_id": "qwen3-max",
  "is_default": true,
  "created_at": 1706745800000
}
```

### Unlink Model from Provider

Unlink a model from a provider.

**Endpoint**: `DELETE /v1/providers/:id/models/:modelId`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |
| modelId | string | Yes | Model ID |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/providers/lm-studio-gpu/models/qwen3-coder
```

**Response Example** (200 OK):

```json
{
  "message": "Model unlinked successfully",
  "provider_id": "lm-studio-gpu",
  "model_id": "qwen3-coder"
}
```

### Set Default Model

Set a model as the default for a provider.

**Endpoint**: `PUT /v1/providers/:id/models/:modelId/default`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |
| modelId | string | Yes | Model ID |

**Request Example**:

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-gpu/models/qwen3-coder/default
```

**Response Example** (200 OK):

```json
{
  "message": "Default model updated successfully",
  "provider_id": "lm-studio-gpu",
  "model_id": "qwen3-coder",
  "is_default": true
}
```

## Health Check API

### Server Health

Check server health and status.

**Endpoint**: `GET /health`

**Request Example**:

```bash
curl http://localhost:3001/health
```

**Response Example** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": 1706745800000,
  "uptime_seconds": 3600,
  "version": "1.0.0"
}
```

### Provider Health

Check health of all registered providers.

**Endpoint**: `GET /v1/providers/health`

**Request Example**:

```bash
curl http://localhost:3001/v1/providers/health
```

**Response Example** (200 OK):

```json
{
  "providers": [
    {
      "id": "lm-studio-gpu",
      "status": "healthy",
      "response_time_ms": 45
    },
    {
      "id": "qwen-direct-1",
      "status": "healthy",
      "response_time_ms": 120
    }
  ],
  "healthy_count": 2,
  "total_count": 2
}
```

## Rate Limits

**Current State**: No rate limiting implemented

**Recommendations**:
- Implement rate limiting on management endpoints
- Typical limits: 100 requests per minute per IP
- Return 429 Too Many Requests when exceeded

## Pagination

**Current State**: No pagination implemented

**Future**: Add pagination for large result sets:

```
GET /v1/providers?page=2&limit=50
```

Response includes pagination metadata:

```json
{
  "providers": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}
```

## Webhooks

**Future Feature**: Webhook support for configuration changes

Example webhook payload:

```json
{
  "event": "provider.updated",
  "timestamp": 1706745800000,
  "data": {
    "provider_id": "lm-studio-gpu",
    "changes": {
      "priority": { "old": 10, "new": 15 }
    }
  }
}
```

## Related Documentation

- [Provider Configuration System Architecture](../architecture/provider-configuration-system.md)
- [Managing Providers via API](../guides/managing-providers-via-api.md)
- [Managing Providers via CLI](../guides/managing-providers-via-cli.md)
- [Adding New Provider Types](../development/adding-new-provider-types.md)
