import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setStatusMessage: (message: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      uiState: {
        theme: 'dark',
      },
      statusMessage: 'Ready',
      setTheme: (theme) =>
        set((state) => ({
          uiState: { ...state.uiState, theme },
        })),
      toggleTheme: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            theme: state.uiState.theme === 'light' ? 'dark' : 'light',
          },
        })),
      setStatusMessage: (message) => set({ statusMessage: message }),
    }),
    {
      name: 'qwen-proxy-ui-state',
    }
  )
);
