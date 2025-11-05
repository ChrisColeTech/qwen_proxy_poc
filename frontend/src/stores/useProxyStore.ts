import { create } from 'zustand';
import type { ProxyStatus } from '@/types/proxy.types';

interface ProxyState {
  status: ProxyStatus;
  loading: boolean;
  error: string | null;
  setStatus: (status: ProxyStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProxyStore = create<ProxyState>()((set) => ({
  status: {
    isRunning: false,
    port: undefined,
    startedAt: undefined,
  },
  loading: false,
  error: null,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
