import { create } from 'zustand';
import type { ProxyStatusResponse } from '@/types';

interface ProxyStore {
  status: ProxyStatusResponse | null;
  loading: boolean;
  setStatus: (status: ProxyStatusResponse | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  status: null,
  loading: false,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
}));
