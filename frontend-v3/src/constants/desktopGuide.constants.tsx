import { Monitor, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

export const DESKTOP_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Faster native authentication with Electron'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const DESKTOP_GUIDE_TITLE = 'Desktop Quick Start';
export const DESKTOP_GUIDE_ICON = Monitor;

// All Steps Combined in One Tab
export const buildDesktopGuideContent = () => {
  return (
    <div className="vspace-md">
      <p className="step-description mb-6">
        The desktop app uses native Electron integration for instant credential extraction.
        No Chrome extension required - authentication happens directly in a secure browser window.
      </p>

      <ContentCard icon={Zap} title="Advantages Over Browser">
        <div className="demo-header">
          <Badge variant="secondary">Recommended</Badge>
        </div>
        <div className="guide-benefits-grid">
          <div className="guide-benefit-item">
            <Zap className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">No Extension Required</div>
              <div className="guide-benefit-description">Native Electron integration</div>
            </div>
          </div>
          <div className="guide-benefit-item">
            <Clock className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">Instant Extraction</div>
              <div className="guide-benefit-description">No polling delay</div>
            </div>
          </div>
          <div className="guide-benefit-item">
            <Shield className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">More Secure</div>
              <div className="guide-benefit-description">Credentials never leave process</div>
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={CheckCircle} title="Authentication Steps">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Connect to Qwen</span> to open secure window
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Log in at chat.qwen.ai</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Window closes automatically, credentials saved instantly</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Start Proxy</span> and point code to localhost:3001
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
};
