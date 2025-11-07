import { useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProviders } from '@/hooks/useProviders';
import { API_BASE_URL } from '@/lib/constants';
import { ProviderSwitchStep } from '@/components/features/quick-guide/ProviderSwitchStep';

export function ProvidersPage() {
  useProxyStatus();
  const { fetchSettings } = useSettingsStore();
  const { providers, activeProvider, loading, switchProvider } = useProviders();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <div className="page-container">
      <ProviderSwitchStep
        providers={providers}
        activeProvider={activeProvider}
        loading={loading}
        onSwitch={switchProvider}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}
