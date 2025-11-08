import { useState, useEffect, useMemo } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import type { Model, CapabilityFilter } from '@/types/models.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useModelsPage() {
  const [availableModels, setAvailableModels] = useState<Model[]>([]); // From Provider Router
  const [allModels, setAllModels] = useState<Model[]>([]); // From API Server
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || '';

  // Fetch available models from Provider Router
  const fetchAvailableModels = async () => {
    if (!providerRouterUrl) return;

    setLoadingAvailable(true);
    try {
      const data = await modelsService.getAvailableModels(providerRouterUrl);
      setAvailableModels(data);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      useAlertStore.showAlert('Failed to load available models', 'error');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Fetch all models from API Server
  const fetchAllModels = async () => {
    setLoadingAll(true);
    try {
      const data = await modelsService.getModels();
      setAllModels(data);
    } catch (error) {
      console.error('Failed to fetch all models:', error);
      useAlertStore.showAlert('Failed to load all models', 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  // Extract unique providers from all models
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    allModels.forEach((model) => {
      const parsed = modelsService.parseModel(model);
      providerSet.add(parsed.provider);
    });
    return Array.from(providerSet).sort();
  }, [allModels]);

  // Filter all models based on selected filters (for second tab)
  const filteredAllModels = useMemo(() => {
    return allModels.filter((model) => {
      const parsed = modelsService.parseModel(model);

      // Provider filter
      if (providerFilter !== 'all' && parsed.provider !== providerFilter) {
        return false;
      }

      // Capability filter
      if (capabilityFilter !== 'all') {
        const hasCapability = parsed.capabilities.some((cap) => {
          if (capabilityFilter === 'chat') return cap === 'chat' || cap === 'completion';
          if (capabilityFilter === 'vision') return cap === 'vision' || cap.includes('vl');
          if (capabilityFilter === 'tool-call') return cap === 'tools' || cap === 'tool-call';
          return false;
        });
        if (!hasCapability) return false;
      }

      return true;
    });
  }, [allModels, capabilityFilter, providerFilter]);

  const handleModelSelect = async (modelId: string) => {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_model', modelId);
    } catch (error) {
      console.error('Failed to select model:', error);
      useAlertStore.showAlert('Failed to select model', 'error');
    }
  };

  const handleModelClick = (modelId: string) => {
    console.log('Model clicked:', modelId);
    useAlertStore.showAlert(`Selected model: ${modelId}`, 'success');
  };

  const handleClearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([fetchAvailableModels(), fetchAllModels()]);

      // If no active model is set and we have available models, auto-select the first one
      if (!activeModel && providerRouterUrl) {
        try {
          const models = await modelsService.getAvailableModels(providerRouterUrl);
          if (models.length > 0) {
            const firstModel = models[0].id;
            await useSettingsStore.getState().updateSetting('active_model', firstModel);
            useAlertStore.showAlert(`Auto-selected default model: ${firstModel}`, 'info');
          }
        } catch (error) {
          console.error('Failed to auto-select default model:', error);
        }
      }
    };

    loadModels();
  }, [providerRouterUrl]);

  return {
    availableModels,
    allModels,
    filteredAllModels,
    activeModel,
    loadingAvailable,
    loadingAll,
    providers,
    capabilityFilter,
    providerFilter,
    handleModelSelect,
    handleModelClick,
    handleClearFilters,
    setCapabilityFilter,
    setProviderFilter,
    fetchAvailableModels,
    fetchAllModels,
  };
}
