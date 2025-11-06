import { create } from 'zustand';
import { apiService } from '@/services/api.service';

interface Settings {
  'server.port'?: string;
  'server.host'?: string;
  active_provider?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SettingsStore {
  settings: Settings;
  loading: boolean;
  providerRouterUrl: string;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  loading: false,
  providerRouterUrl: '',

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const result = await apiService.getSettings();
      if (result.success && result.data) {
        const port = result.data['server.port'] || '3001';
        const host = result.data['server.host'] || 'localhost';
        const providerRouterUrl = `http://${host}:${port}`;
        set({ settings: result.data, providerRouterUrl });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ providerRouterUrl: 'http://localhost:3001' });
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: async (key: string, value: string) => {
    try {
      await apiService.updateSetting(key, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }));
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }
}));
