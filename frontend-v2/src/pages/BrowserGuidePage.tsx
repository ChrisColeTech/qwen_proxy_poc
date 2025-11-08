import { BrowserGuideStep } from '@/components/features/quick-guide/BrowserGuideStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Chrome } from 'lucide-react';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  const { extensionDetected } = useExtensionDetection();

  return (
    <div className="page-container">
      {/* Extension Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="card-title-with-icon">
            <Chrome className="icon-sm" />
            Extension Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="provider-switch-item">
            <div className="provider-switch-info">
              <StatusIndicator status={extensionDetected ? 'running' : 'stopped'} />
              <div className="provider-switch-details">
                <div className="provider-switch-name">Chrome Extension</div>
                <div className="provider-switch-type">
                  {extensionDetected ? 'Extension is installed and ready' : 'Extension not detected - follow steps below'}
                </div>
              </div>
            </div>
            <div className="provider-switch-actions">
              <Badge variant={extensionDetected ? 'default' : 'destructive'}>
                {extensionDetected ? 'Detected' : 'Not Detected'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <BrowserGuideStep />
    </div>
  );
}
