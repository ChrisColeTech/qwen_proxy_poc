import { useState, useEffect, useMemo } from 'react';
import { modelsService } from '@/services/models.service';
import type { ParsedModel, CapabilityFilter } from '@/types/models.types';

export function useModels() {
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawModels = await modelsService.getModels();
      const parsed = rawModels.map((m) => modelsService.parseModel(m));
      setModels(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const providers = useMemo(() => {
    const uniqueProviders = new Set(models.map((m) => m.provider));
    return Array.from(uniqueProviders).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (capabilityFilter !== 'all') {
        const hasCapability = model.capabilities.some((cap) => {
          if (capabilityFilter === 'chat') return cap === 'chat';
          if (capabilityFilter === 'vision') return cap === 'vision' || cap.includes('vl');
          if (capabilityFilter === 'tool-call') return cap === 'tools' || cap === 'tool-call';
          return false;
        });
        if (!hasCapability) return false;
      }

      if (providerFilter !== 'all' && model.provider !== providerFilter) {
        return false;
      }

      return true;
    });
  }, [models, capabilityFilter, providerFilter]);

  const clearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  return {
    models: filteredModels,
    loading,
    error,
    capabilityFilter,
    providerFilter,
    providers,
    setCapabilityFilter,
    setProviderFilter,
    clearFilters,
    refresh: loadModels,
  };
}
