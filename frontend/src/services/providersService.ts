import type { Provider } from '@/types/quick-guide.types';
import { apiService } from '@/services/api.service';

export const providersService = {
  getProviders: async (): Promise<Provider[]> => {
    try {
      const result = await apiService.getProviders();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to load providers:', error);
      return [];
    }
  },

  switchProvider: async (providerId: string): Promise<void> => {
    try {
      await apiService.updateSetting('active_provider', providerId);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  },
};
