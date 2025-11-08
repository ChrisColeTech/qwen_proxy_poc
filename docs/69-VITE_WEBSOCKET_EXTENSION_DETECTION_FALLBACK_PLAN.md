# Document 69: Vite WebSocket Extension Detection Fallback Implementation Plan

**Created:** 2025-11-08
**Status:** Active Implementation Plan
**Purpose:** Add WebSocket server to Vite dev server for extension detection when backend is offline

---

## Work Progression Tracking

| Phase | Priority | Status | Dependencies | Files Modified | Files Created |
|-------|----------|--------|--------------|----------------|---------------|
| Phase 1: Vite Plugin WebSocket Server | P0 | Pending | None | 1 | 1 |
| Phase 2: Extension Hybrid Connection | P0 | Pending | Phase 1 | 1 | 0 |
| Phase 3: Frontend State Management | P1 | Pending | Phase 1 | 2 | 0 |
| Phase 4: Connection Prioritization | P2 | Pending | Phase 2, 3 | 1 | 0 |
| Phase 5: Testing & Validation | P3 | Pending | All | 0 | 0 |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Implementation Phases](#implementation-phases)
5. [Integration Points](#integration-points)
6. [Validation Criteria](#validation-criteria)

---

## Overview

### Problem Statement

The WebSocket-based extension detection in Document 68 has a critical flaw:
1. Extension connects to backend WebSocket server
2. Frontend receives extension status from backend
3. **Problem:** If backend is offline, extension detection fails
4. **Impact:** User visiting frontend first can't see "install extension" guide

### Why This Matters

**Common user journey:**
1. User clones repo
2. User runs `npm run dev` in frontend-v2 (starts Vite)
3. User opens http://localhost:5173
4. Frontend needs to detect extension to show installation guide
5. **Backend is not running yet** - WebSocket detection fails

### Solution

Add WebSocket server to Vite dev server as fallback:
1. **Primary:** Extension tries backend WebSocket (`ws://localhost:3002`)
2. **Fallback:** Extension tries frontend WebSocket (`ws://localhost:5173`)
3. **Frontend:** Receives extension status from either backend OR local Vite WebSocket
4. **Result:** Extension detection works whether backend is running or not

### Key Benefits

- ✅ **Works offline** - Extension detection when backend not running
- ✅ **No breaking changes** - Backend WebSocket approach still works (preferred)
- ✅ **Graceful degradation** - Falls back to Vite WS when backend unavailable
- ✅ **Developer friendly** - Frontend devs can work without starting backend
- ✅ **Production ready** - In production, only backend WebSocket is used

---

## Architecture

### Current Architecture (Backend-Only)

```
┌─────────────────────────────────────────────────────────────┐
│              Current Flow (Backend-Only WS)                  │
│                                                              │
│  Extension ──WS──> Backend Server ──WS──> Frontend          │
│                                                              │
│  Problem: If Backend offline, extension detection fails     │
└─────────────────────────────────────────────────────────────┘
```

### New Architecture (Hybrid with Fallback)

```
┌─────────────────────────────────────────────────────────────┐
│            New Flow (Hybrid with Fallback)                   │
│                                                              │
│  ┌────────────────┐                                         │
│  │  Extension     │                                         │
│  │  (background.js│                                         │
│  └────────┬───────┘                                         │
│           │                                                  │
│           │ Try Primary                                     │
│           ▼                                                  │
│  ┌────────────────┐                                         │
│  │ Backend WS     │◄──── Connected: Use backend            │
│  │ :3002          │                                         │
│  └────────────────┘                                         │
│           │                                                  │
│           │ Connection Failed                               │
│           ▼                                                  │
│  ┌────────────────┐                                         │
│  │ Frontend WS    │◄──── Fallback: Use Vite WS             │
│  │ :5173          │                                         │
│  └───────┬────────┘                                         │
│          │                                                   │
│          │ Send status updates                              │
│          ▼                                                   │
│  ┌────────────────┐                                         │
│  │  Frontend UI   │                                         │
│  │  (React)       │                                         │
│  └────────────────┘                                         │
│                                                              │
│  Result: Extension detected whether backend running or not  │
└─────────────────────────────────────────────────────────────┘
```

### Connection Priority Logic

```
Extension Connection Strategy:

1. Try Backend WebSocket (ws://localhost:3002)
   - Timeout: 2 seconds
   - Success: Stay connected to backend
   - Fail: Proceed to step 2

2. Try Frontend WebSocket (ws://localhost:5173)
   - Timeout: 2 seconds
   - Success: Stay connected to frontend
   - Fail: Retry from step 1 after 5 seconds

3. Reconnection Logic:
   - If backend WS connected and disconnects → Try frontend WS
   - If frontend WS connected and backend becomes available → Switch to backend WS
   - Always prefer backend over frontend

Why Prefer Backend:
- Backend has full system state (proxy, credentials)
- Backend broadcasts to all clients simultaneously
- Frontend Vite WS is dev-only (doesn't exist in production)
```

### Component Interactions

```
Scenario 1: Backend Running (Preferred Path)
  1. Extension connects to ws://localhost:3002 ✓
  2. Backend receives connection, broadcasts status to all frontends
  3. All frontends show "Extension Detected"
  4. Vite WS not used

Scenario 2: Backend Offline (Fallback Path)
  1. Extension tries ws://localhost:3002 ✗ (timeout)
  2. Extension connects to ws://localhost:5173 ✓
  3. Vite WS server receives connection
  4. Vite WS broadcasts to local frontend only
  5. Frontend shows "Extension Detected"
  6. Note: Only local frontend knows, backend unaware (when it starts)

Scenario 3: Backend Starts After Frontend
  1. Extension connected to ws://localhost:5173 (fallback)
  2. Backend starts at :3002
  3. Extension detects backend is now available
  4. Extension disconnects from :5173, connects to :3002
  5. System transitions to Scenario 1
```

---

## File Structure

### Complete Project Structure

```
qwen_proxy_poc/
├── extension/
│   ├── manifest.json                    [Integration Point - host_permissions]
│   ├── background.js                    [MODIFIED - Phase 2]
│   ├── content.js                       [Integration Point - unchanged]
│   └── dashboard-bridge.js              [Integration Point - unchanged]
│
├── backend/
│   ├── src/
│   │   ├── api-server/
│   │   │   ├── server.ts                [Integration Point - Doc 68]
│   │   │   └── websocket.ts             [Integration Point - Doc 68]
│   │   │
│   │   └── shared/
│   │       └── types/
│   │           └── proxy-status.ts      [Integration Point - Doc 68]
│   │
│   └── package.json                     [Integration Point - dependencies]
│
└── frontend-v2/
    ├── vite.config.ts                   [MODIFIED - Phase 1]
    ├── vite-plugin-extension-ws.ts      [CREATED - Phase 1]
    │
    ├── src/
    │   ├── hooks/
    │   │   └── useExtensionDetection.ts [MODIFIED - Phase 3]
    │   │
    │   ├── stores/
    │   │   └── useProxyStore.ts         [MODIFIED - Phase 3]
    │   │
    │   ├── pages/
    │   │   ├── HomePage.tsx             [Integration Point - uses hook]
    │   │   └── BrowserGuidePage.tsx     [Integration Point - uses hook]
    │   │
    │   └── types/
    │       └── proxy.ts                 [Integration Point - unchanged]
    │
    └── package.json                     [Integration Point - ws dependency]
```

---

## Implementation Phases

### Phase 1: Vite Plugin WebSocket Server

**Objective:** Add WebSocket server to Vite dev server for extension connections

**Files Created:**
- `frontend-v2/vite-plugin-extension-ws.ts`

**Files Modified:**
- `frontend-v2/vite.config.ts`

**Changes:**

1. **Create Vite Plugin: vite-plugin-extension-ws.ts**

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { ViteDevServer } from 'vite';

/**
 * Vite plugin that adds WebSocket server for extension detection
 * Only runs in development mode (not in production builds)
 */
export function extensionWebSocketPlugin() {
  let wss: WebSocketServer | null = null;
  const extensionConnections = new Set<WebSocket>();

  return {
    name: 'vite-plugin-extension-ws',

    configureServer(server: ViteDevServer) {
      // Only run in dev mode
      if (process.env.NODE_ENV !== 'development') {
        return;
      }

      // Create WebSocket server on same port as Vite (5173)
      wss = new WebSocketServer({
        server: server.httpServer,
        path: '/extension-ws' // Different path to avoid conflicts
      });

      console.log('[Vite WS] Extension WebSocket server started');

      wss.on('connection', (ws: WebSocket) => {
        console.log('[Vite WS] Extension connected');

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());

            // Extension identifies itself
            if (data.type === 'EXTENSION_CONNECT') {
              extensionConnections.add(ws);

              // Broadcast extension status to all Vite clients
              broadcastExtensionStatus(server, true);
            }
          } catch (error) {
            console.error('[Vite WS] Message parse error:', error);
          }
        });

        ws.on('close', () => {
          console.log('[Vite WS] Extension disconnected');
          extensionConnections.delete(ws);

          // Broadcast extension status to all Vite clients
          broadcastExtensionStatus(server, false);
        });

        ws.on('error', (error) => {
          console.error('[Vite WS] WebSocket error:', error);
        });
      });
    },

    closeBundle() {
      // Cleanup on server shutdown
      if (wss) {
        wss.close();
      }
    }
  };

  /**
   * Broadcast extension connection status to all Vite clients
   * Uses Vite's HMR WebSocket to send custom messages
   */
  function broadcastExtensionStatus(server: ViteDevServer, connected: boolean) {
    server.ws.send({
      type: 'custom',
      event: 'extension-status',
      data: { extensionConnected: connected }
    });
  }
}
```

2. **Update vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { extensionWebSocketPlugin } from './vite-plugin-extension-ws';

export default defineConfig({
  plugins: [
    react(),
    extensionWebSocketPlugin(), // Add WebSocket plugin
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

**Integration Points:**
- Uses Vite's `configureServer` hook to access HTTP server
- Uses Vite's HMR WebSocket (`server.ws.send()`) to broadcast to clients
- Uses `ws` package (already installed for backend)

**Validation:**
- Vite starts successfully with plugin
- Console shows "[Vite WS] Extension WebSocket server started"
- Extension can connect to `ws://localhost:5173/extension-ws`
- No errors in Vite console

---

### Phase 2: Extension Hybrid Connection

**Objective:** Extension tries backend first, falls back to Vite WS

**Files Modified:**
- `extension/background.js`

**Changes:**

Replace simple WebSocket connection with hybrid retry logic:

```javascript
// Extension WebSocket configuration
const BACKEND_WS_URL = 'ws://localhost:3002';
const FRONTEND_WS_URL = 'ws://localhost:5173/extension-ws';
const CONNECTION_TIMEOUT = 2000; // 2 seconds
const RECONNECT_INTERVAL = 5000; // 5 seconds

let ws = null;
let currentWsUrl = null;
let reconnectTimeout = null;
let connectionAttemptTimeout = null;

/**
 * Try to connect to WebSocket with timeout
 */
function tryConnect(url) {
  return new Promise((resolve, reject) => {
    console.log('[Background] Attempting connection to:', url);

    const socket = new WebSocket(url);
    let resolved = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.close();
        reject(new Error('Connection timeout'));
      }
    }, CONNECTION_TIMEOUT);

    socket.onopen = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.log('[Background] Connected to:', url);

        // Identify as extension
        socket.send(JSON.stringify({ type: 'EXTENSION_CONNECT' }));
        resolve(socket);
      }
    };

    socket.onerror = (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.log('[Background] Connection error:', url, error);
        reject(error);
      }
    };
  });
}

/**
 * Connect with fallback logic
 */
async function connectWebSocket() {
  // Clear any existing connection
  if (ws) {
    ws.close();
    ws = null;
  }

  try {
    // Try backend first (preferred)
    ws = await tryConnect(BACKEND_WS_URL);
    currentWsUrl = BACKEND_WS_URL;
    console.log('[Background] Using backend WebSocket');

  } catch (backendError) {
    console.log('[Background] Backend unavailable, trying frontend...');

    try {
      // Fallback to frontend
      ws = await tryConnect(FRONTEND_WS_URL);
      currentWsUrl = FRONTEND_WS_URL;
      console.log('[Background] Using frontend WebSocket (fallback)');

    } catch (frontendError) {
      console.log('[Background] Both WebSockets unavailable, will retry...');
      scheduleReconnect();
      return;
    }
  }

  // Setup event handlers for active connection
  ws.onclose = () => {
    console.log('[Background] WebSocket disconnected from:', currentWsUrl);
    ws = null;
    currentWsUrl = null;
    scheduleReconnect();
  };

  ws.onerror = (error) => {
    console.error('[Background] WebSocket error:', error);
  };

  // If connected to frontend, periodically check if backend is available
  if (currentWsUrl === FRONTEND_WS_URL) {
    startBackendHealthCheck();
  }
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectTimeout = setTimeout(() => {
    connectWebSocket();
  }, RECONNECT_INTERVAL);
}

/**
 * Periodically check if backend becomes available
 * If connected to frontend, upgrade to backend when it's ready
 */
function startBackendHealthCheck() {
  const checkInterval = setInterval(async () => {
    // Stop checking if we're no longer connected to frontend
    if (currentWsUrl !== FRONTEND_WS_URL) {
      clearInterval(checkInterval);
      return;
    }

    try {
      // Try to connect to backend
      const backendWs = await tryConnect(BACKEND_WS_URL);

      // Success! Upgrade to backend
      console.log('[Background] Backend available, upgrading connection...');

      // Close frontend connection
      if (ws) {
        ws.close();
      }

      // Switch to backend
      ws = backendWs;
      currentWsUrl = BACKEND_WS_URL;

      // Setup event handlers
      ws.onclose = () => {
        console.log('[Background] WebSocket disconnected from:', currentWsUrl);
        ws = null;
        currentWsUrl = null;
        scheduleReconnect();
      };

      clearInterval(checkInterval);

    } catch (error) {
      // Backend still unavailable, keep using frontend
      console.log('[Background] Backend still unavailable');
    }
  }, 10000); // Check every 10 seconds
}

// Start connection when background script loads
connectWebSocket();

// Cleanup on unload
self.addEventListener('unload', () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  if (ws) {
    ws.close();
  }
});
```

**Integration Points:**
- Connects to backend WebSocket (from Doc 68)
- Falls back to Vite WebSocket (from Phase 1)
- Coexists with credential extraction logic

**Validation:**
- Extension connects to backend when available
- Extension falls back to frontend when backend offline
- Extension upgrades to backend when it becomes available
- Console logs show connection strategy

---

### Phase 3: Frontend State Management

**Objective:** Frontend receives extension status from either backend or Vite WS

**Files Modified:**
- `frontend-v2/src/stores/useProxyStore.ts`
- `frontend-v2/src/hooks/useExtensionDetection.ts`

**Changes:**

1. **Update useProxyStore.ts**

Add listener for Vite HMR custom messages:

```typescript
import { create } from 'zustand';
import io from 'socket.io-client';

interface ProxyStore {
  wsProxyStatus: ProxyStatus | null;
  connected: boolean;
  localExtensionConnected: boolean; // NEW: Local extension status from Vite WS
  // ... existing fields
}

export const useProxyStore = create<ProxyStore>((set) => {
  // Existing backend WebSocket connection
  const socket = io('http://localhost:3002', {
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('status', (status: ProxyStatus) => {
    set({ wsProxyStatus: status });
  });

  socket.on('connect', () => {
    set({ connected: true });
  });

  socket.on('disconnect', () => {
    set({ connected: false });
  });

  // NEW: Listen for Vite HMR extension status messages
  if (import.meta.hot) {
    import.meta.hot.on('extension-status', (data: { extensionConnected: boolean }) => {
      console.log('[Vite HMR] Extension status:', data.extensionConnected);
      set({ localExtensionConnected: data.extensionConnected });
    });
  }

  return {
    wsProxyStatus: null,
    connected: false,
    localExtensionConnected: false,
    // ... existing methods
  };
});
```

2. **Update useExtensionDetection.ts**

Use hybrid status (backend or local):

```typescript
import { useProxyStore } from '@/stores/useProxyStore';
import { isElectron } from '@/utils/platform';

/**
 * Hook to get Chrome extension installation status
 *
 * Sources extension status from:
 * 1. Backend WebSocket (wsProxyStatus.extensionConnected) - preferred
 * 2. Vite WebSocket (localExtensionConnected) - fallback when backend offline
 */
export function useExtensionDetection() {
  const needsExtension = !isElectron();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const localExtensionConnected = useProxyStore((state) => state.localExtensionConnected);
  const connected = useProxyStore((state) => state.connected);

  // Determine extension status with fallback logic
  let extensionDetected = false;

  if (connected && wsProxyStatus?.extensionConnected !== undefined) {
    // Backend is online and has extension status - use it (preferred)
    extensionDetected = wsProxyStatus.extensionConnected;
  } else {
    // Backend offline - use local Vite WS status (fallback)
    extensionDetected = localExtensionConnected;
  }

  return {
    needsExtension,
    extensionDetected,
  };
}
```

**Integration Points:**
- Uses Vite's HMR API (`import.meta.hot`)
- Uses existing Zustand store structure
- Uses existing hook consumer components (HomePage, BrowserGuidePage)

**Validation:**
- Frontend receives extension status from backend when online
- Frontend receives extension status from Vite WS when backend offline
- Hook returns correct status in both scenarios
- No TypeScript errors

---

### Phase 4: Connection Prioritization

**Objective:** Ensure backend WebSocket is always preferred over Vite WS

**Files Modified:**
- `extension/background.js`

**Changes:**

Add backend availability monitoring (already included in Phase 2):

```javascript
// Phase 2 already includes:
// - Backend tried first
// - Fallback to frontend on failure
// - Health check upgrades frontend → backend
// - Reconnection logic maintains preference

// Additional improvement: Add manual upgrade trigger
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_BACKEND') {
    // Manual check if backend is available
    tryConnect(BACKEND_WS_URL)
      .then(() => {
        if (currentWsUrl === FRONTEND_WS_URL) {
          console.log('[Background] Manual upgrade to backend');
          connectWebSocket(); // Will connect to backend
        }
        sendResponse({ backendAvailable: true });
      })
      .catch(() => {
        sendResponse({ backendAvailable: false });
      });
    return true;
  }
});
```

**Integration Points:**
- Uses connection logic from Phase 2
- Can be triggered manually from frontend if needed

**Validation:**
- Backend always used when available
- Frontend WS only used when backend unavailable
- Automatic upgrade from frontend → backend
- Console logs show prioritization logic

---

### Phase 5: Testing & Validation

**Objective:** End-to-end testing of hybrid WebSocket approach

**Test Cases:**

1. **Backend Running (Preferred Path)**
   - Start backend server
   - Start frontend dev server
   - Load extension
   - Verify: Extension connects to ws://localhost:3002
   - Verify: Backend logs "Extension connected"
   - Verify: Frontend shows "Extension Detected"
   - Verify: Vite WS not used

2. **Backend Offline (Fallback Path)**
   - Stop backend server (or don't start it)
   - Start frontend dev server
   - Load extension
   - Verify: Extension tries backend, times out
   - Verify: Extension connects to ws://localhost:5173/extension-ws
   - Verify: Vite logs "[Vite WS] Extension connected"
   - Verify: Frontend shows "Extension Detected"

3. **Backend Starts After Frontend (Upgrade Path)**
   - Start with backend offline
   - Extension connected to Vite WS
   - Start backend server
   - Verify: Extension detects backend availability
   - Verify: Extension disconnects from Vite WS
   - Verify: Extension connects to backend WS
   - Verify: System transitions to preferred path

4. **Backend Stops During Operation (Degradation Path)**
   - Start with both running
   - Extension connected to backend
   - Stop backend server
   - Verify: Extension detects disconnect
   - Verify: Extension falls back to Vite WS
   - Verify: Frontend still shows "Extension Detected"

5. **Extension Enable/Disable**
   - Backend online: Enable/disable extension
     - Verify: Status updates via backend WS
   - Backend offline: Enable/disable extension
     - Verify: Status updates via Vite WS
   - Both scenarios: Updates immediate (< 1 second)

6. **Multiple Frontend Tabs**
   - Backend online: Open two frontend tabs
     - Extension connects to backend
     - Both tabs show "Extension Detected"
   - Backend offline: Open two frontend tabs
     - Extension connects to Vite WS
     - Both tabs show "Extension Detected"

7. **Production Build**
   - Run `npm run build` in frontend-v2
   - Verify: Vite plugin only runs in dev mode
   - Verify: Production build has no Vite WS code
   - Verify: Production uses only backend WS

**Performance Validation:**
- Connection timeout: 2 seconds max
- Reconnection interval: 5 seconds
- Health check interval: 10 seconds
- No memory leaks from reconnection logic
- CPU usage minimal

**Edge Cases:**
- Rapid backend start/stop cycles
- Extension reload while connected
- Network errors during connection
- WebSocket message parse errors

---

## Integration Points

### Vite Integration Points

**Files Used (Not Modified):**
- `frontend-v2/vite.config.ts` - Plugin registration
- Vite's HTTP server - WebSocket piggybacks on same port
- Vite's HMR WebSocket - Used for broadcasting to clients

**Dependencies:**
- `ws` package (already in package.json)
- Vite dev server (already configured)
- Node.js environment (dev mode only)

### Backend Integration Points

**Files Used (Not Modified):**
- `backend/src/api-server/websocket.ts` - Extension connection handling (Doc 68)
- `backend/src/api-server/server.ts` - WebSocket server
- `backend/src/shared/types/proxy-status.ts` - Type definitions

**Dependencies:**
- Backend WebSocket from Doc 68
- Port 3002 availability
- Backend running (optional with this plan)

### Extension Integration Points

**Files Used (Not Modified):**
- `extension/manifest.json` - Host permissions for localhost:3002 and localhost:5173
- `extension/content.js` - Credential extraction (unchanged)
- Existing credential POST logic (unchanged)

**Dependencies:**
- Chrome extension APIs (WebSocket, chrome.runtime)
- manifest.json `host_permissions` includes both ports

### Frontend Integration Points

**Files Used (Not Modified):**
- `frontend-v2/src/pages/HomePage.tsx` - Uses useExtensionDetection hook
- `frontend-v2/src/pages/BrowserGuidePage.tsx` - Uses useExtensionDetection hook
- `frontend-v2/src/components/ui/badge.tsx` - Badge display
- `frontend-v2/src/components/ui/status-indicator.tsx` - Status indicator

**Dependencies:**
- Existing hook pattern
- Existing Zustand store
- React component structure

---

## Validation Criteria

### Functional Requirements

✅ Extension detected when backend running (preferred path)
✅ Extension detected when backend offline (fallback path)
✅ Extension upgrades from frontend → backend when backend starts
✅ Extension degrades from backend → frontend when backend stops
✅ Frontend shows correct status in all scenarios
✅ Multiple frontend tabs receive updates
✅ Enable/disable detection works in both modes
✅ Production build excludes Vite WS (dev-only feature)

### Non-Functional Requirements

✅ Connection timeout: 2 seconds max
✅ No infinite retry loops
✅ Memory-efficient reconnection logic
✅ Clean error handling and logging
✅ No impact on production builds
✅ TypeScript type safety maintained
✅ No breaking changes to existing code

### Architectural Compliance

✅ SRP: Vite plugin only handles extension WS server
✅ DRY: Reuses WebSocket patterns from backend
✅ Event-driven: No polling (all WebSocket-based)
✅ Graceful degradation: Falls back when services unavailable
✅ Separation of concerns: Extension connection separate from credential flow
✅ Domain-driven: Frontend dev server can independently track extension status

---

## Migration Notes

### Deployment Scenarios

**Development (Both Approaches Work):**
```
Scenario A: Full stack running
  Backend :3002 → Extension connects here (preferred)
  Frontend :5173 → Receives status from backend

Scenario B: Frontend-only development
  Backend offline → Extension connects to :5173 (fallback)
  Frontend :5173 → Receives status from local Vite WS
```

**Production (Backend-Only):**
```
Frontend build (static files) → No Vite WS server
Extension → Connects to backend only
Backend → Broadcasts extension status
```

### Configuration

**manifest.json host_permissions:**
```json
{
  "host_permissions": [
    "http://localhost:3002/*",  // Backend WS
    "http://localhost:5173/*"   // Vite WS (dev only)
  ]
}
```

**Vite plugin environment check:**
```typescript
if (process.env.NODE_ENV !== 'development') {
  return; // Skip plugin in production
}
```

---

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Smart Reconnection Backoff**
   - Exponential backoff for failed connections
   - Prevents excessive reconnection attempts

2. **Connection Health Metrics**
   - Track connection latency
   - Log connection failures for debugging

3. **Multi-Instance Support**
   - Support multiple Vite dev servers on different ports
   - Extension tries all known frontend ports

4. **Extension Dashboard**
   - Show current connection in extension popup
   - Manual connection override controls

---

## Summary

This implementation plan adds Vite WebSocket server as a fallback for extension detection when the backend is offline. The solution:

- Maintains backend WebSocket as preferred approach (Doc 68)
- Adds graceful degradation when backend unavailable
- Enables frontend-only development workflow
- Requires minimal code changes (5 files modified, 1 file created)
- Production builds unaffected (dev-only feature)
- No breaking changes to existing functionality

The hybrid approach ensures extension detection works in all scenarios while maintaining clean architecture and separation of concerns.
