import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import {
  buildProviderActions,
  buildAllProvidersContent,
  buildActiveProvidersContent,
  buildSettingsContent,
  PROVIDERS_TABS,
  PROVIDERS_TITLE,
  PROVIDERS_ICON
} from '@/constants/providers.constants';

export function ProvidersPage() {
  const { handleProviderClick } = useProvidersPage();

  const providerActions = buildProviderActions({ handleProviderClick });

  const tabs = [
    {
      ...PROVIDERS_TABS.ALL,
      content: buildAllProvidersContent(providerActions)
    },
    {
      ...PROVIDERS_TABS.ACTIVE,
      content: buildActiveProvidersContent()
    },
    {
      ...PROVIDERS_TABS.SETTINGS,
      content: buildSettingsContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={PROVIDERS_TITLE}
        icon={PROVIDERS_ICON}
        tabs={tabs}
        defaultTab={PROVIDERS_TABS.ALL.value}
      />
    </div>
  );
}
