import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStore extends UIState {
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
      theme: 'light',
      sidebarPosition: 'left',
      statusMessage: 'Ready',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setSidebarPosition: (position) => set({ sidebarPosition: position }),
      toggleSidebarPosition: () =>
        set((state) => ({
          sidebarPosition: state.sidebarPosition === 'left' ? 'right' : 'left',
        })),
      setStatusMessage: (message) => set({ statusMessage: message }),
    }),
    {
      name: 'qwen-proxy-ui-state',
    }
  )
);
