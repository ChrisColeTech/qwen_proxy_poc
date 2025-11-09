import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { modelsService } from '@/services/models.service';
import { providersService } from '@/services/providers.service';
import type { ModelDetails } from '@/types/models.types';

export function useModelFormPage() {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = decodeURIComponent(pathParts[2]);

  const [model, setModel] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingDefault, setSettingDefault] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await modelsService.getModelDetails(id);
        setModel(data);
      } catch (error) {
        console.error('Failed to load model:', error);
        setCurrentRoute('/models');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadModel();
    }
  }, [id, setCurrentRoute]);

  const handleSetAsDefault = async () => {
    if (!model || !model.providers || model.providers.length === 0) {
      useAlertStore.showAlert('No providers linked to this model', 'error');
      return;
    }

    setSettingDefault(true);
    try {
      // Set this model as default for all linked providers
      const updatePromises = model.providers.map(async (provider) => {
        try {
          await providersService.updateProviderConfig(provider.id, { defaultModel: model.id });
        } catch (error) {
          console.error(`Failed to update provider ${provider.name}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);

      useAlertStore.showAlert(
        `Set ${model.name} as default for ${model.providers.length} provider(s)`,
        'success'
      );
    } catch (error) {
      console.error('Failed to set model as default:', error);
      useAlertStore.showAlert('Failed to set model as default', 'error');
    } finally {
      setSettingDefault(false);
    }
  };

  const handleBack = () => {
    setCurrentRoute('/models');
  };

  return {
    model,
    loading,
    settingDefault,
    handleSetAsDefault,
    handleBack
  };
}
