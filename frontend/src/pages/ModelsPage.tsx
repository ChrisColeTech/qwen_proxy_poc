import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { AllModelsTab } from '@/components/features/models/AllModelsTab';
import { ModelTestWrapper } from '@/components/features/models/ModelTestWrapper';
import {
  buildModelActions,
  buildModelSelectActions,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const {
    availableModels,
    filteredAllModels,
    activeModel,
    activeProvider,
    providersData,
    providers,
    capabilityFilter,
    providerFilter,
    handleModelSelect,
    handleProviderSwitch,
    setCapabilityFilter,
    setProviderFilter
  } = useModelsPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleModelClickNavigate = (modelId: string) => {
    // Navigate to model details page
    setCurrentRoute(`/models/${encodeURIComponent(modelId)}`);
  };

  // Build action items for tabs
  const selectActions = buildModelSelectActions({
    models: availableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  const modelActions = buildModelActions({
    models: filteredAllModels,
    activeModel,
    handleModelClick: handleModelClickNavigate,
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: (
        <ModelSelectTab
          selectActions={selectActions}
          activeProvider={activeProvider}
          providers={providersData}
          onProviderChange={handleProviderSwitch}
        />
      )
    },
    {
      ...MODELS_TABS.ALL,
      content: (
        <AllModelsTab
          modelActions={modelActions}
          capabilityFilter={capabilityFilter}
          providerFilter={providerFilter}
          providers={providers}
          onCapabilityChange={setCapabilityFilter}
          onProviderChange={setProviderFilter}
        />
      )
    },
    {
      ...MODELS_TABS.TEST,
      content: (
        <ModelTestWrapper
          activeModel={activeModel}
          activeProvider={activeProvider}
          providers={providersData}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.SELECT.value}
        pageKey="/models"
      />
    </div>
  );
}
