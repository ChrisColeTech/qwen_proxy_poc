import type { Model } from '@/types/quick-guide.types';

export const modelsService = {
  getModels: async (providerRouterUrl: string): Promise<Model[]> => {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/models`);
      const data = await response.json();

      if (data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to load models:', error);
      return [];
    }
  },
};
