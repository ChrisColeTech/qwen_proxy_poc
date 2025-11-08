# Lifecycle Management Implementation Plan

## Overview

This plan details the implementation of a comprehensive lifecycle management system that provides real-time feedback for proxy server state transitions. The system will use a backend lifecycle controller that monitors process states and emits WebSocket events, combined with frontend improvements for displaying concise, user-friendly status messages.

## Goals

1. Provide instant user feedback when starting/stopping proxy servers
2. Emit accurate lifecycle events from backend when state transitions occur
3. Display concise, V1-style status messages in the UI
4. Monitor child processes to confirm actual state (not just assume)
5. Handle timeout scenarios gracefully
6. Maintain separation of concerns between backend lifecycle tracking and frontend display

## Architecture

### Backend Responsibility
- Monitor child process lifecycle (spawn, stdout, exit)
- Emit WebSocket events at each lifecycle stage
- Track actual process state (not optimistic)
- Handle errors and timeouts

### Frontend Responsibility
- Display lifecycle messages from WebSocket events
- Format messages for user consumption
- Show transitional states during operations
- Handle timeout/error states in UI

## File and Folder Structure

```
qwen_proxy_poc/
├── backend/
│   └── api-server/
│       └── src/
│           ├── controllers/
│           │   ├── websocket-controller.js (modified)
│           │   └── lifecycle-controller.js (new)
│           ├── routes/
│           │   └── proxy-control.js (modified)
│           └── services/
│               └── event-emitter.js (integration point)
│
└── frontend-v2/
    └── src/
        ├── stores/
        │   ├── useProxyStore.ts (modified)
        │   └── useLifecycleStore.ts (modified)
        ├── services/
        │   └── websocket.service.ts (integration point)
        ├── components/
        │   └── layout/
        │       └── StatusBar.tsx (modified)
        └── types/
            └── index.ts (modified)
```

---

## Phase 1: Backend Lifecycle Controller Foundation

### Objective
Create a dedicated lifecycle controller that monitors proxy process lifecycle events and emits structured WebSocket updates.

### Files Created
- `/backend/api-server/src/controllers/lifecycle-controller.js`

### Files Modified
None

### Integration Points
- `/backend/api-server/src/services/event-emitter.js` - Will use to emit events
- `/backend/api-server/src/routes/proxy-control.js` - Will integrate in Phase 2

### Implementation Details

**lifecycle-controller.js**
```javascript
/**
 * Lifecycle Controller
 * Monitors proxy process lifecycle and emits WebSocket events
 */

import { eventEmitter } from '../services/event-emitter.js';
import { logger } from '../utils/logger.js';

const LIFECYCLE_TIMEOUT = 30000; // 30 seconds

class LifecycleController {
  constructor() {
    this.providerRouterMonitor = null;
    this.qwenProxyMonitor = null;
  }

  /**
   * Start monitoring a process lifecycle
   * @param {string} processName - 'providerRouter' or 'qwenProxy'
   * @param {ChildProcess} process - The spawned process
   * @param {number} port - The expected port
   * @param {Function} onReady - Callback when process is confirmed ready
   * @param {Function} onError - Callback on error or timeout
   */
  monitorStartup(processName, process, port, onReady, onError) {
    logger.info(`[Lifecycle] Monitoring ${processName} startup`);

    const monitor = {
      process,
      port,
      timeoutHandle: null,
      ready: false,
    };

    // Emit starting state immediately
    this.emitLifecycleEvent(processName, 'starting', port);

    // Listen to stdout for ready signals
    process.stdout.on('data', (data) => {
      const output = data.toString();

      // Look for server ready indicators
      if (output.includes('Server listening') || output.includes(`listening on port ${port}`)) {
        logger.info(`[Lifecycle] ${processName} confirmed ready`);
        monitor.ready = true;
        this.emitLifecycleEvent(processName, 'running', port);
        this.cleanup(processName);
        if (onReady) onReady();
      }
    });

    // Handle process errors
    process.on('error', (error) => {
      logger.error(`[Lifecycle] ${processName} error:`, error);
      this.emitLifecycleEvent(processName, 'error', port, error.message);
      this.cleanup(processName);
      if (onError) onError(error);
    });

    // Handle unexpected exit during startup
    process.on('exit', (code) => {
      if (!monitor.ready && code !== 0) {
        const error = `Process exited with code ${code} during startup`;
        logger.error(`[Lifecycle] ${processName} ${error}`);
        this.emitLifecycleEvent(processName, 'error', port, error);
        this.cleanup(processName);
        if (onError) onError(new Error(error));
      }
    });

    // Set timeout
    monitor.timeoutHandle = setTimeout(() => {
      if (!monitor.ready) {
        const error = 'Startup timeout (30s)';
        logger.error(`[Lifecycle] ${processName} ${error}`);
        this.emitLifecycleEvent(processName, 'error', port, error);
        this.cleanup(processName);
        if (onError) onError(new Error(error));
      }
    }, LIFECYCLE_TIMEOUT);

    // Store monitor
    if (processName === 'providerRouter') {
      this.providerRouterMonitor = monitor;
    } else {
      this.qwenProxyMonitor = monitor;
    }
  }

  /**
   * Monitor process shutdown
   * @param {string} processName - 'providerRouter' or 'qwenProxy'
   * @param {ChildProcess} process - The process to monitor
   * @param {Function} onStopped - Callback when confirmed stopped
   */
  monitorShutdown(processName, process, onStopped) {
    logger.info(`[Lifecycle] Monitoring ${processName} shutdown`);

    // Emit stopping state immediately
    this.emitLifecycleEvent(processName, 'stopping', null);

    // Listen for exit
    process.on('exit', (code) => {
      logger.info(`[Lifecycle] ${processName} stopped (exit code: ${code})`);
      this.emitLifecycleEvent(processName, 'stopped', null);
      if (onStopped) onStopped();
    });

    // Set timeout for forced kill
    setTimeout(() => {
      if (process && !process.killed) {
        logger.warn(`[Lifecycle] ${processName} shutdown timeout, forcing kill`);
        process.kill('SIGKILL');
      }
    }, 10000); // 10 second kill timeout
  }

  /**
   * Emit a lifecycle event via WebSocket
   */
  emitLifecycleEvent(processName, state, port, errorMessage = null) {
    const statusData = {
      [processName]: {
        state,
        port,
        running: state === 'running',
        error: errorMessage,
      },
      timestamp: Date.now(),
    };

    logger.info(`[Lifecycle] Emitting ${processName}:${state}`);
    eventEmitter.emitToClients('lifecycle:update', statusData);
  }

  /**
   * Cleanup monitor resources
   */
  cleanup(processName) {
    const monitor = processName === 'providerRouter'
      ? this.providerRouterMonitor
      : this.qwenProxyMonitor;

    if (monitor && monitor.timeoutHandle) {
      clearTimeout(monitor.timeoutHandle);
      monitor.timeoutHandle = null;
    }

    if (processName === 'providerRouter') {
      this.providerRouterMonitor = null;
    } else {
      this.qwenProxyMonitor = null;
    }
  }
}

// Export singleton instance
export const lifecycleController = new LifecycleController();
export default lifecycleController;
```

### Validation Criteria
- File created at correct location
- Exports singleton instance
- Has methods: monitorStartup, monitorShutdown, emitLifecycleEvent, cleanup
- No syntax errors, passes linting

---

## Phase 2: Backend Integration with Proxy Control

### Objective
Integrate lifecycle controller with proxy-control routes to monitor actual process lifecycle during start/stop operations.

### Files Created
None

### Files Modified
- `/backend/api-server/src/routes/proxy-control.js`

### Integration Points
- `/backend/api-server/src/controllers/lifecycle-controller.js` - Import and use
- `/backend/api-server/src/services/event-emitter.js` - Continue using for status

### Implementation Details

**Modifications to proxy-control.js:**

1. Import lifecycle controller at top:
```javascript
import { lifecycleController } from '../controllers/lifecycle-controller.js'
```

2. Modify start endpoint (around line 150-250) to use lifecycle monitoring:
```javascript
// After spawning provider router process:
lifecycleController.monitorStartup(
  'providerRouter',
  proxyProcess,
  config.proxy.providerRouterPort,
  () => {
    // Confirmed ready - update status with full data
    const fullStatus = getCurrentProxyStatus();
    eventEmitter.emitProxyStatus(fullStatus);
  },
  (error) => {
    // Startup failed - emit error status
    logger.error('[Proxy Control] Provider Router startup failed:', error);
    proxyProcess = null;
    proxyStartTime = null;
  }
);

// Same for qwen proxy
lifecycleController.monitorStartup(
  'qwenProxy',
  qwenProxyProcess,
  config.proxy.qwenProxyPort,
  () => {
    const fullStatus = getCurrentProxyStatus();
    eventEmitter.emitProxyStatus(fullStatus);
  },
  (error) => {
    logger.error('[Proxy Control] Qwen Proxy startup failed:', error);
    qwenProxyProcess = null;
    qwenProxyStartTime = null;
  }
);
```

3. Modify stop endpoint (around line 300-370) to use lifecycle monitoring:
```javascript
// When stopping provider router:
if (proxyProcess) {
  lifecycleController.monitorShutdown(
    'providerRouter',
    proxyProcess,
    () => {
      // Confirmed stopped - emit final status
      const fullStatus = getCurrentProxyStatus();
      eventEmitter.emitProxyStatus(fullStatus);
    }
  );
  proxyProcess.kill('SIGTERM');
}

// Same for qwen proxy
if (qwenProxyProcess) {
  lifecycleController.monitorShutdown(
    'qwenProxy',
    qwenProxyProcess,
    () => {
      const fullStatus = getCurrentProxyStatus();
      eventEmitter.emitProxyStatus(fullStatus);
    }
  );
  qwenProxyProcess.kill('SIGTERM');
}
```

### Validation Criteria
- Start endpoint integrates lifecycle monitoring
- Stop endpoint integrates lifecycle monitoring
- Lifecycle events emitted during transitions
- Error handling properly integrated
- No breaking changes to existing API responses

---

## Phase 3: Backend Event Emitter Enhancement

### Objective
Add new lifecycle event emission capability while maintaining backward compatibility with existing proxy:status events.

### Files Created
None

### Files Modified
- `/backend/api-server/src/services/event-emitter.js`

### Integration Points
- `/backend/api-server/src/controllers/lifecycle-controller.js` - Uses emitToClients
- `/backend/api-server/src/routes/proxy-control.js` - Continues using emitProxyStatus

### Implementation Details

**Modifications to event-emitter.js:**

Add new method for lifecycle events (keep existing methods unchanged):
```javascript
/**
 * Emit lifecycle update event
 * @param {object} lifecycleData - Lifecycle state data
 */
emitLifecycleUpdate(lifecycleData) {
  this.emitToClients('lifecycle:update', lifecycleData);
}
```

Update class to export both old and new methods:
```javascript
export class EventEmitterService extends EventEmitter {
  // ... existing methods ...

  emitLifecycleUpdate(lifecycleData) {
    this.emitToClients('lifecycle:update', lifecycleData);
  }
}
```

### Validation Criteria
- New emitLifecycleUpdate method added
- Existing methods unchanged
- Backward compatibility maintained
- No breaking changes

---

## Phase 4: Frontend WebSocket Event Handling

### Objective
Update frontend WebSocket service to handle new lifecycle:update events alongside existing proxy:status events.

### Files Created
None

### Files Modified
- `/frontend-v2/src/services/websocket.service.ts`
- `/frontend-v2/src/hooks/useWebSocket.ts`
- `/frontend-v2/src/types/index.ts`

### Integration Points
- `/frontend-v2/src/stores/useProxyStore.ts` - Will receive lifecycle events in Phase 5

### Implementation Details

**1. Update types/index.ts:**
```typescript
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
```

**2. Update websocket.service.ts:**
```typescript
interface WebSocketCallbacks {
  onProxyStatus?: EventCallback<ProxyStatusEvent>;
  onCredentialsUpdated?: EventCallback<CredentialsUpdatedEvent>;
  onProvidersUpdated?: EventCallback<ProvidersUpdatedEvent>;
  onModelsUpdated?: EventCallback<ModelsUpdatedEvent>;
  onLifecycleUpdate?: EventCallback<LifecycleUpdateEvent>; // New
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

// In setupEventListeners():
this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
  console.log('[WebSocket] lifecycle:update', data);
  this.callbacks.onLifecycleUpdate?.(data);
});
```

**3. Update useWebSocket.ts:**
```typescript
import type { LifecycleUpdateEvent } from '@/types';

// In hook:
const {
  setConnected,
  updateFromProxyStatus,
  updateFromCredentials,
  updateFromProviders,
  updateFromModels,
  updateFromLifecycle, // New
} = useProxyStore();

// In useEffect setup:
websocketService.connect(url, {
  onProxyStatus: (event) => {
    updateFromProxyStatus(event);
  },
  onLifecycleUpdate: (event) => {
    updateFromLifecycle(event); // New handler
  },
  // ... other handlers
});
```

### Validation Criteria
- New LifecycleUpdateEvent type defined
- WebSocket service handles lifecycle:update events
- useWebSocket hook wires up lifecycle handler
- Build passes with no type errors

---

## Phase 5: Frontend Lifecycle Store Enhancement

### Objective
Enhance lifecycle store to handle richer state transitions and improve message formatting to match V1 style.

### Files Created
None

### Files Modified
- `/frontend-v2/src/stores/useLifecycleStore.ts`
- `/frontend-v2/src/stores/useProxyStore.ts`

### Integration Points
- `/frontend-v2/src/services/websocket.service.ts` - Receives events from here
- `/frontend-v2/src/components/layout/StatusBar.tsx` - Displays lifecycle messages

### Implementation Details

**1. Update useLifecycleStore.ts:**
```typescript
import { create } from 'zustand';

export type LifecycleState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

interface LifecycleStore {
  state: LifecycleState;
  message: string;
  error: string | null;
  lastUpdate: number;

  setState: (state: LifecycleState, message: string) => void;
  setError: (error: string) => void;
  clearError: () => void;

  // Helper to format messages in V1 style
  formatMessage: (state: LifecycleState, port?: number | null, error?: string | null) => string;
}

export const useLifecycleStore = create<LifecycleStore>((set, get) => ({
  state: 'idle',
  message: '',
  error: null,
  lastUpdate: 0,

  setState: (state, message) => set({
    state,
    message,
    error: null,
    lastUpdate: Date.now()
  }),

  setError: (error) => set({
    state: 'error',
    error,
    lastUpdate: Date.now()
  }),

  clearError: () => set({ error: null }),

  formatMessage: (state, port = null, error = null) => {
    if (error) return error;

    switch (state) {
      case 'starting':
        return 'Starting...';
      case 'running':
        return port ? `Running :${port}` : 'Running';
      case 'stopping':
        return 'Stopping...';
      case 'stopped':
        return 'Stopped';
      case 'error':
        return error || 'Error';
      default:
        return '';
    }
  },
}));
```

**2. Add updateFromLifecycle to useProxyStore.ts:**
```typescript
import { useLifecycleStore } from './useLifecycleStore';
import type { LifecycleUpdateEvent } from '@/types';

interface ProxyStore {
  // ... existing properties ...
  updateFromLifecycle: (event: LifecycleUpdateEvent) => void;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  // ... existing properties and methods ...

  updateFromLifecycle: (event) => {
    // Update lifecycle store with formatted messages
    const { formatMessage, setState } = useLifecycleStore.getState();

    // Handle provider router lifecycle
    if (event.providerRouter) {
      const { state, port, error } = event.providerRouter;
      const message = formatMessage(state, port, error);
      setState(state, message);
    }

    // Handle qwen proxy lifecycle (if needed separately)
    if (event.qwenProxy) {
      const { state, port, error } = event.qwenProxy;
      // Could update a separate qwenProxy lifecycle store if needed
      // For now, we focus on provider router as primary
    }
  },
}));
```

**3. Update existing updateFromProxyStatus to not override lifecycle during transitions:**
```typescript
updateFromProxyStatus: (event) => set((state) => {
  // ... existing credentials logic ...

  const updatedStatus = {
    ...event.status,
    credentials,
  };

  // Only update lifecycle if NOT in a transitional state
  const currentLifecycleState = useLifecycleStore.getState().state;
  const isTransitioning = currentLifecycleState === 'starting' || currentLifecycleState === 'stopping';

  if (!isTransitioning && event.status.providerRouter) {
    const { formatMessage, setState } = useLifecycleStore.getState();
    const isRunning = event.status.providerRouter.running;
    const port = event.status.providerRouter.port;
    const newState = isRunning ? 'running' : 'stopped';
    const message = formatMessage(newState, port);
    setState(newState, message);
  }

  return {
    wsProxyStatus: updatedStatus,
    status: updatedStatus as any,
    lastUpdate: Date.now()
  };
}),
```

### Validation Criteria
- Lifecycle store has formatMessage helper
- Messages match V1 style ("Running :3001", "Stopped", etc.)
- updateFromLifecycle handler added to proxy store
- Transitional states don't get overridden by proxy:status events
- Build passes with no errors

---

## Phase 6: Frontend UI Polish

### Objective
Update StatusBar to show transitional state indicators (spinning icon) and ensure proper error display.

### Files Created
None

### Files Modified
- `/frontend-v2/src/components/layout/StatusBar.tsx`

### Integration Points
- `/frontend-v2/src/stores/useLifecycleStore.ts` - Reads state from here
- `/frontend-v2/src/stores/useProxyStore.ts` - Reads proxy running state

### Implementation Details

**Update StatusBar.tsx:**
```typescript
import { Loader2 } from 'lucide-react';
import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const lifecycleError = useLifecycleStore((state) => state.error);

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const isTransitioning = lifecycleState === 'starting' || lifecycleState === 'stopping';

  const displayMessage = lifecycleError || lifecycleMessage;
  const isError = !!lifecycleError;

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <EnvironmentBadge />
        <div className="statusbar-separator" />
        <StatusBadge status={credentialStatus} />
        {/* ... provider and model badges ... */}
      </div>

      {displayMessage && (
        <StatusBadge status={isError ? 'invalid' : isProxyRunning ? 'running' : 'stopped'}>
          {isTransitioning && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          {displayMessage}
        </StatusBadge>
      )}
    </div>
  );
}
```

### Validation Criteria
- StatusBar shows spinning icon during transitions
- Messages are concise and V1-style
- Error messages display properly
- Visual feedback is immediate
- No layout shifts or flicker

---

## Phase 7: Testing and Validation

### Objective
Comprehensive testing of the entire lifecycle management system end-to-end.

### Files Created
- `/backend/api-server/__tests__/lifecycle-controller.test.js` (optional)
- `/frontend-v2/src/components/layout/__tests__/StatusBar.test.tsx` (optional)

### Files Modified
None

### Integration Points
All files from previous phases

### Testing Checklist

**Backend Testing:**
- [ ] Start provider router → verify lifecycle:update events emitted
- [ ] Start qwen proxy → verify lifecycle:update events emitted
- [ ] Stop provider router → verify lifecycle:update events emitted
- [ ] Stop qwen proxy → verify lifecycle:update events emitted
- [ ] Process fails to start → verify error event emitted
- [ ] Process startup timeout → verify timeout error emitted
- [ ] Process crashes during startup → verify error handling
- [ ] Multiple rapid start/stop commands → verify cleanup works

**Frontend Testing:**
- [ ] Click Start → see "Starting..." immediately
- [ ] Process starts → see "Running :3001" update
- [ ] Click Stop → see "Stopping..." immediately
- [ ] Process stops → see "Stopped" update
- [ ] Startup error → see error message in StatusBar
- [ ] Timeout scenario → see timeout error message
- [ ] Refresh page while running → see correct state on reconnect
- [ ] WebSocket disconnect/reconnect → verify state restored

**Integration Testing:**
- [ ] Backend emits lifecycle:update → frontend receives and displays
- [ ] Backend emits proxy:status → frontend still handles correctly
- [ ] Both events coexist without conflicts
- [ ] Transitional states not overridden by status updates
- [ ] Error states properly displayed and cleared

**User Experience Testing:**
- [ ] Messages are concise and clear
- [ ] No verbose backend messages shown to user
- [ ] Spinning icon appears during transitions
- [ ] Status bar updates feel instant
- [ ] No UI flicker or layout shifts
- [ ] Error messages are actionable

### Validation Criteria
- All test scenarios pass
- No regressions in existing functionality
- Performance is acceptable (no lag)
- User experience matches or exceeds V1

---

## Integration Summary

### Backend Integration Flow
```
proxy-control.js (start endpoint)
    ↓
Spawn child process
    ↓
lifecycle-controller.monitorStartup()
    ├─→ Emit lifecycle:update {state: 'starting'}
    ├─→ Monitor stdout for ready signal
    ├─→ Set 30s timeout
    └─→ When ready detected:
        └─→ Emit lifecycle:update {state: 'running', port: 3001}
```

### Frontend Integration Flow
```
WebSocket receives lifecycle:update event
    ↓
websocket.service.ts emits to callback
    ↓
useWebSocket.ts → updateFromLifecycle()
    ↓
useProxyStore.updateFromLifecycle()
    ↓
useLifecycleStore.setState()
    ├─→ formatMessage() creates V1-style message
    └─→ Updates state + message
        ↓
    StatusBar.tsx re-renders
        └─→ Displays: "Running :3001" with status indicator
```

### Event Coexistence
- `lifecycle:update` - Real-time transitional states during start/stop
- `proxy:status` - Full status snapshots (credentials, providers, models)
- Both work together without conflict
- Lifecycle events take precedence during transitions
- Status events update when stable

---

## Best Practices Applied

### Single Responsibility Principle (SRP)
- **lifecycle-controller.js**: Only monitors process lifecycle
- **event-emitter.js**: Only emits WebSocket events
- **proxy-control.js**: Only handles HTTP endpoints and process management
- **useLifecycleStore.ts**: Only manages lifecycle UI state
- **useProxyStore.ts**: Only manages proxy data state

### Don't Repeat Yourself (DRY)
- Message formatting centralized in `formatMessage()` helper
- Lifecycle monitoring logic in single controller, used by both start/stop
- WebSocket emission through single event-emitter service
- Type definitions in central types file

### Domain-Driven Design
- Lifecycle domain separated from proxy status domain
- Clear boundaries between backend monitoring and frontend display
- Events use domain language (`starting`, `running`, `stopping`, `stopped`)
- State transitions follow domain rules

### Separation of Concerns
- Backend monitors actual process state
- Frontend displays user-facing messages
- WebSocket bridges the domains
- No business logic in UI components
- No UI concerns in backend controllers

---

## Success Criteria

1. **User Experience**
   - Instant feedback when clicking Start/Stop
   - Clear, concise status messages
   - Smooth transitions without flicker
   - Error states clearly communicated

2. **Technical Quality**
   - All phases implemented without breaking changes
   - No regressions in existing functionality
   - Clean separation of concerns maintained
   - Code follows project conventions

3. **Reliability**
   - Handles edge cases (timeout, error, crash)
   - WebSocket reconnection doesn't break state
   - Multiple rapid operations handled gracefully
   - Process monitoring is accurate

4. **Maintainability**
   - Code is well-documented
   - Easy to add new lifecycle states
   - Easy to add new monitored processes
   - Clear integration points identified

---

## Notes

- Each phase can be implemented and tested independently
- No phase should take more than 2-3 hours of focused work
- Phases build on each other but have clear boundaries
- Backend phases (1-3) can be done before frontend phases (4-6)
- Phase 7 validates the entire system working together
- All changes maintain backward compatibility
- No breaking changes to existing API or WebSocket events
