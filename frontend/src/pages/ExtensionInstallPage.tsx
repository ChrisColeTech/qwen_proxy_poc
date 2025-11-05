import { ArrowLeft, Download, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/stores/useUIStore';

export function ExtensionInstallPage() {
  const setCurrentScreen = useUIStore((state) => state.setCurrentScreen);

  return (
    <div className="extension-page">
      <Card className="extension-card">
        <CardHeader>
          <div className="extension-header-icon">
            <Chrome className="modal-icon" />
            <CardTitle className="extension-title">Browser Extension Required</CardTitle>
          </div>
          <CardDescription>
            To use Qwen Proxy in your browser, you need to install the Chrome extension
          </CardDescription>
        </CardHeader>
        <CardContent className="extension-content">
          <div className="extension-steps">
            <div className="extension-step">
              <div className="extension-step-number">
                1
              </div>
              <div className="extension-step-content">
                <h3 className="extension-step-title">Open Chrome Extensions</h3>
                <p className="extension-step-description">
                  Navigate to <code className="extension-code-inline">chrome://extensions/</code> in your Chrome browser
                </p>
              </div>
            </div>

            <div className="extension-step">
              <div className="extension-step-number">
                2
              </div>
              <div className="extension-step-content">
                <h3 className="extension-step-title">Enable Developer Mode</h3>
                <p className="extension-step-description">
                  Toggle the <strong>Developer mode</strong> switch in the top-right corner of the extensions page
                </p>
              </div>
            </div>

            <div className="extension-step">
              <div className="extension-step-number">
                3
              </div>
              <div className="extension-step-content">
                <h3 className="extension-step-title">Load Unpacked Extension</h3>
                <p className="extension-step-description">
                  Click <strong>Load unpacked</strong> and select the extension folder from your project directory
                </p>
                <code className="extension-code-block">
                  /path/to/qwen_proxy_poc/extension
                </code>
              </div>
            </div>

            <div className="extension-step">
              <div className="extension-step-number">
                4
              </div>
              <div className="extension-step-content">
                <h3 className="extension-step-title">You're Ready!</h3>
                <p className="extension-step-description">
                  The extension icon should appear in your Chrome toolbar. Return to the dashboard and click "Connect to Qwen" again.
                </p>
              </div>
            </div>
          </div>

          <div className="extension-tip">
            <div className="extension-tip-content">
              <Download className="extension-tip-icon" />
              <div>
                <h4 className="extension-tip-title">Quick Tip</h4>
                <p className="extension-tip-text">
                  After installing the extension, the extension will automatically extract your credentials when you log in to Qwen.
                  The dashboard will update within 5 seconds.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCurrentScreen('home')} variant="outline" className="w-full">
            <ArrowLeft className="icon-sm mr-2" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
