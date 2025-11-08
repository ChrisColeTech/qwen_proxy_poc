import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Chrome, CheckCircle, ArrowRight } from 'lucide-react';

export function BrowserGuideStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Globe className="icon-sm" />
          Browser Quick Start - Get Running in 60 Seconds
        </CardTitle>
      </CardHeader>
      <CardContent className="vspace-md">
        <p className="step-description">
          Use the Chrome extension to extract Qwen credentials and proxy requests to Qwen's API.
          The extension handles authentication automatically after you log in.
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Chrome className="icon-sm-muted" />
              <span className="demo-label-text">Step 1: Install Chrome Extension (First Time)</span>
            </div>
          </div>
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
        </div>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <CheckCircle className="icon-sm-muted" />
              <span className="demo-label-text">Step 2: Authenticate</span>
            </div>
          </div>
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
        </div>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <ArrowRight className="icon-sm-muted" />
              <span className="demo-label-text">Step 3: Start Proxy & Use API</span>
            </div>
            <Badge variant="secondary">Ready to Use</Badge>
          </div>
          <div className="vspace-sm">
            <p className="text-setting-description">
              Click <span className="step-inline-code">Start Proxy</span>, wait for Running status,
              then point your code to <span className="step-inline-code">http://localhost:3001</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
