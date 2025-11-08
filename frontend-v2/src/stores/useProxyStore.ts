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
  setConnected: (connected) => set({ connected }),
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
