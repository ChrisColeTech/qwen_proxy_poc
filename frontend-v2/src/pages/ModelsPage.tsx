import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useModels } from '@/hooks/useModels';
import { ModelsStep } from '@/components/features/quick-guide/ModelsStep';
import { API_BASE_URL } from '@/lib/constants';

export function ModelsPage() {
  const { fetchSettings, settings, setActiveModel } = useSettingsStore();
  const {
    models,
    loading,
    error,
    capabilityFilter,
    providerFilter,
    providers,
    setCapabilityFilter,
    setProviderFilter,
    clearFilters,
    refresh,
  } = useModels();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSelectModel = async (modelId: string) => {
    await setActiveModel(modelId);
  };

  return (
    <div className="page-container">
      <ModelsStep
        models={models}
        loading={loading}
        onRefresh={refresh}
        providerRouterUrl={API_BASE_URL}
        activeModel={settings.active_model}
        onSelectModel={handleSelectModel}
        capabilityFilter={capabilityFilter}
        providerFilter={providerFilter}
        providers={providers}
        setCapabilityFilter={setCapabilityFilter}
        setProviderFilter={setProviderFilter}
        clearFilters={clearFilters}
        error={error}
      />
    </div>
  );
}
