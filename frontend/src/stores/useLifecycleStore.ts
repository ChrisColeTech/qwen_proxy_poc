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
