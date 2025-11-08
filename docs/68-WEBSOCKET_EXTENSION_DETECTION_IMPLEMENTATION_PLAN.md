# Document 68: WebSocket-Based Extension Detection Implementation Plan

**Created:** 2025-11-08
**Status:** Active Implementation Plan
**Purpose:** Replace client-side polling with WebSocket-based extension detection for real-time status updates

---

## Work Progression Tracking

| Phase | Priority | Status | Dependencies | Files Modified | Files Created |
|-------|----------|--------|--------------|----------------|---------------|
| Phase 1: Backend WebSocket Enhancement | P0 | Pending | None | 2 | 0 |
| Phase 2: Type Definitions | P0 | Pending | None | 2 | 0 |
| Phase 3: Extension WebSocket Client | P1 | Pending | Phase 1, 2 | 1 | 0 |
| Phase 4: Frontend Hook Updates | P2 | Pending | Phase 2 | 1 | 0 |
| Phase 5: UI Component Cleanup | P2 | Pending | Phase 4 | 0 | 0 |
| Phase 6: Testing & Validation | P3 | Pending | All | 0 | 0 |

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

The current extension detection implementation uses client-side polling:
1. Frontend polls every 3 seconds using `chrome.runtime.sendMessage()`
2. Creates unnecessary load and console spam
3. Not aligned with the event-driven WebSocket architecture used for all other status updates
4. Violates the principle of having a single source of truth for system status

### Solution

Implement WebSocket-based extension detection:
1. **Extension** establishes WebSocket connection to backend when enabled
2. **Backend** tracks extension connection state
3. **Backend** broadcasts extension status to all connected frontends via existing WebSocket
4. **Frontend** receives extension status from `wsProxyStatus` (no polling needed)

### Key Benefits

- **Consistent Architecture**: Uses same WebSocket mechanism as proxy/credentials status
- **Event-Driven**: Immediate updates when extension is enabled/disabled
- **Reduced Load**: No continuous polling, only event-based updates
- **Single Source of Truth**: Backend tracks all system state
- **Scalable**: Works with multiple frontend clients connected simultaneously

---

## Architecture

### Current Architecture (Polling-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Flow (Polling)                    │
│                                                              │
│  ┌────────────────┐                                         │
│  │ Chrome         │                                         │
│  │ Extension      │                                         │
│  │ (background.js)│                                         │
│  │                │                                         │
│  │ - Listens for  │                                         │
│  │   PING messages│                                         │
│  └────────────────┘                                         │
│         ▲                                                    │
│         │ chrome.runtime.sendMessage(PING)                  │
│         │ every 3 seconds                                   │
│         │                                                    │
│  ┌──────┴─────────┐                                         │
│  │   Frontend     │                                         │
│  │   (Browser)    │                                         │
│  │                │                                         │
│  │ - Polls with   │                                         │
│  │   setInterval  │                                         │
│  │ - Updates      │                                         │
│  │   local state  │                                         │
│  └────────────────┘                                         │
│                                                              │
│  Backend API Server - NOT INVOLVED                          │
└─────────────────────────────────────────────────────────────┘
```

### New Architecture (WebSocket-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                  New Flow (Event-Driven)                     │
│                                                              │
│  ┌────────────────┐         ┌─────────────────┐            │
│  │ Chrome         │         │  Backend API    │            │
│  │ Extension      │ WS      │  Server         │            │
│  │ (background.js)├────────►│  Port 3002      │            │
│  │                │         │                 │            │
│  │ - Connect WS   │         │ - Track ext     │            │
│  │   on enable    │         │   connections   │            │
│  │ - Disconnect   │         │ - Broadcast     │            │
│  │   on disable   │         │   status        │            │
│  └────────────────┘         └────────┬────────┘            │
│                                      │                      │
│                                      │ WebSocket            │
│                                      │ (status broadcast)   │
│                                      │                      │
│                             ┌────────▼────────┐             │
│                             │   Frontend      │             │
│                             │   React App     │             │
│                             │                 │             │
│                             │ - Receive       │             │
│                             │   wsProxyStatus │             │
│                             │ - Update UI     │             │
│                             │   immediately   │             │
│                             └─────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Component Interactions

```
Extension Enable:
  1. Extension background.js loads
  2. Establishes WebSocket to ws://localhost:3002
  3. Backend receives connection, sets extensionConnected = true
  4. Backend broadcasts updated status to all frontends
  5. Frontends receive wsProxyStatus.extensionConnected = true
  6. UI updates badges immediately

Extension Disable:
  1. Extension unloads
  2. WebSocket connection closes
  3. Backend detects disconnect, sets extensionConnected = false
  4. Backend broadcasts updated status to all frontends
  5. Frontends receive wsProxyStatus.extensionConnected = false
  6. UI updates badges immediately
```

---

## File Structure

### Complete Project Structure

```
qwen_proxy_poc/
├── extension/
│   ├── manifest.json                    [Integration Point - externally_connectable config]
│   ├── background.js                    [MODIFIED - Phase 3]
│   ├── content.js                       [Integration Point - unchanged]
│   ├── dashboard-bridge.js              [Integration Point - unchanged]
│   └── icon/                            [Integration Point - unchanged]
│
├── backend/
│   ├── src/
│   │   ├── api-server/
│   │   │   ├── server.ts                [MODIFIED - Phase 1]
│   │   │   └── websocket.ts             [MODIFIED - Phase 1]
│   │   │
│   │   └── shared/
│   │       └── types/
│   │           └── proxy-status.ts      [MODIFIED - Phase 2]
│   │
│   └── package.json                     [Integration Point - dependencies]
│
└── frontend-v2/
    ├── src/
    │   ├── hooks/
    │   │   ├── useExtensionDetection.ts [MODIFIED - Phase 4]
    │   │   └── useProxyStore.ts         [Integration Point - receives wsProxyStatus]
    │   │
    │   ├── pages/
    │   │   ├── HomePage.tsx             [Integration Point - uses hook]
    │   │   └── BrowserGuidePage.tsx     [Integration Point - uses hook]
    │   │
    │   ├── types/
    │   │   └── proxy.ts                 [MODIFIED - Phase 2]
    │   │
    │   └── utils/
    │       └── extensionDetection.ts    [Integration Point - may be deprecated]
    │
    └── package.json                     [Integration Point - dependencies]
```

---

## Implementation Phases

### Phase 1: Backend WebSocket Enhancement

**Objective:** Add extension connection tracking to backend WebSocket server

**Files Modified:**
- `backend/src/api-server/websocket.ts`
- `backend/src/api-server/server.ts`

**Changes:**

1. **websocket.ts**
   - Add `extensionConnections` Set to track active extension WebSocket connections
   - Add event handler for extension connection messages
   - Distinguish between frontend and extension clients
   - Update `broadcastStatus()` to include `extensionConnected` boolean
   - Handle extension disconnect events

2. **server.ts** (if needed)
   - Ensure WebSocket server is accessible to extension (CORS, host permissions)

**Implementation Details:**

```typescript
// websocket.ts additions

// Track extension connections separately from frontend connections
const extensionConnections = new Set<WebSocket>();

// Modified connection handler
wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const url = req.url || '';

  // Determine client type from query parameter or initial message
  ws.on('message', (message: string) => {
    const data = JSON.parse(message);

    if (data.type === 'EXTENSION_CONNECT') {
      extensionConnections.add(ws);
      console.log('[WebSocket] Extension connected');
      broadcastStatus();
      return;
    }

    // Handle other message types...
  });

  ws.on('close', () => {
    if (extensionConnections.has(ws)) {
      extensionConnections.delete(ws);
      console.log('[WebSocket] Extension disconnected');
      broadcastStatus();
    } else {
      // Handle frontend disconnect
    }
  });
});

// Modified broadcastStatus
function broadcastStatus() {
  const status = {
    ...existingStatusFields,
    extensionConnected: extensionConnections.size > 0
  };

  // Broadcast to all frontend clients (not extension)
  clients.forEach(client => {
    if (!extensionConnections.has(client)) {
      client.send(JSON.stringify(status));
    }
  });
}
```

**Integration Points:**
- Uses existing WebSocket server infrastructure
- Uses existing `broadcastStatus()` pattern
- Connects to existing credential/proxy status system

**Validation:**
- Extension connection logged in backend console
- Extension disconnect logged in backend console
- Status broadcasts include `extensionConnected` field

---

### Phase 2: Type Definitions

**Objective:** Add extension status to TypeScript interfaces

**Files Modified:**
- `backend/src/shared/types/proxy-status.ts`
- `frontend-v2/src/types/proxy.ts`

**Changes:**

1. **backend/src/shared/types/proxy-status.ts**
   ```typescript
   export interface ProxyStatus {
     // Existing fields
     providerRouter?: {
       running: boolean;
       port?: number;
       uptime?: number;
     };
     credentials?: {
       valid: boolean;
       expiresAt?: number;
     };

     // NEW: Extension connection status
     extensionConnected?: boolean;
   }
   ```

2. **frontend-v2/src/types/proxy.ts**
   - Mirror the backend type definition
   - Ensure type compatibility between frontend and backend

**Integration Points:**
- Used by WebSocket broadcast in Phase 1
- Used by frontend hooks in Phase 4
- Compatible with existing `wsProxyStatus` structure

**Validation:**
- TypeScript compilation succeeds
- No type errors in websocket.ts
- No type errors in useProxyStore.ts

---

### Phase 3: Extension WebSocket Client

**Objective:** Add WebSocket connection from extension to backend

**Files Modified:**
- `extension/background.js`

**Changes:**

Add WebSocket client logic to background.js:

```javascript
// WebSocket connection to backend
let ws = null;
let reconnectTimeout = null;
const WS_URL = 'ws://localhost:3002';

/**
 * Connect to backend WebSocket server
 */
function connectWebSocket() {
  console.log('[Background] Connecting to WebSocket:', WS_URL);

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[Background] WebSocket connected');
    // Identify as extension client
    ws.send(JSON.stringify({ type: 'EXTENSION_CONNECT' }));
  };

  ws.onclose = () => {
    console.log('[Background] WebSocket disconnected');
    ws = null;

    // Attempt reconnect after 5 seconds
    reconnectTimeout = setTimeout(() => {
      connectWebSocket();
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('[Background] WebSocket error:', error);
  };
}

// Connect on background script load
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
- Connects to backend WebSocket server from Phase 1
- Coexists with existing credential extraction logic
- Uses existing `chrome.runtime.onMessage` handlers

**Validation:**
- Extension connects when enabled
- Backend logs "Extension connected"
- Extension disconnects when disabled
- Backend logs "Extension disconnected"
- Reconnects after backend restart

---

### Phase 4: Frontend Hook Updates

**Objective:** Remove polling, use WebSocket status

**Files Modified:**
- `frontend-v2/src/hooks/useExtensionDetection.ts`

**Changes:**

Replace polling logic with WebSocket subscription:

```typescript
import { useProxyStore } from '@/stores/useProxyStore';
import { isElectron } from '@/utils/platform';

/**
 * Hook to get Chrome extension installation status
 *
 * Now uses WebSocket-based detection instead of polling.
 * Extension status is received via wsProxyStatus.extensionConnected.
 */
export function useExtensionDetection() {
  const needsExtension = !isElectron();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);

  // Get extension status from WebSocket broadcast
  const extensionDetected = wsProxyStatus?.extensionConnected ?? false;

  return {
    needsExtension,
    extensionDetected,
  };
}
```

**Integration Points:**
- Uses `useProxyStore` (existing Zustand store)
- Used by `HomePage.tsx` (existing component)
- Used by `BrowserGuidePage.tsx` (existing component)

**Validation:**
- No polling console logs
- Badge updates when extension enabled/disabled
- Updates happen immediately (< 1 second)
- TypeScript compilation succeeds

---

### Phase 5: UI Component Cleanup

**Objective:** Verify UI components work correctly with new hook

**Files Modified:**
- None (verification only)

**Components to Verify:**
- `frontend-v2/src/pages/HomePage.tsx` - Extension status badge
- `frontend-v2/src/pages/BrowserGuidePage.tsx` - Extension status card

**Changes:**
- No code changes needed
- Components already consume `extensionDetected` from hook
- Should work automatically with Phase 4 changes

**Integration Points:**
- Uses `useExtensionDetection` hook from Phase 4
- Uses `Badge` and `StatusIndicator` components (unchanged)

**Validation:**
- HomePage shows correct extension status
- BrowserGuidePage shows correct extension status
- Badges update in real-time when extension toggled
- No console errors

---

### Phase 6: Testing & Validation

**Objective:** End-to-end testing of WebSocket-based extension detection

**Test Cases:**

1. **Extension Enable Flow**
   - Start backend server
   - Start frontend dev server
   - Load extension in Chrome
   - Verify backend logs "Extension connected"
   - Verify frontend badges show "Detected"
   - Check browser console for no polling logs

2. **Extension Disable Flow**
   - Disable extension in Chrome
   - Verify backend logs "Extension disconnected"
   - Verify frontend badges show "Not Detected"
   - Re-enable extension
   - Verify status updates correctly

3. **Backend Restart Flow**
   - Extension enabled, frontend open
   - Restart backend server
   - Verify extension reconnects automatically
   - Verify frontend receives updated status

4. **Multiple Frontend Clients**
   - Open frontend in two browser tabs
   - Enable/disable extension
   - Verify both tabs update simultaneously

5. **Edge Cases**
   - Backend offline when extension loads → should retry connection
   - Extension reload → should disconnect and reconnect
   - Page refresh → status should be correct on mount

**Performance Validation:**
- No `setInterval` polling in browser console
- WebSocket messages only on status changes
- CPU usage lower than polling implementation
- Network tab shows only event-driven messages

**Integration Validation:**
- Credential extraction still works
- Login flow still works
- All existing features unaffected

---

## Integration Points

### Backend Integration Points

**Files Used (Not Modified):**
- `backend/src/api-server/routes/credentials.ts` - Credential handling
- `backend/src/provider-router/router.ts` - Proxy status
- `backend/package.json` - WebSocket dependencies (ws, socket.io)

**Dependencies:**
- WebSocket server already running
- Port 3002 already exposed
- CORS already configured for localhost

### Frontend Integration Points

**Files Used (Not Modified):**
- `frontend-v2/src/stores/useProxyStore.ts` - WebSocket client, receives status
- `frontend-v2/src/pages/HomePage.tsx` - Displays extension status badge
- `frontend-v2/src/pages/BrowserGuidePage.tsx` - Displays extension status card
- `frontend-v2/src/components/ui/badge.tsx` - Badge component
- `frontend-v2/src/components/ui/status-indicator.tsx` - Status indicator

**Dependencies:**
- WebSocket connection already established via useProxyStore
- UI components already display extension status
- No new dependencies needed

### Extension Integration Points

**Files Used (Not Modified):**
- `extension/manifest.json` - Permissions, host_permissions for localhost:3002
- `extension/content.js` - Qwen login detection
- `extension/dashboard-bridge.js` - Dashboard communication (can be deprecated later)

**Dependencies:**
- Extension already has `host_permissions` for `http://localhost:3002/*`
- WebSocket API available in background service worker (Chrome MV3)

---

## Validation Criteria

### Functional Requirements

✅ Extension connection detected when enabled
✅ Extension disconnection detected when disabled
✅ Frontend badges update in real-time (< 1 second delay)
✅ No client-side polling (no setInterval)
✅ Multiple frontend tabs receive updates simultaneously
✅ Extension auto-reconnects after backend restart
✅ Existing credential extraction flow unaffected
✅ Works in both Chrome and Electron (Electron shows needsExtension=false)

### Non-Functional Requirements

✅ No performance degradation
✅ No increase in network traffic (should decrease due to no polling)
✅ No console spam from polling logs
✅ TypeScript type safety maintained
✅ Code follows DRY principle (reuses existing WebSocket infrastructure)
✅ Code follows SRP (WebSocket server handles all status, extension only connects)
✅ Domain-driven design maintained (status broadcasting is server responsibility)

### Architectural Compliance

✅ Single source of truth for system status (backend)
✅ Event-driven architecture (no polling)
✅ Consistent with existing proxy/credentials status pattern
✅ WebSocket used for all real-time updates
✅ Separation of concerns maintained

---

## Migration Notes

### Deprecated Code

After Phase 6 completion, the following can be deprecated:

1. **frontend-v2/src/utils/extensionDetection.ts**
   - `checkExtensionInstalled()` function no longer needed
   - `waitForExtension()` function no longer needed
   - File can be deleted if no other code depends on it

2. **chrome.runtime.sendMessage() usage**
   - Extension no longer needs `externally_connectable` in manifest.json
   - Can be kept for backwards compatibility or removed

3. **Polling logic**
   - All `setInterval` calls for extension detection removed
   - Console logs from polling removed

### Backwards Compatibility

- Extension ID still hardcoded in `extensionDetection.ts` (if file kept)
- Existing login flow unchanged
- No breaking changes to public APIs
- Frontend UI components unchanged

---

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Extension Health Heartbeat**
   - Extension sends periodic heartbeat to backend
   - Backend can detect "connected but frozen" state

2. **Extension Version Reporting**
   - Extension reports version on connect
   - Backend validates minimum version

3. **Multiple Extension Support**
   - Support multiple extension connections (different browsers/profiles)
   - Track which extension instance extracted credentials

4. **WebSocket Authentication**
   - Add token-based auth for extension WebSocket
   - Prevent unauthorized WebSocket connections

---

## Summary

This implementation plan replaces client-side polling with a clean, event-driven WebSocket architecture for extension detection. The solution:

- Aligns with existing WebSocket-based status updates
- Reduces unnecessary network traffic and CPU usage
- Provides immediate status updates (< 1 second)
- Maintains single source of truth in backend
- Requires minimal code changes (6 files modified, 0 files created)
- No breaking changes to existing functionality

The phased approach ensures each component can be developed and tested independently, with clear integration points and validation criteria at each step.
