import { Activity, ChevronRight, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useHomePage } from '@/hooks/useHomePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { ConnectionStatusBadge } from '@/components/features/home/ConnectionStatusBadge';
import { formatUptime, formatExpiryDate } from '@/utils/formatters';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { useUIStore } from '@/stores/useUIStore';

export function HomePage() {
  const {
    wsProxyStatus,
    connected,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { extensionDetected, needsExtension } = useExtensionDetection();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;

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
      <Card>
        <CardHeader>
          <CardTitle className="card-title-with-icon-sm">
            <Activity className="icon-sm" />
            Proxy Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <ConnectionStatusBadge status={connected ? 'connected' : 'disconnected'} />
                  </div>

                  <div className="provider-switch-list">
                    {/* Step 1: Provider Router Status */}
                    <div
                      className="provider-switch-item"
                      onClick={handleProxyClick}
                      style={{ cursor: proxyLoading ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="provider-switch-info">
                        <StatusIndicator status={running ? 'running' : 'stopped'} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">1. Provider Router</div>
                          <div className="provider-switch-type">
                            {running ? `Port ${port} • Uptime ${uptime !== undefined ? formatUptime(uptime) : 'N/A'}` : 'Click to start the proxy server'}
                          </div>
                        </div>
                      </div>
                      <div className="provider-switch-actions">
                        <Badge variant={running ? 'default' : 'destructive'}>
                          {running ? 'Running' : 'Stopped'}
                        </Badge>
                        <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
                      </div>
                    </div>

                    {/* Step 2: Extension Status (Browser only) */}
                    {needsExtension && (
                      <div
                        className="provider-switch-item"
                        onClick={handleExtensionClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="provider-switch-info">
                          <StatusIndicator status={extensionDetected ? 'running' : 'stopped'} />
                          <div className="provider-switch-details">
                            <div className="provider-switch-name">2. Chrome Extension</div>
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

                    {/* Step 3: Credentials Status */}
                    <div
                      className="provider-switch-item"
                      onClick={handleQwenLogin}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="provider-switch-info">
                        <StatusIndicator status={credentialsValid ? 'running' : 'stopped'} />
                        <div className="provider-switch-details">
                          <div className="provider-switch-name">{needsExtension ? '3' : '2'}. Qwen Credentials</div>
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
