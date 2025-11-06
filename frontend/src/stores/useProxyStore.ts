import { create } from 'zustand';
import type { ProxyStatusResponse } from '@/types';
import { proxyService } from '@/services/proxyService';

interface ProxyStore {
  status: ProxyStatusResponse | null;
  loading: boolean;
  setStatus: (status: ProxyStatusResponse | null) => void;
  setLoading: (loading: boolean) => void;
  refreshStatus: () => Promise<void>;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  status: null,
  loading: false,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  refreshStatus: async () => {
    try {
      set({ loading: true });
      const status = await proxyService.getStatus();
      set({ status });
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
