# Frontend V3 Code Documentation: Phases 6-7

**State Management and Hooks Layer**

This document contains the complete source code for Phases 6 and 7 of the Frontend V3 Rewrite Implementation Plan.

## Quick Navigation

- [Phase 6: State Management Layer](#phase-6-state-management-layer)
  - [Phase 6.1: UI & Settings Stores](#phase-61-ui--settings-stores)
  - [Phase 6.2: Domain Stores](#phase-62-domain-stores)
- [Phase 7: Hooks Layer](#phase-7-hooks-layer)
  - [Phase 7.1: Core Hooks](#phase-71-core-hooks)
  - [Phase 7.2: Domain Hooks](#phase-72-domain-hooks)
  - [Phase 7.3: Page Hooks](#phase-73-page-hooks)

---

## Phase 6: State Management Layer

Phase 6 implements Zustand stores for application state management. All stores follow a consistent pattern with proper TypeScript typing and clear separation of concerns.

### Phase 6.1: UI & Settings Stores

These stores manage user interface state and application settings.

#### frontend/src/stores/useUIStore.ts

**Purpose**: Manages UI state including theme, sidebar position, current route, and status messages. Provides persistence across browser and Electron environments.

**Key Features**:
- Cross-platform persistence (localStorage for browser, electron-store for desktop)
- Optimistic updates with rollback on error
- Theme and sidebar position management
- Current route tracking for navigation

```typescript
import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  currentRoute: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setShowStatusMessages: (show: boolean) => void;
  toggleShowStatusMessages: () => void;
  setStatusMessage: (message: string) => void;
  setCurrentRoute: (route: string) => void;
  loadSettings: () => Promise<void>;
}

function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI;
}

async function saveUIState(uiState: UIState) {
  const electron = isElectron();
  console.log('[UIStore] Saving UI state:', uiState, 'isElectron:', !!electron);
  if (electron && window.electronAPI) {
    await window.electronAPI.settings.set('uiState', uiState);
    console.log('[UIStore] Saved to electron-store');
  } else {
    localStorage.setItem('qwen-proxy-ui-state', JSON.stringify(uiState));
    console.log('[UIStore] Saved to localStorage');
  }
}

async function saveCurrentRoute(route: string) {
  const electron = isElectron();
  if (electron && window.electronAPI) {
    await window.electronAPI.settings.set('currentRoute', route);
  } else {
    localStorage.setItem('qwen-proxy-current-route', route);
  }
}

async function loadCurrentRoute(): Promise<string> {
  const electron = isElectron();
  if (electron && window.electronAPI) {
    const route = await window.electronAPI.settings.get('currentRoute') as string | null;
    return route || '/';
  } else {
    return localStorage.getItem('qwen-proxy-current-route') || '/';
  }
}

async function loadUIState(): Promise<UIState> {
  const electron = isElectron();
  const defaults: UIState = { theme: 'dark', sidebarPosition: 'left', showStatusMessages: true };

  console.log('[UIStore] Loading UI state, isElectron:', !!electron);
  if (electron && window.electronAPI) {
    const stored = await window.electronAPI.settings.get('uiState') as UIState | null;
    console.log('[UIStore] Loaded from electron-store:', stored);
    return stored ? { ...defaults, ...stored } : defaults;
  } else {
    try {
      const stored = localStorage.getItem('qwen-proxy-ui-state');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[UIStore] Loaded from localStorage:', parsed);
        // Support both new format (direct UIState) and legacy format (nested)
        const uiState = parsed.state?.uiState || parsed;
        // Validate the loaded state has required properties
        if (uiState.theme && uiState.sidebarPosition) {
          return { ...defaults, ...uiState };
        }
      }
    } catch (e) {
      console.error('[UIStore] Failed to load UI state from localStorage:', e);
    }
    console.log('[UIStore] No stored state, using defaults');
    return defaults;
  }
}

export const useUIStore = create<UIStore>((set, get) => ({
  uiState: {
    theme: 'dark',
    sidebarPosition: 'left',
    showStatusMessages: true,
  },
  statusMessage: 'Ready',
  currentRoute: '/',
  setTheme: async (theme) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, theme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleTheme: async () => {
    const currentState = get().uiState;
    const newTheme: 'light' | 'dark' = currentState.theme === 'light' ? 'dark' : 'light';
    const newState: UIState = { ...currentState, theme: newTheme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setSidebarPosition: async (position) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, sidebarPosition: position };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleSidebarPosition: async () => {
    const currentState = get().uiState;
    const newPosition: 'left' | 'right' = currentState.sidebarPosition === 'left' ? 'right' : 'left';
    const newState: UIState = { ...currentState, sidebarPosition: newPosition };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setShowStatusMessages: async (show) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, showStatusMessages: show };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleShowStatusMessages: async () => {
    const currentState = get().uiState;
    const newValue = !currentState.showStatusMessages;
    const newState: UIState = { ...currentState, showStatusMessages: newValue };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setStatusMessage: (message) => set({ statusMessage: message }),
  setCurrentRoute: async (route) => {
    set({ currentRoute: route });
    try {
      await saveCurrentRoute(route);
    } catch (error) {
      console.error('[UIStore] Failed to save current route:', error);
    }
  },
  loadSettings: async () => {
    try {
      const uiState = await loadUIState();
      const currentRoute = await loadCurrentRoute();
      console.log('[UIStore] Settings loaded successfully:', uiState, 'route:', currentRoute);
      set({ uiState, currentRoute });
    } catch (error) {
      console.error('[UIStore] Failed to load settings:', error);
    }
  },
}));
```

#### frontend/src/stores/useSettingsStore.ts

**Purpose**: Manages application settings including server configuration, active provider, and active model.

**Key Features**:
- Fetches and caches settings from API server
- Provides provider router URL for API calls
- Shows toast notifications for provider/model changes
- Optimistic updates with proper error handling

```typescript
import { create } from 'zustand';
import { apiService } from '@/services/api.service';
import { useAlertStore } from './useAlertStore';

interface Settings {
  'server.port'?: string;
  'server.host'?: string;
  active_provider?: string;
  active_model?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SettingsStore {
  settings: Settings;
  loading: boolean;
  providerRouterUrl: string;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  setActiveModel: (modelId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  loading: false,
  providerRouterUrl: '',

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const result = await apiService.getSettings();
      if (result.success && result.data) {
        const port = result.data['server.port'] || '3001';
        const host = result.data['server.host'] || 'localhost';
        const providerRouterUrl = `http://${host}:${port}`;
        set({ settings: result.data, providerRouterUrl });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ providerRouterUrl: 'http://localhost:3001' });
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: async (key: string, value: string) => {
    const previousValue = get().settings[key];

    try {
      await apiService.updateSetting(key, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }));

      // Show toast notifications for provider/model changes
      if (previousValue !== value) {
        if (key === 'active_provider') {
          useAlertStore.showAlert(`Switched to provider: ${value}`, 'success');
        } else if (key === 'active_model') {
          useAlertStore.showAlert(`Switched to model: ${value}`, 'success');
        }
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to update setting:', error);
      throw error;
    }
  },

  setActiveModel: async (modelId: string) => {
    return get().updateSetting('active_model', modelId);
  }
}));
```

### Phase 6.2: Domain Stores

These stores manage domain-specific state including credentials, proxy status, lifecycle, and alerts.

#### frontend/src/stores/useCredentialsStore.ts

**Purpose**: Manages Qwen credentials state for authentication.

**Key Features**:
- Simple credentials storage and loading state
- Credentials updated via WebSocket events
- Used by credentials management components

```typescript
import { create } from 'zustand';
import type { QwenCredentials } from '@/types';

interface CredentialsStore {
  credentials: QwenCredentials | null;
  loading: boolean;
  setCredentials: (credentials: QwenCredentials | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCredentialsStore = create<CredentialsStore>((set) => ({
  credentials: null,
  loading: false,
  setCredentials: (credentials) => set({ credentials }),
  setLoading: (loading) => set({ loading }),
}));
```

#### frontend/src/stores/useProxyStore.ts

**Purpose**: Manages proxy server status and WebSocket-based real-time updates.

**Key Features**:
- Handles multiple WebSocket event types (proxy status, credentials, providers, models, lifecycle)
- Shows toast notifications for connection status changes
- Consolidates all proxy-related state
- Manages extension detection status

```typescript
import { create } from 'zustand';
import type { ProxyStatusResponse, ProxyStatusEvent, CredentialsUpdatedEvent, ProvidersUpdatedEvent, ModelsUpdatedEvent, LifecycleUpdateEvent } from '@/types';
import { useLifecycleStore } from './useLifecycleStore';
import { useAlertStore } from './useAlertStore';

interface ProxyStore {
  status: ProxyStatusResponse | null;
  loading: boolean;
  connected: boolean;
  lastUpdate: number;
  wsProxyStatus: ProxyStatusEvent['status'] | null;
  setStatus: (status: ProxyStatusResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  updateFromProxyStatus: (event: ProxyStatusEvent) => void;
  updateFromCredentials: (event: CredentialsUpdatedEvent) => void;
  updateFromProviders: (event: ProvidersUpdatedEvent) => void;
  updateFromModels: (event: ModelsUpdatedEvent) => void;
  updateFromLifecycle: (event: LifecycleUpdateEvent) => void;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  status: null,
  loading: false,
  connected: false,
  lastUpdate: 0,
  wsProxyStatus: null,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setConnected: (connected) => set((state) => {
    // Show toast notification when connection status changes (but not on initial connection)
    if (state.connected !== connected && state.lastUpdate > 0) {
      if (connected) {
        useAlertStore.showAlert('API Server connected', 'success');
      } else {
        useAlertStore.showAlert('API Server disconnected', 'error');
      }
    }
    return { connected };
  }),
  updateFromProxyStatus: (event) => set((state) => {
    // Preserve existing credentials if not included in the update
    const credentials = event.status.credentials ? {
      valid: event.status.credentials.valid,
      expiresAt: event.status.credentials.expiresAt ? event.status.credentials.expiresAt * 1000 : null, // Convert seconds to milliseconds
    } : (state.wsProxyStatus?.credentials || { valid: false, expiresAt: null });

    const updatedStatus = {
      ...event.status,
      credentials,
    };

    // Check for extension status change and show toast
    const previousExtensionConnected = state.wsProxyStatus?.extensionConnected;
    const newExtensionConnected = event.status.extensionConnected;

    if (state.lastUpdate > 0 && previousExtensionConnected !== newExtensionConnected) {
      if (newExtensionConnected) {
        useAlertStore.showAlert('Chrome Extension connected', 'success');
      } else {
        useAlertStore.showAlert('Chrome Extension disconnected', 'error');
      }
    }

    // Initialize lifecycle store on first load if it's empty and proxy is running
    const lifecycleStore = useLifecycleStore.getState();
    if (!lifecycleStore.message && event.status.providerRouter?.running) {
      // Set initial message based on running state
      lifecycleStore.setState('running', `Running :${event.status.providerRouter.port}`);
    } else if (!lifecycleStore.message && !event.status.providerRouter?.running && !event.status.qwenProxy?.running) {
      // Proxy is stopped
      lifecycleStore.setState('stopped', 'Stopped');
    }

    return {
      wsProxyStatus: updatedStatus,
      status: updatedStatus as any, // Also update status for StatusBar
      lastUpdate: Date.now()
    };
  }),
  updateFromCredentials: (event) => set((state) => {
    if (!state.wsProxyStatus) return state;

    const previousValid = state.wsProxyStatus.credentials?.valid;
    const newValid = event.credentials.valid;

    // Show toast notification when credentials status changes (but not on initial load)
    if (state.lastUpdate > 0 && previousValid !== newValid) {
      if (newValid) {
        useAlertStore.showAlert('Credentials updated successfully', 'success');
      } else {
        useAlertStore.showAlert('Credentials expired or invalid', 'error');
      }
    }

    const updatedStatus = {
      ...state.wsProxyStatus,
      credentials: {
        valid: event.credentials.valid,
        expiresAt: event.credentials.expiresAt ? event.credentials.expiresAt * 1000 : null, // Convert seconds to milliseconds
      },
    };
    return {
      wsProxyStatus: updatedStatus,
      status: updatedStatus as any, // Also update status for StatusBar
      lastUpdate: Date.now(),
    };
  }),
  updateFromProviders: (event) => set((state) => {
    if (!state.wsProxyStatus) return state;
    return {
      wsProxyStatus: {
        ...state.wsProxyStatus,
        providers: {
          items: event.providers,
          total: event.providers.length,
          enabled: event.providers.filter((p: any) => p.enabled).length,
        },
      },
      lastUpdate: Date.now(),
    };
  }),
  updateFromModels: (event) => set((state) => {
    if (!state.wsProxyStatus) return state;
    return {
      wsProxyStatus: {
        ...state.wsProxyStatus,
        models: {
          items: event.models,
          total: event.models.length,
        },
      },
      lastUpdate: Date.now(),
    };
  }),
  updateFromLifecycle: (event) => {
    // Format lifecycle messages for display (V1 style - concise)
    const formatMessage = (_processName: string, data: LifecycleUpdateEvent['providerRouter'] | LifecycleUpdateEvent['qwenProxy']) => {
      if (!data) return '';

      switch (data.state) {
        case 'starting':
          return `Starting :${data.port}`;
        case 'running':
          return `Running :${data.port}`;
        case 'stopping':
          return 'Stopping';
        case 'stopped':
          return 'Stopped';
        case 'error':
          return data.error || 'Error';
        default:
          return '';
      }
    };

    // Determine which process state to display
    let lifecycleState: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' = 'idle';
    let message = '';

    // Provider Router takes precedence (main proxy)
    if (event.providerRouter) {
      lifecycleState = event.providerRouter.state === 'starting' ? 'starting' :
                      event.providerRouter.state === 'running' ? 'running' :
                      event.providerRouter.state === 'stopping' ? 'stopping' :
                      event.providerRouter.state === 'stopped' ? 'stopped' :
                      event.providerRouter.state === 'error' ? 'error' : 'idle';
      message = formatMessage('Provider Router', event.providerRouter);
    }
    // Qwen Proxy if no Provider Router update
    else if (event.qwenProxy) {
      lifecycleState = event.qwenProxy.state === 'starting' ? 'starting' :
                      event.qwenProxy.state === 'running' ? 'running' :
                      event.qwenProxy.state === 'stopping' ? 'stopping' :
                      event.qwenProxy.state === 'stopped' ? 'stopped' :
                      event.qwenProxy.state === 'error' ? 'error' : 'idle';
      message = formatMessage('Qwen Proxy', event.qwenProxy);
    }

    // Update lifecycle store and show toast notifications
    if (lifecycleState === 'error' && event.providerRouter?.error) {
      useLifecycleStore.getState().setError(event.providerRouter.error);
      useAlertStore.showAlert(event.providerRouter.error, 'error');
    } else if (lifecycleState === 'error' && event.qwenProxy?.error) {
      useLifecycleStore.getState().setError(event.qwenProxy.error);
      useAlertStore.showAlert(event.qwenProxy.error, 'error');
    } else if (message) {
      useLifecycleStore.getState().setState(lifecycleState, message);

      // Only show toasts for final states (running/stopped), not transition states (starting/stopping)
      // Transition state toasts are shown immediately in useHomePage for better UX
      switch (lifecycleState) {
        case 'running':
          useAlertStore.showAlert('Proxy server started successfully', 'success');
          break;
        case 'stopped':
          useAlertStore.showAlert('Proxy server stopped successfully', 'success');
          break;
      }
    }
  },
}));
```

#### frontend/src/stores/useLifecycleStore.ts

**Purpose**: Manages proxy server lifecycle state (idle, starting, running, stopping, stopped, error).

**Key Features**:
- Simple state machine for lifecycle tracking
- Stores current state, message, and error
- Used by UI to show proxy server status

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

#### frontend/src/stores/useAlertStore.ts

**Purpose**: Manages toast notifications throughout the application.

**Key Features**:
- Simple wrapper around shadcn/ui toast component
- Auto-dismisses after 3 seconds
- Supports success and error variants
- Used by all stores and hooks for user feedback

```typescript
import { toast } from '@/hooks/useToast';

interface AlertStore {
  showAlert: (message: string, type: 'success' | 'error') => void;
}

export const useAlertStore = {
  showAlert: (message: string, type: 'success' | 'error') => {
    const { dismiss } = toast({
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      dismiss();
    }, 3000);
  },
} as AlertStore;
```

---

## Phase 7: Hooks Layer

Phase 7 implements custom React hooks that encapsulate business logic and provide clean APIs for components.

### Phase 7.1: Core Hooks

Core hooks provide fundamental functionality used throughout the application.

#### frontend/src/hooks/useDarkMode.ts

**Purpose**: Manages theme switching and applies theme class to document root.

**Key Features**:
- Syncs with UIStore for theme state
- Applies theme class to HTML root element
- Returns current theme and toggle function

```typescript
import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useDarkMode() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return { theme, toggleTheme };
}
```

#### frontend/src/hooks/useWebSocket.ts

**Purpose**: Manages WebSocket connection and real-time event handling.

**Key Features**:
- Auto-connects to backend WebSocket server
- Registers callbacks for all event types
- Updates proxy store with real-time data
- Handles reconnection attempts
- Cleanup on unmount

```typescript
import { useEffect, useState } from 'react';
import { websocketService } from '@/services/websocket.service';
import { useProxyStore } from '@/stores/useProxyStore';
import type { WebSocketConnectionStatus } from '@/types';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = 'http://localhost:3002', autoConnect = true } = options;

  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>(
    websocketService.getStatus()
  );
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
    if (!autoConnect) return;

    // Setup WebSocket connection with callbacks
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
        setConnectionStatus(status);
        setConnected(status === 'connected');
        setReconnectAttempts(websocketService.getReconnectAttempts());
      },
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      setConnected(false);
    };
  }, [
    url,
    autoConnect,
    setConnected,
    updateFromProxyStatus,
    updateFromCredentials,
    updateFromProviders,
    updateFromModels,
    updateFromLifecycle,
  ]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,
  };
}
```

#### frontend/src/hooks/useToast.ts

**Purpose**: Provides toast notification system (based on react-hot-toast pattern).

**Key Features**:
- Global toast state management
- Auto-dismiss after configurable delay
- Supports custom actions and variants
- Limit of 1 toast at a time
- Used by useAlertStore for notifications

**Note**: This is a shadcn/ui component that provides the toast functionality used throughout the app.

```typescript
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 3000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

#### frontend/src/hooks/useExtensionDetection.ts

**Purpose**: Detects Chrome extension installation status via WebSocket.

**Key Features**:
- No polling - uses WebSocket-based detection
- Extension establishes Socket.io connection to backend
- Backend broadcasts connection status to frontend
- Only needed in browser mode (not Electron)

```typescript
import { isElectron } from '@/utils/platform';
import { useProxyStore } from '@/stores/useProxyStore';

/**
 * Hook to detect Chrome extension installation status
 *
 * Now uses WebSocket-based detection instead of polling.
 * Extension status is received via wsProxyStatus.extensionConnected from the backend.
 *
 * The extension establishes a Socket.io connection to the backend when enabled,
 * and the backend broadcasts the connection status to all frontend clients.
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

#### frontend/src/hooks/useChatTest.ts

**Purpose**: Provides chat testing functionality with loading and error states.

**Key Features**:
- Manages chat test state (testing, result, error)
- Calls chat service for testing
- Provides reset function for clearing state
- Used by chat testing components

```typescript
import { useState } from 'react';
import { chatService, type ChatTestResult } from '@/services/chat.service';

export interface ChatTestState {
  testing: boolean;
  result: ChatTestResult | null;
  error: string | null;
}

export function useChatTest() {
  const [state, setState] = useState<ChatTestState>({
    testing: false,
    result: null,
    error: null,
  });

  const testChat = async (model?: string, message?: string) => {
    setState({
      testing: true,
      result: null,
      error: null,
    });

    try {
      const result = await chatService.testChat(model, message);

      setState({
        testing: false,
        result,
        error: result.success ? null : result.error || 'Unknown error',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        testing: false,
        result: null,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const reset = () => {
    setState({
      testing: false,
      result: null,
      error: null,
    });
  };

  return {
    testing: state.testing,
    result: state.result,
    error: state.error,
    testChat,
    reset,
  };
}
```

#### frontend/src/hooks/useQuickChatTest.ts

**Purpose**: Provides quick chat testing with simple prompt.

**Key Features**:
- Sends "Say hello in one sentence" to test chat
- Manages response and loading state
- Used for quick model verification

```typescript
import { useState } from 'react';
import { chatService } from '@/services/chatService';

export function useQuickChatTest() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async (providerRouterUrl: string, model: string) => {
    if (!providerRouterUrl) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await chatService.sendChatRequest(
        providerRouterUrl,
        model,
        'Say hello in one sentence'
      );
      setResponse(result);
    } catch (error) {
      console.error('Failed to test chat:', error);
      setResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoading(false);
    }
  };

  return {
    response,
    loading,
    handleTest,
  };
}
```

### Phase 7.2: Domain Hooks

Domain hooks encapsulate business logic for specific domains (providers, models, credentials).

#### frontend/src/hooks/useProviders.ts

**Purpose**: Manages provider CRUD operations and WebSocket updates.

**Key Features**:
- Fetches providers list from API
- Listens for provider updates via WebSocket
- Provides CRUD operations (create, delete, toggle, switch)
- Connection testing functionality
- Action-specific loading states

```typescript
import { useState, useEffect, useCallback } from 'react';
import { providersService } from '@/services/providers.service';
import { websocketService } from '@/services/websocket.service';
import type { Provider } from '@/types/providers.types';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setError(null);
      const data = await providersService.getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleProvidersUpdate = useCallback(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchProviders();

    // Listen for provider updates via WebSocket
    websocketService.connect('http://localhost:3002', {
      onProvidersUpdated: handleProvidersUpdate,
    });
  }, [handleProvidersUpdate]);

  const toggleEnabled = async (provider: Provider) => {
    const action = provider.enabled ? 'disable' : 'enable';
    setProviders((prev) =>
      prev.map((p) => (p.id === provider.id ? { ...p, enabled: !p.enabled } : p))
    );
    setActionLoading(`${action}-${provider.id}`);

    try {
      await providersService.toggleEnabled(provider);
      await fetchProviders();
    } catch (err) {
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, enabled: provider.enabled } : p))
      );
      setError(err instanceof Error ? err.message : `Failed to ${action} provider`);
    } finally {
      setActionLoading(null);
    }
  };

  const testConnection = async (provider: Provider) => {
    setActionLoading(`test-${provider.id}`);
    setError(null);

    try {
      await providersService.testConnection(provider.id);
    } catch (err) {
      setError(
        err instanceof Error ? `${provider.name}: ${err.message}` : 'Connection test failed'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const deleteProvider = async (providerId: string) => {
    setActionLoading(`delete-${providerId}`);

    try {
      await providersService.deleteProvider(providerId);
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setActionLoading(null);
    }
  };

  const switchProvider = async (providerId: string) => {
    try {
      await providersService.switchProvider(providerId);
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch provider');
      throw err;
    }
  };

  const createProvider = async (data: {
    id: string;
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  }) => {
    setActionLoading(`create-${data.id}`);
    setError(null);

    try {
      await providersService.createProvider(data);
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchProviders();
  };

  return {
    providers,
    loading,
    error,
    actionLoading,
    toggleEnabled,
    testConnection,
    deleteProvider,
    switchProvider,
    createProvider,
    refresh,
  };
}
```

#### frontend/src/hooks/useModels.ts

**Purpose**: Manages model fetching, filtering, and selection.

**Key Features**:
- Loads and parses models from API
- Provides filtering by capability and provider
- Extracts unique provider list
- Computes filtered models based on active filters
- Refresh functionality

```typescript
import { useState, useEffect, useMemo } from 'react';
import { modelsService } from '@/services/models.service';
import type { ParsedModel, CapabilityFilter } from '@/types/models.types';

export function useModels() {
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawModels = await modelsService.getModels();
      const parsed = rawModels.map((m) => modelsService.parseModel(m));
      setModels(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const providers = useMemo(() => {
    const uniqueProviders = new Set(models.map((m) => m.provider));
    return Array.from(uniqueProviders).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (capabilityFilter !== 'all') {
        const hasCapability = model.capabilities.some((cap) => {
          if (capabilityFilter === 'chat') return cap === 'chat';
          if (capabilityFilter === 'vision') return cap === 'vision' || cap.includes('vl');
          if (capabilityFilter === 'tool-call') return cap === 'tools' || cap === 'tool-call';
          return false;
        });
        if (!hasCapability) return false;
      }

      if (providerFilter !== 'all' && model.provider !== providerFilter) {
        return false;
      }

      return true;
    });
  }, [models, capabilityFilter, providerFilter]);

  const clearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  return {
    models: filteredModels,
    loading,
    error,
    capabilityFilter,
    providerFilter,
    providers,
    setCapabilityFilter,
    setProviderFilter,
    clearFilters,
    refresh: loadModels,
  };
}
```

#### frontend/src/hooks/useCredentials.ts

**Purpose**: Manages Qwen credentials with WebSocket-based status updates.

**Key Features**:
- Gets credential status from WebSocket (real-time)
- HTTP polling fallback for reliability
- Login/logout functionality
- Handles credential expiration
- Cross-platform support (browser/Electron)

```typescript
import { useState, useEffect } from 'react';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types/credentials.types';

export function useCredentials() {
  const { setCredentials, loading, setLoading } = useCredentialsStore();
  const { wsProxyStatus } = useProxyStore();
  const [error, setError] = useState<string | null>(null);

  // Get credentials from WebSocket store, fallback to HTTP polling
  const status: CredentialStatus = wsProxyStatus?.credentials
    ? {
        valid: wsProxyStatus.credentials.valid,
        expiresAt: wsProxyStatus.credentials.expiresAt,
      }
    : { valid: false, expiresAt: null };

  // HTTP polling fallback (only if WebSocket not available)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        await credentialsService.getStatus();
        // Data is fetched but store will be updated via WebSocket
        setError(null);
      } catch (err) {
        console.error('Error fetching credentials:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);

    return () => clearInterval(interval);
  }, [wsProxyStatus]);

  const login = () => {
    window.open('https://chat.qwen.ai', '_blank');
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await credentialsService.deleteCredentials();
      setCredentials(null);
      // WebSocket will handle updating the status
    } catch (err) {
      console.error('Error deleting credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    window.location.reload();
  };

  return {
    status,
    loading,
    error,
    login,
    logout,
    refresh,
  };
}
```

### Phase 7.3: Page Hooks

Page hooks encapsulate all logic for specific pages, composing domain hooks and managing page-level state.

#### frontend/src/hooks/useHomePage.ts

**Purpose**: Encapsulates all logic for the Home page.

**Key Features**:
- Manages proxy start/stop with optimistic updates
- Handles Qwen login flow (checks extension, navigates to guide if needed)
- Synchronizes loading state with lifecycle transitions
- Shows immediate UI feedback before API calls
- Cross-platform support (browser/Electron)

```typescript
import { useState, useEffect } from 'react';
import { useProxyStore } from '@/stores/useProxyStore';
import { proxyService } from '@/services/proxy.service';
import { useAlertStore } from '@/stores/useAlertStore';
import { isElectron } from '@/utils/platform';
import { credentialsService } from '@/services/credentials.service';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';

export function useHomePage() {
  const { wsProxyStatus, connected } = useProxyStore();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const [proxyLoading, setProxyLoading] = useState(false);

  // Keep proxyLoading true while lifecycle is in transitional states
  useEffect(() => {
    if (lifecycleState === 'starting' || lifecycleState === 'stopping') {
      setProxyLoading(true);
    } else {
      setProxyLoading(false);
    }
  }, [lifecycleState]);

  const handleStartProxy = async () => {
    setProxyLoading(true);
    // Optimistically set lifecycle state to 'starting' immediately for instant UI feedback
    useLifecycleStore.getState().setState('starting', 'Starting...');
    // Show immediate feedback before API call
    useAlertStore.showAlert('Starting proxy server...', 'success');
    try {
      await proxyService.start();
      // Success/error toasts handled via WebSocket lifecycle events
      // proxyLoading will be cleared by useEffect watching lifecycle state
    } catch (error) {
      console.error('Failed to start proxy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start proxy server';
      useAlertStore.showAlert(errorMessage, 'error');
      // Clear loading and reset lifecycle state on HTTP error (lifecycle events won't fire)
      setProxyLoading(false);
      useLifecycleStore.getState().setState('stopped', 'Stopped');
    }
  };

  const handleStopProxy = async () => {
    setProxyLoading(true);
    // Optimistically set lifecycle state to 'stopping' immediately for instant UI feedback
    useLifecycleStore.getState().setState('stopping', 'Stopping...');
    // Show immediate feedback before API call
    useAlertStore.showAlert('Stopping proxy server...', 'success');
    try {
      await proxyService.stop();
      // Success/error toasts handled via WebSocket lifecycle events
      // proxyLoading will be cleared by useEffect watching lifecycle state
    } catch (error) {
      console.error('Failed to stop proxy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop proxy server';
      useAlertStore.showAlert(errorMessage, 'error');
      // Clear loading and reset lifecycle state on HTTP error (lifecycle events won't fire)
      setProxyLoading(false);
      useLifecycleStore.getState().setState('running', 'Running');
    }
  };

  const handleQwenLogin = async () => {
    try {
      // Step 1: Delete old credentials first if they exist (for re-login)
      const hasCredentials = wsProxyStatus?.credentials?.expiresAt;
      if (hasCredentials) {
        useAlertStore.showAlert('Clearing old credentials...', 'success');
        await credentialsService.deleteCredentials();
      }

      // Step 2: Platform-specific login flow
      if (isElectron()) {
        // In Electron, directly open the login window (no extension needed)
        window.open('https://chat.qwen.ai', '_blank');
        return;
      }

      // Step 3: In browser, check if extension is connected via WebSocket
      const extensionConnected = wsProxyStatus?.extensionConnected ?? false;

      if (!extensionConnected) {
        // Navigate to browser guide page for install instructions
        setCurrentRoute('/browser-guide');
        return;
      }

      // Step 4: Extension is installed, open login window
      window.open('https://chat.qwen.ai', '_blank');
      useAlertStore.showAlert(
        'Please log in to chat.qwen.ai. The extension will automatically extract your credentials.',
        'success'
      );
    } catch (error) {
      console.error('Failed to handle Qwen login:', error);
      useAlertStore.showAlert(
        'Failed to prepare login. Please try again.',
        'error'
      );
    }
  };

  return {
    wsProxyStatus,
    connected,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  };
}
```

#### frontend/src/hooks/useProvidersPage.ts

**Purpose**: Encapsulates all logic for the Providers page.

**Key Features**:
- Fetches and displays providers list
- Handles provider switching
- Auto-updates active model when switching providers
- Shows toast notifications for actions
- Manages loading state

```typescript
import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { providersService } from '@/services/providers.service';
import { modelsService } from '@/services/models.service';
import type { Provider } from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeProvider = (settings.active_provider as string) || '';
  const activeModel = (settings.active_model as string) || '';

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await providersService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      useAlertStore.showAlert('Failed to load providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSwitch = async (providerId: string) => {
    try {
      // Switch the provider
      await providersService.switchProvider(providerId);

      // After switching, check if current active_model is still available
      if (providerRouterUrl) {
        try {
          const availableModels = await modelsService.getAvailableModels(providerRouterUrl);
          const modelIds = availableModels.map(m => m.id);

          // If current active model is not in the new provider's models, select the first one
          if (activeModel && !modelIds.includes(activeModel)) {
            if (availableModels.length > 0) {
              const firstModel = availableModels[0].id;
              await useSettingsStore.getState().updateSetting('active_model', firstModel);
              useAlertStore.showAlert(`Auto-selected model: ${firstModel}`, 'info');
            } else {
              useAlertStore.showAlert('No models available from new provider', 'warning');
            }
          }
        } catch (error) {
          console.error('Failed to check/update model after provider switch:', error);
          // Don't show error toast - provider switch was successful
        }
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      useAlertStore.showAlert('Failed to switch provider', 'error');
    }
  };

  const handleProviderClick = (providerId: string) => {
    console.log('Provider clicked:', providerId);
    useAlertStore.showAlert(`Selected provider: ${providerId}`, 'success');
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    activeProvider,
    loading,
    handleProviderSwitch,
    handleProviderClick,
  };
}
```

#### frontend/src/hooks/useModelsPage.ts

**Purpose**: Encapsulates all logic for the Models page.

**Key Features**:
- Fetches available models (from Provider Router) and all models (from API Server)
- Manages dual-tab view (available vs. all models)
- Provides filtering by capability and provider
- Auto-selects default model if none set
- Handles model selection with settings update

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import type { Model, CapabilityFilter } from '@/types/models.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useModelsPage() {
  const [availableModels, setAvailableModels] = useState<Model[]>([]); // From Provider Router
  const [allModels, setAllModels] = useState<Model[]>([]); // From API Server
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || '';

  // Fetch available models from Provider Router
  const fetchAvailableModels = async () => {
    if (!providerRouterUrl) return;

    setLoadingAvailable(true);
    try {
      const data = await modelsService.getAvailableModels(providerRouterUrl);
      setAvailableModels(data);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      useAlertStore.showAlert('Failed to load available models', 'error');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Fetch all models from API Server
  const fetchAllModels = async () => {
    setLoadingAll(true);
    try {
      const data = await modelsService.getModels();
      setAllModels(data);
    } catch (error) {
      console.error('Failed to fetch all models:', error);
      useAlertStore.showAlert('Failed to load all models', 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  // Extract unique providers from all models
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    allModels.forEach((model) => {
      const parsed = modelsService.parseModel(model);
      providerSet.add(parsed.provider);
    });
    return Array.from(providerSet).sort();
  }, [allModels]);

  // Filter all models based on selected filters (for second tab)
  const filteredAllModels = useMemo(() => {
    return allModels.filter((model) => {
      const parsed = modelsService.parseModel(model);

      // Provider filter
      if (providerFilter !== 'all' && parsed.provider !== providerFilter) {
        return false;
      }

      // Capability filter
      if (capabilityFilter !== 'all') {
        const hasCapability = parsed.capabilities.some((cap) => {
          if (capabilityFilter === 'chat') return cap === 'chat' || cap === 'completion';
          if (capabilityFilter === 'vision') return cap === 'vision' || cap.includes('vl');
          if (capabilityFilter === 'tool-call') return cap === 'tools' || cap === 'tool-call';
          return false;
        });
        if (!hasCapability) return false;
      }

      return true;
    });
  }, [allModels, capabilityFilter, providerFilter]);

  const handleModelSelect = async (modelId: string) => {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_model', modelId);
    } catch (error) {
      console.error('Failed to select model:', error);
      useAlertStore.showAlert('Failed to select model', 'error');
    }
  };

  const handleModelClick = (modelId: string) => {
    console.log('Model clicked:', modelId);
    useAlertStore.showAlert(`Selected model: ${modelId}`, 'success');
  };

  const handleClearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([fetchAvailableModels(), fetchAllModels()]);

      // If no active model is set and we have available models, auto-select the first one
      if (!activeModel && providerRouterUrl) {
        try {
          const models = await modelsService.getAvailableModels(providerRouterUrl);
          if (models.length > 0) {
            const firstModel = models[0].id;
            await useSettingsStore.getState().updateSetting('active_model', firstModel);
            useAlertStore.showAlert(`Auto-selected default model: ${firstModel}`, 'info');
          }
        } catch (error) {
          console.error('Failed to auto-select default model:', error);
        }
      }
    };

    loadModels();
  }, [providerRouterUrl]);

  return {
    availableModels,
    allModels,
    filteredAllModels,
    activeModel,
    loadingAvailable,
    loadingAll,
    providers,
    capabilityFilter,
    providerFilter,
    handleModelSelect,
    handleModelClick,
    handleClearFilters,
    setCapabilityFilter,
    setProviderFilter,
    fetchAvailableModels,
    fetchAllModels,
  };
}
```

#### frontend/src/hooks/useSettingsPage.ts

**Purpose**: Encapsulates all logic for the Settings page.

**Key Features**:
- Manages theme, sidebar position, and status messages settings
- Simple wrapper around UIStore actions
- Provides handlers for settings changes

```typescript
import { useUIStore } from '@/stores/useUIStore';

export function useSettingsPage() {
  const { uiState, toggleTheme, toggleSidebarPosition, toggleShowStatusMessages } = useUIStore();

  // Appearance handlers
  const handleThemeChange = (value: string) => {
    if (value) toggleTheme();
  };

  const handleSidebarPositionChange = (value: string) => {
    if (value) toggleSidebarPosition();
  };

  const handleStatusMessagesChange = (value: string) => {
    if (!value) return;
    const shouldShow = value === 'show';
    if (shouldShow !== uiState.showStatusMessages) {
      toggleShowStatusMessages();
    }
  };

  return {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
  };
}
```

#### frontend/src/hooks/useChatPage.ts

**Purpose**: Encapsulates all logic for the Chat page (placeholder for future implementation).

**Key Features**:
- Manages chat conversations and messages
- Handles message sending
- Provides new chat creation
- Placeholder for future chat history implementation

```typescript
import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';

export function useChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>('');

  const handleConversationClick = (conversationId: string) => {
    console.log('Conversation clicked:', conversationId);
    setSelectedConversation(conversationId);
    useAlertStore.showAlert(`Opened conversation: ${conversationId}`, 'success');
  };

  const handleNewChat = () => {
    console.log('Creating new chat');
    useAlertStore.showAlert('New chat created', 'success');
  };

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    setMessageText('');
    useAlertStore.showAlert('Message sent', 'success');
  };

  // Example: Fetch chat history would go here
  useEffect(() => {
    // TODO: Fetch conversations from API
  }, []);

  return {
    selectedConversation,
    messageText,
    handleConversationClick,
    handleNewChat,
    handleSendMessage,
    setMessageText,
  };
}
```

#### frontend/src/hooks/useApiGuidePage.ts

**Purpose**: Encapsulates all logic for the API Guide page.

**Key Features**:
- Provides base URL and port from proxy status
- Handles copying URLs and code examples
- Shows toast notifications for clipboard actions

```typescript
import { useState } from 'react';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';

export function useApiGuidePage() {
  const proxyStatus = useProxyStore((state) => state.status);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const port = proxyStatus?.providerRouter?.port || 3001;
  const baseUrl = `http://localhost:${port}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(`${baseUrl}/v1`);
    setCopiedUrl(true);
    useAlertStore.showAlert('Base URL copied to clipboard', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCode = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code);
    useAlertStore.showAlert(`${label} copied to clipboard`, 'success');
  };

  return {
    baseUrl,
    port,
    copiedUrl,
    handleCopyUrl,
    handleCopyCode,
  };
}
```

#### frontend/src/hooks/useBrowserGuidePage.ts

**Purpose**: Encapsulates all logic for the Browser Guide page.

**Key Features**:
- Currently no state needed (static content)
- Placeholder for future interactive guide features

```typescript
export function useBrowserGuidePage() {
  // No state needed for now - just static guide content
  return {};
}
```

#### frontend/src/hooks/useDesktopGuidePage.ts

**Purpose**: Encapsulates all logic for the Desktop Guide page.

**Key Features**:
- Currently no state needed (static content)
- Placeholder for future interactive guide features

```typescript
export function useDesktopGuidePage() {
  // No state needed for now - just static guide content
  return {};
}
```

#### frontend/src/hooks/useCustomChat.ts

**Purpose**: Provides custom chat interface with manual prompt input.

**Key Features**:
- Manages prompt, response, and loading state
- Sends chat request to Provider Router
- Handles keyboard shortcuts (Enter to send)
- Parses response into thinking and main response sections

```typescript
import { useState } from 'react';
import { chatService } from '@/services/chatService';

export function useCustomChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (providerRouterUrl: string, model: string) => {
    if (!prompt.trim() || !providerRouterUrl) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await chatService.sendChatRequest(providerRouterUrl, model, prompt);
      setResponse(result);
    } catch (error) {
      console.error('Failed to send chat:', error);
      setResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>, providerRouterUrl: string, model: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(providerRouterUrl, model);
    }
  };

  const parsedResponse = chatService.parseResponse(response);

  return {
    prompt,
    setPrompt,
    response,
    loading,
    handleSend,
    handleKeyPress,
    thinking: parsedResponse.thinking,
    mainResponse: parsedResponse.mainResponse,
  };
}
```

---

## Summary

### Phase 6: State Management Layer

**Files Created**: 6 Zustand stores

**Key Patterns**:
- Zustand for state management (lightweight, no boilerplate)
- Persist middleware for cross-platform persistence (localStorage/electron-store)
- WebSocket integration for real-time updates
- Optimistic updates with rollback on error
- Toast notifications for user feedback

**Store Responsibilities**:
- `useUIStore`: Theme, sidebar, routing, status messages
- `useSettingsStore`: Server settings, active provider/model
- `useCredentialsStore`: Qwen credentials state
- `useProxyStore`: Proxy status, WebSocket events consolidation
- `useLifecycleStore`: Proxy lifecycle state machine
- `useAlertStore`: Toast notifications wrapper

### Phase 7: Hooks Layer

**Files Created**: 18 custom React hooks

**Key Patterns**:
- Single Responsibility: Each hook has one clear purpose
- Composition: Page hooks compose domain hooks
- Clean APIs: Return only what components need
- Proper cleanup: useEffect cleanup for subscriptions
- Error handling: Try/catch with user feedback

**Hook Categories**:
- **Core Hooks (6)**: Dark mode, WebSocket, Toast, Extension detection, Chat testing
- **Domain Hooks (3)**: Providers, Models, Credentials management
- **Page Hooks (9)**: One hook per page encapsulating all page logic

**Integration Points**:
- All hooks use stores for state access
- Page hooks compose domain hooks for complex operations
- WebSocket hook updates proxy store with real-time events
- Alert store used throughout for toast notifications

---

**Document Version**: 1.0
**Date**: 2025-11-08
**Implementation Plan Reference**: [01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md](./01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md)
**Status**: Complete and Ready for Use
