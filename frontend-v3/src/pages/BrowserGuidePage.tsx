import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import {
  buildBrowserGuideContent,
  BROWSER_GUIDE_TABS,
  BROWSER_GUIDE_TITLE,
  BROWSER_GUIDE_ICON
} from '@/constants/browserGuide.constants';
import { buildApiGuideContent } from '@/constants/apiGuide.constants';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  useBrowserGuidePage();
  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: buildBrowserGuideContent()
    },
    {
      ...BROWSER_GUIDE_TABS.API_EXAMPLES,
      content: buildApiGuideContent({ baseUrl, copiedUrl, handleCopyUrl })
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
