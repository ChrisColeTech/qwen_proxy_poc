# Document 27: Frontend Architecture Guide

**Created:** 2025-11-03
**Status:** Active Reference
**Purpose:** Define the correct frontend architecture and communication patterns

---

## Table of Contents

1. [Overview](#overview)
2. [Communication Patterns](#communication-patterns)
3. [API Server Integration](#api-server-integration)
4. [Electron IPC Usage](#electron-ipc-usage)
5. [Service Layer](#service-layer)
6. [State Management](#state-management)
7. [Lifecycle Hooks](#lifecycle-hooks)

---

## Overview

The frontend is a React application that runs inside an Electron window. It communicates with backend services through **two distinct channels**:

1. **HTTP API calls** to the API Server (port 3002) for backend management
2. **Electron IPC** for Electron-specific functionality only

**IMPORTANT:** These channels serve different purposes and should NOT be mixed.

---

## Communication Patterns

### Correct Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                                                             │
│  ┌──────────────────────┐    ┌─────────────────────────┐  │
│  │   HTTP API Calls     │    │    Electron IPC         │  │
│  │   (axios/fetch)      │    │    (window.electronAPI) │  │
│  └──────────────────────┘    └─────────────────────────┘  │
│           │                            │                    │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
  ┌──────────────────┐         ┌──────────────────┐
  │   API Server     │         │  Electron Main   │
  │   Port 3002      │         │  Process         │
  │                  │         │                  │
  │ - Start proxy    │         │ - Window control │
  │ - Stop proxy     │         │ - Clipboard      │
  │ - Get status     │         │ - Open browser   │
  │ - Health check   │         │ - System tray    │
  └──────────────────┘         └──────────────────┘
```

### What Goes Where

| Functionality | Channel | Why |
|--------------|---------|-----|
| Start/Stop Provider Router | **HTTP to API Server** | Backend process management |
| Start/Stop Qwen Proxy | **HTTP to API Server** | Backend process management |
| Get proxy status | **HTTP to API Server** | Backend state query |
| Health checks | **HTTP to API Server** | Backend monitoring |
| Window minimize/maximize/close | **Electron IPC** | Electron-specific UI control |
| Clipboard operations | **Electron IPC** | Native OS integration |
| Open Qwen login browser | **Electron IPC** | Electron BrowserWindow API |
| Extract cookies | **Electron IPC** | Electron session API |
| App quit | **Electron IPC** | Electron app lifecycle |

---

## API Server Integration

### Base Configuration

**File:** `frontend/src/config/api.ts` (to be created)

```typescript
export const API_CONFIG = {
  // API Server runs on port 3002
  baseURL: 'http://localhost:3002',

  endpoints: {
    // Health and monitoring
    health: '/api/health',

    // Proxy management
    proxyStart: '/api/proxy/start',
    proxyStop: '/api/proxy/stop',
    proxyStatus: '/api/proxy/status',

    // Credentials (future)
    credentials: '/api/credentials',
  },

  timeout: 10000, // 10 seconds
};
```

### API Service

**File:** `frontend/src/services/api.service.ts`

```typescript
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

class ApiService {
  private client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Proxy management
  async startProxy() {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStart);
    return response.data;
  }

  async stopProxy() {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStop);
    return response.data;
  }

  async getProxyStatus() {
    const response = await this.client.get(API_CONFIG.endpoints.proxyStatus);
    return response.data;
  }

  // Health check
  async checkHealth() {
    const response = await this.client.get(API_CONFIG.endpoints.health);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### Usage in Components

```typescript
import { apiService } from '@/services/api.service';

function ProxyControl() {
  const [status, setStatus] = useState({ running: false });

  const handleStart = async () => {
    try {
      const result = await apiService.startProxy();
      console.log('Proxy started:', result);
      await refreshStatus();
    } catch (error) {
      console.error('Failed to start proxy:', error);
    }
  };

  const handleStop = async () => {
    try {
      const result = await apiService.stopProxy();
      console.log('Proxy stopped:', result);
      await refreshStatus();
    } catch (error) {
      console.error('Failed to stop proxy:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      const status = await apiService.getProxyStatus();
      setStatus(status);
    } catch (error) {
      console.error('Failed to get status:', error);
    }
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
      <div>Status: {status.running ? 'Running' : 'Stopped'}</div>
    </div>
  );
}
```

---

## Electron IPC Usage

### IPC Service (Electron-specific only)

**File:** `frontend/src/services/electron-ipc.service.ts`

```typescript
class ElectronIPCService {
  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI;
  }

  // Window controls
  minimizeWindow() {
    this.api.window.minimize();
  }

  maximizeWindow() {
    this.api.window.maximize();
  }

  closeWindow() {
    this.api.window.close();
  }

  // System operations
  async copyToClipboard(text: string) {
    await this.api.system.copyToClipboard(text);
  }

  async readFromClipboard(): Promise<string> {
    return await this.api.system.readFromClipboard();
  }

  // Qwen authentication (requires Electron browser)
  async openQwenLogin() {
    await this.api.qwen.openLogin();
  }

  async extractQwenCredentials() {
    return await this.api.qwen.extractCredentials();
  }

  async getQwenCredentials() {
    return await this.api.qwen.getCredentials();
  }

  // App lifecycle
  quitApp() {
    this.api.app.quit();
  }
}

export const electronIPCService = new ElectronIPCService();
```

### What Should NOT Be in IPC Service

❌ **Remove these (they should use HTTP API instead):**
- `startProxy()` - Use `apiService.startProxy()`
- `stopProxy()` - Use `apiService.stopProxy()`
- `getProxyStatus()` - Use `apiService.getProxyStatus()`

---

## Service Layer

### Separation of Concerns

```
frontend/src/services/
├── api.service.ts           # HTTP calls to API Server
├── electron-ipc.service.ts  # Electron-specific IPC
└── credentials.service.ts   # May use BOTH (HTTP for storage, IPC for extraction)
```

### Credentials Service (Hybrid Example)

```typescript
import { apiService } from './api.service';
import { electronIPCService } from './electron-ipc.service';

class CredentialsService {
  // Use Electron IPC to open login browser
  async openLogin() {
    await electronIPCService.openQwenLogin();
  }

  // Use Electron IPC to extract credentials from browser session
  async extractCredentials() {
    return await electronIPCService.extractQwenCredentials();
  }

  // Use HTTP API to save credentials to backend
  async saveCredentials(credentials: QwenCredentials) {
    return await apiService.saveCredentials(credentials);
  }

  // Use HTTP API to get stored credentials
  async getStoredCredentials() {
    return await apiService.getCredentials();
  }
}

export const credentialsService = new CredentialsService();
```

---

## State Management

### Status Polling

The frontend should periodically poll the API Server for status updates:

```typescript
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';

export function useProxyStatus() {
  const [status, setStatus] = useState({ running: false, port: 8000 });
  const [loading, setLoading] = useState(true);

  const refreshStatus = async () => {
    try {
      const result = await apiService.getProxyStatus();
      setStatus(result);
    } catch (error) {
      console.error('Failed to get proxy status:', error);
      setStatus({ running: false, port: 8000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Poll every 5 seconds
    const interval = setInterval(refreshStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return { status, loading, refreshStatus };
}
```

---

## Lifecycle Hooks

### App Initialization

```typescript
// App.tsx
import { useEffect } from 'react';
import { apiService } from '@/services/api.service';

function App() {
  useEffect(() => {
    // Check if API server is ready
    const checkApiHealth = async () => {
      try {
        await apiService.checkHealth();
        console.log('API server is ready');
      } catch (error) {
        console.error('API server not ready:', error);
      }
    };

    checkApiHealth();
  }, []);

  return <div>...</div>;
}
```

### Auto-start After Login

```typescript
// Settings or Dashboard component
import { credentialsService } from '@/services/credentials.service';
import { apiService } from '@/services/api.service';

async function handleLogin() {
  // 1. Open Electron browser to login
  await credentialsService.openLogin();

  // 2. Extract credentials (happens automatically after login)
  const credentials = await credentialsService.extractCredentials();

  // 3. Save to backend via HTTP API
  await credentialsService.saveCredentials(credentials);

  // 4. Start proxy via HTTP API
  await apiService.startProxy();

  console.log('Login complete and proxy started');
}
```

### Configuration Changes

```typescript
async function handleConfigChange(newConfig: Config) {
  // 1. Stop proxy
  await apiService.stopProxy();

  // 2. Update config via HTTP API
  await apiService.updateConfig(newConfig);

  // 3. Restart proxy
  await apiService.startProxy();

  console.log('Configuration updated and proxy restarted');
}
```

---

## Common Mistakes to Avoid

### ❌ WRONG: IPC Handler Calling API Server

```typescript
// electron/src/main.ts - DON'T DO THIS
ipcMain.handle('proxy:start', async () => {
  // This is wrong - IPC handler making HTTP call
  const result = await makeApiRequest('POST', '/api/proxy/start');
  return result;
});
```

**Why wrong:** Unnecessary layer. Frontend can call API directly.

### ✅ CORRECT: Frontend Calls API Directly

```typescript
// frontend/src/services/api.service.ts
async startProxy() {
  const response = await this.client.post('/api/proxy/start');
  return response.data;
}
```

### ❌ WRONG: HTTP API for Window Control

```typescript
// DON'T DO THIS
async function minimizeWindow() {
  await fetch('http://localhost:3002/api/window/minimize');
}
```

**Why wrong:** Window control is Electron-specific, requires IPC.

### ✅ CORRECT: IPC for Window Control

```typescript
function minimizeWindow() {
  window.electronAPI.window.minimize();
}
```

---

## Migration Guide

### Steps to Fix Current Architecture

1. **Create API service layer**
   - Add `frontend/src/services/api.service.ts`
   - Add `frontend/src/config/api.ts`

2. **Update frontend services**
   - Remove proxy management from `electron-ipc.service.ts`
   - Move to `api.service.ts` instead

3. **Remove redundant IPC handlers**
   - Delete `proxy:start` handler from `electron/src/main.ts`
   - Delete `proxy:stop` handler
   - Delete `proxy:get-status` handler

4. **Keep legitimate IPC handlers**
   - Window controls (minimize, maximize, close)
   - Clipboard operations
   - Qwen login browser
   - Cookie extraction
   - App quit

5. **Update components**
   - Replace `electronIPCService.startProxy()` with `apiService.startProxy()`
   - Replace `electronIPCService.stopProxy()` with `apiService.stopProxy()`
   - Replace `electronIPCService.getProxyStatus()` with `apiService.getProxyStatus()`

6. **Add lifecycle hooks**
   - Auto-start after login
   - Restart after config changes
   - Status polling

---

## Directory Structure

```
frontend/src/
├── config/
│   └── api.ts                    # API Server configuration
├── services/
│   ├── api.service.ts            # HTTP calls to API Server
│   ├── electron-ipc.service.ts   # Electron IPC only
│   └── credentials.service.ts    # Hybrid (IPC + HTTP)
├── hooks/
│   ├── useProxyStatus.ts         # Status polling hook
│   └── useApiHealth.ts           # Health check hook
├── components/
│   ├── ProxyControl.tsx          # Uses apiService
│   ├── CredentialsManager.tsx    # Uses credentialsService
│   └── TitleBar.tsx              # Uses electronIPCService
└── App.tsx                       # Main app with initialization
```

---

## Summary

### Key Principles

1. **HTTP for Backend Management** - All proxy/service control goes through API Server
2. **IPC for Electron Features** - Window control, clipboard, native APIs only
3. **No Mixing** - Don't use IPC to call HTTP, and vice versa
4. **Direct Communication** - Frontend calls API Server directly, not through IPC
5. **Single Responsibility** - Each service layer has one purpose

### Decision Matrix

**Need to start/stop a backend service?** → HTTP API
**Need to open a browser window?** → IPC
**Need to get proxy status?** → HTTP API
**Need to minimize window?** → IPC
**Need to save credentials?** → HTTP API
**Need to extract cookies?** → IPC
**Need to check health?** → HTTP API
**Need to access clipboard?** → IPC

---

## Current Implementation Status (2025-11-04)

### ✅ What's Correctly Implemented

**Frontend Communication:**
- ✅ Frontend uses `apiService` to call API Server HTTP endpoints (port 3002)
- ✅ Frontend has `useProxyControl` hook calling `apiService.startProxy()` / `stopProxy()`
- ✅ Frontend correctly separates HTTP API calls from Electron IPC
- ✅ `ProxyServerControl` component uses HTTP, not IPC
- ✅ API config correctly points to `http://localhost:3002`

**Electron IPC:**
- ✅ Window controls (minimize/maximize/close) use IPC
- ✅ Qwen login browser uses IPC (`qwen:open-login`)
- ✅ Cookie extraction uses IPC (`qwen:extract-cookies`)
- ✅ Clipboard operations use IPC

### ❌ What's Broken/Missing

**Critical Issues:**

1. **Electron Does NOT Spawn API Server** ❌
   - **Expected:** Electron should spawn API Server on startup (as documented in doc 26)
   - **Reality:** No `startApiServer()` function exists in `electron/src/main.ts`
   - **Impact:** In production, API Server won't start automatically
   - **Current workaround:** Running `npm run dev` manually starts all services via concurrently

2. **Electron Sends Credentials to Wrong Port** ❌
   - **Location:** `electron/src/main.ts:441` - `sendCredentialsToBackend()` function
   - **Bug:** Sends to `port: 8000` (provider-router)
   - **Should be:** `port: 3002` (API Server endpoint `/api/qwen/credentials`)
   - **Why wrong:** Violates architecture - Electron should only talk to API Server

**Missing Features:**

3. **No Admin Pages for Backend Services** ❌
   - Only 2 pages exist: Dashboard, Settings
   - Missing pages:
     - Providers (list/add/edit/delete providers)
     - Models (view/sync models, manage provider-model mappings)
     - Sessions (view active sessions, cleanup)
     - Request/Response History (debugging, audit trail)
     - Activity Dashboard (stats, monitoring)
   - Settings page only has: theme, proxy port, auto-start, log level
   - No way to administer the 57 API Server endpoints from the UI

### 🔧 Required Fixes

**Priority 1 - Electron Lifecycle:**
```typescript
// electron/src/main.ts - ADD THIS
import { ChildProcess, spawn } from 'child_process';

let apiServerProcess: ChildProcess | null = null;

function startApiServer() {
  const apiServerPath = path.join(__dirname, '../../backend/api-server');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  apiServerProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: apiServerPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env }
  });

  // Setup logging and health check (see backend doc 26 for details)
}

async function waitForApiServer() {
  // Poll http://localhost:3002/api/health until ready
}

app.whenReady().then(async () => {
  startApiServer();
  await waitForApiServer();
  createWindow();
  createTray();
});
```

**Priority 2 - Fix Credential Destination:**
```typescript
// electron/src/main.ts:441 - CHANGE THIS
function sendCredentialsToBackend(credentials: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      token: credentials.tokenValue || credentials.umidToken,
      cookies: credentials.cookieString,
      expiresAt: credentials.tokenExpiry
    });

    const options = {
      hostname: 'localhost',
      port: 3002,  // ← CHANGED FROM 8000
      path: '/api/qwen/credentials',  // ← API Server endpoint
      method: 'POST',
      // ... rest
    };
  });
}
```

**Priority 3 - Add Admin Pages:**
- Create `frontend/src/pages/Providers.tsx`
- Create `frontend/src/pages/Models.tsx`
- Create `frontend/src/pages/Sessions.tsx`
- Create `frontend/src/pages/Activity.tsx`
- Update navigation to include these pages

---

## Lessons Learned from Code Investigation

### Lesson 1: Documentation Lies (Even Your Own)

**What happened:**
- Doc 26 (Backend Architecture) claimed Electron spawns API Server at `main.ts:103-149`
- Investigation revealed: **No such code exists**
- The documentation was aspirational, not factual

**Takeaway:** Always verify code matches documentation. Grep before trusting line numbers.

### Lesson 2: Don't Assume Documentation Is Correct

**What happened:**
- I initially accepted doc 26 as truth and generated 6000+ lines of reference docs based on it
- Only when asked to verify the code did I discover the architecture wasn't implemented

**Takeaway:** Documentation describes what SHOULD be, not necessarily what IS. Verify implementation before documenting implementation details.

### Lesson 3: Answer Questions Before Making Changes

**What happened:**
- User asked: "where is electron sending anything to provider-router?"
- I found `sendCredentialsToBackend()` sending to port 8000
- Instead of answering, I removed the code
- User had to repeatedly tell me to revert it

**Takeaway:** When asked "where," show the location. Wait for explicit instruction before changing code.

### Lesson 4: "Create Documentation" ≠ "Create Useful Documentation"

**What happened:**
- Agents created comprehensive, encyclopedic reference docs (docs 28-30)
- Listed every endpoint, every config, every line number
- But they don't answer real questions or explain gotchas

**Takeaway:**
- Reference material ≠ Knowledge transfer
- Better to have opinionated guides with "Common Mistakes" than complete API catalogs
- Line numbers go stale immediately; principles don't

### Lesson 5: Grep Beats Docs for Needle Queries

**What happened:**
- Doc 29 lists `DELETE /v1/sessions/:id` at line 873
- Faster to just: `grep -r "DELETE.*sessions" backend/`

**Takeaway:** Reference docs only useful if they explain WHY, not just WHAT. For WHAT, grep the code.

### Lesson 6: Architecture Docs Should Call Out Violations

**What happened:**
- Doc 27 explained "HTTP for Backend Management" pattern
- But didn't check if Electron actually followed it
- Found `sendCredentialsToBackend()` violating the pattern (sending to port 8000 instead of 3002)

**Takeaway:** Architecture docs should include:
- ✅ Correct pattern
- ❌ Common violations
- 🔍 How to detect violations ("grep for port: 8000 in electron/")

### Lesson 7: Development vs Production Gap

**What happened:**
- In dev mode, `npm run dev` uses concurrently to start all services
- Electron doesn't need to spawn API Server in dev
- This masked the fact that production mode would be broken (Electron not spawning API Server)

**Takeaway:** Test production build path, not just dev mode. Dev mode can hide architectural flaws.

### Lesson 8: Prioritize by Impact, Not Completeness

**What happened:**
- Spent time documenting all 57 API endpoints
- But missed that **Electron doesn't spawn API Server** (breaks production entirely)
- Missing admin pages is lower priority than broken startup sequence

**Takeaway:**
- Priority 1: Does the app start?
- Priority 2: Can users accomplish core tasks?
- Priority 3: Are all features accessible?
- Priority 4: Is everything documented?

### Lesson 9: "Some Dumbass Wrote It" (Was Me)

**What happened:**
- User pointed out errors in doc 26
- User said "some dumbass wrote it"
- The dumbass was me - I relied on documentation without verifying code

**Takeaway:** When you document based on incomplete information, you're the dumbass. Always verify before documenting.

---

## Common Misconceptions (Updated)

### ❌ WRONG: The docs are correct

**Reality:** Docs 26-27 were written based on intended architecture, not actual implementation. Always check the code.

### ❌ WRONG: If it works in dev mode, it works

**Reality:** `npm run dev` uses concurrently to start everything. Production Electron app won't have that - it needs to spawn API Server itself.

### ❌ WRONG: Electron should send credentials directly to provider-router

**Reality:** Electron should ONLY communicate with API Server (port 3002). API Server then manages provider-router and qwen-proxy.

### ❌ WRONG: Frontend needs admin pages eventually

**Reality:** Frontend needs admin pages NOW. Without them, users can't manage providers, view sessions, or debug requests. The 57 API endpoints are useless without a UI.

### ❌ WRONG: Line number references in docs are helpful

**Reality:** Line numbers go stale with every code change. Reference functions/concepts, not line numbers.

---

**Last Updated:** 2025-11-04
**Next Review:** After Electron lifecycle fixes and admin pages are implemented
