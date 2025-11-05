# Document 26: Complete Backend Architecture Guide

**Created:** 2025-11-03
**Status:** Active Reference
**Purpose:** Comprehensive guide to the complete backend architecture and service interactions

---

## Table of Contents

1. [Overview](#overview)
2. [Service Architecture](#service-architecture)
3. [Process Lifecycle](#process-lifecycle)
4. [Database Architecture](#database-architecture)
5. [Port Allocation](#port-allocation)
6. [Startup Sequence](#startup-sequence)
7. [Shutdown Sequence](#shutdown-sequence)
8. [Service Dependencies](#service-dependencies)
9. [Code References](#code-references)

---

## Overview

The Qwen Proxy OpenCode application consists of **6 components** (5 services + 1 meta-package) that work together:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Electron App                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Frontend (React/Vite)                       │  │
│  │              Dashboard UI - Port 5173                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Manages:                                                       │
│  └─> API Server (Port 3002)                                    │
│       │                                                         │
│       │ On user "Start" action:                                │
│       ├─> Provider Router (Port 3001)                          │
│       └─> Qwen Proxy (Port 3000)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Architecture

### 1. **Electron App**
- **Location:** `/electron/`
- **Entry Point:** `src/main.ts`
- **Purpose:** Desktop application container
- **Language:** TypeScript
- **Responsibilities:**
  - Window management
  - System tray integration
  - Starts API Server on launch
  - Hosts frontend dashboard
  - Handles IPC (Inter-Process Communication)
  - Extracts Qwen credentials from browser session and sends to API Server

### 2. **Frontend Dashboard**
- **Location:** `/frontend/`
- **Entry Point:** `src/main.tsx`
- **Purpose:** User interface for managing services
- **Language:** React + TypeScript
- **Port:** 5173 (development), embedded in Electron (production)
- **Responsibilities:**
  - Display service status
  - Control provider router (start/stop)
  - View logs and metrics

### 3. **Backend Meta-Package**
- **Location:** `/backend/`
- **Package:** `backend/package.json`
- **Purpose:** Workspace wrapper for all backend services
- **Type:** CommonJS
- **Responsibilities:**
  - Provides unified npm scripts for all backend services
  - Delegates commands to individual backend services
  - Allows monorepo root to target single "backend" workspace

**Key Scripts:**
- `npm run dev` → Starts `api-server`
- `npm run dev:proxy` → Starts both `qwen-proxy` and `provider-router` with concurrently
- `npm run proxy` → Starts `qwen-proxy` only
- `npm run router` → Starts `provider-router` only

**Structure:**
```
backend/
├── package.json           ← Meta-package wrapper
├── api-server/            ← Separate npm package
│   └── package.json
├── provider-router/       ← Separate npm package
│   └── package.json
└── qwen-proxy/            ← Separate npm package
    └── package.json
```

### 4. **API Server**
- **Location:** `/backend/api-server/`
- **Entry Point:** `src/index.js`
- **Purpose:** Backend process manager
- **Language:** Node.js (ES Modules)
- **Port:** 3002
- **Startup:** Automatically started by Electron on app launch
- **Responsibilities:**
  - Spawns and manages provider-router process
  - Spawns and manages qwen-proxy process
  - Provides REST API for dashboard
  - Health checks and status monitoring

**Key Routes:**

**Proxy Control** (`/api/proxy/*`)
- `POST /api/proxy/start` - Starts provider-router AND qwen-proxy
- `POST /api/proxy/stop` - Stops provider-router AND qwen-proxy
- `GET /api/proxy/status` - Returns status of both services

**Provider Management** (`/api/providers/*`)
- `GET /api/providers` - List all providers with pagination and filtering
- `GET /api/providers/:id` - Get provider details
- `POST /api/providers` - Create new provider
- `PUT /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider
- `POST /api/providers/:id/enable` - Enable provider
- `POST /api/providers/:id/disable` - Disable provider
- `POST /api/providers/:id/test` - Test provider connection/health
- `POST /api/providers/:id/reload` - Reload provider from database

**Provider Configuration** (`/api/providers/:id/config/*`)
- `GET /api/providers/:id/config` - Get all configuration for a provider
- `PUT /api/providers/:id/config` - Bulk update provider configuration
- `PATCH /api/providers/:id/config/:key` - Update single configuration value
- `DELETE /api/providers/:id/config/:key` - Delete single configuration value

**Provider-Model Mapping** (`/api/providers/:id/models/*`)
- `GET /api/providers/:id/models` - Get all models linked to a provider
- `POST /api/providers/:id/models` - Link a model to a provider
- `DELETE /api/providers/:id/models/:modelId` - Unlink a model from a provider
- `PUT /api/providers/:id/models/:modelId/default` - Set model as default for provider

**Model Management** (`/api/models/*`)
- `GET /api/models` - List all models with pagination and filtering
- `GET /api/models/:id` - Get model details
- `POST /api/models` - Create new model
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model

**Session Management** (`/api/sessions/*`)
- `GET /api/sessions` - List all sessions with pagination
- `GET /api/sessions/:id` - Get single session details
- `GET /api/sessions/:sessionId/requests` - Get all requests for a specific session
- `DELETE /api/sessions/:id` - Delete a session and all related data
- `DELETE /api/sessions` - Cleanup expired sessions

**Request History** (`/api/requests/*`)
- `GET /api/requests` - List all requests with pagination and filtering
- `GET /api/requests/:id` - Get single request details
- `DELETE /api/requests/:id` - Delete a request and related response

**Response History** (`/api/responses/*`)
- `GET /api/responses` - List all responses with pagination and filtering
- `GET /api/responses/stats` - Get usage statistics
- `GET /api/responses/:id` - Get single response details
- `GET /api/responses/request/:requestId` - Get response for specific request
- `GET /api/responses/session/:sessionId` - Get responses by session
- `DELETE /api/responses/:id` - Delete a response

**Activity Monitoring** (`/api/activity/*`)
- `GET /api/activity/recent` - Get recent activity from requests/responses
- `GET /api/activity/stats` - Get aggregated statistics

**Settings Management** (`/api/settings/*`)
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get specific setting
- `PUT /api/settings/:key` - Update specific setting
- `POST /api/settings/bulk` - Bulk update settings
- `DELETE /api/settings/:key` - Delete setting (reset to default)

**Qwen Credentials** (`/api/qwen/credentials`)
- `POST /api/qwen/credentials` - Set or update Qwen credentials
- `GET /api/qwen/credentials` - Get current Qwen credentials (masked)
- `DELETE /api/qwen/credentials` - Delete Qwen credentials

**Health Check**
- `GET /api/health` - Health check endpoint

### 5. **Provider Router**
- **Location:** `/backend/provider-router/`
- **Entry Point:** `src/index.js`
- **Purpose:** Multi-provider OpenAI-compatible proxy/router
- **Language:** Node.js (ES Modules)
- **Port:** 3001 (configurable via .env)
- **Startup:** Spawned by API Server when user clicks "Start"
- **Responsibilities:**
  - Routes requests to multiple AI providers
  - Provider selection and load balancing
  - Request/response logging to database
  - Session management
  - Exposes OpenAI-compatible API

**Database:** Uses centralized SQLite database at:
- `backend/provider-router/data/provider-router.db`

### 6. **Qwen Proxy**
- **Location:** `/backend/qwen-proxy/`
- **Entry Point:** `src/index.js`
- **Purpose:** Qwen-specific OpenAI-compatible proxy
- **Language:** Node.js (CommonJS)
- **Port:** 3000
- **Startup:** Spawned by API Server when provider-router starts
- **Responsibilities:**
  - Translates OpenAI API calls to Qwen format
  - Manages Qwen sessions
  - Handles streaming responses
  - Credential management

**Database:** Uses SAME centralized SQLite database as provider-router:
- `backend/provider-router/data/provider-router.db`

---

## Process Lifecycle

### Who Starts What?

```
1. User launches Electron app
   ↓
2. Electron starts (main.ts:699)
   ↓
3. Electron spawns API Server (main.ts:103-149)
   ├─ API Server listens on port 3002
   └─ Electron waits for health check
   ↓
4. User opens dashboard and clicks "Start"
   ↓
5. Dashboard sends POST to /api/proxy/start
   ↓
6. API Server spawns TWO processes:
   ├─ Provider Router (proxy-control.js:47)
   │  └─ Runs: npm run dev in backend/provider-router
   │  └─ Listens on port 3001
   │
   └─ Qwen Proxy (proxy-control.js:90 → startQwenProxy:239)
      └─ Runs: npm run dev in backend/qwen-proxy
      └─ Listens on port 3000
```

### Process Tree

```
electron (Electron App)
└── node (API Server, Port 3002)
    ├── node (Provider Router, Port 3001)  ← Started on user action
    └── node (Qwen Proxy, Port 3000)       ← Started on user action
```

---

## Database Architecture

### Centralized Database

All backend services share ONE SQLite database:

**Location:** `backend/provider-router/data/provider-router.db`

**Used By:**
- Provider Router (primary)
- Qwen Proxy (reads credentials, writes sessions)

**Tables:**
- `qwen_credentials` - Stores Qwen API token and cookies
- `sessions` - Active chat sessions
- `requests` - Request logs
- `responses` - Response logs
- `metadata` - Additional metadata

### Configuration Files

**Provider Router:**
```javascript
// backend/provider-router/src/config/database.js
const DB_PATH = path.join(__dirname, '../../data/provider-router.db');
```

**Qwen Proxy:**
```javascript
// backend/qwen-proxy/src/config/index.js
database: {
  path: process.env.DATABASE_PATH ||
        path.join(__dirname, '../../../provider-router/data/provider-router.db')
}
```

### Credential Management

**Qwen credentials flow:**
1. User clicks "Login to Qwen" in dashboard
2. Electron opens embedded browser to chat.qwen.ai
3. User logs in, Electron extracts cookies
4. Electron sends credentials to API Server
5. API Server stores in centralized database
6. Both Provider Router and Qwen Proxy read from same database

---

## Port Allocation

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Frontend (dev) | 5173 | HTTP | localhost only |
| API Server | 3002 | HTTP | localhost only |
| Qwen Proxy | 3000 | HTTP | localhost + network |
| Provider Router | 3001 | HTTP | localhost + network |

**Note:** Only the proxies (3000, 3001) are meant to be accessed by external clients. Frontend and API Server are internal only.

---

## Startup Sequence

### Development Mode

```bash
# Terminal 1 - Start Electron (which starts everything)
cd qwen_proxy_opencode
npm run dev

# This triggers:
# 1. Electron starts
# 2. Electron spawns API Server (port 3002)
# 3. Electron loads Frontend (Vite on port 5173)
# 4. User clicks "Start" in dashboard
# 5. API Server spawns Provider Router (port 3001)
# 6. API Server spawns Qwen Proxy (port 3000)
```

### What Each npm Script Does

**Root package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:electron\""
  },
  "workspaces": [
    "frontend",
    "electron",
    "backend"  ← Meta-package that wraps all 3 backend services
  ]
}
```

**Backend Meta-Package (backend/package.json):**
```json
{
  "scripts": {
    "dev": "cd api-server && npm run dev",
    "dev:proxy": "concurrently \"npm run proxy\" \"npm run router\"",
    "proxy": "cd qwen-proxy && npm run start",
    "router": "cd provider-router && npm run dev"
  }
}
```

**Breakdown:**
1. `dev:backend` → Runs `npm run dev -w backend` → Delegates to `backend/package.json` → Starts `api-server`
2. `dev:frontend` → Starts Vite dev server on port 5173
3. `dev:electron` → Starts Electron app

**However**, in production flow:
- Electron starts API Server automatically
- API Server starts provider-router and qwen-proxy when user clicks "Start"

---

## Shutdown Sequence

### User Quits Electron App

```
1. User clicks "Quit" from tray menu
   ↓
2. Electron triggers 'before-quit' event (main.ts:726)
   ↓
3. Electron sends POST to /api/proxy/stop
   ↓
4. API Server stops qwen-proxy (proxy-control.js:128)
   ├─ Sends SIGTERM
   └─ Force SIGKILL after 2 seconds if needed
   ↓
5. API Server stops provider-router (proxy-control.js:131)
   ├─ Sends SIGTERM
   └─ Force SIGKILL after 2 seconds if needed
   ↓
6. Electron stops API Server (main.ts:739-752)
   ├─ Sends SIGTERM
   └─ Force SIGKILL after 2 seconds if needed
   ↓
7. Electron exits
```

### User Clicks "Stop" in Dashboard

```
1. Dashboard sends POST to /api/proxy/stop
   ↓
2. API Server stops qwen-proxy
   ↓
3. API Server stops provider-router
   ↓
4. Dashboard shows "Stopped" status

(Electron and API Server continue running)
```

---

## Service Dependencies

### Critical Dependencies

```
Electron App
  ↓ REQUIRES
API Server
  ↓ CAN SPAWN (on demand)
Provider Router + Qwen Proxy
```

### Startup Requirements

**API Server requires:**
- Node.js runtime
- Port 3002 available
- Write access to logs directory

**Provider Router requires:**
- Port 3001 available
- Centralized database exists
- Qwen credentials (optional - graceful degradation)

**Qwen Proxy requires:**
- Port 3000 available
- Centralized database exists
- Qwen credentials (optional - returns 401 if missing)

### Optional Services

**Both Provider Router and Qwen Proxy can start without credentials:**
- Server will start successfully
- API endpoints return helpful 401 errors
- User can configure credentials through dashboard
- No chicken-and-egg problem

---

## Code References

### Electron Main Process

**File:** `electron/src/main.ts`

**Key Functions:**
- `startApiServer()` (line 103) - Spawns API Server
- `waitForApiServer()` (line 149) - Health check polling
- `app.whenReady()` (line 696) - Startup sequence
- `app.on('before-quit')` (line 726) - Shutdown sequence

**Process Tracking:**
```typescript
let apiServerProcess: ChildProcess | null = null;
```

### API Server

**File:** `backend/api-server/src/routes/proxy-control.js`

**Key Functions:**
- `POST /start` (line 25) - Starts both proxies
- `POST /stop` (line 109) - Stops both proxies
- `GET /status` (line 162) - Returns status
- `startQwenProxy()` (line 222) - Spawns qwen-proxy
- `stopQwenProxy()` (line 282) - Stops qwen-proxy

**Process Tracking:**
```javascript
let proxyProcess = null;        // Provider Router
let qwenProxyProcess = null;     // Qwen Proxy
```

### Provider Router

**File:** `backend/provider-router/src/index.js`

**Starts:** When API Server runs `npm run dev` in provider-router directory

**Database Config:** `src/config/database.js`
```javascript
const DB_PATH = path.join(__dirname, '../../data/provider-router.db');
```

### Qwen Proxy

**File:** `backend/qwen-proxy/src/index.js`

**Starts:** When API Server runs `npm run dev` in qwen-proxy directory

**Database Config:** `src/config/index.js`
```javascript
database: {
  path: path.join(__dirname, '../../../provider-router/data/provider-router.db')
}
```

**Credential Service:** `src/services/qwen-credentials-service.js`
- Reads from centralized database
- Fallback to .env if database empty
- Graceful handling when credentials missing

---

## Common Misconceptions

### ❌ WRONG: Electron starts provider-router
**Reality:** Electron only starts the API Server. The API Server starts provider-router when the user clicks "Start" in the dashboard.

### ❌ WRONG: Each service has its own database
**Reality:** All services share ONE centralized database at `backend/provider-router/data/provider-router.db`.

### ❌ WRONG: Services must have credentials to start
**Reality:** Services can start WITHOUT credentials and will return helpful 401 errors until credentials are configured.

### ❌ WRONG: Qwen Proxy is started by Electron
**Reality:** Qwen Proxy is started by API Server when it starts provider-router.

### ❌ WRONG: Provider Router is on port 3001
**Reality:** Provider Router is on port 3001 (default). Port 8000 was used in older versions.

### ❌ WRONG: There are 3 separate backend workspaces in root package.json
**Reality:** Root package.json has ONE workspace called "backend" which is a meta-package. The meta-package (`backend/package.json`) wraps and delegates to the 3 actual backend services (api-server, provider-router, qwen-proxy). This allows the monorepo root to target a single workspace while still maintaining separation of the 3 backend services.

---

## Testing the Architecture

### Verify Each Service

```bash
# 1. Check API Server
curl http://localhost:3002/api/health

# 2. Check Provider Router (after starting from dashboard)
curl http://localhost:3001/v1/models

# 3. Check Qwen Proxy (after starting from dashboard)
curl http://localhost:3000/health

# 4. Check process tree
ps aux | grep node
```

### Expected Output

When everything is running:
```
chris   12345  node backend/api-server/src/index.js
chris   12346  node backend/provider-router/src/index.js
chris   12347  node backend/qwen-proxy/src/index.js
```

---

## Troubleshooting

### Service Won't Start

**Check port availability:**
```bash
lsof -i :3002  # API Server
lsof -i :3001  # Provider Router
lsof -i :3000  # Qwen Proxy
```

**Kill existing processes:**
```bash
npx kill-port 3002
npx kill-port 3001
npx kill-port 3000
```

### Database Lock Errors

**Cause:** Multiple services trying to write to database simultaneously

**Solution:** Use database busy timeout (already configured):
```javascript
// backend/qwen-proxy/src/config/index.js
database: {
  busyTimeout: 5000  // 5 seconds
}
```

### Credentials Not Working

**Check database:**
```bash
sqlite3 backend/provider-router/data/provider-router.db "SELECT * FROM qwen_credentials;"
```

**Verify both services read from same database:**
```bash
# In provider-router
grep -r "provider-router.db" backend/provider-router/src/config/

# In qwen-proxy
grep -r "provider-router.db" backend/qwen-proxy/src/config/
```

---

## Summary

The architecture uses a **hierarchical process management** approach:

1. **Electron** is the root process (always running when app is open)
2. **API Server** is a child of Electron (auto-started, always running)
3. **Provider Router + Qwen Proxy** are children of API Server (user-controlled)

This design allows:
- Clean separation of concerns
- Easy lifecycle management
- Graceful shutdown handling
- Independent service restarts
- Shared database for efficiency

All services communicate via:
- HTTP APIs (REST)
- Shared SQLite database
- Process signals (SIGTERM, SIGKILL)

---

**Last Updated:** 2025-11-03
**Next Review:** When adding new backend services
