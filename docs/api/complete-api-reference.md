# Complete API Reference

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [OpenAI-Compatible Endpoints](#openai-compatible-endpoints)
  - [Chat Completions](#chat-completions)
  - [List Models](#list-models)
- [Session Management API](#session-management-api)
  - [List Sessions](#list-sessions)
  - [Get Session](#get-session)
  - [Get Session Requests](#get-session-requests)
  - [Delete Session](#delete-session)
  - [Cleanup Expired Sessions](#cleanup-expired-sessions)
- [Request History API](#request-history-api)
  - [List Requests](#list-requests)
  - [Get Request](#get-request)
  - [Delete Request](#delete-request)
- [Response History API](#response-history-api)
  - [List Responses](#list-responses)
  - [Get Response](#get-response)
  - [Get Response by Request](#get-response-by-request)
  - [Get Responses by Session](#get-responses-by-session)
  - [Get Response Statistics](#get-response-statistics)
  - [Delete Response](#delete-response)
- [Provider Management API](#provider-management-api)
  - [List Providers](#list-providers)
  - [Get Provider](#get-provider)
  - [Create Provider](#create-provider)
  - [Update Provider](#update-provider)
  - [Delete Provider](#delete-provider)
  - [Enable Provider](#enable-provider)
  - [Disable Provider](#disable-provider)
  - [Test Provider](#test-provider)
  - [Reload Provider](#reload-provider)
- [Provider Configuration API](#provider-configuration-api)
  - [Get Provider Configuration](#get-provider-configuration)
  - [Update Provider Configuration (Bulk)](#update-provider-configuration-bulk)
  - [Update Single Configuration Key](#update-single-configuration-key)
  - [Delete Configuration Key](#delete-configuration-key)
- [Model Management API](#model-management-api)
  - [List Models](#list-models-management)
  - [Get Model](#get-model)
  - [Create Model](#create-model)
  - [Update Model](#update-model)
  - [Delete Model](#delete-model)
- [Provider-Model Mapping API](#provider-model-mapping-api)
  - [Get Provider Models](#get-provider-models)
  - [Link Model to Provider](#link-model-to-provider)
  - [Unlink Model from Provider](#unlink-model-from-provider)
  - [Set Default Model](#set-default-model)
- [Settings Management API](#settings-management-api)
  - [Get All Settings](#get-all-settings)
  - [Get Setting](#get-setting)
  - [Update Setting](#update-setting)
  - [Bulk Update Settings](#bulk-update-settings)
  - [Delete Setting](#delete-setting)
- [Health Check API](#health-check-api)
  - [Server Health](#server-health)

## Overview

The Qwen Provider Router API provides a comprehensive OpenAI-compatible interface for managing LLM provider configurations, tracking request/response history, managing sessions, and configuring server settings. The API follows REST principles and accepts/returns JSON data.

### Key Features

- **OpenAI Compatibility**: Full support for OpenAI chat completions API
- **Multi-Provider Support**: Route requests to LM Studio, Qwen Direct, or custom providers
- **Session Tracking**: Track conversation sessions with automatic expiration
- **Request/Response Logging**: Complete audit trail of all API interactions
- **Provider Management**: CRUD operations for provider configurations
- **Model Management**: Define and map models to providers
- **Settings Management**: Configure server behavior and provider preferences
- **Statistics & Analytics**: Token usage, success rates, and performance metrics

### API Version

Current API version: **v1**

All endpoints are prefixed with `/v1` except for the health check and root endpoints.

## Base URL

```
http://localhost:3001
```

Replace `localhost:3001` with your server's hostname and port. The default port is 3001, and this can be configured via the `server.port` setting.

## Authentication

**Current State**: No authentication required

**Security Recommendation**: The API currently has no authentication. Ensure the API is not exposed to untrusted networks. Future versions will include API key or JWT authentication.

## Error Handling

### Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": {
    "message": "Error message describing what went wrong",
    "type": "error_type",
    "code": "error_code"
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

### Common Error Types

| Type | Description |
|------|-------------|
| invalid_request_error | Request validation failed |
| not_found_error | Resource not found |
| server_error | Internal server error |

## OpenAI-Compatible Endpoints

### Chat Completions

Create a chat completion using the configured providers.

**Endpoint**: `POST /v1/chat/completions`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | Yes | Model identifier |
| messages | array | Yes | Array of message objects |
| messages[].role | string | Yes | Message role (system, user, assistant) |
| messages[].content | string | Yes | Message content |
| stream | boolean | No | Enable streaming responses (default: false) |
| temperature | number | No | Sampling temperature (0-2) |
| max_tokens | integer | No | Maximum tokens to generate |
| top_p | number | No | Nucleus sampling parameter |
| frequency_penalty | number | No | Frequency penalty (-2.0 to 2.0) |
| presence_penalty | number | No | Presence penalty (-2.0 to 2.0) |
| stop | string/array | No | Stop sequences |

**Request Example (Non-Streaming)**:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

**Response Example (Non-Streaming)** (200 OK):

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1706745600,
  "model": "qwen3-max",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 8,
    "total_tokens": 33
  }
}
```

**Request Example (Streaming)**:

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {
        "role": "user",
        "content": "Count to 5"
      }
    ],
    "stream": true
  }'
```

**Response Example (Streaming)**:

Streaming responses use Server-Sent Events (SSE) format:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":"1"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":", 2"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":", 3"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":", 4"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{"content":", 5"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1706745600,"model":"qwen3-max","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

**Error Response** (500 Internal Server Error):

```json
{
  "error": {
    "message": "Failed to route request: All providers unavailable",
    "type": "server_error",
    "code": "provider_error"
  }
}
```

### List Models

Get a list of available models from the database.

**Endpoint**: `GET /v1/models`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider | string | No | Filter by provider ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/models

# Filter by provider
curl http://localhost:3001/v1/models?provider=lm-studio-default
```

**Response Example** (200 OK):

```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "created": 1706745600000,
      "owned_by": "qwen",
      "permission": [],
      "root": "qwen3-max",
      "parent": null
    },
    {
      "id": "qwen3-coder",
      "object": "model",
      "created": 1706745700000,
      "owned_by": "qwen",
      "permission": [],
      "root": "qwen3-coder",
      "parent": null
    }
  ]
}
```

## Session Management API

Sessions represent conversation contexts and are automatically created for chat completion requests. Each session tracks messages, timestamps, and expiration.

### List Sessions

Get a paginated list of all sessions.

**Endpoint**: `GET /v1/sessions`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of sessions to return (default: 50) |
| offset | integer | No | Number of sessions to skip (default: 0) |
| sort | string | No | Sort order: created_at or last_accessed (default: created_at) |

**Request Example**:

```bash
curl http://localhost:3001/v1/sessions

# With pagination
curl http://localhost:3001/v1/sessions?limit=20&offset=40

# Sort by last accessed
curl http://localhost:3001/v1/sessions?sort=last_accessed
```

**Response Example** (200 OK):

```json
{
  "sessions": [
    {
      "id": "session-abc123",
      "chat_id": "chat-xyz789",
      "parent_id": null,
      "first_user_message": "What is the capital of France?",
      "message_count": 4,
      "created_at": 1706745600000,
      "last_accessed": 1706745800000,
      "expires_at": 1706747400000
    },
    {
      "id": "session-def456",
      "chat_id": "chat-uvw456",
      "parent_id": "session-abc123",
      "first_user_message": "Tell me about Paris landmarks",
      "message_count": 2,
      "created_at": 1706745700000,
      "last_accessed": 1706745750000,
      "expires_at": 1706747500000
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

### Get Session

Get detailed information about a specific session.

**Endpoint**: `GET /v1/sessions/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Session ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/sessions/session-abc123
```

**Response Example** (200 OK):

```json
{
  "id": "session-abc123",
  "chat_id": "chat-xyz789",
  "parent_id": null,
  "first_user_message": "What is the capital of France?",
  "message_count": 4,
  "request_count": 2,
  "created_at": 1706745600000,
  "last_accessed": 1706745800000,
  "expires_at": 1706747400000
}
```

**Error Response** (404 Not Found):

```json
{
  "error": {
    "message": "Session not found",
    "type": "not_found_error",
    "code": "session_not_found"
  }
}
```

### Get Session Requests

Get all requests for a specific session.

**Endpoint**: `GET /v1/sessions/:sessionId/requests`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Session ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of requests to return (default: 100) |
| offset | integer | No | Number of requests to skip (default: 0) |

**Request Example**:

```bash
curl http://localhost:3001/v1/sessions/session-abc123/requests
```

**Response Example** (200 OK):

```json
{
  "session_id": "session-abc123",
  "requests": [
    {
      "id": 1,
      "request_id": "req-abc123",
      "session_id": "session-abc123",
      "timestamp": 1706745600000,
      "method": "POST",
      "path": "/v1/chat/completions",
      "model": "qwen3-max",
      "stream": false,
      "openai_request": {
        "model": "qwen3-max",
        "messages": [
          {
            "role": "user",
            "content": "What is the capital of France?"
          }
        ]
      },
      "qwen_request": {
        "model": "qwen3-max",
        "input": {
          "messages": [
            {
              "role": "user",
              "content": "What is the capital of France?"
            }
          ]
        }
      },
      "created_at": 1706745600000
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### Delete Session

Delete a session and all related requests and responses.

**Endpoint**: `DELETE /v1/sessions/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Session ID |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/sessions/session-abc123
```

**Response Example** (200 OK):

```json
{
  "success": true,
  "message": "Session deleted"
}
```

**Error Response** (404 Not Found):

```json
{
  "error": {
    "message": "Session not found",
    "type": "not_found_error",
    "code": "session_not_found"
  }
}
```

### Cleanup Expired Sessions

Delete all expired sessions.

**Endpoint**: `DELETE /v1/sessions`

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/sessions
```

**Response Example** (200 OK):

```json
{
  "success": true,
  "deleted": 5,
  "message": "Cleaned up 5 expired sessions"
}
```

## Request History API

The request history API provides access to all logged API requests with filtering and pagination.

### List Requests

Get a paginated list of all requests with optional filtering.

**Endpoint**: `GET /v1/requests`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of requests to return (default: 50) |
| offset | integer | No | Number of requests to skip (default: 0) |
| session_id | string | No | Filter by session ID |
| model | string | No | Filter by model name |
| stream | boolean | No | Filter by stream flag (true/false) |
| start_date | integer | No | Filter by start timestamp in milliseconds |
| end_date | integer | No | Filter by end timestamp in milliseconds |

**Request Example**:

```bash
curl http://localhost:3001/v1/requests

# Filter by session
curl http://localhost:3001/v1/requests?session_id=session-abc123

# Filter by model and stream
curl "http://localhost:3001/v1/requests?model=qwen3-max&stream=false"

# Filter by date range
curl "http://localhost:3001/v1/requests?start_date=1706745600000&end_date=1706749200000"
```

**Response Example** (200 OK):

```json
{
  "requests": [
    {
      "id": 1,
      "request_id": "req-abc123",
      "session_id": "session-abc123",
      "timestamp": 1706745600000,
      "method": "POST",
      "path": "/v1/chat/completions",
      "model": "qwen3-max",
      "stream": false,
      "openai_request": {
        "model": "qwen3-max",
        "messages": [
          {
            "role": "user",
            "content": "What is the capital of France?"
          }
        ]
      },
      "qwen_request": {
        "model": "qwen3-max",
        "input": {
          "messages": [
            {
              "role": "user",
              "content": "What is the capital of France?"
            }
          ]
        }
      },
      "response_summary": {
        "response_id": "resp-abc123",
        "finish_reason": "stop",
        "total_tokens": 33,
        "duration_ms": 245,
        "error": null
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

### Get Request

Get detailed information about a specific request.

**Endpoint**: `GET /v1/requests/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string/integer | Yes | Request database ID (integer) or request_id (UUID) |

**Request Example**:

```bash
# By database ID
curl http://localhost:3001/v1/requests/1

# By request UUID
curl http://localhost:3001/v1/requests/req-abc123
```

**Response Example** (200 OK):

```json
{
  "id": 1,
  "request_id": "req-abc123",
  "session_id": "session-abc123",
  "timestamp": 1706745600000,
  "method": "POST",
  "path": "/v1/chat/completions",
  "model": "qwen3-max",
  "stream": false,
  "openai_request": {
    "model": "qwen3-max",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "temperature": 0.7
  },
  "qwen_request": {
    "model": "qwen3-max",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": "What is the capital of France?"
        }
      ]
    },
    "parameters": {
      "temperature": 0.7
    }
  },
  "created_at": 1706745600000,
  "response": {
    "id": 1,
    "response_id": "resp-abc123",
    "finish_reason": "stop",
    "total_tokens": 33,
    "completion_tokens": 8,
    "prompt_tokens": 25,
    "duration_ms": 245,
    "error": null,
    "openai_response": {
      "id": "chatcmpl-123",
      "object": "chat.completion",
      "created": 1706745600,
      "model": "qwen3-max",
      "choices": [
        {
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "The capital of France is Paris."
          },
          "finish_reason": "stop"
        }
      ],
      "usage": {
        "prompt_tokens": 25,
        "completion_tokens": 8,
        "total_tokens": 33
      }
    }
  }
}
```

**Error Response** (404 Not Found):

```json
{
  "error": {
    "message": "Request not found",
    "type": "not_found_error",
    "code": "request_not_found"
  }
}
```

### Delete Request

Delete a request and its associated response.

**Endpoint**: `DELETE /v1/requests/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string/integer | Yes | Request database ID (integer) or request_id (UUID) |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/requests/1
```

**Response Example** (200 OK):

```json
{
  "success": true,
  "message": "Request deleted"
}
```

## Response History API

The response history API provides access to all logged API responses with filtering, statistics, and analytics.

### List Responses

Get a paginated list of all responses with optional filtering.

**Endpoint**: `GET /v1/responses`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of responses to return (default: 50) |
| offset | integer | No | Number of responses to skip (default: 0) |
| session_id | string | No | Filter by session ID |
| request_id | string | No | Filter by request UUID |
| finish_reason | string | No | Filter by finish reason (stop, length, error, etc.) |
| has_error | boolean | No | Filter by error status (true/false) |
| start_date | integer | No | Filter by start timestamp in milliseconds |
| end_date | integer | No | Filter by end timestamp in milliseconds |

**Request Example**:

```bash
curl http://localhost:3001/v1/responses

# Filter by session
curl http://localhost:3001/v1/responses?session_id=session-abc123

# Filter by finish reason
curl http://localhost:3001/v1/responses?finish_reason=stop

# Filter for errors only
curl http://localhost:3001/v1/responses?has_error=true

# Filter by date range
curl "http://localhost:3001/v1/responses?start_date=1706745600000&end_date=1706749200000"
```

**Response Example** (200 OK):

```json
{
  "responses": [
    {
      "id": 1,
      "request_id": 1,
      "session_id": "session-abc123",
      "response_id": "resp-abc123",
      "timestamp": 1706745600000,
      "qwen_response": {
        "output": {
          "text": "The capital of France is Paris.",
          "finish_reason": "stop"
        },
        "usage": {
          "total_tokens": 33,
          "input_tokens": 25,
          "output_tokens": 8
        },
        "request_id": "req-qwen-123"
      },
      "openai_response": {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1706745600,
        "model": "qwen3-max",
        "choices": [
          {
            "index": 0,
            "message": {
              "role": "assistant",
              "content": "The capital of France is Paris."
            },
            "finish_reason": "stop"
          }
        ],
        "usage": {
          "prompt_tokens": 25,
          "completion_tokens": 8,
          "total_tokens": 33
        }
      },
      "parent_id": null,
      "completion_tokens": 8,
      "prompt_tokens": 25,
      "total_tokens": 33,
      "finish_reason": "stop",
      "error": null,
      "duration_ms": 245,
      "created_at": 1706745600000
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

### Get Response

Get detailed information about a specific response.

**Endpoint**: `GET /v1/responses/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string/integer | Yes | Response database ID (integer) or response_id (UUID) |

**Request Example**:

```bash
# By database ID
curl http://localhost:3001/v1/responses/1

# By response UUID
curl http://localhost:3001/v1/responses/resp-abc123
```

**Response Example** (200 OK):

```json
{
  "id": 1,
  "request_id": 1,
  "session_id": "session-abc123",
  "response_id": "resp-abc123",
  "timestamp": 1706745600000,
  "qwen_response": {
    "output": {
      "text": "The capital of France is Paris.",
      "finish_reason": "stop"
    },
    "usage": {
      "total_tokens": 33,
      "input_tokens": 25,
      "output_tokens": 8
    }
  },
  "openai_response": {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1706745600,
    "model": "qwen3-max",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "The capital of France is Paris."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 25,
      "completion_tokens": 8,
      "total_tokens": 33
    }
  },
  "parent_id": null,
  "completion_tokens": 8,
  "prompt_tokens": 25,
  "total_tokens": 33,
  "finish_reason": "stop",
  "error": null,
  "duration_ms": 245,
  "created_at": 1706745600000,
  "request": {
    "id": 1,
    "request_id": "req-abc123",
    "model": "qwen3-max",
    "stream": false,
    "timestamp": 1706745600000
  }
}
```

**Error Response** (404 Not Found):

```json
{
  "error": {
    "message": "Response not found",
    "type": "not_found_error",
    "code": "response_not_found"
  }
}
```

### Get Response by Request

Get the response for a specific request.

**Endpoint**: `GET /v1/responses/request/:requestId`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requestId | string/integer | Yes | Request database ID or request_id UUID |

**Request Example**:

```bash
curl http://localhost:3001/v1/responses/request/req-abc123
```

**Response Example** (200 OK):

```json
{
  "id": 1,
  "request_id": 1,
  "session_id": "session-abc123",
  "response_id": "resp-abc123",
  "timestamp": 1706745600000,
  "finish_reason": "stop",
  "total_tokens": 33,
  "completion_tokens": 8,
  "prompt_tokens": 25,
  "duration_ms": 245,
  "error": null,
  "openai_response": {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1706745600,
    "model": "qwen3-max",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "The capital of France is Paris."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 25,
      "completion_tokens": 8,
      "total_tokens": 33
    }
  }
}
```

**Error Response** (404 Not Found):

```json
{
  "error": {
    "message": "Request not found",
    "type": "not_found_error",
    "code": "request_not_found"
  }
}
```

### Get Responses by Session

Get all responses for a specific session.

**Endpoint**: `GET /v1/responses/session/:sessionId`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Session ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of responses to return (default: 100) |
| offset | integer | No | Number of responses to skip (default: 0) |

**Request Example**:

```bash
curl http://localhost:3001/v1/responses/session/session-abc123
```

**Response Example** (200 OK):

```json
{
  "responses": [
    {
      "id": 1,
      "response_id": "resp-abc123",
      "finish_reason": "stop",
      "total_tokens": 33,
      "completion_tokens": 8,
      "prompt_tokens": 25,
      "duration_ms": 245,
      "error": null,
      "timestamp": 1706745600000
    }
  ],
  "session_id": "session-abc123",
  "total": 1,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### Get Response Statistics

Get aggregate statistics for token usage and performance.

**Endpoint**: `GET /v1/responses/stats`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | string | No | Filter stats by session ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/responses/stats

# Filter by session
curl http://localhost:3001/v1/responses/stats?session_id=session-abc123
```

**Response Example** (200 OK):

```json
{
  "total_responses": 150,
  "total_tokens": 125000,
  "total_completion_tokens": 75000,
  "total_prompt_tokens": 50000,
  "avg_duration_ms": 456,
  "success_rate": 98.67
}
```

### Delete Response

Delete a specific response.

**Endpoint**: `DELETE /v1/responses/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string/integer | Yes | Response database ID or response_id UUID |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/responses/1
```

**Response Example** (200 OK):

```json
{
  "success": true,
  "message": "Response deleted"
}
```

## Provider Management API

Manage LLM provider configurations including LM Studio, Qwen Direct, and custom providers.

### List Providers

Get a list of all configured providers.

**Endpoint**: `GET /v1/providers`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by provider type (lm-studio, qwen-proxy, qwen-direct) |
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
      "id": "lm-studio-default",
      "name": "LM Studio Default",
      "type": "lm-studio",
      "enabled": true,
      "priority": 10,
      "description": "Local LM Studio instance",
      "created_at": 1706745600000,
      "updated_at": 1706745600000
    },
    {
      "id": "qwen-direct-default",
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

### Get Provider

Get detailed information about a specific provider.

**Endpoint**: `GET /v1/providers/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Provider ID |

**Request Example**:

```bash
curl http://localhost:3001/v1/providers/lm-studio-default
```

**Response Example** (200 OK):

```json
{
  "id": "lm-studio-default",
  "name": "LM Studio Default",
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

Create a new provider configuration.

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

Delete a provider configuration.

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

Manage provider-specific configuration key-value pairs.

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

## Model Management API

Define and manage model definitions in the database.

### List Models (Management)

Get a list of all models from the database.

**Endpoint**: `GET /v1/models` (Management endpoints use POST/PUT/DELETE)

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

### Get Model

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

Create a new model definition.

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

Delete a model definition.

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

## Provider-Model Mapping API

Manage relationships between providers and models.

### Get Provider Models

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

## Settings Management API

Manage server settings including server configuration, logging, and system preferences.

### Get All Settings

Get all settings with optional filtering by category.

**Endpoint**: `GET /v1/settings`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category (server, logging, system, provider) |

**Request Example**:

```bash
curl http://localhost:3001/v1/settings

# Filter by category
curl http://localhost:3001/v1/settings?category=server
```

**Response Example** (200 OK):

```json
{
  "settings": {
    "server.port": 3001,
    "server.host": "0.0.0.0",
    "server.timeout": 120000,
    "logging.level": "info",
    "logging.logRequests": true,
    "logging.logResponses": true,
    "system.autoStart": false,
    "system.minimizeToTray": true,
    "system.checkUpdates": true
  },
  "category": "all"
}
```

### Get Setting

Get a specific setting value.

**Endpoint**: `GET /v1/settings/:key`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Setting key (e.g., 'server.port', 'logging.level') |

**Request Example**:

```bash
curl http://localhost:3001/v1/settings/server.port
```

**Response Example** (200 OK):

```json
{
  "key": "server.port",
  "value": 8000,
  "category": "server",
  "requiresRestart": true,
  "isDefault": false
}
```

**Error Response** (404 Not Found):

```json
{
  "error": "Setting not found",
  "key": "unknown.setting"
}
```

### Update Setting

Update a specific setting value.

**Endpoint**: `PUT /v1/settings/:key`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Setting key |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| value | any | Yes | New value for the setting |

**Request Example**:

```bash
curl -X PUT http://localhost:3001/v1/settings/server.port \
  -H "Content-Type: application/json" \
  -d '{
    "value": 3002
  }'
```

**Response Example** (200 OK):

```json
{
  "key": "server.port",
  "value": 3002,
  "requiresRestart": true,
  "updated_at": 1706745900000,
  "message": "Setting updated. Server restart required to apply changes."
}
```

### Bulk Update Settings

Update multiple settings at once.

**Endpoint**: `POST /v1/settings/bulk`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| settings | object | Yes | Object with key-value pairs |

**Request Example**:

```bash
curl -X POST http://localhost:3001/v1/settings/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "logging.level": "debug",
      "logging.logRequests": true,
      "logging.logResponses": true
    }
  }'
```

**Response Example** (200 OK):

```json
{
  "updated": ["logging.level", "logging.logRequests", "logging.logResponses"],
  "errors": [],
  "requiresRestart": true,
  "message": "3 settings updated. Server restart required."
}
```

### Delete Setting

Delete a setting (reset to default value).

**Endpoint**: `DELETE /v1/settings/:key`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| key | string | Yes | Setting key |

**Request Example**:

```bash
curl -X DELETE http://localhost:3001/v1/settings/server.port
```

**Response Example** (200 OK):

```json
{
  "key": "server.port",
  "value": 8000,
  "message": "Setting reset to default value.",
  "requiresRestart": true
}
```

### Default Settings

The following default settings are available:

| Category | Key | Default Value | Requires Restart | Description |
|----------|-----|---------------|------------------|-------------|
| server | server.port | 3001 | Yes | Server port |
| server | server.host | 0.0.0.0 | Yes | Server host |
| server | server.timeout | 120000 | No | Request timeout (ms) |
| logging | logging.level | info | Yes | Logging level (debug, info, warn, error) |
| logging | logging.logRequests | true | No | Log incoming requests |
| logging | logging.logResponses | true | No | Log outgoing responses |
| system | system.autoStart | false | No | Auto-start server on app launch |
| system | system.minimizeToTray | true | No | Minimize to system tray |
| system | system.checkUpdates | true | No | Check for updates automatically |

## Health Check API

### Server Health

Check server health and provider status.

**Endpoint**: `GET /health`

**Request Example**:

```bash
curl http://localhost:3001/health
```

**Response Example** (200 OK):

```json
{
  "status": "ok",
  "providers": {
    "lm-studio-default": {
      "status": "healthy",
      "baseURL": "http://192.168.0.22:1234/v1"
    },
    "qwen-direct-default": {
      "status": "healthy",
      "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
  },
  "registeredProviders": ["lm-studio-default", "qwen-direct-default"]
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "status": "error",
  "error": "Database connection failed"
}
```

## Database Schema

The API uses SQLite with the following core tables:

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  parent_id TEXT,
  first_user_message TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_accessed INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
```

### Requests Table

```sql
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  timestamp INTEGER NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  openai_request TEXT NOT NULL,
  qwen_request TEXT NOT NULL,
  model TEXT NOT NULL,
  stream BOOLEAN NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Responses Table

```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  response_id TEXT NOT NULL UNIQUE,
  timestamp INTEGER NOT NULL,
  qwen_response TEXT,
  openai_response TEXT,
  parent_id TEXT,
  completion_tokens INTEGER,
  prompt_tokens INTEGER,
  total_tokens INTEGER,
  finish_reason TEXT,
  error TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Providers Table

```sql
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(name)
);
```

### Provider Configs Table

```sql
CREATE TABLE provider_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_sensitive BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE(provider_id, key)
);
```

### Models Table

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capabilities TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Provider Models Table

```sql
CREATE TABLE provider_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  UNIQUE(provider_id, model_id)
);
```

### Settings Table

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Rate Limits

**Current State**: No rate limiting implemented

**Recommendations**:
- Implement rate limiting on management endpoints
- Typical limits: 100 requests per minute per IP
- Return 429 Too Many Requests when exceeded

## Pagination

All list endpoints support pagination with `limit` and `offset` parameters:

- Default `limit`: 50 (100 for session-specific queries)
- Default `offset`: 0
- Response includes `has_more` boolean indicating if more results exist

## Data Retention

- Sessions expire based on the `expires_at` timestamp
- Use `DELETE /v1/sessions` to cleanup expired sessions
- Deleting a session cascades to delete all requests and responses
- Deleting a provider cascades to delete all configurations and model mappings

## Security Considerations

1. **No Authentication**: The API currently has no authentication. Deploy behind a firewall or VPN.
2. **Sensitive Configuration**: API keys and credentials are stored in the database. Mark sensitive values with `is_sensitive: true`.
3. **Database Backups**: Regular backups recommended for SQLite database file.
4. **CORS**: CORS is enabled for all origins by default. Configure in production.

## Client Libraries

### JavaScript/Node.js Example

```javascript
const API_BASE = 'http://localhost:3001';

// Chat completion
async function chatCompletion(messages) {
  const response = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3-max',
      messages: messages
    })
  });
  return response.json();
}

// List sessions
async function listSessions() {
  const response = await fetch(`${API_BASE}/v1/sessions`);
  return response.json();
}

// Get response stats
async function getStats() {
  const response = await fetch(`${API_BASE}/v1/responses/stats`);
  return response.json();
}
```

### Python Example

```python
import requests

API_BASE = 'http://localhost:3001'

# Chat completion
def chat_completion(messages):
    response = requests.post(
        f'{API_BASE}/v1/chat/completions',
        json={
            'model': 'qwen3-max',
            'messages': messages
        }
    )
    return response.json()

# List providers
def list_providers():
    response = requests.get(f'{API_BASE}/v1/providers')
    return response.json()

# Update setting
def update_setting(key, value):
    response = requests.put(
        f'{API_BASE}/v1/settings/{key}',
        json={'value': value}
    )
    return response.json()
```

## Troubleshooting

### Common Issues

**Connection Refused**
- Ensure the server is running on the correct port
- Check firewall settings
- Verify the base URL

**Provider Unavailable**
- Test provider connectivity: `POST /v1/providers/:id/test`
- Check provider configuration: `GET /v1/providers/:id/config`
- Verify provider is enabled: `GET /v1/providers/:id`

**Database Errors**
- Check database file permissions
- Verify schema version: Check `metadata` table
- Run migrations if needed

**Rate Limiting (Future)**
- Reduce request frequency
- Implement exponential backoff
- Contact administrator for limit increase

## Related Documentation

- [Provider Management API](./provider-management-api.md) - Detailed provider management documentation
- Backend Implementation Plans - See `/docs/` directory for architecture details

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- OpenAI-compatible chat completions endpoint
- Complete CRUD operations for sessions, requests, responses
- Provider configuration system
- Model management
- Settings management
- Health checks and monitoring
