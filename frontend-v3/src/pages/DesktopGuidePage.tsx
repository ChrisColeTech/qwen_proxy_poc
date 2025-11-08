import { TabCard } from '@/components/ui/tab-card';
import { useDesktopGuidePage } from '@/hooks/useDesktopGuidePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import { useProxyStore } from '@/stores/useProxyStore';
import {
  buildDesktopGuideContent,
  DESKTOP_GUIDE_TABS,
  DESKTOP_GUIDE_TITLE,
  DESKTOP_GUIDE_ICON
} from '@/constants/desktopGuide.constants';
import { buildApiGuideContent } from '@/constants/apiGuide.constants';

export function DesktopGuidePage() {
  useDesktopGuidePage();
  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);

  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...DESKTOP_GUIDE_TABS.GUIDE,
      content: buildDesktopGuideContent()
    },
    {
      ...DESKTOP_GUIDE_TABS.API_EXAMPLES,
      content: buildApiGuideContent({ baseUrl, copiedUrl, handleCopyUrl }),
      hidden: !proxyRunning
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
