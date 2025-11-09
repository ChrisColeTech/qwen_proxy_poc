# Frontend V3 Code Documentation: Phases 6-7

**State Management and Hooks Layer**

This document contains the complete verbatim source code for Phases 6 and 7 of the Frontend V3 Rewrite Implementation Plan.

## Quick Navigation

- [Phase 6: State Management Layer](#phase-6-state-management-layer)
  - [UI & Settings Stores](#ui--settings-stores)
  - [Domain Stores](#domain-stores)
- [Phase 7: Hooks Layer](#phase-7-hooks-layer)
  - [Core Hooks](#core-hooks)
  - [Page-Specific Hooks](#page-specific-hooks)

---

## Phase 6: State Management Layer

Phase 6 implements Zustand stores for application state management, including UI state, settings, credentials, proxy status, lifecycle, and alerts.

### UI & Settings Stores

#### src/stores/useUIStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useUIStore.ts` (259 lines)

```typescript
import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  currentRoute: string;
  activeTab: Record<string, string>; // page route -> active tab
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setShowStatusMessages: (show: boolean) => void;
  toggleShowStatusMessages: () => void;
  setShowStatusBar: (show: boolean) => void;
  toggleShowStatusBar: () => void;
  setStatusMessage: (message: string) => void;
  setCurrentRoute: (route: string) => void;
  setActiveTab: (page: string, tab: string) => void;
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

async function saveActiveTab(activeTab: Record<string, string>) {
  const electron = isElectron();
  if (electron && window.electronAPI) {
    await window.electronAPI.settings.set('activeTab', activeTab);
  } else {
    localStorage.setItem('qwen-proxy-active-tab', JSON.stringify(activeTab));
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

async function loadActiveTab(): Promise<Record<string, string>> {
  const electron = isElectron();
  if (electron && window.electronAPI) {
    const tabs = await window.electronAPI.settings.get('activeTab') as Record<string, string> | null;
    return tabs || {};
  } else {
    try {
      const stored = localStorage.getItem('qwen-proxy-active-tab');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }
}

async function loadUIState(): Promise<UIState> {
  const electron = isElectron();
  // Default: show status bar in Electron, hide on web
  const defaults: UIState = {
    theme: 'dark',
    sidebarPosition: 'left',
    showStatusMessages: true,
    showStatusBar: !!electron
  };

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
    showStatusBar: !!isElectron(),
  },
  statusMessage: 'Ready',
  currentRoute: '/',
  activeTab: {},
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
  setShowStatusBar: async (show) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, showStatusBar: show };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status bar:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleShowStatusBar: async () => {
    const currentState = get().uiState;
    const newValue = !currentState.showStatusBar;
    const newState: UIState = { ...currentState, showStatusBar: newValue };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status bar toggle:', error);
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
  setActiveTab: async (page, tab) => {
    const currentActiveTab = get().activeTab;
    const newActiveTab = { ...currentActiveTab, [page]: tab };
    set({ activeTab: newActiveTab });
    try {
      await saveActiveTab(newActiveTab);
    } catch (error) {
      console.error('[UIStore] Failed to save active tab:', error);
    }
  },
  loadSettings: async () => {
    try {
      const uiState = await loadUIState();
      const currentRoute = await loadCurrentRoute();
      const activeTab = await loadActiveTab();
      console.log('[UIStore] Settings loaded successfully:', uiState, 'route:', currentRoute, 'tabs:', activeTab);
      set({ uiState, currentRoute, activeTab });
    } catch (error) {
      console.error('[UIStore] Failed to load settings:', error);
    }
  },
}));
```

#### src/stores/useSettingsStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useSettingsStore.ts` (72 lines)

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

### Domain Stores

#### src/stores/useCredentialsStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useCredentialsStore.ts` (17 lines)

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

#### src/stores/useProxyStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useProxyStore.ts` (228 lines)

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

// Track if we're in a server shutdown to suppress cascade toasts
let isServerShuttingDown = false;
let shutdownTimeout: ReturnType<typeof setTimeout> | null = null;

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
        // Clear shutdown flag when reconnecting
        isServerShuttingDown = false;
        if (shutdownTimeout) {
          clearTimeout(shutdownTimeout);
          shutdownTimeout = null;
        }
      } else {
        // API disconnected - this is the root cause, set shutdown flag
        isServerShuttingDown = true;
        useAlertStore.showAlert('API Server disconnected', 'error');

        // Clear shutdown flag after 2 seconds (allow time for cascade events to be suppressed)
        if (shutdownTimeout) clearTimeout(shutdownTimeout);
        shutdownTimeout = setTimeout(() => {
          isServerShuttingDown = false;
        }, 2000);
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
        // Suppress extension disconnect toast if server is shutting down (cascade failure)
        if (!isServerShuttingDown) {
          useAlertStore.showAlert('Chrome Extension disconnected', 'error');
        }
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
        // Suppress credentials invalid toast if server is shutting down (cascade failure)
        if (!isServerShuttingDown) {
          useAlertStore.showAlert('Credentials expired or invalid', 'error');
        }
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

    // Handle both formats: {providers: [...]} and {items: [...], total: N, enabled: N}
    const providers = event.providers || (event as any).items || [];
    const total = (event as any).total ?? providers.length;
    const enabled = (event as any).enabled ?? providers.filter((p: any) => p.enabled).length;

    return {
      wsProxyStatus: {
        ...state.wsProxyStatus,
        providers: {
          items: providers,
          total,
          enabled,
        },
      },
      lastUpdate: Date.now(),
    };
  }),
  updateFromModels: (event) => set((state) => {
    if (!state.wsProxyStatus) return state;

    // Handle both formats: {models: [...]} and {items: [...], total: N}
    const models = event.models || (event as any).items || [];
    const total = (event as any).total ?? models.length;

    return {
      wsProxyStatus: {
        ...state.wsProxyStatus,
        models: {
          items: models,
          total,
        },
      },
      lastUpdate: Date.now(),
    };
  }),
  updateFromLifecycle: (event) => {
    // Check if event has new lifecycle object format
    if (!(event as any).lifecycle) {
      console.warn('[ProxyStore] Lifecycle event missing lifecycle object');
      return;
    }

    const lifecycle = (event as any).lifecycle;

    // Format lifecycle messages for display (V1 style - concise)
    const formatMessage = (state: string, port: number | null, error: string | null) => {
      switch (state) {
        case 'starting':
          return `Starting :${port}`;
        case 'running':
          return `Running :${port}`;
        case 'stopping':
          return 'Stopping';
        case 'stopped':
          return 'Stopped';
        case 'error':
          return error || 'Error';
        default:
          return '';
      }
    };

    // Determine lifecycle state
    const lifecycleState: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' =
      lifecycle.state === 'starting' ? 'starting' :
      lifecycle.state === 'running' ? 'running' :
      lifecycle.state === 'stopping' ? 'stopping' :
      lifecycle.state === 'stopped' ? 'stopped' :
      lifecycle.state === 'error' ? 'error' : 'idle';

    const message = formatMessage(lifecycle.state, lifecycle.port, lifecycle.error);

    // Update lifecycle store and show toast notifications
    if (lifecycleState === 'error' && lifecycle.error) {
      useLifecycleStore.getState().setError(lifecycle.error);
      useAlertStore.showAlert(lifecycle.error, 'error');
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

#### src/stores/useLifecycleStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useLifecycleStore.ts` (22 lines)

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

#### src/stores/useAlertStore.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useAlertStore.ts` (70 lines)

```typescript
import { toast } from '@/hooks/useToast';

interface AlertStore {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// Toast queue to stagger multiple toasts with proper delays
let pendingToasts: Array<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }> = [];
let queueTimeout: ReturnType<typeof setTimeout> | null = null;
let lastToastMessage: string | null = null;
let lastToastTime: number = 0;
const TOAST_STAGGER_DELAY = 300; // 300ms delay between toasts
const DUPLICATE_SUPPRESS_WINDOW = 1000; // Suppress duplicate messages within 1 second

const scheduleNextToast = () => {
  // Clear any existing timeout
  if (queueTimeout) {
    clearTimeout(queueTimeout);
    queueTimeout = null;
  }

  // If queue is empty, we're done
  if (pendingToasts.length === 0) {
    return;
  }

  // Get the next toast from the queue
  const nextToast = pendingToasts.shift()!;

  // Show the toast
  const { dismiss } = toast({
    description: nextToast.message,
    variant: nextToast.type === 'error' ? 'destructive' : 'default',
  });

  // Track last toast for deduplication
  lastToastMessage = nextToast.message;
  lastToastTime = Date.now();

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    dismiss();
  }, 3000);

  // Schedule the next toast if there are more in the queue
  if (pendingToasts.length > 0) {
    queueTimeout = setTimeout(scheduleNextToast, TOAST_STAGGER_DELAY);
  }
};

export const useAlertStore = {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Deduplicate: skip if same message was shown within the suppression window
    const now = Date.now();
    if (lastToastMessage === message && (now - lastToastTime) < DUPLICATE_SUPPRESS_WINDOW) {
      return;
    }

    const isFirstToast = pendingToasts.length === 0;

    // Add to queue
    pendingToasts.push({ message, type });

    // If this is the first toast, show it immediately and start the queue
    if (isFirstToast) {
      scheduleNextToast();
    }
  },
} as AlertStore;
```

---

## Phase 7: Hooks Layer

Phase 7 creates custom React hooks that encapsulate all business logic for the application.

### Core Hooks

#### src/hooks/useDarkMode.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useDarkMode.ts` (16 lines)

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

#### src/hooks/useWebSocket.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useWebSocket.ts` (77 lines)

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

#### src/hooks/useToast.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useToast.ts` (195 lines)

```typescript
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
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

#### src/hooks/useExtensionDetection.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useExtensionDetection.ts` (25 lines)

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

#### src/hooks/useApiGuidePage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useApiGuidePage.ts` (32 lines)

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

#### src/hooks/useBrowserGuidePage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useBrowserGuidePage.ts` (5 lines)

```typescript
export function useBrowserGuidePage() {
  // No state needed for now - just static guide content
  return {};
}
```

### Page-Specific Hooks

#### src/hooks/useHomePage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useHomePage.ts` (121 lines)

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
    useAlertStore.showAlert('Starting proxy server...', 'info');
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
    useAlertStore.showAlert('Stopping proxy server...', 'info');
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
    console.log('[useHomePage] ⭐ handleQwenLogin called!');
    console.log('[useHomePage] isElectron():', isElectron());
    console.log('[useHomePage] window.electronAPI:', window.electronAPI);

    try {
      // Step 1: Delete old credentials first if they exist (for re-login)
      const hasCredentials = wsProxyStatus?.credentials?.expiresAt;
      if (hasCredentials) {
        useAlertStore.showAlert('Clearing old credentials...', 'success');
        await credentialsService.deleteCredentials();
      }

      // Step 2: Platform-specific login flow
      if (isElectron()) {
        console.log('[useHomePage] Running in Electron - calling electronAPI.qwen.openLogin()');
        // In Electron, call the IPC API to open the login window
        await window.electronAPI?.qwen.openLogin();
        console.log('[useHomePage] Login window closed');
        useAlertStore.showAlert('Credentials saved successfully!', 'success');
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
        error instanceof Error ? error.message : 'Failed to prepare login. Please try again.',
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

#### src/hooks/useProvidersPage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useProvidersPage.ts` (80 lines)

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
      // Switch the provider (settings store will show success toast)
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
              // Settings store will show the "Switched to model" toast
              await useSettingsStore.getState().updateSetting('active_model', firstModel);
            } else {
              useAlertStore.showAlert('No models available from new provider', 'warning');
            }
          }
        } catch (error) {
          console.error('Failed to check/update model after provider switch:', error);
          // Provider switch was successful, but couldn't fetch models from new provider
          useAlertStore.showAlert('Provider switched, but failed to fetch available models', 'warning');
        }
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      // Settings store already handles error display, don't show duplicate toast
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

#### src/hooks/useModelsPage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useModelsPage.ts` (218 lines)

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import { providersService } from '@/services/providers.service';
import type { Model, CapabilityFilter } from '@/types/models.types';
import type { Provider } from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useModelsPage() {
  const [availableModels, setAvailableModels] = useState<Model[]>([]); // From Provider Router
  const [allModels, setAllModels] = useState<Model[]>([]); // From API Server
  const [providersData, setProvidersData] = useState<Provider[]>([]); // Provider list
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search for select tab
  const [allModelsSearchQuery, setAllModelsSearchQuery] = useState<string>(''); // Search for all models tab
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || '';
  const activeProvider = (settings.active_provider as string) || '';

  // Fetch available models from Provider Router
  const fetchAvailableModels = async () => {
    if (!providerRouterUrl) return;

    setLoadingAvailable(true);
    try {
      const data = await modelsService.getAvailableModels(providerRouterUrl);
      const sorted = data.sort((a, b) => a.id.localeCompare(b.id));
      setAvailableModels(sorted);
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
      const sorted = data.sort((a, b) => a.id.localeCompare(b.id));
      setAllModels(sorted);
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

  // Filter available models based on search query
  const filteredAvailableModels = useMemo(() => {
    if (!searchQuery.trim()) return availableModels;

    const query = searchQuery.toLowerCase();
    return availableModels.filter((model) =>
      model.id.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query)
    );
  }, [availableModels, searchQuery]);

  // Filter all models based on selected filters (for second tab)
  const filteredAllModels = useMemo(() => {
    return allModels
      .map((model) => modelsService.parseModel(model))
      .filter((parsed) => {
        // Search filter
        if (allModelsSearchQuery.trim()) {
          const query = allModelsSearchQuery.toLowerCase();
          const matchesSearch = parsed.id.toLowerCase().includes(query) ||
                               parsed.description.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

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
  }, [allModels, capabilityFilter, providerFilter, allModelsSearchQuery]);

  const handleModelSelect = async (modelId: string) => {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_model', modelId);
    } catch (error) {
      console.error('Failed to select model:', error);
      useAlertStore.showAlert('Failed to select model', 'error');
    }
  };

  const handleClearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  const handleProviderSwitch = async (providerId: string) => {
    try {
      // Settings store will show success toast
      await useSettingsStore.getState().updateSetting('active_provider', providerId);
      // Clear old models before fetching new ones
      setAvailableModels([]);
      // Reload available models for the new provider
      await fetchAvailableModels();

      // After switching provider, check if we need to auto-select a model
      if (providerRouterUrl) {
        try {
          const models = await modelsService.getAvailableModels(providerRouterUrl);
          const modelIds = models.map(m => m.id);

          // If current active model is not in the new provider's models, select the first one
          if (!activeModel || !modelIds.includes(activeModel)) {
            if (models.length > 0) {
              const firstModel = models[0].id;
              await useSettingsStore.getState().updateSetting('active_model', firstModel);
              useAlertStore.showAlert(`Auto-selected model: ${firstModel}`, 'info');
            }
          }
        } catch (error) {
          console.error('Failed to auto-select model after provider switch:', error);
        }
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      // Keep models cleared on error
      setAvailableModels([]);
      useAlertStore.showAlert('Failed to switch provider', 'error');
    }
  };

  // Fetch providers list
  const fetchProviders = async () => {
    try {
      const data = await providersService.getProviders();
      setProvidersData(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([fetchAvailableModels(), fetchAllModels(), fetchProviders()]);

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
    filteredAvailableModels,
    allModels,
    filteredAllModels,
    activeModel,
    activeProvider,
    providersData,
    loadingAvailable,
    loadingAll,
    providers,
    capabilityFilter,
    providerFilter,
    searchQuery,
    allModelsSearchQuery,
    handleModelSelect,
    handleProviderSwitch,
    handleClearFilters,
    setCapabilityFilter,
    setProviderFilter,
    setSearchQuery,
    setAllModelsSearchQuery,
    fetchAvailableModels,
    fetchAllModels,
  };
}
```

#### src/hooks/useSettingsPage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useSettingsPage.ts` (39 lines)

```typescript
import { useUIStore } from '@/stores/useUIStore';

export function useSettingsPage() {
  const { uiState, toggleTheme, toggleSidebarPosition, toggleShowStatusMessages, toggleShowStatusBar } = useUIStore();

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

  const handleStatusBarChange = (value: string) => {
    if (!value) return;
    const shouldShow = value === 'show';
    if (shouldShow !== uiState.showStatusBar) {
      toggleShowStatusBar();
    }
  };

  return {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
    handleStatusBarChange,
  };
}
```

#### src/hooks/useDesktopGuidePage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useDesktopGuidePage.ts` (5 lines)

```typescript
export function useDesktopGuidePage() {
  // No state needed for now - just static guide content
  return {};
}
```

#### src/hooks/useModelFormPage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useModelFormPage.ts` (82 lines)

```typescript
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import { providersService } from '@/services/providers.service';
import type { ModelDetails } from '@/types/models.types';

export function useModelFormPage() {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = decodeURIComponent(pathParts[2]);

  const [model, setModel] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingDefault, setSettingDefault] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await modelsService.getModelDetails(id);
        setModel(data);
      } catch (error) {
        console.error('Failed to load model:', error);
        setCurrentRoute('/models');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadModel();
    }
  }, [id, setCurrentRoute]);

  const handleSetAsDefault = async () => {
    if (!model || !model.providers || model.providers.length === 0) {
      useAlertStore.showAlert('No providers linked to this model', 'error');
      return;
    }

    setSettingDefault(true);
    try {
      // Set this model as default for all linked providers
      const updatePromises = model.providers.map(async (provider) => {
        try {
          await providersService.updateProviderConfig(provider.id, { defaultModel: model.id });
        } catch (error) {
          console.error(`Failed to update provider ${provider.name}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);

      useAlertStore.showAlert(
        `Set ${model.name} as default for ${model.providers.length} provider(s)`,
        'success'
      );
    } catch (error) {
      console.error('Failed to set model as default:', error);
      useAlertStore.showAlert('Failed to set model as default', 'error');
    } finally {
      setSettingDefault(false);
    }
  };

  const handleBack = () => {
    setCurrentRoute('/models');
  };

  return {
    model,
    loading,
    settingDefault,
    handleSetAsDefault,
    handleBack
  };
}
```

#### src/hooks/useProviderFormPage.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useProviderFormPage.ts` (253 lines)

```typescript
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { providersService } from '@/services/providers.service';
import type { CreateProviderRequest, UpdateProviderRequest } from '@/types/providers.types';

interface ProviderFormData {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  description: string;
  config: Record<string, any>;
}

export function useProviderFormPage(_readOnly: boolean = false) {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = pathParts[2] !== 'new' ? pathParts[2] : undefined;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProviderFormData>({
    id: '',
    name: '',
    type: '',
    enabled: true,
    priority: 100, // Default priority
    description: '',
    config: {
      timeout: 30000 // Default timeout 30 seconds
    }
  });

  // Load provider data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const loadProvider = async () => {
        try {
          const provider = await providersService.getProviderDetails(id);
          setFormData({
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            priority: provider.priority,
            description: provider.description || '',
            config: provider.config || {}
          });
        } catch (error) {
          console.error('Failed to load provider:', error);
          useAlertStore.showAlert('Failed to load provider', 'error');
          setCurrentRoute('/providers');
        }
      };
      loadProvider();
    }
  }, [isEditMode, id, setCurrentRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && id) {
        // Update existing provider - preserve all existing data including hidden fields
        const updateData: UpdateProviderRequest = {
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority, // Preserve existing priority
          description: formData.description || null
        };
        await providersService.updateProvider(id, updateData);

        // Update config separately - this preserves all existing config values
        if (Object.keys(formData.config).length > 0) {
          await providersService.updateProviderConfig(id, formData.config);
        }

        useAlertStore.showAlert('Provider updated successfully', 'success');
      } else {
        // Create new provider - auto-generate ID from name
        const generatedId = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const createData: CreateProviderRequest = {
          id: generatedId,
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority || 100, // Default to 100 if not set
          description: formData.description || null,
          config: {
            ...formData.config,
            timeout: formData.config.timeout || 30000 // Ensure timeout has default
          }
        };
        await providersService.createProvider(createData);
        useAlertStore.showAlert('Provider created successfully', 'success');
      }

      setCurrentRoute('/providers');
    } catch (error: any) {
      console.error('Failed to save provider:', error);
      useAlertStore.showAlert(error.message || 'Failed to save provider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!id) {
      useAlertStore.showAlert('Save the provider first before testing', 'warning');
      return;
    }

    setTesting(true);
    try {
      await providersService.testConnection(id);
      useAlertStore.showAlert('Connection test successful', 'success');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const handleReset = () => {
    if (isEditMode && id) {
      // Reset to original loaded data - reload the provider
      const reloadProvider = async () => {
        try {
          const provider = await providersService.getProviderDetails(id);
          setFormData({
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            priority: provider.priority,
            description: provider.description || '',
            config: provider.config || {}
          });
        } catch (error) {
          console.error('Failed to reload provider:', error);
        }
      };
      reloadProvider();
    } else {
      // Reset to empty form for new provider
      setFormData({
        id: '',
        name: '',
        type: '',
        enabled: true,
        priority: 100,
        description: '',
        config: {
          timeout: 30000
        }
      });
    }
  };

  const handleToggleEnabled = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await providersService.toggleEnabled({ ...formData, created_at: 0, updated_at: 0 } as any);
      useAlertStore.showAlert(
        `Provider ${formData.enabled ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
      // Reload provider data
      const provider = await providersService.getProviderDetails(id);
      setFormData({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled,
        priority: provider.priority,
        description: provider.description || '',
        config: provider.config || {}
      });
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to toggle provider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(`Are you sure you want to delete provider "${formData.name}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await providersService.deleteProvider(id);
      useAlertStore.showAlert('Provider deleted successfully', 'success');
      setCurrentRoute('/providers');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to delete provider', 'error');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentRoute('/providers');
  };

  const handleEdit = () => {
    if (id) {
      setCurrentRoute(`/providers/${id}/edit`);
    }
  };

  return {
    id,
    isEditMode,
    loading,
    testing,
    formData,
    setFormData,
    handleSubmit,
    handleTest,
    handleConfigChange,
    handleReset,
    handleToggleEnabled,
    handleDelete,
    handleBack,
    handleEdit
  };
}
```

---

## Summary

This document contains the complete verbatim source code for **Phase 6 (State Management)** and **Phase 7 (Hooks)** of the Frontend V3 implementation.

**Phase 6 - State Management Layer (6 stores):**
- `useUIStore.ts` - UI state with localStorage/electron-store persistence (259 lines)
- `useSettingsStore.ts` - Application settings management (72 lines)
- `useCredentialsStore.ts` - Credentials state (17 lines)
- `useProxyStore.ts` - Proxy server state with WebSocket sync (228 lines)
- `useLifecycleStore.ts` - Application lifecycle state (22 lines)
- `useAlertStore.ts` - Toast notifications with auto-dismiss (70 lines)

**Phase 7 - Hooks Layer (13 hooks):**

**Core Hooks (6 files):**
- `useDarkMode.ts` - Theme management (16 lines)
- `useWebSocket.ts` - WebSocket connection management (77 lines)
- `useToast.ts` - Toast notifications interface (195 lines)
- `useExtensionDetection.ts` - Browser extension detection (25 lines)
- `useApiGuidePage.ts` - API guide logic (32 lines)
- `useBrowserGuidePage.ts` - Browser guide logic (5 lines)

**Page-Specific Hooks (7 files):**
- `useHomePage.ts` - Home page logic (121 lines)
- `useProvidersPage.ts` - Providers page logic (80 lines)
- `useModelsPage.ts` - Models page logic (218 lines)
- `useSettingsPage.ts` - Settings page logic (39 lines)
- `useDesktopGuidePage.ts` - Desktop guide logic (5 lines)
- `useModelFormPage.ts` - Model form logic (82 lines)
- `useProviderFormPage.ts` - Provider form logic (253 lines)

**Total Lines of Code:** 1,816 lines across 19 files

All hooks follow the architecture pattern of encapsulating business logic and returning clean APIs for components to consume.
