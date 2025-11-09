import { TabCard } from '@/components/ui/tab-card';
import { useDesktopGuidePage } from '@/hooks/useDesktopGuidePage';
import { useProxyStore } from '@/stores/useProxyStore';
import {
  buildDesktopGuideContent,
  DESKTOP_GUIDE_TABS,
  DESKTOP_GUIDE_TITLE,
  DESKTOP_GUIDE_ICON
} from '@/constants/desktopGuide.constants';

export function DesktopGuidePage() {
  useDesktopGuidePage();

  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...DESKTOP_GUIDE_TABS.GUIDE,
      content: buildDesktopGuideContent({
        credentialsValid,
        proxyRunning
      })
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={DESKTOP_GUIDE_TITLE}
        icon={DESKTOP_GUIDE_ICON}
        tabs={tabs}
        defaultTab={DESKTOP_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
