import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useLayoutEffect } from 'react';

export type ScreenType = 'home' | 'extension-install';
export type Theme = 'light' | 'dark';
export type SidebarSide = 'left' | 'right';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarSide: SidebarSide;
  currentScreen: ScreenType;
  panelSizes: Record<string, number>;
}

interface UIStore {
  uiState: UIState;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSidebarSide: (side: SidebarSide) => void;
  toggleSidebarSide: () => void;
  setCurrentScreen: (screen: ScreenType) => void;
  setPanelSize: (panelId: string, size: number) => void;
}

const getInitialTheme = (): Theme => {
  // Check if running in browser
  if (typeof window === 'undefined') return 'light';

  // Check localStorage first
  const stored = localStorage.getItem('qwen-proxy-ui-state');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.uiState?.theme === 'light' || parsed.state?.uiState?.theme === 'dark') {
        return parsed.state.uiState.theme;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      uiState: {
        theme: getInitialTheme(),
        sidebarCollapsed: false,
        sidebarSide: 'left',
        currentScreen: 'home',
        panelSizes: {},
      },
      setTheme: (theme: Theme) => {
        set((state) => ({
          uiState: { ...state.uiState, theme },
        }));
      },
      toggleTheme: () => {
        set((state) => ({
          uiState: {
            ...state.uiState,
            theme: state.uiState.theme === 'light' ? 'dark' : 'light',
          },
        }));
      },
      setSidebarCollapsed: (collapsed: boolean) => {
        set((state) => ({
          uiState: { ...state.uiState, sidebarCollapsed: collapsed },
        }));
      },
      toggleSidebar: () => {
        set((state) => ({
          uiState: {
            ...state.uiState,
            sidebarCollapsed: !state.uiState.sidebarCollapsed,
          },
        }));
      },
      setSidebarSide: (side: SidebarSide) => {
        set((state) => ({
          uiState: { ...state.uiState, sidebarSide: side },
        }));
      },
      toggleSidebarSide: () => {
        set((state) => ({
          uiState: {
            ...state.uiState,
            sidebarSide: state.uiState.sidebarSide === 'left' ? 'right' : 'left',
          },
        }));
      },
      setCurrentScreen: (screen: ScreenType) => {
        set((state) => ({
          uiState: { ...state.uiState, currentScreen: screen },
        }));
      },
      setPanelSize: (panelId: string, size: number) => {
        set((state) => ({
          uiState: {
            ...state.uiState,
            panelSizes: { ...state.uiState.panelSizes, [panelId]: size },
          },
        }));
      },
    }),
    { name: 'qwen-proxy-ui-state' }
  )
);

// Hook to sync theme with document element
export function useThemeSync() {
  const theme = useUIStore((state) => state.uiState.theme);

  useLayoutEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);
}
