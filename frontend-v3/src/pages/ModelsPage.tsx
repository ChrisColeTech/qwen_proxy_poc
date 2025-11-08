import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import {
  buildModelActions,
  buildAllModelsContent,
  buildFavoritesContent,
  buildRecentContent,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const { handleModelClick } = useModelsPage();

  const modelActions = buildModelActions({ handleModelClick });

  const tabs = [
    {
      ...MODELS_TABS.ALL,
      content: buildAllModelsContent(modelActions)
    },
    {
      ...MODELS_TABS.FAVORITES,
      content: buildFavoritesContent()
    },
    {
      ...MODELS_TABS.RECENT,
      content: buildRecentContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.ALL.value}
      />
    </div>
  );
}
