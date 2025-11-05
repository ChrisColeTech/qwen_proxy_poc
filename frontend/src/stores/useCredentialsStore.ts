import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CredentialStatus, QwenCredentials } from '@/types/credentials.types';

interface CredentialsState {
  status: CredentialStatus;
  credentials: QwenCredentials | null;
  loading: boolean;
  error: string | null;
  setStatus: (status: CredentialStatus) => void;
  setCredentials: (credentials: QwenCredentials | null) => void;
  clearCredentials: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      status: {
        hasCredentials: false,
        isValid: false,
        expiresAt: undefined,
      },
      credentials: null,
      loading: false,
      error: null,
      setStatus: (status) => set({ status }),
      setCredentials: (credentials) => set({ credentials }),
      clearCredentials: () =>
        set({
          credentials: null,
          status: { hasCredentials: false, isValid: false, expiresAt: undefined },
        }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'qwen-proxy-credentials',
    }
  )
);
