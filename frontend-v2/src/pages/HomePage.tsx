import { Activity, ChevronRight, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useHomePage } from '@/hooks/useHomePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { formatUptime, formatExpiryDate } from '@/utils/formatters';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';

export function HomePage() {
  const {
    wsProxyStatus,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { extensionDetected, needsExtension } = useExtensionDetection();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;

  // Determine badge text and variant based on lifecycle state
  const getProxyBadge = () => {
    switch (lifecycleState) {
      case 'starting':
        return { text: 'Starting...', variant: 'secondary' as const };
      case 'stopping':
        return { text: 'Stopping...', variant: 'secondary' as const };
      case 'running':
        return { text: 'Running', variant: 'default' as const };
      case 'error':
        return { text: 'Error', variant: 'destructive' as const };
      default:
        return { text: 'Stopped', variant: 'destructive' as const };
    }
  };

  // Map lifecycle state to StatusIndicator's accepted values
  const getStatusIndicatorState = (): 'running' | 'stopped' | 'invalid' => {
    switch (lifecycleState) {
      case 'starting':
      case 'running':
        return 'running'; // Green pulsing dot
      case 'error':
        return 'invalid'; // Red pulsing dot
      case 'stopping':
      case 'stopped':
      case 'idle':
      default:
        return 'stopped'; // Gray pulsing dot
    }
  };

  const proxyBadge = getProxyBadge();

  const handleProxyClick = () => {
    if (proxyLoading) return;
    if (running) {
      handleStopProxy();
    } else {
      handleStartProxy();
    }
  };

  const handleExtensionClick = () => {
    setCurrentRoute('/browser-guide');
  };

  return (
    <div className="page-container">
      <Card className="page-card">
        <CardHeader>
          <CardTitle className="card-title-with-icon-sm">
            <Activity className="icon-sm" />
            Proxy Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="page-card-content">
          <Tabs defaultValue="overview" className="tab-container">
            <TabsList className={`grid w-full ${running ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {running && <TabsTrigger value="status">System Status</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="tab-content">
              <div className="vspace-md">
                <p className="step-description">
                  Click on any row to perform the action. Follow the steps in order:
                </p>

                <div className="demo-container">
                  <div className="demo-header">
                    <div className="demo-label">
                      <Gauge className="icon-primary" />
                      <span className="demo-label-text">System Overview</span>
                    </div>
                  </div>

                  <div className="provider-switch-list">
                    {/* Step 1: Extension Status (Browser only) */}
                    {needsExtension && (
                      <div
                        className="provider-switch-item"
                        onClick={handleExtensionClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="provider-switch-info">
                          <StatusIndicator status={extensionDetected ? 'running' : 'stopped'} />
                          <div className="provider-switch-details">
                            <div className="provider-switch-name">1. Chrome Extension</div>
                            <div className="provider-switch-type">
                              {extensionDetected ? 'Ready for authentication' : 'Click to install extension'}
                            </div>
                          </div>
                        </div>
                        <div className="provider-switch-actions">
                          <Badge variant={extensionDetected ? 'default' : 'destructive'}>
                            {extensionDetected ? 'Detected' : 'Not Detected'}
                          </Badge>
                          <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Qwen Credentials */}
                    <div
                      className="provider-switch-item"
                      onClick={handleQwenLogin}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="provider-switch-info">
                        <StatusIndicator status={credentialsValid ? 'running' : 'stopped'} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">{needsExtension ? '2' : '1'}. Qwen Credentials</div>
                          <div className="provider-switch-type">
                            {credentialsValid ? `Expires ${formatExpiryDate(expiresAt ?? null)}` : 'Click to login to Qwen'}
                          </div>
                        </div>
                      </div>
                      <div className="provider-switch-actions">
                        <Badge variant={credentialsValid ? 'default' : 'destructive'}>
                          {credentialsValid ? 'Valid' : 'Invalid'}
                        </Badge>
                        <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
                      </div>
                    </div>

                    {/* Step 3: Provider Router Status */}
                    <div
                      className="provider-switch-item"
                      onClick={handleProxyClick}
                      style={{ cursor: proxyLoading ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="provider-switch-info">
                        <StatusIndicator status={getStatusIndicatorState()} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">{needsExtension ? '3' : '2'}. Provider Router</div>
                          <div className="provider-switch-type">
                            {running ? `Port ${port} • Uptime ${uptime !== undefined ? formatUptime(uptime) : 'N/A'}` : 'Click to start the proxy server'}
                          </div>
                        </div>
                      </div>
                      <div className="provider-switch-actions">
                        <Badge variant={proxyBadge.variant}>
                          {proxyBadge.text}
                        </Badge>
                        <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {running && (
              <TabsContent value="status" className="tab-content">
                <div className="vspace-md">
                  <p className="step-description">
                    Test the OpenAI-compatible endpoints exposed by the Provider Router:
                  </p>

                  <CodeBlock
                    label="Check proxy health:"
                    code={`curl http://localhost:${port || 3001}/health`}
                  />

                  <CodeBlock
                    label="List available models:"
                    code={`curl http://localhost:${port || 3001}/v1/models`}
                  />

                  <CodeBlock
                    label="Send chat completion:"
                    code={`curl http://localhost:${port || 3001}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
