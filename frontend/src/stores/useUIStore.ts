import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setStatusMessage: (message: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      uiState: {
        theme: 'dark',
        sidebarPosition: 'left',
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
      setSidebarPosition: (position) =>
        set((state) => ({
          uiState: { ...state.uiState, sidebarPosition: position },
        })),
      toggleSidebarPosition: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            sidebarPosition: state.uiState.sidebarPosition === 'left' ? 'right' : 'left',
          },
        })),
      setStatusMessage: (message) => set({ statusMessage: message }),
    }),
    {
      name: 'qwen-proxy-ui-state',
    }
  )
);
