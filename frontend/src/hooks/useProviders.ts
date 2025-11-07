import { useState, useEffect } from 'react';
import { providersService } from '@/services/providersService';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Provider } from '@/types/quick-guide.types';

export function useProviders() {
  const { settings, fetchSettings } = useSettingsStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    const fetchedProviders = await providersService.getProviders();
    setProviders(fetchedProviders);
    setLoading(false);
  };

  const switchProvider = async (providerId: string) => {
    await providersService.switchProvider(providerId);
    setActiveProvider(providerId);
    await fetchSettings(); // Refresh settings to update all pages
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (settings.active_provider) {
      setActiveProvider(settings.active_provider as string);
    }
  }, [settings.active_provider]);

  return {
    providers,
    activeProvider,
    loading,
    loadProviders,
    switchProvider,
  };
}
