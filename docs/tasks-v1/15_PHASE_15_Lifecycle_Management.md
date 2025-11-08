**Goal:** Implement lifecycle management system for real-time server state transitions with concise V1-style status messages.

**Prerequisites:** Phase 14 (WebSocket Integration) must be completed first.

## Files to Create:
- `frontend/src/stores/useLifecycleStore.ts` (server lifecycle state management)
- `frontend/src/types/lifecycle.types.ts` (lifecycle event type definitions)

## Files to Modify:
- `frontend/src/types/index.ts` (export lifecycle types)
- `frontend/src/services/websocket.service.ts` (add lifecycle:update event listener)
- `frontend/src/hooks/useWebSocket.ts` (wire up lifecycle event handler)
- `frontend/src/stores/useProxyStore.ts` (add updateFromLifecycle handler)
- `frontend/src/components/layout/StatusBar.tsx` (display lifecycle messages)

## Integration Points:
- WebSocket service from Phase 14 (receives lifecycle:update events)
- useProxyStore for coordinating lifecycle and proxy status
- StatusBar component for displaying lifecycle messages
- Backend lifecycle controller (emits lifecycle:update events)

## Tasks:

1. **Create lifecycle event types**
   ```bash
   mkdir -p frontend/src/types
   ```

   Create `frontend/src/types/lifecycle.types.ts`:
   ```typescript
   // Lifecycle event types per 67-LIFECYCLE_MANAGEMENT_IMPLEMENTATION_PLAN.md

   export interface LifecycleUpdateEvent {
     providerRouter?: {
       state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
       port: number | null;
       running: boolean;
       error?: string | null;
     };
     qwenProxy?: {
       state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
       port: number | null;
       running: boolean;
       error?: string | null;
     };
     timestamp: number;
   }

   export type LifecycleState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
   ```

   Update `frontend/src/types/index.ts`:
   ```typescript
   // Export lifecycle types
   export type {
     LifecycleUpdateEvent,
     LifecycleState,
   } from './lifecycle.types';

   // Existing exports...
   ```

2. **Create useLifecycleStore**
   Create `frontend/src/stores/useLifecycleStore.ts`:
   - Location: `frontend/src/stores/useLifecycleStore.ts`
   - Purpose: Track server lifecycle state and format user-facing messages
   - State:
     - `state: LifecycleState` - Current lifecycle state
     - `message: string` - User-facing status message (V1-style)
     - `error: string | null` - Error message if state is 'error'
   - Actions:
     - `setState(state, message)` - Set state and message
     - `setError(error)` - Set error state
     - `clearError()` - Clear error state
   - NO persistence - lifecycle state is runtime only
   - Used by StatusBar to display concise status messages
   - Messages should be V1-style:
     - Starting: "Starting :3001"
     - Running: "Running :3001"
     - Stopping: "Stopping"
     - Stopped: "Stopped"
     - Error: Show actual error message

3. **Update WebSocket service**
   Modify `frontend/src/services/websocket.service.ts`:
   - Add `LifecycleUpdateEvent` to imports from types
   - Add `onLifecycleUpdate` callback to `WebSocketCallbacks` interface
   - In `setupEventListeners()`, add listener:
   ```typescript
   this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
     console.log('[WebSocket] lifecycle:update', data);
     this.callbacks.onLifecycleUpdate?.(data);
   });
   ```

4. **Update useWebSocket hook**
   Modify `frontend/src/hooks/useWebSocket.ts`:
   - Import `LifecycleUpdateEvent` type
   - Get `updateFromLifecycle` method from useProxyStore
   - Add lifecycle handler to WebSocket callbacks:
   ```typescript
   const {
     setConnected,
     updateFromProxyStatus,
     updateFromCredentials,
     updateFromProviders,
     updateFromModels,
     updateFromLifecycle, // Add this
   } = useProxyStore();

   websocketService.connect(url, {
     // ... existing handlers ...
     onLifecycleUpdate: (event) => {
       updateFromLifecycle(event);
     },
   });
   ```

5. **Add lifecycle handler to useProxyStore**
   Modify `frontend/src/stores/useProxyStore.ts`:
   - Import `useLifecycleStore` and `LifecycleUpdateEvent`
   - Add `updateFromLifecycle` action:
   ```typescript
   updateFromLifecycle: (event: LifecycleUpdateEvent) => {
     const { setState } = useLifecycleStore.getState();

     // Handle provider router lifecycle (primary process)
     if (event.providerRouter) {
       const { state, port, error } = event.providerRouter;

       // Format V1-style message
       let message = '';
       if (error) {
         message = error;
       } else {
         switch (state) {
           case 'starting':
             message = port ? `Starting :${port}` : 'Starting...';
             break;
           case 'running':
             message = port ? `Running :${port}` : 'Running';
             break;
           case 'stopping':
             message = 'Stopping';
             break;
           case 'stopped':
             message = 'Stopped';
             break;
           default:
             message = '';
         }
       }

       setState(state, message);
     }

     // Can handle qwen proxy separately if needed
   },
   ```

   - Modify `updateFromProxyStatus` to not override lifecycle during transitions:
   ```typescript
   updateFromProxyStatus: (event) => {
     // ... existing logic ...

     // Only update lifecycle if NOT in a transitional state
     const currentLifecycleState = useLifecycleStore.getState().state;
     const isTransitioning = currentLifecycleState === 'starting' || currentLifecycleState === 'stopping';

     if (!isTransitioning && event.status.providerRouter) {
       const { setState } = useLifecycleStore.getState();
       const isRunning = event.status.providerRouter.running;
       const port = event.status.providerRouter.port;
       const newState = isRunning ? 'running' : 'stopped';
       const message = isRunning
         ? (port ? `Running :${port}` : 'Running')
         : 'Stopped';
       setState(newState, message);
     }
   },
   ```

6. **Update StatusBar component**
   Modify `frontend/src/components/layout/StatusBar.tsx`:
   - Import `useLifecycleStore` and `Loader2` icon from lucide-react
   - Read lifecycle state and message:
   ```typescript
   const lifecycleState = useLifecycleStore((state) => state.state);
   const lifecycleMessage = useLifecycleStore((state) => state.message);
   const lifecycleError = useLifecycleStore((state) => state.error);
   ```

   - Determine if in transitional state:
   ```typescript
   const isTransitioning = lifecycleState === 'starting' || lifecycleState === 'stopping';
   ```

   - Display lifecycle message with spinning icon during transitions:
   ```typescript
   <div className="statusbar-right">
     {lifecycleMessage && (
       <div className="flex items-center gap-1 text-xs">
         {isTransitioning && <Loader2 className="h-3 w-3 animate-spin" />}
         <span className={lifecycleError ? 'text-destructive' : ''}>
           {lifecycleMessage}
         </span>
       </div>
     )}
   </div>
   ```

   - Show error state with red text color
   - Show spinning icon during starting/stopping states
   - Show simple text for running/stopped/error states

7. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   - Should compile without errors
   - All types should be properly inferred

## Testing:

1. **Start backend server** (must have lifecycle controller implemented)
2. **Start frontend dev server**
3. **Test lifecycle flow**:
   - Click "Start Proxy" button
   - Should immediately see "Starting :3001" with spinning icon
   - After ~2-3 seconds, should see "Running :3001" (no spinning icon)
   - Click "Stop Proxy" button
   - Should immediately see "Stopping" with spinning icon
   - After ~1-2 seconds, should see "Stopped" (no spinning icon)
4. **Test error scenarios**:
   - If server fails to start, should see error message
   - If startup timeout occurs, should see "Startup timeout (30s)"
5. **Test reconnection**:
   - Refresh page while proxy is running
   - Should show correct state on reconnect ("Running :3001")

## Validation Checklist:

- [ ] Lifecycle types created in lifecycle.types.ts
- [ ] useLifecycleStore created with state/message/error
- [ ] WebSocket service listens for lifecycle:update events
- [ ] useWebSocket hook wires up lifecycle handler
- [ ] useProxyStore has updateFromLifecycle method
- [ ] StatusBar displays lifecycle messages
- [ ] Spinning icon shows during transitions
- [ ] V1-style messages displayed ("Running :3001", etc.)
- [ ] Error messages displayed correctly
- [ ] Transitional states not overridden by proxy:status
- [ ] No TypeScript errors
- [ ] No console errors

## Architecture Notes:

**Lifecycle States:**
- **Transitional States** (temporary):
  - `starting` - Server is starting up, waiting for ready signal
  - `stopping` - Server is shutting down
- **Final States** (stable):
  - `running` - Server is running and ready
  - `stopped` - Server is not running
  - `error` - Server encountered an error
- **Idle State**:
  - `idle` - Initial state before any lifecycle events

**Event Flow:**
1. User clicks "Start Proxy"
2. Backend spawns process, emits `lifecycle:update {state: 'starting', port: 3001}`
3. Frontend receives event, updates useLifecycleStore
4. StatusBar shows "Starting :3001" with spinning icon
5. Backend detects server ready, emits `lifecycle:update {state: 'running', port: 3001}`
6. Frontend receives event, updates useLifecycleStore
7. StatusBar shows "Running :3001" (no spinning icon)

**Message Formatting:**
- V1-style concise messages (no verbose backend logs)
- Port number included when available (":3001")
- Spinning icon for visual feedback during transitions
- Error messages displayed in red
- Clear, user-friendly language

**Separation of Concerns:**
- Backend monitors actual process state (PID, stdout, exit codes)
- Backend emits lifecycle events via WebSocket
- Frontend receives events and updates UI
- Frontend formats messages for user consumption
- No business logic in UI components

**Integration with Proxy Status:**
- `lifecycle:update` events provide transitional state updates
- `proxy:status` events provide full status snapshots
- Lifecycle events take precedence during transitions
- Status events update lifecycle when stable (running/stopped)
- Both events coexist without conflict

## Structure After Phase 15:

```
frontend/src/
├── types/
│   ├── proxy.types.ts (existing)
│   ├── lifecycle.types.ts (new)
│   └── index.ts (modified - export lifecycle types)
├── services/
│   └── websocket.service.ts (modified - lifecycle:update listener)
├── hooks/
│   └── useWebSocket.ts (modified - lifecycle handler)
├── stores/
│   ├── useProxyStore.ts (modified - updateFromLifecycle)
│   └── useLifecycleStore.ts (new)
└── components/
    └── layout/
        └── StatusBar.tsx (modified - show lifecycle messages)
```

## Next Phase:

After lifecycle management is complete, Phase 16 will add WebSocket-based extension detection to replace client-side polling.
