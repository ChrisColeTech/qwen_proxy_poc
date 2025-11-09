import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useProxyStore } from '@/stores/useProxyStore';
import {
  buildBrowserGuideContent,
  BROWSER_GUIDE_TABS,
  BROWSER_GUIDE_TITLE,
  BROWSER_GUIDE_ICON
} from '@/constants/browserGuide.constants';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  useBrowserGuidePage();

  const { extensionDetected } = useExtensionDetection();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: buildBrowserGuideContent({
        extensionInstalled: extensionDetected,
        credentialsValid,
        proxyRunning
      })
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={BROWSER_GUIDE_TITLE}
        icon={BROWSER_GUIDE_ICON}
        tabs={tabs}
        defaultTab={BROWSER_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
