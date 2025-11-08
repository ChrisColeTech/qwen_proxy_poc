import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import { useUIStore } from '@/stores/useUIStore';
import {
  buildModelActions,
  buildModelSelectActions,
  buildModelSelectContent,
  buildAllModelsContent,
  buildFavoritesContent,
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

  const handleModelClickNavigate = (modelId: string) => {
    // Navigate to model details page
    setCurrentRoute(`/models/${encodeURIComponent(modelId)}`);
  };

  // First tab: Available models from Provider Router
  const selectActions = buildModelSelectActions({
    models: availableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  // Second tab: All models from API Server (filtered)
  const modelActions = buildModelActions({
    models: filteredAllModels,
    handleModelClick: handleModelClickNavigate
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: buildModelSelectContent({
        selectActions,
        activeProvider,
        providers: providersData,
        onProviderChange: handleProviderSwitch
      })
    },
    {
      ...MODELS_TABS.ALL,
      content: buildAllModelsContent({
        modelActions,
        capabilityFilter,
        providerFilter,
        providers,
        onCapabilityChange: setCapabilityFilter,
        onProviderChange: setProviderFilter
      })
    },
    {
      ...MODELS_TABS.FAVORITES,
      content: buildFavoritesContent()
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
