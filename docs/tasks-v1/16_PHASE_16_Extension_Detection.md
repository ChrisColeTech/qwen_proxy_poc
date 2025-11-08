**Goal:** Replace client-side polling with WebSocket-based Chrome extension detection for real-time status updates.

**Prerequisites:** Phase 14 (WebSocket Integration) must be completed first.

## Files to Create:
- `frontend/src/hooks/useExtensionDetection.ts` (WebSocket-based extension detection hook)
- `frontend/src/utils/platform.ts` (platform detection utilities)

## Files to Modify:
- `frontend/src/types/proxy.types.ts` (add extensionConnected to ProxyStatusEvent)
- `extension/background.js` (add WebSocket client connection)

## Integration Points:
- WebSocket service from Phase 14 (receives extension status via proxy:status events)
- useProxyStore for wsProxyStatus data
- Chrome extension background service worker
- Backend WebSocket server (tracks extension connections)

## Tasks:

1. **Update proxy status types**
   Modify `frontend/src/types/proxy.types.ts`:
   - Add `extensionConnected` field to ProxyStatusEvent:
   ```typescript
   export interface ProxyStatusEvent {
     status: {
       // ... existing fields ...
       extensionConnected?: boolean; // Chrome extension connection status
     };
   }
   ```

2. **Create platform utilities**
   ```bash
   mkdir -p frontend/src/utils
   ```

   Create `frontend/src/utils/platform.ts`:
   ```typescript
   /**
    * Platform detection utilities
    */

   /**
    * Detect if running in Electron desktop app
    */
   export function isElectron(): boolean {
     return typeof window !== 'undefined' && window.electronAPI !== undefined;
   }

   /**
    * Detect if running in browser mode
    */
   export function isBrowser(): boolean {
     return !isElectron();
   }
   ```

3. **Create useExtensionDetection hook**
   Create `frontend/src/hooks/useExtensionDetection.ts`:
   ```typescript
   import { useProxyStore } from '@/stores/useProxyStore';
   import { isElectron } from '@/utils/platform';

   /**
    * Hook to get Chrome extension installation status
    *
    * Uses WebSocket-based detection instead of polling.
    * Extension status is received via wsProxyStatus.extensionConnected.
    *
    * NO polling - completely event-driven via WebSocket.
    */
   export function useExtensionDetection() {
     const needsExtension = !isElectron();
     const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);

     // Get extension status from WebSocket broadcast
     const extensionDetected = wsProxyStatus?.extensionConnected ?? false;

     return {
       needsExtension,    // true if running in browser mode
       extensionDetected, // true if extension is connected to backend
     };
   }
   ```

4. **Update Chrome extension with WebSocket client**
   Modify `extension/background.js`:
   - Add WebSocket connection logic to connect to backend
   - Send EXTENSION_CONNECT message to identify as extension
   - Auto-reconnect on disconnect
   - Cleanup on unload

   Add to `extension/background.js`:
   ```javascript
   // ============================================================================
   // WebSocket Connection to Backend
   // ============================================================================

   let ws = null;
   let reconnectTimeout = null;
   const WS_URL = 'ws://localhost:3002';

   /**
    * Connect to backend WebSocket server
    * Backend uses this connection to track extension presence
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

   Note: This code should be added alongside existing credential extraction logic, not replacing it.

5. **Verify backend WebSocket server**
   - Backend should already track extension connections (backend Phase 1 of Doc 68)
   - Backend should include `extensionConnected` in proxy:status broadcasts
   - Backend should handle EXTENSION_CONNECT message type
   - Backend should detect extension disconnect events

6. **Update UI components (verification only)**
   - Components already use `useExtensionDetection` hook
   - No code changes needed in:
     - `frontend/src/pages/HomePage.tsx` - Extension status badge
     - `frontend/src/pages/BrowserGuidePage.tsx` - Extension status card
     - `frontend/src/components/layout/StatusBar.tsx` - Extension badge
   - Components will automatically update when extension status changes

7. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   - Should compile without errors
   - All types should be properly inferred

## Testing:

### Extension Connection Flow
1. **Start backend server** (must have extension tracking implemented)
2. **Start frontend dev server**
3. **Load Chrome extension**:
   - Open `chrome://extensions`
   - Enable developer mode
   - Load unpacked extension
4. **Verify connection**:
   - Backend console should log: `[WebSocket] Extension connected`
   - Frontend should show: Extension badge as "Detected"
   - No polling console logs (no setInterval)

### Extension Disconnection Flow
1. **Disable extension** in Chrome
2. **Verify disconnection**:
   - Backend console should log: `[WebSocket] Extension disconnected`
   - Frontend should show: Extension badge as "Not Detected"
3. **Re-enable extension**
4. **Verify reconnection**:
   - Extension badge should update to "Detected" immediately

### Backend Restart Flow
1. **Extension enabled, frontend open**
2. **Restart backend server**
3. **Verify auto-reconnect**:
   - Extension should automatically reconnect within 5 seconds
   - Frontend should receive updated status
   - Extension badge should remain accurate

### Multiple Frontend Clients
1. **Open frontend in two browser tabs**
2. **Enable/disable extension**
3. **Verify both tabs update**:
   - Both tabs should show identical extension status
   - Updates should happen simultaneously (< 1 second)

## Validation Checklist:

- [ ] extensionConnected field added to ProxyStatusEvent type
- [ ] Platform utilities created (isElectron, isBrowser)
- [ ] useExtensionDetection hook created (no polling)
- [ ] Chrome extension connects via WebSocket
- [ ] Extension sends EXTENSION_CONNECT message
- [ ] Extension auto-reconnects after disconnect
- [ ] Frontend receives extension status via wsProxyStatus
- [ ] UI components update in real-time
- [ ] NO polling console logs
- [ ] NO setInterval for extension detection
- [ ] TypeScript compilation succeeds
- [ ] No console errors
- [ ] All test scenarios pass

## Architecture Notes:

**Current Architecture (Polling-Based) - DEPRECATED:**
- Frontend polls extension every 3 seconds using `chrome.runtime.sendMessage()`
- Creates unnecessary load and console spam
- Not aligned with event-driven WebSocket architecture
- Violates single source of truth principle

**New Architecture (WebSocket-Based):**
- Extension establishes WebSocket connection to backend when enabled
- Backend tracks extension connection state
- Backend broadcasts extension status to all connected frontends
- Frontend receives status from `wsProxyStatus` (no polling needed)

**Key Benefits:**
- **Consistent Architecture**: Uses same WebSocket mechanism as proxy/credentials status
- **Event-Driven**: Immediate updates when extension is enabled/disabled
- **Reduced Load**: No continuous polling, only event-based updates
- **Single Source of Truth**: Backend tracks all system state
- **Scalable**: Works with multiple frontend clients simultaneously

**Component Interactions:**
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

**Platform Awareness:**
- Extension detection only relevant in browser mode
- Electron mode shows `needsExtension = false`
- Desktop app uses built-in credential extraction (no extension needed)
- Platform detection via `isElectron()` utility

**Integration with Existing Code:**
- WebSocket service already receives proxy:status events
- useProxyStore already has wsProxyStatus state
- UI components already use useExtensionDetection hook
- Only the hook implementation changes (polling → WebSocket)
- Existing credential extraction logic in extension unchanged

## Deprecated Code:

After Phase 16 completion, the following can be removed:

1. **Polling logic in useExtensionDetection**:
   - All `setInterval` calls for extension detection
   - `chrome.runtime.sendMessage()` PING messages
   - Console logs from polling

2. **Optional cleanup** (if not used elsewhere):
   - `frontend/src/utils/extensionDetection.ts` (if it exists)
   - `checkExtensionInstalled()` function
   - `waitForExtension()` function

Note: Keep existing credential extraction logic in extension - only remove polling-related code.

## Structure After Phase 16:

```
frontend/src/
├── types/
│   └── proxy.types.ts (modified - add extensionConnected)
├── utils/
│   └── platform.ts (new)
├── hooks/
│   └── useExtensionDetection.ts (new - WebSocket-based)
└── stores/
    └── useProxyStore.ts (existing - receives wsProxyStatus)

extension/
└── background.js (modified - add WebSocket client)
```

## Summary:

This phase replaces client-side polling with a clean, event-driven WebSocket architecture for extension detection. The solution:

- Aligns with existing WebSocket-based status updates
- Reduces unnecessary network traffic and CPU usage
- Provides immediate status updates (< 1 second)
- Maintains single source of truth in backend
- Requires minimal code changes (4 files modified, 2 files created)
- No breaking changes to existing functionality
- Compatible with both browser and Electron modes
