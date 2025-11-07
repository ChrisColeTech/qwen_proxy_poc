import { useState, useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { apiService } from '@/services/api.service';
import { API_BASE_URL } from '@/lib/constants';
import { ProviderSwitchStep } from '@/components/features/quick-guide/ProviderSwitchStep';
import type { Provider } from '@/types/quick-guide.types';

export function ProvidersPage() {
  useProxyStatus();
  const { settings, fetchSettings } = useSettingsStore();
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    fetchSettings();
    loadProviders();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings.active_provider) {
      setActiveProvider(settings.active_provider as string);
    }
  }, [settings.active_provider]);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const result = await apiService.getProviders();
      if (result.success && result.data) {
        setProviders(result.data);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSwitchProvider = async (providerId: string) => {
    try {
      await apiService.updateSetting('active_provider', providerId);
      setActiveProvider(providerId);
      await fetchSettings(); // Refresh settings to update all pages
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  return (
    <div className="page-container">
      <ProviderSwitchStep
        providers={providers}
        activeProvider={activeProvider}
        loading={loadingProviders}
        onSwitch={handleSwitchProvider}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}
