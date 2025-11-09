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
    <ContentCard icon={Globe} title="Browser Quick Start Guide">
      <div className="vspace-md p-4">
        <p className="step-description mb-6">
          Use the Chrome extension to extract Qwen credentials and proxy requests to Qwen's API.
          The extension handles authentication automatically after you log in.
        </p>

        <div className="divider-horizontal" />

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label flex items-center gap-2">
            <Chrome className="h-4 w-4" />
            Step 1: Install Chrome Extension (First Time)
          </div>
          <div className="guide-step-list mt-3">
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
        </div>
      </div>

      <div className="divider-horizontal" />

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Step 2: Authenticate
          </div>
          <div className="guide-step-list mt-3">
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
        </div>
      </div>

      <div className="divider-horizontal" />

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Step 3: Start Proxy & Use API
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">Ready to Use</Badge>
          </div>
          <p className="text-setting-description mt-3">
            Click <span className="step-inline-code">Start Proxy</span>, wait for Running status,
            then point your code to <span className="step-inline-code">http://localhost:3001</span>
          </p>
        </div>
      </div>
      </div>
    </ContentCard>
  );
};

