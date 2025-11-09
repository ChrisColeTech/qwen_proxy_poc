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
    filteredAvailableModels,
    filteredAllModels,
    activeModel,
    activeProvider,
    providersData,
    providers,
    capabilityFilter,
    providerFilter,
    searchQuery,
    allModelsSearchQuery,
    handleModelSelect,
    handleProviderSwitch,
    setCapabilityFilter,
    setProviderFilter,
    setSearchQuery,
    setAllModelsSearchQuery
  } = useModelsPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleModelClickNavigate = (modelId: string) => {
    // Navigate to model details page
    setCurrentRoute(`/models/${encodeURIComponent(modelId)}`);
  };

  // Build action items for tabs
  const selectActions = buildModelSelectActions({
    models: filteredAvailableModels,
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
          searchQuery={searchQuery}
          onProviderChange={handleProviderSwitch}
          onSearchChange={setSearchQuery}
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
          searchQuery={allModelsSearchQuery}
          onCapabilityChange={setCapabilityFilter}
          onProviderChange={setProviderFilter}
          onSearchChange={setAllModelsSearchQuery}
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
