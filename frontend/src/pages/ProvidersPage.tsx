import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ProviderSwitchTab } from '@/components/features/providers/ProviderSwitchTab';
import { AllProvidersTab } from '@/components/features/providers/AllProvidersTab';
import { ProviderTestWrapper } from '@/components/features/providers/ProviderTestWrapper';
import {
  buildProviderActions,
  buildProviderSwitchActions,
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
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

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
    activeProvider,
    handleProviderClick: handleProviderClickNavigate,
  });

  const provider = providers.find(p => p.id === activeProvider);
  const providerName = provider?.name || 'Unknown Provider';

  const tabs = [
    {
      ...PROVIDERS_TABS.SWITCH,
      content: <ProviderSwitchTab switchActions={switchActions} />
    },
    {
      ...PROVIDERS_TABS.ALL,
      content: (
        <AllProvidersTab
          providerActions={providerActions}
          onAddProvider={handleAddProvider}
        />
      )
    },
    {
      ...PROVIDERS_TABS.TEST,
      content: (
        <ProviderTestWrapper
          activeProvider={activeProvider}
          providerName={providerName}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
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
