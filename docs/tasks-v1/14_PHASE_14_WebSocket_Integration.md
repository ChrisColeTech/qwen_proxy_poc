**Goal:** Implement WebSocket service for real-time updates of proxy status, credentials, providers, and models.

## Files to Create:
- `frontend/src/services/websocket.service.ts` (WebSocket service with Socket.io)
- `frontend/src/hooks/useWebSocket.ts` (WebSocket connection hook)
- `frontend/src/types/proxy.types.ts` (WebSocket event type definitions)

## Files to Modify:
- `frontend/src/types/index.ts` (export new types)
- `frontend/src/stores/useProxyStore.ts` (add WebSocket event handlers)
- `frontend/src/App.tsx` (initialize WebSocket connection)

## Integration Points:
- Socket.io-client for WebSocket connections
- Zustand stores for state management (useProxyStore)
- Existing API services for fallback REST calls
- WebSocket server running on backend port 3002

## Tasks:

1. **Install Socket.io Client**
   ```bash
   cd frontend
   npm install socket.io-client
   cd ..
   ```

2. **Create WebSocket event types**
   ```bash
   mkdir -p frontend/src/types
   ```

   Create `frontend/src/types/proxy.types.ts`:
   ```typescript
   // WebSocket event types for real-time updates

   export interface ProxyStatusEvent {
     status: {
       providerRouter?: {
         running: boolean;
         port?: number;
         uptime?: number;
       };
       qwenProxy?: {
         running: boolean;
         port?: number;
         uptime?: number;
       };
       credentials?: {
         valid: boolean;
         expiresAt?: number; // Unix timestamp in seconds
       };
       providers?: {
         items: any[];
         total: number;
         enabled: number;
       };
       models?: {
         items: any[];
         total: number;
       };
       extensionConnected?: boolean; // Chrome extension status (browser mode only)
     };
   }

   export interface CredentialsUpdatedEvent {
     credentials: {
       valid: boolean;
       expiresAt?: number;
     };
   }

   export interface ProvidersUpdatedEvent {
     providers: any[];
   }

   export interface ModelsUpdatedEvent {
     models: any[];
   }

   export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
   ```

   Update `frontend/src/types/index.ts`:
   ```typescript
   // Export WebSocket types
   export type {
     ProxyStatusEvent,
     CredentialsUpdatedEvent,
     ProvidersUpdatedEvent,
     ModelsUpdatedEvent,
     WebSocketConnectionStatus,
   } from './proxy.types';

   // Existing exports...
   ```

3. **Create WebSocket service**
   ```bash
   mkdir -p frontend/src/services
   ```

   Create `frontend/src/services/websocket.service.ts`:
   - Location: `frontend/src/services/websocket.service.ts`
   - Implements singleton WebSocket service using Socket.io
   - Features:
     - Connection management (connect, disconnect, reconnect)
     - Event listeners for:
       - `proxy:status` - Full proxy status updates
       - `credentials:updated` - Credential updates
       - `providers:updated` - Provider list updates
       - `models:updated` - Model list updates
     - Connection status tracking
     - Reconnection logic with exponential backoff (max 10 attempts)
     - Type-safe event callbacks
     - Detailed console logging for debugging
   - Configuration:
     - Default URL: `http://localhost:3002`
     - Transports: websocket, polling (fallback)
     - Auto-reconnect enabled
     - Reconnection delay: 1-5 seconds
   - Exports singleton instance for app-wide use

4. **Create useWebSocket hook**
   Create `frontend/src/hooks/useWebSocket.ts`:
   - Location: `frontend/src/hooks/useWebSocket.ts`
   - Purpose: React hook to initialize WebSocket connection at app level
   - Implementation:
     - Initializes WebSocket connection on mount
     - Connects callbacks to store update methods from useProxyStore
     - Manages connection status state
     - Handles reconnection attempts tracking
     - Auto-connects by default (no manual connection needed)
     - Cleanup on unmount (disconnects WebSocket)
     - Returns: `connectionStatus`, `isConnected`, `reconnectAttempts`
   - Used by App.tsx to establish WebSocket at application startup
   - Wires up all event handlers to proxy store updates

5. **Update useProxyStore with WebSocket handlers**
   Modify `frontend/src/stores/useProxyStore.ts`:
   - Add WebSocket event handler methods:
     - `updateFromProxyStatus(event: ProxyStatusEvent)` - Handles proxy:status events
     - `updateFromCredentials(event: CredentialsUpdatedEvent)` - Handles credentials:updated events
     - `updateFromProviders(event: ProvidersUpdatedEvent)` - Handles providers:updated events
     - `updateFromModels(event: ModelsUpdatedEvent)` - Handles models:updated events
   - Add `setConnected(connected: boolean)` action for WebSocket connection state
   - Add `wsProxyStatus` state field for WebSocket-sourced data
   - Handlers should:
     - Update relevant store state
     - Preserve existing data where appropriate
     - Trigger UI re-renders via Zustand
     - Handle missing/null data gracefully

6. **Update App.tsx to initialize WebSocket**
   - Import and call `useWebSocket()` at top of App component
   - Hook automatically manages connection lifecycle
   - No provider wrapper needed (Zustand is provider-less)
   - Example:
   ```typescript
   import { useWebSocket } from '@/hooks/useWebSocket';

   function App() {
     useDarkMode(); // Existing hook
     useWebSocket(); // Initialize WebSocket connection

     // ... rest of app
   }
   ```

7. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   - Should compile without errors
   - All types should be properly inferred

## Testing:

1. **Start backend server** (should be running WebSocket server on port 3002)
2. **Start frontend dev server**
3. **Open browser console** and verify:
   - `[WebSocket] Connecting to: http://localhost:3002`
   - `[WebSocket] Connected`
4. **Monitor WebSocket events**:
   - Start/stop proxy → should see `proxy:status` events
   - Update credentials → should see `credentials:updated` events
5. **Test reconnection**:
   - Stop backend server
   - Should see `[WebSocket] Connection error`
   - Start backend server
   - Should see `[WebSocket] Reconnected after N attempts`

## Validation Checklist:

- [ ] Socket.io-client installed
- [ ] WebSocket service created with singleton pattern
- [ ] All event types defined in proxy.types.ts
- [ ] useWebSocket hook created and wires up all callbacks
- [ ] useProxyStore has all WebSocket event handlers
- [ ] App.tsx initializes WebSocket on startup
- [ ] WebSocket connects successfully to backend
- [ ] Proxy status updates received and displayed
- [ ] Reconnection works after backend restart
- [ ] No TypeScript errors
- [ ] No console errors

## Architecture Notes:

**Real-time Updates:**
- WebSocket provides instant updates when backend state changes
- No polling needed - event-driven architecture
- Multiple frontend clients can connect simultaneously
- All clients receive synchronized updates

**Event Types:**
- `proxy:status` - Full status snapshot (credentials, proxy running state, providers, models)
- `credentials:updated` - Fired when Qwen credentials change
- `providers:updated` - Fired when provider list changes
- `models:updated` - Fired when model list changes

**Connection Management:**
- Auto-reconnect on disconnect
- Exponential backoff prevents server overload
- Connection status tracked and exposed to UI
- Fallback to REST API if WebSocket unavailable

**Integration with Existing Code:**
- Works alongside existing REST API calls
- WebSocket updates supplement REST data
- Stores manage both WebSocket and REST data sources
- No breaking changes to existing components

## Structure After Phase 14:

```
frontend/src/
├── types/
│   ├── proxy.types.ts (new - WebSocket events)
│   └── index.ts (modified - export new types)
├── services/
│   └── websocket.service.ts (new)
├── hooks/
│   ├── useDarkMode.ts (existing)
│   └── useWebSocket.ts (new)
├── stores/
│   ├── useUIStore.ts (existing)
│   ├── useCredentialsStore.ts (existing)
│   ├── useProxyStore.ts (modified - add WebSocket handlers)
│   └── useAlertStore.ts (existing)
└── App.tsx (modified - add useWebSocket call)
```

## Next Phase:

After WebSocket integration is complete, Phase 15 will add lifecycle management for displaying server state transitions (starting, running, stopping, stopped, error states).
