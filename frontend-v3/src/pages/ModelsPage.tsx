import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
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
    loadingAvailable,
    loadingAll,
    providers,
    capabilityFilter,
    providerFilter,
    handleModelSelect,
    handleModelClick,
    setCapabilityFilter,
    setProviderFilter
  } = useModelsPage();

  // First tab: Available models from Provider Router
  const selectActions = buildModelSelectActions({
    models: availableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  // Second tab: All models from API Server (filtered)
  const modelActions = buildModelActions({
    models: filteredAllModels,
    handleModelClick
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: buildModelSelectContent(selectActions)
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
      />
    </div>
  );
}
