import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  currentRoute: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setShowStatusMessages: (show: boolean) => void;
  toggleShowStatusMessages: () => void;
  setStatusMessage: (message: string) => void;
  setCurrentRoute: (route: string) => void;
  loadSettings: () => Promise<void>;
}

function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI;
}

async function saveUIState(uiState: UIState) {
  const electron = isElectron();
  console.log('[UIStore] Saving UI state:', uiState, 'isElectron:', !!electron);
  if (electron && window.electronAPI) {
    await window.electronAPI.settings.set('uiState', uiState);
    console.log('[UIStore] Saved to electron-store');
  } else {
    localStorage.setItem('qwen-proxy-ui-state', JSON.stringify(uiState));
    console.log('[UIStore] Saved to localStorage');
  }
}

async function loadUIState(): Promise<UIState> {
  const electron = isElectron();
  const defaults: UIState = { theme: 'dark', sidebarPosition: 'left', showStatusMessages: true };

  console.log('[UIStore] Loading UI state, isElectron:', !!electron);
  if (electron && window.electronAPI) {
    const stored = await window.electronAPI.settings.get('uiState') as UIState | null;
    console.log('[UIStore] Loaded from electron-store:', stored);
    return stored ? { ...defaults, ...stored } : defaults;
  } else {
    try {
      const stored = localStorage.getItem('qwen-proxy-ui-state');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[UIStore] Loaded from localStorage:', parsed);
        // Support both new format (direct UIState) and legacy format (nested)
        const uiState = parsed.state?.uiState || parsed;
        // Validate the loaded state has required properties
        if (uiState.theme && uiState.sidebarPosition) {
          return { ...defaults, ...uiState };
        }
      }
    } catch (e) {
      console.error('[UIStore] Failed to load UI state from localStorage:', e);
    }
    console.log('[UIStore] No stored state, using defaults');
    return defaults;
  }
}

export const useUIStore = create<UIStore>((set, get) => ({
  uiState: {
    theme: 'dark',
    sidebarPosition: 'left',
    showStatusMessages: true,
  },
  statusMessage: 'Ready',
  currentRoute: '/',
  setTheme: async (theme) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, theme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleTheme: async () => {
    const currentState = get().uiState;
    const newTheme: 'light' | 'dark' = currentState.theme === 'light' ? 'dark' : 'light';
    const newState: UIState = { ...currentState, theme: newTheme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setSidebarPosition: async (position) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, sidebarPosition: position };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleSidebarPosition: async () => {
    const currentState = get().uiState;
    const newPosition: 'left' | 'right' = currentState.sidebarPosition === 'left' ? 'right' : 'left';
    const newState: UIState = { ...currentState, sidebarPosition: newPosition };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setShowStatusMessages: async (show) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, showStatusMessages: show };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  toggleShowStatusMessages: async () => {
    const currentState = get().uiState;
    const newValue = !currentState.showStatusMessages;
    const newState: UIState = { ...currentState, showStatusMessages: newValue };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages toggle:', error);
      // Rollback on error
      set({ uiState: currentState });
    }
  },
  setStatusMessage: (message) => set({ statusMessage: message }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  loadSettings: async () => {
    try {
      const uiState = await loadUIState();
      console.log('[UIStore] Settings loaded successfully:', uiState);
      set({ uiState });
    } catch (error) {
      console.error('[UIStore] Failed to load settings:', error);
    }
  },
}));
