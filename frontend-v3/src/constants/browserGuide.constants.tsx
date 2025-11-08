import { Globe, Chrome, CheckCircle, ArrowRight } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

export const BROWSER_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Get running in 60 seconds with the Chrome extension'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const BROWSER_GUIDE_TITLE = 'Browser Quick Start';
export const BROWSER_GUIDE_ICON = Globe;

// All Steps Combined in One Tab
export const buildBrowserGuideContent = () => {
  return (
    <div className="vspace-md">
      <p className="step-description mb-6">
        Use the Chrome extension to extract Qwen credentials and proxy requests to Qwen's API.
        The extension handles authentication automatically after you log in.
      </p>

      <ContentCard icon={Chrome} title="Step 1: Install Chrome Extension (First Time)">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Go to <span className="step-inline-code">chrome://extensions/</span> and enable "Developer mode"
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click "Load unpacked" and select the <span className="step-inline-code">/extension</span> folder
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Extension is ready - no additional configuration needed
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={CheckCircle} title="Step 2: Authenticate">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Connect to Qwen</span> to open chat.qwen.ai
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Log in with your Qwen account</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Extension auto-extracts credentials and dashboard updates in 5 seconds
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={ArrowRight} title="Step 3: Start Proxy & Use API">
        <div className="demo-header">
          <Badge variant="secondary">Ready to Use</Badge>
        </div>
        <div className="vspace-sm p-4">
          <p className="text-setting-description">
            Click <span className="step-inline-code">Start Proxy</span>, wait for Running status,
            then point your code to <span className="step-inline-code">http://localhost:3001</span>
          </p>
        </div>
      </ContentCard>
    </div>
  );
};

