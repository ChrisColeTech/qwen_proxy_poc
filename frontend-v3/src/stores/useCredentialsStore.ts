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
