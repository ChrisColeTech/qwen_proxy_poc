import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import type { Model } from '@/types/models.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const settings = useSettingsStore((state) => state.settings);
  const activeModel = (settings.active_model as string) || '';

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await modelsService.getModels();
      setModels(data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      useAlertStore.showAlert('Failed to load models', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    activeModel,
    loading,
    handleModelSelect,
    handleModelClick,
    fetchModels,
  };
}
