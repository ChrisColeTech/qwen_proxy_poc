# Handoff & Lessons Learned
**Date:** October 31, 2025
**Status:** Development In Progress - Critical Issues Remain

---

## 1. What We Accomplished

### ✅ Dashboard UI Implementation
- **Created dashboard components** for Qwen Proxy OpenCode Electron app
  - `QwenLoginCard.tsx` - Qwen authentication status and login control
  - `ProxyControlCard.tsx` - Backend proxy server start/stop control
  - `QuickStartGuide.tsx` - User onboarding guide
  - `CodeExample.tsx` - API usage examples
- **Added UI components**: `Badge`, `Alert` components for dashboard
- **Updated navigation**: Added all CRUD pages (Providers, Models, Sessions, Requests) to sidebar
- **Location**: `/frontend/src/components/dashboard/`, `/frontend/src/pages/`

### ✅ Electron Login Window Implementation
- **Created embedded browser login** in `/electron/src/main.ts`
  - Opens https://chat.qwen.ai in BrowserWindow with persistent session partition
  - Automatically extracts cookies after successful login
  - Looks for `token` and `bx-umidtoken` cookies (based on POC at `/mnt/d/Projects/qwen_proxy/electron/main.js`)
  - Decodes JWT token to get expiration timestamp
  - Saves credentials to electron-store
  - Sends credentials to renderer via IPC event
- **Key functions**:
  - `createLoginWindow()` - Line 62-124
  - `extractQwenCookies()` - Line 126-181
- **IPC handlers added**:
  - `qwen:open-login` - Opens login window
  - `qwen:get-credentials` - Gets saved credentials
  - `qwen:refresh-credentials` - Re-extracts cookies from persistent session
  - `qwen:extract-cookies` - Manual extraction (debugging)

### ✅ IPC Communication Wiring
- **Updated preload.ts** with all dashboard IPC methods
  - Qwen authentication methods
  - Proxy control methods
  - System utilities (clipboard, notifications)
- **Updated TypeScript types** in `/frontend/src/types/electron.d.ts`
- **Wired up dashboard components** to call real Electron IPC instead of mocks

### ✅ Configuration & Build Fixes
- **Fixed port configuration**:
  - Backend runs on port 8000 (confirmed in `/backend/provider-router/src/config.js` line 60)
  - Updated backend package.json to kill port 8000 instead of 3001
  - Created `/frontend/.env` with `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - Fixed IPv6 vs IPv4 resolution issue (localhost → 127.0.0.1)
- **Fixed TypeScript errors** in Electron build
- **Added debug logging** throughout cookie extraction and API service

### ✅ Documentation Created
- `18-ELECTRON_DASHBOARD_MODERNIZATION_PLAN.md` (flawed - removed spawning)
- `19-BACKEND_LIFECYCLE_MANAGEMENT.md`
- `20-REVISED_MODERNIZATION_PLAN.md` (correct - keeps spawning)
- `21-DASHBOARD_IMPLEMENTATION_SUMMARY.md`

---

## 2. What Work Remains

### 🚨 Critical Issues (Blocking Basic Functionality)

#### A. Frontend Cannot Connect to Backend API
**Symptom**: All CRUD pages show "Unable to connect to the server"

**What We Know**:
- Backend IS running on port 8000 (verified with `curl http://0.0.0.0:8000/health`)
- Backend responds correctly to direct curl requests
- Frontend `.env` file has `VITE_API_BASE_URL=http://127.0.0.1:8000`
- API service default changed to `http://127.0.0.1:8000`
- Even after restarting frontend dev server, still fails
- IPv6/IPv4 resolution issue was suspected but fix didn't work

**Evidence**:
```bash
# Backend works:
curl -s http://0.0.0.0:8000/health
# Returns: {"status":"ok","providers":{...}}

curl -s http://127.0.0.1:8000/v1/providers
# Returns: {"providers":[...], "total":3}

# But frontend still shows connection error
```

**Logs Added**:
- `/frontend/src/services/api.service.ts` lines 10-11 log base URL and environment
- Check browser console for these logs

#### B. Qwen Cookie Extraction Not Working
**Symptom**: Login window opens but cookies not extracted after login

**What We Know**:
- Login window opens correctly
- Loads https://chat.qwen.ai
- User can log in
- Navigation event fires
- But cookies not being extracted or window redirects to blank page

**Implementation Details**:
- Uses `persist:qwen` session partition for cookie storage
- Monitors `did-navigate` event
- Looks for `token` cookie (primary) and `bx-umidtoken` cookie
- Based on proof-of-concept at `/mnt/d/Projects/qwen_proxy/electron/main.js`

**Key Differences from POC**:
- POC extracts cookies on EVERY navigation to `chat.qwen.ai`
- POC doesn't close window automatically (commented out in our version too)
- POC uses simpler JWT decode
- Our version matches POC structure exactly (as of last commit)

#### C. Electron Window Control Issues
**Symptom**: Maximize button doesn't fill screen properly, window controls may be unresponsive

**What We Know**:
- TitleBar component has proper WebkitAppRegion settings
- Electron main process has maximize/restore handler
- May be related to frameless window configuration

### 🔧 Feature Completions Needed

#### D. Backend Process Spawning
**Status**: IPC handlers are placeholders

**What Needs Implementation** (`/electron/src/main.ts`):
- `proxy:start` handler (line 340-348):
  - Spawn backend process as child process
  - Pass credentials via environment variables
  - Monitor stdout/stderr
  - Track process state
  - Return actual success/failure status
- `proxy:stop` handler (line 351-358):
  - Kill backend process gracefully (SIGTERM)
  - Force kill after timeout (SIGKILL)
  - Update proxy status
- `proxy:get-status` handler (line 361-367):
  - Check if backend process is actually running
  - Return real status

**Reference**: See POC at `/mnt/d/Projects/qwen_proxy/electron/main.js` lines 209-333 for complete implementation

#### E. Credentials Persistence to Database
**Status**: Only saves to electron-store

**What Needs Implementation**:
- Call backend REST API to save Qwen credentials to database
- Endpoint: `POST /v1/settings` or dedicated credentials endpoint
- Currently marked as TODO in `extractQwenCookies()` line 179

---

## 3. Prime Suspects - Where to Begin

### 🔍 Suspect #1: CORS or Network Configuration Issue (MOST LIKELY)
**Hypothesis**: Frontend is running in Electron/browser context that can't reach backend due to CORS or network configuration.

**Why This Could Be It**:
- curl works but frontend doesn't → different network context
- Electron loads frontend from `http://localhost:5173` (Vite dev server)
- Backend is on `http://127.0.0.1:8000`
- Cross-origin request from localhost:5173 → 127.0.0.1:8000

**Evidence to Check**:
1. Open browser DevTools (in Electron app or browser)
2. Check Network tab for failed requests
3. Look for CORS errors in console
4. Check if requests are even being made

**How to Investigate**:
```bash
# 1. Check if frontend is making requests
# Open DevTools in Electron app (View → Toggle Developer Tools)
# Navigate to Providers page
# Check Console for "[API Service] Base URL:" log
# Check Network tab for requests to /v1/providers

# 2. Test CORS manually
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://127.0.0.1:8000/v1/providers -v

# 3. Check if backend CORS allows Vite dev server origin
# Look at response headers for Access-Control-Allow-Origin
```

**Likely Fix**:
- Backend CORS is set to `origin: true` (allow all) but may not be working
- May need to explicitly allow `http://localhost:5173` origin
- Check `/backend/provider-router/src/middleware/cors.js`

### 🔍 Suspect #2: Frontend Build/HMR Not Picking Up Changes
**Hypothesis**: Vite HMR or build process not updating with new `.env` or code changes.

**Why This Could Be It**:
- `.env` file was created AFTER frontend started
- Multiple restarts mentioned but issue persists
- Changes to api.service.ts may not be reflected

**Evidence to Check**:
1. Check if console logs from api.service.ts appear
2. Verify actual baseURL being used
3. Check if old code is still running

**How to Investigate**:
```bash
# 1. Hard stop and restart frontend
cd /mnt/d/Projects/qwen_proxy_opencode
# Kill all node processes
pkill -f vite
# Start fresh
npm run dev:frontend

# 2. Check browser console for logs
# Should see: "[API Service] Base URL: http://127.0.0.1:8000"
# Should see: "[API Service] Environment: {...}"

# 3. Check if .env is being loaded
# In browser console:
console.log(import.meta.env.VITE_API_BASE_URL)
```

**Likely Fix**:
- Full restart of entire development environment
- Clear Vite cache: `rm -rf node_modules/.vite`
- Hard refresh browser: Ctrl+Shift+R

### 🔍 Suspect #3: Electron Context Isolation Blocking Requests
**Hypothesis**: Electron's context isolation is preventing frontend from making HTTP requests to localhost.

**Why This Could Be It**:
- Electron has `contextIsolation: true` in webPreferences
- Electron may block localhost requests in renderer process
- CSP (Content Security Policy) may be blocking

**Evidence to Check**:
1. Check Electron console for security warnings
2. Check if `fetch` or `axios` is being blocked
3. Look for CSP errors

**How to Investigate**:
```bash
# 1. Check Electron main process logs
# Look for security warnings when app starts

# 2. Test if fetch works at all in Electron
# Open DevTools in Electron app
# Run in console:
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

# 3. Check CSP headers
# In Network tab, check response headers for Content-Security-Policy
```

**Likely Fix**:
- May need to configure CSP in Electron main.ts
- May need to whitelist localhost in Electron security settings
- May need to use Electron's net module instead of fetch/axios

### 🔍 Suspect #4: Backend Not Actually Listening on IPv4 Loopback
**Hypothesis**: Backend listens on `0.0.0.0` but not accessible from `127.0.0.1` in Electron context.

**Why This Could Be It**:
- `netstat` shows listening on `0.0.0.0:8000`
- curl to `0.0.0.0:8000` works
- curl to `127.0.0.1:8000` works in terminal
- But may not work from Electron's renderer process

**Evidence to Check**:
1. Check if Electron can reach any localhost services
2. Try different addresses (0.0.0.0, 127.0.0.1, actual LAN IP)

**How to Investigate**:
```bash
# 1. Get LAN IP address
ip addr show | grep "inet " | grep -v 127.0.0.1

# 2. Try connecting to LAN IP instead
# Update .env to use actual IP (e.g., 192.168.x.x:8000)

# 3. Test in Electron console
fetch('http://192.168.0.22:8000/health') // use your LAN IP
  .then(r => r.json())
  .then(console.log)
```

**Likely Fix**:
- Use actual LAN IP address instead of 127.0.0.1
- Or configure backend to explicitly listen on 127.0.0.1 as well as 0.0.0.0

---

## 4. Step-by-Step Approach to Get App Fully Working

### Phase 1: Diagnose Frontend-Backend Connection Issue

#### Step 1.1: Verify Environment Variables Are Loaded
```bash
# 1. Open Electron app
npm run dev

# 2. Open DevTools (View → Toggle Developer Tools)

# 3. In Console, check logs:
# Should see: "[API Service] Base URL: http://127.0.0.1:8000"
# If not, .env is not being loaded

# 4. Manually check in console:
console.log(import.meta.env.VITE_API_BASE_URL)
# Should output: "http://127.0.0.1:8000"
```

**If env vars not loaded**:
- Hard restart: Kill all processes, clear cache, restart
- Check .env file location (must be in /frontend root)
- Check vite.config.ts for custom env handling

#### Step 1.2: Check Network Requests
```bash
# 1. In DevTools, go to Network tab

# 2. Navigate to Providers page in app

# 3. Look for request to /v1/providers
# - If no request: Frontend code not executing
# - If request with error: Note the error (CORS, timeout, refused, etc.)
# - If request succeeds: Backend is fine, check response parsing

# 4. Check request details:
# - Request URL should be: http://127.0.0.1:8000/v1/providers
# - Method: GET
# - Status: Should be 200 if working
```

**Common errors and fixes**:
- `ERR_CONNECTION_REFUSED`: Backend not running or wrong port
- `ERR_NAME_NOT_RESOLVED`: DNS issue, use IP instead of hostname
- `CORS error`: Backend CORS configuration issue
- `Timeout`: Backend running but not responding (check backend logs)

#### Step 1.3: Test Backend Accessibility from Electron
```bash
# In Electron DevTools Console, run:

// Test 1: Can Electron reach backend at all?
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(d => console.log('Backend reachable:', d))
  .catch(e => console.error('Backend unreachable:', e))

// Test 2: Can Electron make CORS request?
fetch('http://127.0.0.1:8000/v1/providers')
  .then(r => r.json())
  .then(d => console.log('Providers:', d))
  .catch(e => console.error('Providers error:', e))

// Test 3: Check what axios sees
window.axios.get('/v1/providers')
  .then(r => console.log('Axios success:', r.data))
  .catch(e => console.error('Axios error:', e))
```

**Interpret results**:
- If fetch works but axios fails: Axios configuration issue
- If both fail: Network/CORS issue
- If both work in console but not in app: React/component issue

#### Step 1.4: Fix Based on Diagnosis

**If CORS Issue**:
```javascript
// In /backend/provider-router/src/middleware/cors.js
// Change to explicitly allow origins:
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 600
}
```

**If Electron Security Issue**:
```typescript
// In /electron/src/main.ts, add to webPreferences:
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  webSecurity: false, // TEMPORARY: Disable web security for testing
}
```

**If Environment Variable Issue**:
```typescript
// Hardcode for testing in /frontend/src/services/api.service.ts:
constructor() {
  const baseURL = 'http://127.0.0.1:8000'; // Hardcode to test
  console.log('[API Service] Base URL:', baseURL);
  // ...
}
```

### Phase 2: Fix Qwen Cookie Extraction

#### Step 2.1: Add More Logging
```typescript
// In /electron/src/main.ts, enhance logging in did-navigate handler:
loginWindow.webContents.on('did-navigate', async (event, url) => {
  console.log('[Login Window] Navigated to:', url);
  console.log('[Login Window] URL includes chat.qwen.ai:', url.includes('chat.qwen.ai'));

  if (url.includes('chat.qwen.ai')) {
    console.log('[Login Window] Waiting 2 seconds before extraction...');
    setTimeout(async () => {
      console.log('[Login Window] Starting extraction NOW');
      const credentials = await extractQwenCookies();
      console.log('[Login Window] Extraction complete:', credentials);
      // ...
    }, 2000);
  }
});
```

#### Step 2.2: Test Cookie Extraction Manually
```bash
# 1. Open login window
# 2. Log in to Qwen
# 3. Wait for page to load completely
# 4. In Electron main process console, manually trigger:
# (Add a global function for testing)

# In main.ts, add:
global.testExtractCookies = extractQwenCookies;

# Then in terminal running Electron, access Node REPL:
# (This won't work easily, so instead add IPC handler)

# Better: Use the IPC handler we added
# In Electron DevTools console:
window.electronAPI.extractCookies()
```

#### Step 2.3: Check Cookie Availability
```typescript
// Add diagnostic function in extractQwenCookies():
async function extractQwenCookies() {
  try {
    const { session } = require('electron');

    // Get ALL cookies first
    const allCookies = await session.fromPartition('persist:qwen').cookies.get({});
    console.log('[Cookie Extract] ALL cookies:', allCookies.length);
    console.log('[Cookie Extract] ALL cookie names:', allCookies.map((c: any) => c.name));

    // Then filter for qwen.ai
    const cookies = await session.fromPartition('persist:qwen').cookies.get({
      domain: '.qwen.ai'
    });
    console.log('[Cookie Extract] Qwen cookies:', cookies.length);
    // ...
  }
}
```

#### Step 2.4: Common Cookie Extraction Issues

**Issue 1: Cookies not set yet**
- Solution: Increase wait time from 2s to 5s
- Or: Use `did-finish-load` event instead of `did-navigate`

**Issue 2: Wrong cookie name**
- Solution: Log all cookie names, find the right one
- Qwen may have changed cookie structure

**Issue 3: Session partition not persisting**
- Solution: Verify partition name is consistent
- Check Electron version compatibility

**Issue 4: Navigation happening multiple times**
- Solution: Use flag to prevent multiple extractions (already added)
- Or: Debounce the extraction call

### Phase 3: Implement Backend Process Spawning

#### Step 3.1: Create Backend Spawning Logic
```typescript
// In /electron/src/main.ts, add:
import { spawn } from 'child_process';

let backendProcess: any = null;
let proxyRunning = false;

async function startBackendProcess(credentials: any) {
  if (proxyRunning && backendProcess) {
    return { success: true, message: 'Proxy already running' };
  }

  const backendPath = path.join(__dirname, '../../backend/provider-router/src/index.js');
  const port = 8000;

  console.log('[Backend] Starting backend at:', backendPath);

  // Spawn using system Node.js
  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      QWEN_TOKEN: credentials.umidToken,
      QWEN_COOKIES: credentials.cookieString,
      PORT: port.toString(),
    },
    cwd: path.join(__dirname, '../../backend/provider-router'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  // Handle output
  backendProcess.stdout.on('data', (data: any) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data: any) => {
    console.error('[Backend Error]', data.toString().trim());
  });

  // Handle events
  backendProcess.on('spawn', () => {
    console.log('[Backend] Process spawned successfully');
    proxyRunning = true;
    mainWindow?.webContents.send('proxy-status-changed', { running: true, port });
  });

  backendProcess.on('error', (err: any) => {
    console.error('[Backend] Failed to start:', err);
    proxyRunning = false;
    backendProcess = null;
  });

  backendProcess.on('exit', (code: number) => {
    console.log('[Backend] Process exited with code:', code);
    proxyRunning = false;
    backendProcess = null;
    mainWindow?.webContents.send('proxy-status-changed', { running: false });
  });

  return { success: true, message: 'Proxy starting', port };
}

async function stopBackendProcess() {
  if (!backendProcess || !proxyRunning) {
    return { success: true, message: 'Proxy not running' };
  }

  return new Promise((resolve) => {
    backendProcess.once('exit', () => {
      proxyRunning = false;
      backendProcess = null;
      mainWindow?.webContents.send('proxy-status-changed', { running: false });
      resolve({ success: true, message: 'Proxy stopped' });
    });

    backendProcess.kill('SIGTERM');

    // Force kill after 5 seconds
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        console.log('[Backend] Force killing process');
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  });
}
```

#### Step 3.2: Update IPC Handlers
```typescript
// Replace placeholder handlers:
ipcMain.handle('proxy:start', async () => {
  console.log('Starting proxy server...');
  const credentials = await extractQwenCookies();
  if (!credentials.hasToken) {
    return {
      success: false,
      message: 'No Qwen credentials available. Please login first.',
    };
  }
  return await startBackendProcess(credentials);
});

ipcMain.handle('proxy:stop', async () => {
  console.log('Stopping proxy server...');
  return await stopBackendProcess();
});

ipcMain.handle('proxy:get-status', () => {
  return {
    running: proxyRunning,
    port: 8000,
  };
});
```

#### Step 3.3: Handle App Lifecycle
```typescript
// Add to app lifecycle handlers:
app.on('before-quit', async () => {
  isQuitting = true;
  if (proxyRunning && backendProcess) {
    await stopBackendProcess();
  }
});
```

### Phase 4: Test End-to-End Flow

#### Step 4.1: Full Integration Test
1. Start Electron app
2. Click "Login to Qwen" → Login window opens
3. Log in → Cookies extracted, dashboard shows "Authenticated"
4. Click "Start Proxy" → Backend spawns, status shows "Running"
5. Navigate to Providers page → List of providers loads
6. Create new provider → Success
7. Click "Stop Proxy" → Backend stops gracefully

#### Step 4.2: Error Scenarios to Test
- Login with invalid credentials
- Start proxy without credentials
- Network interruption during API call
- Backend crash while running
- Multiple rapid start/stop cycles

---

## 5. Critical Knowledge and Context

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                   │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Main Window    │  │ Login Window │  │ Backend Process │ │
│  │ (Dashboard)    │  │ (Qwen Auth)  │  │ (Child Spawn)   │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│         │                    │                    │          │
│         │                    │                    │          │
│    IPC Events          Cookie Extract        stdio pipes    │
│         │                    │                    │          │
└─────────┼────────────────────┼────────────────────┼──────────┘
          │                    │                    │
          │                    │                    │
┌─────────▼────────────────────▼────────────────────▼──────────┐
│                    Renderer Process (React)                   │
│                                                               │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Dashboard    │  │ CRUD Pages │  │ API Service        │  │
│  │ Components   │  │ (Providers,│  │ (Axios Client)     │  │
│  │              │  │  Models,   │  │                    │  │
│  │              │  │  Sessions) │  │                    │  │
│  └──────────────┘  └────────────┘  └────────────────────┘  │
│                                              │                │
│                                              │ HTTP           │
└──────────────────────────────────────────────┼────────────────┘
                                               │
                                               │
                                    ┌──────────▼─────────────┐
                                    │  Backend API Server    │
                                    │  (Express + SQLite)    │
                                    │                        │
                                    │  Port: 8000            │
                                    │  Routes: /v1/*         │
                                    └────────────────────────┘
```

### Key File Locations

**Electron (Main Process)**
- Entry: `/electron/src/main.ts`
- Preload: `/electron/src/preload.ts`
- Key Functions:
  - `createWindow()` - Line 14-59 (Main window)
  - `createLoginWindow()` - Line 62-124 (Qwen auth)
  - `extractQwenCookies()` - Line 126-181 (Cookie extraction)
  - `createTray()` - Line 184-242 (System tray)
  - IPC Handlers - Line 245-408

**Frontend (Renderer Process)**
- Entry: `/frontend/src/main.tsx`
- Router: `/frontend/src/App.tsx`
- API Service: `/frontend/src/services/api.service.ts`
- Providers:
  - Service: `/frontend/src/services/provider.service.ts`
  - Hooks: `/frontend/src/hooks/useProviders.ts`
  - List Page: `/frontend/src/pages/providers/ProvidersListPage.tsx`
- Dashboard:
  - QwenLoginCard: `/frontend/src/components/dashboard/QwenLoginCard.tsx`
  - ProxyControlCard: `/frontend/src/components/dashboard/ProxyControlCard.tsx`

**Backend**
- Entry: `/backend/provider-router/src/index.js`
- Server: `/backend/provider-router/src/server.js`
- Config: `/backend/provider-router/src/config.js`
- Routes: `/backend/provider-router/src/routes/*.js`
- Database: `/backend/provider-router/data/provider-router.db`

### Configuration Files

**Frontend Environment** (`/frontend/.env`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Backend Configuration** (from `/backend/provider-router/src/config.js`)
- Port: 8000 (default, overridden by database settings)
- Host: 0.0.0.0 (listens on all interfaces)
- Default Provider: lm-studio
- CORS: Allows all origins (`origin: true`)

**Package Scripts**
```json
// Root package.json
"dev": "concurrently \"npm:dev:frontend\" \"npm:dev:electron\" \"npm:dev:backend\""
"dev:frontend": "npm run dev --workspace=frontend"
"dev:backend": "npm run dev --workspace=backend/provider-router"
"dev:electron": "wait-on http://localhost:5173 && npm run dev --workspace=electron"

// Frontend package.json
"dev": "npx kill-port 5173 && vite"

// Backend package.json
"dev": "npx kill-port 8000 && node --watch src/index.js"

// Electron package.json
"dev": "NODE_ENV=development electron ."
```

### IPC Communication Flow

**Qwen Login Flow**:
1. User clicks "Login to Qwen" button in QwenLoginCard
2. Frontend calls `window.electronAPI.openLogin()`
3. IPC → `qwen:open-login` handler in main.ts
4. `createLoginWindow()` creates BrowserWindow
5. Loads https://chat.qwen.ai
6. User logs in
7. `did-navigate` event fires on navigation
8. After 2s delay, `extractQwenCookies()` runs
9. Extracts cookies from `persist:qwen` session
10. Saves to electron-store
11. Sends `credentials-updated` event to renderer
12. Frontend receives event, updates UI

**Proxy Control Flow**:
1. User clicks "Start Proxy" in ProxyControlCard
2. Frontend calls `window.electronAPI.startProxy()`
3. IPC → `proxy:start` handler (currently placeholder)
4. SHOULD: Spawn backend process (not implemented)
5. SHOULD: Monitor process status
6. SHOULD: Send `proxy-status-changed` event
7. Frontend updates UI with running status

### Critical Code Patterns

**IPC Handler Pattern**:
```typescript
// Main Process (main.ts)
ipcMain.handle('channel-name', async (event, arg) => {
  // Handle request
  return result;
});

// Preload (preload.ts)
contextBridge.exposeInMainWorld('electronAPI', {
  methodName: (arg) => ipcRenderer.invoke('channel-name', arg),
});

// Renderer (React component)
const result = await window.electronAPI.methodName(arg);
```

**IPC Event Pattern**:
```typescript
// Main Process - Send to renderer
mainWindow?.webContents.send('event-name', data);

// Preload - Subscribe
onEventName: (callback) => {
  const sub = (event, data) => callback(data);
  ipcRenderer.on('event-name', sub);
  return () => ipcRenderer.removeListener('event-name', sub);
}

// Renderer - Listen
useEffect(() => {
  const unsubscribe = window.electronAPI.onEventName((data) => {
    console.log('Event received:', data);
  });
  return () => unsubscribe();
}, []);
```

**React Query Pattern** (used for API calls):
```typescript
// Hook (useProviders.ts)
export const useProviders = (filters) => {
  return useQuery({
    queryKey: providerKeys.list(filters),
    queryFn: () => providerService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Component (ProvidersListPage.tsx)
const { data, isLoading, error } = useProviders();
const providers = data?.providers || [];

if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
return <DataTable data={providers} />;
```

### Important Constants and Defaults

**Ports**:
- Frontend Dev Server: 5173 (Vite)
- Backend API: 8000 (Express)
- Electron: No specific port (spawns frontend/backend)

**Session Partitions**:
- Main window: Default partition
- Login window: `persist:qwen` (for cookie persistence)

**Cookie Names**:
- Primary: `token` (JWT with expiration)
- Secondary: `bx-umidtoken` (used for API auth)

**Database**:
- Location: `/backend/provider-router/data/provider-router.db`
- Type: SQLite3 via better-sqlite3
- Schema Version: v5 (migrations in `/backend/provider-router/src/database/migrations/`)

---

## 6. New Strategies for Solving All Errors

### Strategy A: Incremental Isolation Testing

**Philosophy**: Test each layer independently before testing integration.

**Approach**:

1. **Layer 1: Backend Isolation**
   ```bash
   # Test backend completely independently
   cd /mnt/d/Projects/qwen_proxy_opencode/backend/provider-router
   npm start

   # In separate terminal, test all endpoints
   curl http://127.0.0.1:8000/health
   curl http://127.0.0.1:8000/v1/providers
   curl http://127.0.0.1:8000/v1/models
   curl http://127.0.0.1:8000/v1/sessions

   # If any fail: Fix backend first before moving to frontend
   ```

2. **Layer 2: Frontend Isolation (Browser Mode)**
   ```bash
   # Run frontend without Electron
   cd /mnt/d/Projects/qwen_proxy_opencode/frontend
   npm run dev

   # Open in regular browser: http://localhost:5173
   # Check if API calls work in browser (not Electron)

   # If works in browser but not Electron: Electron configuration issue
   # If fails in browser too: Frontend/CORS issue
   ```

3. **Layer 3: Electron Shell Only**
   ```bash
   # Test Electron without frontend complexity
   # Create minimal test.html that just makes fetch call

   # In /electron/test.html:
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Electron Network Test</h1>
     <button onclick="testFetch()">Test Fetch</button>
     <pre id="result"></pre>
     <script>
       async function testFetch() {
         try {
           const res = await fetch('http://127.0.0.1:8000/health');
           const data = await res.json();
           document.getElementById('result').textContent =
             JSON.stringify(data, null, 2);
         } catch (err) {
           document.getElementById('result').textContent =
             'Error: ' + err.message;
         }
       }
     </script>
   </body>
   </html>

   # Load this in Electron instead of Vite dev server
   # If this works: Issue is with Vite/React setup
   # If this fails: Issue is with Electron network configuration
   ```

4. **Layer 4: Full Integration**
   - Only after all layers work independently
   - Test full Electron + Vite + React + Backend stack

**Benefits**:
- Pinpoints exact layer where failure occurs
- Eliminates variables systematically
- Faster debugging (don't restart entire stack)

### Strategy B: Network Traffic Inspection

**Philosophy**: See exactly what's being sent over the wire.

**Approach**:

1. **Use Wireshark/tcpdump to capture packets**
   ```bash
   # Capture all traffic on loopback interface
   sudo tcpdump -i lo -A -s 0 'tcp port 8000'

   # In another terminal, trigger frontend request
   # Watch tcpdump output to see:
   # - Is request reaching backend?
   # - What is exact request format?
   # - What is backend response?
   # - Any errors in TCP handshake?
   ```

2. **Use Electron's Built-in Network Logging**
   ```typescript
   // In main.ts, enable network logging
   app.commandLine.appendSwitch('log-net-log', '/tmp/electron-net-log.json');

   // Run app, reproduce issue, then analyze log
   // Shows all network requests made by Electron
   ```

3. **Add Request Interceptors at Every Level**
   ```typescript
   // In api.service.ts
   this.client.interceptors.request.use((config) => {
     console.log('🚀 REQUEST:', {
       url: config.url,
       baseURL: config.baseURL,
       method: config.method,
       headers: config.headers,
     });
     return config;
   });

   this.client.interceptors.response.use(
     (response) => {
       console.log('✅ RESPONSE:', {
         url: response.config.url,
         status: response.status,
         data: response.data,
       });
       return response;
     },
     (error) => {
       console.error('❌ ERROR:', {
         url: error.config?.url,
         message: error.message,
         code: error.code,
         response: error.response?.data,
       });
       return Promise.reject(error);
     }
   );
   ```

4. **Backend Request Logging**
   ```javascript
   // In /backend/provider-router/src/middleware/request-logger.js
   // Add detailed logging
   console.log('📥 INCOMING REQUEST:', {
     method: req.method,
     url: req.url,
     headers: req.headers,
     origin: req.headers.origin,
     referer: req.headers.referer,
   });
   ```

**Benefits**:
- See actual network traffic, not just application logs
- Identify if request even leaves Electron
- Identify if CORS preflight is happening
- Identify exact error location (client vs network vs server)

### Strategy C: Proof-of-Concept Diff Analysis

**Philosophy**: Working POC exists. Find exact differences.

**Approach**:

1. **Side-by-Side File Comparison**
   ```bash
   # Compare working POC with current implementation

   # Main process
   diff -u /mnt/d/Projects/qwen_proxy/electron/main.js \
           /mnt/d/Projects/qwen_proxy_opencode/electron/src/main.ts

   # Look for:
   # - Different event listeners
   # - Different session handling
   # - Different cookie extraction logic
   # - Different window configuration
   ```

2. **Copy-Paste POC Code Directly**
   ```typescript
   // Create /electron/src/main-poc-test.js
   // Copy EXACT code from POC main.js
   // Change only:
   // - File paths to match new project structure
   // - Import paths

   // Test if POC code works in new project
   // If yes: Something different in TypeScript conversion
   // If no: Environmental difference (Node version, Electron version, etc.)
   ```

3. **Dependency Version Comparison**
   ```bash
   # Compare package.json versions
   diff <(cd /mnt/d/Projects/qwen_proxy && npm list --depth=0) \
        <(cd /mnt/d/Projects/qwen_proxy_opencode && npm list --depth=0)

   # Look for version differences in:
   # - electron
   # - express
   # - axios
   # - cors
   # - better-sqlite3
   ```

4. **Runtime Environment Comparison**
   ```bash
   # In POC project
   cd /mnt/d/Projects/qwen_proxy
   node --version
   npm --version
   npx electron --version

   # In new project
   cd /mnt/d/Projects/qwen_proxy_opencode
   node --version
   npm --version
   npx electron --version

   # Ensure exact same versions
   # If different: Install same versions as POC
   ```

**Benefits**:
- Leverage known-working code
- Identify subtle differences that might be missed in documentation
- Reduce unknowns by using proven approach

### Strategy D: Progressive Feature Enablement

**Philosophy**: Start with minimal working app, add features one at a time.

**Approach**:

1. **Stage 1: Static Frontend Only**
   ```typescript
   // Temporarily disable all API calls
   // Show static mock data

   // In ProvidersListPage.tsx
   const mockProviders = [
     { id: '1', name: 'Test Provider', type: 'lm-studio', enabled: true },
   ];

   // Comment out useProviders hook
   // const { data, isLoading, error } = useProviders();

   // Use mock data
   const providers = mockProviders;

   // Verify: UI renders correctly with mock data
   ```

2. **Stage 2: Enable Read-Only API Calls**
   ```typescript
   // Enable only GET requests
   // Disable all mutations (POST, PUT, DELETE)

   // Verify: Can fetch data from backend
   // If fails: Focus on GET request debugging
   ```

3. **Stage 3: Enable Mutations**
   ```typescript
   // Re-enable POST, PUT, DELETE
   // Test create, update, delete operations

   // Verify: Can modify data
   // If fails: Focus on mutation debugging
   ```

4. **Stage 4: Enable Electron Features**
   ```typescript
   // Enable IPC communication
   // Enable Qwen login
   // Enable proxy control

   // Verify: Electron-specific features work
   // If fails: Focus on IPC/Electron debugging
   ```

5. **Stage 5: Enable Backend Spawning**
   ```typescript
   // Add process spawning
   // Add lifecycle management

   // Verify: Can spawn/stop backend from Electron
   // If fails: Focus on process management debugging
   ```

**Benefits**:
- Identify which specific feature introduces the error
- Build confidence incrementally
- Easier to rollback when something breaks
- Clear test plan for each stage

---

## 7. Conclusion and Next Steps

### Immediate Actions (Next 30 Minutes)

1. **Open Electron app DevTools**
   - Check Console tab for "[API Service]" logs
   - Check Network tab for failed requests
   - Take screenshots of errors

2. **Run network diagnostic**
   ```bash
   # Test backend
   curl http://127.0.0.1:8000/health
   curl http://127.0.0.1:8000/v1/providers

   # If both work, backend is fine
   # Problem is in frontend-to-backend connection
   ```

3. **Test in regular browser**
   - Open http://localhost:5173 in Chrome/Firefox
   - Check if providers page loads
   - If yes: Electron-specific issue
   - If no: CORS or frontend issue

### Priority Order

**P0 (Blocker)**: Frontend-Backend Connection
- Without this, app is completely non-functional
- All CRUD pages depend on API

**P1 (Critical)**: Qwen Cookie Extraction
- Needed for Qwen provider to work
- Needed for proxy to have valid credentials

**P2 (Important)**: Backend Process Spawning
- Needed for "Start Proxy" button
- Needed for integrated user experience

**P3 (Nice to Have)**: Window Controls, Polish

### Success Criteria

**Minimum Viable**:
- ✅ Frontend can fetch providers list from backend
- ✅ Can view existing providers
- ✅ Can create new provider
- ⚠️ Qwen login works (can be manual for now)
- ⚠️ Backend process spawning (can start manually for now)

**Full Featured**:
- ✅ All CRUD operations work
- ✅ Qwen login with automatic cookie extraction
- ✅ Start/Stop proxy from Electron
- ✅ Real-time status updates
- ✅ Error handling and user feedback
- ✅ Window controls work properly

### Resources

**Reference Implementations**:
- POC: `/mnt/d/Projects/qwen_proxy/electron/main.js`
- Backend API docs: `http://127.0.0.1:8000/` (when running)

**Key Documentation**:
- Electron IPC: https://www.electronjs.org/docs/latest/tutorial/ipc
- Vite Env Variables: https://vitejs.dev/guide/env-and-mode.html
- React Query: https://tanstack.com/query/latest/docs/react/overview

**Debugging Tools**:
- Electron DevTools: View → Toggle Developer Tools
- Backend logs: Console output from `npm run dev:backend`
- Network traffic: Browser DevTools Network tab
- Process monitoring: `ps aux | grep node`

---

## Appendix: Common Error Messages and Solutions

### "Unable to connect to the server"

**Possible Causes**:
1. Backend not running → Check `ps aux | grep node`
2. Wrong port → Check `.env` has `VITE_API_BASE_URL=http://127.0.0.1:8000`
3. CORS blocking → Check browser console for CORS error
4. Network isolation → Try `fetch()` in console

**Debug Steps**:
1. `curl http://127.0.0.1:8000/health` → Backend working?
2. Check browser Network tab → Request being made?
3. Check console → Any JavaScript errors?
4. Test in regular browser → Electron-specific?

### "No response from server" / ERR_CONNECTION_REFUSED

**Possible Causes**:
1. Backend crashed → Check backend console for errors
2. Backend on wrong port → Check backend logs for "listening on..."
3. Firewall blocking → Disable firewall temporarily to test

**Debug Steps**:
1. `netstat -tlnp | grep 8000` → Port listening?
2. Check backend logs → Any startup errors?
3. Try `0.0.0.0:8000` instead of `127.0.0.1:8000`

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Possible Causes**:
1. Backend CORS middleware not working
2. OPTIONS preflight failing
3. Origin not allowed

**Solution**:
```javascript
// /backend/provider-router/src/middleware/cors.js
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

### "Failed to extract cookies"

**Possible Causes**:
1. Navigation event not firing
2. Cookies not set yet (timing)
3. Wrong cookie names
4. Session partition not persisting

**Debug Steps**:
1. Check console for "[Cookie Extract]" logs
2. Increase setTimeout delay (2000 → 5000)
3. Log ALL cookies to see what's available
4. Verify session partition name matches

---

**Document Version**: 1.0
**Last Updated**: October 31, 2025
**Next Review**: After frontend-backend connection is fixed
