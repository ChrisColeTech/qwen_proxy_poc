import { create } from 'zustand';
import type { ProxyStatusResponse, ProxyStatusEvent, CredentialsUpdatedEvent, ProvidersUpdatedEvent, ModelsUpdatedEvent } from '@/types';

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
  updateFromProxyStatus: (event) => set({
    wsProxyStatus: event.status,
    lastUpdate: Date.now()
  }),
  updateFromCredentials: (event) => set((state) => {
    if (!state.wsProxyStatus) return state;
    return {
      wsProxyStatus: {
        ...state.wsProxyStatus,
        credentials: event.credentials,
      },
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
}));
