# Code Examples: WebSocket & Lifecycle Management

**Reference Implementation:** `frontend/src/`

**Purpose:** Complete examples for WebSocket-based real-time communication and lifecycle management following Docs 67 and 68.

---

## Table of Contents

1. [WebSocket Service](#websocket-service)
2. [WebSocket Hook](#websocket-hook)
3. [Lifecycle Store](#lifecycle-store)
4. [Extension Detection](#extension-detection)
5. [Type Definitions](#type-definitions)
6. [Integration Patterns](#integration-patterns)

---

## WebSocket Service

### Location: `frontend/src/services/websocket.service.ts`

Complete WebSocket service using Socket.IO for real-time communication with backend.

```typescript
import { io, Socket } from 'socket.io-client';
import type {
  ProxyStatusEvent,
  CredentialsUpdatedEvent,
  ProvidersUpdatedEvent,
  ModelsUpdatedEvent,
  LifecycleUpdateEvent,
  WebSocketConnectionStatus,
} from '@/types';

type EventCallback<T> = (data: T) => void;

interface WebSocketCallbacks {
  onProxyStatus?: EventCallback<ProxyStatusEvent>;
  onCredentialsUpdated?: EventCallback<CredentialsUpdatedEvent>;
  onProvidersUpdated?: EventCallback<ProvidersUpdatedEvent>;
  onModelsUpdated?: EventCallback<ModelsUpdatedEvent>;
  onLifecycleUpdate?: EventCallback<LifecycleUpdateEvent>;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    // Service is initialized but not connected
  }

  connect(url: string = 'http://localhost:3002', callbacks: WebSocketCallbacks = {}): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', url);
    this.callbacks = callbacks;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt:', attempt);
      this.reconnectAttempts = attempt;
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.updateStatus('disconnected');
    });

    // Business events
    this.socket.on('proxy:status', (data: ProxyStatusEvent) => {
      console.log('[WebSocket] proxy:status', data);
      this.callbacks.onProxyStatus?.(data);
    });

    this.socket.on('credentials:updated', (data: CredentialsUpdatedEvent) => {
      console.log('[WebSocket] credentials:updated', data);
      this.callbacks.onCredentialsUpdated?.(data);
    });

    this.socket.on('providers:updated', (data: ProvidersUpdatedEvent) => {
      console.log('[WebSocket] providers:updated', data);
      this.callbacks.onProvidersUpdated?.(data);
    });

    this.socket.on('models:updated', (data: ModelsUpdatedEvent) => {
      console.log('[WebSocket] models:updated', data);
      this.callbacks.onModelsUpdated?.(data);
    });

    this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
      console.log('[WebSocket] lifecycle:update', data);
      this.callbacks.onLifecycleUpdate?.(data);
    });
  }

  private updateStatus(status: WebSocketConnectionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus('disconnected');
    }
  }

  getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
```

**Key Features:**
- Singleton pattern for app-wide WebSocket connection
- Automatic reconnection with exponential backoff
- Type-safe event callbacks
- Connection status tracking
- Detailed logging for debugging
- Handles both WebSocket and polling transports

---

## WebSocket Hook

### Location: `frontend/src/hooks/useWebSocket.ts`

React hook for managing WebSocket connection at application level.

```typescript
import { useEffect, useState } from 'react';
import { websocketService } from '@/services/websocket.service';
import { useProxyStore } from '@/stores/useProxyStore';
import type { WebSocketConnectionStatus } from '@/types';

/**
 * Hook for managing WebSocket connection at app level
 * Auto-connects on mount, disconnects on unmount
 * Wires up all event callbacks to store updates
 */
export function useWebSocket(url: string = 'http://localhost:3002') {
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const {
    setConnected,
    updateFromProxyStatus,
    updateFromCredentials,
    updateFromProviders,
    updateFromModels,
    updateFromLifecycle,
  } = useProxyStore();

  useEffect(() => {
    console.log('[useWebSocket] Initializing WebSocket connection');

    // Connect with all event handlers
    websocketService.connect(url, {
      onProxyStatus: (event) => {
        updateFromProxyStatus(event);
      },
      onCredentialsUpdated: (event) => {
        updateFromCredentials(event);
      },
      onProvidersUpdated: (event) => {
        updateFromProviders(event);
      },
      onModelsUpdated: (event) => {
        updateFromModels(event);
      },
      onLifecycleUpdate: (event) => {
        updateFromLifecycle(event);
      },
      onStatusChange: (status) => {
        console.log('[useWebSocket] Status changed:', status);
        setConnectionStatus(status);
        setConnected(status === 'connected');
        setReconnectAttempts(websocketService.getReconnectAttempts());
      },
    });

    // Cleanup on unmount
    return () => {
      console.log('[useWebSocket] Disconnecting WebSocket');
      websocketService.disconnect();
    };
  }, [url, setConnected, updateFromProxyStatus, updateFromCredentials, updateFromProviders, updateFromModels, updateFromLifecycle]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,
  };
}
```

**Usage in App.tsx:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function App() {
  useDarkMode(); // Existing hook
  useWebSocket(); // Initialize WebSocket connection

  // ... rest of app
}
```

---

## Lifecycle Store

### Location: `frontend/src/stores/useLifecycleStore.ts`

Zustand store for managing proxy lifecycle state transitions.

```typescript
import { create } from 'zustand';

export type LifecycleState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

interface LifecycleStore {
  state: LifecycleState;
  message: string;
  error: string | null;
  setState: (state: LifecycleState, message: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useLifecycleStore = create<LifecycleStore>((set) => ({
  state: 'idle',
  message: '',
  error: null,
  setState: (state, message) => set({ state, message, error: null }),
  setError: (error) => set({ state: 'error', error }),
  clearError: () => set({ error: null }),
}));
```

**Lifecycle States:**
- **idle**: Initial state before any lifecycle events
- **starting**: Server is starting up (transitional)
- **running**: Server is running and ready (final)
- **stopping**: Server is shutting down (transitional)
- **stopped**: Server is not running (final)
- **error**: Server encountered an error (final)

**Message Examples:**
- Starting: "Starting :3001"
- Running: "Running :3001"
- Stopping: "Stopping"
- Stopped: "Stopped"
- Error: Actual error message

---

## Extension Detection

### Location: `frontend/src/hooks/useExtensionDetection.ts`

WebSocket-based Chrome extension detection (NO polling).

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

**Platform Utilities (`frontend/src/utils/platform.ts`):**
```typescript
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

export function isBrowser(): boolean {
  return !isElectron();
}
```

---

## Type Definitions

### Location: `frontend/src/types/proxy.types.ts`

Complete type definitions for WebSocket events.

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

export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
```

---

## Integration Patterns

### Pattern 1: Optimistic UI Updates

**Use Case:** Start proxy with instant feedback

```typescript
// In useHomePage.ts
const handleStartProxy = async () => {
  // 1. Optimistic update - instant UI feedback
  useLifecycleStore.getState().setState('starting', 'Starting :3001');

  try {
    // 2. Make API call
    await proxyService.startProxy();

    // 3. WebSocket lifecycle:update event will update to 'running'
    // No need to manually update - let WebSocket handle it

  } catch (error) {
    // 4. Rollback on error
    useLifecycleStore.getState().setError('Failed to start proxy');
  }
};
```

### Pattern 2: WebSocket Event Handlers in Store

**Use Case:** Update store when WebSocket events arrive

```typescript
// In useProxyStore.ts
updateFromLifecycle: (event: LifecycleUpdateEvent) => {
  const { setState } = useLifecycleStore.getState();

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
},
```

### Pattern 3: Prevent Overriding Transitional States

**Use Case:** Don't let proxy:status events override lifecycle during transitions

```typescript
// In useProxyStore.ts - updateFromProxyStatus handler
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

### Pattern 4: Display Lifecycle State in UI

**Use Case:** Show lifecycle message with spinner during transitions

```typescript
// In StatusBar.tsx
const lifecycleState = useLifecycleStore((state) => state.state);
const lifecycleMessage = useLifecycleStore((state) => state.message);
const lifecycleError = useLifecycleStore((state) => state.error);

const isTransitioning = lifecycleState === 'starting' || lifecycleState === 'stopping';

return (
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
);
```

---

## Architecture Summary

### Event Flow

```
User Action (Start Proxy)
    ↓
Optimistic Update (setState('starting'))
    ↓
API Call (proxyService.startProxy())
    ↓
Backend Spawns Process
    ↓
Backend Emits lifecycle:update {state: 'starting'}
    ↓
WebSocket Service Receives Event
    ↓
useWebSocket Hook Calls updateFromLifecycle()
    ↓
useProxyStore Updates useLifecycleStore
    ↓
StatusBar Re-renders (shows "Starting :3001" with spinner)
    ↓
Backend Detects Server Ready
    ↓
Backend Emits lifecycle:update {state: 'running'}
    ↓
... same flow ...
    ↓
StatusBar Shows "Running :3001" (no spinner)
```

### Key Principles

1. **Single Source of Truth**: Backend tracks actual process state
2. **Event-Driven**: WebSocket events drive UI updates
3. **Optimistic UI**: Instant feedback before server confirms
4. **Graceful Degradation**: HTTP fallback if WebSocket unavailable
5. **Separation of Concerns**: Services → Hooks → Stores → Components
6. **Type Safety**: Full TypeScript coverage for all events

---

## Dependencies

```json
{
  "dependencies": {
    "socket.io-client": "^4.x.x",
    "zustand": "^4.x.x"
  }
}
```

Backend must have:
- WebSocket server running on port 3002
- Socket.io server configured
- Lifecycle controller emitting events
- Extension tracking in WebSocket server
