import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
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

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: buildBrowserGuideContent()
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
