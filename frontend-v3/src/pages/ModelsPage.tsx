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
    models,
    activeModel,
    loading,
    handleModelSelect,
    handleModelClick
  } = useModelsPage();

  const selectActions = buildModelSelectActions({
    models,
    activeModel,
    onSelect: handleModelSelect
  });

  const modelActions = buildModelActions({ handleModelClick });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: buildModelSelectContent(selectActions)
    },
    {
      ...MODELS_TABS.ALL,
      content: buildAllModelsContent(modelActions)
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
