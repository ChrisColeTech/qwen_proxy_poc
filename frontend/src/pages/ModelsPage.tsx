import { useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useModels } from '@/hooks/useModels';
import { ModelsStep } from '@/components/features/quick-guide/ModelsStep';

export function ModelsPage() {
  useProxyStatus();
  const { settings, providerRouterUrl, fetchSettings } = useSettingsStore();
  const { models, loading, loadModels } = useModels(providerRouterUrl);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    loadModels();
  }, [settings.active_provider]); // Reload when provider changes

  return (
    <div className="page-container">
      <ModelsStep
        models={models}
        loading={loading}
        onRefresh={loadModels}
        providerRouterUrl={providerRouterUrl}
      />
    </div>
  );
}
