import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';
import { providersService } from '@/services/providers.service';
import type { Provider } from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const settings = useSettingsStore((state) => state.settings);
  const activeProvider = (settings.active_provider as string) || '';

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
      await providersService.switchProvider(providerId);
      // Note: switchProvider already updates the settings store via apiService.setActiveProvider()
      // No need to fetch settings again - the store will update automatically
    } catch (error) {
      console.error('Failed to switch provider:', error);
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
