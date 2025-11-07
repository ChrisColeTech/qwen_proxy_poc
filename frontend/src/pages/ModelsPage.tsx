import { useState, useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ModelsStep } from '@/components/features/quick-guide/ModelsStep';
import type { Model } from '@/types/quick-guide.types';

export function ModelsPage() {
  useProxyStatus();
  const { settings, providerRouterUrl, fetchSettings } = useSettingsStore();
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (providerRouterUrl) {
      loadModels();
    }
  }, [providerRouterUrl, settings.active_provider]); // Reload when provider changes

  const loadModels = async () => {
    if (!providerRouterUrl) return;
    setLoadingModels(true);
    try {
      const response = await fetch(`${providerRouterUrl}/v1/models`);
      const data = await response.json();
      if (data.data) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div className="page-container">
      <ModelsStep
        models={models}
        loading={loadingModels}
        onRefresh={loadModels}
        providerRouterUrl={providerRouterUrl}
      />
    </div>
  );
}
