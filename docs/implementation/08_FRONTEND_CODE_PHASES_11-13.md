# Frontend V3 Rewrite - Phases 11-13 Code Documentation

This document contains the complete, verbatim source code for **Phases 11, 12, and 13** of the Frontend V3 Rewrite Implementation Plan.

## Table of Contents

- [Phase 11: State Management (Stores)](#phase-11-state-management-stores)
- [Phase 12: Pages](#phase-12-pages)
- [Phase 13: Application Entry & Routing](#phase-13-application-entry--routing)
- [Phase 14: Styling System](#phase-14-styling-system)

---

## Phase 11: State Management (Stores)

**Priority**: P1 (Can start after Phase 5 complete)

This phase implements all Zustand stores for global state management with proper typing and persistence.

### src/stores/useUIStore.ts

**File**: `frontend/src/stores/useUIStore.ts` (259 lines)

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

---

### src/stores/useSettingsStore.ts

**File**: `frontend/src/stores/useSettingsStore.ts` (72 lines)

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

---

### src/stores/useCredentialsStore.ts

**File**: `frontend/src/stores/useCredentialsStore.ts` (17 lines)

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

---

### src/stores/useProxyStore.ts

**File**: `frontend/src/stores/useProxyStore.ts` (228 lines)

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

---

### src/stores/useLifecycleStore.ts

**File**: `frontend/src/stores/useLifecycleStore.ts` (22 lines)

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

---

### src/stores/useAlertStore.ts

**File**: `frontend/src/stores/useAlertStore.ts` (70 lines)

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

## Phase 12: Pages

**Priority**: P1 (Can start after Phases 7, 8, 9, 10, 11 complete)

This phase implements all main application pages following the architecture pattern.

### src/pages/HomePage.tsx

**File**: `frontend/src/pages/HomePage.tsx` (102 lines)

```typescript
import { Activity } from 'lucide-react';
import { TabCard } from '@/components/ui/tab-card';
import { ActionList } from '@/components/ui/action-list';
import { useHomePage } from '@/hooks/useHomePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { StatusTab } from '@/components/features/home/StatusTab';
import {
  buildOverviewActions,
  HOME_TABS,
  HOME_TITLE,
  SYSTEM_OVERVIEW_TITLE,
  SYSTEM_OVERVIEW_ICON
} from '@/constants/home.constants';

export function HomePage() {
  const {
    wsProxyStatus,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();
  const { extensionDetected, needsExtension } = useExtensionDetection();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const settings = useSettingsStore((state) => state.settings);

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;
  const activeProvider = settings.active_provider as string || 'None';
  const activeModel = settings.active_model as string || 'None';

  const handleProxyClick = () => {
    if (proxyLoading) return;
    if (running) {
      handleStopProxy();
    } else {
      handleStartProxy();
    }
  };

  const handleExtensionClick = () => {
    setCurrentRoute('/browser-guide');
  };

  const overviewActions = buildOverviewActions({
    extensionDetected,
    needsExtension,
    credentialsValid,
    expiresAt,
    running,
    port,
    uptime,
    lifecycleState,
    proxyLoading,
    handleExtensionClick,
    handleQwenLogin,
    handleProxyClick
  });

  const tabs = [
    {
      ...HOME_TABS.OVERVIEW,
      content: <ActionList title={SYSTEM_OVERVIEW_TITLE} icon={SYSTEM_OVERVIEW_ICON} items={overviewActions} />
    },
    {
      ...HOME_TABS.STATUS,
      content: (
        <StatusTab
          port={port}
          activeProvider={activeProvider}
          activeModel={activeModel}
          baseUrl={baseUrl}
          copiedUrl={copiedUrl}
          onCopyUrl={handleCopyUrl}
        />
      ),
      hidden: !running
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={HOME_TITLE}
        icon={Activity}
        tabs={tabs}
        defaultTab={HOME_TABS.OVERVIEW.value}
      />
    </div>
  );
}
```

---

### src/pages/ProvidersPage.tsx

**File**: `frontend/src/pages/ProvidersPage.tsx` (88 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ProviderSwitchTab } from '@/components/features/providers/ProviderSwitchTab';
import { AllProvidersTab } from '@/components/features/providers/AllProvidersTab';
import { ProviderTestWrapper } from '@/components/features/providers/ProviderTestWrapper';
import {
  buildProviderActions,
  buildProviderSwitchActions,
  PROVIDERS_TABS,
  PROVIDERS_TITLE,
  PROVIDERS_ICON
} from '@/constants/providers.constants';

export function ProvidersPage() {
  const {
    providers,
    activeProvider,
    handleProviderSwitch
  } = useProvidersPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleProviderClickNavigate = (providerId: string) => {
    // Navigate to provider details page
    setCurrentRoute(`/providers/${providerId}`);
  };

  const handleAddProvider = () => {
    // Navigate to create provider page
    setCurrentRoute('/providers/new');
  };

  const switchActions = buildProviderSwitchActions({
    providers,
    activeProvider,
    onSwitch: handleProviderSwitch
  });

  const providerActions = buildProviderActions({
    providers,
    activeProvider,
    handleProviderClick: handleProviderClickNavigate,
  });

  const provider = providers.find(p => p.id === activeProvider);
  const providerName = provider?.name || 'Unknown Provider';

  const tabs = [
    {
      ...PROVIDERS_TABS.SWITCH,
      content: <ProviderSwitchTab switchActions={switchActions} />
    },
    {
      ...PROVIDERS_TABS.ALL,
      content: (
        <AllProvidersTab
          providerActions={providerActions}
          onAddProvider={handleAddProvider}
        />
      )
    },
    {
      ...PROVIDERS_TABS.TEST,
      content: (
        <ProviderTestWrapper
          activeProvider={activeProvider}
          providerName={providerName}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={PROVIDERS_TITLE}
        icon={PROVIDERS_ICON}
        tabs={tabs}
        defaultTab={PROVIDERS_TABS.SWITCH.value}
        pageKey="/providers"
      />
    </div>
  );
}
```

---

### src/pages/ModelsPage.tsx

**File**: `frontend/src/pages/ModelsPage.tsx` (110 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { AllModelsTab } from '@/components/features/models/AllModelsTab';
import { ModelTestWrapper } from '@/components/features/models/ModelTestWrapper';
import {
  buildModelActions,
  buildModelSelectActions,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const {
    filteredAvailableModels,
    filteredAllModels,
    activeModel,
    activeProvider,
    providersData,
    providers,
    capabilityFilter,
    providerFilter,
    searchQuery,
    allModelsSearchQuery,
    handleModelSelect,
    handleProviderSwitch,
    setCapabilityFilter,
    setProviderFilter,
    setSearchQuery,
    setAllModelsSearchQuery
  } = useModelsPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleModelClickNavigate = (modelId: string) => {
    // Navigate to model details page
    setCurrentRoute(`/models/${encodeURIComponent(modelId)}`);
  };

  // Build action items for tabs
  const selectActions = buildModelSelectActions({
    models: filteredAvailableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  const modelActions = buildModelActions({
    models: filteredAllModels,
    activeModel,
    handleModelClick: handleModelClickNavigate,
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: (
        <ModelSelectTab
          selectActions={selectActions}
          activeProvider={activeProvider}
          providers={providersData}
          searchQuery={searchQuery}
          onProviderChange={handleProviderSwitch}
          onSearchChange={setSearchQuery}
        />
      )
    },
    {
      ...MODELS_TABS.ALL,
      content: (
        <AllModelsTab
          modelActions={modelActions}
          capabilityFilter={capabilityFilter}
          providerFilter={providerFilter}
          providers={providers}
          searchQuery={allModelsSearchQuery}
          onCapabilityChange={setCapabilityFilter}
          onProviderChange={setProviderFilter}
          onSearchChange={setAllModelsSearchQuery}
        />
      )
    },
    {
      ...MODELS_TABS.TEST,
      content: (
        <ModelTestWrapper
          activeModel={activeModel}
          activeProvider={activeProvider}
          providers={providersData}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.SELECT.value}
        pageKey="/models"
      />
    </div>
  );
}
```

---

### src/pages/SettingsPage.tsx

**File**: `frontend/src/pages/SettingsPage.tsx` (58 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import { AppearanceTab } from '@/components/features/settings/AppearanceTab';
import { ProxyTab } from '@/components/features/settings/ProxyTab';
import { DebugTab } from '@/components/features/settings/DebugTab';
import {
  SETTINGS_TABS,
  SETTINGS_TITLE,
  SETTINGS_ICON
} from '@/constants/settings.constants';

export function SettingsPage() {
  const {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
    handleStatusBarChange,
  } = useSettingsPage();

  const tabs = [
    {
      ...SETTINGS_TABS.APPEARANCE,
      content: (
        <AppearanceTab
          theme={uiState.theme}
          sidebarPosition={uiState.sidebarPosition}
          showStatusMessages={uiState.showStatusMessages}
          showStatusBar={uiState.showStatusBar}
          handleThemeChange={handleThemeChange}
          handleSidebarPositionChange={handleSidebarPositionChange}
          handleStatusMessagesChange={handleStatusMessagesChange}
          handleStatusBarChange={handleStatusBarChange}
        />
      )
    },
    {
      ...SETTINGS_TABS.PROXY,
      content: <ProxyTab />
    },
    {
      ...SETTINGS_TABS.DEBUG,
      content: <DebugTab />
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={SETTINGS_TITLE}
        icon={SETTINGS_ICON}
        tabs={tabs}
        defaultTab={SETTINGS_TABS.APPEARANCE.value}
      />
    </div>
  );
}
```

---

### src/pages/ChatPage.tsx

**File**: `frontend/src/pages/ChatPage.tsx` (45 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  buildCustomChatContent,
  buildCurlExamplesContent,
  CHAT_TABS,
  CHAT_TITLE,
  CHAT_ICON
} from '@/constants/chat.constants';

export function ChatPage() {
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || 'qwen3-max';

  const tabs = [
    {
      ...CHAT_TABS.CUSTOM,
      content: buildCustomChatContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    },
    {
      ...CHAT_TABS.CURL,
      content: buildCurlExamplesContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={CHAT_TITLE}
        icon={CHAT_ICON}
        tabs={tabs}
        defaultTab={CHAT_TABS.CUSTOM.value}
        pageKey="/chat"
      />
    </div>
  );
}
```

---

### src/pages/BrowserGuidePage.tsx

**File**: `frontend/src/pages/BrowserGuidePage.tsx` (47 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useProxyStore } from '@/stores/useProxyStore';
import { BrowserGuideTab } from '@/components/features/browserGuide/BrowserGuideTab';
import {
  BROWSER_GUIDE_TABS,
  BROWSER_GUIDE_TITLE,
  BROWSER_GUIDE_ICON
} from '@/constants/browserGuide.constants';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  useBrowserGuidePage();

  const { extensionDetected } = useExtensionDetection();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: (
        <BrowserGuideTab
          extensionInstalled={extensionDetected}
          credentialsValid={credentialsValid}
          proxyRunning={proxyRunning}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={BROWSER_GUIDE_TITLE}
        icon={BROWSER_GUIDE_ICON}
        tabs={tabs}
        defaultTab={BROWSER_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
```

---

### src/pages/DesktopGuidePage.tsx

**File**: `frontend/src/pages/DesktopGuidePage.tsx` (41 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useDesktopGuidePage } from '@/hooks/useDesktopGuidePage';
import { useProxyStore } from '@/stores/useProxyStore';
import { DesktopGuideTab } from '@/components/features/desktopGuide/DesktopGuideTab';
import {
  DESKTOP_GUIDE_TABS,
  DESKTOP_GUIDE_TITLE,
  DESKTOP_GUIDE_ICON
} from '@/constants/desktopGuide.constants';

export function DesktopGuidePage() {
  useDesktopGuidePage();

  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...DESKTOP_GUIDE_TABS.GUIDE,
      content: (
        <DesktopGuideTab
          credentialsValid={credentialsValid}
          proxyRunning={proxyRunning}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={DESKTOP_GUIDE_TITLE}
        icon={DESKTOP_GUIDE_ICON}
        tabs={tabs}
        defaultTab={DESKTOP_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
```

---

### src/pages/ModelFormPage.tsx

**File**: `frontend/src/pages/ModelFormPage.tsx` (57 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useModelFormPage } from '@/hooks/useModelFormPage';
import { ModelDetailsTab } from '@/components/features/modelForm/ModelDetailsTab';
import { ModelFormActions } from '@/components/features/modelForm/ModelFormActions';
import {
  MODEL_FORM_TABS,
  MODEL_FORM_TITLE,
  MODEL_FORM_ICON
} from '@/constants/modelForm.constants';

export function ModelFormPage() {
  const { model, loading, settingDefault, handleSetAsDefault, handleBack } = useModelFormPage();

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  const tabs = [
    {
      ...MODEL_FORM_TABS.DETAILS,
      content: <ModelDetailsTab model={model} />,
      contentCardTitle: MODEL_FORM_TABS.DETAILS.label,
      contentCardIcon: MODEL_FORM_ICON,
      contentCardActions: (
        <ModelFormActions
          model={model}
          settingDefault={settingDefault}
          onBack={handleBack}
          onSetAsDefault={handleSetAsDefault}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODEL_FORM_TITLE}
        icon={MODEL_FORM_ICON}
        tabs={tabs}
        defaultTab={MODEL_FORM_TABS.DETAILS.value}
        pageKey={`/models/${model.id}`}
      />
    </div>
  );
}
```

---

### src/pages/ProviderFormPage.tsx

**File**: `frontend/src/pages/ProviderFormPage.tsx` (87 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useProviderFormPage } from '@/hooks/useProviderFormPage';
import { ProviderFormContent } from '@/components/features/providerForm/ProviderFormContent';
import { ProviderFormActionsReadOnly } from '@/components/features/providerForm/ProviderFormActionsReadOnly';
import { ProviderFormActionsEdit } from '@/components/features/providerForm/ProviderFormActionsEdit';
import {
  PROVIDER_FORM_TABS,
  PROVIDER_FORM_TITLE_EDIT,
  PROVIDER_FORM_TITLE_CREATE,
  PROVIDER_FORM_ICON
} from '@/constants/providerForm.constants';

interface ProviderFormPageProps {
  readOnly?: boolean;
}

export function ProviderFormPage({ readOnly = false }: ProviderFormPageProps = {}) {
  const {
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
  } = useProviderFormPage(readOnly);

  const formContent = (
    <ProviderFormContent
      formData={formData}
      isEditMode={isEditMode}
      readOnly={readOnly}
      setFormData={setFormData}
      handleConfigChange={handleConfigChange}
      handleSubmit={handleSubmit}
    />
  );

  const actions = readOnly ? (
    <ProviderFormActionsReadOnly
      loading={loading}
      enabled={formData.enabled}
      handleBack={handleBack}
      handleToggleEnabled={handleToggleEnabled}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
    />
  ) : (
    <ProviderFormActionsEdit
      loading={loading}
      testing={testing}
      isEditMode={isEditMode}
      handleBack={handleBack}
      handleReset={handleReset}
      handleTest={handleTest}
      handleSubmit={handleSubmit}
    />
  );

  const tabs = [
    {
      ...PROVIDER_FORM_TABS.FORM,
      content: formContent,
      contentCardTitle: PROVIDER_FORM_TABS.FORM.label,
      contentCardIcon: PROVIDER_FORM_ICON,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={isEditMode ? PROVIDER_FORM_TITLE_EDIT : PROVIDER_FORM_TITLE_CREATE}
        icon={PROVIDER_FORM_ICON}
        tabs={tabs}
        defaultTab={PROVIDER_FORM_TABS.FORM.value}
      />
    </div>
  );
}
```

---

## Phase 13: Application Entry & Routing

**Priority**: P1 (Depends on Phase 12 complete)

This phase implements the application initialization and routing system.

### src/App.tsx

**File**: `frontend/src/App.tsx` (80 lines)

```typescript
import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ProviderFormPage } from '@/pages/ProviderFormPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { ModelFormPage } from '@/pages/ModelFormPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level
  const currentRoute = useUIStore((state) => state.currentRoute);
  const loadSettings = useUIStore((state) => state.loadSettings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  // Load persisted UI state and settings on mount
  useEffect(() => {
    loadSettings();
    fetchSettings();
  }, [loadSettings, fetchSettings]);

  const renderPage = () => {
    // Handle provider routes with IDs
    if (currentRoute.startsWith('/providers/')) {
      const path = currentRoute.substring('/providers/'.length);
      if (path === 'new') {
        return <ProviderFormPage />;
      } else if (path.endsWith('/edit')) {
        return <ProviderFormPage />;
      } else {
        return <ProviderFormPage readOnly={true} />;
      }
    }

    // Handle model routes with IDs
    if (currentRoute.startsWith('/models/')) {
      return <ModelFormPage />;
    }

    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      case '/chat':
        return <ChatPage />;
      case '/settings':
        return <SettingsPage />;
      case '/browser-guide':
        return <BrowserGuidePage />;
      case '/desktop-guide':
        return <DesktopGuidePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <AppLayout>
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}

export default App;
```

---

### src/main.tsx

**File**: `frontend/src/main.tsx` (7 lines)

```typescript
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
```

---

## Phase 14: Styling System

**Priority**: P1 (Can be done in parallel with components)

This phase implements the complete CSS architecture using Tailwind CSS with custom styles organized by layer.

### src/index.css

**File**: `frontend/src/index.css` (50 lines)

```css
/* Import custom component styles first */
@import './styles/icons.css';
@import './styles/home.css';
@import './styles/providers.css';
@import './styles/models.css';
@import './styles/credentials.css';
/* ============================================================================
   QWEN PROXY - MAIN STYLESHEET
   Architecture: Modular CSS organized by layer
   ============================================================================ */

/* IMPORTANT: All @import must come before @tailwind and any other CSS */

/* Base Styles - Theme variables and global resets */
@import './styles/base/theme.css';

/* Utility Classes - Common utilities used across the app */
@import './styles/utilities/common.css';

/* Layout Styles - Core layout components */
@import './styles/layout.css';

/* Page Styles - Page-level styling */
@import './styles/pages.css';
@import './styles/pages/providers.css';
@import './styles/pages/quick-guide.css';

/* Feature Component Styles - Domain-specific components */
@import './styles/system-features.css';
@import './styles/quick-guide.css';
@import './styles/api-guide.css';
@import './styles/chat-tabs.css';
@import './styles/chat-quick-test.css';
@import './styles/chat-custom.css';
@import './styles/chat-response.css';
@import './styles/chat-curl.css';
@import './styles/models2.css';

/* UI Component Styles - Reusable UI components */
@import './styles/ui-components.css';

/* Legacy Component Styles - To be refactored */
@import './styles/components/steps.css';
@import './styles/components/guide.css';

/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### src/styles/base/theme.css

**File**: `frontend/src/styles/base/theme.css` (83 lines)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;

    /* Status colors */
    --status-success: 142 76% 36%;
    --status-info: 221 83% 53%;
    --status-warning: 45 93% 47%;
    --status-error: 0 84% 60%;
    --status-neutral: 0 0% 45%;
    --status-purple: 271 81% 56%;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    /* Status colors - dark mode */
    --status-success: 142 71% 45%;
    --status-info: 217 91% 60%;
    --status-warning: 45 93% 58%;
    --status-error: 0 72% 51%;
    --status-neutral: 0 0% 63%;
    --status-purple: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: Inter, system-ui, sans-serif;
  }
}
```

---

### src/styles/utilities/common.css

**File**: `frontend/src/styles/utilities/common.css` (127 lines)

```css
@layer utilities {
  .status-success {
    color: hsl(var(--status-success));
  }
  .status-success-dot {
    background-color: hsl(var(--status-success));
  }
  .status-info {
    color: hsl(var(--status-info));
  }
  .status-info-dot {
    background-color: hsl(var(--status-info));
  }
  .status-warning {
    color: hsl(var(--status-warning));
  }
  .status-warning-dot {
    background-color: hsl(var(--status-warning));
  }
  .status-error {
    color: hsl(var(--status-error));
  }
  .status-error-dot {
    background-color: hsl(var(--status-error));
  }
  .status-neutral {
    color: hsl(var(--status-neutral));
  }
  .status-neutral-dot {
    background-color: hsl(var(--status-neutral));
  }
  .status-purple {
    color: hsl(var(--status-purple));
  }
  .status-purple-dot {
    background-color: hsl(var(--status-purple));
  }
}

/* Page Layout */
.page-container {
  @apply w-full p-6 h-full flex flex-col;
}

/* Full-height Card */
.page-card {
  @apply flex flex-col h-full;
}

.page-card-content {
  @apply flex-1 overflow-hidden;
}

/* Icon Sizes */
.icon-sm {
  @apply h-4 w-4;
}

.icon-md {
  @apply h-5 w-5;
}

.icon-lg {
  @apply h-8 w-8;
}

.icon-sm-muted {
  @apply h-4 w-4 text-muted-foreground;
}

/* Card Title with Icon */
.card-title-with-icon {
  @apply flex items-center gap-2 text-base;
}

.card-title-with-icon-sm {
  @apply flex items-center gap-2 text-base;
}

.icon-primary {
  @apply h-4 w-4 text-primary;
}

/* Spacing Utilities */
.vspace-tight {
  @apply space-y-0.5;
}

.vspace-sm {
  @apply space-y-2;
}

.vspace-md {
  @apply space-y-4;
}

.vspace-lg {
  @apply space-y-6;
}

/* Flex Layouts */
.flex-row {
  @apply flex items-center gap-2;
}

.flex-row-between {
  @apply flex items-center justify-between;
}

.flex-row-gap-sm {
  @apply gap-2;
}

/* Typography */
.text-setting-label {
  @apply text-sm font-medium;
}

.text-setting-description {
  @apply text-xs text-muted-foreground;
}

/* Dividers */
.divider-horizontal {
  @apply h-px bg-border;
}
```

---

### src/styles/layout.css

**File**: `frontend/src/styles/layout.css` (184 lines)

```css
/**
 * Layout Component Styles
 * Styles for AppLayout, Sidebar, TitleBar, StatusBar
 */

/* ========================================
   AppLayout
   ======================================== */

.app-layout-root {
  @apply h-screen flex flex-col;
}

.app-layout-body {
  @apply flex-1 flex overflow-hidden;
}

.app-layout-main {
  @apply flex-1 overflow-auto;
}

/* ========================================
   Sidebar
   ======================================== */

.sidebar {
  @apply h-full bg-card border-r border-border flex flex-col transition-all duration-300;
}

.sidebar-collapsed {
  @apply w-12;
}

.sidebar-expanded {
  @apply w-56;
}

.sidebar-nav {
  @apply flex-1 py-2;
}

.sidebar-item {
  @apply flex items-center gap-3 px-3 py-2.5 mx-2 text-sm rounded-md transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent;
}

.sidebar-item-active {
  @apply bg-accent text-foreground font-medium;
}

.sidebar-icon {
  @apply flex-shrink-0;
}

.sidebar-label {
  @apply truncate;
}

.sidebar-toggle {
  @apply p-2 mx-2 mb-2 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground;
}

.sidebar-nav-container {
  @apply flex flex-col items-center pt-2 flex-1;
}

.sidebar-nav-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative;
}

.sidebar-nav-button-active {
  @apply text-foreground;
}

.sidebar-nav-button-inactive {
  @apply text-muted-foreground hover:text-foreground;
}

.sidebar-nav-indicator {
  @apply absolute w-0.5 h-12 bg-primary;
}

.sidebar-nav-indicator-left {
  @apply left-0;
}

.sidebar-nav-indicator-right {
  @apply right-0;
}

.sidebar-guide-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative mt-auto border-t border-border;
}

.sidebar-settings-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative mb-2;
}

/* ========================================
   TitleBar
   ======================================== */

.titlebar {
  @apply h-10 bg-background border-b border-border flex items-center justify-between;
}

.titlebar-left {
  @apply flex items-center gap-2 px-4;
}

.titlebar-icon {
  @apply h-5 w-5 text-primary;
}

.titlebar-title {
  @apply text-sm font-semibold text-foreground;
}

.titlebar-right {
  @apply flex items-center h-full;
}

.titlebar-button {
  @apply h-full w-12 flex items-center justify-center hover:bg-accent transition-colors;
}

.titlebar-button-close {
  @apply h-full w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors;
}

.titlebar-button-icon {
  @apply h-4 w-4;
}

/* ========================================
   StatusBar
   ======================================== */

.statusbar {
  @apply h-6 bg-muted border-t border-border flex items-center justify-between overflow-hidden;
  /* Dynamic padding that scales down aggressively on small screens */
  padding-left: clamp(0.25rem, 1vw, 1rem);
  padding-right: clamp(0.25rem, 1vw, 1rem);
  /* Dynamic font size using clamp - scales from 8px to 12px based on viewport */
  font-size: clamp(0.5rem, 1.5vw, 0.75rem);
}

.statusbar-left {
  @apply flex items-center flex-shrink min-w-0;
  /* Dynamic gap that scales down more aggressively on small screens */
  gap: clamp(0.25rem, 1vw, 1rem);
}

.statusbar-right {
  @apply flex items-center flex-shrink min-w-0;
  gap: clamp(0.25rem, 1vw, 1rem);
}

.statusbar-item {
  @apply flex items-center text-muted-foreground min-w-0;
  gap: clamp(0.125rem, 0.5vw, 0.375rem);
  /* Allow text to wrap on very small screens instead of truncating */
  white-space: nowrap;
}

.statusbar-item-error {
  @apply flex items-center text-destructive min-w-0;
  gap: clamp(0.125rem, 0.5vw, 0.375rem);
  white-space: nowrap;
}

.statusbar-separator {
  @apply bg-border flex-shrink-0;
  /* Dynamic separator size */
  height: clamp(0.5rem, 2vw, 0.75rem);
  width: 1px;
}

.statusbar-icon {
  @apply flex-shrink-0;
  /* Dynamic icon size */
  height: clamp(0.625rem, 2vw, 0.75rem);
  width: clamp(0.625rem, 2vw, 0.75rem);
}
```

---

### src/styles/pages.css

**File**: `frontend/src/styles/pages.css` (85 lines)

```css
/**
 * Page Component Styles
 * Styles for all page components
 */

/* ========================================
   Common Page Layout
   ======================================== */

.page-container {
  @apply w-full p-6 h-full flex flex-col;
}

.page-header {
  @apply mb-6;
}

.page-title {
  @apply text-3xl font-bold text-foreground;
}

.page-subtitle {
  @apply text-sm text-muted-foreground mt-1;
}

/* ========================================
   HomePage Specific
   ======================================== */

.home-page {
  @apply page-container;
}

/* ========================================
   SettingsPage Specific
   ======================================== */

.settings-page {
  @apply page-container;
}

.settings-section {
  @apply space-y-4;
}

.settings-section-title {
  @apply text-lg font-semibold text-foreground mb-4;
}

/* ========================================
   ChatPage Specific
   ======================================== */

.chat-page {
  @apply page-container;
}

/* ========================================
   ProvidersPage Specific
   ======================================== */

.providers-page {
  @apply page-container;
}

/* ========================================
   ModelsPage Specific
   ======================================== */

.models-page {
  @apply page-container;
}

/* ========================================
   Guide Pages
   ======================================== */

.guide-page {
  @apply page-container;
}

.guide-content {
  @apply space-y-6;
}
```

---

### src/styles/pages/providers.css

**File**: `frontend/src/styles/pages/providers.css` (66 lines)

```css
/* Providers Page */
.providers-container {
  @apply container max-w-7xl mx-auto p-6 space-y-6;
}

.providers-header {
  @apply space-y-2;
}

.providers-header-title {
  @apply text-3xl font-bold flex items-center gap-3;
}

.providers-header-subtitle {
  @apply text-muted-foreground;
}

.providers-actions {
  @apply flex items-center gap-2;
}

.providers-grid {
  @apply grid gap-4 md:grid-cols-2 lg:grid-cols-3;
}

/* Provider Card */
.provider-card {
  @apply border rounded-lg bg-card transition-all;
}

.provider-card-active {
  @apply ring-2 ring-primary shadow-sm;
}

.provider-card-header {
  @apply p-4 space-y-3;
}

.provider-card-title {
  @apply flex items-center gap-2 text-lg font-semibold;
}

.provider-card-badges {
  @apply flex items-center gap-2 flex-wrap;
}

.provider-card-description {
  @apply text-sm text-muted-foreground;
}

.provider-card-actions {
  @apply p-4 pt-0 flex flex-col gap-2;
}

.provider-card-test-result {
  @apply rounded-lg p-3 text-sm flex items-center gap-2 border;
}

.provider-card-test-success {
  @apply bg-primary/10 border-primary/20 text-foreground;
}

.provider-card-test-error {
  @apply bg-destructive/10 border-destructive/20 text-foreground;
}
```

---

### src/styles/pages/quick-guide.css

**File**: `frontend/src/styles/pages/quick-guide.css` (61 lines)

```css
/* Quick Guide Page */
.quick-guide-container {
  @apply container max-w-6xl py-8;
}

.quick-guide-header {
  @apply mb-6;
}

.quick-guide-title-row {
  @apply flex items-center gap-2 mb-2;
}

.quick-guide-title {
  @apply text-2xl font-bold;
}

.quick-guide-description {
  @apply text-muted-foreground;
}

.quick-guide-steps {
  @apply space-y-6;
}

.quick-guide-step-header {
  @apply mb-3;
}

.quick-guide-step-title {
  @apply text-lg font-semibold;
}

.quick-guide-step-description {
  @apply text-sm text-muted-foreground;
}

.quick-guide-step-cards {
  @apply space-y-4;
}

.quick-guide-success {
  @apply rounded-lg border border-primary/20 bg-primary/10 p-4;
}

.quick-guide-success-content {
  @apply flex items-center gap-2 text-primary;
}

.quick-guide-success-icon {
  @apply h-5 w-5;
}

.quick-guide-success-title {
  @apply font-semibold;
}

.quick-guide-success-message {
  @apply text-sm;
}
```

---

### src/styles/icons.css

**File**: `frontend/src/styles/icons.css` (22 lines)

```css
/* Icon size utilities */

.icon-xs {
  @apply h-3 w-3;
}

.icon-sm {
  @apply h-4 w-4;
}

.icon-md {
  @apply h-5 w-5;
}

.icon-lg {
  @apply h-8 w-8;
}

.icon-xl {
  @apply h-12 w-12;
}
```

---

### src/styles/home.css

**File**: `frontend/src/styles/home.css` (186 lines)

```css
/* HomePage styles */

.home-page-container {
  @apply container max-w-7xl py-8 space-y-6;
}

.home-header-card {
  @apply flex items-center justify-between;
}

.home-header-title {
  @apply flex items-center gap-2;
}

.home-header-description {
  @apply text-sm text-muted-foreground;
}

.home-services-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.home-service-card {
  @apply flex flex-col;
}

.home-service-header {
  @apply flex items-center justify-between;
}

.home-service-title {
  @apply flex items-center gap-2 text-base;
}

.home-service-content {
  @apply space-y-3 flex-1;
}

.home-service-row {
  @apply flex items-center justify-between;
}

.home-service-label {
  @apply text-sm text-muted-foreground;
}

.home-service-value {
  @apply text-sm font-mono;
}

.home-service-footer {
  @apply w-full;
}

.home-container {
  @apply container max-w-6xl py-8 space-y-6;
}

/* Unified Control Card */
.home-unified-content {
  @apply space-y-6;
}

.home-section {
  @apply space-y-4;
}

.home-section-header {
  @apply flex items-center justify-between;
}

.home-section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide;
}

.home-section-divider {
  @apply border-t border-border;
}

.credentials-info-section-compact {
  @apply space-y-3 text-sm;
}

.credentials-logged-out-section-compact {
  @apply space-y-3;
}

/* Status Card */
.home-status-header {
  @apply flex items-center justify-between;
}

.home-status-title {
  @apply flex items-center gap-2;
}

.home-status-content {
  @apply space-y-6;
}

.home-status-indicator {
  @apply flex items-center gap-3;
}

.home-status-badge {
  @apply flex items-center gap-2;
}

.home-status-label {
  @apply text-2xl font-bold;
}

.home-status-label-inactive {
  @apply text-2xl font-bold text-muted-foreground;
}

.home-uptime-section {
  @apply space-y-2 text-sm;
}

.home-uptime-row {
  @apply flex items-center gap-2;
}

.home-uptime-label {
  @apply text-muted-foreground;
}

.home-uptime-value {
  @apply font-medium;
}

.home-control-buttons {
  @apply flex gap-2;
}

.home-start-button {
  @apply flex items-center gap-2;
}

.home-stop-button {
  @apply flex items-center gap-2;
}

.home-button-icon-spin {
  @apply animate-spin;
}

/* Stats Cards */
.home-stats-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.home-stats-card-content {
  @apply pt-6;
}

.home-stats-card-inner {
  @apply flex flex-col items-center text-center space-y-2;
}

.home-stats-icon {
  @apply h-8 w-8 text-primary;
}

.home-stats-value {
  @apply text-3xl font-bold;
}

.home-stats-label {
  @apply text-sm text-muted-foreground;
}

/* Connection Status Badge */
.connection-status-connected {
  @apply bg-primary hover:bg-primary/90;
}

.connection-status-reconnecting {
  @apply bg-secondary hover:bg-secondary/90;
}

.connection-status-icon {
  @apply h-3 w-3 mr-1;
}
```

---

### Additional CSS Files

The following CSS files provide styles for specific features and components. For brevity, I'll list them with their line counts:

- **src/styles/providers.css** (101 lines) - Providers page styles
- **src/styles/models.css** (172 lines) - Models page styles
- **src/styles/models2.css** (126 lines) - Model components styles
- **src/styles/credentials.css** (102 lines) - Credentials section styles
- **src/styles/system-features.css** (113 lines) - System control card styles
- **src/styles/quick-guide.css** (69 lines) - Quick guide component utilities
- **src/styles/api-guide.css** (173 lines) - API guide component styles
- **src/styles/ui-components.css** (151 lines) - Reusable UI components
- **src/styles/components/steps.css** (121 lines) - Step components
- **src/styles/components/guide.css** (135 lines) - Guide components
- **src/styles/chat-tabs.css** (18 lines) - Chat tab containers
- **src/styles/chat-quick-test.css** (50 lines) - Quick test tab
- **src/styles/chat-custom.css** (38 lines) - Custom chat input
- **src/styles/chat-curl.css** (42 lines) - cURL examples tab
- **src/styles/chat-response.css** (55 lines) - Response display

All CSS files follow the same modular architecture with utility classes, component-specific styles, and responsive design patterns.

---

## Implementation Summary

### Phase 11: State Management (6 stores)
- useUIStore.ts - UI state with localStorage/electron-store persistence
- useSettingsStore.ts - Application settings
- useCredentialsStore.ts - Credentials state
- useProxyStore.ts - Proxy server state with WebSocket sync
- useLifecycleStore.ts - Application lifecycle state
- useAlertStore.ts - Toast notifications with queue management

### Phase 12: Pages (9 pages)
- HomePage.tsx - Dashboard with system overview
- ProvidersPage.tsx - Provider management
- ModelsPage.tsx - Model browsing and selection
- SettingsPage.tsx - Application settings
- ChatPage.tsx - Chat interface
- BrowserGuidePage.tsx - Chrome extension guide
- DesktopGuidePage.tsx - Desktop app guide
- ModelFormPage.tsx - Model details
- ProviderFormPage.tsx - Provider form (create/edit/view)

### Phase 13: Application Entry (2 files)
- App.tsx - Main application with routing (80 lines)
- main.tsx - React entry point (7 lines)

### Phase 14: Styling System (23+ CSS files)
- Base styles: theme.css (83 lines)
- Utilities: common.css (127 lines)
- Layout: layout.css (184 lines), pages.css (85 lines)
- Page-specific: providers.css, quick-guide.css, home.css, etc.
- Component-specific: 18 additional CSS files for features and UI components
- Main entry: index.css (50 lines)

### Key Architectural Patterns

1. **State Management**:
   - Zustand for lightweight global state
   - Persistence via localStorage (browser) or electron-store (desktop)
   - WebSocket integration for real-time updates
   - Toast queue with deduplication

2. **Page Components**:
   - Use TabCard for consistent layout
   - Business logic in page hooks
   - Content from constants files
   - Single responsibility per page

3. **Routing**:
   - State-based routing via Zustand (no React Router)
   - Simple switch-case in App.tsx
   - Support for dynamic routes (/providers/:id, /models/:id)

4. **Styling**:
   - Modular CSS architecture organized by layer
   - Tailwind CSS with custom utilities
   - Theme variables for light/dark modes
   - Component-specific stylesheets
   - Responsive design with clamp() for dynamic sizing

5. **Initialization**:
   - Dark mode setup on mount
   - WebSocket connection on mount
   - Settings loaded from backend and localStorage
   - Proper cleanup and error handling

---

**Document Version:** 2.0
**Date:** 2025-01-09
**Status:** Complete - Updated with verbatim source code
**Related Documents**:
- 01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md
- 04_FRONTEND_CODE_PHASES_1-3.md
- 05_FRONTEND_CODE_PHASES_4-5.md
- 06_FRONTEND_CODE_PHASES_6-7.md
- 07_FRONTEND_CODE_PHASES_8-10.md
- 09_FRONTEND_COMPLETE_CSS.md
