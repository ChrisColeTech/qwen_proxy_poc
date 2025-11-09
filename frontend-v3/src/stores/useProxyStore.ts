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
