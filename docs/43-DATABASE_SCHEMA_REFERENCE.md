# Document 43: Database Schema Reference

**Created:** 2025-11-04
**Status:** Active Reference
**Purpose:** Comprehensive documentation of the centralized SQLite database schema

---

## Table of Contents

1. [Overview](#overview)
2. [Database Location](#database-location)
3. [Schema Version](#schema-version)
4. [Core Tables](#core-tables)
5. [Provider Management Tables](#provider-management-tables)
6. [Session & Request Tracking Tables](#session--request-tracking-tables)
7. [Credentials & Settings Tables](#credentials--settings-tables)
8. [Entity Relationship Diagram](#entity-relationship-diagram)
9. [Indexes](#indexes)
10. [Migrations](#migrations)
11. [Usage Examples](#usage-examples)

---

## Overview

The Qwen Proxy OpenCode application uses a **centralized SQLite database** shared by all backend services:

- **Provider Router** (primary database owner)
- **Qwen Proxy** (reads credentials, writes sessions)
- **API Server** (reads/writes via Provider Router API)

This centralized architecture ensures:
- Single source of truth for all data
- No data synchronization issues
- Simplified backup and maintenance
- Consistent schema across services

**Total Tables:** 11 core tables + 1 SQLite internal table

---

## Database Location

**Path:** `/backend/provider-router/data/provider-router.db`

**Absolute Path (from project root):**
```
/Users/chris/Projects/qwen_proxy_opencode/backend/provider-router/data/provider-router.db
```

**Configuration References:**

```javascript
// Provider Router
// backend/provider-router/src/config/database.js
const DB_PATH = path.join(__dirname, '../../data/provider-router.db');

// Qwen Proxy
// backend/qwen-proxy/src/config/index.js
database: {
  path: process.env.DATABASE_PATH ||
        path.join(__dirname, '../../../provider-router/data/provider-router.db')
}
```

---

## Schema Version

The database uses a migration-based versioning system.

**Current Schema Version:** 5

**Version Tracking Table:**

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
```

**Columns:**
- `version` (INTEGER, PRIMARY KEY) - Migration version number
- `applied_at` (INTEGER, NOT NULL) - Unix timestamp (seconds) when migration was applied

---

## Core Tables

### 1. Settings Table

Stores application-wide configuration in key-value format.

**Table Definition:**

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Unique setting identifier (e.g., 'server.port', 'logging.level') |
| `value` | TEXT | NOT NULL | Setting value (stored as string, parsed as needed) |
| `updated_at` | INTEGER | NOT NULL, DEFAULT | Unix timestamp (seconds) of last update |

**Indexes:**
- `idx_settings_key` - Primary key index for fast key lookups

**Default Settings:**

| Key | Default Value | Description |
|-----|---------------|-------------|
| `server.port` | '3001' | Provider router port |
| `server.host` | '0.0.0.0' | Provider router host |
| `server.timeout` | '120000' | Request timeout (milliseconds) |
| `logging.level` | 'info' | Log level (debug, info, warn, error) |
| `logging.logRequests` | 'true' | Enable request logging |
| `logging.logResponses` | 'true' | Enable response logging |
| `system.autoStart` | 'false' | Auto-start on app launch |
| `system.minimizeToTray` | 'true' | Minimize to system tray |
| `system.checkUpdates` | 'true' | Check for application updates |
| `active_provider` | 'lm-studio' | Currently active provider ID |

**Example Values:**
```sql
INSERT INTO settings (key, value, updated_at) VALUES
  ('server.port', '3001', 1699123456000),
  ('active_provider', 'lm-studio-default', 1699123456000);
```

---

### 2. Metadata Table

Stores system metadata and schema version information.

**Table Definition:**

```sql
CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Metadata key |
| `value` | TEXT | NOT NULL | Metadata value |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) of last update |

**Standard Metadata Keys:**
- `schema_version` - Current schema version (e.g., '5')

**Example Values:**
```sql
INSERT INTO metadata (key, value, updated_at) VALUES
  ('schema_version', '5', 1699123456000);
```

---

## Provider Management Tables

### 3. Providers Table

Stores provider instances (e.g., LM Studio, Qwen Direct, custom providers).

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Provider UUID or slug (e.g., 'lm-studio-default', 'qwen-direct-1') |
| `name` | TEXT | NOT NULL, UNIQUE | Display name (e.g., 'LM Studio Home') |
| `type` | TEXT | NOT NULL | Provider type: 'lm-studio', 'qwen-proxy', 'qwen-direct' |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT 1 | Whether provider is active (0 or 1) |
| `priority` | INTEGER | NOT NULL, DEFAULT 0 | Priority for fallback routing (higher = higher priority) |
| `description` | TEXT | NULL | User-defined description |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when created |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when last updated |

**Indexes:**
- `idx_providers_type` - Fast filtering by provider type
- `idx_providers_enabled` - Fast filtering by enabled status
- `idx_providers_priority` - Fast sorting by priority (DESC)

**Provider Types:**
- `lm-studio` - Local LM Studio server
- `qwen-proxy` - Qwen proxy service (browser session-based)
- `qwen-direct` - Direct Qwen API access

**Example Values:**
```sql
INSERT INTO providers VALUES
  ('lm-studio-default', 'LM Studio Default', 'lm-studio', 1, 100, 'Default LM Studio instance', 1699123456000, 1699123456000),
  ('qwen-proxy-default', 'Qwen Proxy Default', 'qwen-proxy', 1, 90, 'Browser-based Qwen access', 1699123456000, 1699123456000),
  ('qwen-direct-default', 'Qwen Direct API', 'qwen-direct', 1, 80, 'Direct API access', 1699123456000, 1699123456000);
```

---

### 4. Provider Configs Table

Stores provider-specific configuration in key-value format.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing ID |
| `provider_id` | TEXT | NOT NULL, FOREIGN KEY | References providers.id |
| `key` | TEXT | NOT NULL, UNIQUE per provider | Config key (e.g., 'baseURL', 'timeout') |
| `value` | TEXT | NOT NULL | Config value (JSON string for complex types) |
| `is_sensitive` | BOOLEAN | DEFAULT 0 | Whether value is sensitive (API keys, passwords) |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when created |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when last updated |

**Foreign Keys:**
- `provider_id` → `providers(id)` ON DELETE CASCADE

**Indexes:**
- `idx_provider_configs_provider_id` - Fast filtering by provider
- `idx_provider_configs_key` - Fast filtering by config key

**Common Config Keys by Provider Type:**

**LM Studio:**
- `baseURL` - Base URL (e.g., 'http://192.168.0.22:1234/v1')
- `timeout` - Request timeout in milliseconds (e.g., '120000')
- `defaultModel` - Default model name (e.g., 'qwen3-max')

**Qwen Proxy:**
- `baseURL` - Base URL (e.g., 'http://localhost:3000')
- `timeout` - Request timeout in milliseconds

**Qwen Direct:**
- `baseURL` - API endpoint (e.g., 'https://dashscope.aliyuncs.com/compatible-mode/v1')
- `apiKey` - API key (marked as sensitive)
- `timeout` - Request timeout in milliseconds

**Example Values:**
```sql
INSERT INTO provider_configs (provider_id, key, value, is_sensitive, created_at, updated_at) VALUES
  ('lm-studio-default', 'baseURL', 'http://192.168.0.22:1234/v1', 0, 1699123456000, 1699123456000),
  ('lm-studio-default', 'timeout', '120000', 0, 1699123456000, 1699123456000),
  ('qwen-direct-default', 'apiKey', 'sk-xxx', 1, 1699123456000, 1699123456000);
```

---

### 5. Models Table

Stores LLM model definitions.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Model ID (e.g., 'qwen3-max', 'gpt-4') |
| `name` | TEXT | NOT NULL | Display name |
| `description` | TEXT | NULL | Model description |
| `capabilities` | TEXT | NULL | JSON array of capabilities (e.g., '["chat", "completion", "vision"]') |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when created |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when last updated |

**Indexes:**
- `idx_models_name` - Fast searching by model name

**Capability Types:**
- `chat` - Supports chat completions
- `completion` - Supports text completions
- `vision` - Supports image inputs
- `function_calling` - Supports function/tool calling
- `streaming` - Supports streaming responses

**Example Values:**
```sql
INSERT INTO models VALUES
  ('qwen3-max', 'Qwen 3 Max', 'Latest Qwen flagship model', '["chat", "completion", "vision", "function_calling"]', 1699123456000, 1699123456000),
  ('gpt-4', 'GPT-4', 'OpenAI GPT-4', '["chat", "completion", "function_calling"]', 1699123456000, 1699123456000);
```

---

### 6. Provider Models Table

Many-to-many mapping between providers and models.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing ID |
| `provider_id` | TEXT | NOT NULL, FOREIGN KEY | References providers.id |
| `model_id` | TEXT | NOT NULL, FOREIGN KEY | References models.id |
| `is_default` | BOOLEAN | DEFAULT 0 | Whether this is the default model for provider |
| `config` | TEXT | NULL | Provider-specific model config (JSON, optional) |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when created |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when last updated |

**Foreign Keys:**
- `provider_id` → `providers(id)` ON DELETE CASCADE
- `model_id` → `models(id)` ON DELETE CASCADE

**Indexes:**
- `idx_provider_models_provider_id` - Fast filtering by provider
- `idx_provider_models_model_id` - Fast filtering by model
- `idx_provider_models_is_default` - Fast filtering by default status

**Example Values:**
```sql
INSERT INTO provider_models (provider_id, model_id, is_default, config, created_at, updated_at) VALUES
  ('lm-studio-default', 'qwen3-max', 1, NULL, 1699123456000, 1699123456000),
  ('qwen-proxy-default', 'qwen3-max', 1, NULL, 1699123456000, 1699123456000);
```

---

## Session & Request Tracking Tables

### 7. Sessions Table

Tracks conversation sessions for multi-turn conversations.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | MD5 hash of first user message (session identifier) |
| `chat_id` | TEXT | NOT NULL | Qwen chat ID (from Qwen API) |
| `parent_id` | TEXT | NULL | Current parent_id for next message in conversation |
| `first_user_message` | TEXT | NOT NULL | First user message (for reference and hash verification) |
| `message_count` | INTEGER | DEFAULT 0 | Number of messages in conversation |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when session created |
| `last_accessed` | INTEGER | NOT NULL | Timestamp (milliseconds) of last access |
| `expires_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when session expires |

**Indexes:**
- `idx_sessions_expires_at` - Fast cleanup of expired sessions
- `idx_sessions_chat_id` - Fast lookup by Qwen chat ID
- `idx_sessions_created_at` - Fast sorting by creation time

**Session Lifecycle:**
1. Client sends first message → Server creates session with MD5(message) as ID
2. Server gets chat_id from Qwen API
3. Each subsequent message updates parent_id and message_count
4. Sessions expire after inactivity (default: 30 minutes)
5. Server clears all sessions on restart to prevent stale session issues

**Example Values:**
```sql
INSERT INTO sessions VALUES
  ('a1b2c3d4e5f6', 'qwen-chat-123456', 'parent-abc-def', 'Hello, how are you?', 5, 1699123456000, 1699125456000, 1699127256000);
```

---

### 8. Requests Table

Stores all incoming API requests.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing database ID |
| `session_id` | TEXT | NOT NULL, FOREIGN KEY | References sessions.id |
| `request_id` | TEXT | NOT NULL, UNIQUE | UUID for request tracking |
| `timestamp` | INTEGER | NOT NULL | Timestamp (milliseconds) when request received |
| `method` | TEXT | NOT NULL | HTTP method (typically 'POST') |
| `path` | TEXT | NOT NULL | Endpoint path (e.g., '/v1/chat/completions') |
| `openai_request` | TEXT | NOT NULL | Full OpenAI request body (JSON string) |
| `qwen_request` | TEXT | NOT NULL | Transformed Qwen payload (JSON string) |
| `model` | TEXT | NOT NULL | Model name (e.g., 'qwen3-max', 'gpt-4') |
| `stream` | BOOLEAN | NOT NULL | Whether request is streaming (0 or 1) |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when record created |

**Foreign Keys:**
- `session_id` → `sessions(id)` ON DELETE CASCADE

**Indexes:**
- `idx_requests_session_id` - Fast filtering by session
- `idx_requests_timestamp` - Fast sorting by time
- `idx_requests_request_id` - Fast lookup by request UUID
- `idx_requests_created_at` - Fast sorting by creation time

**Example Values:**
```sql
INSERT INTO requests VALUES
  (1, 'a1b2c3d4e5f6', 'req-uuid-12345', 1699123456000, 'POST', '/v1/chat/completions',
   '{"model":"qwen3-max","messages":[...]}', '{"model":"qwen-turbo","input":{...}}',
   'qwen3-max', 1, 1699123456000);
```

---

### 9. Responses Table

Stores all API responses.

**Table Definition:**

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

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing database ID |
| `request_id` | INTEGER | NOT NULL, FOREIGN KEY | References requests.id |
| `session_id` | TEXT | NOT NULL, FOREIGN KEY | References sessions.id |
| `response_id` | TEXT | NOT NULL, UNIQUE | UUID for response tracking |
| `timestamp` | INTEGER | NOT NULL | Timestamp (milliseconds) when response sent |
| `qwen_response` | TEXT | NULL | Raw Qwen response (JSON, can be null for streaming) |
| `openai_response` | TEXT | NULL | Transformed OpenAI response (JSON string) |
| `parent_id` | TEXT | NULL | New parent_id from response (for conversation continuity) |
| `completion_tokens` | INTEGER | NULL | Number of tokens in completion |
| `prompt_tokens` | INTEGER | NULL | Number of tokens in prompt |
| `total_tokens` | INTEGER | NULL | Total tokens used (prompt + completion) |
| `finish_reason` | TEXT | NULL | Reason for completion: 'stop', 'length', 'error', etc. |
| `error` | TEXT | NULL | Error message if request failed |
| `duration_ms` | INTEGER | NULL | Response time in milliseconds |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when record created |

**Foreign Keys:**
- `request_id` → `requests(id)` ON DELETE CASCADE
- `session_id` → `sessions(id)` ON DELETE CASCADE

**Indexes:**
- `idx_responses_request_id` - Fast lookup by request
- `idx_responses_session_id` - Fast filtering by session
- `idx_responses_response_id` - Fast lookup by response UUID
- `idx_responses_timestamp` - Fast sorting by time
- `idx_responses_created_at` - Fast sorting by creation time

**Finish Reasons:**
- `stop` - Natural completion (model decided to stop)
- `length` - Maximum token length reached
- `error` - Error occurred during generation
- `content_filter` - Content was filtered

**Example Values:**
```sql
INSERT INTO responses VALUES
  (1, 1, 'a1b2c3d4e5f6', 'res-uuid-12345', 1699123457000,
   '{"output":{"text":"Hello! I am doing well..."}}',
   '{"choices":[{"message":{"content":"Hello! I am doing well..."}}]}',
   'parent-xyz-123', 150, 50, 200, 'stop', NULL, 1234, 1699123457000);
```

---

## Credentials & Settings Tables

### 10. Qwen Credentials Table

Stores Qwen API authentication credentials (shared by all services).

**Table Definition:**

```sql
CREATE TABLE qwen_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    cookies TEXT NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing ID (typically only 1 row) |
| `token` | TEXT | NOT NULL | bx-umidtoken value extracted from browser session |
| `cookies` | TEXT | NOT NULL | Full Cookie header value from browser |
| `expires_at` | INTEGER | NULL | Optional expiry timestamp (milliseconds) |
| `created_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when credentials created |
| `updated_at` | INTEGER | NOT NULL | Timestamp (milliseconds) when credentials last updated |

**Indexes:**
- `idx_qwen_credentials_expires` - Fast checking for expired credentials

**Credential Flow:**
1. User clicks "Login to Qwen" in Electron dashboard
2. Electron opens embedded browser to chat.qwen.ai
3. User logs in, Electron extracts cookies and bx-umidtoken
4. Electron sends credentials to API Server
5. API Server stores in this table
6. Both Provider Router and Qwen Proxy read from same table

**Security Notes:**
- Credentials are stored in plain text in local SQLite database
- Database file should have restricted permissions (user-only access)
- Credentials are never logged or exposed in API responses (masked)

**Example Values:**
```sql
INSERT INTO qwen_credentials VALUES
  (1, 'umidtoken-abc123def456', 'cookie1=value1; cookie2=value2; bx-umidtoken=abc123',
   1699223456000, 1699123456000, 1699123456000);
```

---

### 11. SQLite Sequence Table

**System Table** - Auto-generated by SQLite to track AUTOINCREMENT values.

**Table Definition:**

```sql
CREATE TABLE sqlite_sequence(name, seq);
```

**Columns:**
- `name` - Table name with AUTOINCREMENT column
- `seq` - Last used ID value

**Note:** This table is managed automatically by SQLite. Do not modify manually.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE RELATIONSHIPS                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   PROVIDERS      │         │     MODELS       │         │   SESSIONS   │
├──────────────────┤         ├──────────────────┤         ├──────────────┤
│ id (PK)          │         │ id (PK)          │         │ id (PK)      │
│ name (UNIQUE)    │         │ name             │         │ chat_id      │
│ type             │         │ description      │         │ parent_id    │
│ enabled          │         │ capabilities     │         │ first_user   │
│ priority         │         │ created_at       │         │ message_count│
│ description      │         │ updated_at       │         │ created_at   │
│ created_at       │         └──────────────────┘         │ last_accessed│
│ updated_at       │                  △                   │ expires_at   │
└────────┬─────────┘                  │                   └──────┬───────┘
         │                            │                          │
         │ 1                          │ N                        │ 1
         │                            │                          │
         │          ┌─────────────────┴──────────────┐           │
         │          │                                │           │
         │ N        │  PROVIDER_MODELS (Join Table) │           │ N
         └──────────┤                                │           │
                    ├────────────────────────────────┤           │
                    │ id (PK)                        │           │
                    │ provider_id (FK) ──────────────┘           │
                    │ model_id (FK) ─────────────────────────────┘
                    │ is_default                     │
                    │ config                         │
                    │ created_at                     │
                    │ updated_at                     │
                    └────────────────────────────────┘


┌──────────────────┐         ┌──────────────────┐
│ PROVIDER_CONFIGS │         │    SETTINGS      │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ key (PK)         │
│ provider_id (FK) │         │ value            │
│   ↓              │         │ updated_at       │
│ PROVIDERS.id     │         └──────────────────┘
│ key              │
│ value            │         ┌──────────────────┐
│ is_sensitive     │         │    METADATA      │
│ created_at       │         ├──────────────────┤
│ updated_at       │         │ key (PK)         │
└──────────────────┘         │ value            │
                             │ updated_at       │
                             └──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              REQUEST/RESPONSE TRACKING CHAIN                     │
└──────────────────────────────────────────────────────────────────┘

         ┌──────────────┐
         │   SESSIONS   │
         │  id (PK)     │
         └──────┬───────┘
                │ 1
                │
                │ N
         ┌──────▼───────┐
         │   REQUESTS   │
         ├──────────────┤
         │ id (PK)      │
         │ session_id   │◄────── Foreign Key
         │ request_id   │
         │ timestamp    │
         │ method       │
         │ path         │
         │ openai_req   │
         │ qwen_req     │
         │ model        │
         │ stream       │
         │ created_at   │
         └──────┬───────┘
                │ 1
                │
                │ 1
         ┌──────▼───────┐
         │  RESPONSES   │
         ├──────────────┤
         │ id (PK)      │
         │ request_id   │◄────── Foreign Key
         │ session_id   │◄────── Foreign Key
         │ response_id  │
         │ timestamp    │
         │ qwen_resp    │
         │ openai_resp  │
         │ parent_id    │
         │ tokens       │
         │ finish       │
         │ error        │
         │ duration_ms  │
         │ created_at   │
         └──────────────┘

┌─────────────────────────┐
│   QWEN_CREDENTIALS      │   (Shared across all services)
├─────────────────────────┤
│ id (PK)                 │
│ token                   │
│ cookies                 │
│ expires_at              │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

Legend:
  PK  = Primary Key
  FK  = Foreign Key
  1   = One (cardinality)
  N   = Many (cardinality)
  ↓   = References
```

---

## Indexes

### Purpose of Indexes

Indexes improve query performance by creating sorted data structures for fast lookups.

### All Indexes in Database

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| `settings` | `idx_settings_key` | key | Fast key lookup (primary key index) |
| `sessions` | `idx_sessions_expires_at` | expires_at | Fast cleanup of expired sessions |
| `sessions` | `idx_sessions_chat_id` | chat_id | Fast lookup by Qwen chat ID |
| `sessions` | `idx_sessions_created_at` | created_at | Fast sorting by creation time |
| `requests` | `idx_requests_session_id` | session_id | Fast filtering by session |
| `requests` | `idx_requests_timestamp` | timestamp | Fast sorting by time |
| `requests` | `idx_requests_request_id` | request_id | Fast lookup by request UUID |
| `requests` | `idx_requests_created_at` | created_at | Fast sorting by creation time |
| `responses` | `idx_responses_request_id` | request_id | Fast lookup by request |
| `responses` | `idx_responses_session_id` | session_id | Fast filtering by session |
| `responses` | `idx_responses_response_id` | response_id | Fast lookup by response UUID |
| `responses` | `idx_responses_timestamp` | timestamp | Fast sorting by time |
| `responses` | `idx_responses_created_at` | created_at | Fast sorting by creation time |
| `qwen_credentials` | `idx_qwen_credentials_expires` | expires_at | Fast checking for expired credentials |
| `providers` | `idx_providers_type` | type | Fast filtering by provider type |
| `providers` | `idx_providers_enabled` | enabled | Fast filtering by enabled status |
| `providers` | `idx_providers_priority` | priority DESC | Fast sorting by priority (highest first) |
| `provider_configs` | `idx_provider_configs_provider_id` | provider_id | Fast filtering by provider |
| `provider_configs` | `idx_provider_configs_key` | key | Fast filtering by config key |
| `models` | `idx_models_name` | name | Fast searching by model name |
| `provider_models` | `idx_provider_models_provider_id` | provider_id | Fast filtering by provider |
| `provider_models` | `idx_provider_models_model_id` | model_id | Fast filtering by model |
| `provider_models` | `idx_provider_models_is_default` | is_default | Fast filtering by default status |

**Total Indexes:** 23

---

## Migrations

### Migration System

The database uses a version-based migration system to manage schema changes.

### Migration History

| Version | Description | Applied |
|---------|-------------|---------|
| 1 | Initial schema with settings and request_logs | ✓ |
| 2 | Split request_logs into sessions, requests, responses tables | ✓ |
| 3 | Add provider configuration tables (providers, provider_configs, models, provider_models) | ✓ |
| 4 | Seed default provider configurations and models | ✓ |
| 5 | Add settings indexes and seed default server settings | ✓ |

### Migration Files

**Location:** `/backend/provider-router/src/database/migrations.js`

**Qwen Proxy Migrations (example migrations, not all applied):**
- `/backend/qwen-proxy/src/database/migrations/002-add-user-field.js` - Add user_id to sessions
- `/backend/qwen-proxy/src/database/migrations/003-add-conversation-hash.js` - Add conversation_hash to sessions
- `/backend/qwen-proxy/src/database/migrations/004-add-errors-table.js` - Add errors table for error logging

### Running Migrations

Migrations run automatically on application startup.

**Manual Migration Commands:**

```javascript
// Get current version
const version = getCurrentVersion();

// Run pending migrations
await runMigrations();

// Rollback to version
rollbackTo(targetVersion);
```

---

## Usage Examples

### Query Examples

**1. Get Active Provider:**

```sql
SELECT * FROM settings WHERE key = 'active_provider';
```

**2. List All Enabled Providers:**

```sql
SELECT p.*,
       (SELECT COUNT(*) FROM provider_models pm WHERE pm.provider_id = p.id) as model_count
FROM providers p
WHERE p.enabled = 1
ORDER BY p.priority DESC;
```

**3. Get Provider Configuration:**

```sql
SELECT pc.key, pc.value, pc.is_sensitive
FROM provider_configs pc
WHERE pc.provider_id = 'lm-studio-default';
```

**4. Find Provider's Default Model:**

```sql
SELECT m.*
FROM models m
JOIN provider_models pm ON pm.model_id = m.id
WHERE pm.provider_id = 'lm-studio-default'
  AND pm.is_default = 1;
```

**5. Get Recent Requests for Session:**

```sql
SELECT req.*, res.finish_reason, res.duration_ms, res.error
FROM requests req
LEFT JOIN responses res ON res.request_id = req.id
WHERE req.session_id = 'a1b2c3d4e5f6'
ORDER BY req.timestamp DESC
LIMIT 10;
```

**6. Get Token Usage Statistics:**

```sql
SELECT
    DATE(created_at / 1000, 'unixepoch') as date,
    COUNT(*) as request_count,
    SUM(completion_tokens) as total_completion_tokens,
    SUM(prompt_tokens) as total_prompt_tokens,
    SUM(total_tokens) as total_tokens,
    AVG(duration_ms) as avg_duration_ms
FROM responses
WHERE error IS NULL
GROUP BY date
ORDER BY date DESC
LIMIT 30;
```

**7. Clean Up Expired Sessions:**

```sql
DELETE FROM sessions
WHERE expires_at < (strftime('%s', 'now') * 1000);
```

**8. Get Active Session Count:**

```sql
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE expires_at > (strftime('%s', 'now') * 1000);
```

**9. Get Qwen Credentials:**

```sql
SELECT token, cookies, expires_at
FROM qwen_credentials
ORDER BY created_at DESC
LIMIT 1;
```

**10. Get Error Rate by Model:**

```sql
SELECT
    req.model,
    COUNT(*) as total_requests,
    SUM(CASE WHEN res.error IS NOT NULL THEN 1 ELSE 0 END) as error_count,
    ROUND(100.0 * SUM(CASE WHEN res.error IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM requests req
LEFT JOIN responses res ON res.request_id = req.id
GROUP BY req.model
ORDER BY error_rate DESC;
```

---

## Data Retention & Cleanup

### Automatic Cleanup

**Session Cleanup:**
- Sessions are cleared on server restart (prevents stale session issues)
- Expired sessions can be manually cleaned: `DELETE FROM sessions WHERE expires_at < (strftime('%s', 'now') * 1000)`

**Cascading Deletes:**
- Deleting a session cascades to delete all associated requests and responses
- Deleting a provider cascades to delete all associated configs and model mappings
- Deleting a model cascades to delete all provider-model associations

### Manual Cleanup Queries

**Delete Old Sessions (older than 30 days):**
```sql
DELETE FROM sessions
WHERE created_at < ((strftime('%s', 'now') - 2592000) * 1000);
```

**Delete Failed Requests (with errors):**
```sql
DELETE FROM responses
WHERE error IS NOT NULL
  AND created_at < ((strftime('%s', 'now') - 86400) * 1000);
```

**Vacuum Database (reclaim space):**
```sql
VACUUM;
```

---

## Backup & Restore

### Backup Database

```bash
# Stop all services first
# Copy database file
cp backend/provider-router/data/provider-router.db \
   backup/provider-router-$(date +%Y%m%d-%H%M%S).db

# Or use SQLite backup command
sqlite3 backend/provider-router/data/provider-router.db \
  ".backup 'backup/provider-router-backup.db'"
```

### Restore Database

```bash
# Stop all services first
# Restore from backup
cp backup/provider-router-20231104.db \
   backend/provider-router/data/provider-router.db
```

### Export to SQL

```bash
sqlite3 backend/provider-router/data/provider-router.db .dump > backup.sql
```

### Import from SQL

```bash
sqlite3 backend/provider-router/data/provider-router.db < backup.sql
```

---

## Performance Considerations

### Database Busy Timeout

Both services configure busy timeout to handle concurrent writes:

```javascript
// Qwen Proxy config
database: {
  busyTimeout: 5000  // 5 seconds
}
```

### WAL Mode

SQLite uses Write-Ahead Logging (WAL) mode for better concurrent access:
- Readers don't block writers
- Writers don't block readers
- Better performance for high-concurrency scenarios

**WAL Files:**
- `provider-router.db-wal` - Write-ahead log
- `provider-router.db-shm` - Shared memory file

### Optimization Tips

1. **Use Indexes:** All foreign keys and frequently queried columns have indexes
2. **Limit Results:** Use `LIMIT` clause for large result sets
3. **Batch Writes:** Use transactions for multiple INSERT/UPDATE operations
4. **Clean Old Data:** Regularly delete expired sessions and old requests
5. **Vacuum Periodically:** Run `VACUUM` to reclaim space and optimize

---

## Troubleshooting

### Database Lock Errors

**Cause:** Multiple processes trying to write simultaneously

**Solution:**
1. Ensure `busyTimeout` is configured (already set to 5000ms)
2. Check for long-running transactions
3. Verify WAL mode is enabled: `PRAGMA journal_mode;` should return 'wal'

### Corrupted Database

**Symptoms:** SQLite errors, data inconsistency

**Recovery:**
```bash
# Check integrity
sqlite3 provider-router.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp backup/provider-router-latest.db provider-router.db
```

### Large Database Size

**Check Size:**
```bash
ls -lh backend/provider-router/data/provider-router.db
```

**Reduce Size:**
1. Delete old sessions and requests
2. Run `VACUUM;`
3. Consider archiving old data

### Migration Failures

**Check Current Version:**
```javascript
const version = getCurrentVersion();
console.log(`Current schema version: ${version}`);
```

**Rollback Failed Migration:**
```javascript
rollbackTo(previousVersion);
```

---

## Security Considerations

### Sensitive Data

**Stored in Database:**
- Qwen credentials (token, cookies)
- Provider API keys (in provider_configs with is_sensitive=1)

**Protection:**
- Database file should have restricted permissions (600 or 700)
- Never commit database file to version control (already in .gitignore)
- Sensitive values are masked in API responses
- No credentials are logged

### File Permissions

```bash
# Set restrictive permissions on database
chmod 600 backend/provider-router/data/provider-router.db
```

### Access Control

- Database is local-only (not accessible over network)
- Only local Node.js processes can access
- API Server enforces localhost-only access by default

---

## Related Documentation

- **Document 26:** Backend Architecture Complete Guide
- **Document 28:** API Server Guide
- **Document 29:** Provider Router Guide
- **Document 30:** Qwen Proxy Guide

**Migration Documentation:**
- `/backend/provider-router/src/database/migrations.js` - Migration definitions
- `/backend/qwen-proxy/docs/summaries/MIGRATIONS.md` - Migration guide

**Schema Files:**
- `/backend/provider-router/src/database/schema.sql` - Base schema
- `/backend/provider-router/src/database/schema-v3.sql` - Provider config schema
- `/backend/qwen-proxy/src/database/schema.js` - Qwen proxy schema definitions

---

**Last Updated:** 2025-11-04
**Schema Version:** 5
**Next Review:** When schema changes are planned
