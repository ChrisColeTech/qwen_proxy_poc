import { useState, useEffect, useCallback } from 'react';
import { modelsService } from '@/services/modelsService';
import type { Model } from '@/types/quick-guide.types';

export function useModels(providerRouterUrl: string | null) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModels = useCallback(async () => {
    if (!providerRouterUrl) return;

    setLoading(true);
    const fetchedModels = await modelsService.getModels(providerRouterUrl);
    setModels(fetchedModels);
    setLoading(false);
  }, [providerRouterUrl]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    loading,
    loadModels,
  };
}
