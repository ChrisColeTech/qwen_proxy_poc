import { Activity } from 'lucide-react';
import { TabCard } from '@/components/ui/tab-card';
import { ActionList } from '@/components/ui/action-list';
import { useHomePage } from '@/hooks/useHomePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import {
  buildOverviewActions,
  buildStatusTabContent,
  HOME_TABS,
  HOME_TITLE,
  SYSTEM_OVERVIEW_TITLE,
  SYSTEM_OVERVIEW_ICON
} from '@/constants/home.constants';

export function HomePage() {
  const {
    wsProxyStatus,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();
  const { extensionDetected, needsExtension } = useExtensionDetection();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;

  const handleProxyClick = () => {
    if (proxyLoading) return;
    if (running) {
      handleStopProxy();
    } else {
      handleStartProxy();
    }
  };

  const handleExtensionClick = () => {
    setCurrentRoute('/browser-guide');
  };

  const overviewActions = buildOverviewActions({
    extensionDetected,
    needsExtension,
    credentialsValid,
    expiresAt,
    running,
    port,
    uptime,
    lifecycleState,
    proxyLoading,
    handleExtensionClick,
    handleQwenLogin,
    handleProxyClick
  });

  const tabs = [
    {
      ...HOME_TABS.OVERVIEW,
      content: <ActionList title={SYSTEM_OVERVIEW_TITLE} icon={SYSTEM_OVERVIEW_ICON} items={overviewActions} />
    },
    {
      ...HOME_TABS.STATUS,
      content: buildStatusTabContent(port, baseUrl, copiedUrl, handleCopyUrl),
      hidden: !running
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={HOME_TITLE}
        icon={Activity}
        tabs={tabs}
        defaultTab={HOME_TABS.OVERVIEW.value}
      />
    </div>
  );
}
