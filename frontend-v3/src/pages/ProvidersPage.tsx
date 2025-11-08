import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import {
  buildProviderActions,
  buildProviderSwitchActions,
  buildProviderSwitchContent,
  buildAllProvidersContent,
  buildSettingsContent,
  PROVIDERS_TABS,
  PROVIDERS_TITLE,
  PROVIDERS_ICON
} from '@/constants/providers.constants';

export function ProvidersPage() {
  const {
    providers,
    activeProvider,
    loading,
    handleProviderSwitch,
    handleProviderClick
  } = useProvidersPage();

  const handleAddProvider = () => {
    console.log('Add provider clicked');
    // TODO: Open add provider dialog
  };

  const switchActions = buildProviderSwitchActions({
    providers,
    activeProvider,
    onSwitch: handleProviderSwitch
  });

  const providerActions = buildProviderActions({
    providers,
    handleProviderClick
  });

  const tabs = [
    {
      ...PROVIDERS_TABS.SWITCH,
      content: buildProviderSwitchContent(switchActions)
    },
    {
      ...PROVIDERS_TABS.ALL,
      content: buildAllProvidersContent({
        providerActions,
        onAddProvider: handleAddProvider
      })
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
        defaultTab={PROVIDERS_TABS.SWITCH.value}
      />
    </div>
  );
}
