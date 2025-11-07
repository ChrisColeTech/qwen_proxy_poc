import { useState, useEffect } from 'react';
import { modelsService } from '@/services/modelsService';
import type { Model } from '@/types/quick-guide.types';

export function useModels(providerRouterUrl: string | null) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModels = async () => {
    if (!providerRouterUrl) return;

    setLoading(true);
    const fetchedModels = await modelsService.getModels(providerRouterUrl);
    setModels(fetchedModels);
    setLoading(false);
  };

  useEffect(() => {
    loadModels();
  }, [providerRouterUrl]);

  return {
    models,
    loading,
    loadModels,
  };
}
