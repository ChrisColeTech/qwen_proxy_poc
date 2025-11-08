import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import { useUIStore } from '@/stores/useUIStore';
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
    handleProviderSwitch
  } = useProvidersPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  const handleProviderClickNavigate = (providerId: string) => {
    // Navigate to provider details page
    setCurrentRoute(`/providers/${providerId}`);
  };

  const handleAddProvider = () => {
    // Navigate to create provider page
    setCurrentRoute('/providers/new');
  };

  const switchActions = buildProviderSwitchActions({
    providers,
    activeProvider,
    onSwitch: handleProviderSwitch
  });

  const providerActions = buildProviderActions({
    providers,
    handleProviderClick: handleProviderClickNavigate
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
        pageKey="/providers"
      />
    </div>
  );
}
