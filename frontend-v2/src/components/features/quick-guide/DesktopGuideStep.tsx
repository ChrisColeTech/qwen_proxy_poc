import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Zap, Shield, Clock, CheckCircle } from 'lucide-react';

export function DesktopGuideStep() {
  return (
    <Card className="page-card">
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Monitor className="icon-sm" />
          Desktop Quick Start - Faster Native Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="page-card-content vspace-md">
        <p className="step-description">
          The desktop app uses native Electron integration for instant credential extraction.
          No Chrome extension required - authentication happens directly in a secure browser window.
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Zap className="icon-sm-muted" />
              <span className="demo-label-text">Advantages Over Browser</span>
            </div>
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
        </div>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <CheckCircle className="icon-sm-muted" />
              <span className="demo-label-text">Authentication Steps</span>
            </div>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
