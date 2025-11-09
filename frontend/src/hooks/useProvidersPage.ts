import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { providersService } from '@/services/providers.service';
import { modelsService } from '@/services/models.service';
import type { Provider } from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeProvider = (settings.active_provider as string) || '';
  const activeModel = (settings.active_model as string) || '';

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await providersService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      useAlertStore.showAlert('Failed to load providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSwitch = async (providerId: string) => {
    try {
      // Switch the provider (settings store will show success toast)
      await providersService.switchProvider(providerId);

      // After switching, check if current active_model is still available
      if (providerRouterUrl) {
        try {
          const availableModels = await modelsService.getAvailableModels(providerRouterUrl);
          const modelIds = availableModels.map(m => m.id);

          // If current active model is not in the new provider's models, select the first one
          if (activeModel && !modelIds.includes(activeModel)) {
            if (availableModels.length > 0) {
              const firstModel = availableModels[0].id;
              // Settings store will show the "Switched to model" toast
              await useSettingsStore.getState().updateSetting('active_model', firstModel);
            } else {
              useAlertStore.showAlert('No models available from new provider', 'warning');
            }
          }
        } catch (error) {
          console.error('Failed to check/update model after provider switch:', error);
          // Provider switch was successful, but couldn't fetch models from new provider
          useAlertStore.showAlert('Provider switched, but failed to fetch available models', 'warning');
        }
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      // Settings store already handles error display, don't show duplicate toast
      useAlertStore.showAlert('Failed to switch provider', 'error');
    }
  };

  const handleProviderClick = (providerId: string) => {
    console.log('Provider clicked:', providerId);
    useAlertStore.showAlert(`Selected provider: ${providerId}`, 'success');
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    activeProvider,
    loading,
    handleProviderSwitch,
    handleProviderClick,
  };
}
